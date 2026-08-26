import { describe, it, expect } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { mermaidDrift } from '../src/host/drift.js';

describe('mermaidDrift', () => {
  it('harness architecture has no drift after fix', async () => {
    const r = await mermaidDrift('docs/architecture.md', ['packages/*', 'govard', 'maestro-skills']);
    expect(r.missingInCode.length).toBe(0);
  });

  it('detects missing node when diagram has extra', async () => {
    const tmp = path.join(os.tmpdir(), `drift-test-${Date.now()}.md`);
    const content = '# Test\n\n```mermaid\nflowchart TB\n  Remote["Remote"]\n  FakePlugin["Fake Plugin"]\n  Remote --> FakePlugin\n```\n';
    fs.writeFileSync(tmp, content, 'utf-8');
    try {
      const r = await mermaidDrift(tmp, ['packages/*']);
      expect(r.missingInCode.map((s: string) => s.toLowerCase())).toContain('fakeplugin');
    } finally {
      try { fs.unlinkSync(tmp); } catch {}
    }
  });

  it('handles missing file', async () => {
    const fake = `docs/__nonexistent_${Date.now()}.md`;
    try {
      const r: any = await mermaidDrift(fake, ['packages/*']);
      // either throws or returns ok:false
      if (r && typeof r.ok !== 'undefined') {
        expect(r.ok).toBe(false);
      } else {
        // if it returns drift shape, fail because should have thrown
        throw new Error('expected throw or ok:false');
      }
    } catch (e: any) {
      // thrown path — accept any error with ENOENT or isError
      const msg = e?.message || String(e);
      expect(msg.toLowerCase()).toMatch(/enoent|not found|no such file/i);
      // also check isError flag if present
      if ('isError' in e) expect(e.isError).toBeTruthy();
    }
  });
});
