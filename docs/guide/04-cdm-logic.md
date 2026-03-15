---
title: "CDM logic"
supplement: "S3.3"
prev: "03-thresholds.html"
next: "05-mlcps.html"
---

# CDM logic

The Clinical Decision Module (CDM) is the deterministic decision engine at the core of AEGIS. It takes performance metrics, drift scores, and gold standard comparisons as input and produces a composite output: a decision category and an independent alarm state.

[View the CDM Pseudocode Reference](../forms/s3-cdm-pseudocode.html)

## Ternary operator

AEGIS uses a ternary evaluation operator (Eq. 1 from the manuscript) that maps each metric to one of three states:

```
T(metric, threshold_lower, threshold_upper) =
    FAIL    if metric < threshold_lower
    BUFFER  if threshold_lower <= metric < threshold_upper
    PASS    if metric >= threshold_upper
```

This ternary logic underpins the CDM's ability to distinguish between outright failure (REJECT), borderline performance (CONDITIONAL APPROVAL), and full compliance (APPROVE).

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
| P1 (highest) | Critical safety | Any metric < P_fail | REJECT |
| P2 | Major drift | drift_score > theta_major AND performance degradation (> tau from gold standard) | REJECT |
| P3 | Buffer zone | Any metric below R_G buffer | CONDITIONAL APPROVAL |
| P3.5 | Minor drift / borderline | Minor drift detected OR borderline metrics requiring human judgement | CLINICAL REVIEW |
| P4 (lowest) | Full compliance | All metrics pass all checks | APPROVE |

The priority ordering ensures that safety-critical failures are always caught first, regardless of other conditions.

> **Sepsis example:** At iteration 7, sensitivity dropped to 0.653 -- above P_fail (0.65) but below R_G(sensitivity) (0.66). The CDM evaluated as follows:
>
> - P1: sensitivity 0.653 >= P_fail 0.65 -- **not triggered**
> - P2: drift_score 0.441 < theta_major 0.90 -- **not triggered**
> - P3: sensitivity 0.653 < R_G(sensitivity) 0.66 -- **TRIGGERED**
>
> Result: CONDITIONAL APPROVAL with details `{priority: P3, trigger: "sensitivity = 0.653 < R_G = 0.66"}`. The model was flagged for heightened monitoring but not withdrawn.

## Alarm conditions (A1--A3)

Alarm conditions operate on an **independent channel** from the decision hierarchy. They are evaluated for every iteration regardless of the decision outcome.

| Alarm | Condition | What it monitors |
|-------|-----------|-----------------|
| A1 | Released model metric < P_PMS | Currently deployed model's absolute performance |
| A2 | Released model regressed > delta from release baseline | Deployed model's performance trend |
| A3 | drift_score > theta_major | Severity of covariate drift |

Key framing: **APPROVE + ALARM is not contradictory.** This combination means:

- The candidate model (being evaluated) passed all checks and can be approved
- BUT the currently released model has triggered a post-market safety concern

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

    # P2: Major drift + performance degradation
    if drift_score > thresholds.get('theta_major', 0.90):
        degraded = any(
            metrics[m] < gold_standard[m] - thresholds.get('tau', 0.015)
            for m in metrics if m in gold_standard
        )
        if degraded:
            return {
                'decision': 'REJECT',
                'alarm': len(alarm_conditions) > 0,
                'alarm_conditions': alarm_conditions,
                'details': {
                    'priority': 'P2',
                    'trigger': f'drift = {drift_score:.3f} > theta_major with degradation'
                }
            }

    # P3: Performance buffer zone
    if config.get('conditional_approval_enabled', True):
        for metric_name, value in metrics.items():
            rg_key = f'R_G_{metric_name}'
            if rg_key in thresholds and value < thresholds[rg_key]:
                return {
                    'decision': 'CONDITIONAL APPROVAL',
                    'alarm': len(alarm_conditions) > 0,
                    'alarm_conditions': alarm_conditions,
                    'details': {
                        'priority': 'P3',
                        'trigger': f'{metric_name} = {value:.3f} < R_G = {thresholds[rg_key]}'
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

    # A2: Released model regression from release baseline
    release_baseline = config.get('release_baseline', {})
    delta = thresholds.get('delta', 0.025)
    for metric_name, value in released.items():
        if metric_name in release_baseline:
            regression = release_baseline[metric_name] - value
            if regression > delta:
                alarms.append({
                    'id': 'A2',
                    'detail': f'Regression {regression:.3f} > delta = {delta}'
                })

    # A3: Severe covariate drift
    drift_score = config.get('current_drift_score', 0.0)
    if drift_score > thresholds.get('theta_major', 0.90):
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

Manuscript Section II-B-3 (CDM specification), Tables III and VI (decision categories and priority hierarchy). The ternary operator is defined as Equation 1. Alarm conditions are specified in Table VI Part B. The reference Python implementation is reproduced from Supplementary S3.3.
