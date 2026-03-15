#!/usr/bin/env node
/**
 * AEGIS Build Validator
 * Checks that all required output files exist and are non-empty.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  // CSS
  'docs/assets/css/main.css',
  'docs/assets/css/guide.css',
  'docs/assets/css/forms.css',

  // JS
  'docs/assets/js/theme.js',
  'docs/assets/js/diagrams.js',
  'docs/assets/js/results-chart.js',
  'docs/assets/js/forms-docx.js',

  // Layouts
  '_layouts/guide.html',
  '_layouts/form.html',

  // Templates
  'templates/shared/header.md',
  'templates/shared/version-history.md',
  'templates/shared/footer.md',
  'templates/s1-checklist.md',
  'templates/s2-config.md',
  'templates/s2-threshold-table.md',
  'templates/s3-cdm-pseudocode.md',
  'templates/s3-implementation-guide.md',
  'templates/capa.md',
  'templates/README.md',

  // Build scripts
  'scripts/build-forms.js',
  'scripts/build-guide.js',

  // Forms output
  'docs/forms/index.html',
  'docs/forms/s1-checklist.html',
  'docs/forms/s2-config.html',
  'docs/forms/s2-threshold-table.html',
  'docs/forms/s3-cdm-pseudocode.html',
  'docs/forms/s3-implementation-guide.html',
  'docs/forms/capa.html',

  // Landing page
  'docs/index.html',

  // Root files
  'docs/.nojekyll',
  'package.json'
];

let passed = 0;
let failed = 0;

for (const file of REQUIRED_FILES) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) {
    console.error(`MISSING: ${file}`);
    failed++;
    continue;
  }
  const stat = fs.statSync(fullPath);
  if (stat.size === 0 && !file.endsWith('.nojekyll')) {
    console.error(`EMPTY:   ${file}`);
    failed++;
    continue;
  }
  console.log(`OK:      ${file}`);
  passed++;
}

console.log(`\n${passed} passed, ${failed} failed out of ${REQUIRED_FILES.length} files.`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('All validation checks passed.');
}
