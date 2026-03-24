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

The R_G threshold defines a buffer zone above P_fail. Metrics in this zone are acceptable but declining, triggering CLINICAL REVIEW (P2) rather than full APPROVE.

```
IF metric >= P_fail AND metric < R_G THEN → CLINICAL REVIEW (P2)
```

The gap between P_fail and R_G should be large enough to provide early warning but small enough that the buffer zone represents genuinely borderline performance.

| Metric | P_fail | R_G | Buffer width |
|--------|--------|-----|--------------|
| Sensitivity (Sepsis) | 0.65 | 0.66 | 0.01 (1 pp) |
| Specificity (Sepsis) | -- | 0.60 | -- |

### tau -- Fixed performance reference tolerance

tau defines the maximum acceptable deviation between the current iteration's performance and the fixed performance reference (P^ref). It is used in P2 evaluation (regression from fixed performance reference triggers CLINICAL REVIEW).

```python
# Fixed performance reference comparison at each iteration
deviation = P_ref_metric - current_metric
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

> **Sepsis example:** With K = 202 clinical features and alpha = 0.05, the Bonferroni-corrected significance level was alpha' = 0.05/202. The drift thresholds were set as:
>
> | Threshold | Value | Meaning |
> |-----------|-------|---------|
> | S^minor_D lower bound | 0.30 | < 30% of features drifted -- negligible |
> | S^minor_D upper bound | 0.70 | > 70% of features drifted -- escalate to major |
> | S^major_D | 0.90 | > 90% of features drifted -- severe, triggers A3 |
>
> Minor drift (0.30 <= S_D <= 0.70) triggers CONDITIONAL APPROVAL at P3. At iteration 10, the drift score reached 1.000 (all features significantly shifted), far exceeding S^major_D = 0.90 and triggering A3 alarm alongside the P1 REJECT.

### P_PMS -- Post-market surveillance safety floor

P_PMS applies to the **currently released model** (not the candidate model). It triggers alarm A1 if the deployed model's performance falls below an absolute floor.

In this proof-of-concept, P_PMS = P_fail, as the same safety rationale applies to both candidate and deployed models.

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

| Parameter | Symbol | Value | Decision / Clinical justification |
|-----------|--------|-------|----------------------|
| Fixed performance reference | P^ref | Sens 0.723, Spec 0.933, AUC 0.922 | Baseline locked at iteration 0 |
| Critical safety floor | P^fail | Sens < 0.65 | P1 REJECT -- unacceptable miss rate below this level |
| Performance buffer (sensitivity) | R_G(sens) | 0.66 <= Sens | P2 CLINICAL REVIEW -- 1 pp above P^fail; early warning zone |
| Performance buffer (specificity) | R_G(spec) | 0.60 <= Spec | P2 CLINICAL REVIEW -- minimum acceptable specificity for ICU |
| Fixed performance reference tolerance | tau | 0.015 (sensitivity) | P2 CLINICAL REVIEW -- regression from P^ref |
| Minor drift range | S^minor_D | 0.30 <= S_D <= 0.70 | P3 CONDITIONAL APPROVAL -- minor distributional shift |
| Major drift threshold | S^major_D | S_D > 0.90 | A3 ALARM -- severe shift |
| PMS safety floor | P^PMS | Sens 0.65 (= P^fail) | A1 ALARM -- released model below safety floor |
| PMS regression margin | tau (PMS) | 0.020--0.030 | A2 ALARM -- clinically meaningful regression |
| NPV floor | NPV | >= 0.90 | Safety constraint on negative predictive value |
| FNR ceiling | FNR | <= 0.35 | Safety constraint on false negative rate |

## Threshold dependencies

The thresholds interact with each other through the CDM priority hierarchy. It is essential that they are internally consistent:

```
P^fail < R_G         (buffer zone must exist above safety floor)
tau > 0              (zero tolerance is impractical)
S^minor_D,low < S^minor_D,high < S^major_D
P^PMS = P^fail       (PMS floor equals iterative floor in this proof-of-concept)
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

Manuscript Section II-B-3 (threshold definitions and CDM integration), Tables III, IV, and VII (decision categories, priority hierarchy, and sepsis threshold values). Supplementary S2.3 (standalone threshold specification template). ISO 14971:2019 requirements are referenced throughout Section II-A.
