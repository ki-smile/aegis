# AEGIS Website & Documentation Plan

**Repository:** https://github.com/ki-smile/aegis  
**GitHub Pages URL:** https://ki-smile.github.io/aegis  
**Owner:** SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments), Karolinska Institutet  
**Plan version:** 2.0 — Claude-executable  
**Copyright:** © 2026 SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments), Karolinska Institutet. All rights reserved.

---

## HOW CLAUDE SHOULD USE THIS PLAN

This plan is written so Claude can build the entire repository by following it
top to bottom. Each section specifies what to create, in what order, with exact
file paths. Claude should:

1. Read each phase fully before creating any files in it
2. Create files using `create_file` or `bash_tool` as specified
3. Run the validation command at the end of each phase before proceeding
4. Never skip ahead — later files depend on earlier ones (CSS before HTML,
   templates before forms, build scripts before rendering)

**Working directory:** `/home/claude/aegis-build/`  
**Output directory:** `/mnt/user-data/outputs/aegis/`

All files are written to the working directory first, then copied to outputs
at the end of Phase 9.

---

## 1. Purpose and audience

| Need | Who | Deliverable |
|------|-----|-------------|
| Understand AEGIS | Reviewer, clinician | Landing page, architecture diagram, results |
| Implement AEGIS | Developer, ML engineer | Step-by-step guide, code snippets, templates |
| Produce regulatory documents | Regulatory affairs, QA | Interactive forms → `.docx` download |

---

## 2. Full repository structure

```
aegis/
│
├── README.md
├── CITATION.cff
├── LICENSE
│
├── templates/                            ← SOURCE OF TRUTH for all form content
│   ├── README.md                         # Template registry
│   ├── shared/
│   │   ├── header.md                     # Common header fields (all forms)
│   │   ├── version-history.md            # Version history table
│   │   └── footer.md                     # Copyright + sign-off block
│   ├── s1-checklist.md                   # S1: Implementation readiness checklist
│   ├── s2-config.md                      # S2: Domain configuration template
│   ├── s2-threshold-table.md             # S2.3: Standalone threshold table
│   ├── s3-cdm-pseudocode.md              # S3.3: CDM logic + pseudocode (reference)
│   ├── s3-implementation-guide.md        # S3: Step-by-step deployment workflow (reference)
│   └── capa.md                           # Appendix D: CAPA form
│
├── scripts/
│   ├── build-guide.js                    # docs/guide/*.md → docs/guide/*.html
│   ├── build-forms.js                    # templates/*.md → docs/forms/*.html
│   └── validate-build.js                 # Checks all outputs exist and are non-empty
│
├── docs/                                 ← GitHub Pages root
│   ├── .nojekyll                         # Disables Jekyll processing
│   ├── index.html                        # Landing page (handwritten)
│   │
│   ├── guide/                            # Built by scripts/build-guide.js
│   │   ├── index.md  → index.html
│   │   ├── 01-concepts.md  → 01-concepts.html
│   │   ├── 02-configure.md → 02-configure.html
│   │   ├── 03-thresholds.md → 03-thresholds.html
│   │   ├── 04-cdm-logic.md  → 04-cdm-logic.html
│   │   ├── 05-mlcps.md      → 05-mlcps.html
│   │   ├── 06-drift.md      → 06-drift.html
│   │   ├── 07-audit-trail.md → 07-audit-trail.html
│   │   ├── 08-pccp-mapping.md → 08-pccp-mapping.html
│   │   └── 09-eu-mapping.md   → 09-eu-mapping.html
│   │
│   ├── forms/                            # Built by scripts/build-forms.js
│   │   ├── index.html                    # Forms hub (lists all forms)
│   │   ├── s1-checklist.html
│   │   ├── s2-config.html
│   │   ├── s2-threshold-table.html
│   │   └── capa.html
│   │
│   └── assets/
│       ├── css/
│       │   ├── main.css                  # KI tokens + dark/light themes
│       │   ├── guide.css                 # Guide sidebar layout
│       │   └── forms.css                 # Form controls + docx button
│       ├── js/
│       │   ├── theme.js                  # Dark/light toggle + localStorage
│       │   ├── diagrams.js               # Architecture SVG animation
│       │   ├── results-chart.js          # Sepsis/BraTS Chart.js toggle
│       │   └── forms-docx.js             # Shared docx.js generation utilities
│       └── img/
│           └── ki-smaile-logo.svg
│
├── _layouts/
│   ├── guide.html                        # Guide page wrapper (sidebar + content)
│   └── form.html                         # Form page wrapper (nav + form + docx script)
│
├── .github/
│   └── workflows/
│       └── build-guide.yml               # CI: build on push, commit HTML
│
└── examples/
    ├── sepsis/
    │   ├── AEGIS_Sepsis.ipynb
    │   ├── README.md
    │   └── data/README.md
    └── brain_tumor/
        └── README.md
```

---

## 3. Templates directory — detailed specification

The `templates/` directory is the **single source of truth** for all form
content, field definitions, help text, and docx structure.

**Why a templates directory matters:**  
Changing a field label, adding a new threshold row, or updating help text
only requires editing one `.md` file. Running `node scripts/build-forms.js`
regenerates the HTML form and the docx generation logic automatically.
No HTML form is hand-authored — all forms are generated from templates.

