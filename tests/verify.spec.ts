import { describe, it, expect } from 'vitest';
import { mermaidVerify } from '../src/host/verify.js';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('mermaidVerify', () => {
  it('valid flowchart passes', async () => {
    const r = await mermaidVerify('flowchart TB\n  A-->B');
    expect(r.ok).toBe(true);
  });

  it('invalid syntax fails at line 2', async () => {
    const r = await mermaidVerify('flowchart TB\n  A-->');
    expect(r.ok).toBe(false);
    expect(r.errors[0].line).toBe(2);
  });

  it('reads from path when isPath (docs/architecture.md)', async () => {
    const candidates = [
      'docs/architecture.md',
      '../../docs/architecture.md',
      '../../../docs/architecture.md',
      process.env.MAESTRO_HARNESS_ROOT ? path.join(process.env.MAESTRO_HARNESS_ROOT, 'docs/architecture.md') : null,
      path.join(os.homedir(), 'Work/htdocs/maestro-harness/docs/architecture.md'),
    ].filter(Boolean) as string[];
    let target: string | null = null;
    for (const p of candidates) {
      try { if (fs.existsSync(p)) { target = p; break; } } catch {}
    }
    let tmp: string | null = null;
    if (!target) {
      tmp = path.join(os.tmpdir(), `verify-arch-${Date.now()}.md`);
      fs.writeFileSync(tmp, "```mermaid\nflowchart TB\n  A-->B\n```\n", 'utf-8');
      target = tmp;
    }
    try {
      const r = await mermaidVerify(target, true);
      expect(r.ok).toBe(true);
    } finally {
      if (tmp) try { fs.unlinkSync(tmp); } catch {}
    }
  });

  it('detects anti-pattern shadow when strict', async () => {
    const r = await mermaidVerify('flowchart TB\n  A-->B\n  style A shadow:true', false, true);
    expect(r.warnings?.length).toBeGreaterThan(0);
  });

  it('empty input fails', async () => {
    const r = await mermaidVerify('');
    expect(r.ok).toBe(false);
  });
});
