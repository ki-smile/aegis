---
id: shared-header
title: "Common header fields"
type: shared
fields:
  - id: device_name
    label: "Device name"
    type: text
    required: true
    placeholder: "e.g. SepsisGuard v2.1"
    help: "Include version number"
    docx_style: bold_label
    default: ""
    sepsis_example: "SepsisGuard v2.1"
    brats_example: "BraTSeg v1.0"

  - id: intended_use
    label: "Intended use"
    type: textarea
    required: true
    placeholder: "Describe the intended clinical use of the device"
    help: "Reference IEC 62304 or IFU documentation"
    docx_style: bold_label
    default: ""
    sepsis_example: "Early prediction of sepsis onset in adult ICU patients using continuous EHR monitoring"
    brats_example: "Automated segmentation of brain tumours (glioma) from multi-modal MRI for surgical planning"

  - id: author_name
    label: "Author name"
    type: text
    required: true
    placeholder: "e.g. Jane Doe"
    docx_style: bold_label
    default: ""
    sepsis_example: "Dr. A. Clinician"
    brats_example: "Dr. B. Radiologist"

  - id: author_role
    label: "Author role"
    type: text
    required: true
    placeholder: "e.g. ML Engineer"
    docx_style: bold_label
    default: ""
    sepsis_example: "Clinical Data Scientist"
    brats_example: "Neuroradiology Fellow"

  - id: date
    label: "Date"
    type: date
    required: true
    docx_style: bold_label
    default: ""

  - id: org
    label: "Organisation"
    type: text
    required: true
    placeholder: "e.g. Karolinska University Hospital"
    docx_style: bold_label
    default: ""
    sepsis_example: "Karolinska University Hospital"
    brats_example: "Karolinska University Hospital"
---

Common header fields included in every generated form via `includes_shared: [header]`.
These fields appear at the top of the docx output and the HTML form.