### 3.1 Template markdown schema

Every template file uses YAML frontmatter. The build script reads this
and never touches the body of the `.md` file (the body may contain
prose documentation for human readers).

**Frontmatter structure:**

```yaml
---
id: s1-checklist                    # matches filename; used as HTML form id
title: "Implementation readiness checklist"
supplement: "S1"                    # supplement section reference
docx_title: "AEGIS Implementation Readiness Checklist"
docx_filename_pattern: "AEGIS_S1_Checklist_{device_name}_{date}.docx"
type: form                          # form | reference-doc
  # form = generates fillable HTML + docx
  # reference-doc = generates readable HTML page only (no form fields)
description: "Short description shown on the form page."
estimated_time: "30–60 minutes"     # shown on forms hub
includes_shared: [header, version-history, footer]  # which shared blocks to include
sections:
  - id: section-id
    title: "Section title"
    source: "Supplementary S1.1"    # shown as a citation on the form
    type: fields                    # fields | checkbox-group | table | code | bullet-list
    instruction: "Optional instruction text shown above the section."
    fields: [...]                   # list of field objects (see 3.2)
---

Optional prose below the frontmatter — for human readers, not parsed by build script.
```

### 3.2 Field object schema

```yaml
- id: device_name               # HTML input name + docx label key
  label: "Device name"          # human-readable label on form and in docx
  type: text                    # see field type table below
  required: true
  placeholder: "e.g. SepsisGuard v2.1"
  help: "Include version number" # hint shown beneath the field
  docx_style: bold_label         # bold_label | table_row | checkbox_row | heading
  default: ""                   # default value on page load
  options: []                   # dropdown / checkbox-group only
  min: 0.5                      # slider only
  max: 3.0                      # slider only
  step: 0.1                     # slider only
  sepsis_example: "SepsisGuard v2.1"   # value loaded by "Load sepsis example" button
  brats_example:  "BraTSeg v1.0"       # value loaded by "Load BraTS example" button
```

**Field type table:**

| type | HTML control | docx output |
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
| `slider-group` | Multiple range inputs + labels | Summary table (metric, weight) |
| `code` | `<pre><code>` read-only | Monospace paragraph block |

### 3.3 Template files — contents

#### `templates/shared/header.md`

Fields common to every generated docx (device name, author, date, org).
Included via `includes_shared: [header]` in any template.

Fields: `device_name`, `intended_use`, `author_name`, `author_role`,
`date` (auto-fills today), `org`.

#### `templates/shared/version-history.md`

A table added to the end of fillable-form docx outputs.
Three pre-populated rows; additional rows added manually in Word.

Columns: Version · Date · Author · Change summary  
Row 1: `1.0` · `{date from header}` · `{author_name}` · `Initial configuration`  
Rows 2–3: empty.

#### `templates/shared/footer.md`

Copyright paragraph + sign-off block (six lines with blank signature/date rules).

Copyright line:  
`© 2026 SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments), Karolinska Institutet. All rights reserved.`

Sign-off fields: Author signature · Author name · Date · Reviewer name · Reviewer role · Review date.

---

#### `templates/s1-checklist.md`

**Source:** Supplementary S1.1–S1.6  
**Type:** form  
**Estimated time:** 30–60 minutes

Sections and their items (source in brackets):

**Regulatory context** [S1.1]  
Fields: `risk_class` (dropdown: Class I / IIa / IIb / III-PMA), `reg_pathway`
(dropdown: 510k / De Novo / PMA / CE-MDR / AI Act high-risk / Other),
`pccp_planned` (dropdown: Yes / No / Under discussion)

**DARM configuration** [S1.2] — checkbox-group  
- Three dataset splits defined (Training DT,k, Golden DG, Drifting DD,k)
- Golden dataset locked, hashed, and documented before first deployment
- Patient/sample deduplication across splits confirmed
- Label governance process documented (adjudication criteria, reviewer IDs)
- Dataset versioning and provenance metadata system in place
- Data accumulation rule documented: DT,k+1 = DT,k ∪ DD,k (unconditional)

**MMM configuration** [S1.3] — checkbox-group  
- Primary metrics selected and clinically justified
- MLcps weights defined and traced to risk assessment
- Drift detection method selected with feature set specified
- Fairness metrics defined across relevant subgroups
- KPI historical database structure defined

**CDM configuration** [S1.4] — checkbox-group  
- Active decision categories defined and clinically justified
- All thresholds derived from ISO 14971:2019 hazard analysis with hazard IDs
- CDM condition polarity convention documented
- CDM pseudo-code reviewed and implementation verified (Suppl. S3.3)
- Logging requirements confirmed (all fields listed in guide/07-audit-trail.html)
- Gold standard baseline locked at first APPROVE with version tag

**Regulatory documentation** [S1.5] — checkbox-group  
- S2 configuration template completed
- PCCP / technical documentation sections drafted
- Gold standard baseline documented with metric values and dataset ID
- CAPA / vigilance escalation pathway defined

