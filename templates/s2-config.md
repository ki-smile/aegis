---
id: s2-config
title: "Domain configuration template"
supplement: "S2"
docx_title: "AEGIS Domain Configuration"
docx_filename_pattern: "AEGIS_S2_Config_{device_name}_{date}.docx"
type: form
description: "Complete domain configuration covering deployment context, datasets, thresholds, MLcps weights, drift detection, decision categories, gold standard, and regulatory pathway mapping."
estimated_time: "60–120 minutes"
includes_shared: [header, version-history, footer]
sections:
  - id: deployment-context
    title: "Deployment context"
    source: "Supplementary S2.1"
    type: fields
    fields:
      - id: data_modality
        label: "Data modality"
        type: dropdown
        required: true
        options: ["Tabular EHR", "Medical imaging (2D)", "Medical imaging (3D volumetric)", "Time series", "Genomics / omics", "Natural language / clinical notes", "Multi-modal"]
        docx_style: bold_label
        sepsis_example: "Tabular EHR"
        brats_example: "Medical imaging (3D volumetric)"
      - id: model_arch
        label: "Model architecture"
        type: text
        required: true
        placeholder: "e.g. Random Forest, 300 trees"
        docx_style: bold_label
        sepsis_example: "Random Forest, 300 trees"
        brats_example: "nnU-Net ResENC-M"
      - id: primary_metrics
        label: "Primary performance metrics"
        type: text
        required: true
        placeholder: "e.g. Sensitivity, Specificity, ROC-AUC"
        docx_style: bold_label
        sepsis_example: "Sensitivity, Specificity, ROC-AUC, Balanced Accuracy"
        brats_example: "Dice Similarity Coefficient (DSC)"
      - id: use_case
        label: "Clinical use case"
        type: textarea
        required: true
        placeholder: "Describe the clinical context, target population, and intended workflow"
        docx_style: bold_label
        sepsis_example: "Early prediction of sepsis onset in adult ICU patients using continuous EHR monitoring. Model produces hourly risk scores; clinician receives alert when score exceeds threshold."
        brats_example: "Automated segmentation of brain tumours (glioma) from multi-modal MRI (T1, T1ce, T2, FLAIR) for neurosurgical planning. Segmentation masks reviewed by neuroradiologist before clinical use."

  - id: dataset-configuration
    title: "Dataset configuration"
    source: "Supplementary S2.2"
    type: fields
    fields:
      - id: golden_size
        label: "Golden dataset size (N)"
        type: number
        required: true
        placeholder: "e.g. 4067"
        docx_style: bold_label
        sepsis_example: "4067"
        brats_example: "1251"
      - id: golden_desc
        label: "Golden dataset description"
        type: textarea
        required: true
        placeholder: "Source, inclusion/exclusion criteria, time period"
        docx_style: bold_label
        sepsis_example: "PhysioNet Computing in Cardiology Challenge 2019, Hospital A subset. Adult ICU admissions with ≥8 hours of hourly vital signs and laboratory values."
        brats_example: "BraTS 2023 training set. Adult glioma patients with pre-operative multi-modal MRI (T1, T1ce, T2, FLAIR) and expert segmentation masks."
      - id: split_strategy
        label: "Split strategy"
        type: dropdown
        required: true
        options: ["Random hold-out", "Temporal split", "Site-based split", "Stratified random", "Cross-validation", "Other"]
        docx_style: bold_label
        sepsis_example: "Random hold-out"
        brats_example: "Random hold-out"
      - id: split_detail
        label: "Split details"
        type: textarea
        required: true
        placeholder: "Training/golden/drifting proportions and methodology"
        docx_style: bold_label
        sepsis_example: "80/20 split. Training D_T,0: 3,254 samples. Golden D_G: 813 samples. Drifting D_D,k: N=5,000 synthetic samples per iteration (generated with controlled corruption)."
        brats_example: "80/20 split. Training: 1,001 cases. Golden: 250 cases. Drifting: BraTS 2024 validation set (219 cases) with progressive augmentation."
      - id: dedup_method
        label: "Deduplication method"
        type: text
        required: true
        placeholder: "e.g. Patient ID hashing across all splits"
        docx_style: bold_label
        sepsis_example: "Patient ID deduplication via SHA-256 hash across all splits"
        brats_example: "Case ID deduplication; no patient overlap between BraTS 2023 and 2024 cohorts confirmed by challenge organisers"

  - id: threshold-specification
    title: "Threshold specification"
    source: "Supplementary S2.3"
    type: table
    instruction: "All thresholds must be derived from ISO 14971:2019 hazard analysis. Enter the hazard ID from your risk management file."
    columns:
      - id: parameter
        label: "Parameter"
      - id: symbol
        label: "Symbol"
      - id: value
        label: "Value"
      - id: justification
        label: "Clinical justification"
      - id: hazard_id
        label: "ISO 14971 hazard ID"
      - id: source
        label: "Source"
    rows:
      - parameter: "Critical safety floor"
        symbol: "P_fail"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Sens. < 0.65"
        sepsis_justification: "Below this sensitivity, unacceptable miss rate for sepsis onset"
      - parameter: "Performance buffer — sensitivity"
        symbol: "R_G(sens)"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Sens. < 0.66"
        sepsis_justification: "1 percentage point above P_fail; triggers CONDITIONAL APPROVAL"
      - parameter: "Performance buffer — specificity"
        symbol: "R_G(spec)"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Spec. < 0.60"
        sepsis_justification: "Minimum acceptable specificity for ICU workflow"
      - parameter: "Gold standard tolerance"
        symbol: "τ"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.015 (sensitivity)"
        sepsis_justification: "Acceptable deviation from gold standard baseline"
      - parameter: "Minor drift lower bound"
        symbol: "θ_minor,low"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.30"
        sepsis_justification: "Below this, drift considered negligible"
      - parameter: "Minor drift upper bound"
        symbol: "θ_minor,high"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.70"
        sepsis_justification: "Above this, drift escalated to major"
      - parameter: "Major drift threshold"
        symbol: "θ_major"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.90"
        sepsis_justification: "Severe distribution shift; triggers ALARM A3"
      - parameter: "PMS safety floor (released model)"
        symbol: "P_PMS"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Sens. 0.65"
        sepsis_justification: "Post-market minimum; aligned with P_fail"
      - parameter: "PMS regression margin"
        symbol: "δ"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.020–0.030"
        sepsis_justification: "Acceptable regression from released performance"

  - id: mlcps-configuration
    title: "MLcps configuration"
    source: "Supplementary S2.4"
    type: fields
    instruction: "Define up to four metric-weight pairs for the composite performance score. Weights range from 0.5 (low priority) to 3.0 (critical)."
    fields:
      - id: metric1_name
        label: "Metric 1 name"
        type: text
        placeholder: "e.g. Sensitivity"
        docx_style: bold_label
        sepsis_example: "Sensitivity"
        brats_example: "DSC"
      - id: metric1_weight
        label: "Metric 1 weight"
        type: slider
        min: 0.5
        max: 3.0
        step: 0.1
        default: 1.0
        docx_style: bold_label
        sepsis_example: 1.5
        brats_example: 1.0
      - id: metric2_name
        label: "Metric 2 name"
        type: text
        placeholder: "e.g. ROC-AUC"
        docx_style: bold_label
        sepsis_example: "ROC-AUC"
        brats_example: ""
      - id: metric2_weight
        label: "Metric 2 weight"
        type: slider
        min: 0.5
        max: 3.0
        step: 0.1
        default: 1.0
        docx_style: bold_label
        sepsis_example: 1.3
        brats_example: 1.0
      - id: metric3_name
        label: "Metric 3 name"
        type: text
        placeholder: "e.g. Balanced Accuracy"
        docx_style: bold_label
        sepsis_example: "Balanced Accuracy"
        brats_example: ""
      - id: metric3_weight
        label: "Metric 3 weight"
        type: slider
        min: 0.5
        max: 3.0
        step: 0.1
        default: 1.0
        docx_style: bold_label
        sepsis_example: 1.1
        brats_example: 1.0
      - id: metric4_name
        label: "Metric 4 name"
        type: text
        placeholder: "e.g. Specificity"
        docx_style: bold_label
        sepsis_example: "Specificity"
        brats_example: ""
      - id: metric4_weight
        label: "Metric 4 weight"
        type: slider
        min: 0.5
        max: 3.0
        step: 0.1
        default: 1.0
        docx_style: bold_label
        sepsis_example: 1.0
        brats_example: 1.0
      - id: mlcps_derivation
        label: "Weight derivation method"
        type: dropdown
        options: ["Clinical risk assessment", "Literature review", "Expert panel consensus", "Regulatory requirement", "Other"]
        docx_style: bold_label
        sepsis_example: "Clinical risk assessment"
        brats_example: "Clinical risk assessment"

  - id: drift-detection
    title: "Drift detection configuration"
    source: "Supplementary S2.5"
    type: fields
    fields:
      - id: drift_method
        label: "Drift detection method"
        type: dropdown
        required: true
        options: ["KS + Bonferroni", "MMD", "PSI", "Performance comparison", "Other"]
        docx_style: bold_label
        sepsis_example: "KS + Bonferroni"
        brats_example: "Performance comparison"
      - id: drift_K
        label: "Number of features (K)"
        type: number
        required: true
        placeholder: "e.g. 34"
        docx_style: bold_label
        sepsis_example: "34"
        brats_example: "1"
      - id: drift_alpha
        label: "Significance level (α)"
        type: number
        required: true
        default: 0.05
        step: 0.01
        docx_style: bold_label
        sepsis_example: "0.05"
        brats_example: "0.05"
      - id: drift_alpha_prime
        label: "Corrected significance (α' = α/K)"
        type: text
        help: "Auto-calculated: α divided by K"
        docx_style: bold_label
        sepsis_example: "0.00147"
        brats_example: "0.05"
      - id: drift_features
        label: "Feature list for drift monitoring"
        type: textarea
        placeholder: "List all features monitored for drift"
        docx_style: bold_label
        sepsis_example: "HR, O2Sat, Temp, SBP, MAP, DBP, Resp, EtCO2, BaseExcess, HCO3, FiO2, pH, PaCO2, SaO2, AST, BUN, Alkalinephos, Calcium, Chloride, Creatinine, Bilirubin_direct, Glucose, Lactate, Magnesium, Phosphate, Potassium, Bilirubin_total, TroponinI, Hct, Hgb, PTT, WBC, Fibrinogen, Platelets"
        brats_example: "Dice Similarity Coefficient (DSC)"

  - id: active-categories
    title: "Active decision categories"
    source: "Supplementary S2.6"
    type: fields
    instruction: "APPROVE and REJECT are always active. Optionally disable intermediate categories with clinical justification."
    fields:
      - id: cat_approve
        label: "APPROVE"
        type: fixed-checked
        docx_style: checkbox_row
      - id: cat_reject
        label: "REJECT"
        type: fixed-checked
        docx_style: checkbox_row
      - id: cat_conditional
        label: "CONDITIONAL APPROVAL"
        type: dropdown
        options: ["Enabled", "Disabled"]
        default: "Enabled"
        docx_style: checkbox_row
        sepsis_example: "Enabled"
        brats_example: "Disabled"
      - id: cat_conditional_justification
        label: "Justification for disabling CONDITIONAL APPROVAL"
        type: textarea
        help: "Required if CONDITIONAL APPROVAL is disabled"
        docx_style: bold_label
        brats_example: "Binary pass/fail segmentation quality metric (DSC) does not support a meaningful intermediate category. Clinical workflow requires definitive accept or reject of segmentation mask."
      - id: cat_review
        label: "CLINICAL REVIEW"
        type: dropdown
        options: ["Enabled", "Disabled"]
        default: "Enabled"
        docx_style: checkbox_row
        sepsis_example: "Enabled"
        brats_example: "Disabled"
      - id: cat_review_justification
        label: "Justification for disabling CLINICAL REVIEW"
        type: textarea
        help: "Required if CLINICAL REVIEW is disabled"
        docx_style: bold_label
        brats_example: "Segmentation review is standard clinical practice; a separate CLINICAL REVIEW category adds no decision value."

  - id: gold-standard
    title: "Gold standard baseline"
    source: "Supplementary S2.7"
    type: fields
    fields:
      - id: gold_iteration
        label: "Gold standard iteration"
        type: number
        default: 0
        docx_style: bold_label
        sepsis_example: "0"
        brats_example: "0"
      - id: gold_metrics
        label: "Gold standard metric values"
        type: textarea
        placeholder: "Metric values at gold standard iteration"
        docx_style: bold_label
        sepsis_example: "Sensitivity: 0.890, Specificity: 0.798, ROC-AUC: 0.920, Balanced Accuracy: 0.844, MLcps: 0.876"
        brats_example: "DSC: 0.912"
      - id: gold_date
        label: "Gold standard date"
        type: date
        docx_style: bold_label
      - id: gold_dataset_id
        label: "Gold standard dataset ID"
        type: text
        placeholder: "Hash or version tag of golden dataset"
        docx_style: bold_label
        sepsis_example: "sha256:a3f7c2...golden_v1.0"
        brats_example: "brats2023_golden_v1.0"

  - id: regulatory-mapping
    title: "Regulatory pathway mapping"
    source: "Supplementary S2.8"
    type: fields
    instruction: "Map AEGIS configuration to PCCP components. Pre-populated with template text — customise for your device."
    fields:
      - id: pccp_component1
        label: "Description of Modifications (PCCP Component 1)"
        type: textarea
        docx_style: bold_label
        default: "The AEGIS framework governs iterative model updates through a structured loop: retrain on accumulated data (DARM), evaluate performance and drift (MMM), and apply rule-based decision logic (CDM). Each iteration produces a new model version with full traceability."
        sepsis_example: "The AEGIS framework governs iterative model updates through a structured loop: retrain on accumulated data (DARM), evaluate performance and drift (MMM), and apply rule-based decision logic (CDM). Each iteration produces a new model version with full traceability. For this sepsis prediction device, modifications include retraining on newly accumulated ICU patient data and recalibration of sensitivity thresholds."
      - id: pccp_component2
        label: "Modification Protocol (PCCP Component 2)"
        type: textarea
        docx_style: bold_label
        default: "Pre-specified modification protocol: (1) Data accumulates unconditionally per DARM rule; (2) Model retrained on D_T,k+1; (3) Performance evaluated against golden dataset D_G; (4) CDM applies priority-ordered decision hierarchy; (5) Approved models released; rejected models trigger CAPA."
      - id: pccp_component3
        label: "Impact Assessment (PCCP Component 3)"
        type: textarea
        docx_style: bold_label
        default: "Impact assessment relies on threshold-based monitoring: performance regression is flagged when metrics fall below pre-specified limits derived from ISO 14971 hazard analysis. The CDM composite output (decision + alarm state) provides structured impact classification."
---

Full domain configuration template covering all deployment parameters.
Source: Supplementary S2.1–S2.8, Manuscript Table IV.
