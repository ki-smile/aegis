---
id: s2-threshold-table
title: "Threshold traceability table"
supplement: "S2.3"
docx_title: "AEGIS Threshold Traceability Table"
docx_filename_pattern: "AEGIS_S2.3_Thresholds_{device_name}_{date}.docx"
type: form
description: "Standalone threshold traceability table for sharing separately from the full S2 configuration. All thresholds must reference ISO 14971:2019 hazard analysis."
estimated_time: "15–30 minutes"
includes_shared: [header, version-history, footer]
sections:
  - id: threshold-table
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
      - parameter: "Performance buffer — sensitivity"
        symbol: "R_G(sens)"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Sens. < 0.66"
      - parameter: "Performance buffer — specificity"
        symbol: "R_G(spec)"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Spec. < 0.60"
      - parameter: "Gold standard tolerance"
        symbol: "τ"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.015 (sensitivity)"
      - parameter: "Minor drift lower bound"
        symbol: "θ_minor,low"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.30"
      - parameter: "Minor drift upper bound"
        symbol: "θ_minor,high"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.70"
      - parameter: "Major drift threshold"
        symbol: "θ_major"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.90"
      - parameter: "PMS safety floor"
        symbol: "P_PMS"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "Sens. 0.65"
      - parameter: "PMS regression margin"
        symbol: "δ"
        value: ""
        justification: ""
        hazard_id: ""
        source: ""
        sepsis_value: "0.020–0.030"
---

Standalone threshold traceability table. References the same rows as the threshold section in `s2-config.md`.
Useful when a regulatory reviewer needs only the threshold document.
