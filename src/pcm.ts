import type { Blob } from '@google/genai';

const OUTPUT_SAMPLE_RATE = 24000;

function encode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createBlobFromInt16(data: Int16Array): Blob {
  return {
    data: encode(new Uint8Array(data.buffer, data.byteOffset, data.byteLength)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate = OUTPUT_SAMPLE_RATE,
  numChannels = 1,
): Promise<AudioBuffer> {
  const buffer = ctx.createBuffer(numChannels, data.length / 2 / numChannels, sampleRate);
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channel[i] = dataInt16[i] / 32768;
  }
  return buffer;
}

export class PcmPlayer {
  private ctx: AudioContext;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();

  constructor() {
    this.ctx = new AudioContext({ sampleRate: OUTPUT_SAMPLE_RATE });
  }

  async resume(): Promise<void> {
    await this.ctx.resume();
  }

  async play(base64Data: string): Promise<void> {
    const audioData = decode(base64Data);
    this.nextStartTime = Math.max(this.nextStartTime, this.ctx.currentTime);
    const audioBuffer = await decodeAudioData(audioData, this.ctx);
    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.ctx.destination);
    source.addEventListener('ended', () => {
      this.sources.delete(source);
    });
    source.start(this.nextStartTime);
    this.nextStartTime += audioBuffer.duration;
    this.sources.add(source);
  }

  stop(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear();
    this.nextStartTime = 0;
  }
}
