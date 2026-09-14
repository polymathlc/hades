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

The source lives in `src/`. `generate_game.py` combines the ordered JavaScript files, styles, HTML template, and 16 WebP actor/scenery assets and authored SVG combat layers into the standalone `index.html` published by GitHub Pages. Do not edit the generated HTML directly.

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

## Release 2.1.1: SVG combat and score-based learning rewards

Every strike combo, special projectile, cast, elemental effect and enemy warning now uses authored SVG layers, decoded once before play. Engraved crescents, branching lightning, flame curls, crystalline ice and ritual seals animate from simulation time. Three obsolete raster effect sheets are no longer bundled.

The Math and Science admin betas embed this same generated game as `hades-game.html?learning=1&subject=math` (or `science`). The same-origin authenticated portal owns question selection and marking through `learning-parent.js` (copied to each portal as `hades-learning-parent.js`). The standalone game remains available without the learning parameter. A learning URL opened outside its portal cannot bypass the checkpoint.

At every exit gate, the game pauses for exactly five distinct, suitable question-bank MCQs. Each correct answer heals 8% of maximum life. Scores 0–5 earn Fractured/Common/Uncommon/Rare/Epic/Heroic rewards. Zero correct grants no boon or Pom upgrade, only +1 maximum life for those reward gates, without healing. Scores 1–5 grant level 1/2/3/5/8 for the next scalable boon, or add 1/2/3/5/8 levels to a Pom choice. Unique utility effects keep their authored mechanics and add 5 maximum life per earned rank, reaching +40 at a perfect score. If no scalable Pom target exists, scores 0–5 grant 1/5/10/20/35/60 maximum life instead. Maximum-life bonuses do not heal. Embedded rounds no longer award automatic room-clear healing; other acquired healing abilities still work.

Heart gates grant 1/10/18/25/40/60 maximum life and ash gates grant 1/5/10/15/25/40 ashes at scores 0–5. Shop boons and Poms use the earned tier, while shop hearts grant 1/12/24/35/50/80 maximum life. Purchased healing and unrelated combat bounties retain their own rules.

Question selection is grade-first, mastery-aware, randomized within the suitable pool and excludes recent families and questionable content without AI calls. Missing or broken questions block advancement with retry and exit controls. Private answers stay in the parent, and only a validated five-answer score reaches the child. Session/round guards prevent repeated healing; permanent game progress is isolated by subject, account and preview grade.

Tests include real parent/iframe checkpoints, five-question grading, actual healing and boon damage, denied advancement, new profiles, protocol replay, SVG coverage and bounded combat effects.

## Release 2.1.2: Ground summoning circle

Cast places a detailed SVG inscription on the floor: concentric engraved rings, varied runes, cardinal anchors and a geometric central sigil. The boundary matches the spell’s reach and stays fixed while the inner rune bands counter-rotate. Scenery and combat actors render above the cast and its circular detonation. Reduced motion freezes the rune animation.
