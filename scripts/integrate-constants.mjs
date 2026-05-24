// scripts/integrate-constants.mjs
//
// One-shot Wave 3 integration. lib/constants.js already exists with
// IMP, HT, SECTIONS, DURS, FREQ, DUR_MIN/MAX/STEP, I, IS, S, AB.
// This script:
//   1. Adds `<script src="./lib/constants.js">` to index.html head.
//   2. Deletes the inline definitions of those same identifiers.
//
// Classic-script semantics: const/let in a classic <script src> file
// live in the shared "script scope" visible to every other classic
// script on the page (including the inline body script and any
// functions inside it, like App()). So no aliasing is needed — once
// the inline def is removed, references resolve to the global.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, "..", "index.html");

let src = fs.readFileSync(SRC, "utf8");

const tagAnchor = '<script src="./lib/components/CompletionWave.js"></script>';
if (!src.includes(tagAnchor)) throw new Error("Could not find component anchor tag");
if (src.includes('lib/constants.js"')) {
  console.log("Script tag already present — skipping insert.");
} else {
  src = src.replace(
    tagAnchor,
    tagAnchor + '\n<!-- Wave 3 — App-scope constants extracted to lib/constants.js -->\n<script src="./lib/constants.js"></script>'
  );
}

function endOfBlock(src, lineStart) {
  const lines = src.split("\n");
  let depth = 0, started = false;
  for (let i = lineStart - 1; i < lines.length; i++) {
    const l = lines[i];
    for (const c of l) {
      if (c === "[" || c === "{") { depth++; started = true; }
      else if (c === "]" || c === "}") {
        depth--;
        if (started && depth === 0) return i + 1;
      }
    }
  }
  throw new Error(`Unmatched open at line ${lineStart}`);
}

function lineOffset(src, n) {
  if (n === 1) return 0;
  let i = 0, count = 1;
  while (i < src.length && count < n) {
    if (src[i] === "\n") count++;
    i++;
  }
  return i;
}

const moduleAnchors = [
  { name: "IMP",      anchor: "const IMP = [{" },
  { name: "HT",       anchor: "const HT = [{" },
  { name: "SECTIONS", anchor: "const SECTIONS = [{" },
  { name: "DURS",     anchor: "const DURS = [" },
  { name: "FREQ",     anchor: "const FREQ = [" },
];

const exactDeletes = [
  "  const DUR_MIN = 0, DUR_MAX = 720, DUR_STEP = 5;\n",
];

const indentedAnchors = [
  { name: "I",  anchor: "  const I = {" },
  { name: "IS", anchor: "  const IS = {" },
  { name: "S",  anchor: "  const S = {" },
  { name: "AB", anchor: "  const AB = {" },
];

function deleteBlockByAnchor(src, anchor) {
  const idx = src.indexOf(anchor);
  if (idx === -1) {
    return { src, changed: false };
  }
  const upTo = src.slice(0, idx);
  const lineStart = upTo.split("\n").length;
  const lineEnd = endOfBlock(src, lineStart);
  const byteStart = lineOffset(src, lineStart);
  const byteEnd = lineOffset(src, lineEnd + 1);
  console.log(`  delete L${lineStart}-L${lineEnd} (${anchor.slice(0, 40)}...)`);
  return { src: src.slice(0, byteStart) + src.slice(byteEnd), changed: true };
}

const allAnchors = [...moduleAnchors, ...indentedAnchors];
// Apply iteratively; each deletion shifts offsets but we re-find by anchor each pass.
for (const a of allAnchors) {
  const result = deleteBlockByAnchor(src, a.anchor);
  src = result.src;
  if (!result.changed) console.log(`(skip) ${a.name}`);
}

for (const text of exactDeletes) {
  const idx = src.indexOf(text);
  if (idx === -1) {
    console.log(`(skip) exact-delete: ${text.trim()}`);
    continue;
  }
  console.log(`  delete exact: ${text.trim()}`);
  src = src.slice(0, idx) + src.slice(idx + text.length);
}

const originalSrc = fs.readFileSync(SRC, "utf8");
const beforeLines = originalSrc.split("\n").length;
const afterLines = src.split("\n").length;
console.log(`index.html lines: ${beforeLines} -> ${afterLines} (delta ${afterLines - beforeLines})`);

fs.writeFileSync(SRC, src);
console.log("Wrote index.html");
