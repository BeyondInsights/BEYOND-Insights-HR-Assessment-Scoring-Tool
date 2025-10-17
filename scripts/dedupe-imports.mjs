// scripts/dedupe-imports.mjs
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const PAGES_DIR = path.join(ROOT, 'app', 'survey', 'dimensions');

function dedupeImportsForFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split(/\r?\n/);

  // 1) Collect all import lines + remember first occurrence indexes
  const importLines = [];
  const nonImportLines = [];
  const seen = new Set(); // exact import line de-dupe

  for (const line of lines) {
    if (/^\s*import\s.+from\s+['"].+['"]\s*;?\s*$/.test(line)) {
      // same exact text? keep only first
      if (!seen.has(line)) {
        importLines.push(line);
        seen.add(line);
      }
      // if seen, skip duplicate
    } else {
      nonImportLines.push(line);
    }
  }

  // 2) Within the kept import lines, also de-dupe by (source + specifiers)
  //    in case identical imports differ by trailing semicolon/spacing.
  const byKey = new Map(); // key = source|sortedSpecifiers, value = import line
  const normalized = [];

  for (const imp of importLines) {
    const m = imp.match(/^\s*import\s+(.+)\s+from\s+['"](.+)['"]\s*;?\s*$/);
    if (!m) { normalized.push(imp); continue; }
    const spec = m[1].trim();
    const srcFrom = m[2].trim();

    // Normalize specifiers (handles: default, named, namespace)
    // We only coalesce exact duplicates; merging named lists is risky. So key = raw spec + source
    const key = `${srcFrom}|${spec}`;

    if (!byKey.has(key)) {
      byKey.set(key, imp.endsWith(';') ? imp : imp + ';');
    }
  }

  // 3) Rebuild file with a single import block (kept order), then the rest
  const uniqueImports = Array.from(byKey.values());
  const rebuilt = [...uniqueImports, ...nonImportLines].join('\n');

  if (rebuilt !== src) {
    fs.writeFileSync(filePath, rebuilt, 'utf8');
    console.log(`Fixed imports in: ${path.relative(ROOT, filePath)}`);
  }
}

function walkDimensionPages() {
  if (!fs.existsSync(PAGES_DIR)) return;
  const dirs = fs.readdirSync(PAGES_DIR).filter(d => /^\d+$/.test(d));
  for (const d of dirs) {
    const file = path.join(PAGES_DIR, d, 'page.tsx');
    if (fs.existsSync(file)) dedupeImportsForFile(file);
  }
}

walkDimensionPages();
