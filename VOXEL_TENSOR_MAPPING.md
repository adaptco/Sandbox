# Voxel-Tensor Mapping Specification v1.0

## Manifold Neighborhood Discretization for Edge Agents

**Status**: `CANONICAL`
**Version**: `1.0.0`
**Spec Hash**: `sha256:VOXEL_SPEC_V1_0x7B4C`
**Ratified**: `2026-01-17T21:48:40Z`

---

## 🎯 **Purpose**

The **Voxel-Tensor Mapping** defines how an agent's continuous phase-space manifold is discretized into a compact voxel representation suitable for:

- **Edge deployment** (minimal memory footprint)
- **Collision detection** (fast spatial queries)
- **Pathfinding** (A* over voxel grid)
- **Manifold learning** (curvature estimation)
- **Token pixel compression** (hash-based signatures)

---

## 📐 **Phase-Space Manifold**

The agent exists in a 4D phase-space manifold `M ⊂ ℝ⁴`:

```text
M = {(φ, ψ, ω, τ) : φ ∈ [0, 2π], ψ ∈ [0, 1], ω ∈ [0, ω_max], τ ∈ ℝ}
```

This continuous manifold is discretized into a **voxel grid** for computational tractability.

---

## 🧊 **Voxel Grid Structure**

### Grid Definition

The voxel grid `G` is a 4D tensor:

```text
G ∈ {0, 1}^{N_φ × N_ψ × N_ω × N_τ}
```

Where:

- `N_φ` = number of voxels in φ dimension
- `N_ψ` = number of voxels in ψ dimension
- `N_ω` = number of voxels in ω dimension
- `N_τ` = number of voxels in τ dimension

### Default Resolution

```python
VOXEL_RESOLUTION = {
    "phi": 64,    # 64 bins over [0, 2π]
    "psi": 32,    # 32 bins over [0, 1]
    "omega": 32,  # 32 bins over [0, ω_max]
    "tau": 64     # 64 bins (sliding window)
}
```

### Voxel Size

```text
Δφ = 2π / N_φ ≈ 0.098 radians
Δψ = 1 / N_ψ = 0.03125
Δω = ω_max / N_ω
Δτ = τ_window / N_τ
```

---

## 🗺️ **Coordinate Mapping**

### Continuous → Discrete

Convert a continuous state vector to voxel coordinates:

```python
def continuous_to_voxel(state: StateVector, resolution: dict) -> VoxelCoord:
    """Map continuous state to voxel grid coordinates."""
    i_phi = int((state.phi / (2 * np.pi)) * resolution["phi"]) % resolution["phi"]
    i_psi = int(state.psi * resolution["psi"])
    i_omega = int((state.omega / OMEGA_MAX) * resolution["omega"])
    i_tau = int((state.tau % TAU_WINDOW) / TAU_WINDOW * resolution["tau"])

    return VoxelCoord(i_phi, i_psi, i_omega, i_tau)
```

### Discrete → Continuous (Center)

Convert voxel coordinates back to continuous center point:

```python
def voxel_to_continuous(voxel: VoxelCoord, resolution: dict) -> StateVector:
    """Map voxel grid coordinates to continuous center point."""
    phi = (voxel.i_phi + 0.5) * (2 * np.pi) / resolution["phi"]
    psi = (voxel.i_psi + 0.5) / resolution["psi"]
    omega = (voxel.i_omega + 0.5) * OMEGA_MAX / resolution["omega"]
    tau = (voxel.i_tau + 0.5) * TAU_WINDOW / resolution["tau"]

    return StateVector(phi, psi, omega, tau)
```

---

## 🎲 **Voxel Occupancy**

Each voxel has a binary occupancy state:

```text
G[i, j, k, l] ∈ {0, 1}

where:
  0 = EMPTY (unoccupied, traversable)
  1 = OCCUPIED (obstacle, agent, or boundary)
```

### Occupancy Rules

