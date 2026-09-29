# ARP Multi View — repository instructions

Applies to every contributor and every AI agent working in this repository.

## Always update docs and comments with the code

Treat documentation and comments as part of the change, not a follow-up. Never leave them for
a reviewer to request. In the **same** change that touches code, update whichever of these are
affected:

| Change you made | Also update |
|---|---|
| Any user-visible behaviour | `README.md` |
| New/renamed/deleted source file | Project-structure tree **and** a per-file section in `docs/TECHNICAL-SPEC.md` |
| New/changed `localStorage` key | Persisted-state table in `docs/TECHNICAL-SPEC.md` |
| New route, prop, or handler | The relevant per-file section in `docs/TECHNICAL-SPEC.md` |
| A new constraint or gotcha | "Known limitations" in `README.md`, "Cross-cutting notes" in `docs/TECHNICAL-SPEC.md` |
| Setup, routing, or a new failure mode | `docs/LOCAL-SETUP.md` (steps and Troubleshooting) |
| Version 1 user-facing behaviour | `src/components/HelpPanel.tsx` (v1's in-app help mirrors the README) |
| Version 2 keyboard shortcuts | `src/v2/lib/useShortcuts.ts`, `src/v2/components/ShortcutsOverlay.tsx`, and the README shortcut table must all agree |

Do not create new markdown files to describe a change. Update the existing docs.

## Comment conventions

- **Every** file in `src/` opens with a header comment stating its purpose and how it fits in.
  This is an invariant; verify with:
  ```powershell
  Get-ChildItem -Path src -Recurse -Include *.ts,*.tsx,*.css |
    Where-Object { (Get-Content $_.FullName -TotalCount 1) -notmatch '^\s*(//|/\*)' }
  ```
  Empty output means every file is covered.
- Inline comments explain **why**, never **what**. Add one only for a decision the code cannot
  show on its own — a workaround, an ordering constraint, a provider quirk, a lint rule being
  worked around. Keep it to one short line.
- Do not add comments, docstrings, or type annotations to code you did not change.

## Before you finish

```powershell
npm run build   # tsc -b + vite build
npm run lint    # oxlint — the tree is warning-free, keep it that way
```

## Architecture rules

- Two independent UIs behind a hand-rolled History-API router (`src/router.tsx`): `/` picker,
  `/v1` (`src/App.tsx`, classic grid), `/v2` (`src/v2/`, collage). Do not add `react-router`
  unless the route surface genuinely grows.
- The only sanctioned shared code is `src/types.ts`, `src/lib/*`, and
  `src/components/players/*`. Keep v1 and v2 otherwise separate — when editing a shared file,
  check both callers (e.g. `YouTubePlayer`'s `quality` prop is optional so v1 is unaffected).
- Every v2 `localStorage` key must keep the `arp-multi-view:v2:` prefix, or it collides with v1.
- No API keys and no backend, by design. YouTube channel-name search and YouTube live detection
  are absent for that reason, not by oversight. Adding either is a design change.
- Any id or slug taken from a pasted URL or decoded from a share link must pass the `SAFE_ID`
  whitelist before it reaches an iframe `src`.
- Routing is history-based, so the deploy target must serve `index.html` for unknown paths.
  `public/_redirects` does this for Cloudflare Pages; keep it if the host ever changes.

## Lint rules that bite here

- `react/set-state-in-effect` — don't call `setState` synchronously in an effect body. See
  `src/v2/components/CommandBar.tsx` for the accepted shape.
- `react/refs` — don't write to a ref during render. See `src/v2/lib/useShortcuts.ts`.

Follow those patterns rather than disabling the rules.
