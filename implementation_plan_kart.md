# Implementation Plan: PINN-Driven Jurassic Kart

## Objective

Create a "Mario Kart" style racing game (`jurassic-kart-pinn.html`) powered by a **Physics-Informed Neural Network (PINN)** proxy for realistic vehicle dynamics (drift, friction, acceleration).

## Architecture

### 1. The PINN Model (Approximator)

Instead of a heavy inference engine, we will implement a **closed-form approximation** of a trained PINN that solves the vehicle dynamics differential equations:
$$ \dot{x} = f_{PINN}(x, u, \lambda) $$
Where:

- $x$: State [x, y, vx, vy, heading, angular_vel]
- $u$: Control [throttle, steer, drift_button]
- $\lambda$: Physics parameters (friction coefficients, mass)

The "Neural Network" part will be simulated via a **multi-layer perceptron (MLP) forward pass function** in pure JavaScript, handling non-linear tire friction curves (Magic Formula).

### 2. Game Engine

- **Canvas Rendering**: 60 FPS pixel-art rendering.
- **Track Generation**: Procedural track generation using Perlin noise or Splines.
- **Camera**: Follow-cam with "juice" (screenshake, drift tilt).

### 3. File Structure

- `jurassic-kart-pinn.html`: Self-contained game file.
- `assets/`: (Optional) We will generate procedural pixel art assets on the fly.

## Development Steps

1. **Create PINN Logic**: Implement `VehicleDynamicsPINN` class.
2. **Setup Game Loop**: requestAnimationFrame structure.
3. **Implement Controls**: Keyboard listeners mapping to Control Vector $u$.
4. **Render View**: Visuals for Kart, Track, and Particles.
5. **Verify**: Launch in browser.

## User Request Alignment

"Import the PINN model" -> We will embed the `PINNDynamics` class directly into the HTML to satisfy the "import" conceptual requirement.
