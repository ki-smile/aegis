---
id: templates-readme
title: "Template registry"
type: registry
---

# AEGIS Templates

This directory is the **single source of truth** for all form content, field definitions, help text, and docx structure.

## Template registry

| File | Supplement | Type | Purpose |
|------|-----------|------|---------|
| `s1-checklist.md` | S1 | Fillable form | Implementation readiness |
| `s2-config.md` | S2 | Fillable form | Full domain configuration |
| `s2-threshold-table.md` | S2.3 | Fillable form | Standalone threshold table |
| `s3-cdm-pseudocode.md` | S3.3 | Reference doc | CDM logic + pseudocode |
| `s3-implementation-guide.md` | S3 | Reference doc | Deployment workflow |
| `capa.md` | Appendix D | Fillable form | CAPA record |
| `shared/header.md` | — | Shared | Header fields |
| `shared/version-history.md` | — | Shared | Version history table |
| `shared/footer.md` | — | Shared | Copyright + sign-off |

## How templates work

1. Each template uses YAML frontmatter to define form structure
2. `scripts/build-forms.js` reads the frontmatter and generates HTML forms
3. The HTML form includes client-side `.docx` generation via `forms-docx.js`
4. Shared blocks (`header`, `version-history`, `footer`) are injected via `includes_shared`

## Adding a new template

1. Create a new `.md` file in this directory
2. Add YAML frontmatter with `id`, `title`, `supplement`, `type`, `sections`
3. Add the template to this registry table
4. Run `node scripts/build-forms.js` to generate the HTML form

## Field types

| Type | HTML control | Docx output |
|------|-------------|-------------|
| `text` | `<input type="text">` | Bold label + value paragraph |
| `textarea` | `<textarea>` | Bold label + wrapped paragraph |
| `dropdown` | `<select>` | Bold label + selected value |
| `number` | `<input type="number">` | Bold label + numeric value |
| `date` | `<input type="date">` | Bold label + formatted date string |
| `checkbox-group` | `<input type="checkbox">` × N | ✓ / ☐ list |
| `slider` | `<input type="range">` | Bold label + numeric value |
| `table` | Editable HTML table | `docx.Table` with column headers |
| `fixed-checked` | Disabled checkbox (always ✓) | ✓ label (non-editable) |
| `slider-group` | Multiple range inputs + labels | Summary table |
| `code` | `<pre><code>` read-only | Monospace paragraph block |

## Pre-fill buttons

Templates can define `sepsis_example` and `brats_example` values on each field.
The build script generates "Load sepsis example" and "Load BraTS example" buttons
that populate the form with these values.
