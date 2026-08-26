import type { Context } from '@deepseek-ai/cordis';
import { mermaidVerify } from './verify.js';
import { mermaidDrift } from './drift.js';

// Reserved RPC channel for future Client preview (must match /^\/[A-Za-z0-9._~-]+$/)
export const CHANNEL = '/dsh-maestro-diagram';

const plugin = {
  inject: ['sessions', 'tools'] as const,
  apply(ctx: Context) {
    ctx.effect(() =>
      (ctx as any).tools.register({
        name: 'mermaid_verify',
        description: 'Verify Mermaid syntax, returns {ok, errors, warnings}',
        schema: {
          input: { type: 'string', description: 'Mermaid source or file content' },
          isPath: { type: 'boolean', optional: true },
          strict: { type: 'boolean', optional: true },
        } as any,
        handler: async (args: { input: string; isPath?: boolean; strict?: boolean }) =>
          mermaidVerify(args.input, args.isPath, args.strict),
      }),
    );
    ctx.effect(() =>
      (ctx as any).tools.register({
        name: 'mermaid_drift',
        description: 'Detect drift between Mermaid diagram and codebase',
        schema: {
          diagramPath: { type: 'string', description: 'Path to markdown file containing Mermaid diagram' },
          codeRoots: { type: 'array', optional: true, description: 'Code roots to scan for symbols (e.g. ["packages/*"]) ' },
        } as any,
        handler: async (args: { diagramPath: string; codeRoots?: string[] }) =>
          mermaidDrift(args.diagramPath, args.codeRoots),
      }),
    );
  },
};

export default plugin;

export function apply(ctx: Context): void {
  return plugin.apply(ctx);
}
