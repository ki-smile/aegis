---
title: "CDM logic"
supplement: "S3.3"
prev: "03-thresholds.html"
next: "05-mlcps.html"
---

# CDM logic

The Clinical Decision Module (CDM) is the deterministic decision engine at the core of AEGIS. It takes performance metrics, drift scores, and fixed performance reference comparisons as input and produces a composite output: a decision category and an independent alarm state.

[View the CDM Pseudocode Reference](../forms/s3-cdm-pseudocode.html)

## Ternary operator

AEGIS uses a general ternary decision function (Eq. 1 from the manuscript) of the form D = f(C1,...,CN) ? D1 : D2, which maps a set of conditions to one of multiple decision outcomes. Each metric evaluation produces a ternary state:

```
T(metric, threshold_lower, threshold_upper) =
    FAIL    if metric < threshold_lower
    BUFFER  if threshold_lower <= metric < threshold_upper
    PASS    if metric >= threshold_upper
```

This ternary logic underpins the CDM's ability to distinguish between outright failure (REJECT), performance buffer (CLINICAL REVIEW), minor drift (CONDITIONAL APPROVAL), and full compliance (APPROVE).

## Condition polarity

AEGIS uses a **lower-is-worse** polarity convention for all metrics by default. This means:

- Sensitivity of 0.60 < P_fail of 0.65 triggers REJECT (lower is worse)
- Drift score of 0.95 > theta_major of 0.90 triggers alarm (higher is worse for drift)

For metrics where **higher is worse** (e.g., false positive rate, calibration error), you must invert the comparison before entering the CDM. Document the polarity convention for each metric in your S2 configuration.

```python
# Example: inverting a higher-is-worse metric
def normalise_polarity(value, higher_is_worse=False):
    """Convert metric to lower-is-worse convention."""
    if higher_is_worse:
        return 1.0 - value
    return value
```

## Priority-ordered decision hierarchy

The CDM evaluates conditions in strict priority order. The first condition that fires determines the decision. Lower-priority conditions are never evaluated once a higher-priority condition matches.

| Priority | Label | Condition | Decision |
|----------|-------|-----------|----------|
| P1 (highest) | Critical safety | P_G,k < P^fail | REJECT |
| P2 | Performance buffer / regression | (P_G,k in R_G) OR (tau < P^ref - P_G,k) | CLINICAL REVIEW |
| P3 | Minor drift / TAI concern | (S_D in S^minor_D) OR (S_T < S^thr_T) | CONDITIONAL APPROVAL |
| P4 (lowest) | Full compliance | All checks pass | APPROVE |

The priority ordering ensures that safety-critical failures are always caught first, regardless of other conditions.

> **Sepsis example:** At iteration 7, sensitivity was 0.702 -- above P^fail (0.65) and above R_G(sensitivity) (0.66), but regressed from the fixed performance reference P^ref (0.723). The CDM evaluated as follows:
>
> - P1: sensitivity 0.702 >= P^fail 0.65 -- **not triggered**
> - P2: P^ref - P_G,k = 0.723 - 0.702 = 0.021 > tau 0.015 -- **TRIGGERED** (regression from fixed performance reference)
>
> Result: CLINICAL REVIEW with details `{priority: P2, trigger: "P^ref 0.723 - sensitivity 0.702 = 0.021 > tau 0.015"}`. The model was flagged for clinical review due to performance regression.

## Alarm conditions (A1--A3)

Alarm conditions operate on an **independent channel** from the decision hierarchy. They are evaluated for every iteration regardless of the decision outcome.

| Alarm | Condition | What it monitors |
|-------|-----------|-----------------|
| A1 | P^rel_D < P^PMS | Released model on Drifting set below PMS safety floor |
| A2 | P^rel_D <= P^rel_G - tau | Released model regressed from released performance reference |
| A3 | S_D in S^major_D (drift score > 0.90) | Major distributional shift |

Key framing: **APPROVE + ALARM is not contradictory.** This combination means:

- The candidate model (being evaluated) passed all checks and can be approved (P4)
- BUT the currently released model has triggered a post-market safety concern

For example, at iteration 8 in the sepsis study, the new model passed P4 (APPROVE) but the released model triggered alarm A3 due to drift_score 1.000, exceeding S^major_D = 0.90.

This dual-channel design ensures that PMS obligations are never masked by a successful iteration.

## Composite output

The CDM returns a structured object containing both channels:

```python
{
    "decision": "APPROVE",              # from priority hierarchy
    "alarm": True,                       # from alarm channel
    "alarm_conditions": ["A3"],          # which alarms fired
    "details": {
        "priority": "P4",
        "trigger": "All metrics pass all checks"
    }
}
```

The composite output feeds directly into:

1. The audit trail (see [Audit trail](07-audit-trail.html))
2. PCCP regulatory documentation (see [PCCP mapping](08-pccp-mapping.html))
3. CAPA initiation (if REJECT or ALARM)

## Pseudocode

The complete reference implementation follows the priority-ordered evaluation pattern:

