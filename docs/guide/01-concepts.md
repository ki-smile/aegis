---
title: "Core concepts"
supplement: "S1"
prev: "index.html"
next: "02-configure.html"
---

# Core concepts

This page defines the foundational terminology and architectural principles of AEGIS. All subsequent guide pages assume familiarity with these concepts.

## The three modules

### DARM -- Dataset and Review Management

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

> **Sepsis example:** In the sepsis case study, the golden dataset D_G consisted of 813 samples (20% hold-out) from PhysioNet Hospital A. The drifting dataset D_D,k contained 5,000 synthetic samples per iteration, generated with controlled corruption levels ranging from 0% (clean) to 80% label flip with Gaussian noise. The training set grew from 3,254 samples at k=0 to 53,254 at k=10.

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

AEGIS defines five decision categories arranged in a priority hierarchy:

| Priority | Category | Badge | Meaning |
|----------|----------|-------|---------|
| P1 | REJECT | `badge-reject` | Critical safety floor violated |
| P2 | REJECT | `badge-reject` | Major drift with performance degradation |
| P3 | CONDITIONAL APPROVAL | `badge-cond` | Performance in buffer zone |
| P3.5 | CLINICAL REVIEW | `badge-review` | Minor drift or borderline metrics requiring human assessment |
| P4 | APPROVE | `badge-approve` | All checks passed |

The three alarm conditions (A1, A2, A3) operate independently alongside any decision:

| Alarm | Condition | Trigger |
|-------|-----------|---------|
| A1 | Released model < P_PMS | Post-market safety floor breach |
| A2 | Released model regressed > delta from baseline | Performance regression |
| A3 | Drift score > theta_major | Severe covariate drift |

## Gold standard

The gold standard is the performance baseline established at the first APPROVE decision (typically iteration 0). All subsequent iterations are compared against this baseline via the gold standard tolerance tau.

```python
# Gold standard comparison
deviation = gold_metric - current_metric
within_tolerance = (deviation <= tau)
```

The gold standard is locked once set and should never be updated without a formal change control process. The dataset ID (hash or version tag) must be recorded.

> **Sepsis example:** The gold standard was set at iteration 0 with sensitivity = 0.890, specificity = 0.798, ROC-AUC = 0.920, balanced accuracy = 0.844, and MLcps = 0.876. The gold standard tolerance was tau = 0.015 for sensitivity. Throughout iterations 1-6, all metrics remained within tolerance of this baseline.

## Two-tier threshold architecture

AEGIS employs two tiers of thresholds, each serving a distinct safety function:

### Tier 1: Iterative governance thresholds

These apply to the **candidate model** at each retraining iteration:

| Threshold | Symbol | Function |
|-----------|--------|----------|
| Critical safety floor | P_fail | Absolute minimum performance -- violation triggers immediate REJECT |
| Performance buffer | R_G | Zone between P_fail and full approval -- triggers CONDITIONAL APPROVAL |
| Gold standard tolerance | tau | Maximum acceptable deviation from gold standard baseline |
| Minor drift bounds | theta_minor,low / theta_minor,high | Drift severity classification |
| Major drift threshold | theta_major | Severe drift -- triggers REJECT at P2 if combined with degradation |

### Tier 2: Post-market surveillance (PMS) thresholds

These apply to the **currently released model** and trigger alarms independently:

| Threshold | Symbol | Function |
|-----------|--------|----------|
| PMS safety floor | P_PMS | Minimum acceptable performance for the deployed model |
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
| P_fail | Critical safety floor threshold |
| R_G | Performance buffer threshold (gold standard region) |
| tau | Gold standard tolerance |
| theta_minor,low | Minor drift lower bound |
| theta_minor,high | Minor drift upper bound |
| theta_major | Major drift threshold |
| P_PMS | PMS safety floor for released model |
| delta | PMS regression margin |
| MLcps | Multi-criteria Likert composite performance score |
| K | Number of features monitored for drift |
| alpha | Significance level for drift test |
| alpha' | Bonferroni-corrected significance (alpha / K) |

### Source

Manuscript Section II-B. Module definitions appear in Section II-B-1 (DARM), II-B-2 (MMM), and II-B-3 (CDM). The notation table corresponds to Table XIII in the manuscript. The two-tier threshold architecture is formally defined in Section II-B-3. Decision categories and alarm conditions are specified in Tables III and VI.
