import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Vercel session function bundle', () => {
  it('inlines shared modules so Node does not import ../shared/options at runtime', () => {
    execFileSync(process.execPath, [path.join('scripts', 'bundle-api.mjs')], { stdio: 'pipe' });
    const bundled = readFileSync(path.join('api', 'session.js'), 'utf8');
    expect(bundled).not.toMatch(/from\s+['"]\.\.\/shared\/options['"]/);
    expect(bundled).toContain('gemini-3.8-live');
    expect(bundled).toMatch(/export\s*\{[\s\S]*handler as default[\s\S]*\}/);
  });
});
