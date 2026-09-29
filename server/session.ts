import { GoogleGenAI } from '@google/genai';
import { REQUIRED_MODEL } from '../shared/options';
import { buildSystemInstruction, parseSessionBody } from './validate';

const TOKEN_TTL_MS = 30 * 60 * 1000;
const NEW_SESSION_TTL_MS = 60 * 1000;

export default async function handler(req: { method?: string; headers?: Record<string, string | string[] | undefined>; body?: unknown }, res: {
  status: (code: number) => { json: (body: unknown) => void };
}): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const csrf = req.headers?.['x-requested-with'];
  if (csrf !== 'fetch') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_INTERVIEW_MODEL;
  if (!apiKey || !model) {
    res.status(500).json({ error: 'Demo not available' });
    return;
  }
  if (model !== REQUIRED_MODEL) {
    res.status(500).json({ error: 'Demo not available' });
    return;
  }

  const parsed = parseSessionBody(req.body);
  if (!parsed.ok) {
    res.status(parsed.status).json({ error: parsed.error });
    return;
  }

  try {
    const client = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
    const now = Date.now();
    const authToken = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(now + TOKEN_TTL_MS).toISOString(),
        newSessionExpireTime: new Date(now + NEW_SESSION_TTL_MS).toISOString(),
      },
    });
    const token = authToken?.name;
    if (!token) {
      res.status(502).json({ error: 'Demo not available' });
      return;
    }
    res.status(200).json({
      token,
      expireAt: now + TOKEN_TTL_MS,
      model,
      systemInstruction: buildSystemInstruction(parsed.data),
      voiceName: parsed.data.voiceName,
      language: parsed.data.language,
      minutes: parsed.data.minutes,
      avatarName: parsed.data.avatarName,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'unknown';
    console.error('[AIR_DEMO]', { event: 'token_provision_failure', message });
    res.status(502).json({ error: 'Demo not available' });
  }
}
