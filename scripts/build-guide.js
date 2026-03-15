#!/usr/bin/env node
/**
 * AEGIS Guide Builder
 * Reads docs/guide/*.md, renders to HTML via _layouts/guide.html
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked');

const ROOT = path.resolve(__dirname, '..');
const GUIDE_DIR = path.join(ROOT, 'docs', 'guide');
const LAYOUT_PATH = path.join(ROOT, '_layouts', 'guide.html');

// Navigation items in display order
const NAV_ITEMS = [
  { file: 'index', title: 'Overview' },
  { file: '01-concepts', title: '1. Core concepts' },
  { file: '02-configure', title: '2. Configuration' },
  { file: '03-thresholds', title: '3. Thresholds' },
  { file: '04-cdm-logic', title: '4. CDM logic' },
  { file: '05-mlcps', title: '5. MLcps' },
  { file: '06-drift', title: '6. Drift detection' },
  { file: '07-audit-trail', title: '7. Audit trail' },
  { file: '08-pccp-mapping', title: '8. PCCP mapping' },
  { file: '09-eu-mapping', title: '9. EU mapping' }
];

// Read layout
const layout = fs.readFileSync(LAYOUT_PATH, 'utf8');

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: false
});

// Custom renderer for callouts
const renderer = new marked.Renderer();
const originalBlockquote = renderer.blockquote;
renderer.blockquote = function (body) {
  // Support both old signature (string) and new signature (object with text property)
  const text = typeof body === 'object' && body !== null ? (body.text || '') : (body || '');
  if (text.includes('<strong>Sepsis example:') || text.includes('<strong>Sepsis example</strong>')) {
    return `<div class="callout-sepsis">${text}</div>\n`;
  }
  if (text.includes('<strong>Warning:') || text.includes('<strong>Warning</strong>')) {
    return `<div class="callout-warning">${text}</div>\n`;
  }
  if (text.includes('<strong>BraTS example:') || text.includes('<strong>BraTS example</strong>')) {
    return `<div class="callout-sepsis">${text}</div>\n`;
  }
  return `<blockquote>${text}</blockquote>\n`;
};
marked.setOptions({ renderer });

// Parse frontmatter from guide markdown
function parseMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]+?)\n---\n?([\s\S]*)/);
  if (!match) return { meta: {}, body: raw };
  return {
    meta: yaml.load(match[1]),
    body: match[2]
  };
}

// Generate sidebar HTML
function buildSidenav(activeFile) {
  let html = '';
  for (const item of NAV_ITEMS) {
    const activeClass = item.file === activeFile ? ' class="active"' : '';
    html += `<a href="${item.file}.html"${activeClass}>${item.title}</a>\n`;
  }
  return html;
}

// Process each guide markdown file
const mdFiles = fs.readdirSync(GUIDE_DIR).filter(f => f.endsWith('.md'));

if (mdFiles.length === 0) {
  console.log('  No guide .md files found. Skipping guide build.');
  process.exit(0);
}

for (const file of mdFiles) {
  const baseName = file.replace('.md', '');
  const { meta, body } = parseMd(path.join(GUIDE_DIR, file));

  // Render markdown to HTML
  const contentHtml = marked.parse(body);

  // Build navigation links
  let prevLink = '';
  let nextLink = '';
  if (meta.prev) {
    prevLink = `<a href="${meta.prev}">← Previous</a>`;
  }
  if (meta.next) {
    nextLink = `<a href="${meta.next}">Next →</a>`;
  }

  // Build page
  let page = layout;
  page = page.replace('{{TITLE}}', meta.title || baseName);
  page = page.replace('{{SIDENAV}}', buildSidenav(baseName));
  page = page.replace('{{CONTENT}}', contentHtml);
  page = page.replace('{{PREV_LINK}}', prevLink);
  page = page.replace('{{NEXT_LINK}}', nextLink);

  const outPath = path.join(GUIDE_DIR, `${baseName}.html`);
  fs.writeFileSync(outPath, page, 'utf8');
  console.log(`  Built: docs/guide/${baseName}.html`);
}

console.log('Guide build complete.');
