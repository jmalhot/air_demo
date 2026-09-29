import { GoogleGenAI, Modality } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('NO_KEY');
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
const timeout = setTimeout(() => {
  console.log('TIMEOUT');
  process.exit(2);
}, 25000);

const session = await client.live.connect({
  model: 'gemini-3.8-live',
  config: {
    systemInstruction: 'Greet the user in one short sentence.',
    responseModalities: [Modality.VIDEO],
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      languageCode: 'en-US',
    },
  },
  callbacks: {
    onopen: () => console.log('OPEN'),
    onmessage: (msg) => {
      const parts = msg.serverContent?.modelTurn?.parts ?? [];
      for (const p of parts) {
        if (p.inlineData?.mimeType) console.log('PART', p.inlineData.mimeType, p.inlineData.data?.length);
        if (p.text) console.log('TEXT', p.text.slice(0, 80));
      }
      if (msg.setupComplete) console.log('SETUP');
      if (msg.serverContent?.turnComplete) {
        console.log('TURN_COMPLETE');
        clearTimeout(timeout);
        session.close();
        process.exit(0);
      }
    },
    onerror: (e) => console.log('ERROR', e.message),
    onclose: (e) => {
      console.log('CLOSE', e.reason || e.code);
      clearTimeout(timeout);
      process.exit(0);
    },
  },
});

session.sendClientContent({
  turns: [{ role: 'user', parts: [{ text: 'Hello' }] }],
  turnComplete: true,
});
