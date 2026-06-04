#!/usr/bin/env node
/*
 * Build-time sanity checks for the single-file IOM Manual Builder app.
 *
 * The whole app lives in index.html (markup + inline script), so there is no
 * bundler to catch mistakes. This script stands in for one:
 *   1. The inline app script must be valid JavaScript.
 *   2. Every element id the script looks up must actually exist in the markup
 *      (this is what catches a half-finished refactor that removes an element
 *      but leaves a getElementById / $("…") behind).
 *   3. A few invariants that keep the GitHub auto-load feature working.
 *
 * Run: node scripts/validate.js
 * Exits non-zero (and prints why) on any failure so CI fails loudly.
 */
"use strict";
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "index.html");
const errors = [];
const warnings = [];

if (!fs.existsSync(file)) {
  console.error("VALIDATION FAILED: index.html not found at repo root.");
  process.exit(1);
}
const html = fs.readFileSync(file, "utf8");

/* ---- 1. Locate and syntax-check the inline app script --------------------- */
const start = html.indexOf("(function(){");
const end = html.lastIndexOf("})();");
let code = "";
if (start === -1 || end === -1 || end < start) {
  errors.push("Could not locate the app IIFE (expected `(function(){ … })();`).");
} else {
  code = html.slice(start, end + "})();".length);
  try {
    // eslint-disable-next-line no-new-func
    new Function(code); // throws on a syntax error without executing anything
  } catch (e) {
    errors.push("App script has a syntax error: " + e.message);
  }
}

/* ---- 2. Every id the script references must exist in the markup ----------- */
if (code) {
  const definedIds = new Set();
  for (const m of html.matchAll(/\bid\s*=\s*"([^"]+)"/g)) definedIds.add(m[1]);

  const referencedIds = new Set();
  // $("foo") — the app's shorthand for document.getElementById("foo")
  for (const m of code.matchAll(/\$\(\s*"([^"]+)"\s*\)/g)) referencedIds.add(m[1]);
  // direct document.getElementById("foo")
  for (const m of code.matchAll(/getElementById\(\s*"([^"]+)"\s*\)/g)) referencedIds.add(m[1]);

  const missing = [...referencedIds].filter((id) => !definedIds.has(id));
  if (missing.length) {
    errors.push(
      "Script looks up element id(s) that don't exist in index.html: " +
        missing.map((s) => `"${s}"`).join(", ")
    );
  }
}

/* ---- 3. GitHub auto-load invariants -------------------------------------- */
if (code) {
  const cfg = code.match(/const\s+DATASHEET_LIBRARY\s*=\s*\{([\s\S]*?)\}/);
  if (!cfg) {
    errors.push("DATASHEET_LIBRARY config block is missing.");
  } else {
    const body = cfg[1];
    if (!/folder\s*:\s*"datasheets"/.test(body))
      errors.push('DATASHEET_LIBRARY.folder must be "datasheets".');
    if (!/owner\s*:\s*"[^"]+"/.test(body) || !/repo\s*:\s*"[^"]+"/.test(body))
      warnings.push("DATASHEET_LIBRARY owner/repo are blank — the app will rely on GitHub Pages auto-detection.");
  }
  // The manual upload path must be gone; auto-load must be wired in.
  if (/wireDropZone\(\s*\$\(\s*"ds-dz"\s*\)/.test(code))
    errors.push("Datasheet manual-upload drop zone (ds-dz) is still wired up — it should be removed.");
  if (!/ensureLibraryLoaded\s*\(/.test(code))
    errors.push("ensureLibraryLoaded() is not called — datasheets won't auto-load.");
}

/* ---- Report -------------------------------------------------------------- */
for (const w of warnings) console.warn("warning: " + w);
if (errors.length) {
  console.error("\nVALIDATION FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log("Validation passed: app script is valid, all referenced ids exist, and GitHub auto-load is wired up.");
