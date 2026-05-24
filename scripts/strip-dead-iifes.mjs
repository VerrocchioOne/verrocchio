// scripts/strip-dead-iifes.mjs
//
// One-shot cleanup script. Finds every `false && (() => { ... })()`
// pattern in index.html and replaces it with just `false`. The original
// IIFE bodies are inert at runtime (V8 dead-strips them) but they bloat
// the file. This makes the actual deletion.
//
// Why `false` and not removing the slot: the IIFEs sit inside
// React.createElement argument lists. Removing the whole slot would
// shift downstream commas and risk a comma collision. Replacing the
// expression with `false` preserves the slot — React.createElement
// ignores `false` children.
//
// Strategy: plain string lexer with depth counting. Walk
// character-by-character. Track string/comment state and count `{`/`}`
// in code mode. When depth returns to 0 we expect `})()` — confirm and
// slice.
//
// Run:  node scripts/strip-dead-iifes.mjs
// After: re-run npm run test:unit && npm run test:e2e to verify.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "index.html");

const MARKER = "false && (() => {";
const SUFFIX = "})()";

function findDeadIifes(src) {
  const out = [];
  let i = 0;
  while (true) {
    const start = src.indexOf(MARKER, i);
    if (start === -1) break;
    const bodyOpenBraceIdx = src.indexOf("{", start + "false && (() =>".length);
    if (bodyOpenBraceIdx === -1) {
      throw new Error(`No '{' after marker at offset ${start}`);
    }
    const closeBraceIdx = findMatchingCloseBrace(src, bodyOpenBraceIdx);
    if (closeBraceIdx === -1) {
      throw new Error(`Unmatched '{' starting at offset ${bodyOpenBraceIdx}`);
    }
    const afterBrace = src.slice(closeBraceIdx, closeBraceIdx + SUFFIX.length);
    if (afterBrace !== SUFFIX) {
      throw new Error(
        `Expected '${SUFFIX}' at offset ${closeBraceIdx}, got '${afterBrace}'`
      );
    }
    const end = closeBraceIdx + SUFFIX.length;
    out.push({ start, end, length: end - start });
    i = end;
  }
  return out;
}

function findMatchingCloseBrace(src, openIdx) {
  let depth = 1;
  let i = openIdx + 1;
  let mode = "code";
  while (i < src.length && depth > 0) {
    const c = src[i];
    const next = src[i + 1];
    if (mode === "code") {
      if (c === "/" && next === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && next === "*") { mode = "block"; i += 2; continue; }
      if (c === "'") { mode = "sq"; i++; continue; }
      if (c === '"') { mode = "dq"; i++; continue; }
      if (c === "`") { mode = "tq"; i++; continue; }
      if (c === "{") depth++;
      else if (c === "}") {
        depth--;
        if (depth === 0) return i;
      }
      i++;
      continue;
    }
    if (mode === "line") {
      if (c === "\n") mode = "code";
      i++;
      continue;
    }
    if (mode === "block") {
      if (c === "*" && next === "/") { mode = "code"; i += 2; continue; }
      i++;
      continue;
    }
    if (mode === "sq" || mode === "dq" || mode === "tq") {
      if (c === "\\") { i += 2; continue; }
      if (mode === "sq" && c === "'") { mode = "code"; i++; continue; }
      if (mode === "dq" && c === '"') { mode = "code"; i++; continue; }
      if (mode === "tq" && c === "`") { mode = "code"; i++; continue; }
      i++;
      continue;
    }
  }
  return -1;
}

const src = fs.readFileSync(SRC, "utf8");
const matches = findDeadIifes(src);

console.log(`Found ${matches.length} dead IIFE(s).`);
for (const m of matches) {
  const startLine = src.slice(0, m.start).split("\n").length;
  const endLine = src.slice(0, m.end).split("\n").length;
  console.log(`  L${startLine}-L${endLine}: ${m.length} chars (${endLine - startLine + 1} lines)`);
}

if (matches.length === 0) {
  console.log("Nothing to do.");
  process.exit(0);
}

let out = src;
const reversed = [...matches].reverse();
for (const m of reversed) {
  out = out.slice(0, m.start) + "false" + out.slice(m.end);
}

const before = src.split("\n").length;
const after = out.split("\n").length;
console.log(`Lines: ${before} -> ${after} (removed ${before - after}).`);

fs.writeFileSync(SRC, out);
console.log(`Wrote ${SRC}.`);
