import { timingSafeEqual } from 'node:crypto';
import { DEMO_PASSWORD, DEMO_USERNAME } from '../shared/credentials';
import {
  AVATAR_IDS,
  LANGUAGE_CODES,
  MINUTES_SET,
  VOICE_NAMES,
  type InterviewMinutes,
  type SessionRequest,
} from '../shared/options';
import { buildSystemInstruction } from './prompt';

export { buildSystemInstruction };

export type ParseResult =
  | { ok: true; data: SessionRequest }
  | { ok: false; status: number; error: string };

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

export function credentialsMatch(username: string, password: string): boolean {
  return secretsEqual(username, DEMO_USERNAME) && secretsEqual(password, DEMO_PASSWORD);
}

export function parseSessionBody(body: unknown): ParseResult {
  if (!body || typeof body !== 'object') {
    return { ok: false, status: 400, error: 'Invalid request' };
  }
  const raw = body as Record<string, unknown>;
  const username = typeof raw.username === 'string' ? raw.username : '';
  const password = typeof raw.password === 'string' ? raw.password : '';
  if (!credentialsMatch(username, password)) {
    return { ok: false, status: 401, error: 'Incorrect username or password' };
  }

  const jobDescription = typeof raw.jobDescription === 'string' ? raw.jobDescription.trim() : '';
  if (jobDescription.length < 1 || jobDescription.length > 20_000) {
    return { ok: false, status: 400, error: 'Job description is required' };
  }

  const voiceName = typeof raw.voiceName === 'string' ? raw.voiceName : '';
  if (!VOICE_NAMES.has(voiceName)) {
    return { ok: false, status: 400, error: 'Invalid voice' };
  }

  const language = typeof raw.language === 'string' ? raw.language : '';
  if (!LANGUAGE_CODES.has(language)) {
    return { ok: false, status: 400, error: 'Invalid language' };
  }

  const minutes = raw.minutes;
  if (typeof minutes !== 'number' || !MINUTES_SET.has(minutes)) {
    return { ok: false, status: 400, error: 'Invalid interview length' };
  }

  const avatarName = typeof raw.avatarName === 'string' ? raw.avatarName : '';
  if (!AVATAR_IDS.has(avatarName)) {
    return { ok: false, status: 400, error: 'Invalid avatar' };
  }

  return {
    ok: true,
    data: {
      username,
      password,
      jobDescription,
      voiceName,
      language,
      minutes: minutes as InterviewMinutes,
      avatarName,
    },
  };
}
