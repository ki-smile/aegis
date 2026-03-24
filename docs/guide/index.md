---
title: "AEGIS Implementation Guide"
supplement: ""
prev: ""
next: "01-concepts.html"
---

# AEGIS Implementation Guide

## What is AEGIS?

AEGIS (An Operational Infrastructure for Post-Market Governance of Adaptive Medical AI) is a modular, rule-based framework for governing medical AI systems that undergo iterative learning after initial market authorisation. It provides a structured pipeline for continuous monitoring, performance evaluation, and regulatory-compliant decision-making throughout the post-market lifecycle of adaptive AI/ML-enabled medical devices.

AEGIS is **not** a machine learning library, a training framework, or a model architecture. It is an operational governance layer that sits on top of any ML pipeline and provides:

- Structured dataset management across training, golden, and drifting splits
- Composite performance scoring with clinically weighted metrics
- Covariate and concept drift detection with statistical rigour
- A deterministic, auditable decision engine with priority-ordered logic
- Full traceability to ISO 14971:2019, FDA PCCP, and EU MDR/AI Act requirements

> **Sepsis example:** In the sepsis prediction case study, AEGIS governed 11 iterations (k = 0 through k = 10) of a Random Forest classifier trained on 20,336 patients from Hospital A of the PhysioNet Sepsis Challenge, with 4,067 reserved as a fixed performance reference (Golden evaluation set). The framework autonomously issued 8 APPROVE decisions (iterations 0--5 and 8--9), 1 CONDITIONAL APPROVAL (iteration 6), 1 CLINICAL REVIEW (iteration 7), and 1 REJECT (iteration 10) — exercising all four deployment decision categories across the experiment. ALARM was co-issued at iterations 8 and 10. At iteration 10, sensitivity dropped to 0.428 (below the 0.65 threshold), triggering simultaneous REJECT + ALARM and demonstrating the framework's safety boundaries under extreme conditions.

## When to use AEGIS

AEGIS is designed for medical AI systems that meet **all three** of the following criteria:

| Criterion | Description |
|-----------|-------------|
| **Adaptive** | The model is retrained or fine-tuned on new data after deployment |
| **Regulated** | The device falls under FDA 21 CFR Part 11, EU MDR, or the EU AI Act |
| **Continuous** | Post-market surveillance requires ongoing performance monitoring |

If your system is a locked (non-learning) model, AEGIS still provides value for post-market surveillance (PMS) via the alarm channel, but the full iterative governance loop will not apply.

## Three-module pipeline

AEGIS operates through three sequential modules executed at each iteration:

```
Iteration k
┌──────────┐     ┌──────────┐     ┌──────────┐
│   DARM   │ ──> │   MMM    │ ──> │   CDM    │
│ Dataset  │     │ Model    │     │ Clinical │
│ Assimilat.│     │ Monitor  │     │ Decision │
│ & Retrain│     │ Metrics  │     │ Module   │
└──────────┘     └──────────┘     └──────────┘
     │                                  │
     │    ┌────────────────────────┐    │
     └────│  Feedback: D_T,k+1    │<───┘
          │  = D_T,k ∪ D_D,k     │
          └────────────────────────┘
```

## Reading order

This guide is structured as a sequential implementation walkthrough. Each page builds on the previous one. We recommend reading in order:

| # | Page | What you will learn |
|---|------|---------------------|
| 1 | [Core concepts](01-concepts.html) | DARM, MMM, CDM definitions; fixed performance reference; notation |
| 2 | [Configuration](02-configure.html) | How to instantiate AEGIS for your domain |
| 3 | [Thresholds](03-thresholds.html) | ISO 14971 threshold derivation and calibration |
| 4 | [CDM logic](04-cdm-logic.html) | Decision hierarchy, alarm conditions, pseudocode |
| 5 | [MLcps](05-mlcps.html) | Composite performance scoring mechanics |
| 6 | [Drift detection](06-drift.html) | Covariate and concept drift methodology |
| 7 | [Audit trail](07-audit-trail.html) | Logging requirements and JSON format |
| 8 | [PCCP mapping](08-pccp-mapping.html) | FDA PCCP regulatory alignment |
| 9 | [EU regulatory mapping](09-eu-mapping.html) | EU MDR and AI Act compliance |

## Relationship between guide and supplements

Each guide page references one or more sections of the supplementary material. The `supplement` field in each page's metadata traces back to the exact supplement section where the formal specification resides.

| Guide page | Supplement section(s) | Downloadable form |
|------------|----------------------|-------------------|
| Core concepts | S1 | [S1 Checklist](../forms/s1-checklist.html) |
| Configuration | S2.1--S2.2 | [S2 Configuration](../forms/s2-config.html) |
| Thresholds | S2.3 | [S2 Threshold Table](../forms/s2-threshold-table.html) |
| CDM logic | S3.3 | [S3 CDM Pseudocode](../forms/s3-cdm-pseudocode.html) |
| MLcps | S2.4 | -- |
| Drift detection | S2.5 | -- |
| Audit trail | S1.4 | -- |
| PCCP mapping | S2.8, S3.5 | -- |
| EU regulatory mapping | S2.8 | -- |

## Quick start

If you are short on time, focus on these three pages first:

1. **[Core concepts](01-concepts.html)** -- understand the vocabulary
2. **[Configuration](02-configure.html)** -- fill in the S2 configuration form
3. **[Thresholds](03-thresholds.html)** -- derive your safety-critical thresholds

Then return to the remaining pages as you move toward deployment.

### Source

Manuscript Sections I--II. The overall AEGIS infrastructure is introduced in Section I (Introduction) and formally defined in Section II (Methods). The three-module pipeline (DARM, MMM, CDM) is described in Section II-B. The DARM architecture is depicted in Figure 1 and the overall AEGIS infrastructure in Figure 4 of the manuscript.
