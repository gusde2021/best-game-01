// Renderer for Bloomkeeper.
// Draws deep indigo background with parallax star/petal field, entities with neon glow, HUD, and panels.
import { BLOOM, FIELD, FONT, LIVES, PALETTE } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

const PANEL = { width: 640, top: 140, line: 36, bottom: 80 };
const LIFE_SIZE = 24;
const LIFE_GAP = 10;

function cachedLabel(prefix) {
  let value = -1;
  let text = '';
  return function label(next) {
    if (next !== value) {
      value = next;
      text = prefix + next;
    }
    return text;
  };
}

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  const scoreLabel = cachedLabel('Score ');
  const waveLabel = cachedLabel('Wave ');
  const finalLabel = cachedLabel('Final Score: ');
  const bestLabel = cachedLabel('Best Score: ');

  // Parallax background particles (generated once)
  const bgParticles = [];
  for (let i = 0; i < 60; i++) {
    bgParticles.push({
      x: Math.random() * FIELD.width,
      y: Math.random() * FIELD.height,
      size: 1 + Math.random() * 3,
      speed: 10 + Math.random() * 25,
      alpha: 0.2 + Math.random() * 0.5,
    });
  }

  function resize() {
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  const fonts = new Map();
  function drawText(value, x, y, size, color, align) {
    if (!fonts.has(size)) fonts.set(size, `${size}px ${FONT}`);
    context.font = fonts.get(size);
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, y);
  }

  function drawField(state, dt = 0.016) {
    // Background
    context.fillStyle = PALETTE.sky;
    context.fillRect(0, 0, FIELD.width, FIELD.height);

    // Parallax background stars/petals
    for (const p of bgParticles) {
      p.y += p.speed * dt;
      if (p.y > FIELD.height) p.y = 0;
      context.fillStyle = `rgba(182, 251, 255, ${p.alpha})`;
      context.beginPath();
      context.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      context.fill();
    }

    // Bloom burst expanding ring
    if (state.burstRing) {
      context.save();
      context.strokeStyle = PALETTE.burstRing;
      context.lineWidth = 6;
      context.globalAlpha = state.burstRing.alpha;
      context.shadowBlur = 20;
      context.shadowColor = PALETTE.burstRing;
      context.beginPath();
      context.arc(state.burstRing.x, state.burstRing.y, state.burstRing.radius, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }

    // Pollen
    for (const p of state.pollenList) {
      if (!p.active) continue;
      context.save();
      context.fillStyle = PALETTE.pollen;
      context.shadowBlur = 12;
      context.shadowColor = PALETTE.pollenGlow;
      context.beginPath();
      context.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // Particles
    for (const pt of state.particles) {
      if (!pt.active) continue;
      context.save();
      context.fillStyle = pt.color;
      context.globalAlpha = Math.max(0, 1 - pt.life / pt.maxLife);
      context.beginPath();
      context.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // Bolts
    for (const b of state.bolts) {
      if (!b.active) continue;
      context.save();
      context.fillStyle = PALETTE.bolt;
      context.shadowBlur = 10;
      context.shadowColor = PALETTE.bolt;
      context.beginPath();
      context.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // Moths (dark petal-shaped polygons)
    for (const m of state.moths) {
      if (!m.active) continue;
      context.save();
      context.translate(m.x, m.y);
      context.rotate(m.angle);
      context.fillStyle = m.type === 'big' ? PALETTE.mothBig : PALETTE.mothSmall;
      context.shadowBlur = 14;
      context.shadowColor = PALETTE.mothCore;

      // Petal shape
      context.beginPath();
      context.moveTo(m.radius * 1.2, 0);
      context.bezierCurveTo(m.radius * 0.5, -m.radius, -m.radius * 0.8, -m.radius * 0.8, -m.radius, 0);
      context.bezierCurveTo(-m.radius * 0.8, m.radius * 0.8, m.radius * 0.5, m.radius, m.radius * 1.2, 0);
      context.fill();

      // Core glow
      context.fillStyle = PALETTE.mothCore;
      context.beginPath();
      context.arc(0, 0, m.radius * 0.35, 0, Math.PI * 2);
      context.fill();
      context.restore();
    }

    // Player (Glowing firefly guardian)
    const player = state.player;
    if (player.invulnerable === 0 || Math.floor(player.invulnerable * 15) % 2 === 1) {
      context.save();
      context.translate(player.x, player.y);
      context.rotate(player.angle);

      // Outer glow / halo
      context.fillStyle = PALETTE.playerGlow;
      context.shadowBlur = 20;
      context.shadowColor = PALETTE.playerGlow;
      context.beginPath();
      context.arc(0, 0, player.radius * 1.1, 0, Math.PI * 2);
      context.fill();

      // Core body
      context.fillStyle = PALETTE.playerCore;
      context.beginPath();
      context.ellipse(0, 0, player.radius, player.radius * 0.7, 0, 0, Math.PI * 2);
      context.fill();

      // Wings
      context.fillStyle = 'rgba(255, 255, 255, 0.6)';
      context.beginPath();
      context.ellipse(-4, -12, 10, 5, -0.3, 0, Math.PI * 2);
      context.ellipse(-4, 12, 10, 5, 0.3, 0, Math.PI * 2);
      context.fill();

      context.restore();
    }
  }

  function drawHud(state) {
    context.textBaseline = 'top';
    drawText(scoreLabel(state.score), 30, 20, 28, PALETTE.text, 'left');
    drawText(waveLabel(state.wave), FIELD.width / 2, 20, 28, PALETTE.text, 'center');

    // Bloom Meter Bar
    const barWidth = 220;
    const barHeight = 22;
    const barX = FIELD.width / 2 - barWidth / 2;
    const barY = 60;
    context.fillStyle = '#1b1d36';
    context.fillRect(barX, barY, barWidth, barHeight);
    const fillW = (state.bloom / BLOOM.max) * barWidth;
    context.fillStyle = state.bloom >= BLOOM.max ? PALETTE.accent : PALETTE.playerGlow;
    context.shadowBlur = state.bloom >= BLOOM.max ? 15 : 0;
    context.shadowColor = PALETTE.accent;
    context.fillRect(barX, barY, fillW, barHeight);
    context.shadowBlur = 0;
    context.strokeStyle = PALETTE.muted;
    context.lineWidth = 2;
    context.strokeRect(barX, barY, barWidth, barHeight);

    drawText(state.bloom >= BLOOM.max ? 'BLOOM BURST READY! (Shift/E)' : `Bloom: ${Math.floor(state.bloom)}%`, FIELD.width / 2, barY + 26, 16, state.bloom >= BLOOM.max ? PALETTE.accent : PALETTE.muted, 'center');

    // Combo indicator
    if (state.combo > 1) {
      drawText(`${state.combo.toFixed(1)}x COMBO`, 30, 60, 22, PALETTE.accent, 'left');
    }

    // Lives (glowing orbs)
    const firstLife = FIELD.width - 30 - LIVES * (LIFE_SIZE + LIFE_GAP) + LIFE_GAP;
    for (let life = 0; life < LIVES; life += 1) {
      context.fillStyle = life < state.lives ? PALETTE.playerGlow : '#2b2f50';
      if (life < state.lives) {
        context.shadowBlur = 10;
        context.shadowColor = PALETTE.playerGlow;
      }
      context.beginPath();
      context.arc(firstLife + life * (LIFE_SIZE + LIFE_GAP) + LIFE_SIZE / 2, 32 + LIFE_SIZE / 2, LIFE_SIZE / 2, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    }
  }

  function drawPanel(title, lines, prompt) {
    const height = PANEL.top + lines.length * PANEL.line + PANEL.bottom;
    const x = (FIELD.width - PANEL.width) / 2;
    const y = (FIELD.height - height) / 2;
    context.fillStyle = PALETTE.panel;
    context.shadowBlur = 30;
    context.shadowColor = '#000';
    context.fillRect(x, y, PANEL.width, height);
    context.shadowBlur = 0;
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 3;
    context.strokeRect(x, y, PANEL.width, height);

    context.textBaseline = 'alphabetic';
    drawText(title, FIELD.width / 2, y + 75, 48, PALETTE.text, 'center');
    for (let index = 0; index < lines.length; index += 1) {
      drawText(lines[index], FIELD.width / 2, y + PANEL.top + index * PANEL.line, 20, PALETTE.muted, 'center');
    }
    drawText(prompt, FIELD.width / 2, y + height - 40, 22, PALETTE.accent, 'center');
  }

  const TITLE_LINES = [
    'Guard the sanctuary from invading gloom moths.',
    'WASD / Arrows to move • Mouse to aim & shoot',
    'Shift or E: Bloom Burst • P: Pause • M: Mute',
    '',
  ];
  const PAUSED_LINES = ['The sanctuary rests while you pause.'];
  const OVER_LINES = ['', '', 'Press R to play again'];

  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.save();
    // Apply screen shake if active
    if (state.shake > 0) {
      const offsetX = (Math.random() - 0.5) * state.shake * 40;
      const offsetY = (Math.random() - 0.5) * state.shake * 40;
      context.translate(view.x + offsetX, view.y + offsetY);
    } else {
      context.translate(view.x, view.y);
    }
    context.scale(view.scale, view.scale);

    drawField(state);
    context.restore();

    if (screen === SCREEN_TITLE) {
      TITLE_LINES[3] = bestLabel(best);
      drawPanel('BLOOMKEEPER', TITLE_LINES, 'Click or press Enter to start');
      return;
    }

    drawHud(state);

    if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', PAUSED_LINES, 'Press P to resume');
    } else if (screen === SCREEN_OVER) {
      OVER_LINES[0] = finalLabel(state.score);
      OVER_LINES[1] = bestLabel(best);
      drawPanel('GAME OVER', OVER_LINES, 'Press R or Click to play again');
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw };
}