| Condition | Occupancy |
| ----------- | ----------- |
| Agent current position | 1 |
| Obstacle | 1 |
| Corridor boundary | 1 |
| Free space | 0 |

---

## 🔍 **Neighborhood Sampling**

For the token pixel `voxelSignature`, we sample a **3×3×3 cube** around the agent in the first 3 dimensions:

### 3D Neighborhood (φ, ψ, ω)

```python
def sample_neighborhood_3x3x3(agent_voxel: VoxelCoord, grid: np.ndarray) -> np.ndarray:
    """Sample 27 voxels around agent (excluding tau dimension)."""
    i, j, k = agent_voxel.i_phi, agent_voxel.i_psi, agent_voxel.i_omega

    neighborhood = np.zeros((3, 3, 3), dtype=np.uint8)

    for di in range(-1, 2):
        for dj in range(-1, 2):
            for dk in range(-1, 2):
                # Wrap φ (periodic), clamp ψ and ω
                i_sample = (i + di) % grid.shape[0]
                j_sample = np.clip(j + dj, 0, grid.shape[1] - 1)
                k_sample = np.clip(k + dk, 0, grid.shape[2] - 1)

                # Average over tau dimension
                occupancy = np.mean(grid[i_sample, j_sample, k_sample, :])
                neighborhood[di + 1, dj + 1, dk + 1] = 1 if occupancy > 0.5 else 0

    return neighborhood
```

### Bit Vector Encoding

Convert 3×3×3 cube to 27-bit vector:

```python
def neighborhood_to_bitvector(neighborhood: np.ndarray) -> int:
    """Flatten 3×3×3 cube to 27-bit integer."""
    flat = neighborhood.flatten()
    bitvector = 0
    for i, bit in enumerate(flat):
        if bit:
 bitvector | = (1 << i)
    return bitvector
```

### Voxel Signature Hash

```python
def compute_voxel_signature(neighborhood_bits: int) -> str:
    """Hash the neighborhood to a compact signature."""
    data = neighborhood_bits.to_bytes(4, byteorder='big')
    hash_digest = hashlib.sha256(data).hexdigest()
    return f"VXL_0x{hash_digest[:4].upper()}"
```

---

## 🧮 **Tensor Representation**

For machine learning models, the voxel grid is represented as a 4D tensor:

### Tensor Shape

```python
T ∈ ℝ^{N_φ × N_ψ × N_ω × N_τ × C}
```

Where `C` is the number of channels (features per voxel).

### Multi-Channel Voxels

| Channel | Feature |
| --------- | --------- |
| 0 | Occupancy (0 or 1) |
| 1 | Agent distance (normalized) |
| 2 | Obstacle distance (normalized) |
| 3 | Corridor boundary distance |
| 4 | Intent alignment (ψ projection) |

### Tensor Construction

```python
def construct_voxel_tensor(agent: Agent, grid: np.ndarray) -> np.ndarray:
    """Build multi-channel voxel tensor."""
    N_phi, N_psi, N_omega, N_tau = grid.shape
    C = 5  # number of channels

    tensor = np.zeros((N_phi, N_psi, N_omega, N_tau, C))

    # Channel 0: Occupancy
    tensor[:, :, :, :, 0] = grid

    # Channel 1: Agent distance field
    agent_voxel = continuous_to_voxel(agent.state_vector, VOXEL_RESOLUTION)
    tensor[:, :, :, :, 1] = compute_distance_field(agent_voxel, grid.shape)

    # Channel 2: Obstacle distance field
    obstacles = get_obstacle_voxels(grid)
    tensor[:, :, :, :, 2] = compute_multi_distance_field(obstacles, grid.shape)

    # Channel 3: Boundary distance field
    boundaries = get_boundary_voxels(grid)
    tensor[:, :, :, :, 3] = compute_multi_distance_field(boundaries, grid.shape)

    # Channel 4: Intent alignment projection
    tensor[:, :, :, :, 4] = project_intent_alignment(agent, grid.shape)

    return tensor
```

