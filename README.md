# Chronos Fall — Endless Descent

A standalone browser action game: fight through the Underworld, build a combination of divine boons, defeat Chronos, and continue into the endless Abyss.

Play at [polymathlc.github.io/hades](https://polymathlc.github.io/hades/).

## Controls

| Action | Keyboard / mouse | Touch |
| --- | --- | --- |
| Move | WASD or arrow keys | Left movement pad |
| Aim | Mouse | Movement direction / nearby enemies |
| Strike | Hold left click or J | Hold Strike |
| Special | Hold right click or K | Hold Special |
| Cast | Q or E | Cast |
| Dash | Space or Shift | Dash |
| Hex | F | Hex |
| Boons | Tab or B | Boons button |
| Pause | Escape or P | Pause button |
| Mute | M | Sound setting in the pause menu |

The welcome screen waits for the artwork to load before allowing combat. Switching away from the game pauses it and clears held controls. Sound and reduced-motion settings are available from the pause menu.

Ashes, permanent Altar upgrades, and the highest chamber reached are saved in the current browser. A new run resets combat state, gold, and boons. Clear a room without taking damage for a bonus, then choose a reward gate to shape the next part of the run.

## Development

The source lives in `src/`. `generate_game.py` combines the ordered JavaScript files, styles, HTML template, and 19 WebP assets into the standalone `index.html` published by GitHub Pages. Do not edit the generated HTML directly.

Requires Python 3.10+ and Node.js 24 for development checks. The deployed game does not require a server runtime or AI service.

```sh
npm ci
python generate_game.py
python generate_game.py --check
npm test
npx playwright install chromium
npm run test:browser
```

Open `index.html` in a browser to play locally, or use `python -m http.server 8080`. The generator also works when invoked from another directory.

The browser checks exercise the generated release, including desktop and touch controls, focus loss, reward menus, persistent upgrades, enemy rendering, endless progression, and a dense combat scenario. Screenshots and timing evidence are written to `test-results/`. Set `PLAYWRIGHT_MODULE` to an installed Playwright module path and `PLAYWRIGHT_BROWSER_CHANNEL` to `msedge` or `chrome` to use an existing local browser.

## Release 2.0.0

- A redesigned arena, readable attack effects, responsive HUD, and reward presentation.
- A welcome/pause flow, touch controls, held attacks, and safe focus handling.
- Staged encounters, fairer attack warnings, working boon mechanics, and reliable reward/shop flows.
- Persistent permanent upgrades and clean run restarts.
- Cached scenery, bounded simulation catch-up, and browser regression checks in GitHub Actions.

The performance checks record the measured browser timings; achievable frame rates still depend on the device, browser, and display.
