#!/usr/bin/env node

/**
 * scripts.js — Import cleanup utility
 *
 * Does two things across all .js/.jsx/.ts/.tsx files in /app, /components, /hooks, /lib:
 *
 * 1. Merges multiple `import { ... } from "@hugeicons/core-free-icons"` statements
 *    into a single combined import.
 *
 * 2. Converts relative imports like `./ui/button`, `./models/shortcuts`, `./filename`
 *    into `@/`-aliased absolute imports based on the file's location in the project.
 *
 * Usage:
 *   node scripts.js
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ──────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname);
const TARGET_DIRS = ["app", "components", "hooks", "lib"];
const FILE_EXTS = [".js", ".jsx", ".ts", ".tsx"];
const HUGEICONS_PKG = "@hugeicons/core-free-icons";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Recursively collect all matching files under a directory. */
function collectFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
    } else if (entry.isFile() && FILE_EXTS.includes(path.extname(entry.name))) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Merge all `import { ... } from "@hugeicons/core-free-icons"` blocks into one.
 * Handles multi-line imports with any whitespace/indentation.
 */
function mergeHugeiconsImports(source) {
  // Match any import {...} from "@hugeicons/core-free-icons" (single or multi-line)
  const importRegex =
    /import\s*\{([^}]*)\}\s*from\s*["']@hugeicons\/core-free-icons["']\s*;?/g;

  const allNames = new Set();
  const matches = [...source.matchAll(importRegex)];

  if (matches.length <= 1) return source; // nothing to merge

  for (const match of matches) {
    const names = match[1]
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);
    for (const name of names) allNames.add(name);
  }

  // Build the merged import line
  const merged = `import {\n  ${[...allNames].join(", ")},\n} from "${HUGEICONS_PKG}";`;

  // Remove all original hugeicons imports from the source
  let result = source.replace(importRegex, "");

  // Collapse runs of blank lines that the removals may leave behind
  result = result.replace(/\n{3,}/g, "\n\n");

  // Find the first position where we should insert the merged import.
  // Strategy: insert right before the first non-hugeicons import, or at top.
  const firstImportMatch = result.match(/^(import\s)/m);
  if (firstImportMatch) {
    const insertAt = result.indexOf(firstImportMatch[0]);
    result = result.slice(0, insertAt) + merged + "\n" + result.slice(insertAt);
  } else {
    result = merged + "\n" + result;
  }

  return result;
}

/**
 * Convert relative imports (`./...` or `../...`) to `@/`-aliased paths,
 * resolving them relative to the file's directory within the project root.
 *
 * Only converts paths that resolve to something inside ROOT — external
 * node_modules-style paths are left alone.
 */
function convertRelativeImports(source, filePath) {
  const fileDir = path.dirname(filePath);

  // Match: from "./something" or from '../something'
  // Captures: quote char + relative path
  const relativeImportRegex = /from\s*(["'])(\.{1,2}\/[^"']+)\1/g;

  return source.replace(relativeImportRegex, (full, quote, importPath) => {
    // Resolve to absolute path
    const resolved = path.resolve(fileDir, importPath);

    // Only convert paths that live inside the project root
    if (!resolved.startsWith(ROOT + path.sep) && resolved !== ROOT) {
      return full;
    }

    // Convert to @/-relative path
    const relative = path.relative(ROOT, resolved);
    const aliased = "@/" + relative.split(path.sep).join("/");

    return `from ${quote}${aliased}${quote}`;
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────

function processFile(filePath) {
  let source = fs.readFileSync(filePath, "utf8");
  const original = source;

  source = mergeHugeiconsImports(source);
  source = convertRelativeImports(source, filePath);

  if (source !== original) {
    fs.writeFileSync(filePath, source, "utf8");
    return true;
  }
  return false;
}

function main() {
  const files = TARGET_DIRS.flatMap((dir) =>
    collectFiles(path.join(ROOT, dir)),
  );

  console.log(
    `\n🔍  Scanning ${files.length} file(s) in ${TARGET_DIRS.join(", ")}...\n`,
  );

  let changed = 0;
  for (const file of files) {
    const wasChanged = processFile(file);
    const rel = path.relative(ROOT, file);
    if (wasChanged) {
      console.log(`  ✅  ${rel}`);
      changed++;
    }
  }

  console.log(
    `\n✨  Done — ${changed} file(s) updated, ${files.length - changed} unchanged.\n`,
  );
}

main();
