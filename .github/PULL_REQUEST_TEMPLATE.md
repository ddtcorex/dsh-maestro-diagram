## Summary

Describe the change in 2–3 bullets.

## Why

Explain the problem this PR solves and why this approach was chosen.

## Changes

- [ ] Code updated (`src/host/` — `mermaid_verify` / `mermaid_drift`)
- [ ] Tests added or updated (`tests/` — vitest)
- [ ] Documentation updated (`README.md` / `CONTRIBUTING.md` if needed)
- [ ] `lib/index.js` rebuilt and verified flat (`test -f lib/index.js`)

## Validation

Paste exact commands and outcomes (do not claim verified without evidence):

```bash
pnpm verify
pnpm test
pnpm build
test -f lib/index.js && echo "flat OK" || echo "FAIL"
```

Additional checks (when relevant):

```bash
node ../maestro-skills/skills/diagram-studio/scripts/verify-mermaid.mjs docs/architecture.md
pnpm --dir ../../maestro-workspace -r verify
```

## Linked Issues

Fixes #

## Checklist

- [ ] Branch is `feat/...`, `fix/...`, or `docs/...` off `master` (no direct commits to `master`)
- [ ] Commits follow Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`) in imperative mood
- [ ] Followed the Superpowers 3-phase workflow (brainstorming → writing-plans → executing-plans with TDD) where applicable
- [ ] `pnpm verify` / `pnpm test` / `pnpm build` are green
- [ ] `private: false` still set in `package.json` (public package — never `private: true`)