**CAPA and PMS integration** [S1.6] — checkbox-group  
- CAPA triggers defined for each decision category
- Regulatory escalation contacts identified
- MDR Art. 83 / FDA PMS reporting thresholds documented
- PSUR schedule established

**Pre-fill:** Sepsis example fills `risk_class` and `reg_pathway` only —
checklist items are left for the user to complete manually.

**docx output:** Checklist with ✓/☐ symbols, header, version history,
sign-off block, copyright footer.

---

#### `templates/s2-config.md`

**Source:** Supplementary S2.1–S2.8, Manuscript Table IV  
**Type:** form  
**Estimated time:** 60–120 minutes

Sections:

**Deployment context** [S2.1]  
`data_modality` (dropdown: 7 options), `model_arch` (text), `primary_metrics` (text),
`use_case` (textarea)  
Sepsis example: Tabular EHR / RF 300 trees  
BraTS example: 3D volumetric / nnU-Net ResENC-M

**Dataset configuration** [S2.2]  
`golden_size` (number), `golden_desc` (textarea), `split_strategy` (dropdown),
`split_detail` (textarea), `dedup_method` (text)  
Sepsis example: N=4,067, Hospital A, 20% hold-out

**Threshold specification** [S2.3] — editable table  
Columns: Parameter · Symbol · Value · Clinical justification · ISO 14971 hazard ID · Source  
Pre-populated rows (one per threshold parameter):

| Parameter | Symbol | Sepsis example value |
|-----------|--------|----------------------|
| Critical safety floor | P_fail | Sens. < 0.65 |
| Performance buffer — sensitivity | R_G(sens) | Sens. < 0.66 |
| Performance buffer — specificity | R_G(spec) | Spec. < 0.60 |
| Gold standard tolerance | τ | 0.015 (sensitivity) |
| Minor drift lower bound | θ_minor,low | 0.30 |
| Minor drift upper bound | θ_minor,high | 0.70 |
| Major drift threshold | θ_major | 0.90 |
| PMS safety floor (released model) | P_PMS | Sens. 0.65 |
| PMS regression margin | δ | 0.020–0.030 |

**MLcps configuration** [S2.4]  
Four metric name/weight pairs (text + slider 0.5–3.0).  
`mlcps_derivation` (dropdown).  
Sepsis example: Sensitivity 1.5 / ROC-AUC 1.3 / Balanced Accuracy 1.1 / Specificity 1.0  
BraTS example: DSC 1.0

**Drift detection configuration** [S2.5]  
`drift_method` (dropdown: KS+Bonferroni / MMD / PSI / Performance comparison / Other),
`drift_K` (number), `drift_alpha` (number, default 0.05), `drift_alpha_prime` (auto-calculated,
read-only: α/K), `drift_features` (textarea)  
Sepsis example: K=34, α=0.05, α'=0.00147, feature list (34 clinical features)

**Active decision categories** [S2.6]  
APPROVE and REJECT: fixed-checked (cannot be disabled).  
CONDITIONAL APPROVAL and CLINICAL REVIEW: checkboxes with justification textarea when disabled.  
BraTS example: both intermediate categories disabled with clinical justification.

**Gold standard baseline** [S2.7]  
`gold_iteration` (number, default 0), `gold_metrics` (textarea), `gold_date` (date),
`gold_dataset_id` (text — hash or version tag)

**Regulatory pathway mapping** [S2.8]  
Three textareas pre-populated with template text:
- Description of Modifications (PCCP Component 1)
- Modification Protocol (PCCP Component 2)
- Impact Assessment (PCCP Component 3)

**Pre-fill buttons:** "Load sepsis example" and "Load BraTS example"

**docx output:** Full configuration document with labelled sections,
threshold table (5 columns), version history, sign-off, copyright footer.

---

#### `templates/s2-threshold-table.md`

**Source:** Supplementary S2.3  
**Type:** form  
**Purpose:** Standalone threshold traceability table for sharing separately
from the full S2 configuration. References the same rows as
`s2-config/threshold-table` section.

Fields: device context (from shared header) + the threshold table only.
Useful when a regulatory reviewer needs only the threshold document.

---

#### `templates/s3-cdm-pseudocode.md`

**Source:** Supplementary S3.3  
**Type:** reference-doc (renders as readable page, no form fields)

Sections:
1. Key framing (APPROVE+ALARM not contradictory explanation)
2. Priority-ordered decision hierarchy table (Table VI Part A reproduced)
3. PMS ALARM conditions table (Table VI Part B reproduced)
4. Reference Python implementation (full `cdm_evaluate` + `_check_alarm` +
   `gold_standard_compare` functions — see plan Section 4.5 for code)
5. Required log fields per iteration (bullet list — 11 items)

**docx output:** Downloadable reference document — "AEGIS CDM Logic Reference".
Filename: `AEGIS_CDM_Logic_{date}.docx`

---

#### `templates/s3-implementation-guide.md`

**Source:** Supplementary S3.1–S3.7  
**Type:** reference-doc

Eight numbered steps with: title, source reference, action list,
deliverable, guide page link, and (where applicable) a warning callout.

Steps: (1) Assess clinical context → (2) ISO 14971 hazard analysis →
(3) Configure DARM → (4) Configure MMM → (5) Implement CDM →
(6) Run iteration 0 → (7) Enter iterative loop → (8) Document for submission

