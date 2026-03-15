---
title: "EU regulatory mapping"
supplement: "S2.8"
prev: "08-pccp-mapping.html"
next: ""
---

# EU regulatory mapping

AEGIS is designed for dual-jurisdiction compliance, supporting both US FDA and EU regulatory frameworks. This page maps AEGIS elements to the EU AI Act, EU MDR, and relevant MDCG guidance documents. Together with the [PCCP mapping](08-pccp-mapping.html) page, it provides the complete regulatory alignment picture.

## Regulatory landscape overview

Medical AI systems marketed in the EU must comply with three overlapping regulatory instruments:

| Regulation | Scope | Key requirements for adaptive AI |
|------------|-------|----------------------------------|
| **EU MDR (2017/745)** | Medical device safety and performance | Post-market surveillance, PSUR, vigilance reporting |
| **EU AI Act (2024/1689)** | AI-specific requirements for high-risk systems | Risk management, data governance, transparency, human oversight |
| **MDCG guidance** | Interpretive guidance for MDR/IVDR | Technical documentation, clinical evaluation, PCCP-equivalent procedures |

AEGIS addresses requirements from all three instruments through its modular architecture.

## AI Act Article 43(4) -- Substantial modification

Article 43(4) of the AI Act defines when a high-risk AI system has undergone a "substantial modification" requiring re-assessment. AEGIS helps determine whether an iterative update constitutes a substantial modification:

| AI Act criterion | AEGIS mapping | Assessment |
|-----------------|---------------|------------|
| Change affecting compliance | CDM decision + alarm state | REJECT or ALARM indicates potential compliance impact |
| Change to intended purpose | Fixed in AEGIS configuration | AEGIS does not permit changes to intended use |
| Change affecting performance | MMM metrics vs gold standard | Quantified by tau tolerance and MLcps trend |

AEGIS's position is that pre-specified iterative updates within the AEGIS governance framework do **not** constitute substantial modifications when:

1. The modification protocol is pre-specified (CDM hierarchy)
2. The impact assessment methodology is pre-defined (MMM evaluation)
3. All updates remain within predetermined performance boundaries
4. The intended purpose is unchanged

When the CDM produces REJECT, the candidate model is not deployed, so no substantial modification occurs. When ALARM fires on the released model, this may signal a need for regulatory reporting under MDR vigilance rules rather than a new conformity assessment.

> **Sepsis example:** Across 11 iterations, the sepsis prediction model underwent iterative retraining. Iterations 0--6 produced APPROVE or CLINICAL REVIEW decisions, all within the predetermined performance boundaries. Under Article 43(4), these iterations would not constitute substantial modifications because the modification protocol was pre-specified, the impact was assessed against locked thresholds, and the intended purpose remained unchanged. Iterations 9--10 (REJECT and REJECT+ALARM) did not result in deployment of modified models, so no substantial modification to the marketed device occurred -- instead, the governance framework prevented a potentially harmful modification from reaching clinical use.

## Technical documentation requirements

The AI Act requires high-risk AI systems to maintain comprehensive technical documentation. AEGIS outputs map to these requirements:

| AI Act requirement (Annex IV) | AEGIS deliverable |
|-------------------------------|-------------------|
| Description of the AI system | S2 Configuration form (deployment context, model architecture) |
| Risk management system | ISO 14971 threshold traceability + CDM decision hierarchy |
| Data governance | DARM dataset management (D_T, D_G, D_D splits and accumulation rule) |
| Performance metrics | MMM outputs (primary metrics, MLcps, drift score) |
| Human oversight measures | CLINICAL REVIEW category + operator ID in audit trail |
| Accuracy, robustness, cybersecurity | Gold standard comparison, drift detection, dataset hashing |
| Logging capabilities | 11-field audit trail (see [Audit trail](07-audit-trail.html)) |
| Post-market monitoring | PMS alarm channel (A1, A2, A3) |

## EU MDR Article 83 and the ALARM signal

EU MDR Article 83 requires manufacturers of implantable and Class III devices to report on safety and performance through Periodic Safety Update Reports (PSURs). For other classes, post-market surveillance plans must define monitoring and reporting procedures.

The AEGIS alarm channel maps directly to MDR vigilance obligations:

| AEGIS alarm | MDR relevance | Potential reporting obligation |
|-------------|---------------|-------------------------------|
| A1: PMS safety floor breach | Serious incident if harm occurs | MDR Art. 87 vigilance report |
| A2: Performance regression | Trend reporting in PSUR | MDR Art. 86 trend analysis |
| A3: Major drift | Field safety concern | MDR Art. 83 PMS action |

### ALARM as an early warning system

The ALARM channel provides an earlier signal than traditional PMS approaches because it monitors the released model proactively against pre-specified thresholds rather than waiting for adverse event reports:

