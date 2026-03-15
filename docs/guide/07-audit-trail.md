---
title: "Audit trail"
supplement: "S1.4"
prev: "06-drift.html"
next: "08-pccp-mapping.html"
---

# Audit trail

A complete, immutable audit trail is a regulatory requirement for medical AI systems operating under FDA 21 CFR Part 11 and EU MDR. AEGIS mandates that every iteration of the governance loop produces a structured log entry capturing all inputs, computations, and outputs of the CDM evaluation.

## Why audit trail matters

The audit trail serves three critical functions:

| Function | Regulatory context | What it demonstrates |
|----------|-------------------|---------------------|
| **Traceability** | FDA PCCP, EU MDR Art. 83 | Every model version can be traced from data to decision |
| **Reproducibility** | ISO 14971:2019 | Any iteration can be re-evaluated with the same inputs |
| **Accountability** | AI Act Art. 14 | Human oversight of automated decisions is documented |

Without a complete audit trail, the iterative governance loop cannot demonstrate compliance with post-market surveillance obligations. Regulators expect to see the full history of model versions, their performance evaluations, and the decisions made at each step.

> **Sepsis example:** The sepsis case study produced 11 audit trail entries (k = 0 through k = 10), documenting the complete lifecycle from initial deployment through catastrophic failure. The audit trail showed a clear progression: five consecutive APPROVE decisions (k = 0--4), one CLINICAL REVIEW (k = 5), another APPROVE (k = 6), two CONDITIONAL APPROVALs (k = 7--8), a REJECT (k = 9), and a REJECT + ALARM (k = 10). This documented trajectory would be essential for regulatory review, demonstrating that the framework correctly escalated its response as data quality degraded.

## 11 required log fields

Every iteration must log the following fields. These are derived from the CDM specification (Manuscript Section II-B-3) and Supplementary S1.4.

| # | Field | Type | Description |
|---|-------|------|-------------|
| 1 | `iteration` | integer | Iteration index k |
| 2 | `timestamp` | string (ISO 8601) | When the CDM evaluation was executed |
| 3 | `dataset_sizes` | object | Sizes of D_T,k, D_G, and D_D,k |
| 4 | `metrics` | object | All computed metric values with names, values, thresholds, and pass/fail |
| 5 | `mlcps` | float | MLcps composite performance score |
| 6 | `drift_score` | float | Proportion of features with significant drift |
| 7 | `drift_details` | object | Per-feature p-values from KS tests |
| 8 | `cdm_decision` | string | Decision category (APPROVE / CONDITIONAL APPROVAL / CLINICAL REVIEW / REJECT) |
| 9 | `alarm_state` | object | Alarm flag (true/false) and list of triggered conditions (A1/A2/A3) |
| 10 | `gold_standard_comparison` | object | Per-metric deviation from gold standard and within-tolerance flag |
| 11 | `model_version` | string | Model hash, version tag, or unique identifier |

Additional recommended (but not mandatory) fields:

| Field | When to include |
|-------|----------------|
| `operator_id` | Always (identifies the responsible person) |
| `review_notes` | When decision is CLINICAL REVIEW (human assessment required) |
| `capa_reference` | When decision is REJECT or alarm is triggered |
| `data_hash` | SHA-256 hash of D_D,k for integrity verification |

## Recommended JSON format

AEGIS recommends JSON as the log format for machine-readability and interoperability. Each iteration produces one JSON object appended to a log file or inserted into a database.

