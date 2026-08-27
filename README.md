# dsh-maestro-diagram — Maestro Diagram Studio (Host-only)

Hybrid **skill + plugin** for SA-grade diagrams: **GitHub-native Mermaid** (single source of truth) + **editorial HTML+SVG** (self-contained, no JS) + **deterministic verify/drift** (tool calls > LLM).

- **Skill:** `maestro-skills/skills/diagram-studio/SKILL.md` (rank 350) — teaches the agent when/how to draw, selects among 5 Mermaid types, enforces editorial discipline (density 4/10, accent 1-2), and decides audience (Team vs Client).
- **Plugin:** `packages/dsh-maestro-diagram` (this package, Host-only, `rootDir: src/host`, `inject: ['sessions','tools']`) — exposes `mermaid_verify` and `mermaid_drift` as reversible `ctx.tools.register` effects. No Client bundle on v1.

Inspired by `cathrynlavery/diagram-design` (MIT, 39 editorial types, tokens paper/ink/accent) + `diagram-drift` + `dsh-mermaid`. Default output stays GitHub Mermaid (per "render được trên github là ok"); HTML editorial is an explicit `export: html` when `audience: client`.

## Installation

```sh
# As DSH plugin (Host-only, no restart of skill provider needed, but Host needs reload for tools)
dsh plugin add @ddtcorex/dsh-maestro-diagram
# Or via the thin meta-bundle (opt-in until proven, not in meta v2 yet)
dsh plugin add @ddtcorex/dsh-maestro-meta
```

For skill-only use (no Host tools): `git pull` + `pnpm --dir maestro-skills run build` — then `node maestro-skills/skills/diagram-studio/scripts/verify-mermaid.mjs <file>`.

## Tools

### `mermaid_verify`

