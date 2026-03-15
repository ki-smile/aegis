---
id: s3-cdm-pseudocode
title: "CDM logic and pseudocode"
supplement: "S3.3"
docx_title: "AEGIS CDM Logic Reference"
docx_filename_pattern: "AEGIS_CDM_Logic_{date}.docx"
type: reference-doc
description: "Reference document describing the Clinical Decision Module logic, priority-ordered decision hierarchy, PMS alarm conditions, and Python reference implementation."
includes_shared: [footer]
sections:
  - id: key-framing
    title: "Key framing"
    source: "Supplementary S3.3"
    type: bullet-list
    items:
      - "The CDM produces a composite output: a decision category AND an independent alarm state."
      - "APPROVE + ALARM is not contradictory — it means the model passed all performance checks but a PMS alarm condition was triggered (e.g., gold standard regression)."
      - "The alarm channel operates independently of the decision hierarchy."

  - id: decision-hierarchy
    title: "Priority-ordered decision hierarchy"
    source: "Manuscript Table VI Part A"
    type: table
    columns:
      - id: priority
        label: "Priority"
      - id: condition
        label: "Condition"
      - id: decision
        label: "Decision"
      - id: trigger
        label: "Trigger description"
    rows:
      - priority: "P1 (highest)"
        condition: "Any metric < P_fail"
        decision: "REJECT"
        trigger: "Critical safety floor violated"
      - priority: "P2"
        condition: "Major drift AND performance degradation"
        decision: "REJECT"
        trigger: "Severe distribution shift with performance impact"
      - priority: "P3"
        condition: "Any metric below R_G buffer"
        decision: "CONDITIONAL APPROVAL"
        trigger: "Performance in buffer zone — acceptable but declining"
      - priority: "P4 (lowest)"
        condition: "All metrics pass all checks"
        decision: "APPROVE"
        trigger: "Full compliance with all thresholds"

  - id: alarm-conditions
    title: "PMS alarm conditions"
    source: "Manuscript Table VI Part B"
    type: table
    columns:
      - id: alarm
        label: "Alarm"
      - id: condition
        label: "Condition"
      - id: description
        label: "Description"
    rows:
      - alarm: "A1"
        condition: "Released model performance < P_PMS"
        description: "Post-market safety floor breach on currently deployed model"
      - alarm: "A2"
        condition: "Released model regression > δ from release baseline"
        description: "Significant regression from performance at time of release"
      - alarm: "A3"
        condition: "Drift score > θ_major"
        description: "Severe covariate drift detected"

  - id: reference-implementation
    title: "Reference Python implementation"
    source: "Supplementary S3.3"
    type: code
    language: python
    code: |
      def cdm_evaluate(metrics, thresholds, drift_score, gold_standard, config):
          """
          Clinical Decision Module — priority-ordered evaluation.

          Parameters
          ----------
          metrics : dict
              Current iteration metrics, e.g. {'sensitivity': 0.85, 'specificity': 0.72}
          thresholds : dict
              All threshold values from S2 configuration
          drift_score : float
              Proportion of features with significant drift (0.0–1.0)
          gold_standard : dict
              Gold standard baseline metrics from iteration 0
          config : dict
              Active categories and configuration

          Returns
          -------
          dict
              {'decision': str, 'alarm': bool, 'alarm_conditions': list, 'details': dict}
          """
          alarm_conditions = _check_alarm(metrics, thresholds, config)

          # P1: Critical safety floor
          for metric_name, value in metrics.items():
              pfail_key = f'P_fail_{metric_name}'
              if pfail_key in thresholds and value < thresholds[pfail_key]:
                  return {
                      'decision': 'REJECT',
                      'alarm': len(alarm_conditions) > 0,
                      'alarm_conditions': alarm_conditions,
                      'details': {'priority': 'P1', 'trigger': f'{metric_name} = {value:.3f} < P_fail = {thresholds[pfail_key]}'}
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
                      'details': {'priority': 'P2', 'trigger': f'drift_score = {drift_score:.3f} > θ_major with performance degradation'}
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
                          'details': {'priority': 'P3', 'trigger': f'{metric_name} = {value:.3f} < R_G = {thresholds[rg_key]}'}
                      }

          # P4: All checks passed
          return {
              'decision': 'APPROVE',
              'alarm': len(alarm_conditions) > 0,
              'alarm_conditions': alarm_conditions,
              'details': {'priority': 'P4', 'trigger': 'All metrics pass all checks'}
          }


      def _check_alarm(metrics, thresholds, config):
          """Check PMS alarm conditions independently of decision hierarchy."""
          alarms = []

          # A1: Released model below PMS safety floor
          released = config.get('released_metrics', {})
          for metric_name, value in released.items():
              pms_key = f'P_PMS_{metric_name}'
              if pms_key in thresholds and value < thresholds[pms_key]:
                  alarms.append({'id': 'A1', 'detail': f'Released {metric_name} = {value:.3f} < P_PMS = {thresholds[pms_key]}'})

          # A2: Released model regression from release baseline
          release_baseline = config.get('release_baseline', {})
          delta = thresholds.get('delta', 0.025)
          for metric_name, value in released.items():
              if metric_name in release_baseline:
                  regression = release_baseline[metric_name] - value
                  if regression > delta:
                      alarms.append({'id': 'A2', 'detail': f'Released {metric_name} regressed by {regression:.3f} > δ = {delta}'})

          # A3: Severe covariate drift
          drift_score = config.get('current_drift_score', 0.0)
          if drift_score > thresholds.get('theta_major', 0.90):
              alarms.append({'id': 'A3', 'detail': f'Drift score {drift_score:.3f} > θ_major = {thresholds["theta_major"]}'})

          return alarms


      def gold_standard_compare(current_metrics, gold_standard, tau=0.015):
          """
          Compare current metrics against gold standard baseline.

          Returns dict with per-metric comparison and overall pass/fail.
          """
          comparisons = {}
          all_pass = True
          for metric_name, gold_value in gold_standard.items():
              if metric_name in current_metrics:
                  current = current_metrics[metric_name]
                  deviation = gold_value - current
                  passed = deviation <= tau
                  comparisons[metric_name] = {
                      'gold': gold_value,
                      'current': current,
                      'deviation': deviation,
                      'within_tolerance': passed
                  }
                  if not passed:
                      all_pass = False
          return {'comparisons': comparisons, 'all_within_tolerance': all_pass}

  - id: required-log-fields
    title: "Required log fields per iteration"
    source: "Supplementary S1.4, S3.4"
    type: bullet-list
    items:
      - "Iteration number (k)"
      - "Timestamp (ISO 8601)"
      - "Dataset sizes: |D_T,k|, |D_G|, |D_D,k|"
      - "All computed metrics (name, value, threshold, pass/fail)"
      - "MLcps composite score"
      - "Drift score and per-feature p-values"
      - "CDM decision category"
      - "Alarm state and triggered conditions (A1/A2/A3)"
      - "Gold standard comparison result"
      - "Model version hash or tag"
      - "Operator ID and review notes (if CLINICAL REVIEW)"
---

Reference document for CDM logic. Not a fillable form — renders as a readable page with downloadable .docx.