---

## 🌊 **Distance Fields**

Signed distance fields enable efficient spatial queries.

### Euclidean Distance Field

```python
def compute_distance_field(center: VoxelCoord, shape: tuple) -> np.ndarray:
    """Compute Euclidean distance from center voxel."""
    i_grid, j_grid, k_grid, l_grid = np.meshgrid(
        np.arange(shape[0]),
        np.arange(shape[1]),
        np.arange(shape[2]),
        np.arange(shape[3]),
        indexing='ij'
    )

    # Periodic distance in φ dimension
    d_phi = np.minimum(
        np.abs(i_grid - center.i_phi),
        shape[0] - np.abs(i_grid - center.i_phi)
    )
    d_psi = np.abs(j_grid - center.i_psi)
    d_omega = np.abs(k_grid - center.i_omega)
    d_tau = np.abs(l_grid - center.i_tau)

    distance = np.sqrt(d_phi**2 + d_psi**2 + d_omega**2 + d_tau**2)

    # Normalize to [0, 1]
    return distance / np.max(distance)
```

---

## 🎯 **Collision Detection**

### Ray Casting

```python
def voxel_ray_cast(start: VoxelCoord, direction: np.ndarray, grid: np.ndarray, max_steps: int = 100) -> Optional[VoxelCoord]:
    """Cast a ray through voxel grid until hitting an obstacle."""
    current = np.array([start.i_phi, start.i_psi, start.i_omega, start.i_tau], dtype=float)
    direction_normalized = direction / np.linalg.norm(direction)

    for step in range(max_steps):
        current += direction_normalized

        # Convert to integer voxel coordinates
        voxel = VoxelCoord(
            int(current[0]) % grid.shape[0],
            int(np.clip(current[1], 0, grid.shape[1] - 1)),
            int(np.clip(current[2], 0, grid.shape[2] - 1)),
            int(np.clip(current[3], 0, grid.shape[3] - 1))
        )

        # Check occupancy
        if grid[voxel.i_phi, voxel.i_psi, voxel.i_omega, voxel.i_tau]:
            return voxel

    return None  # No collision
```

### Swept Volume Collision

```python
def check_swept_collision(start: StateVector, end: StateVector, grid: np.ndarray) -> bool:
    """Check if trajectory from start to end collides with obstacles."""
    start_voxel = continuous_to_voxel(start, VOXEL_RESOLUTION)
    end_voxel = continuous_to_voxel(end, VOXEL_RESOLUTION)

    direction = np.array([
        end_voxel.i_phi - start_voxel.i_phi,
        end_voxel.i_psi - start_voxel.i_psi,
        end_voxel.i_omega - start_voxel.i_omega,
        end_voxel.i_tau - start_voxel.i_tau
    ])

    collision = voxel_ray_cast(start_voxel, direction, grid)
    return collision is not None
```

---

## 🛣️ **Pathfinding (A*)**

```python
def voxel_astar(start: VoxelCoord, goal: VoxelCoord, grid: np.ndarray) -> List[VoxelCoord]:
    """A* pathfinding over voxel grid."""
    from heapq import heappush, heappop

    def heuristic(a: VoxelCoord, b: VoxelCoord) -> float:
        """Euclidean distance heuristic."""
        return np.sqrt(
            min((a.i_phi - b.i_phi)**2, (grid.shape[0] - abs(a.i_phi - b.i_phi))**2) +
            (a.i_psi - b.i_psi)**2 +
            (a.i_omega - b.i_omega)**2 +
            (a.i_tau - b.i_tau)**2
        )

    open_set = []
    heappush(open_set, (0, start))
    came_from = {}
    g_score = {start: 0}
    f_score = {start: heuristic(start, goal)}

    while open_set:
        _, current = heappop(open_set)

        if current == goal:
            # Reconstruct path
            path = [current]
            while current in came_from:
                current = came_from[current]
                path.append(current)
            return list(reversed(path))

        for neighbor in get_voxel_neighbors(current, grid):
            if grid[neighbor.i_phi, neighbor.i_psi, neighbor.i_omega, neighbor.i_tau]:
                continue  # Skip occupied voxels

            tentative_g = g_score[current] + 1

            if neighbor not in g_score or tentative_g < g_score[neighbor]:
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                f_score[neighbor] = tentative_g + heuristic(neighbor, goal)
                heappush(open_set, (f_score[neighbor], neighbor))

    return []  # No path found
```

