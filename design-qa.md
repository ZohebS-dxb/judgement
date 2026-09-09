# Design QA — Landscape mobile redesign

## Final result

passed

## Source truth

- Game-table reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-8924c106-fab6-4414-9ffb-dd38c8ed893d.png`
- Stats reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-8efe6e53-4401-4c86-b9e6-81f0ce9a8b38.png`
- Scoreboard reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-4987d53e-cac2-4d03-bf6e-c7054234b34d.png`
- Existing portrait table used as an anti-reference: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-31052856-a240-488e-ba2b-23f0264dcc23.png`
- Written requirements: `C:\Users\zoheb\.codex\attachments\977291fd-46eb-4fa1-8f36-4e9b495e7a4d\pasted-text.txt`

## Implementation evidence

- Main table: `http://localhost:3000/preview`
- Three-player 17-card state: `http://localhost:3000/preview?players=3&cards=17`
- Stats: `http://localhost:3000/preview/stats`
- Scoreboard: `http://localhost:3000/preview/scoreboard`
- Reproducible side-by-side harnesses: `public/qa/compare.html`, `public/qa/compare-3-17.html`, `public/qa/compare-stats.html`, and `public/qa/compare-scoreboard.html`

## Viewports and states checked

- 667 × 375: iPhone SE-class landscape, four players, 12-card hand.
- 844 × 390: modern iPhone landscape, three players, 17-card two-row hand.
- 915 × 412: Android landscape, four players, 12-card hand.
- Bidding, active trick, one-second winning-trick review, round scoreboard, final standings, and portrait orientation gate.

## Comparison and iteration log

1. Compared the supplied game screenshot beside the 844 × 390 implementation. The first pass retained the current table's portrait-biased spacing; player anchors and the hand were rebuilt for a symmetric landscape table.
2. Compared three-player/17-card state. Upper-left and upper-right opponent anchors were balanced and the hand was split into two compact rows so rank and suit remain readable.
3. Compared Stats beside its source. The first pass used three cards per row and wrapped labels; changed to two cards per row for legibility and source-like density.
4. Compared the scoreboard beside its source. Kept the white scrollable grid, navy surround, coral action, and red leader emphasis; totals remain in a sticky footer for small screens.
5. Rechecked the viewport matrix after correcting QA-harness scaling. No player badge, card, timer, primary action, or scoreboard total was clipped.
6. Repeated checks in a clean in-app Chromium session. Console error log: none.

## Fidelity and intentional compromises

- Matched the dominant navy/blue/coral palette, Sofia Pro typography, rounded panels, landscape hierarchy, compact top status, table positions, large tap targets, stats ordering, and scoreboard treatment.
- Decorative background suit motifs and illustrated avatars were omitted to keep the supplied minimalist brand direction and avoid introducing unlicensed assets.
- Player initials replace avatars; Lucide icons provide interface symbols.
- Cards use the project's original CC0 SVG faces and are spaced slightly wider than the reference to improve recognition on small phones.
- Browser geometry was validated at representative iPhone and Android CSS viewports in Chromium. Physical-device Safari and Chrome testing remains the final real-device check.
