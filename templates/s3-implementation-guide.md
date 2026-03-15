---
id: s3-implementation-guide
title: "Step-by-step deployment workflow"
supplement: "S3"
docx_title: "AEGIS Implementation Guide"
docx_filename_pattern: "AEGIS_Implementation_Guide_{date}.docx"
type: reference-doc
description: "Eight-step deployment workflow covering clinical context assessment through regulatory submission. Each step includes actions, deliverables, and links to relevant guide pages and templates."
includes_shared: [footer]
sections:
  - id: step-1
    title: "Step 1 — Assess clinical context"
    source: "Supplementary S3.1"
    type: bullet-list
    items:
      - "Identify the clinical domain, patient population, and intended use"
      - "Determine regulatory jurisdiction (US FDA / EU MDR / both)"
      - "Classify device risk (Class I, IIa, IIb, III-PMA)"
      - "Document intended use statement per IEC 62304"
    deliverable: "Completed S1 checklist, regulatory context section"
    guide_link: "guide/01-concepts.html"
    form_link: "forms/s1-checklist.html"

  - id: step-2
    title: "Step 2 — ISO 14971 hazard analysis"
    source: "Supplementary S3.1"
    type: bullet-list
    warning: "Do not use illustrative threshold values from this guide in production. All thresholds must be derived from your own ISO 14971:2019 hazard analysis."
    items:
      - "Conduct hazard analysis per ISO 14971:2019"
      - "Identify hazardous situations related to model performance degradation"
      - "Assign hazard IDs to each identified risk"
      - "Derive all AEGIS thresholds from the hazard analysis (P_fail, R_G, τ, θ, P_PMS, δ)"
      - "Document clinical justification for each threshold value"
    deliverable: "Completed threshold traceability table"
    guide_link: "guide/03-thresholds.html"
    form_link: "forms/s2-threshold-table.html"

  - id: step-3
    title: "Step 3 — Configure DARM"
    source: "Supplementary S3.2"
    type: bullet-list
    items:
      - "Define three dataset splits: Training D_T,k, Golden D_G, Drifting D_D,k"
      - "Lock and hash the golden dataset before first deployment"
      - "Verify patient/sample deduplication across all splits"
      - "Document the data accumulation rule: D_T,k+1 = D_T,k ∪ D_D,k"
      - "Establish dataset versioning and provenance metadata"
      - "Document label governance process"
    deliverable: "S2 configuration — dataset section completed"
    guide_link: "guide/02-configure.html"

  - id: step-4
    title: "Step 4 — Configure MMM"
    source: "Supplementary S3.3"
    type: bullet-list
    items:
      - "Select primary performance metrics with clinical justification"
      - "Configure MLcps weights (0.5–3.0 per metric)"
      - "Select drift detection method and specify feature set"
      - "Define fairness metrics and relevant subgroups"
      - "Set up KPI historical database"
    deliverable: "S2 configuration — MLcps and drift sections completed"
    guide_link: "guide/05-mlcps.html"

  - id: step-5
    title: "Step 5 — Implement CDM"
    source: "Supplementary S3.3"
    type: bullet-list
    items:
      - "Implement decision hierarchy (P1–P4) from reference pseudocode"
      - "Implement alarm conditions (A1–A3)"
      - "Decide which intermediate categories to activate (CONDITIONAL APPROVAL, CLINICAL REVIEW)"
      - "Document polarity convention for all conditions"
      - "Implement iteration logging with all 11 required fields"
    deliverable: "CDM implementation verified against reference code"
    guide_link: "guide/04-cdm-logic.html"
    form_link: "forms/s3-cdm-pseudocode.html"

  - id: step-6
    title: "Step 6 — Run iteration 0"
    source: "Supplementary S3.4"
    type: bullet-list
    items:
      - "Train initial model on D_T,0"
      - "Evaluate on golden dataset D_G"
      - "Record baseline metrics as gold standard"
      - "Verify CDM returns APPROVE for baseline performance"
      - "Lock gold standard with version tag and dataset hash"
      - "Document all metrics in audit trail"
    deliverable: "Gold standard baseline documented; first audit log entry"
    guide_link: "guide/07-audit-trail.html"

  - id: step-7
    title: "Step 7 — Enter iterative loop"
    source: "Supplementary S3.5"
    type: bullet-list
    items:
      - "For each iteration k ≥ 1:"
      - "  Accumulate drifting data: D_T,k+1 = D_T,k ∪ D_D,k"
      - "  Retrain model on D_T,k+1"
      - "  Evaluate on D_G (performance) and D_D,k (drift)"
      - "  Run CDM evaluation"
      - "  Log all fields to audit trail"
      - "  If REJECT or ALARM: initiate CAPA workflow"
      - "  If APPROVE: release model with version tag"
    deliverable: "Continuous monitoring with full audit trail"
    guide_link: "guide/06-drift.html"
    form_link: "forms/capa.html"

  - id: step-8
    title: "Step 8 — Document for submission"
    source: "Supplementary S3.6–S3.7"
    type: bullet-list
    items:
      - "Complete S2 configuration template with all deployment parameters"
      - "Map AEGIS configuration to PCCP components (if FDA pathway)"
      - "Map to EU MDR / AI Act requirements (if CE pathway)"
      - "Compile audit trail history"
      - "Prepare CAPA records for any REJECT/ALARM events"
      - "Submit documentation per regulatory pathway"
    deliverable: "Complete regulatory documentation package"
    guide_link: "guide/08-pccp-mapping.html"
---

Eight-step deployment workflow for implementing AEGIS.
Each step references specific guide pages and form templates.
