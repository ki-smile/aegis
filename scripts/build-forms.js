#!/usr/bin/env node
/**
 * AEGIS Form Builder
 * Reads templates/*.md, generates docs/forms/*.html using _layouts/form.html
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ROOT = path.resolve(__dirname, '..');
const TEMPLATES_DIR = path.join(ROOT, 'templates');
const FORMS_DIR = path.join(ROOT, 'docs', 'forms');
const LAYOUT_PATH = path.join(ROOT, '_layouts', 'form.html');

// Ensure output directory
fs.mkdirSync(FORMS_DIR, { recursive: true });

// Read layout template
const layout = fs.readFileSync(LAYOUT_PATH, 'utf8');

// Parse frontmatter from a markdown file
function parseFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;
  return yaml.load(match[1]);
}

// Read shared blocks
function loadShared() {
  const shared = {};
  const sharedDir = path.join(TEMPLATES_DIR, 'shared');
  if (fs.existsSync(sharedDir)) {
    for (const file of fs.readdirSync(sharedDir)) {
      if (file.endsWith('.md')) {
        const name = file.replace('.md', '');
        shared[name] = parseFrontmatter(path.join(sharedDir, file));
      }
    }
  }
  return shared;
}

// Generate HTML for a field
function renderField(field) {
  let html = `<div class="form-group">\n`;
  html += `  <label for="${field.id}">${field.label}${field.required ? ' *' : ''}</label>\n`;

  switch (field.type) {
    case 'text':
      html += `  <input type="text" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}"${field.required ? ' required' : ''}>\n`;
      break;
    case 'textarea':
      html += `  <textarea id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}"${field.required ? ' required' : ''}>${field.default || ''}</textarea>\n`;
      break;
    case 'dropdown':
      html += `  <select id="${field.id}" name="${field.id}"${field.required ? ' required' : ''}>\n`;
      html += `    <option value="">Select...</option>\n`;
      for (const opt of (field.options || [])) {
        const selected = field.default === opt ? ' selected' : '';
        html += `    <option value="${opt}"${selected}>${opt}</option>\n`;
      }
      html += `  </select>\n`;
      break;
    case 'number':
      html += `  <input type="number" id="${field.id}" name="${field.id}" placeholder="${field.placeholder || ''}" value="${field.default || ''}" step="${field.step || 'any'}"${field.required ? ' required' : ''}>\n`;
      break;
    case 'date':
      html += `  <input type="date" id="${field.id}" name="${field.id}"${field.required ? ' required' : ''}>\n`;
      break;
    case 'slider':
      html += `  <div class="slider-group">\n`;
      html += `    <input type="range" id="${field.id}" name="${field.id}" min="${field.min || 0}" max="${field.max || 1}" step="${field.step || 0.1}" value="${field.default || field.min || 0}" oninput="document.getElementById('${field.id}-val').textContent=this.value">\n`;
      html += `    <span class="slider-value" id="${field.id}-val">${field.default || field.min || 0}</span>\n`;
      html += `  </div>\n`;
      break;
    case 'fixed-checked':
      html += `  <div class="checkbox-item fixed-checked">\n`;
      html += `    <input type="checkbox" id="${field.id}" checked disabled>\n`;
      html += `    <label>${field.label}</label>\n`;
      html += `  </div>\n`;
      break;
    default:
      html += `  <input type="text" id="${field.id}" name="${field.id}">\n`;
  }

  if (field.help) {
    html += `  <div class="help-text">${field.help}</div>\n`;
  }
  html += `</div>\n`;
  return html;
}

// Generate HTML for a checkbox group section
function renderCheckboxGroup(section) {
  let html = '';
  const items = section.items || [];
  for (const item of items) {
    html += `<div class="checkbox-item">\n`;
    html += `  <input type="checkbox" id="${item.id}" name="${item.id}">\n`;
    html += `  <label for="${item.id}">${item.label}</label>\n`;
    html += `</div>\n`;
  }
  return html;
}

// Generate HTML for an editable table section
function renderTable(section) {
  const cols = section.columns || [];
  const rows = section.rows || [];

  let html = `<table class="threshold-table">\n<thead><tr>\n`;
  for (const col of cols) {
    html += `  <th>${col.label}</th>\n`;
  }
  html += `</tr></thead>\n<tbody>\n`;

  for (let i = 0; i < rows.length; i++) {
    html += `<tr>\n`;
    for (const col of cols) {
      const val = rows[i][col.id] || '';
      html += `  <td><input type="text" name="${section.id}_${i}_${col.id}" value="${val}"></td>\n`;
    }
    html += `</tr>\n`;
  }
  html += `</tbody></table>\n`;
  return html;
}

// Generate HTML for a bullet list section
function renderBulletList(section) {
  let html = '<ul>\n';
  for (const item of (section.items || [])) {
    html += `  <li>${item}</li>\n`;
  }
  html += '</ul>\n';
  return html;
}

// Generate HTML for a code section
function renderCode(section) {
  const lang = section.language || '';
  return `<pre class="code-block"><code class="language-${lang}">${escapeHtml(section.code || '')}</code></pre>\n`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Render a complete section
function renderSection(section) {
  let html = `<div class="form-section">\n`;
  html += `  <h2>${section.title}</h2>\n`;
  if (section.source) {
    html += `  <div class="section-source">${section.source}</div>\n`;
  }
  if (section.instruction) {
    html += `  <div class="section-instruction">${section.instruction}</div>\n`;
  }

  switch (section.type) {
    case 'fields':
      for (const field of (section.fields || [])) {
        html += renderField(field);
      }
      break;
    case 'checkbox-group':
      html += renderCheckboxGroup(section);
      break;
    case 'table':
      html += renderTable(section);
      break;
    case 'bullet-list':
      html += renderBulletList(section);
      break;
    case 'code':
      html += renderCode(section);
      break;
    default:
      for (const field of (section.fields || [])) {
        html += renderField(field);
      }
  }

  html += `</div>\n`;
  return html;
}

// Collect all pre-fill example values from a template
function collectExamples(tpl, exampleKey) {
  const examples = {};
  for (const section of (tpl.sections || [])) {
    if (section.type === 'fields') {
      for (const field of (section.fields || [])) {
        if (field[exampleKey] !== undefined && field[exampleKey] !== '') {
          examples[field.id] = field[exampleKey];
        }
      }
    }
    if (section.type === 'checkbox-group') {
      for (const item of (section.items || [])) {
        if (item[exampleKey] !== undefined) {
          examples[item.id] = item[exampleKey];
        }
      }
    }
    if (section.type === 'table' && section.rows) {
      const cols = section.columns || [];
      for (let i = 0; i < section.rows.length; i++) {
        for (const col of cols) {
          const exKey = exampleKey.replace('_example', '_' + col.id);
          const sepKey = 'sepsis_' + col.id;
          const val = section.rows[i][exampleKey === 'sepsis_example' ? 'sepsis_value' : 'brats_value'];
          if (val !== undefined && col.id === 'value') {
            examples[`${section.id}_${i}_value`] = val;
          }
        }
      }
    }
  }
  return examples;
}

// Generate prefill button JS
function generatePrefillScript(tpl) {
  const sepsisExamples = collectExamples(tpl, 'sepsis_example');
  const bratsExamples = collectExamples(tpl, 'brats_example');

  let script = '';
  if (Object.keys(sepsisExamples).length > 0) {
    script += `document.getElementById('prefill-sepsis')?.addEventListener('click', function() {\n`;
    script += `  var ex = ${JSON.stringify(sepsisExamples)};\n`;
    script += `  for (var id in ex) {\n`;
    script += `    var el = document.getElementById(id) || document.querySelector('[name="'+id+'"]');\n`;
    script += `    if (el) {\n`;
    script += `      if (el.type === 'checkbox') { el.checked = true; }\n`;
    script += `      else { el.value = ex[id]; }\n`;
    script += `      if (el.type === 'range') { var valEl = document.getElementById(id+'-val'); if(valEl) valEl.textContent = ex[id]; }\n`;
    script += `    }\n`;
    script += `  }\n`;
    script += `});\n`;
  }
  if (Object.keys(bratsExamples).length > 0) {
    script += `document.getElementById('prefill-brats')?.addEventListener('click', function() {\n`;
    script += `  var ex = ${JSON.stringify(bratsExamples)};\n`;
    script += `  for (var id in ex) {\n`;
    script += `    var el = document.getElementById(id) || document.querySelector('[name="'+id+'"]');\n`;
    script += `    if (el) {\n`;
    script += `      if (el.type === 'checkbox') { el.checked = true; }\n`;
    script += `      else { el.value = ex[id]; }\n`;
    script += `      if (el.type === 'range') { var valEl = document.getElementById(id+'-val'); if(valEl) valEl.textContent = ex[id]; }\n`;
    script += `    }\n`;
    script += `  }\n`;
    script += `});\n`;
  }
  return script;
}

// Generate docx download script
function generateDocxScript(tpl) {
  let script = generatePrefillScript(tpl);

  script += `\ndocument.getElementById('download-docx')?.addEventListener('click', function() {\n`;
  script += `  if (!window.AEGISForms || !window.docx) { alert('Libraries not loaded yet. Please wait.'); return; }\n`;
  script += `  var F = window.AEGISForms;\n`;
  script += `  var docx = window.docx;\n\n`;

  // Collect header values
  script += `  var headerValues = {\n`;
  script += `    device_name: (document.getElementById('device_name') || {}).value || '',\n`;
  script += `    intended_use: (document.getElementById('intended_use') || {}).value || '',\n`;
  script += `    author_name: (document.getElementById('author_name') || {}).value || '',\n`;
  script += `    author_role: (document.getElementById('author_role') || {}).value || '',\n`;
  script += `    date: (document.getElementById('date') || {}).value || '',\n`;
  script += `    org: (document.getElementById('org') || {}).value || ''\n`;
  script += `  };\n\n`;

  script += `  var children = [];\n`;
  script += `  children = children.concat(F.buildTitle(${JSON.stringify(tpl.docx_title || tpl.title)}, ${JSON.stringify(tpl.supplement || '')}));\n\n`;

  // Add header if included
  if (tpl.includes_shared && tpl.includes_shared.includes('header')) {
    script += `  children = children.concat(F.buildHeader(headerValues));\n`;
  }

  // Add sections
  for (const section of (tpl.sections || [])) {
    script += `\n  // Section: ${section.title}\n`;
    script += `  children = children.concat(F.buildSectionHeading(${JSON.stringify(section.title)}, ${JSON.stringify(section.source || '')}));\n`;

    if (section.type === 'checkbox-group') {
      const items = (section.items || []).map(i => ({ id: i.id, label: i.label }));
      script += `  var items_${section.id.replace(/-/g, '_')} = ${JSON.stringify(items)};\n`;
      script += `  var checked_${section.id.replace(/-/g, '_')} = items_${section.id.replace(/-/g, '_')}.filter(function(i) { var el = document.getElementById(i.id); return el && el.checked; }).map(function(i) { return i.id; });\n`;
      script += `  children = children.concat(F.buildCheckboxList(items_${section.id.replace(/-/g, '_')}, checked_${section.id.replace(/-/g, '_')}));\n`;
    } else if (section.type === 'table') {
      const cols = (section.columns || []).map(c => c.label);
      const numRows = (section.rows || []).length;
      const colIds = (section.columns || []).map(c => c.id);
      script += `  var tableRows_${section.id.replace(/-/g, '_')} = [];\n`;
      script += `  for (var i = 0; i < ${numRows}; i++) {\n`;
      script += `    var row = [];\n`;
      for (const colId of colIds) {
        script += `    row.push((document.querySelector('[name="${section.id}_'+i+'_${colId}"]') || {}).value || '');\n`;
      }
      script += `    tableRows_${section.id.replace(/-/g, '_')}.push(row);\n`;
      script += `  }\n`;
      script += `  children.push(F.buildTable(${JSON.stringify(cols)}, tableRows_${section.id.replace(/-/g, '_')}));\n`;
    } else if (section.type === 'fields') {
      for (const field of (section.fields || [])) {
        if (field.type === 'fixed-checked') {
          script += `  children.push(F.buildLabelValue('${field.label}', '✓ (always active)'));\n`;
        } else {
          script += `  children.push(F.buildLabelValue(${JSON.stringify(field.label)}, (document.getElementById('${field.id}') || {}).value || ''));\n`;
        }
      }
    } else if (section.type === 'bullet-list') {
      for (const item of (section.items || [])) {
        script += `  children.push(new docx.Paragraph({ children: [new docx.TextRun('• ${item.replace(/'/g, "\\'")}')], spacing: { after: 80 } }));\n`;
      }
    } else if (section.type === 'code') {
      script += `  children.push(new docx.Paragraph({ children: [new docx.TextRun({ text: ${JSON.stringify((section.code || '').substring(0, 2000))}, font: 'Courier New', size: 18 })], spacing: { after: 200 } }));\n`;
    }
  }

  // Add version history if included
  if (tpl.includes_shared && tpl.includes_shared.includes('version-history')) {
    script += `\n  // Version history\n`;
    script += `  children = children.concat(F.buildSectionHeading('Version history'));\n`;
    script += `  children.push(F.buildVersionHistory(headerValues.author_name, headerValues.date));\n`;
  }

  // Add signoff if included
  if (tpl.includes_shared && tpl.includes_shared.includes('footer')) {
    script += `\n  // Sign-off\n`;
    script += `  children = children.concat(F.buildSectionHeading('Sign-off'));\n`;
    script += `  children = children.concat(F.buildSignoff());\n`;
  }

  // Create document
  script += `\n  var doc = new docx.Document({\n`;
  script += `    sections: [{\n`;
  script += `      footers: F.buildFooterConfig(),\n`;
  script += `      children: children\n`;
  script += `    }],\n`;
  script += `    styles: {\n`;
  script += `      default: {\n`;
  script += `        document: {\n`;
  script += `          run: { font: 'Arial', size: 20, color: '000000' }\n`;
  script += `        },\n`;
  script += `        heading1: {\n`;
  script += `          run: { font: 'Arial', size: 36, bold: true, color: '4F0433' }\n`;
  script += `        },\n`;
  script += `        heading2: {\n`;
  script += `          run: { font: 'Arial', size: 28, bold: true, color: '870052' }\n`;
  script += `        }\n`;
  script += `      }\n`;
  script += `    }\n`;
  script += `  });\n\n`;

  // Generate filename
  let fnPattern = tpl.docx_filename_pattern || `AEGIS_${tpl.id}_{date}.docx`;
  script += `  var filename = ${JSON.stringify(fnPattern)};\n`;
  script += `  filename = filename.replace('{device_name}', (headerValues.device_name || 'device').replace(/[^a-zA-Z0-9]/g, '_'));\n`;
  script += `  filename = filename.replace('{date}', headerValues.date || new Date().toISOString().split('T')[0]);\n`;
  script += `  filename = filename.replace('{iteration}', (document.getElementById('iteration') || {}).value || '0');\n`;
  script += `  F.triggerDownload(doc, filename);\n`;
  script += `});\n`;

  return script;
}

// Generate prefill buttons HTML
function generatePrefillButtons(tpl) {
  const sepsisExamples = collectExamples(tpl, 'sepsis_example');
  const bratsExamples = collectExamples(tpl, 'brats_example');
  let html = '';
  if (Object.keys(sepsisExamples).length > 0 || Object.keys(bratsExamples).length > 0) {
    html += '<div class="prefill-bar">\n';
    if (Object.keys(sepsisExamples).length > 0) {
      html += '  <button type="button" class="btn-prefill" id="prefill-sepsis">Load sepsis example</button>\n';
    }
    if (Object.keys(bratsExamples).length > 0) {
      html += '  <button type="button" class="btn-prefill" id="prefill-brats">Load BraTS example</button>\n';
    }
    html += '</div>\n';
  }
  return html;
}

// Process template files
const templates = [];
const files = fs.readdirSync(TEMPLATES_DIR).filter(f => f.endsWith('.md') && f !== 'README.md');

for (const file of files) {
  const tpl = parseFrontmatter(path.join(TEMPLATES_DIR, file));
  if (!tpl) continue;
  templates.push(tpl);

  // Load shared sections
  const shared = loadShared();
  if (tpl.includes_shared) {
    // Prepend header fields to first section
    if (tpl.includes_shared.includes('header') && shared.header) {
      const headerSection = {
        id: 'header',
        title: 'Device information',
        source: 'Common header',
        type: 'fields',
        fields: shared.header.fields || []
      };
      tpl.sections = [headerSection, ...(tpl.sections || [])];
    }
  }

  // Render form content
  let content = '';
  for (const section of (tpl.sections || [])) {
    content += renderSection(section);
  }

  // Generate page
  let page = layout;
  page = page.replace(/\{\{TITLE\}\}/g, tpl.title || '');
  page = page.replace('{{SUPPLEMENT}}', tpl.supplement || '');
  page = page.replace('{{DESCRIPTION}}', tpl.description || '');
  page = page.replace('{{DOCX_ID}}', tpl.id || '');
  page = page.replace('{{DOCX_PATTERN}}', tpl.docx_filename_pattern || '');
  page = page.replace('{{CONTENT}}', content);
  page = page.replace('{{PREFILL_BUTTONS}}', generatePrefillButtons(tpl));
  page = page.replace('{{DOCX_SCRIPT}}', generateDocxScript(tpl));

  const outPath = path.join(FORMS_DIR, `${tpl.id}.html`);
  fs.writeFileSync(outPath, page, 'utf8');
  console.log(`  Built: docs/forms/${tpl.id}.html`);
}

// Generate forms hub (index.html)
let hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Forms — AEGIS</title>
  <link rel="stylesheet" href="../assets/css/main.css">
  <link rel="stylesheet" href="../assets/css/forms.css">
  <script src="../assets/js/theme.js"></script>
</head>
<body>
  <nav class="site-nav">
    <div class="nav-logo"><a href="../index.html">AEGIS</a></div>
    <div class="nav-links">
      <a href="../index.html">Home</a>
      <a href="../guide/index.html">Guide</a>
      <a href="index.html">Forms</a>
      <a href="https://github.com/ki-smile/aegis" target="_blank" rel="noopener">GitHub</a>
      <button class="theme-toggle" id="theme-toggle">☾ Dark</button>
    </div>
  </nav>
  <div class="form-page">
    <h1>AEGIS Forms</h1>
    <p class="form-description">Interactive forms for AEGIS regulatory documentation. Fill in the form, then download as .docx. All data stays in your browser.</p>
    <div class="grid-2">
`;

for (const tpl of templates) {
  hubHtml += `      <a href="${tpl.id}.html" class="card" style="text-decoration:none; color:inherit;">\n`;
  hubHtml += `        <h3>${tpl.title}</h3>\n`;
  hubHtml += `        <div class="form-supplement">Supplement ${tpl.supplement || ''}</div>\n`;
  if (tpl.estimated_time) {
    hubHtml += `        <div style="font-size:0.85rem; color:var(--color-text-muted); margin-top:0.5rem;">⏱ ${tpl.estimated_time}</div>\n`;
  }
  hubHtml += `        <p style="font-size:0.9rem; margin-top:0.5rem;">${tpl.description || ''}</p>\n`;
  hubHtml += `        <div style="margin-top:0.75rem; font-weight:500; color:var(--color-accent-strong);">${tpl.type === 'form' ? 'Fill form →' : 'View reference →'}</div>\n`;
  hubHtml += `      </a>\n`;
}

hubHtml += `    </div>
  </div>
</body>
</html>`;

fs.writeFileSync(path.join(FORMS_DIR, 'index.html'), hubHtml, 'utf8');
console.log('  Built: docs/forms/index.html');
console.log('Forms build complete.');
