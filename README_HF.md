---
title: Jurassic Kart PINN Drift
emoji: 🏎️
colorFrom: pink
colorTo: purple
sdk: static
pinned: false
license: mit
---

# Jurassic Kart: PINN Drift 🦖🏎️

A browser-based racing game powered by a **Physics-Informed Neural Network (PINN)** proxy for realistic vehicle dynamics.

## 🧠 The PINN Model

The game uses a `PINNDynamics` class that serves as a closed-form approximation of a neural network trained on vehicle physics. It replaces standard rigid-body physics with a non-linear tire friction model (based on the Pacejka Magic Formula) typically found in high-fidelity simulators or learned via PINNs.

### Features

- **Neural Drift Physics**: controlled traction loss modeled by tanh activations.
- **Latent Space Raceway**: Procedurally generated track.
- **Edge Optimized**: Runs entirely in-browser with <0.1ms inference time.

## 🎮 How to Play

- **WASD / Arrows**: Drive
- **SPACE**: Drift (engage PINN traction loss)

## 🏗️ Architecture

- `jurassic-kart-pinn.html`: Single-file game engine + PINN inference.
- `qube_runtime.py`: (Optional) Python-based atomic agent backend.

*Built with the Token Pixel Corridor-Grade Invariant System.*
