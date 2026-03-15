# Brain Tumour Segmentation Example

## Overview

This example demonstrates AEGIS governance for a 3D medical image segmentation task using the BraTS 2023/24 dataset with an nnU-Net ResENC-M model. It uses binary APPROVE/REJECT governance with both intermediate categories disabled.

## Setup

```bash
# Pull the Docker image (placeholder)
docker pull kismaile/aegis-brats:latest

# Download BraTS 2023 data from Synapse
# https://www.synapse.org/#!Synapse:syn51156910

# Run with GPU support
docker run --gpus all -v /path/to/brats/data:/data kismaile/aegis-brats:latest
```

## Requirements

- NVIDIA GPU with ≥12 GB VRAM
- Docker with NVIDIA Container Toolkit
- BraTS 2023 training data (1,251 cases)
- BraTS 2024 validation data (219 cases) for drifting dataset

## Key differences from sepsis example

- **Binary governance:** CONDITIONAL APPROVAL and CLINICAL REVIEW disabled
- **Single metric:** Dice Similarity Coefficient (DSC) only
- **13 iterations** with progressive domain shift
- **Drift detection:** Performance comparison (not KS test)
