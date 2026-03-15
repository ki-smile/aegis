---
id: s1-checklist
title: "Implementation readiness checklist"
supplement: "S1"
docx_title: "AEGIS Implementation Readiness Checklist"
docx_filename_pattern: "AEGIS_S1_Checklist_{device_name}_{date}.docx"
type: form
description: "Verify that all AEGIS components are configured before first deployment. Covers DARM, MMM, CDM, regulatory documentation, and CAPA integration."
estimated_time: "30–60 minutes"
includes_shared: [header, version-history, footer]
sections:
  - id: regulatory-context
    title: "Regulatory context"
    source: "Supplementary S1.1"
    type: fields
    fields:
      - id: risk_class
        label: "Risk classification"
        type: dropdown
        required: true
        options: ["Class I", "Class IIa", "Class IIb", "Class III-PMA"]
        docx_style: bold_label
        sepsis_example: "Class IIa"
        brats_example: "Class IIb"
      - id: reg_pathway
        label: "Regulatory pathway"
        type: dropdown
        required: true
        options: ["510(k)", "De Novo", "PMA", "CE-MDR", "AI Act high-risk", "Other"]
        docx_style: bold_label
        sepsis_example: "De Novo"
        brats_example: "CE-MDR"
      - id: pccp_planned
        label: "PCCP planned"
        type: dropdown
        required: true
        options: ["Yes", "No", "Under discussion"]
        docx_style: bold_label
        sepsis_example: "Yes"
        brats_example: "Yes"

  - id: darm-configuration
    title: "DARM configuration"
    source: "Supplementary S1.2"
    type: checkbox-group
    items:
      - id: darm_splits
        label: "Three dataset splits defined (Training D_T,k, Golden D_G, Drifting D_D,k)"
      - id: darm_golden_locked
        label: "Golden dataset locked, hashed, and documented before first deployment"
      - id: darm_dedup
        label: "Patient/sample deduplication across splits confirmed"
      - id: darm_label_gov
        label: "Label governance process documented (adjudication criteria, reviewer IDs)"
      - id: darm_versioning
        label: "Dataset versioning and provenance metadata system in place"
      - id: darm_accumulation
        label: "Data accumulation rule documented: D_T,k+1 = D_T,k ∪ D_D,k (unconditional)"

  - id: mmm-configuration
    title: "MMM configuration"
    source: "Supplementary S1.3"
    type: checkbox-group
    items:
      - id: mmm_metrics
        label: "Primary metrics selected and clinically justified"
      - id: mmm_mlcps
        label: "MLcps weights defined and traced to risk assessment"
      - id: mmm_drift
        label: "Drift detection method selected with feature set specified"
      - id: mmm_fairness
        label: "Fairness metrics defined across relevant subgroups"
      - id: mmm_kpi
        label: "KPI historical database structure defined"

  - id: cdm-configuration
    title: "CDM configuration"
    source: "Supplementary S1.4"
    type: checkbox-group
    items:
      - id: cdm_categories
        label: "Active decision categories defined and clinically justified"
      - id: cdm_thresholds
        label: "All thresholds derived from ISO 14971:2019 hazard analysis with hazard IDs"
      - id: cdm_polarity
        label: "CDM condition polarity convention documented"
      - id: cdm_pseudocode
        label: "CDM pseudo-code reviewed and implementation verified (Suppl. S3.3)"
      - id: cdm_logging
        label: "Logging requirements confirmed (all fields listed in guide/07-audit-trail.html)"
      - id: cdm_gold_standard
        label: "Gold standard baseline locked at first APPROVE with version tag"

  - id: regulatory-documentation
    title: "Regulatory documentation"
    source: "Supplementary S1.5"
    type: checkbox-group
    items:
      - id: reg_s2_complete
        label: "S2 configuration template completed"
      - id: reg_pccp_drafted
        label: "PCCP / technical documentation sections drafted"
      - id: reg_gold_documented
        label: "Gold standard baseline documented with metric values and dataset ID"
      - id: reg_capa_defined
        label: "CAPA / vigilance escalation pathway defined"

  - id: capa-pms
    title: "CAPA and PMS integration"
    source: "Supplementary S1.6"
    type: checkbox-group
    items:
      - id: pms_capa_triggers
        label: "CAPA triggers defined for each decision category"
      - id: pms_contacts
        label: "Regulatory escalation contacts identified"
      - id: pms_thresholds
        label: "MDR Art. 83 / FDA PMS reporting thresholds documented"
      - id: pms_psur
        label: "PSUR schedule established"
---

Implementation readiness checklist covering all AEGIS components.
Pre-fill: Sepsis example fills risk_class and reg_pathway only — checklist items are left for user completion.
