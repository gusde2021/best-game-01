// Game simulation and rules for Bloomkeeper.
// Manages player, moths, bolts, pollen, particles, waves, collisions, scoring, bloom meter, and combo.
import { BLOOM, FIELD, LIVES, PALETTE, PLAYER, STEP } from './config.js';

export const EVENT_HIT = 1;
export const EVENT_COLLECT = 2;
export const EVENT_BURST = 4;
export const EVENT_OVER = 8;
export const EVENT_KILL = 16;

const POOL_MOTHS = 120;
const POOL_BOLTS = 64;
const POOL_POLLEN = 120;
const POOL_PARTICLES = 160;

function overlaps(a, b) {
  return a.x - a.radius < b.x + b.radius &&
         a.x + a.radius > b.x - b.radius &&
         a.y - a.radius < b.y + b.radius &&
         a.y + a.radius > b.y - b.radius;
}

export function createWorld(random) {
  const player = {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    radius: PLAYER.width / 2,
    angle: 0,
    invulnerable: 0,
    fireTimer: 0,
  };

  const moths = [];
  for (let i = 0; i < POOL_MOTHS; i++) {
    moths.push({ active: false, type: 'small', x: 0, y: 0, vx: 0, vy: 0, radius: 18, hp: 1, maxHp: 1, angle: 0 });
  }

  const bolts = [];
  for (let i = 0; i < POOL_BOLTS; i++) {
    bolts.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 6 });
  }

  const pollenList = [];
  for (let i = 0; i < POOL_POLLEN; i++) {
    pollenList.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, radius: 12, value: 10 });
  }

  const particles = [];
  for (let i = 0; i < POOL_PARTICLES; i++) {
    particles.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, color: '#fff', size: 4, life: 0, maxLife: 1 });
  }

  const state = {
    player,
    moths,
    bolts,
    pollenList,
    particles,
    score: 0,
    lives: LIVES,
    wave: 1,
    bloom: 0,
    combo: 1,
    comboTimer: 0,
    mothsToSpawn: 0,
    mothsRemaining: 0,
    spawnTimer: 0,
    shake: 0,
    burstRing: null, // { x, y, radius, maxRadius, alpha }
  };

  function reset() {
    player.x = FIELD.width / 2;
    player.y = FIELD.height / 2;
    player.vx = 0;
    player.vy = 0;
    player.invulnerable = 0;
    player.fireTimer = 0;

    for (const m of moths) m.active = false;
    for (const b of bolts) b.active = false;
    for (const p of pollenList) p.active = false;
    for (const pt of particles) pt.active = false;

    state.score = 0;
    state.lives = LIVES;
    state.wave = 1;
    state.bloom = 0;
    state.combo = 1;
    state.comboTimer = 0;
    state.shake = 0;
    state.burstRing = null;
    startWave(1);
  }

  function startWave(w) {
    state.wave = w;
    state.mothsToSpawn = 4 + w * 3;
    state.mothsRemaining = state.mothsToSpawn;
    state.spawnTimer = 0.5;
  }

  function spawnMoth(forceType = null) {
    const m = moths.find((item) => !item.active);
    if (!m) return;
    m.active = true;
    const isBig = forceType ? forceType === 'big' : (random() < Math.min(0.5, 0.15 + state.wave * 0.05));
    m.type = isBig ? 'big' : 'small';
    m.radius = isBig ? 32 : 18;
    m.maxHp = isBig ? 3 : 1;
    m.hp = m.maxHp;

    // Spawn at random edges
    const edge = Math.floor(random() * 4);
    if (edge === 0) {
      m.x = random() * FIELD.width;
      m.y = -40;
    } else if (edge === 1) {
      m.x = FIELD.width + 40;
      m.y = random() * FIELD.height;
    } else if (edge === 2) {
      m.x = random() * FIELD.width;
      m.y = FIELD.height + 40;
    } else {
      m.x = -40;
      m.y = random() * FIELD.height;
    }
  }

  function spawnBolt(x, y, angle) {
    const b = bolts.find((item) => !item.active);
    if (!b) return;
    b.active = true;
    b.x = x;
    b.y = y;
    b.vx = Math.cos(angle) * PLAYER.boltSpeed;
    b.vy = Math.sin(angle) * PLAYER.boltSpeed;
  }

  function spawnPollen(x, y, amount = 1) {
    for (let i = 0; i < amount; i++) {
      const p = pollenList.find((item) => !item.active);
      if (!p) break;
      p.active = true;
      p.x = x + (random() - 0.5) * 20;
      p.y = y + (random() - 0.5) * 20;
      const angle = random() * Math.PI * 2;
      const speed = 40 + random() * 80;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.value = 15;
    }
  }

  function spawnParticles(x, y, color, count = 8, speedRange = 120) {
    for (let i = 0; i < count; i++) {
      const pt = particles.find((item) => !item.active);
      if (!pt) break;
      pt.active = true;
      pt.x = x;
      pt.y = y;
      const angle = random() * Math.PI * 2;
      const speed = 20 + random() * speedRange;
      pt.vx = Math.cos(angle) * speed;
      pt.vy = Math.sin(angle) * speed;
      pt.color = color;
      pt.size = 3 + random() * 4;
      pt.life = 0;
      pt.maxLife = 0.3 + random() * 0.4;
    }
  }

  function triggerBurst() {
    if (state.bloom < BLOOM.max) return false;
    state.bloom = 0;
    player.invulnerable = Math.max(player.invulnerable, BLOOM.burstInvuln);
    state.shake = 0.4;
    state.burstRing = { x: player.x, y: player.y, radius: 10, maxRadius: BLOOM.burstRadius, alpha: 1.0 };

    let destroyed = 0;
    for (const m of moths) {
      if (!m.active) continue;
      const dist = Math.hypot(m.x - player.x, m.y - player.y);
      if (dist < BLOOM.burstRadius) {
        m.active = false;
        destroyed++;
        state.mothsRemaining = Math.max(0, state.mothsRemaining - 1);
        spawnPollen(m.x, m.y, m.type === 'big' ? 3 : 1);
        spawnParticles(m.x, m.y, PALETTE.burstRing, 12, 180);
      }
    }
    state.score += destroyed * 100 * state.combo;
    return true;
  }

  function step(dt, inputVector, isFiring, mouseAngle, wantBurst, harmless) {
    let events = 0;

    // Screen shake decay
    if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);

    // Burst ring decay
    if (state.burstRing) {
      state.burstRing.radius += dt * 900;
      state.burstRing.alpha = Math.max(0, 1 - state.burstRing.radius / state.burstRing.maxRadius);
      if (state.burstRing.radius >= state.burstRing.maxRadius) state.burstRing.active = false;
    }

    // Combo timer decay
    if (state.comboTimer > 0) {
      state.comboTimer -= dt;
      if (state.comboTimer <= 0) {
        state.combo = 1;
      }
    }

    // Player invulnerability
    if (player.invulnerable > 0) {
      player.invulnerable = Math.max(0, player.invulnerable - dt);
    }

    if (!harmless) {
      // Player movement
      player.vx = inputVector.x * PLAYER.speed;
      player.vy = inputVector.y * PLAYER.speed;
      player.x = Math.min(FIELD.width - player.radius, Math.max(player.radius, player.x + player.vx * dt));
      player.y = Math.min(FIELD.height - player.radius, Math.max(player.radius, player.y + player.vy * dt));

      player.angle = mouseAngle;

      // Firing bolts
      player.fireTimer -= dt;
      if (isFiring && player.fireTimer <= 0) {
        player.fireTimer = PLAYER.fireRate;
        spawnBolt(player.x + Math.cos(player.angle) * 20, player.y + Math.sin(player.angle) * 20, player.angle);
        events |= EVENT_KILL;
      }

      if (wantBurst) {
        if (triggerBurst()) {
          events |= EVENT_BURST;
        }
      }

      // Spawning waves
      if (state.mothsRemaining <= 0) {
        startWave(state.wave + 1);
      } else if (state.mothsToSpawn > 0) {
        state.spawnTimer -= dt;
        if (state.spawnTimer <= 0) {
          spawnMoth();
          state.mothsToSpawn--;
          state.spawnTimer = Math.max(0.2, 1.2 - state.wave * 0.08);
        }
      }
    }

    // Update bolts
    for (const b of bolts) {
      if (!b.active) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < 0 || b.x > FIELD.width || b.y < 0 || b.y > FIELD.height) {
        b.active = false;
        continue;
      }

      // Check bolt vs moth collision
      for (const m of moths) {
        if (!m.active) continue;
        if (Math.hypot(b.x - m.x, b.y - m.y) < m.radius + b.radius) {
          b.active = false;
          m.hp--;
          spawnParticles(b.x, b.y, PALETTE.bolt, 4, 60);
          if (m.hp <= 0) {
            m.active = false;
            state.mothsRemaining = Math.max(0, state.mothsRemaining - 1);
            spawnPollen(m.x, m.y, m.type === 'big' ? 3 : 1);
            spawnParticles(m.x, m.y, PALETTE.mothCore, 10, 140);
            state.score += (m.type === 'big' ? 300 : 100) * state.combo;
            events |= EVENT_KILL;

            // Big moth splits into 2 small moths
            if (m.type === 'big') {
              for (let i = 0; i < 2; i++) {
                const sm = moths.find((item) => !item.active);
                if (sm) {
                  sm.active = true;
                  sm.type = 'small';
                  sm.radius = 18;
                  sm.maxHp = 1;
                  sm.hp = 1;
                  sm.x = m.x + (random() - 0.5) * 30;
                  sm.y = m.y + (random() - 0.5) * 30;
                }
              }
              state.mothsRemaining += 2;
            }
          }
          break;
        }
      }
    }

    // Update moths
    for (const m of moths) {
      if (!m.active) continue;
      // Seek player
      const angleToPlayer = Math.atan2(player.y - m.y, player.x - m.x);
      const speed = (m.type === 'big' ? 140 : 210) + state.wave * 12;
      m.vx = Math.cos(angleToPlayer) * speed;
      m.vy = Math.sin(angleToPlayer) * speed;
      m.x += m.vx * dt;
      m.y += m.vy * dt;
      m.angle = angleToPlayer;

      // Check moth vs player collision
      if (!harmless && player.invulnerable === 0 && overlaps(m, player)) {
        state.lives--;
        player.invulnerable = PLAYER.invulnerableTime;
        state.shake = 0.3;
        spawnParticles(player.x, player.y, PALETTE.playerGlow, 15, 160);
        events |= EVENT_HIT;
        if (state.lives <= 0) {
          events |= EVENT_OVER;
        }
      }
    }

    // Update pollen
    for (const p of pollenList) {
      if (!p.active) continue;
      const dist = Math.hypot(player.x - p.x, player.y - p.y);
      if (!harmless && dist < 180) {
        const pullAngle = Math.atan2(player.y - p.y, player.x - p.x);
        p.vx += Math.cos(pullAngle) * 400 * dt;
        p.vy += Math.sin(pullAngle) * 400 * dt;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.95;
      p.vy *= 0.95;

      if (!harmless && dist < player.radius + p.radius) {
        p.active = false;
        state.bloom = Math.min(BLOOM.max, state.bloom + p.value);
        state.combo = Math.min(10, state.combo + 0.5);
        state.comboTimer = 5.0;
        state.score += 50 * Math.floor(state.combo);
        spawnParticles(p.x, p.y, PALETTE.pollen, 6, 80);
        events |= EVENT_COLLECT;
      }
    }

    // Update particles
    for (const pt of particles) {
      if (!pt.active) continue;
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life += dt;
      if (pt.life >= pt.maxLife) {
        pt.active = false;
      }
    }

    return events;
  }

  reset();
  return { state, reset, step, triggerBurst };
}
