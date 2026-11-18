# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/gusde2021/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/gusde2021/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

BLOOMKEEPER is an original canvas arena game - pilot a firefly guardian, blast Gloom Moths, gather pollen to charge the Bloom Burst, and survive escalating waves.

## How to Play

- **Controls:**
  - **Move:** WASD or Arrow Keys
  - **Aim:** Mouse
  - **Fire:** Click or Space
  - **Bloom Burst:** Shift or E (when the pollen meter is full)
  - **Pause / Mute / Restart:** P, M, R
- **Mechanics:** Manage your lives, build up your combo multiplier, and survive increasingly challenging waves of Gloom Moths.

## Run it

```sh
node serve.ts
```

Then open `http://localhost:8080` in your browser (static files under `game/`, no build step, no network required).

## Architecture & Layout

- `main.ts`: Entry script that copies `game/` and `screenshots/` and generates `dossier.json`.
- `game/src/` module map:
  - `config.js`: Game tuning parameters and constants.
  - `input.js`: Keyboard and mouse event handlers.
  - `audio.js`: Web Audio API sound effects and ambient synth.
  - `world.js`: Entity management, collision detection, and wave escalation.
  - `render.js`: Canvas rendering engine.
  - `shots.js`: Screenshot scene generator (`?shot=` scenes).
  - `main.js`: Game loop and orchestration.
- `screenshots/`: Real renders captured from game scenes (`1-start.jpg`, `2-play.jpg`, `3-end.jpg`).

## License

MIT License.

---

<sub>Entered on [make.fun](https://make.fun/?ref=9UreHffHnNFKPEc27LRb3tguq2QesRQ7P998xkC4Woz&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
