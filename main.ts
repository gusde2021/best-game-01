/**
 * Make.fun game bundle generator.
 * Copies static game assets and screenshots, then builds dossier.json.
 */

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

async function main(): Promise<void> {
  const baseDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
  const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

  console.log(`[makefun] Output directory resolved to: ${outputDir}`);

  console.log('[makefun] Initializing output directory...');
  mkdirSync(outputDir, { recursive: true });

  console.log('[makefun] Copying game/ directory...');
  const gameSrc = join(baseDir, 'game');
  const gameDest = join(outputDir, 'game');
  if (!existsSync(gameSrc)) {
    throw new Error(`Required game/ directory not found at ${gameSrc}`);
  }
  cpSync(gameSrc, gameDest, { recursive: true });

  console.log('[makefun] Copying screenshots/ directory...');
  const screenshotsSrc = join(baseDir, 'screenshots');
  const screenshotsDest = join(outputDir, 'screenshots');
  if (existsSync(screenshotsSrc)) {
    mkdirSync(screenshotsDest, { recursive: true });
    cpSync(screenshotsSrc, screenshotsDest, { recursive: true });
  } else {
    console.log('[makefun] No screenshots/ directory found, skipping screenshot copy.');
  }

  console.log('[makefun] Building dossier.json via makefun-game library...');
  const dossierBytes = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });

  const dossierPath = join(outputDir, 'dossier.json');
  writeFileSync(dossierPath, dossierBytes);
  console.log(`[makefun] Successfully wrote dossier.json to ${dossierPath}`);
}

main().catch((err) => {
  console.error('[makefun] Fatal error during dossier build:', err);
  process.exit(1);
});
