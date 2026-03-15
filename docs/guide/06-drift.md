---
title: "Drift detection"
supplement: "S2.5"
prev: "05-mlcps.html"
next: "07-audit-trail.html"
---

# Drift detection

Distribution drift is one of the primary risks to adaptive medical AI systems in production. AEGIS monitors for drift at every iteration using statistical tests applied to the feature distributions of the golden and drifting datasets. This page covers the methodology, configuration, and calibration of drift detection.

## Covariate drift vs concept drift

AEGIS distinguishes between two forms of distribution shift:

| Drift type | What changes | Detection method | AEGIS response |
|------------|-------------|-----------------|----------------|
| **Covariate drift** | Input feature distributions P(X) | Statistical tests (KS, MMD, PSI) on feature distributions | Drift score feeds into CDM |
| **Concept drift** | Relationship between inputs and outputs P(Y\|X) | Performance degradation on D_G as a proxy | Performance thresholds (P_fail, R_G) |

Covariate drift is detected directly by comparing D_G and D_D,k feature distributions. Concept drift is detected indirectly through its effect on model performance -- when P(Y|X) changes, performance on the stable golden dataset D_G will degrade.

> **Sepsis example:** In the sepsis experiment, covariate drift was introduced deliberately via Gaussian noise injection (sigma = scaling_factor * std) across all 34 clinical features. At low corruption levels (iterations 1-4), drift scores ranged from 0.000 to 0.265, remaining below theta_minor,low = 0.30. As corruption increased, the drift score climbed to 0.441 at iteration 7 (minor drift) and reached 1.000 at iteration 10 (major drift -- all 34 features significantly shifted). Concept drift was induced simultaneously through label flipping (progressive corruption of sepsis labels), causing sensitivity to degrade from 0.890 to 0.428.

## Bonferroni-corrected Kolmogorov-Smirnov test

AEGIS recommends the Kolmogorov-Smirnov (KS) test with Bonferroni correction as the default drift detection method. This is Equation 2 from the manuscript.

### Method

For each of K features, perform a two-sample KS test comparing the distribution in D_G against D_D,k:

```
For feature j (j = 1, ..., K):
    H_0: F_G,j = F_D,j    (distributions are identical)
    H_1: F_G,j ≠ F_D,j    (distributions differ)

    Compute p_j = KS_test(D_G[:, j], D_D,k[:, j])

    Feature j has significant drift if p_j < alpha'
```

### Bonferroni correction

To control the family-wise error rate when testing K features simultaneously:

```
alpha' = alpha / K
```

This is a conservative correction that reduces the probability of false drift detections at the cost of reduced sensitivity to true drift.

### Drift score computation

The drift score is the proportion of features with statistically significant drift:

```
drift_score = |{j : p_j < alpha'}| / K
```

The drift score ranges from 0.0 (no features drifted) to 1.0 (all features drifted).

### Implementation

```python
from scipy import stats
import numpy as np

def compute_drift_score(golden_data: np.ndarray,
                        drifting_data: np.ndarray,
                        alpha: float = 0.05) -> dict:
    """
    Compute Bonferroni-corrected KS drift score.

    Parameters
    ----------
    golden_data : np.ndarray   Shape (n_golden, K)
    drifting_data : np.ndarray Shape (n_drifting, K)
    alpha : float              Family-wise significance level

    Returns
    -------
    dict  {drift_score, n_drifted, K, alpha_prime, p_values}
    """
    K = golden_data.shape[1]
    alpha_prime = alpha / K

    p_values = []
    n_drifted = 0

    for j in range(K):
        stat, p_val = stats.ks_2samp(golden_data[:, j], drifting_data[:, j])
        p_values.append(p_val)
        if p_val < alpha_prime:
            n_drifted += 1

    return {
        'drift_score': n_drifted / K,
        'n_drifted': n_drifted,
        'K': K,
        'alpha_prime': alpha_prime,
        'p_values': p_values
    }
```

## Feature selection

