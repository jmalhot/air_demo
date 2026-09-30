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
  const text = buildSystemInstruction(
    {
      username: 'admin1',
      password: 'admin1',
      jobDescription: 'Build APIs',
      voiceName: 'Puck',
      language: 'en-US',
      minutes: 15,
      avatarName: 'Ben',
    },
    new Date('2026-09-30T16:00:00.000Z'),
  );

  it('includes job description, clock, and spoken-interview framing', () => {
    expect(text).toContain('Build APIs');
    expect(text).toContain('15 minutes');
    expect(text).toContain('80%');
    expect(text).toContain('2026-09-30');
    expect(text).toContain('speech-to-text');
    expect(text).toContain('English');
    expect(text).toContain('video frames');
    expect(text).not.toContain('that is not provided to you');
  });

  it('uses production AIR identity and style without tools this demo does not have', () => {
    expect(text).toContain('AIR');
    expect(text).toContain('Braintrust');
    expect(text).toContain('end_interview');
    expect(text).toContain('get_remaining_time');
    expect(text).toContain('plain-text');
    expect(text).not.toContain('end_interview_tool');
    expect(text).not.toContain('document_consultant_tool');
    expect(text).not.toContain('follow_up_strategy_consultant_tool');
    expect(text).not.toContain('summary_consultant_tool');
  });
});
