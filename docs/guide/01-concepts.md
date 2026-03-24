---
title: "Core concepts"
supplement: "S1"
prev: "index.html"
next: "02-configure.html"
---

# Core concepts

This page defines the foundational terminology and architectural principles of AEGIS. All subsequent guide pages assume familiarity with these concepts.

## The three modules

### DARM -- Dataset Assimilation and Retraining Module

DARM manages the lifecycle of three dataset splits that feed the iterative governance loop:

| Dataset | Symbol | Description |
|---------|--------|-------------|
| **Training** | D_T,k | Accumulated training data at iteration k |
| **Golden** | D_G | Fixed, locked reference dataset for consistent evaluation |
| **Drifting** | D_D,k | Newly arrived data at iteration k (real-world or synthetic) |

The data accumulation rule is unconditional:

```
D_T,k+1 = D_T,k ∪ D_D,k
```

This means new data always enters the training pool regardless of the CDM decision. The model is always retrained on the full accumulated dataset.

> **Sepsis example:** In the sepsis case study, the golden dataset D_G consisted of 4,067 patients (20% hold-out from 20,336) from PhysioNet Hospital A, with 202 features. 34 features were monitored for drift. The training set grew from 8,134 samples at k=0 to 48,994 at k=10.

### MMM -- Model Monitoring Metrics

MMM computes all performance, drift, and fairness metrics for the current iteration. It operates on three outputs:

1. **Primary performance metrics** evaluated on D_G (e.g., sensitivity, specificity, ROC-AUC)
2. **MLcps** -- a composite performance score combining weighted metrics into a single polar-coordinate value
3. **Drift score** -- the proportion of features exhibiting statistically significant distribution shift between D_G and D_D,k

### CDM -- Clinical Decision Module

The CDM is a deterministic, rule-based decision engine. It takes the outputs of MMM and produces a composite result:

```
CDM output = (Decision Category, Alarm State)
```

The decision and alarm channels are **independent**. This means APPROVE + ALARM is a valid output -- the model passed all performance thresholds, but a post-market safety condition was triggered.

## Decision categories

AEGIS defines four deployment decision categories arranged in a priority hierarchy:

| Priority | Category | Badge | Trigger |
|----------|----------|-------|---------|
| P1 | REJECT | `badge-reject` | Deployment safety performance floor violated (P_G,k < P^fail) |
| P2 | CLINICAL REVIEW | `badge-review` | Performance buffer / regression from fixed performance reference (R_G threshold) |
| P3 | CONDITIONAL APPROVAL | `badge-cond` | Minor drift / TAI (tolerable adaptive improvement) |
| P4 | APPROVE | `badge-approve` | All checks passed |

The three alarm conditions (A1, A2, A3) operate independently alongside any decision:

| Alarm | Condition | Trigger |
|-------|-----------|---------|
| A1 | Released model < P_PMS | Post-market safety floor breach |
| A2 | Released model regressed > delta from baseline | Performance regression |
| A3 | Drift score > theta_major | Severe covariate drift |

## Fixed performance reference

The fixed performance reference (P^ref) is the performance of the first fully approved model on the Golden dataset. P^ref is fixed at the first APPROVE and never updated. It serves as a stable anchor for detecting long-term regression.

In contrast, the most recently fully approved released model performance on the Golden set (P^rel_G) IS updated with each subsequent APPROVE decision. This allows the system to detect regression relative to the current deployed model.

```python
# Fixed performance reference comparison
deviation = P_ref - current_metric
within_tolerance = (deviation <= tau)
```

The fixed performance reference is locked once set and should never be updated without a formal change control process. The dataset ID (hash or version tag) must be recorded.

> **Sepsis example:** The fixed performance reference was set at iteration 0 with sensitivity = 0.723, specificity = 0.933, AUC = 0.922, and MLcps = 0.721. The fixed performance reference tolerance was tau = 0.015 for sensitivity. Throughout iterations 1-6, all metrics remained within tolerance of this baseline.

## Two-tier threshold architecture

AEGIS employs two tiers of thresholds, each serving a distinct safety function:

### Tier 1: Iterative governance thresholds

These apply to the **candidate model** at each retraining iteration:

| Threshold | Symbol | Function |
|-----------|--------|----------|
| Deployment safety performance floor | P_fail | Absolute minimum performance -- violation triggers immediate REJECT |
| Performance buffer | R_G | Performance thresholds buffer zone for CLINICAL REVIEW |
| Fixed performance reference tolerance | tau | Maximum acceptable deviation from fixed performance reference (P^ref) |
| Minor drift bounds | S^minor_D | Range for minor drift classification |
| Major drift bounds | S^major_D | Range for major drift classification |

### Tier 2: Post-market surveillance (PMS) thresholds

These apply to the **currently released model** and trigger PMS ALARM independently:

| Threshold | Symbol | Function |
|-----------|--------|----------|
| PMS safety performance floor | P^PMS | Minimum acceptable performance for the deployed model |
| Regression margin | delta | Maximum regression from performance at time of release |

## Composite decision output

The CDM produces a composite output that combines the decision category with the alarm state. This composite nature is critical for regulatory mapping:

```
Output = {
    decision:          "APPROVE" | "CONDITIONAL APPROVAL" | "CLINICAL REVIEW" | "REJECT",
    alarm:             true | false,
    alarm_conditions:  ["A1", "A2", "A3"],  // subset that fired
    details:           { priority, trigger }
}
```

The REJECT + ALARM composite state is particularly important: it indicates both that the candidate model failed iterative governance AND that the deployed model has triggered a post-market safety concern. This state demands immediate corrective action (CAPA).

## Configurability principle

AEGIS is domain-agnostic by design. Every threshold value, metric selection, weight configuration, and active category is a configurable parameter. The framework specification defines the **structure and logic**; the implementer defines the **values**.

This is why the [S2 Configuration Template](../forms/s2-config.html) exists -- it captures all instantiation parameters for a specific deployment.

## Notation table

The following symbols are used throughout this guide and the manuscript:

| Symbol | Meaning |
|--------|---------|
| k | Iteration index |
| D_T,k | Training dataset at iteration k |
| D_G | Golden (reference) dataset |
| D_D,k | Drifting (new) dataset at iteration k |
| P_fail | Deployment safety performance floor |
| P^ref | Fixed performance reference (performance of first fully approved model on Golden set, never updated) |
| P^rel_G | Most recently fully approved released model performance on Golden set (updated with each APPROVE) |
| P^rel_D | Most recently fully approved released model performance on Drifting set |
| R_G | Performance thresholds buffer zone for CLINICAL REVIEW |
| tau | Fixed performance reference tolerance |
| S_D | Bonferroni-corrected KS drift score |
| S^minor_D | Range for minor drift classification |
| S^major_D | Range for major drift classification |
| P^PMS | PMS safety performance floor for released model |
| delta | PMS regression margin |
| MLcps | ML Cumulative Performance Score |
| K | Number of features monitored for drift |
| alpha | Significance level for drift test |
| alpha' | Bonferroni-corrected significance (alpha / K) |

### Source

Manuscript Section II-B. Module definitions appear in Section II-B-1 (DARM), II-B-2 (MMM), and II-B-3 (CDM). The two-tier threshold architecture is formally defined in Section II-B-3. Decision categories and alarm conditions are specified in Tables III and IV.
