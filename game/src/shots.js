// Screenshot staging for Bloomkeeper (?shot=start|play|end&seed=N).
// Composes deterministic scenes for the screenshot test suite.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

export function stageShot(name, world) {
  world.reset();

  if (name === 'start') {
    for (let i = 0; i < 30; i++) {
      world.step(STEP, { x: 0, y: 0 }, false, 0, false, true);
    }
    return { screen: SCREEN_TITLE, best: 0 };
  }

  if (name === 'play') {
    world.state.score = 12450;
    world.state.wave = 3;
    world.state.bloom = 70;
    world.state.combo = 2.5;
    // Step a bit to generate particles, moths, pollen
    for (let i = 0; i < 45; i++) {
      world.step(STEP, { x: 0.2, y: -0.1 }, true, 0.5, false, false);
    }
    return { screen: SCREEN_PLAY, best: 15200 };
  }

  if (name === 'end') {
    world.state.score = 28400;
    world.state.wave = 6;
    world.state.lives = 0;
    return { screen: SCREEN_OVER, best: 32000 };
  }

  // Fallback to start
  return { screen: SCREEN_TITLE, best: 0 };
}