**docx output:** "AEGIS Implementation Guide" — downloadable reference.

---

#### `templates/capa.md`

**Source:** Supplementary Appendix D  
**Type:** form  
**Estimated time:** 20–40 minutes

Sections:

**Event identification**  
`iteration` (number), `decision_trigger` (dropdown: REJECT / ALARM / REJECT+ALARM /
CLINICAL REVIEW escalated), `alarm_conditions` (checkbox-group: A1/A2/A3),
`trigger_metrics` (textarea), `event_date` (date)

**Root cause analysis**  
`root_cause_category` (dropdown: 8 options including "Unknown — under investigation"),
`root_cause_desc` (textarea), `supporting_evidence` (textarea)

**Corrective action plan**  
`action_desc` (textarea), `responsible_person` (text), `target_date` (date),
`verification_method` (textarea), `preventive_action` (textarea)

**Regulatory notification assessment**  
`regulatory_notification` (dropdown: No / Yes-EU-MDR-Art87 / Yes-FDA-MDR /
Yes-both / Under review), `notification_rationale` (textarea),
`notification_date` (date)

**Pre-fill:** "Load iteration 10 example" fills:  
iteration=10, decision=REJECT+ALARM, alarm conditions=[A3], 
trigger_metrics="Sensitivity 0.428 < P_fail 0.65; Drift score 1.000 > θ_major 0.90",
root_cause_category="Data drift — concept drift",
root_cause_desc="Catastrophic label corruption (80% positive flip, 30% negative flip)
with Gaussian noise σ=4×std across n=25,000 samples."

**docx output:** CAPA record with severity highlight (amber shading on
decision field if REJECT+ALARM), sign-off block, copyright footer.
Filename: `AEGIS_CAPA_{device_name}_Iter{iteration}_{date}.docx`

---

#### `templates/README.md`

Template registry table:

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

Instructions for adding a new template, field type table, pre-fill button
documentation.

---

## 4. Build phases and execution order

### PHASE 0 — Environment setup

```bash
mkdir -p /home/claude/aegis-build
cd /home/claude/aegis-build
npm init -y
npm install docx marked js-yaml
mkdir -p templates/shared scripts docs/guide docs/forms \
          docs/assets/css docs/assets/js docs/assets/img \
          _layouts .github/workflows \
          examples/sepsis/data examples/brain_tumor
touch docs/.nojekyll
```

**Validate:**
```bash
node -e "require('docx'); require('marked'); require('js-yaml'); console.log('OK')"
```

---

### PHASE 1 — Templates directory

Create all files in `templates/` using the specifications in Section 3.

Files to create (in order):
1. `templates/shared/header.md`
2. `templates/shared/version-history.md`
3. `templates/shared/footer.md`
4. `templates/s1-checklist.md`
5. `templates/s2-config.md`
6. `templates/s2-threshold-table.md`
7. `templates/s3-cdm-pseudocode.md`
8. `templates/s3-implementation-guide.md`
9. `templates/capa.md`
10. `templates/README.md`

**Validate:**
```bash
ls /home/claude/aegis-build/templates/
ls /home/claude/aegis-build/templates/shared/
# Verify YAML frontmatter parses cleanly in each file:
node -e "
const yaml = require('js-yaml');
const fs = require('fs');
const files = fs.readdirSync('templates').filter(f => f.endsWith('.md'));
files.forEach(f => {
  const raw = fs.readFileSync('templates/' + f, 'utf8');
  const m = raw.match(/^---\n([\s\S]+?)\n---/);
  if (!m) { console.error('No frontmatter: ' + f); process.exit(1); }
  yaml.load(m[1]);
  console.log('OK: ' + f);
});
"
```

---

### PHASE 2 — CSS foundation

Create three CSS files before any HTML.

**`docs/assets/css/main.css`** — KI token system.  
Must contain:
- `:root` block with all `--ki-*` and `--color-*` custom properties (Section 5.1)
- `[data-theme="dark"]` block with dark overrides (Section 5.2)
- Base reset: `box-sizing: border-box`, `margin: 0`, `padding: 0`
- Typography: `font-family: 'DM Sans', sans-serif`, `font-size: 16px`, `line-height: 1.7`
- Heading styles: `font-weight: 500` for h1–h3
- Component styles: `.btn-primary`, `.btn-secondary`, `.btn-ghost`
- `.badge` base + `.badge-approve`, `.badge-cond`, `.badge-review`,
  `.badge-alarm`, `.badge-reject` (decision colours from Section 5.3)
- Card styles: `.card`, `.card-module`, `.card-stat`
- `.code-block` pre/code styling
- Accessibility: `.sr-only`, `:focus-visible` outlines

**`docs/assets/css/guide.css`** — Guide page layout.  
Must contain:
- Two-column layout: `.guide-layout` with `.guide-sidebar` (240px) + `.guide-content`
- `.guide-sidebar` navigation list styles
- `.callout-sepsis` — highlighted callout box (light blue bg, left border in KI blue)
- `.scroll-progress` — thin bar at top of page tracking scroll position
- Step cards: `.step-card` with numbered circle

