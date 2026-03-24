---
title: "PCCP mapping"
supplement: "S2.8"
prev: "07-audit-trail.html"
next: "09-eu-mapping.html"
---

# PCCP mapping

The FDA's Predetermined Change Control Plan (PCCP), finalized in the August 2025 final guidance, is the primary US regulatory pathway for adaptive AI/ML medical devices. AEGIS is designed to align with PCCP requirements by providing pre-specified modification descriptions, protocols, and impact assessments. This page maps the three PCCP components to AEGIS framework elements.

## What is PCCP?

A PCCP is a plan submitted as part of a marketing submission (510(k), De Novo, or PMA) that describes anticipated modifications to an AI/ML device and the methodology for implementing and assessing those modifications without requiring a new submission for each change.

The PCCP has three required components:

| Component | PCCP requirement | AEGIS mapping |
|-----------|-----------------|---------------|
| **Component 1** | Description of Modifications | DARM data accumulation rule + model retraining specification |
| **Component 2** | Modification Protocol | CDM priority-ordered decision hierarchy + threshold specification |
| **Component 3** | Impact Assessment | MMM performance evaluation + gold standard comparison + alarm channel |

## Component 1: Description of Modifications

PCCP Component 1 requires a clear description of what modifications the device will undergo and the scope of those modifications.

In AEGIS, the modifications are pre-specified and deterministic:

```
At each iteration k:
1. Data accumulation:   D_T,k+1 = D_T,k ∪ D_D,k  (unconditional)
2. Model retraining:    M_k+1 = train(D_T,k+1)     (same architecture)
3. Evaluation:          metrics_k+1 = evaluate(M_k+1, D_G)
```

The scope of modifications is bounded by the AEGIS configuration:

| Modification aspect | Pre-specified boundary |
|---------------------|----------------------|
| Training data | Only data meeting DARM inclusion criteria |
| Model architecture | Fixed (same algorithm and hyperparameters) |
| Feature set | Fixed (same input features) |
| Intended use | Unchanged |
| Performance evaluation | Same metrics, same golden dataset |

> **Sepsis example:** For the sepsis prediction device, Component 1 would describe: "The device undergoes iterative retraining using newly accumulated ICU patient data. At each iteration, the Random Forest classifier (300 trees, fixed hyperparameters) is retrained on the union of all previously accumulated training data and newly collected patient records. The model architecture, feature set (202 features, with 34 key clinical features monitored for drift), and intended use (early sepsis onset prediction in adult ICU patients) remain unchanged. The only modification is the expansion of the training dataset."

## Component 2: Modification Protocol

PCCP Component 2 requires a pre-specified protocol for implementing modifications, including the decision criteria for accepting or rejecting changes.

AEGIS maps directly to this requirement through its CDM decision hierarchy:

| CDM element | PCCP Component 2 mapping |
|-------------|-------------------------|
| P1: Critical safety floor (P_fail) | Automatic rejection criterion -- modification rejected if safety is compromised |
| P2: Regression from P^ref | CLINICAL REVIEW -- regression from fixed performance reference requires human assessment |
| P3: Performance buffer (R_G) | CONDITIONAL APPROVAL -- accepted with heightened monitoring |
| P4: Full compliance | Acceptance criterion -- modification approved for deployment |
| A1--A3: Alarm conditions | Independent safety monitoring of the deployed device |

The protocol is fully deterministic and pre-specified before the first iteration. No human judgement is required for P1, P3, or P4 decisions, though CLINICAL REVIEW at P2 involves human assessment of regression from the fixed performance reference.

### Four categories as predetermined pathways

Each AEGIS decision category maps to a predetermined pathway within the PCCP:

| Decision category | PCCP pathway | Action |
|-------------------|-------------|--------|
| APPROVE (P4) | Modification accepted | Deploy updated model; log results; continue monitoring |
| CONDITIONAL APPROVAL (P3) | Modification accepted with conditions | Deploy with heightened monitoring; schedule early re-evaluation |
| CLINICAL REVIEW (P2) | Modification requires human assessment | Pause deployment; clinical expert reviews metrics and context |
| REJECT (P1) | Modification rejected | Do not deploy; initiate root cause analysis; CAPA if warranted |

## Component 3: Impact Assessment

PCCP Component 3 requires a pre-specified methodology for assessing the impact of each modification on device safety and effectiveness.

AEGIS provides this through MMM:

| Impact assessment element | AEGIS mechanism |
|--------------------------|-----------------|
| Performance evaluation | All primary metrics evaluated on locked golden dataset D_G |
| Baseline comparison | Gold standard comparison with tolerance tau |
| Composite scoring | MLcps trend tracking across iterations |
| Distribution monitoring | Drift detection with Bonferroni-corrected KS test |
| Safety monitoring | PMS alarm conditions (A1, A2, A3) on released model |

The impact assessment is quantitative, reproducible, and pre-specified -- meeting the PCCP requirement for objective evaluation criteria.

## REJECT + ALARM composite state

The REJECT + ALARM composite state is particularly important for PCCP documentation because it represents the most severe outcome:

```
REJECT + ALARM means:
├── Candidate model REJECTED (failed iterative governance)
│   └── Trigger: P1 (safety floor) or P2 (drift + degradation)
└── Released model ALARMED (failed post-market surveillance)
    └── Trigger: A1 (PMS floor) or A2 (regression) or A3 (major drift)
```

This state demands:

1. **Immediate CAPA initiation** -- the corrective action process must begin
2. **Regulatory notification assessment** -- evaluate whether the event meets FDA MDR or EU MDR Art. 87 reporting thresholds
3. **Deployment freeze** -- no new model versions deployed until root cause is resolved
4. **Documentation** -- full audit trail entry with CAPA reference

> **Sepsis example:** At iteration 10, the framework produced REJECT (P1, sensitivity 0.428 < P_fail 0.65) + ALARM (A3, drift_score 1.000 > theta_major 0.90). In a PCCP context, this would be documented as: "The predetermined modification protocol rejected the candidate model due to critical safety floor violation (Component 2). The impact assessment identified severe covariate drift across all 34 monitored features (Component 3). A CAPA was initiated to investigate the root cause of the catastrophic data quality degradation."

## Preparing the PCCP appendix

When preparing your PCCP submission, use the following structure:

| Section | Content source | AEGIS reference |
|---------|---------------|-----------------|
| 1. Device description | Clinical use case from S2.1 | Configuration form |
| 2. Description of modifications | DARM data accumulation + retraining spec | This page, Component 1 |
| 3. Modification protocol | CDM hierarchy + all thresholds | [Thresholds](03-thresholds.html), [CDM logic](04-cdm-logic.html) |
| 4. Impact assessment plan | MMM metrics + drift + gold standard | [MLcps](05-mlcps.html), [Drift](06-drift.html) |
| 5. Performance monitoring | PMS alarm conditions + audit trail | [Audit trail](07-audit-trail.html) |
| 6. Threshold justification | ISO 14971 traceability | [Thresholds](03-thresholds.html) |
| 7. CAPA procedures | CAPA form and escalation pathways | [CAPA form](../forms/capa.html) |

> **Caveat:** This mapping provides a technical framework for PCCP preparation. Confirm all regulatory interpretations with qualified regulatory counsel before submission. PCCP requirements may evolve as FDA guidance is updated.

### Source

Manuscript Section IV-F (regulatory pathway mapping) and Table VI (decision taxonomy). The three-component PCCP structure follows the August 2025 final FDA guidance on predetermined change control plans for AI/ML devices. Supplementary S2.8 provides the configuration template for regulatory pathway mapping. Supplementary S3.5 provides additional PCCP preparation guidance.
