// Keyboard and pointer input for Bloomkeeper.
// Tracks movement directions, aim angle via mouse, and action flags.

export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_BURST = 4;
export const ACTION_MUTE = 8;
export const ACTION_RESTART = 16;

const UP = new Set(['ArrowUp', 'KeyW']);
const DOWN = new Set(['ArrowDown', 'KeyS']);
const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);

const CONFIRM = new Set(['Space', 'Enter']);
const PAUSE = new Set(['KeyP', 'Escape']);
const BURST = new Set(['ShiftLeft', 'ShiftRight', 'KeyE']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);

export function createInput(canvas) {
  let up = false;
  let down = false;
  let left = false;
  let right = false;
  let firing = false;
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;
  let actions = 0;

  window.addEventListener('keydown', (event) => {
    if (UP.has(event.code)) up = true;
    else if (DOWN.has(event.code)) down = true;
    else if (LEFT.has(event.code)) left = true;
    else if (RIGHT.has(event.code)) right = true;
    else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
    } else if (PAUSE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_PAUSE;
    } else if (BURST.has(event.code)) {
      if (!event.repeat) actions |= ACTION_BURST;
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
    } else return;
    event.preventDefault();
  });

  window.addEventListener('keyup', (event) => {
    if (UP.has(event.code)) up = false;
    else if (DOWN.has(event.code)) down = false;
    else if (LEFT.has(event.code)) left = false;
    else if (RIGHT.has(event.code)) right = false;
  });

  window.addEventListener('blur', () => {
    up = false;
    down = false;
    left = false;
    right = false;
    firing = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    firing = true;
    actions |= ACTION_CONFIRM;
  });

  canvas.addEventListener('pointerup', () => {
    firing = false;
  });

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = event.clientX - rect.left;
    mouseY = event.clientY - rect.top;
  });

  return {
    vector() {
      const x = (right ? 1 : 0) - (left ? 1 : 0);
      const y = (down ? 1 : 0) - (up ? 1 : 0);
      const len = Math.hypot(x, y);
      if (len > 0) return { x: x / len, y: y / len };
      return { x: 0, y: 0 };
    },
    isFiring() {
      return firing;
    },
    mouseCanvas() {
      return { x: mouseX, y: mouseY };
    },
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    trigger(flag) {
      actions |= flag;
    }
  };
}