**`docs/assets/css/forms.css`** — Form controls.  
Must contain:
- `.form-section` cards with section titles
- All input/select/textarea base styles (consistent height, border, focus)
- `.slider-group` layout (label + range + value display)
- Editable table styles (`.threshold-table td input`)
- `.btn-prefill` pre-fill button style (secondary, smaller)
- `.btn-download` download button style (primary, full-width)
- `.form-privacy` small muted text
- `.checkbox-item` label layout

**Validate:**
```bash
wc -l /home/claude/aegis-build/docs/assets/css/main.css   # expect > 180
wc -l /home/claude/aegis-build/docs/assets/css/guide.css  # expect > 80
wc -l /home/claude/aegis-build/docs/assets/css/forms.css  # expect > 100
grep "\-\-ki-dark-plum" /home/claude/aegis-build/docs/assets/css/main.css | wc -l
# expect > 0
```

---

### PHASE 3 — JavaScript

**`docs/assets/js/theme.js`**  
IIFE that runs before DOMContentLoaded to set `data-theme` without flash.
Reads `localStorage('aegis-theme')`, falls back to `prefers-color-scheme`.
`DOMContentLoaded` handler attaches click listener to `#theme-toggle`.

**`docs/assets/js/diagrams.js`**  
Animates DARM → MMM → CDM pipeline SVG in index.html.
Uses `requestAnimationFrame`. 8-step cycle. Wraps in
`prefers-reduced-motion` check — if reduced motion preferred, shows
final state statically without animation.

**`docs/assets/js/results-chart.js`**  
Chart.js 4. Two hardcoded datasets:
- Sepsis: iterations 0–10, sensitivity + MLcps lines, threshold annotations,
  decision badge labels (from manuscript Table VIII)
- BraTS: iterations 0–12, Golden DSC + Drifting DSC lines, Pfail threshold
  (from manuscript Table IX)
Toggle button: `#toggle-sepsis` / `#toggle-brats` swap `chart.data` and call
`chart.update('active')`.

**`docs/assets/js/forms-docx.js`**  
Shared docx.js utility module (loaded on all form pages).  
Exports (or exposes as globals on `window.AEGISForms`):
- `buildHeader(values)` → `Paragraph[]`
- `buildTable(columns, rows, colWidths)` → `Table`
- `buildCheckboxList(items, checkedIds)` → `Paragraph[]`
- `buildVersionHistory(authorName, date)` → `Table`
- `buildSignoff()` → `Paragraph[]`
- `buildFooter()` → `Paragraph`
- `triggerDownload(doc, filename)` → void

**Validate:**
```bash
for f in theme.js diagrams.js results-chart.js forms-docx.js; do
  [ -s /home/claude/aegis-build/docs/assets/js/$f ] \
    && echo "OK: $f" || echo "MISSING: $f"
done
```

---

### PHASE 4 — Build scripts

**`scripts/build-forms.js`**  
Reads each `templates/*.md` (skipping `shared/` and `README.md`).
For each template with `type: form`:
- Parses YAML frontmatter with `js-yaml`
- Calls `renderForm(tpl)` to produce form body HTML
- Injects body into `_layouts/form.html`
- Writes to `docs/forms/{tpl.id}.html`

For each template with `type: reference-doc`:
- Renders YAML content sections to HTML
- Writes to `docs/forms/{tpl.id}.html` as a readable page with a
  "Download .docx" button (docx is assembled from static content)

Also generates `docs/forms/index.html` — a hub page listing all forms
with title, description, estimated time, and supplement reference.

**`scripts/build-guide.js`**  
Reads each `docs/guide/*.md`. Uses `marked` to render Markdown to HTML.
Injects into `_layouts/guide.html`. Writes `docs/guide/*.html`.
Generates sidebar navigation from `NAV_ITEMS` array.

**`scripts/validate-build.js`**  
Checks a hardcoded list of ~25 required file paths.
Exits with code 1 if any are missing or empty.

**Validate:**
```bash
cd /home/claude/aegis-build
node scripts/build-forms.js 2>&1
node scripts/build-guide.js 2>&1
# Both should print "complete" with no errors
ls docs/forms/*.html
ls docs/guide/*.html
```

---

### PHASE 5 — Layout templates

