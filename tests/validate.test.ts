import { describe, expect, it } from 'vitest';
import { buildSystemInstruction, parseSessionBody } from '../server/validate';

const base = {
  username: 'admin1',
  password: 'admin1',
  jobDescription: 'Senior TypeScript engineer',
  voiceName: 'Puck',
  language: 'en-US',
  minutes: 10,
  avatarName: 'Ben',
};

describe('parseSessionBody', () => {
  it('rejects a wrong password', () => {
    const result = parseSessionBody({ ...base, password: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it('rejects a wrong username', () => {
    const result = parseSessionBody({ ...base, username: 'nope' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(401);
    }
  });

  it('rejects empty job description', () => {
    const result = parseSessionBody({ ...base, jobDescription: '  ' });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(400);
    }
  });

  it('rejects invalid minutes', () => {
    const result = parseSessionBody({ ...base, minutes: 7 });
    expect(result.ok).toBe(false);
  });

  it('accepts a valid body', () => {
    const result = parseSessionBody(base);
    expect(result.ok).toBe(true);
  });
});

describe('buildSystemInstruction', () => {
  it('includes job description and minutes', () => {
    const text = buildSystemInstruction({
      username: 'admin1',
      password: 'admin1',
      jobDescription: 'Build APIs',
      voiceName: 'Puck',
      language: 'en-US',
      minutes: 15,
      avatarName: 'Ben',
    });
    expect(text).toContain('Build APIs');
    expect(text).toContain('15 minutes');
    expect(text).toContain('80%');
    expect(text).toContain('Do not continue past the time limit');
  });
});
