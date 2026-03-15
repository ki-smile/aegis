---
title: "MLcps"
supplement: "S2.4"
prev: "04-cdm-logic.html"
next: "06-drift.html"
---

# MLcps

MLcps (Multi-criteria Likert Composite Performance Score) is a single scalar value that summarises the overall performance of a model across multiple clinically weighted metrics. It provides a unified view of model quality that respects the relative importance of different performance dimensions.

## What MLcps is

MLcps aggregates multiple performance metrics into one composite score using a polar coordinate representation. Each metric is assigned a weight (reflecting its clinical importance), and the weighted metrics are projected onto a polar coordinate system. The resulting composite score captures both the magnitude and balance of performance across all tracked dimensions.

Key properties of MLcps:

| Property | Description |
|----------|-------------|
| **Range** | 0.0 to 1.0 (higher is better) |
| **Weighted** | Clinically important metrics contribute more to the score |
| **Balanced** | Penalises models that perform well on one metric but poorly on others |
| **Interpretable** | Single number for tracking trends across iterations |

MLcps is used in MMM as a summary statistic for monitoring performance trends. It does **not** directly enter the CDM decision hierarchy (which uses individual metric thresholds), but it provides valuable context for audit trail entries and regulatory reporting.

## Polar coordinate mechanics

MLcps maps each metric to an axis in a polar coordinate system. With N metrics, each axis is separated by 2*pi/N radians. The metric value (scaled by its weight) determines the distance from the origin along that axis.

The composite score is derived from the area enclosed by the polygon formed by connecting the metric endpoints:

```
For N metrics with values v_1, ..., v_N and weights w_1, ..., w_N:

1. Compute weighted values: v'_i = v_i * w_i / max(w)
2. Arrange on polar axes at angles theta_i = 2*pi*i / N
3. Compute the polygon area A
4. Normalise: MLcps = A / A_max
```

The normalisation ensures that a model achieving perfect scores (1.0) on all metrics with maximum weights yields MLcps = 1.0.

```python
import numpy as np

def compute_mlcps(metrics: dict, weights: dict) -> float:
    """
    Compute MLcps composite performance score.

    Parameters
    ----------
    metrics : dict   Metric name -> value (0.0 to 1.0)
    weights : dict   Metric name -> weight (0.5 to 3.0)

    Returns
    -------
    float  Composite score (0.0 to 1.0)
    """
    names = sorted(metrics.keys())
    N = len(names)
    if N < 2:
        # Single metric: MLcps = weighted value normalised
        name = names[0]
        return metrics[name] * weights.get(name, 1.0) / max(weights.values())

    max_w = max(weights.get(n, 1.0) for n in names)
    angles = [2 * np.pi * i / N for i in range(N)]

    # Weighted values
    wv = [metrics[n] * weights.get(n, 1.0) / max_w for n in names]

    # Polygon area using shoelace formula in polar coordinates
    area = 0.0
    for i in range(N):
        j = (i + 1) % N
        area += 0.5 * wv[i] * wv[j] * np.sin(angles[j] - angles[i])

    # Maximum area (all metrics = 1.0, all weights = max_w)
    max_area = 0.0
    for i in range(N):
        j = (i + 1) % N
        max_area += 0.5 * 1.0 * 1.0 * np.sin(angles[j] - angles[i])

    return abs(area) / abs(max_area) if max_area != 0 else 0.0
```

## The getCPS package

The reference implementation of composite performance scoring is available in the `getCPS` R/Python package. AEGIS recommends using this package for consistency with the manuscript's calculations.

```r
# R usage (getCPS package)
library(getCPS)

metrics <- c(sensitivity = 0.890, specificity = 0.798,
             roc_auc = 0.920, balanced_accuracy = 0.844)
weights <- c(sensitivity = 1.5, specificity = 1.0,
             roc_auc = 1.3, balanced_accuracy = 1.1)

cps <- getCPS(metrics, weights)
print(cps)
# [1] 0.876
```

## Weight configuration

Weights range from 0.5 (low priority) to 3.0 (critical priority). They encode the clinical importance of each metric relative to the others.

> **Sepsis example:** The sepsis case study used four metrics with the following weight configuration:
>
> | Metric | Weight | Rationale |
> |--------|--------|-----------|
> | Sensitivity | 1.5 | Highest priority -- missed sepsis has severe consequences |
> | ROC-AUC | 1.3 | Overall discrimination ability is clinically important |
> | Balanced Accuracy | 1.1 | Accounts for class imbalance in sepsis prevalence |
> | Specificity | 1.0 | Baseline importance -- false alarms burden ICU staff but are less dangerous than misses |
>
> This configuration produced an MLcps of 0.876 at the gold standard iteration (k=0). The weight ordering reflects the clinical reality that in sepsis prediction, failing to detect a true case (low sensitivity) carries greater patient risk than a false alarm (low specificity). Across the 11 iterations, MLcps tracked smoothly from 0.876 down to 0.354 at iteration 10, providing a clear trend signal even when individual metrics fluctuated differently.

## How to derive weights

AEGIS supports four methods for deriving metric weights, documented in the S2 configuration:

| Method | When to use | Process |
|--------|-------------|---------|
| **Clinical risk assessment** | Default recommendation | Map ISO 14971 hazard severity to weight magnitude |
| **Literature review** | Established domains | Survey published acceptable performance ranges |
| **Expert panel consensus** | Novel applications | Structured consensus process (e.g., modified Delphi) |
| **Regulatory requirement** | Specific guidance exists | Use mandated performance priorities |

### Step-by-step weight derivation

1. **List all primary metrics** that will be tracked by MMM
2. **Rank by clinical consequence** of failure for each metric
3. **Assign initial weights** using the following heuristic:

| Clinical consequence of metric failure | Suggested weight range |
|----------------------------------------|----------------------|
| Life-threatening (missed diagnosis, wrong treatment) | 2.0 -- 3.0 |
| Significant clinical impact (delayed care, unnecessary intervention) | 1.3 -- 2.0 |
| Moderate impact (workflow disruption, reduced efficiency) | 1.0 -- 1.3 |
| Low impact (minor inconvenience, easily corrected) | 0.5 -- 1.0 |

4. **Validate with domain experts** -- present the weights and their rationale to the clinical team
5. **Document the derivation method** in the S2 configuration form

## MLcps in the governance loop

MLcps is computed at every iteration and logged in the audit trail. While it does not directly trigger CDM decisions, it serves several important functions:

- **Trend monitoring**: A declining MLcps across iterations signals gradual performance degradation that may not yet trigger individual metric thresholds
- **Regulatory reporting**: A single composite score is easier to communicate in PSUR and PCCP documentation
- **Gold standard tracking**: The gold standard MLcps provides a single-number baseline for comparison

```
Iteration  Sensitivity  Specificity  ROC-AUC  Bal.Acc  MLcps  Decision
k=0        0.890        0.798        0.920    0.844    0.876  APPROVE
k=1        0.885        0.792        0.918    0.839    0.868  APPROVE
k=5        0.842        0.763        0.895    0.803    0.816  CLINICAL REVIEW
k=7        0.653        0.720        0.847    0.687    0.607  CONDITIONAL APPROVAL
k=10       0.428        0.585        0.593    0.507    0.354  REJECT
```

### Source

Manuscript Section II-D (MLcps configuration within instantiation parameters) and Section IV-E (MLcps results across iterations). The polar coordinate composite scoring methodology is described in the getCPS package documentation. Weight configuration is specified in Supplementary S2.4. The sepsis weight values are tabulated in Table IV of the manuscript.
