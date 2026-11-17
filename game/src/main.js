// Main entry point and game loop for Bloomkeeper.
// Manages the state machine (title, play, paused, over), input wiring, audio triggers, and screenshot mode.
import { BEST_KEY, LIVES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_BURST, EVENT_COLLECT, EVENT_HIT, EVENT_KILL, EVENT_OVER } from './world.js';
import { ACTION_BURST, ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { stageShot } from './shots.js';
import { audio, toggleMute, isMuted } from './audio.js';

const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // LocalStorage failure fallback
  }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.reset();
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce(`Bloomkeeper started. Wave 1. ${LIVES} lives.`);
  }

  function endGame() {
    screen = SCREEN_OVER;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`Game over. Final score ${world.state.score}. Best ${best}. Press R to play again.`);
  }

  function handleActions() {
    const actions = input.takeActions();

    if (actions & ACTION_MUTE) {
      const muted = toggleMute();
      announce(muted ? 'Muted.' : 'Unmuted.');
    }

    if (screen === SCREEN_TITLE) {
      if (actions & (ACTION_CONFIRM | ACTION_RESTART)) {
        startGame();
      }
    } else if (screen === SCREEN_PLAY) {
      if (actions & ACTION_PAUSE) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (actions & ACTION_BURST) {
        // Handled in step
      }
    } else if (screen === SCREEN_PAUSED) {
      if (actions & (ACTION_PAUSE | ACTION_CONFIRM)) {
        screen = SCREEN_PLAY;
        announce('Resumed.');
      }
    } else if (screen === SCREEN_OVER) {
      if (actions & (ACTION_CONFIRM | ACTION_RESTART)) {
        startGame();
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) {
      world.step(STEP, { x: 0, y: 0 }, false, 0, false, true);
      return;
    }

    const moveVec = input.vector();
    const firing = input.isFiring();
    const mouse = input.mouseCanvas();
    const rect = canvas.getBoundingClientRect();
    // Compute mouse angle relative to player screen position
    const scale = rect.width / 1280; // approximate view scale
    const playerScreenX = rect.left + world.state.player.x * scale;
    const playerScreenY = rect.top + world.state.player.y * scale;
    const mouseAngle = Math.atan2(mouse.y - playerScreenY, mouse.x - playerScreenX);

    const actions = input.takeActions();
    const wantBurst = (actions & ACTION_BURST) !== 0;

    const events = world.step(STEP, moveVec, firing, mouseAngle, wantBurst, false);

    if (events & EVENT_KILL) audio.fire();
    if (events & EVENT_COLLECT) audio.pickup();
    if (events & EVENT_BURST) audio.burst();
    if (events & EVENT_HIT) {
      audio.hit();
      announce(world.state.lives === 1 ? 'Hit! 1 life left.' : `Hit! ${world.state.lives} lives left.`);
    }
    if (events & EVENT_OVER) {
      endGame();
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;

    handleActions();

    if (screen === SCREEN_TITLE || screen === SCREEN_PLAY) {
      while (accumulator >= STEP && (screen === SCREEN_TITLE || screen === SCREEN_PLAY)) {
        step();
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }

    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Bloomkeeper. Press Space or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
