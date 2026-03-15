---
title: "Thresholds"
supplement: "S2.3"
prev: "02-configure.html"
next: "04-cdm-logic.html"
---

# Thresholds

Every threshold in AEGIS must be derived from a formal ISO 14971:2019 risk management process. This page explains each threshold type, its role in the decision hierarchy, and how to calibrate values for your specific domain.

[Download the Threshold Table Template](../forms/s2-threshold-table.html)

> **Warning:** The threshold values shown in this guide are illustrative examples from the sepsis and BraTS case studies. **Do not use these values in production.** Each deployment must derive its own thresholds from a domain-specific hazard analysis conducted in accordance with ISO 14971:2019.

## ISO 14971:2019 requirements

ISO 14971:2019 is the international standard for application of risk management to medical devices. AEGIS requires that every threshold traces back to a specific hazard identified in your risk management file. For each threshold, you must document:

1. **Hazard ID** -- the unique identifier from your risk management file
2. **Hazard description** -- what patient harm could occur if the threshold is violated
3. **Risk level** -- severity and probability classification
4. **Clinical justification** -- why this specific value was chosen
5. **Source** -- literature, clinical expert input, or regulatory requirement

## Threshold types

### P_fail -- Critical safety floor

The most important threshold in AEGIS. P_fail defines the absolute minimum acceptable performance for the safety-critical metric. Any metric falling below P_fail triggers an immediate P1 REJECT.

```
IF any_metric < P_fail THEN → REJECT (P1, highest priority)
```

Calibration approach:

- Identify the metric most directly linked to patient safety
- Determine the performance level below which the device poses unacceptable risk
- Review published literature for minimum acceptable performance in your domain
- Consult clinical domain experts

> **Sepsis example:** P_fail was set to sensitivity < 0.65. Below this level, the sepsis prediction model would miss more than 35% of sepsis cases, creating an unacceptable risk of delayed treatment. This value was derived from a hazard analysis that identified missed sepsis onset as the primary patient safety risk (severity: critical; probability: probable at sensitivity below 0.65). At iteration 10, sensitivity dropped to 0.428 -- far below P_fail -- triggering an immediate P1 REJECT.

### R_G -- Performance buffer

The R_G threshold defines a buffer zone above P_fail. Metrics in this zone are acceptable but declining, triggering CONDITIONAL APPROVAL rather than full APPROVE.

```
IF metric >= P_fail AND metric < R_G THEN → CONDITIONAL APPROVAL (P3)
```

The gap between P_fail and R_G should be large enough to provide early warning but small enough that the buffer zone represents genuinely borderline performance.

| Metric | P_fail | R_G | Buffer width |
|--------|--------|-----|--------------|
| Sensitivity (Sepsis) | 0.65 | 0.66 | 0.01 (1 pp) |
| Specificity (Sepsis) | -- | 0.60 | -- |

### tau -- Gold standard tolerance

tau defines the maximum acceptable deviation between the current iteration's performance and the gold standard baseline. It is used in P2 evaluation (major drift + performance degradation).

```python
# Gold standard comparison at each iteration
deviation = gold_standard_metric - current_metric
degraded = (deviation > tau)
```

Calibration approach:

- Run the model multiple times on D_G to establish natural performance variability
- Set tau slightly above the observed standard deviation of metric values
- Consider the clinical significance of the deviation, not just statistical significance

### Drift thresholds -- theta_minor and theta_major

Drift thresholds classify the severity of distribution shift detected between the golden and drifting datasets.

| Threshold | Symbol | Range | Interpretation |
|-----------|--------|-------|----------------|
| Minor drift lower bound | theta_minor,low | 0.0 -- 1.0 | Below this, drift is negligible |
| Minor drift upper bound | theta_minor,high | 0.0 -- 1.0 | Above this, drift is escalated |
| Major drift | theta_major | 0.0 -- 1.0 | Above this, drift is severe |