---

## 📊 **Manifold Curvature Estimation**

Voxel neighborhoods estimate local curvature:

```python
def estimate_gaussian_curvature(voxel: VoxelCoord, grid: np.ndarray) -> float:
    """Estimate Gaussian curvature from voxel neighborhood."""
    neighborhood = sample_neighborhood_3x3x3(voxel, grid)

    # Count occupied neighbors
    occupancy_count = np.sum(neighborhood)

    # Curvature proxy: deviation from flat (13.5 expected if uniform)
    curvature = abs(occupancy_count - 13.5) / 13.5

    return curvature
```

---

## 💾 **Compression**

For edge deployment, compress voxel grids:

### Run-Length Encoding

```python
def compress_voxel_grid_rle(grid: np.ndarray) -> bytes:
    """Run-length encoding for sparse voxel grids."""
    flat = grid.flatten()
    compressed = []

    current_val = flat[0]
    run_length = 1

    for val in flat[1:]:
        if val == current_val:
            run_length += 1
        else:
            compressed.append((current_val, run_length))
            current_val = val
            run_length = 1

    compressed.append((current_val, run_length))

    return pickle.dumps(compressed)
```

---

## 🎓 **Edge Agent Usage**

Small models can work with voxel subsets:

```python
class EdgeVoxelAgent:
    """Minimal voxel-aware agent for edge deployment."""

    def __init__(self, window_size: int = 7):
        self.window_size = window_size  # 7×7×7 local window

    def get_local_voxels(self, agent_voxel: VoxelCoord, full_grid: np.ndarray) -> np.ndarray:
        """Extract local voxel window around agent."""
        w = self.window_size // 2

        local = np.zeros((self.window_size,) * 3)

        for di in range(-w, w + 1):
            for dj in range(-w, w + 1):
                for dk in range(-w, w + 1):
                    i = (agent_voxel.i_phi + di) % full_grid.shape[0]
                    j = np.clip(agent_voxel.i_psi + dj, 0, full_grid.shape[1] - 1)
                    k = np.clip(agent_voxel.i_omega + dk, 0, full_grid.shape[2] - 1)

                    local[di + w, dj + w, dk + w] = np.mean(full_grid[i, j, k, :])

        return local

    def compute_safe_direction(self, local_voxels: np.ndarray) -> np.ndarray:
        """Find safest direction in local voxel neighborhood."""
        # Simple gradient descent away from obstacles
        gradient = np.gradient(local_voxels)
        direction = -np.array([g[3, 3, 3] for g in gradient])  # Center voxel gradient
        return direction / np.linalg.norm(direction)
```

---

## ✅ **Design Invariants**

### Periodicity

φ dimension wraps periodically (0 ≡ 2π).

### Bounded

ψ, ω, τ dimensions are clamped to valid ranges.

### Determinism

Same state vector → same voxel coordinates.

### Locality

Neighborhood sampling captures local manifold geometry.

### Compactness

Voxel signature fits in < 64 bytes.

---

## 📚 **References**

- **Token Pixel Schema**: See `TOKEN_PIXEL_SCHEMA_V1.md`
- **Checkpointing Ritual**: See `CHECKPOINTING_RITUAL.md`

---

**Spec Authority**: Voxel-Tensor Mapping Committee
**Maintainer**: Agentic CI/CD Working Group
**License**: Corridor-Grade Invariant License v1.0