```
input:  string (Mermaid source or file content when isPath=true)
isPath: boolean? (if true, input is treated as file path, extracts ```mermaid blocks)
strict: boolean? (if true, warns on anti-patterns: shadow, graph legacy, rounded-2xl)
→ { ok: boolean, errors: {line,col,msg}[], warnings: {msg}[] }
```

Deterministic `mermaid.parse()` + optional `mermaid-cli` validate. Never throws — returns `isError` shape for the agent to fix.

### `mermaid_drift`

```
diagramPath: string (e.g. docs/architecture.md)
codeRoots:   string[]? (default ["packages/*","govard","maestro-skills"])
→ { missingInCode: string[], staleEdges: {from,to}[], missingInDiagram: string[], summary: string }
```

Parses Mermaid nodes/edges vs scans `codeRoots` (package.json names, `govard/internal/*`, skills). Inspired by `diagram-drift` — flags `missingInCode / staleEdges / missingInDiagram` before PR.

## Supported Cases (all verified — see SKILL.md § Supported Cases)

**5 diagram types** (mapped from 39 editorial types):
- `flowchart TB/LR` — Components + connections (architecture) — `docs/architecture.md §1.1`
- `sequenceDiagram` — Messages over time (turn lifecycle) — `docs/specs/2026-08-27-harness-turn-flow-sequence.md`
- `classDiagram` — Classes + ops (`ReviewProvider <|-- GitLabProvider`)
- `erDiagram` — Entities + fields (`PROJECT ||--o{ MEMORY`)
- `stateDiagram` / `stateDiagram-v2` — States + guards (`[*] --> queued`)

All share tokens `paper #f5f5f5 / ink #2d3142 / accent #eb6c36 / muted #8a94a6 / link #4a90e2` from `references/style-guide.md` (`classDef focal/muted`, no shadow, rx:6).

**2 audiences** (controls 4 elements per HTML):
- **Team / Internal** (`team|internal|engineering` or "cho team") → HTML has both: inline SVG + `<details><summary>Mermaid source</summary><pre>` collapsed + Editorial tokens card + About footer with verify/drift. Example: `harness-architecture.html` 16K (1 svg,1 pre), `harness-turn-flow-sequence.html` 31K.
- **Client / External** (`client|pitch|deck` or "cho khách") → HTML has only SVG, no `<pre>`, no tokens card, footer reduced to `Generated via diagram-studio — 2026-08-27`. Example: `...-client.html` 12K/30K (1 svg,0 pre), PNG 124K/65K.

**3 outputs:**
- GitHub-native Mermaid in `docs/architecture.md` / `docs/specs/*-design.md` (always show source)
- Editorial HTML `docs/diagrams/<slug>.html` (self-contained inline SVG/CSS, no JS) — Team vs Client per table
- Deck PDF `docs/diagrams/maestro-harness-deck.pdf` (A4 landscape, 3 pages) — always Client rules, PNG only

**3 verification cases:**
- Parse ok → 5/5 PASS
- Parse fail (empty, `A-->`) → `ok:false, line:2`
- Anti-pattern strict (`shadow:true`) → `warnings:1`
- Drift `missingInCode 0` / missing file throws `ENOENT`

**2 live case studies on this harness:**
- Architecture flowchart (10 plugins + meta) — `harness-architecture.html` 16K → `...-client.html` 12K — PNG 238K→124K — Deck p1
- Turn flow sequence (6 participants) — `harness-turn-flow-sequence.html` 31K (svg 28K via `mermaid-cli 11.16.0`) → `...-client.html` 30K — PNG 100K→65K + `...-rendered.png` 20K — Deck p2

All above are live-verified: `packages/dsh-maestro-diagram` 8/8, `maestro-workspace -r verify` 13 packages Done, chrome headless 980×1400 screenshots, `pdfinfo Pages:3`.

## Usage (agent)

1. Load `diagram-studio` skill — it selects `flowchart` vs `sequenceDiagram` vs `classDiagram` vs `erDiagram` vs `stateDiagram` by semantic pattern.
2. State `type, size (85%/100%), what will be cut due to budget (density 4/10)` and wait for redirect (confirm-before-drawing).
3. Write Mermaid to `docs/specs/*-design.md` (or `docs/architecture.md §1.1`), call `mermaid_verify` — fix until `ok:true`.
4. If `audience: client`, also render editorial HTML: `mermaid-cli -i <src>.mmd -o <slug>.svg` → embed inline SVG into `docs/diagrams/<slug>.html` per audience table, then `chrome --screenshot` → PNG and `--print-to-pdf` → deck. Hide source/tokens/footer for client.
5. Before PR, run `mermaid_drift --diagram docs/architecture.md --roots packages/*,govard,maestro-skills` — fix `missingInCode` by patching doc or code.

CLI fallback (no plugin): `node maestro-skills/skills/diagram-studio/scripts/verify-mermaid.mjs docs/architecture.md`

## Build & Verify

```sh
pnpm --dir packages/dsh-maestro-diagram run build   # must create lib/index.js flat (rootDir: src/host)
pnpm --dir packages/dsh-maestro-diagram run test    # 8/8 (5 verify + 3 drift)
pnpm --dir packages/dsh-maestro-diagram run verify  # tsc --noEmit
pnpm --dir maestro-skills run build                 # skill provider
pnpm --dir maestro-workspace -r verify              # 13 packages Done
```

`lib/index.js` flat is required — `test -f lib/index.js` must be `0` (not `lib/host/index.js`), otherwise `dsh web` boot fails `ERR_MODULE_NOT_FOUND`. Dry-boot on ephemeral port before any real restart.

## Publishing

This package is public (`private:false`, `workspace:^` deps). Publish with `pnpm publish --access public` only — never `npm publish` (would leave `workspace:` in tarball). See `maestro-skills/README.md` for skill distribution and `docs/specs/2026-08-27-diagram-studio-design.md` for design.

## License

MIT — see `LICENSE`. Editorial tokens/style-guide trimmed from `cathrynlavery/diagram-design` (MIT) with attribution in `maestro-skills/skills/diagram-studio/references/diagram-design-learnings.md`.