```json
{
  "iteration": 7,
  "timestamp": "2026-03-15T14:32:18Z",
  "dataset_sizes": {
    "D_T_k": 38254,
    "D_G": 813,
    "D_D_k": 5000
  },
  "metrics": {
    "sensitivity": {
      "value": 0.653,
      "thresholds": {
        "P_fail": 0.65,
        "R_G": 0.66
      },
      "pass_pfail": true,
      "pass_rg": false
    },
    "specificity": {
      "value": 0.720,
      "thresholds": {
        "R_G": 0.60
      },
      "pass_rg": true
    },
    "roc_auc": {
      "value": 0.847,
      "thresholds": {},
      "pass_rg": true
    },
    "balanced_accuracy": {
      "value": 0.687,
      "thresholds": {},
      "pass_rg": true
    }
  },
  "mlcps": 0.607,
  "drift_score": 0.441,
  "drift_details": {
    "method": "KS + Bonferroni",
    "K": 34,
    "alpha": 0.05,
    "alpha_prime": 0.00147,
    "n_drifted": 15,
    "significant_features": [
      "HR", "Temp", "SBP", "MAP", "DBP", "Resp",
      "BaseExcess", "HCO3", "BUN", "Creatinine",
      "Glucose", "Lactate", "Potassium", "WBC", "Platelets"
    ]
  },
  "cdm_decision": "CONDITIONAL APPROVAL",
  "cdm_details": {
    "priority": "P3",
    "trigger": "sensitivity = 0.653 < R_G = 0.66"
  },
  "alarm_state": {
    "alarm": false,
    "alarm_conditions": []
  },
  "gold_standard_comparison": {
    "sensitivity": {
      "gold": 0.890,
      "current": 0.653,
      "deviation": 0.237,
      "within_tolerance": false
    },
    "specificity": {
      "gold": 0.798,
      "current": 0.720,
      "deviation": 0.078,
      "within_tolerance": false
    }
  },
  "model_version": "rf_sepsis_v7_sha256:b2e4f1a9",
  "operator_id": "aegis-system",
  "data_hash": "sha256:8c3d2e1f..."
}
```

> **Sepsis example:** The JSON entry above represents iteration 7 of the sepsis experiment. At this point, sensitivity had dropped to 0.653 -- above P_fail (0.65) but below R_G (0.66), placing it in the performance buffer zone. The CDM correctly assigned CONDITIONAL APPROVAL at priority P3. The drift score of 0.441 indicated that 15 out of 34 features showed significant distribution shift, but this was below theta_major (0.90), so no alarm was triggered. The gold standard comparison showed that sensitivity had deviated 0.237 from the baseline of 0.890, far exceeding tau = 0.015, but since drift had not reached the major threshold, P2 did not fire. This entry demonstrates the CDM's nuanced behaviour: the model was not rejected (it still met the critical safety floor) but was flagged for conditional use and heightened monitoring.

## Storage and retention

### Storage options

| Option | Pros | Cons |
|--------|------|------|
| JSON Lines file (`.jsonl`) | Simple; version-controllable; portable | No query capability |
| Database (PostgreSQL/MongoDB) | Queryable; scalable | Infrastructure overhead |
| Cloud logging (AWS CloudWatch, GCP Logging) | Managed; searchable; retention policies | Vendor lock-in; cost |

### Retention requirements

- **FDA 21 CFR Part 11**: Records must be maintained for the lifetime of the device plus applicable retention period
- **EU MDR**: Technical documentation (including audit trails) must be retained for at least 10 years after the last device is placed on the market
- **AI Act**: Logs must be retained for a period appropriate to the intended purpose of the high-risk AI system (at minimum 6 months)

### Immutability

Audit trail entries must be immutable once written. Use one of the following mechanisms:

- Append-only log files with write-once permissions
- Database records with no UPDATE or DELETE access for audit entries
- Cryptographic chaining (hash of previous entry included in current entry)

```python
import hashlib
import json

def compute_entry_hash(entry: dict, prev_hash: str = "") -> str:
    """Chain audit entries cryptographically."""
    content = json.dumps(entry, sort_keys=True) + prev_hash
    return hashlib.sha256(content.encode()).hexdigest()
```

## Integration with CAPA

When the CDM produces a REJECT or ALARM output, the audit trail entry should include a reference to the initiated CAPA (Corrective and Preventive Action) process. The [CAPA form](../forms/capa.html) captures the root cause analysis, corrective actions, and regulatory notification assessment.

The link between audit trail and CAPA should be bidirectional:

- Audit entry references CAPA ID
- CAPA record references the triggering iteration number and audit entry

### Source

Manuscript Section II-B-3 (CDM specification and logging requirements). The 11 required log fields are specified in Supplementary S1.4 and S3.4. Retention requirements are derived from the regulatory frameworks discussed in Section II-A (Table I). The JSON format is a recommended implementation approach consistent with the reference Python implementation in Supplementary S3.3.
