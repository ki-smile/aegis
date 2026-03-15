---
id: capa
title: "CAPA record"
supplement: "Appendix D"
docx_title: "AEGIS CAPA Record"
docx_filename_pattern: "AEGIS_CAPA_{device_name}_Iter{iteration}_{date}.docx"
type: form
description: "Corrective and preventive action record for REJECT, ALARM, or escalated CLINICAL REVIEW events. Includes root cause analysis, corrective action plan, and regulatory notification assessment."
estimated_time: "20–40 minutes"
includes_shared: [header, version-history, footer]
sections:
  - id: event-identification
    title: "Event identification"
    source: "Supplementary Appendix D"
    type: fields
    fields:
      - id: iteration
        label: "Iteration number"
        type: number
        required: true
        placeholder: "e.g. 10"
        docx_style: bold_label
        sepsis_example: "10"
      - id: decision_trigger
        label: "Decision trigger"
        type: dropdown
        required: true
        options: ["REJECT", "ALARM", "REJECT + ALARM", "CLINICAL REVIEW escalated"]
        docx_style: bold_label
        sepsis_example: "REJECT + ALARM"
      - id: alarm_conditions
        label: "Alarm conditions triggered"
        type: checkbox-group
        options:
          - id: a1
            label: "A1 — Released model below PMS safety floor"
          - id: a2
            label: "A2 — Released model regression exceeds δ"
          - id: a3
            label: "A3 — Severe covariate drift (drift score > θ_major)"
        docx_style: checkbox_row
        sepsis_example: ["a3"]
      - id: trigger_metrics
        label: "Trigger metrics and values"
        type: textarea
        required: true
        placeholder: "List the specific metrics that triggered the event"
        docx_style: bold_label
        sepsis_example: "Sensitivity 0.428 < P_fail 0.65; Drift score 1.000 > θ_major 0.90"
      - id: event_date
        label: "Event date"
        type: date
        required: true
        docx_style: bold_label

  - id: root-cause
    title: "Root cause analysis"
    source: "Supplementary Appendix D"
    type: fields
    fields:
      - id: root_cause_category
        label: "Root cause category"
        type: dropdown
        required: true
        options:
          - "Data drift — covariate drift"
          - "Data drift — concept drift"
          - "Data quality — labelling error"
          - "Data quality — missing values"
          - "Model degradation — overfitting"
          - "Model degradation — underfitting"
          - "Infrastructure failure"
          - "Unknown — under investigation"
        docx_style: bold_label
        sepsis_example: "Data drift — concept drift"
      - id: root_cause_desc
        label: "Root cause description"
        type: textarea
        required: true
        placeholder: "Describe the identified or suspected root cause"
        docx_style: bold_label
        sepsis_example: "Catastrophic label corruption (80% positive flip, 30% negative flip) with Gaussian noise σ=4×std across n=25,000 samples."
      - id: supporting_evidence
        label: "Supporting evidence"
        type: textarea
        placeholder: "Reference audit logs, metric plots, or drift analysis results"
        docx_style: bold_label
        sepsis_example: "Audit log iteration 10: sensitivity dropped from 0.890 (gold standard) to 0.428. Drift score reached 1.000 (all 34 features significant). Label corruption confirmed via comparison with original PhysioNet labels."

  - id: corrective-action
    title: "Corrective action plan"
    source: "Supplementary Appendix D"
    type: fields
    fields:
      - id: action_desc
        label: "Corrective action description"
        type: textarea
        required: true
        placeholder: "Describe the planned corrective action"
        docx_style: bold_label
        sepsis_example: "Discard corrupted drifting dataset D_D,10. Retrain model on D_T,10 excluding corrupted samples. Re-evaluate on golden dataset D_G."
      - id: responsible_person
        label: "Responsible person"
        type: text
        required: true
        placeholder: "e.g. Dr. A. Clinician"
        docx_style: bold_label
        sepsis_example: "Dr. A. Clinician"
      - id: target_date
        label: "Target completion date"
        type: date
        required: true
        docx_style: bold_label
      - id: verification_method
        label: "Verification method"
        type: textarea
        required: true
        placeholder: "How will you verify the corrective action was effective?"
        docx_style: bold_label
        sepsis_example: "Re-run iteration with clean data; verify sensitivity ≥ P_fail (0.65) and drift score < θ_major (0.90); compare against gold standard."
      - id: preventive_action
        label: "Preventive action"
        type: textarea
        placeholder: "Actions to prevent recurrence"
        docx_style: bold_label
        sepsis_example: "Implement automated data quality checks before ingestion: label consistency validation, distribution comparison against reference, and outlier detection."

  - id: regulatory-notification
    title: "Regulatory notification assessment"
    source: "Supplementary Appendix D"
    type: fields
    fields:
      - id: regulatory_notification
        label: "Regulatory notification required"
        type: dropdown
        required: true
        options:
          - "No"
          - "Yes — EU MDR Art. 87"
          - "Yes — FDA MDR"
          - "Yes — both"
          - "Under review"
        docx_style: bold_label
        sepsis_example: "Under review"
      - id: notification_rationale
        label: "Notification rationale"
        type: textarea
        placeholder: "Explain why notification is or is not required"
        docx_style: bold_label
        sepsis_example: "Event involves simulated data corruption in research setting; no patient impact. Review with regulatory affairs team required before determination."
      - id: notification_date
        label: "Notification date (if applicable)"
        type: date
        docx_style: bold_label
---

CAPA record for documenting corrective and preventive actions following REJECT, ALARM, or escalated events.
Docx output includes severity highlight (amber shading on decision field if REJECT+ALARM).
