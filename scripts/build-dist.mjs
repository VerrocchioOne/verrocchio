import { mkdir, copyFile, rm, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const SRC = process.cwd();
const DIST = path.join(SRC, 'dist');
const FILES = [
  'index.html',
  'home.html',
  'utils.js',
  'manifest.json',
  'service-worker.js',
  'splash-animation.html',
  'apple-touch-icon-1024.png',
  'apple-touch-icon-180.png',
  'apple-touch-icon-167.png',
  'apple-touch-icon-152.png',
  'apple-touch-icon-120.png',
  'apple-touch-icon-87.png',
  'apple-touch-icon-80.png',
  'apple-touch-icon-60.png',
  'apple-touch-icon-58.png',
  'apple-touch-icon-40.png',
  'apple-touch-icon-29.png',
  'apple-touch-icon-192.png',
  'apple-touch-icon-512.png'
];

if (existsSync(DIST)) await rm(DIST, { recursive: true });
await mkdir(DIST, { recursive: true });

for (const f of FILES) {
  const src = path.join(SRC, f);
  if (!existsSync(src)) { console.warn('[build-dist] skip missing:', f); continue; }
  await copyFile(src, path.join(DIST, f));
}

// Demo password env substitution (W1-T7)
const demoPw = process.env.DEMO_PASSWORD;
if (!demoPw) {
  console.warn('[build-dist] DEMO_PASSWORD env not set — dist/index.html retains %%DEMO_PASSWORD%% placeholder. Set before publishing.');
} else {
  const idx = path.join(DIST, 'index.html');
  let html = await readFile(idx, 'utf8');
  html = html.replace('%%DEMO_PASSWORD%%', demoPw);
  await writeFile(idx, html);
  console.log('[build-dist] demo password substituted');
}

console.log('[build-dist] dist/ built with', FILES.length, 'allowlisted files');
