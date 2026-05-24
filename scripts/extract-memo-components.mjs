// scripts/extract-memo-components.mjs
//
// One-shot batch extraction. Finds the remaining module-scope
// `const X = React.memo(function X(...) { ... });` declarations in
// index.html and pulls each into its own lib/components/X.js file
// (IIFE-wrapped, dual-load) plus replaces the inline def with a
// `const X = window.X;` alias.
//
// Skips:
//   - Components already extracted (Sparkline14, A11yDialog).
//   - HabitCardShell (3 LOC, not worth its own file).
//   - RadarChart (depends on lazy-loaded Chart.js; needs careful handling).
//
// Strategy: same string lexer with brace counting used in
// strip-dead-iifes.mjs.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.resolve(ROOT, "index.html");

const TARGETS = [
  "WeekDots",
  "StreakChain",
  "SproutAvatar",
  "MomentumArrow",
  "YearHeatmap",
  "AchievementBadge",
  "CompletionWave"
];

function findBlock(src, name) {
  const marker = `const ${name} = React.memo(function ${name}`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Marker not found for ${name}`);
  // Skip past the function signature parens `(...)` first, then find
  // the function body's `{`. The destructured-param brace `({ ... })`
  // would otherwise be mistaken for the body open.
  const paramOpen = src.indexOf("(", start + marker.length);
  if (paramOpen === -1) throw new Error(`No '(' for params of ${name}`);
  let pd = 1, p = paramOpen + 1;
  while (p < src.length && pd > 0) {
    if (src[p] === "(") pd++;
    else if (src[p] === ")") pd--;
    p++;
  }
  // p is now just past the closing `)` of the param list.
  const bodyOpen = src.indexOf("{", p);
  if (bodyOpen === -1) throw new Error(`No '{' after params of ${name}`);
  const bodyClose = findMatchingCloseBrace(src, bodyOpen);
  if (bodyClose === -1) throw new Error(`Unmatched body brace for ${name}`);

  // After the function body ends we are still inside React.memo( ... ).
  // Walk forward until the outer paren of React.memo closes, then expect ';'.
  let depth = 1;
  let i = bodyClose + 1;
  let mode = "code";
  while (i < src.length) {
    const c = src[i];
    const next = src[i + 1];
    if (mode === "code") {
      if (c === "/" && next === "/") { mode = "line"; i += 2; continue; }
      if (c === "/" && next === "*") { mode = "block"; i += 2; continue; }
      if (c === "'") { mode = "sq"; i++; continue; }
      if (c === '"') { mode = "dq"; i++; continue; }
      if (c === "`") { mode = "tq"; i++; continue; }
      if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === "(") depth++;
      else if (c === ")") {
        depth--;
        if (depth === 0) {
          let j = i + 1;
          while (j < src.length && /\s/.test(src[j])) j++;
          if (src[j] === ";") return { start, end: j + 1 };
          throw new Error(`Expected ';' after closing ')' for ${name} at offset ${i}`);
        }
      }
      i++; continue;
    }
    if (mode === "line") { if (c === "\n") mode = "code"; i++; continue; }
    if (mode === "block") {
      if (c === "*" && next === "/") { mode = "code"; i += 2; continue; }
      i++; continue;
    }
    if (mode === "sq" || mode === "dq" || mode === "tq") {
      if (c === "\\") { i += 2; continue; }
      if (mode === "sq" && c === "'") { mode = "code"; i++; continue; }
      if (mode === "dq" && c === '"') { mode = "code"; i++; continue; }
      if (mode === "tq" && c === "`") { mode = "code"; i++; continue; }
      i++; continue;
    }
  }
  throw new Error(`Could not find React.memo close for ${name}`);
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
      else if (c === "}") { depth--; if (depth === 0) return i; }
      i++; continue;
    }
    if (mode === "line") { if (c === "\n") mode = "code"; i++; continue; }
    if (mode === "block") {
      if (c === "*" && next === "/") { mode = "code"; i += 2; continue; }
      i++; continue;
    }
    if (mode === "sq" || mode === "dq" || mode === "tq") {
      if (c === "\\") { i += 2; continue; }
      if (mode === "sq" && c === "'") { mode = "code"; i++; continue; }
      if (mode === "dq" && c === '"') { mode = "code"; i++; continue; }
      if (mode === "tq" && c === "`") { mode = "code"; i++; continue; }
      i++; continue;
    }
  }
  return -1;
}

function wrapForModule(name, body) {
  return `// lib/components/${name}.js
//
// ${name} React.memo component. Extracted from index.html (Wave 2.3)
// per the 1000-line file-size rule.
//
// Dual-loaded (browser <script> global + Node CJS export). Depends on
// React (UMD global, loaded earlier in head) and any helpers/constants
// referenced via global scope (utils.js).

(function () {
  "use strict";
  if (typeof window === "undefined" || !window.React) return;

  ${body.trim()}

  window.${name} = ${name};
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { ${name} };
  }
})();
`;
}

const src = fs.readFileSync(SRC, "utf8");
const blocks = [];
for (const name of TARGETS) {
  blocks.push({ name, ...findBlock(src, name) });
}
blocks.sort((a, b) => a.start - b.start);

console.log(`Found ${blocks.length} component blocks:`);
for (const b of blocks) {
  const startLine = src.slice(0, b.start).split("\n").length;
  const endLine = src.slice(0, b.end).split("\n").length;
  console.log(`  ${b.name}: L${startLine}-L${endLine} (${b.end - b.start} chars)`);
}

const compDir = path.resolve(ROOT, "lib", "components");
fs.mkdirSync(compDir, { recursive: true });
for (const b of blocks) {
  const body = src.slice(b.start, b.end);
  const out = wrapForModule(b.name, body);
  const outPath = path.join(compDir, `${b.name}.js`);
  fs.writeFileSync(outPath, out);
  console.log(`  wrote ${outPath}`);
}

let cleaned = src;
const reversed = [...blocks].reverse();
for (const b of reversed) {
  const alias = `// ${b.name} extracted to lib/components/${b.name}.js (Wave 2.3).\nconst ${b.name} = window.${b.name};`;
  cleaned = cleaned.slice(0, b.start) + alias + cleaned.slice(b.end);
}

const insertAfter = '<script src="./lib/components/A11yDialog.js"></script>';
const idx = cleaned.indexOf(insertAfter);
if (idx === -1) throw new Error("Could not find A11yDialog script tag");
const newTags = blocks
  .map(b => `<script src="./lib/components/${b.name}.js"></script>`)
  .join("\n");
cleaned = cleaned.slice(0, idx + insertAfter.length) + "\n" + newTags + cleaned.slice(idx + insertAfter.length);

const beforeLines = src.split("\n").length;
const afterLines = cleaned.split("\n").length;
console.log(`index.html lines: ${beforeLines} -> ${afterLines} (delta ${afterLines - beforeLines})`);

fs.writeFileSync(SRC, cleaned);
console.log("Wrote index.html");
