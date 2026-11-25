# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Riel666/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Riel666/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Ember &amp; Thyme — a timed bistro cooking game. Tickets land on the order board: fetch ingredients from the counter, chop them on the board, grill the patties, build each dish on the plate and serve it at the window before the customer's patience runs out. Five original recipes combine the same six ingredients in different ways, the rush quickens across the three phases of the shift, and a serve streak builds a combo multiplier — a wrong dish or a walked-out ticket breaks it.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

## Validation

Local runs (twice, fresh output dirs) wrote identical bytes:

`node main.ts` with `MAKEFUN_OUTPUT_DIR` set copies `game/` and `screenshots/` and writes `dossier.json` (527,380 bytes). Screenshots are real renders of the game in headless Chromium at 1280x800: `1-cover.jpg` (86,635 bytes), `2-orders.jpg` (88,236 bytes), `3-assembly.jpg` (84,846 bytes), `4-serve.jpg` (85,796 bytes) — each under the 256 KiB cap.

Headless play-tests with the real rules: `?selftest=1` serves one Sunny Burger end to end in 0:05 (score 216); `?selftest=burn` proves a patty left on the grill burns at 0:09. Node smoke tests of the pure logic (recipes, plate matching, order board, kitchen grid, BFS paths) all pass.

## Play

Move with WASD or the arrow keys, or click a spot to walk there. Click a station (or press E beside one) to use it: grab ingredients from the counter (keys 1–6 work too), hold E at the chopping board, grill patties and grab them before they burn, add items to the plate at the plating counter, and serve the finished plate at the window. `R` restarts, `M` toggles sound.

---

<sub>Entered on [make.fun](https://make.fun/?ref=nrw7bbqr&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
