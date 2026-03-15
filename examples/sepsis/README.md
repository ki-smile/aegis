# Sepsis Prediction Example

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com)

## Overview

This example demonstrates AEGIS governance across 11 iterations using the PhysioNet Computing in Cardiology Challenge 2019 dataset. A Random Forest classifier (300 trees) is retrained iteratively with progressive data corruption to exercise all 5 decision categories.

## Setup

```bash
# 1. Register at PhysioNet and download the dataset
#    https://physionet.org/content/challenge-2019/

# 2. Place data files in the data/ directory

# 3. Run the notebook
jupyter notebook AEGIS_Sepsis.ipynb
```

## What the notebook demonstrates

- **Iterations 0–3:** APPROVE — stable performance, no significant drift
- **Iterations 4–7:** CONDITIONAL APPROVAL — sensitivity declining, in buffer zone
- **Iterations 8–9:** REJECT — sensitivity below P_fail (0.65)
- **Iteration 10:** REJECT + ALARM — catastrophic corruption triggers A3 (major drift)

All 5 decision categories and 3 alarm conditions are exercised.

## Data

The dataset is **not stored in this repository**. See [data/README.md](data/README.md) for download instructions.