**`_layouts/guide.html`**  
HTML skeleton for guide pages. Slots: `{{SIDENAV}}`, `{{CONTENT}}`,
`{{ACTIVE}}` (adds `.active` class to current nav item).  
Includes: Google Fonts DM Sans, main.css, guide.css, theme.js (inline,
before body to prevent flash), Prism.js for syntax highlighting,
results-chart.js not included (guide pages don't have the chart).

**`_layouts/form.html`**  
HTML skeleton for form pages. Slots: `{{TITLE}}`, `{{SUPPLEMENT}}`,
`{{CONTENT}}`, `{{DOCX_ID}}`, `{{DOCX_PATTERN}}`.  
Includes: Google Fonts, main.css, forms.css, theme.js,
`https://unpkg.com/docx@8/build/index.js`, forms-docx.js.
Inline `<script>` at bottom reads form values, calls `AEGISForms.*`
utilities, and passes resulting `Document` to `triggerDownload`.

**Validate:**
```bash
grep "{{CONTENT}}" /home/claude/aegis-build/_layouts/guide.html
grep "{{CONTENT}}" /home/claude/aegis-build/_layouts/form.html
# Both should return one match each
```

---

### PHASE 6 — Guide markdown source files

Create 10 `.md` files in `docs/guide/`. Each file is the human-authored
content for one guide page. It is rendered to HTML by `build-guide.js`.

**Required front matter in each guide `.md`:**
```yaml
---
title: "Page title"
supplement: "S2.1"         # which supplement section(s) this draws from
prev: "index.html"         # previous page (for footer navigation)
next: "02-configure.html"  # next page
---
```

**Required elements in each guide `.md`:**
- At least one `> **Sepsis example:**` blockquote callout with class `.callout-sepsis`
- At least one fenced code block where applicable
- A `→ [Download template]` link pointing to the relevant form page where one exists
- An `### Source` section noting the manuscript table/section numbers

**Pages and their primary content:**

`index.md` — What AEGIS is and what it is not; when to use it; reading order;
relationship between guide and supplement sections. Source: Manuscript Sec. I–II.

`01-concepts.md` — DARM/MMM/CDM definitions; gold standard concept; two-tier
threshold architecture; composite decision output (APPROVE+ALARM not
contradictory); configurability principle; notation table (Table XIII).
Source: Manuscript Sec. II-B.

`02-configure.md` — Instantiation parameters (Table IV); worked Sepsis example
column; worked BraTS column; which categories to activate per risk profile.
Source: Manuscript Sec. II-D, Table IV; Suppl. S2.1–S2.2.
Link to form: `../forms/s2-config.html`

`03-thresholds.md` — ISO 14971:2019 overview; all threshold types defined;
calibration methodology; Sepsis Table VII value by value; BraTS Table X.
Warning callout: "Do not use illustrative values in production."
Source: Manuscript Sec. II-B-3, Tables VI–VII; Suppl. S2.3.
Link to form: `../forms/s2-threshold-table.html`

`04-cdm-logic.md` — Ternary operator (Eq. 1); condition polarity;
P1–P4 priority hierarchy; A1–A3 alarm conditions; composite output;
full pseudocode (from `templates/s3-cdm-pseudocode.md`); logging spec.
Source: Manuscript Sec. II-B-3, Tables III, VI; Suppl. S3.3.
Link to form: `../forms/s3-cdm-pseudocode.html`

`05-mlcps.md` — What MLcps is; polar coordinate mechanics; getCPS package;
Sepsis weight config; how to derive weights; code snippet.
Source: Manuscript Sec. II-D, IV-E; Suppl. S2.4.

`06-drift.md` — Covariate vs concept drift; Bonferroni-corrected KS test
(Eq. 2); feature selection; minor/major thresholds; calibration from
baseline variability; concept drift proxy at P2; code snippet.
Source: Manuscript Sec. II-D, Eq. 2; Suppl. S2.5.

`07-audit-trail.md` — Why audit trail matters; 11 required log fields;
recommended JSON format; example iteration 7 log entry; retention.
Source: Manuscript Sec. II-B-3 CDM spec; Suppl. S1.4, S3.4.

`08-pccp-mapping.md` — Three PCCP components → AEGIS mapping table;
four categories as predetermined pathways; REJECT+ALARM composite state;
PCCP appendix preparation. Caveat: confirm with regulatory counsel.
Source: Manuscript Sec. IV-F, Table XI; Suppl. S2.8, S3.5.

`09-eu-mapping.md` — AI Act Article 43(4); technical documentation
requirements; EU MDR Article 83 and ALARM signal; MDCG 2025-6 key points;
PSUR reporting; risk management philosophy (Table I from manuscript).
Source: Manuscript Sec. II-A, IV-F, Table I; Suppl. S2.8; MDCG 2025-6.

**Validate:**
```bash
ls /home/claude/aegis-build/docs/guide/*.md | wc -l   # expect 10
grep -l "Sepsis example" /home/claude/aegis-build/docs/guide/*.md | wc -l  # expect ≥ 8
```

---

### PHASE 7 — Landing page (`docs/index.html`)

Handwritten HTML. Create after CSS and JS are in place.

**Section sequence:**

```html
<nav>           dark plum; logo; links; theme toggle</nav>
<section id="hero">       dark plum; title; subtitle; 3 CTAs; badges</section>
<section id="problem">    white; 3 stat cards</section>
<section id="architecture"> light orange; animated SVG; 3 module cards</section>
<section id="taxonomy">   white; 5 decision badges; regulatory table</section>
<section id="docs">       light blue; 3 step cards; download CTA</section>
<section id="results">    light orange; Chart.js toggle</section>
<section id="examples">   dark plum; 2 example cards</section>
<section id="cite">       dark plum; BibTeX; footer</section>
```

**Key implementation notes:**

Architecture SVG: inline in the HTML, not an `<img>`. The SVG must have
`id` attributes on each module rect for `diagrams.js` to target.
SVG node IDs: `#node-darm`, `#node-mmm`, `#node-cdm`, `#arrow-1`,
`#arrow-2`, `#arrow-3`, `#decision-badge`, `#feedback-arrow`.

Decision badges: each `<span class="badge badge-{key}">` has a
`data-tooltip` attribute containing the tooltip text (trigger condition +
FDA mapping + EU mapping). Tooltip shown on hover/focus via CSS
`:hover::after` + `[data-tooltip]` pattern (no JS needed).

Results chart: `<canvas id="results-chart">` + toggle buttons
`<button id="toggle-sepsis">` and `<button id="toggle-brats">`.

BibTeX block: `<pre id="bibtex-block">` with `<button id="copy-bibtex">`
that calls `navigator.clipboard.writeText`.

**Validate:**
```bash
grep -c "id=" /home/claude/aegis-build/docs/index.html  # expect > 10
grep "results-chart\|toggle-sepsis" /home/claude/aegis-build/docs/index.html | wc -l
# expect > 0
python3 -c "
from html.parser import HTMLParser
class V(HTMLParser):
  def __init__(self): super().__init__(); self.errors = []
  def handle_starttag(self,t,a): pass
v = V()
v.feed(open('docs/index.html').read())
print('HTML parses OK')
"
```

---

### PHASE 8 — Root files and CI

**`README.md`** — Badges row (DOI placeholder, arXiv placeholder, License,
Python 3.9+, Docker placeholder); 2-sentence abstract; quick start
(3 commands: clone, open notebook, Docker pull); links table; BibTeX block;
license section.

**`CITATION.cff`**

```yaml
cff-version: 1.2.0
message: "If you use AEGIS, please cite it using the metadata below."
title: "AEGIS: An Operational Infrastructure for Post-Market Governance
        of Adaptive Medical AI Under US and EU Regulations"
authors:
  - family-names: Afdideh
    given-names: Fardin
    affiliation: "Karolinska Institutet"
  - family-names: Astaraki
    given-names: Mehdi
    affiliation: "Karolinska Institutet"
  - family-names: Seoane
    given-names: Fernando
    affiliation: "Karolinska Institutet"
  - family-names: Abtahi
    given-names: Farhad
    affiliation: "Karolinska Institutet"
    email: farhad.abtahi@ki.se
doi: "10.XXXX/PLACEHOLDER"
url: "https://ki-smile.github.io/aegis"
repository-code: "https://github.com/ki-smile/aegis"
license: "LicenseRef-KI-SMAILE"
year: 2026
```

**`LICENSE`**

```
© 2026 SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments),
Karolinska Institutet. All rights reserved.

Permission is hereby granted to use and reference this software and its
documentation for research and educational purposes, provided that appropriate
attribution is given. For any other use, contact smaile@ki.se.
```

**`.github/workflows/build-guide.yml`**

```yaml
name: Build and deploy guide
on:
  push:
    branches: [main]
    paths:
      - 'docs/guide/*.md'
      - 'templates/**'
      - 'scripts/**'
      - '_layouts/**'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: {node-version: '20'}
      - run: npm ci
      - run: node scripts/build-guide.js
      - run: node scripts/build-forms.js
      - run: node scripts/validate-build.js
      - name: Commit rendered HTML
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/guide/*.html docs/forms/*.html
          git diff --staged --quiet || git commit -m "ci: rebuild guide and forms"
          git push
```

**`examples/sepsis/README.md`** — Colab badge, PhysioNet registration
instructions, local setup (3 commands), notebook description (11 iterations,
all 5 categories exercised), data note (not stored in repo).

**`examples/brain_tumor/README.md`** — Docker pull command
(`docker pull kismaile/aegis-brats:latest` — placeholder), GPU requirements,
BraTS 2023/24 data instructions, Docker run command with volume mount.

**`examples/sepsis/data/README.md`** — PhysioNet Sepsis Challenge 2019
download instructions and citation.

**Validate:**
```bash
node scripts/validate-build.js
# Expect: all items pass, exit code 0
```

---

### PHASE 9 — Copy to outputs

```bash
cp -r /home/claude/aegis-build/. /mnt/user-data/outputs/aegis/
echo "Written to /mnt/user-data/outputs/aegis/"
find /mnt/user-data/outputs/aegis -name "*.html" | wc -l   # expect > 20
find /mnt/user-data/outputs/aegis -name "*.md"   | wc -l   # expect > 20
```

---

## 5. KI colour system

### 5.1 Light theme (`:root`) custom properties

```css
:root {
  /* KI primary colours */
  --ki-dark-plum:     #4F0433;
  --ki-plum:          #870052;
  --ki-orange:        #FF876F;
  --ki-light-orange:  #FEEEEB;
  --ki-light-blue:    #EDF4F4;

  /* KI functional — plum */
  --ki-plum-light:    #EDDBE4;

  /* KI functional — orange */
  --ki-dark-orange:   #B84145;
  --ki-orange-light:  #FFDDD6;

  /* KI functional — blue */
  --ki-dark-blue:     #002C34;
  --ki-blue:          #4DB5BC;
  --ki-blue-light:    #CCEBED;

  /* KI functional — green */
  --ki-dark-green:    #094334;
  --ki-green:         #54B986;
  --ki-green-light:   #C7ECDC;

  /* KI functional — grey */
  --ki-grey:          #666666;
  --ki-grey-light:    #F1F1F1;

  /* KI functional — yellow */
  --ki-dark-yellow:   #F59A00;
  --ki-yellow:        #FFC66D;
  --ki-yellow-light:  #FFE7C2;

  /* Semantic aliases — light theme */
  --color-bg-page:        var(--ki-light-orange);
  --color-bg-section-alt: #FFFFFF;
  --color-bg-hero:        var(--ki-dark-plum);
  --color-bg-card:        var(--ki-light-blue);
  --color-text-primary:   #000000;
  --color-text-on-dark:   #FFFFFF;
  --color-text-muted:     var(--ki-grey);
  --color-accent:         var(--ki-orange);
  --color-accent-strong:  var(--ki-plum);
  --color-border:         var(--ki-plum-light);

  /* Decision badge colours */
  --decision-approve:    var(--ki-green);        /* #54B986 */
  --decision-cond:       var(--ki-yellow);       /* #FFC66D */
  --decision-review:     var(--ki-dark-yellow);  /* #F59A00 */
  --decision-alarm:      var(--ki-dark-orange);  /* #B84145 */
  --decision-reject:     var(--ki-dark-plum);    /* #4F0433 */
}
```

### 5.2 Dark theme overrides (`[data-theme="dark"]`)

```css
[data-theme="dark"] {
  --color-bg-page:        #1a0118;
  --color-bg-section-alt: #240820;
  --color-bg-hero:        #0e000c;
  --color-bg-card:        #1f1030;
  --color-text-primary:   #F5EDF3;
  --color-text-on-dark:   #F5EDF3;
  --color-text-muted:     #A08898;
  --color-border:         #3d1a30;
  --color-accent:         #FF876F;   /* KI orange — unchanged */
  --color-accent-strong:  #c066a0;   /* lightened plum for dark bg */
  /* Decision badge colours unchanged — self-contained contrast */
}
```

### 5.3 Decision badge CSS

```css
.badge {
  display: inline-flex; align-items: center;
  padding: 4px 14px; border-radius: 20px;
  font-family: 'DM Sans', sans-serif;
  font-weight: 500; font-size: 13px;
}
.badge-approve  { background: var(--decision-approve);  color: #094334; }
.badge-cond     { background: var(--decision-cond);     color: #4F0433; }
.badge-review   { background: var(--decision-review);   color: #4F0433; }
.badge-alarm    { background: var(--decision-alarm);    color: #FFFFFF; }
.badge-reject   { background: var(--decision-reject);   color: #FFFFFF; }
```

### 5.4 Typography

```css
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

body {
  font-family: 'DM Sans', sans-serif;
  font-weight: 400;
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text-primary);
  background-color: var(--color-bg-page);
}
h1 { font-size: 2.2rem; font-weight: 500; }
h2 { font-size: 1.6rem; font-weight: 500; }
h3 { font-size: 1.2rem; font-weight: 500; }
/* Never use font-weight: 600 or 700 — outside KI spec */
```

### 5.5 Section colour schedule

| Section | Light bg | Dark bg | Text (light) | Text (dark) |
|---------|----------|---------|-------------|-------------|
| Nav | `#4F0433` | `#0e000c` | `#FFFFFF` | `#F5EDF3` |
| Hero | `#4F0433` | `#0e000c` | `#FFFFFF` | `#F5EDF3` |
| Problem | `#FFFFFF` | `#1a0118` | `#000000` | `#F5EDF3` |
| Architecture | `#FEEEEB` | `#240820` | `#000000` | `#F5EDF3` |
| Taxonomy | `#FFFFFF` | `#1a0118` | `#000000` | `#F5EDF3` |
| Docs overview | `#EDF4F4` | `#1f1030` | `#002C34` | `#CCEBED` |
| Results | `#FEEEEB` | `#240820` | `#000000` | `#F5EDF3` |
| Examples | `#4F0433` | `#0e000c` | `#FFFFFF` | `#F5EDF3` |
| Cite + footer | `#4F0433` | `#0e000c` | `#FFFFFF` | `#F5EDF3` |

Decision badge colours are identical in both themes.

### 5.6 Accessibility

Do not use plum `#870052` on orange `#FF876F` — fails WCAG 2.1.  
All other KI colour combinations in the schedule above are confirmed compliant.  
Bright chart fills (light orange, light blue) require 0.5pt black outlines
between adjacent segments per KI chart accessibility guidance.

---

## 6. Resolved decisions (all pre-build questions)

| # | Question | Decision |
|---|----------|----------|
| 1 | Guide rendering | Pre-rendered HTML via `scripts/build-guide.js` |
| 2 | Colour scheme | Dark default; light toggle; `localStorage` persistence |
| 3 | Supplementary PDF | Stays on preprint/journal servers |
| 4 | Version history in docx | Yes — 3 pre-populated rows in S1 and S2 outputs |
| 5 | Citation DOI | Placeholder `10.XXXX/PLACEHOLDER` |
| 6 | Docker Hub org | Placeholder `kismaile/aegis-brats` |

---

*Plan version: 2.0 — restructured for Claude-executable build; templates directory added*  
*© 2026 SMAILE (Stockholm Medical Artificial Intelligence and Learning Environments), Karolinska Institutet. All rights reserved.*
