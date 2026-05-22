#!/usr/bin/env node
// Cross-platform static-file dev server. Equivalent to serve.ps1 in
// behavior — same port, same content-type table, same "/" → index.html
// fallback — but runs on any OS with Node installed (Linux CI runners
// don't have PowerShell, which made the original webServer command
// `powershell -ExecutionPolicy Bypass -File ./serve.ps1` fail with
// "/bin/sh: 1: powershell: not found" on GitHub Actions).
//
// Used by:
//   • playwright.config.js webServer (CI + local Playwright runs)
//   • Local browser-test workflow: `node scripts/serve.mjs` from repo root
//
// serve.ps1 is kept around because the user's local Windows dev loop
// has muscle memory for `.\serve.ps1`. Both serve the same content.

import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT = resolve(fileURLToPath(import.meta.url), '..', '..');

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.htm':   'text/html; charset=utf-8',
  '.js':    'application/javascript; charset=utf-8',
  '.mjs':   'application/javascript; charset=utf-8',
  '.css':   'text/css; charset=utf-8',
  '.json':  'application/json; charset=utf-8',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.webp':  'image/webp',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.map':   'application/json; charset=utf-8',
  '.txt':   'text/plain; charset=utf-8'
};

const server = createServer(async (req, res) => {
  try {
    // Strip query string + decode URL.
    const url = new URL(req.url, `http://localhost:${PORT}`);
    let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    if (rel === '' || rel === '/') rel = 'index.html';

    // Path-traversal guard: resolve and confirm the final path is
    // still inside ROOT. `..` in the URL or symlinks pointing outside
    // would otherwise let a request read arbitrary files on the
    // CI runner. Throws 403 if the resolved path escapes ROOT.
    const requested = resolve(ROOT, rel);
    if (!requested.startsWith(ROOT + sep) && requested !== ROOT) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }

    let info;
    try {
      info = await stat(requested);
    } catch {
      res.statusCode = 404;
      res.end(`Not found: ${rel}`);
      return;
    }
    if (info.isDirectory()) {
      res.statusCode = 404;
      res.end(`Not found: ${rel}`);
      return;
    }

    const ext = extname(requested).toLowerCase();
    const ct = MIME[ext] || 'application/octet-stream';
    const buf = await readFile(requested);
    res.statusCode = 200;
    res.setHeader('Content-Type', ct);
    res.setHeader('Content-Length', buf.length);
    res.end(buf);
  } catch (err) {
    res.statusCode = 500;
    res.end(`Server error: ${err && err.message ? err.message : err}`);
  }
});

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} on http://localhost:${PORT}/`);
});
