# Design QA — Requested mobile deltas

## Source visual truth

- Reported final Scoreboard defect: `C:\Users\zoheb\AppData\Local\Temp\codex-clipboard-30166292-22cb-45bb-bf67-e0256d263b0c.png` (1116 × 2480 px, Android Chrome capture).
- Written change specification: `C:\Users\zoheb\.codex\attachments\c65c0d72-44e5-4de7-b1a7-0927cd55be61\pasted-text.txt`.

## Implementation evidence

- Focused source/implementation comparison: `http://localhost:3001/qa/scoreboard-comparison.html`.
- Requested-delta matrix: `http://localhost:3001/qa/requested-deltas.html`.
- Card viewport matrix: `http://localhost:3001/qa/portrait-viewports.html`.
- Reproducible capture sources: `public/qa/scoreboard-comparison.html`, `public/qa/requested-deltas.html`, and `public/qa/portrait-viewports.html`.

## Viewports, density, and states

- Source: 1116 × 2480 physical pixels, browser chrome included; evaluated for the reported oversized final-Scoreboard action.
- Implementation: 390 × 844 CSS px frames rendered at 0.75 in the comparison board, plus 320 × 568 CSS px small-phone coverage.
- States: final Scoreboard, centered Home, three-player 17-card hand, four-player bidding, and compact bid-call status.

## Full-view and focused comparison

- The source and final Scoreboard implementation were displayed together in one browser comparison. The source OK action occupied most of the remaining page height; the implementation uses a 48 px compact action with bounded width.
- The 390 × 844 delta matrix confirmed the Home title and buttons form one centered group and the 17-card hand remains in two readable rows.
- Focused card inspection confirmed the new large top-left and mirrored bottom-right indices stay visible under hand overlap. Rank and suit dominate the simple secondary pips.

## Required fidelity surfaces

- Fonts and typography: existing Sofia Pro UI typography is preserved; card indices use high-weight system typography for maximum mobile legibility.
- Spacing and layout rhythm: portrait structure is unchanged; only card sizing, the centered Home grouping, compact Scoreboard actions, and the added compact call-status chip changed.
- Colors and visual tokens: the existing palette is preserved; suits use high-contrast red or black on white.
- Image quality and asset fidelity: cards remain resolution-independent SVGs with original, non-proprietary geometry and glyph-based artwork.
- Copy and content: End Game now explains pending Admin finalization; UNDER CALL, OVER CALL, and EXACT appear only after bid reveal.

## Comparison history

- P1 resolved: final OK button stretched vertically. It is now constrained to 48 px height and 116–190 px width inside a compact action row.
- P2 resolved: old card indices were too small at 12–17 cards. Indices and suits are substantially larger, and card dimensions were increased without changing the two-row limit.

## Remaining findings

- No actionable P0/P1/P2 visual findings.
- P3: the QA matrix uses Chromium viewport simulation; physical-device Safari remains useful for final browser-toolbar behavior, but no requested layout is blocked.

## Final result

passed
