import { describe, it, expect } from 'vitest';
import { mermaidVerify } from '../src/host/verify.js';

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
    const r = await mermaidVerify('docs/architecture.md', true);
    expect(r.ok).toBe(true);
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
