import { readFile, writeFile } from 'node:fs/promises';
import { marked } from 'marked';
import path from 'node:path';

const DIST = path.join(process.cwd(), 'dist');

const TEMPLATE = (title, body) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${title} — Verrocchio</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#2d5a2d">
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>
  body{max-width:680px;margin:40px auto;padding:0 16px;font-family:Lora,Georgia,serif;line-height:1.6;color:#1f2937;background:#f8f7f4}
  h1,h2,h3{font-family:'Playfair Display',Georgia,serif;color:#111827}
  a{color:#2d5a2d}
  code{background:#eef2e9;padding:1px 4px;border-radius:3px}
  table{border-collapse:collapse;margin:16px 0}
  td,th{border:1px solid #c6dfc6;padding:6px 10px;text-align:left}
</style>
</head>
<body>
${body}
<p style="margin-top:60px;font-size:11px;color:#6b7280;text-align:center">
  <a href="/">← Back to Verrocchio</a>
</p>
</body>
</html>`;

for (const [src, dst, title] of [
  ['docs/PRIVACY_POLICY.md', 'privacy.html', 'Privacy Policy'],
  ['docs/SUPPORT.md', 'support.html', 'Support']
]) {
  try {
    const md = await readFile(src, 'utf8');
    await writeFile(path.join(DIST, dst), TEMPLATE(title, marked.parse(md)));
    console.log(`[render-docs] ${src} → dist/${dst}`);
  } catch (e) {
    console.warn(`[render-docs] skip ${src}: ${e.message}`);
  }
}
