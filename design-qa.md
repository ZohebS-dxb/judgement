# Design QA

Reference: supplied mobile final-scoreboard screenshot and existing mobile game-table design.

- Final scoreboard now has one compact, centered Home button. The stretched action and secondary Finalize Result control are absent.
- Game header keeps its existing height while showing a large isolated trump icon, total-bid call status, Scoreboard, and End Game controls.
- Seventeen-card preview is balanced 9 + 8 with clear rank/suit exposure in both rows.
- First-player star, subtle direction watermark, and stronger steady local-turn border are visually distinct without blocking cards or labels.
- The supplied Saurabh Mehta image uses `object-fit: contain`, preserving its aspect ratio, with one compact OK action over the full-screen state.
- Local browser preview and accessibility tree show no clipped controls, missing labels, or duplicate final-score actions.

Final result: passed