```
Traditional PMS:  Adverse event occurs → Report → Investigate → Act
AEGIS ALARM:      Metric threshold breached → Immediate alert → Investigate → Act
```

This proactive approach aligns with the EU regulatory philosophy of risk prevention rather than reactive harm mitigation.

> **Sepsis example:** At iteration 10, alarm A3 fired because the drift score reached 1.000 (exceeding theta_major = 0.90). In an EU MDR context, this would trigger a review under the post-market surveillance plan to determine whether the detected distribution shift constitutes a field safety concern. If the drift affected the currently deployed model's ability to correctly predict sepsis in the patient population, this could escalate to a field safety corrective action (FSCA) under MDR Art. 87. The AEGIS audit trail would provide the documentary evidence needed for the competent authority notification.

## MDCG 2025-6 key points

MDCG 2025-6 provides guidance on the clinical evaluation and post-market clinical follow-up for AI/ML medical devices. Key points relevant to AEGIS implementers:

| MDCG 2025-6 topic | AEGIS alignment |
|--------------------|-----------------|
| Continuous learning lifecycle | AEGIS iterative governance loop (DARM-MMM-CDM) |
| Performance monitoring plan | MMM metric tracking + PMS alarm conditions |
| Clinical evidence requirements | Gold standard evaluation on locked dataset D_G |
| Change management | CDM decision hierarchy as pre-specified change protocol |
| Bias and fairness monitoring | MMM fairness metrics (configurable per domain) |
| Transparency | Audit trail with all 11 required fields |

MDCG guidance emphasises that AI/ML devices require a "living" clinical evaluation plan that accounts for post-market performance changes. AEGIS provides the infrastructure for this through its iterative evaluation loop and structured audit trail.

## PSUR reporting

For devices requiring PSURs under MDR Article 86, AEGIS outputs provide structured data for the safety and performance sections:

### PSUR content from AEGIS

| PSUR section | AEGIS data source |
|--------------|-------------------|
| Device description and intended purpose | S2 configuration form |
| Summary of performance data | MLcps trend across iterations; per-metric summary table |
| Benefit-risk determination | CDM decision history; proportion of APPROVE vs other categories |
| Volume of data processed | D_D,k sizes per iteration from audit trail |
| Complaints and vigilance | CAPA records linked to REJECT and ALARM events |
| Conclusions and actions | Trend analysis of decision categories and alarm frequency |

## Risk management philosophy

Table I of the manuscript maps AEGIS to the broader regulatory risk management philosophy:

| Framework | Risk management approach | AEGIS implementation |
|-----------|------------------------|---------------------|
| ISO 14971:2019 | Hazard identification, risk estimation, risk control | All thresholds traced to specific hazards |
| EU MDR | Essential requirements for safety and performance | CDM ensures minimum performance standards |
| AI Act | Risk-based classification and management | Tier-1 and Tier-2 thresholds as risk controls |
| FDA PCCP | Pre-specified change control | CDM as predetermined modification protocol |

AEGIS implements risk management as a continuous, automated process rather than a point-in-time assessment. Every iteration evaluates the model against the complete risk control framework, ensuring that risk management is not a one-time activity but an ongoing operational practice.

## Dual-jurisdiction considerations

When operating in both US and EU markets, be aware of key differences:

| Aspect | US (FDA) | EU (MDR + AI Act) |
|--------|----------|-------------------|
| Change control mechanism | PCCP (pre-specified) | No exact equivalent; closest is MDCG change management guidance |
| Reporting obligations | MDR (21 CFR Part 803) | Art. 87 vigilance + Art. 86 PSUR |
| AI-specific requirements | Evolving FDA guidance | AI Act Annex IV requirements |
| Audit trail requirements | 21 CFR Part 11 (electronic records) | AI Act Art. 12 (logging) |
| Human oversight | Clinical review processes | AI Act Art. 14 (human oversight) |

AEGIS addresses both jurisdictions through its modular design: the same CDM logic, audit trail, and threshold framework satisfy requirements from both regulatory systems.

> **Caveat:** Regulatory landscapes for AI in healthcare are evolving rapidly. The mappings in this guide reflect the state of regulations as of early 2026. Confirm all regulatory interpretations with qualified regulatory counsel in both jurisdictions before relying on these mappings for submission or compliance purposes.

### Source

Manuscript Section II-A (regulatory context and Table I mapping six frameworks), Section IV-F (dual-jurisdiction regulatory mapping), and Table I (regulatory framework comparison). EU AI Act Article 43(4) substantial modification criteria. EU MDR Articles 83, 86, and 87. MDCG 2025-6 guidance on AI/ML clinical evaluation. Supplementary S2.8 provides the regulatory pathway mapping configuration.