```python
def cdm_evaluate(metrics, thresholds, drift_score, gold_standard, config):
    """
    Clinical Decision Module -- priority-ordered evaluation.

    Parameters
    ----------
    metrics : dict          Current iteration metrics
    thresholds : dict       All threshold values from S2 configuration
    drift_score : float     Proportion of features with significant drift
    gold_standard : dict    Gold standard baseline metrics
    config : dict           Active categories and configuration

    Returns
    -------
    dict  {'decision', 'alarm', 'alarm_conditions', 'details'}
    """
    # Alarm channel -- always evaluated
    alarm_conditions = _check_alarm(metrics, thresholds, config)

    # P1: Critical safety floor
    for metric_name, value in metrics.items():
        pfail_key = f'P_fail_{metric_name}'
        if pfail_key in thresholds and value < thresholds[pfail_key]:
            return {
                'decision': 'REJECT',
                'alarm': len(alarm_conditions) > 0,
                'alarm_conditions': alarm_conditions,
                'details': {
                    'priority': 'P1',
                    'trigger': f'{metric_name} = {value:.3f} < P_fail = {thresholds[pfail_key]}'
                }
            }

    # P2: Performance buffer OR regression from fixed performance reference → CLINICAL REVIEW
    if config.get('clinical_review_enabled', True):
        # Check R_G buffer zone
        for metric_name, value in metrics.items():
            rg_key = f'R_G_{metric_name}'
            if rg_key in thresholds and value < thresholds[rg_key]:
                return {
                    'decision': 'CLINICAL REVIEW',
                    'alarm': len(alarm_conditions) > 0,
                    'alarm_conditions': alarm_conditions,
                    'details': {
                        'priority': 'P2',
                        'trigger': f'{metric_name} = {value:.3f} in R_G buffer'
                    }
                }
        # Check regression from fixed performance reference (P^ref)
        tau = thresholds.get('tau', 0.015)
        for metric_name, value in metrics.items():
            if metric_name in gold_standard:
                deviation = gold_standard[metric_name] - value
                if deviation > tau:
                    return {
                        'decision': 'CLINICAL REVIEW',
                        'alarm': len(alarm_conditions) > 0,
                        'alarm_conditions': alarm_conditions,
                        'details': {
                            'priority': 'P2',
                            'trigger': f'P^ref - {metric_name} = {deviation:.3f} > tau = {tau}'
                        }
                    }

    # P3: Minor drift OR TAI concern → CONDITIONAL APPROVAL
    if config.get('conditional_approval_enabled', True):
        minor_low = thresholds.get('S_minor_D_low', 0.30)
        minor_high = thresholds.get('S_minor_D_high', 0.70)
        if minor_low <= drift_score <= minor_high:
            return {
                'decision': 'CONDITIONAL APPROVAL',
                'alarm': len(alarm_conditions) > 0,
                'alarm_conditions': alarm_conditions,
                'details': {
                    'priority': 'P3',
                    'trigger': f'drift = {drift_score:.3f} in S^minor_D [{minor_low}, {minor_high}]'
                }
            }

    # P4: All checks passed
    return {
        'decision': 'APPROVE',
        'alarm': len(alarm_conditions) > 0,
        'alarm_conditions': alarm_conditions,
        'details': {'priority': 'P4', 'trigger': 'All metrics pass all checks'}
    }
```

## Alarm evaluation function

```python
def _check_alarm(metrics, thresholds, config):
    """Check PMS alarm conditions independently of decision hierarchy."""
    alarms = []

    # A1: Released model below PMS safety floor
    released = config.get('released_metrics', {})
    for metric_name, value in released.items():
        pms_key = f'P_PMS_{metric_name}'
        if pms_key in thresholds and value < thresholds[pms_key]:
            alarms.append({
                'id': 'A1',
                'detail': f'Released {metric_name} = {value:.3f} < P_PMS'
            })

    # A2: Released model regressed from released performance reference
    released_golden = config.get('released_golden_metrics', {})
    tau = thresholds.get('tau', 0.015)
    for metric_name, value in released.items():
        if metric_name in released_golden:
            if value <= released_golden[metric_name] - tau:
                alarms.append({
                    'id': 'A2',
                    'detail': f'P^rel_D {value:.3f} <= P^rel_G - tau = {released_golden[metric_name] - tau:.3f}'
                })

    # A3: Major distributional shift (drift score > 0.90)
    drift_score = config.get('current_drift_score', 0.0)
    if drift_score > thresholds.get('S_major_D', 0.90):
        alarms.append({
            'id': 'A3',
            'detail': f'Drift {drift_score:.3f} > theta_major'
        })

    return alarms
```

## Logging specification

Every CDM evaluation must be logged. The required fields are documented in [Audit trail](07-audit-trail.html). At minimum, each log entry must record:

- The decision category and priority level
- All alarm conditions that fired
- The specific metric values and thresholds that triggered the decision
- A timestamp (ISO 8601)
- The iteration number

> **Sepsis example:** At iteration 10, the CDM produced the most severe composite output observed in the experiment: REJECT (P1) + ALARM (A3). Sensitivity had dropped to 0.428 (far below P_fail = 0.65) due to catastrophic label corruption (80% positive flip, 30% negative flip) combined with Gaussian noise. Simultaneously, the drift score reached 1.000, exceeding theta_major = 0.90 and firing alarm A3. This composite REJECT + ALARM state triggered immediate CAPA initiation.

### Source

Manuscript Section II-B-3 (CDM specification), Tables III and IV (decision categories and priority hierarchy). The ternary decision function is defined as Equation 1. Alarm conditions are specified in Table IV. The reference Python implementation is reproduced from Supplementary S3.3. Sepsis iteration results are in Table VIII.