Not all features need to be monitored for drift. The choice of features affects both the drift score and the Bonferroni correction severity (since K determines alpha').

### Selection criteria

| Criterion | Guidance |
|-----------|----------|
| **Clinical relevance** | Include features that directly impact clinical predictions |
| **Model importance** | Include features with high feature importance scores |
| **Stability** | Exclude features known to have high natural variability |
| **Redundancy** | Avoid highly correlated feature pairs (inflates K unnecessarily) |

> **Sepsis example:** All 34 clinical features were monitored for drift: HR, O2Sat, Temp, SBP, MAP, DBP, Resp, EtCO2, BaseExcess, HCO3, FiO2, pH, PaCO2, SaO2, AST, BUN, Alkalinephos, Calcium, Chloride, Creatinine, Bilirubin_direct, Glucose, Lactate, Magnesium, Phosphate, Potassium, Bilirubin_total, TroponinI, Hct, Hgb, PTT, WBC, Fibrinogen, Platelets. With K = 34 and alpha = 0.05, the Bonferroni-corrected threshold was alpha' = 0.05 / 34 = 0.00147. This conservative correction ensured that drift detections were genuine distribution shifts rather than multiple testing artefacts.

## Minor and major drift thresholds

The drift score is classified into three severity levels using the theta thresholds:

```
drift_score < theta_minor,low          → No significant drift
theta_minor,low <= drift_score
    < theta_minor,high                 → Minor drift (informational)
theta_minor,high <= drift_score
    < theta_major                      → Moderate drift (heightened monitoring)
drift_score >= theta_major             → Major drift (triggers A3 alarm)
```

### CDM integration

Drift severity maps to CDM behaviour as follows:

| Drift level | CDM effect |
|-------------|------------|
| No drift | No impact on decision |
| Minor drift | May trigger CLINICAL REVIEW (P3.5) if enabled |
| Moderate drift | Heightened monitoring; logged but no automatic escalation |
| Major drift | Triggers A3 alarm; combined with performance degradation triggers P2 REJECT |

## Calibration from baseline variability

To set meaningful drift thresholds, establish a baseline by measuring drift between temporal or random subsets of your own data:

### Calibration procedure

1. **Split D_T,0 into two random halves** (A and B)
2. **Compute drift_score(A, B)** -- this represents natural variability
3. **Repeat 100 times** with different random splits
4. **Build the baseline distribution** of drift scores

```python
def calibrate_drift_thresholds(training_data: np.ndarray,
                                n_bootstrap: int = 100,
                                alpha: float = 0.05) -> dict:
    """
    Calibrate drift thresholds from baseline variability.

    Returns suggested theta_minor_low, theta_minor_high, theta_major.
    """
    n = training_data.shape[0]
    baseline_scores = []

    for _ in range(n_bootstrap):
        idx = np.random.permutation(n)
        half = n // 2
        A = training_data[idx[:half]]
        B = training_data[idx[half:2*half]]
        result = compute_drift_score(A, B, alpha)
        baseline_scores.append(result['drift_score'])

    baseline_scores = np.array(baseline_scores)

    return {
        'theta_minor_low': float(np.percentile(baseline_scores, 75)),
        'theta_minor_high': float(np.percentile(baseline_scores, 95)),
        'theta_major': max(float(np.percentile(baseline_scores, 99)), 0.90),
        'baseline_mean': float(baseline_scores.mean()),
        'baseline_std': float(baseline_scores.std()),
        'baseline_max': float(baseline_scores.max())
    }
```

5. **Set thresholds based on percentiles:**

| Threshold | Suggested percentile | Rationale |
|-----------|---------------------|-----------|
| theta_minor,low | 75th percentile | Drift above 75% of baseline is noteworthy |
| theta_minor,high | 95th percentile | Drift above 95% of baseline is unusual |
| theta_major | 99th percentile or 0.90, whichever is higher | Extreme drift only |

## Alternative drift detection methods

While KS + Bonferroni is the default, AEGIS supports other methods:

| Method | Strengths | Limitations |
|--------|-----------|-------------|
| **KS + Bonferroni** | Non-parametric; per-feature granularity; well-understood | Conservative with large K |
| **MMD (Maximum Mean Discrepancy)** | Captures multivariate drift; kernel-based | Less interpretable; single score for all features |
| **PSI (Population Stability Index)** | Industry standard; easy to explain | Assumes binning; less powerful for continuous features |
| **Performance comparison** | Direct clinical relevance | Only detects drift that affects performance |

Document your chosen method and justification in the S2 configuration form.

## Concept drift proxy at P2

AEGIS detects concept drift indirectly through the P2 condition: major covariate drift combined with performance degradation beyond the gold standard tolerance tau. The logic is:

```
IF drift_score > theta_major AND any_metric degraded > tau from gold_standard:
    → REJECT (P2): concept drift is likely occurring
```

This proxy approach avoids the need for labelled data in the drifting dataset (which may not be immediately available in production).

### Source

Manuscript Section II-D (drift detection configuration within instantiation parameters) and Equation 2 (Bonferroni-corrected KS test). Drift threshold calibration methodology is described in Supplementary S2.5. Feature selection guidance and the concept drift proxy are discussed in Section II-B-2 (MMM specification). The sepsis feature list and drift progression across iterations are detailed in Section IV-C.
