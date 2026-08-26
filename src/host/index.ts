import type { Context } from '@deepseek-ai/cordis';

// Reserved RPC channel for future Client preview (must match /^\/[A-Za-z0-9._~-]+$/)
export const CHANNEL = '/dsh-maestro-diagram';

const plugin = {
  inject: ['sessions', 'tools'] as const,
  apply(ctx: Context) {
    ctx.effect(() =>
      (ctx as any).tools.register({
        name: 'mermaid_verify',
        description: 'Verify Mermaid syntax (placeholder — full impl in verify.ts)',
        schema: {
          input: { type: 'string', description: 'Mermaid source or file content' },
          isPath: { type: 'boolean', optional: true },
          strict: { type: 'boolean', optional: true },
        } as any,
        handler: async (args: { input: string; isPath?: boolean; strict?: boolean }) => {
          void args;
          return { ok: true, errors: [] };
        },
      }),
    );
  },
};

export default plugin;

export function apply(ctx: Context): void {
  return plugin.apply(ctx);
}
