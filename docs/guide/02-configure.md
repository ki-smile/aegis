---
title: "Configuration"
supplement: "S2.1–S2.2"
prev: "01-concepts.html"
next: "03-thresholds.html"
---

# Configuration

Instantiating AEGIS for a specific domain requires populating a set of configuration parameters that define the deployment context, dataset structure, performance metrics, thresholds, and decision categories. This page walks through each parameter group with worked examples.

[Download the S2 Configuration Template](../forms/s2-config.html)

## Instantiation parameters overview

Table IV in the manuscript defines the complete set of parameters required to instantiate AEGIS. They are grouped into seven sections:

| Section | Parameters | Purpose |
|---------|-----------|---------|
| S2.1 Deployment context | Data modality, model architecture, primary metrics, clinical use case | Establish the operational context |
| S2.2 Dataset configuration | Golden size, split strategy, deduplication method | Define the DARM data structure |
| S2.3 Thresholds | P_fail, R_G, tau, theta_*, P_PMS, delta | Set safety boundaries (see [Thresholds](03-thresholds.html)) |
| S2.4 MLcps | Metric-weight pairs, derivation method | Configure composite scoring (see [MLcps](05-mlcps.html)) |
| S2.5 Drift detection | Method, K, alpha, feature list | Configure drift monitoring (see [Drift detection](06-drift.html)) |
| S2.6 Active categories | Enable/disable intermediate categories | Tailor decision hierarchy |
| S2.7 Gold standard | Iteration, metric values, dataset ID | Lock the performance baseline |

## S2.1 -- Deployment context

The deployment context section captures the fundamental characteristics of your AI/ML system.

### Data modality

Select the primary data type your model processes:

| Modality | Example systems |
|----------|----------------|
| Tabular EHR | Sepsis prediction, readmission risk |
| Medical imaging (2D) | Chest X-ray classification, retinal screening |
| Medical imaging (3D volumetric) | Brain tumour segmentation, cardiac MRI |
| Time series | ECG interpretation, continuous glucose monitoring |
| Genomics / omics | Variant classification, gene expression |
| Natural language / clinical notes | Clinical NLP, radiology report parsing |
| Multi-modal | Combined imaging + EHR systems |

> **Sepsis example:** The sepsis prediction system uses **Tabular EHR** data modality. The model is a Random Forest with 300 trees, processing 34 clinical features (vital signs and laboratory values) collected hourly from ICU patients. Primary metrics are sensitivity, specificity, ROC-AUC, and balanced accuracy. The clinical use case is early prediction of sepsis onset in adult ICU patients, where the model produces hourly risk scores and clinicians receive alerts when the score exceeds a threshold.

### Model architecture

Document the model type with sufficient detail for reproducibility. Include:

- Algorithm family (e.g., Random Forest, neural network, gradient boosting)
- Key hyperparameters (e.g., number of trees, depth, learning rate)
- Pre-processing pipeline details relevant to performance

### Primary metrics

List all metrics that will be tracked by MMM. These should include:

- At least one **safety-critical metric** (e.g., sensitivity for a screening tool)
- Metrics that map to the clinical requirements of your intended use
- The metric(s) used for the critical safety floor P_fail

## S2.2 -- Dataset configuration

### Golden dataset

The golden dataset D_G is the cornerstone of AEGIS evaluation. It must be:

1. **Representative** of the target population
2. **Locked** before the first deployment (immutable)
3. **Hashed** for integrity verification (SHA-256 recommended)
4. **Documented** with inclusion/exclusion criteria, source, and time period

```python
import hashlib
import pandas as pd

def hash_golden_dataset(df: pd.DataFrame) -> str:
    """Generate SHA-256 hash of golden dataset for integrity verification."""
    content = df.to_csv(index=False).encode('utf-8')
    return hashlib.sha256(content).hexdigest()

# Lock and record
golden_hash = hash_golden_dataset(D_G)
print(f"Golden dataset hash: sha256:{golden_hash[:12]}...golden_v1.0")
```

### Split strategy

AEGIS supports several split strategies. The choice depends on the clinical context:

| Strategy | When to use | Caveat |
|----------|-------------|--------|
| Random hold-out | Homogeneous single-site data | Risk of temporal leakage |
| Temporal split | Longitudinal data with time dependency | Requires sufficient time span |
| Site-based split | Multi-centre deployments | Tests generalisability |
| Stratified random | Class-imbalanced datasets | Maintains prevalence ratios |

> **Sepsis example:** A random 80/20 hold-out split was used. D_T,0 = 3,254 samples and D_G = 813 samples from PhysioNet Hospital A. The drifting dataset D_D,k consisted of 5,000 synthetic samples per iteration generated with controlled corruption. Patient ID deduplication was performed via SHA-256 hashing across all splits to ensure no patient appeared in more than one partition.

### Deduplication

Patient-level deduplication across all dataset splits is mandatory. A single patient appearing in both D_G and D_T,k will invalidate the governance loop by introducing data leakage.

## S2.6 -- Active decision categories

APPROVE and REJECT are always active. The two intermediate categories (CONDITIONAL APPROVAL and CLINICAL REVIEW) can be disabled with documented clinical justification.

### Four-category configuration (default)

```
REJECT ← P1, P2
CONDITIONAL APPROVAL ← P3
CLINICAL REVIEW ← P3.5 (minor drift, borderline)
APPROVE ← P4
```

### Two-category configuration

Some domains may not support meaningful intermediate states. For example, in binary segmentation quality assessment, the output mask is either clinically acceptable or not.

```
REJECT ← P1, P2, P3
(CONDITIONAL APPROVAL — disabled)
(CLINICAL REVIEW — disabled)
APPROVE ← P4
```

When disabling categories, document the clinical justification in the S2 configuration form. Regulatory reviewers will need to understand why intermediate governance states were not implemented.

> **Sepsis example:** The sepsis case study used all four active categories plus ALARM, exercising all five decision outputs across 11 iterations. CONDITIONAL APPROVAL was triggered at iterations 7 and 8 when sensitivity dropped into the buffer zone (below R_G = 0.66 but above P_fail = 0.65). CLINICAL REVIEW was triggered at iteration 5 when minor drift was detected. In contrast, the BraTS brain tumour segmentation study disabled both intermediate categories with the justification that the binary DSC metric does not support a meaningful buffer zone.

## S2.7 -- Gold standard baseline

The gold standard baseline is established at the first iteration that receives APPROVE. Record:

| Field | Description | Example |
|-------|-------------|---------|
| Iteration | The iteration number | 0 |
| Metric values | All primary metrics at that iteration | Sens: 0.890, Spec: 0.798, AUC: 0.920 |
| Date | When the baseline was locked | 2026-01-15 |
| Dataset ID | Hash or version tag of D_G | sha256:a3f7c2...golden_v1.0 |

Once the gold standard is set, it must not be modified without a formal change control process. Any change to the gold standard effectively resets the governance baseline and should be treated as a significant modification.

## Configuration checklist

Before proceeding to threshold configuration, verify:

- [ ] Data modality and model architecture documented
- [ ] Primary metrics selected and clinically justified
- [ ] Golden dataset locked, hashed, and described
- [ ] Split strategy documented with rationale
- [ ] Patient-level deduplication confirmed
- [ ] Active decision categories selected with justification
- [ ] Gold standard baseline recorded (or planned for iteration 0)

### Source

Manuscript Section II-D, Table IV. Instantiation parameters are formally defined in Table IV, with the sepsis column providing worked example values. BraTS configuration appears in Section IV-D. Dataset management follows DARM specification in Section II-B-1. Active category configuration is described in Supplementary S2.6.
