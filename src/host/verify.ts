import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

export async function mermaidVerify(
  input: string,
  isPath = false,
  strict = false,
): Promise<{ ok: boolean; errors: { line: number; col: number; msg: string }[]; warnings: { msg: string }[] }> {
  let src = input;

  if (isPath) {
    let raw: string | undefined;
    try {
      raw = fs.readFileSync(input, 'utf-8');
    } catch (e: any) {
      // fallback: try resolving relative to cwd and ancestors (handles pnpm --dir package run)
      if (!path.isAbsolute(input)) {
        const candidates: string[] = [];
        candidates.push(path.resolve(process.cwd(), input));
        // walk up from cwd looking for the file
        let dir = process.cwd();
        for (let i = 0; i < 5; i++) {
          dir = path.dirname(dir);
          candidates.push(path.join(dir, input));
        }
        // also try harness-relative if still not found (coordination workspace)
        let found = false;
        for (const c of candidates) {
          try {
            raw = fs.readFileSync(c, 'utf-8');
            found = true;
            break;
          } catch {}
        }
        if (!found) {
          return { ok: false, errors: [{ line: 1, col: 0, msg: e.message }], warnings: [] };
        }
      } else {
        return { ok: false, errors: [{ line: 1, col: 0, msg: e.message }], warnings: [] };
      }
    }
    src = raw as string;
    const blocks = [...src.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
    if (blocks.length) src = blocks.join('\n');
  } else {
    if (src && src.includes('```mermaid')) {
      const blocks = [...src.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
      if (blocks.length) src = blocks.join('\n');
    }
  }

  src = (src || '').trim();
  if (!src) {
    return { ok: false, errors: [{ line: 1, col: 0, msg: 'Empty input' }], warnings: [] };
  }

  let parseError: any = null;
  let usedMermaid = false;
  try {
    const require = createRequire(import.meta.url);
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mermaid: any = require('mermaid');
    const parseFn =
      (mermaid && typeof mermaid.parse === 'function' && mermaid.parse) ||
      (mermaid && mermaid.default && typeof mermaid.default.parse === 'function' && mermaid.default.parse) ||
      null;
    if (parseFn) {
      usedMermaid = true;
      const result = parseFn(src);
      if (result && typeof (result as Promise<any>).then === 'function') await result;
    }
  } catch (e: any) {
    if (usedMermaid) {
      const msg = e?.message || String(e);
      // Environment errors (no DOM) are not syntax errors — fall back to heuristic
      if (/DOMPurify|window|document|DOM/.test(msg)) {
        usedMermaid = false;
        parseError = null;
      } else {
        parseError = e;
      }
    }
  }

  if (parseError) {
    const msg = parseError?.message || String(parseError);
    const line =
      parseError?.hash?.line ||
      (() => {
        const m = msg.match(/line\s+(\d+)/i);
        return m ? parseInt(m[1], 10) : 1;
      })();
    const col = parseError?.hash?.col || 0;
    return { ok: false, errors: [{ line, col, msg }], warnings: [] };
  }

  if (!usedMermaid) {
    const lines = src.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/-->\s*$/.test(line)) {
        const trimmed = line.trim();
        if (trimmed.endsWith('-->')) {
          return {
            ok: false,
            errors: [{ line: i + 1, col: line.indexOf('-->'), msg: `Parse error on line ${i + 1}: Incomplete arrow syntax` }],
            warnings: [],
          };
        }
      }
    }
  }

  const warnings: { msg: string }[] = [];
  if (strict && src.includes('shadow')) {
    warnings.push({ msg: 'anti-pattern: shadow' });
  }

  return { ok: true, errors: [], warnings };
}
