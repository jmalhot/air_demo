import {
  Behavior,
  GoogleGenAI,
  Modality,
  Type,
  type LiveServerMessage,
  type Session,
} from '@google/genai';
import { createBlobFromInt16, PcmPlayer } from './pcm';
import { captureVideoJpeg, getInterviewMedia } from './camera';
import { END_INTERVIEW_MIN_ELAPSED_RATIO } from '../shared/options';

export type SessionPayload = {
  token: string;
  model: string;
  systemInstruction: string;
  voiceName: string;
  language: string;
  minutes: number;
  avatarName: string;
};

function remainingMmss(deadline: number): string {
  const left = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  const m = Math.floor(left / 60);
  const s = left % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export class LiveInterview {
  private session: Session | null = null;
  private active = false;
  private player = new PcmPlayer();
  private inputCtx: AudioContext | null = null;
  private worklet: AudioWorkletNode | null = null;
  private mediaStream: MediaStream | null = null;
  private startedAt = 0;
  private durationMs = 0;
  private lines: Array<{ role: 'ai' | 'you'; text: string }> = [];
  private openRole: 'ai' | 'you' | null = null;
  private wrapUpCued = false;
  private frameTimer = 0;

  constructor(
    private readonly selfVideoEl: HTMLVideoElement,
    private readonly voiceStageEl: HTMLElement,
    private readonly statusEl: HTMLElement,
    private readonly transcriptEl: HTMLElement,
    private readonly onEnded: (reason: string) => void,
  ) {}

  private get deadline(): number {
    return this.startedAt + this.durationMs;
  }

  async start(payload: SessionPayload): Promise<void> {
    this.startedAt = Date.now();
    this.durationMs = payload.minutes * 60 * 1000;
    this.lines = [];
    this.openRole = null;
    this.wrapUpCued = false;
    this.transcriptEl.replaceChildren();
    await this.player.resume();
    const media = await getInterviewMedia();
    this.mediaStream = media.stream;
    this.attachSelfView(media.hasVideo);
    this.inputCtx = new AudioContext({ sampleRate: 16000 });
    await this.inputCtx.resume();

    const client = new GoogleGenAI({ apiKey: payload.token, apiVersion: 'v1alpha' });

    this.session = await client.live.connect({
      model: payload.model,
      callbacks: {
        onopen: () => {
          this.active = true;
          this.statusEl.textContent = 'Listening';
        },
        onmessage: async (message: LiveServerMessage) => {
          await this.handleMessage(message);
        },
        onerror: (e) => {
          console.error('[AIR_DEMO] session error', e.message);
        },
        onclose: (e) => {
          const wasActive = this.active;
          this.active = false;
          if (!wasActive) return;
          const reason = (e.reason || '').trim();
          this.onEnded(reason || 'Session ended');
        },
      },
      config: {
        systemInstruction: payload.systemInstruction,
        maxOutputTokens: 8192,
        temperature: 0.5,
        topP: 0.9,
        topK: 40,
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voiceName } },
          languageCode: payload.language,
        },
        tools: this.buildTools(),
        outputAudioTranscription: {},
        inputAudioTranscription: {},
        historyConfig: { initialHistoryInClientContent: true },
        realtimeInputConfig: {
          automaticActivityDetection: { disabled: false },
        },
        contextWindowCompression: { slidingWindow: {} },
      } as never,
    });

    await this.setupMic();
    if (media.hasVideo) this.setupVideoFrames();
    setTimeout(() => {
      if (!this.session || !this.active) return;
      this.session.sendClientContent({
        turns: [
          {
            role: 'user',
            parts: [{ text: 'The candidate is ready. Greet them briefly and ask your first question.' }],
          },
        ],
        turnComplete: true,
      });
    }, 400);
  }

  remainingLabel(): string {
    return remainingMmss(this.deadline);
  }

  isExpired(): boolean {
    return Date.now() >= this.deadline;
  }

  cueWrapUpIfDue(): void {
    if (!this.active || this.wrapUpCued || !this.session) return;
    const elapsed = Date.now() - this.startedAt;
    if (elapsed < this.durationMs * END_INTERVIEW_MIN_ELAPSED_RATIO) return;
    if (elapsed >= this.durationMs) return;
    this.wrapUpCued = true;
    try {
      this.session.sendRealtimeInput({
        text:
          `[SYSTEM] ${Math.round(END_INTERVIEW_MIN_ELAPSED_RATIO * 100)}% of the interview time has elapsed. You may now wrap up. Finish before time reaches zero. Do not mention this message.`,
      });
    } catch {
      /* socket closed */
    }
  }

  stop(): void {
    this.active = false;
    window.clearInterval(this.frameTimer);
    this.frameTimer = 0;
    this.selfVideoEl.srcObject = null;
    this.selfVideoEl.classList.add('hidden');
    this.voiceStageEl.classList.remove('hidden');
    this.player.stop();
    this.worklet?.disconnect();
    this.worklet = null;
    void this.inputCtx?.close();
    this.inputCtx = null;
    this.mediaStream?.getTracks().forEach((t) => t.stop());
    this.mediaStream = null;
    this.session?.close();
    this.session = null;
  }

  private buildTools() {
    const functionDeclarations = [
      {
        name: 'get_remaining_time',
        description: 'Returns remaining interview time as MM:SS.',
        behavior: Behavior.BLOCKING,
      },
      {
        name: 'end_interview',
        description:
          `REQUESTS permission to end. Call this BEFORE saying goodbye. The system rejects requests before ${Math.round(END_INTERVIEW_MIN_ELAPSED_RATIO * 100)}% of the configured duration unless the candidate asked to stop. If rejected, continue interviewing and do not mention the rejection.`,
        parameters: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING },
          },
        },
        behavior: Behavior.BLOCKING,
      },
    ];
    return [{ functionDeclarations }];
  }

  private async setupMic(): Promise<void> {
    if (!this.inputCtx || !this.mediaStream || !this.session) return;
    await this.inputCtx.audioWorklet.addModule('/capture.worklet.js');
    const source = this.inputCtx.createMediaStreamSource(this.mediaStream);
    this.worklet = new AudioWorkletNode(this.inputCtx, 'capture-processor');
    this.worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
      if (!this.active || !this.session) return;
      const int16 = new Int16Array(event.data);
      try {
        this.session.sendRealtimeInput({ audio: createBlobFromInt16(int16) });
      } catch {
        /* socket closed */
      }
    };
    source.connect(this.worklet);
  }

  private attachSelfView(hasVideo: boolean): void {
    if (!hasVideo || !this.mediaStream) {
      this.selfVideoEl.classList.add('hidden');
      this.voiceStageEl.classList.remove('hidden');
      return;
    }
    this.selfVideoEl.srcObject = this.mediaStream;
    this.selfVideoEl.muted = true;
    this.selfVideoEl.classList.remove('hidden');
    this.voiceStageEl.classList.add('hidden');
    void this.selfVideoEl.play().catch(() => {
      /* autoplay can wait for user gesture; stream is still captured */
    });
  }

  private setupVideoFrames(): void {
    window.clearInterval(this.frameTimer);
    this.frameTimer = window.setInterval(() => {
      if (!this.active || !this.session) return;
      const frame = captureVideoJpeg(this.selfVideoEl);
      if (!frame) return;
      try {
        this.session.sendRealtimeInput({ video: frame });
      } catch {
        /* socket closed */
      }
    }, 700);
  }

  transcriptHtml(): string {
    return this.transcriptEl.innerHTML;
  }

  private appendCaption(role: 'ai' | 'you', chunk: string): void {
    if (this.openRole !== role) {
      this.lines.push({ role, text: chunk });
      this.openRole = role;
    } else {
      this.lines[this.lines.length - 1].text += chunk;
    }
    this.renderTranscript();
  }

  private renderTranscript(): void {
    this.transcriptEl.replaceChildren();
    for (const line of this.lines) {
      if (!line.text.trim()) continue;
      const row = document.createElement('div');
      row.className = `t-row ${line.role === 'you' ? 'you' : 'ai'}`;
      const who = document.createElement('span');
      who.className = 't-who';
      who.textContent = line.role === 'ai' ? 'AIR: ' : 'You: ';
      row.append(who, document.createTextNode(line.text.trim()));
      this.transcriptEl.append(row);
    }
    this.transcriptEl.scrollTop = this.transcriptEl.scrollHeight;
  }

  private async handleMessage(message: LiveServerMessage): Promise<void> {
    if (message.toolCall) this.handleTools(message.toolCall);
    const parts = message.serverContent?.modelTurn?.parts ?? [];
    if (parts.length) this.statusEl.textContent = 'AIR speaking';
    const out = message.serverContent?.outputTranscription?.text;
    if (out) this.appendCaption('ai', out);
    const inn = message.serverContent?.inputTranscription?.text;
    if (inn) this.appendCaption('you', inn);
    if (message.serverContent?.turnComplete) {
      this.statusEl.textContent = 'Listening';
      this.openRole = null;
    }
    for (const part of parts) {
      const inline = part.inlineData;
      if (!inline?.data) continue;
      const mime = inline.mimeType ?? '';
      if (mime.startsWith('audio/')) {
        await this.player.play(inline.data);
      }
    }
  }

  private handleTools(toolCall: NonNullable<LiveServerMessage['toolCall']>): void {
    if (!this.session) return;
    const functionResponses: Array<{ id?: string; name?: string; response: Record<string, unknown> }> = [];
    let endApproved = false;
    const elapsed = Date.now() - this.startedAt;
    const remaining = remainingMmss(this.deadline);

    for (const fc of toolCall.functionCalls ?? []) {
      if (fc.name === 'get_remaining_time') {
        functionResponses.push({ id: fc.id, name: fc.name, response: { remaining_time: remaining } });
      } else if (fc.name === 'end_interview') {
        const reason = typeof fc.args?.reason === 'string' ? fc.args.reason : '';
        const elapsedRatio = this.durationMs > 0 ? elapsed / this.durationMs : 0;
        const approved =
          this.isExpired() ||
          reason === 'candidate_requested' ||
          elapsedRatio >= END_INTERVIEW_MIN_ELAPSED_RATIO;
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: approved
            ? {
                status: 'approved',
                remaining_time: remaining,
                instruction:
                  'Approved. Deliver a brief closing statement and goodbye. Do not exceed the remaining time.',
              }
            : {
                status: 'rejected',
                reason: 'too_early',
                remaining_time: remaining,
                elapsed_percent: Math.round(elapsedRatio * 100),
                minimum_elapsed_percent: Math.round(END_INTERVIEW_MIN_ELAPSED_RATIO * 100),
                instruction:
                  'The interview is NOT over. Do not say goodbye. Do not mention this to the candidate. Ask your next question.',
              },
        });
        if (approved) endApproved = true;
      } else {
        functionResponses.push({
          id: fc.id,
          name: fc.name,
          response: {
            status: 'unknown_function',
            message: 'Only get_remaining_time and end_interview exist. Keep speaking to the candidate.',
          },
        });
      }
    }

    if (functionResponses.length > 0) {
      (this.session as Session & { sendToolResponse: (payload: unknown) => void }).sendToolResponse({
        functionResponses,
      });
    }
    if (endApproved) {
      setTimeout(() => this.onEnded('Interview complete'), 4000);
    }
  }
}