The drift score is the proportion of features (out of K) with statistically significant KS test results after Bonferroni correction:

```
drift_score = (number of features with p < alpha') / K
```

Calibration methodology for drift thresholds:

1. Compute drift scores between temporal subsets of your own training data (baseline variability)
2. Set theta_minor,low at the 75th percentile of baseline drift scores
3. Set theta_minor,high at the 95th percentile
4. Set theta_major conservatively (e.g., 0.90) -- this triggers A3 alarm

> **Sepsis example:** With K = 34 clinical features and alpha = 0.05, the Bonferroni-corrected significance level was alpha' = 0.00147. The drift thresholds were set as:
>
> | Threshold | Value | Meaning |
> |-----------|-------|---------|
> | theta_minor,low | 0.30 | < 30% of features drifted -- negligible |
> | theta_minor,high | 0.70 | > 70% of features drifted -- escalate to major |
> | theta_major | 0.90 | > 90% of features drifted -- severe, triggers A3 |
>
> At iteration 10, the drift score reached 1.000 (all 34 features significantly shifted), far exceeding theta_major and triggering A3 alarm alongside the P1 REJECT.

### P_PMS -- Post-market surveillance safety floor

P_PMS applies to the **currently released model** (not the candidate model). It triggers alarm A1 if the deployed model's performance falls below an absolute floor.

In many cases, P_PMS is set equal to P_fail, as the same safety rationale applies to both candidate and deployed models.

### delta -- PMS regression margin

delta defines the maximum acceptable regression of the released model from its performance at the time of release. It triggers alarm A2.

```
regression = release_baseline_metric - current_released_metric
IF regression > delta THEN → A2 alarm
```

Calibration:

- Set delta based on the clinically meaningful difference for your metric
- A typical range is 0.020 to 0.030 for probability-based metrics
- Consider the natural variability of your metric on independent test sets

## Complete threshold table (Sepsis)

This table reproduces Table VII from the manuscript:

| Parameter | Symbol | Value | Clinical justification |
|-----------|--------|-------|----------------------|
| Critical safety floor | P_fail | Sens. < 0.65 | Unacceptable miss rate below this level |
| Performance buffer (sensitivity) | R_G(sens) | Sens. < 0.66 | 1 pp above P_fail; early warning zone |
| Performance buffer (specificity) | R_G(spec) | Spec. < 0.60 | Minimum acceptable specificity for ICU |
| Gold standard tolerance | tau | 0.015 | Derived from model variability on D_G |
| Minor drift lower bound | theta_minor,low | 0.30 | Below this, drift negligible |
| Minor drift upper bound | theta_minor,high | 0.70 | Above this, escalate to major |
| Major drift threshold | theta_major | 0.90 | Severe shift; triggers A3 |
| PMS safety floor | P_PMS | Sens. 0.65 | Aligned with P_fail |
| PMS regression margin | delta | 0.020--0.030 | Clinically meaningful regression |

## Threshold dependencies

The thresholds interact with each other through the CDM priority hierarchy. It is essential that they are internally consistent:

```
P_fail < R_G         (buffer zone must exist above safety floor)
tau > 0              (zero tolerance is impractical)
theta_minor,low < theta_minor,high < theta_major
P_PMS <= P_fail      (PMS floor should not be above iterative floor)
```

Violating these constraints will produce incoherent CDM behaviour.

## Documenting thresholds

For each threshold, complete a row in the [S2 Threshold Table](../forms/s2-threshold-table.html) with all six columns:

1. Parameter name
2. Symbol
3. Value
4. Clinical justification
5. ISO 14971 hazard ID
6. Source (literature, expert panel, regulatory requirement)

### Source

Manuscript Section II-B-3 (threshold definitions and CDM integration), Tables VI--VII (decision hierarchy and sepsis threshold values). Supplementary S2.3 (standalone threshold specification template). ISO 14971:2019 requirements are referenced throughout Section II-A.
