// Screenshot staging for Bloomkeeper (?shot=start|play|end&seed=N).
// Composes deterministic scenes for the screenshot test suite.
import { FIELD, PLAYER, PALETTE, STEP } from './config.js';
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

    // Reset entities
    for (const m of world.state.moths) m.active = false;
    for (const b of world.state.bolts) b.active = false;
    for (const p of world.state.pollenList) p.active = false;
    for (const pt of world.state.particles) pt.active = false;

    const player = world.state.player;
    player.x = FIELD.width / 2;
    player.y = FIELD.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 0;
    player.fireTimer = 0;

    const mothConfigs = [
      { type: 'big', x: 0.25 * FIELD.width, y: 0.30 * FIELD.height, radius: 32, hp: 2, maxHp: 3 },
      { type: 'big', x: 0.75 * FIELD.width, y: 0.30 * FIELD.height, radius: 32, hp: 3, maxHp: 3 },
      { type: 'big', x: 0.50 * FIELD.width, y: 0.75 * FIELD.height, radius: 32, hp: 1, maxHp: 3 },
      { type: 'small', x: 0.20 * FIELD.width, y: 0.70 * FIELD.height, radius: 18, hp: 1, maxHp: 1 },
      { type: 'small', x: 0.80 * FIELD.width, y: 0.70 * FIELD.height, radius: 18, hp: 1, maxHp: 1 },
      { type: 'small', x: 0.35 * FIELD.width, y: 0.20 * FIELD.height, radius: 18, hp: 1, maxHp: 1 },
      { type: 'small', x: 0.65 * FIELD.width, y: 0.20 * FIELD.height, radius: 18, hp: 1, maxHp: 1 },
    ];

    for (let i = 0; i < mothConfigs.length; i++) {
      const cfg = mothConfigs[i];
      const m = world.state.moths[i];
      m.active = true;
      m.type = cfg.type;
      m.x = cfg.x;
      m.y = cfg.y;
      m.radius = cfg.radius;
      m.hp = cfg.hp;
      m.maxHp = cfg.maxHp;
      m.angle = Math.atan2(player.y - m.y, player.x - m.x);
      m.vx = 0;
      m.vy = 0;
    }

    const targetMoth = world.state.moths[2];
    player.angle = Math.atan2(targetMoth.y - player.y, targetMoth.x - player.x);

    const boltAngle = player.angle;
    for (let i = 0; i < 3; i++) {
      const b = world.state.bolts[i];
      b.active = true;
      const distFromPlayer = 30 + i * 40;
      b.x = player.x + Math.cos(boltAngle) * distFromPlayer;
      b.y = player.y + Math.sin(boltAngle) * distFromPlayer;
      b.vx = Math.cos(boltAngle) * PLAYER.boltSpeed;
      b.vy = Math.sin(boltAngle) * PLAYER.boltSpeed;
      b.radius = 6;
    }

    const pollenOffsets = [
      { dx: -70, dy: -40 },
      { dx: -30, dy: -80 },
      { dx: 40, dy: -60 },
      { dx: 70, dy: -20 },
      { dx: 10, dy: -30 },
    ];
    for (let i = 0; i < pollenOffsets.length; i++) {
      const p = world.state.pollenList[i];
      p.active = true;
      p.x = player.x + pollenOffsets[i].dx;
      p.y = player.y + pollenOffsets[i].dy;
      p.vx = 0;
      p.vy = 0;
      p.radius = 12;
      p.value = 15;
    }

    for (let i = 0; i < 10; i++) {
      const pt = world.state.particles[i];
      pt.active = true;
      const angle = (i / 10) * Math.PI * 2;
      pt.x = targetMoth.x + Math.cos(angle) * 12;
      pt.y = targetMoth.y + Math.sin(angle) * 12;
      const speed = 40 + (i % 3) * 20;
      pt.vx = Math.cos(angle) * speed;
      pt.vy = Math.sin(angle) * speed;
      pt.color = PALETTE.bolt;
      pt.size = 3 + (i % 3);
      pt.life = 0;
      pt.maxLife = 0.4;
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
