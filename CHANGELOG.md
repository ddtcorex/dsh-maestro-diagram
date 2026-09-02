# Changelog

All notable changes to this project are documented in this file. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.2] - 2026-09-03

### Changed

- Anonymize local-home path in CHANGELOG (placeholder `~/`) per public-docs blacklist (#7).


## [0.1.1] - 2026-09-02

### Fixed

- Remove hardcoded `~/` fallback in diagram tests (#3).

### Changed

- Bump dsh-maestro-ci pin to e2448b1 (#5), sync community files and CHANGELOG (#4), unify release via reusable node-release (#2), add CONTRIBUTING/CODEOWNERS (#1).


## [0.1.0] - 2026-08-27

Initial release of `@ddtcorex/dsh-maestro-diagram` — host-only Cordis plugin
exposing `mermaid_verify` + `mermaid_drift` as deterministic tools, hybrid with
the `diagram-studio` skill. Extracted from `cathrynlavery/diagram-design` (MIT).

### Added

- **Host-only plugin (`id: maestro-diagram`, channel `/dsh-maestro-diagram`)** —
  `src/host/index.ts` registers `mermaid_verify` and `mermaid_drift` via
  `ctx.tools.register` (zod), `inject: ['sessions','tools']`, `rootDir: src/host`
  so `lib/index.js` is flat.
- **`mermaid_verify(src, isPath, strict)`** — `mermaid.parse()` + optional
  `mermaid-cli` validate, returns `{ok, errors, warnings}`. Strict mode warns on
  anti-patterns (`shadow:true`, `graph` legacy, `rounded-2xl`).
- **`mermaid_drift(diagram, roots)`** — parses `nodes/edges` from ```mermaid
  blocks, scans code symbols, reports `{missingInCode, staleEdges,
  missingInDiagram}`. Excludes `subgraph` ids and `pad*` spacers.
- **Supported Cases (5 types × 2 audiences × 3 outputs)** documented in
  `README.md` + `maestro-skills/skills/diagram-studio/SKILL.md`: flowchart,
  sequenceDiagram, classDiagram, erDiagram, stateDiagram with editorial tokens
  `paper/ink/accent/muted/link` and team vs client HTML output.
- **CI** via `ddtcorex/dsh-maestro-ci` reusable `node-plugin.yml` (`.github/workflows/ci.yml`);
  release via `node-release.yml` on tag `v*.*.*` (`.github/workflows/release.yml`).

### Fixed

- **drift: exclude `subgraph` container ids** (`Core`, `OpsStudio`) from node set —
  fixes spurious `missingInCode` for 2-col layout.
- **drift: exclude spacer `pad*` nodes** from diagram symbols — keeps `0 missingInCode`
  with header spacers.

### Notes

- The package is consumed as a DSH plugin via `cordis.patch.yml`
  (`id: maestro-diagram`) and is installed with a `link:` dependency or the
  `github:ddtcorex/dsh-maestro-diagram#<sha>` form. Live `lib/` is committed so a
  rebuild is only needed after editing `src/`.

[0.1.0]: https://github.com/ddtcorex/dsh-maestro-diagram/releases/tag/v0.1.0
