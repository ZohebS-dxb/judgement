# Design QA — Portrait mobile iteration

## Source visual truth

- Current requirements: `C:\Users\zoheb\.codex\attachments\6b667800-6996-4727-9db2-999e93a23bd6\pasted-text.txt`
- Stats visual reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-8efe6e53-4401-4c86-b9e6-81f0ce9a8b38.png` (720 × 1600 px).
- Game-table visual reference for card styling and hierarchy: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-8924c106-fab6-4414-9ffb-dd38c8ed893d.png` (1600 × 738 px).
- Scoreboard visual reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-4987d53e-cac2-4d03-bf6e-c7054234b34d.png` (1600 × 720 px).

The written portrait specification overrides the landscape geometry of the game and scoreboard references. The supplied screenshots remain authoritative for palette, typography, restraint, card treatment, and information hierarchy.

## Implementation evidence

- Browser-rendered portrait matrix: `http://localhost:3000/qa/portrait-viewports.html`
- Supporting-screen matrix: `http://localhost:3000/qa/portrait-supporting.html`
- Direct states: `http://localhost:3000/preview?players=3&cards=17`, `http://localhost:3000/preview?players=4&cards=12&phase=bidding`, `http://localhost:3000/preview/stats`, and `http://localhost:3000/preview/scoreboard`.
- Reproducible local capture sources: `public/qa/portrait-viewports.html` and `public/qa/portrait-supporting.html`.

## Viewports, density, and states

- 320 × 568 CSS px: four players, one-card hand.
- 390 × 844 CSS px: three players, 17-card hand; four-player five-card bidding; Stats; Scoreboard.
- 393 × 852 CSS px: four players, 12-card bidding state.
- The QAs run at device scale factor 1 inside a 0.75/0.8 display-only QA harness. The iframe content retains its exact CSS viewport; scaling only lets multiple states appear together for comparison.
- Additional hand counts checked through the same responsive grid rules: 5, 10, 12, and 17 cards.
- Browser-rendered states checked: active local turn, fixed empty and played-card slots, three-player and four-player grids, bidding, urgent-timer styling, Stats, and between-deal Scoreboard.
- Browser console warnings/errors: none.

## Fidelity surfaces

- Fonts and typography: Sofia Pro remains the primary family. Turn copy is now the dominant gameplay text; compact player labels stay legible without wrapping at 320 px.
- Spacing and layout: the app is portrait-first, uses dynamic viewport units and safe-area insets, fixes the hand to the bottom, and keeps central slots in stable grid tracks. No gameplay scrolling or horizontal overflow was observed.
- Colors and tokens: the blue, midnight, coral, mist, red-warning, and white hierarchy remains aligned with the supplied Stats reference. No new gradients were introduced.
- Image and asset quality: original CC0 card SVG faces remain crisp at all tested sizes. Interface actions use the existing icon library; no raster placeholders or improvised artwork were introduced.
- Copy and content: `Deal` now names a complete hand, `Round` names one card from each player, `Scoreboard` is one word, and no player-facing `Trick` wording remains.

## Comparison history

1. Initial portrait game pass — P2: the large bidding panel overlapped the lower player row at 390 × 844. Fix: added bidding-specific central-grid clearance while retaining the hand at full brightness. Post-fix evidence: all four player names and placeholders are visible above the bid panel in `portrait-supporting.html`.
2. Initial Stats pass — P2: explanatory sorting copy remained and zero-game players could render. Fix: removed the copy and filtered zero-game records both in the UI and database view. Post-fix evidence: `preview/stats` contains only populated reference records.
3. Initial lifecycle review — P1: Admin abandonment changed game status but active clients were not explicitly redirected. Fix: abandonment emits a realtime update; state/action endpoints return 410 for abandoned games; clients store the Admin attribution notice and return Home. A regression test verifies completed and abandoned participants never enter the next active lobby.
4. Final portrait pass — no remaining P0/P1/P2 findings. Three- and four-player positions, all requested hand counts, bidding, Scoreboard, safe-area padding, and browser-console output passed.

## Focused-region comparison

Focused checks were used for card rank/suit legibility, the 17-card two-row hand, the bidding controls, the lower player row, Stats labels, and all six Scoreboard columns. These details were too small to judge reliably from the full matrix alone.

## Follow-up polish

- P3: the 320 px-wide layout is intentionally dense around long player names, but still truncates safely rather than moving or clipping a player slot.
- Physical iPhone Safari and Android Chrome remain the final device-specific validation for browser-toolbar animation and manufacturer-specific safe-area values; representative CSS viewports passed in Chromium.

## Final result

passed
