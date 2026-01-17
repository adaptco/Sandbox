# Replay Court Decoder v1.0

## Deterministic Trajectory Reconstruction from Token Pixel Sequences

**Status**: `CANONICAL`  
**Version**: `1.0.0`  
**Decoder Hash**: `sha256:REPLAY_V1_0x9C2E`  
**Ratified**: `2026-01-17T21:48:40Z`

---

## 🎯 **Purpose**

The **Replay Court** is a deterministic system for reconstructing agent trajectories from token pixel sequences. It enables:

- **Forensic analysis** of agent behavior
- **Debugging** of corridor navigation
- **Audit compliance** with full state reconstruction
- **Time-travel debugging** to any checkpoint
- **Counterfactual simulation** (what-if scenarios)
- **Byzantine fault detection** via hash chain validation

---

## 📐 **Core Concept**

Given a sequence of token pixels:

```
Σ = {TPX_1, TPX_2, ..., TPX_n}
```

The Replay Court can:

1. **Validate** hash chain integrity
2. **Reconstruct** full agent state at any time `t`
3. **Replay** agent trajectory step-by-step
4. **Detect** anomalies and drift
5. **Extract** causal event chains
6. **Visualize** 4D manifold traversal

---

## 🔐 **Hash Chain Validation**

### Forward Validation

Verify that each token pixel correctly links to its predecessor:

```python
def validate_hash_chain_forward(pixels: List[TokenPixel]) -> ValidationResult:
    """Validate hash chain from genesis to latest."""
    for i in range(1, len(pixels)):
        expected_prev = pixels[i - 1].hash
        actual_prev = pixels[i].prevHash
        
        if expected_prev != actual_prev:
            return ValidationResult(
                valid=False,
                failure_index=i,
                reason=f"Broken chain: pixel {i} prevHash doesn't match pixel {i-1} hash"
            )
        
        # Recompute hash to verify integrity
        computed_hash = compute_token_pixel_hash(pixels[i])
        if computed_hash != pixels[i].hash:
            return ValidationResult(
                valid=False,
                failure_index=i,
                reason=f"Hash mismatch: pixel {i} has been tampered with"
            )
    
    return ValidationResult(valid=True, failure_index=None, reason="Chain intact")
```

### Merkle Tree Construction

For efficient validation of large sequences:

```python
def construct_merkle_tree(pixels: List[TokenPixel]) -> MerkleTree:
    """Build Merkle tree from token pixel hashes."""
    leaf_hashes = [pixel.hash for pixel in pixels]
    return MerkleTree(leaf_hashes)

def validate_merkle_proof(pixel: TokenPixel, proof: List[str], root_hash: str) -> bool:
    """Validate a single pixel using Merkle proof."""
    current_hash = pixel.hash
    
    for sibling_hash in proof:
        current_hash = sha256(current_hash + sibling_hash)
    
    return current_hash == root_hash
```

---

## 🔄 **State Reconstruction**

### Point-in-Time State

Reconstruct agent state at specific time `t`:

```python
def reconstruct_state_at_time(pixels: List[TokenPixel], target_time: float) -> AgentState:
    """Reconstruct agent state at given timestamp."""
    # Find closest token pixel <= target_time
    pixel = None
    for p in pixels:
        if p.timestamp <= target_time:
            pixel = p
        else:
            break
    
    if pixel is None:
        raise ValueError(f"No token pixel found before time {target_time}")
    
    # Reconstruct state from token pixel
    state = AgentState(
        state_vector=pixel.stateVector,
        corridor=parse_corridor(pixel.corridor),
        intent_hash=pixel.intentHash,
        event_delta=pixel.eventDelta,
        autonomy_index=pixel.autonomyIndex,
        voxel_signature=pixel.voxelSignature,
        timestamp=pixel.timestamp
    )
    
    return state
```

### Interpolated State

For times between checkpoints, interpolate:

```python
def interpolate_state(pixel_before: TokenPixel, pixel_after: TokenPixel, target_time: float) -> AgentState:
    """Linear interpolation between two token pixels."""
    t_before = pixel_before.timestamp
    t_after = pixel_after.timestamp
    alpha = (target_time - t_before) / (t_after - t_before)
    
    # Interpolate state vector components
    phi = interpolate_circular(pixel_before.stateVector.phi, pixel_after.stateVector.phi, alpha)
    psi = (1 - alpha) * pixel_before.stateVector.psi + alpha * pixel_after.stateVector.psi
    omega = (1 - alpha) * pixel_before.stateVector.omega + alpha * pixel_after.stateVector.omega
    tau = (1 - alpha) * pixel_before.stateVector.tau + alpha * pixel_after.stateVector.tau
    
    state_vector = StateVector(phi, psi, omega, tau)
    
    # Corridor and discrete fields taken from pixel_before
    return AgentState(
        state_vector=state_vector,
        corridor=parse_corridor(pixel_before.corridor),
        intent_hash=pixel_before.intentHash,
        event_delta=pixel_before.eventDelta,
        autonomy_index=(1 - alpha) * pixel_before.autonomyIndex + alpha * pixel_after.autonomyIndex,
        voxel_signature=pixel_before.voxelSignature,
        timestamp=target_time
    )

def interpolate_circular(a: float, b: float, alpha: float) -> float:
    """Interpolate angles on circle (handling wraparound)."""
    diff = (b - a + np.pi) % (2 * np.pi) - np.pi
    return (a + alpha * diff) % (2 * np.pi)
```

---

## 🎬 **Trajectory Replay**

### Step-by-Step Replay

```python
class ReplaySession:
    """Replay agent trajectory from token pixel sequence."""
    
    def __init__(self, pixels: List[TokenPixel]):
        self.pixels = pixels
        self.current_index = 0
        self.validation_result = validate_hash_chain_forward(pixels)
        
        if not self.validation_result.valid:
            raise ValueError(f"Invalid hash chain: {self.validation_result.reason}")
    
    def step(self) -> Optional[AgentState]:
        """Advance to next token pixel."""
        if self.current_index >= len(self.pixels):
            return None
        
        state = self.reconstruct_state(self.pixels[self.current_index])
        self.current_index += 1
        return state
    
    def seek(self, timestamp: float):
        """Jump to specific timestamp."""
        for i, pixel in enumerate(self.pixels):
            if pixel.timestamp >= timestamp:
                self.current_index = i
                return
        
        self.current_index = len(self.pixels)
    
    def get_trajectory(self) -> List[AgentState]:
        """Get full trajectory as list of states."""
        return [self.reconstruct_state(p) for p in self.pixels]
    
    @staticmethod
    def reconstruct_state(pixel: TokenPixel) -> AgentState:
        """Reconstruct agent state from token pixel."""
        return AgentState(
            state_vector=pixel.stateVector,
            corridor=parse_corridor(pixel.corridor),
            intent_hash=pixel.intentHash,
            event_delta=pixel.eventDelta,
            autonomy_index=pixel.autonomyIndex,
            voxel_signature=pixel.voxelSignature,
            timestamp=pixel.timestamp
        )
```

### Real-Time Replay

With configurable playback speed:

```python
class RealTimeReplaySession(ReplaySession):
    """Replay with real-time pacing."""
    
    def __init__(self, pixels: List[TokenPixel], speed_multiplier: float = 1.0):
        super().__init__(pixels)
        self.speed_multiplier = speed_multiplier
        self.replay_start_time = None
        self.trajectory_start_time = pixels[0].timestamp if pixels else 0
    
    def start(self):
        """Start real-time replay."""
        self.replay_start_time = time.time()
    
    def get_current_state(self) -> Optional[AgentState]:
        """Get state corresponding to current real time."""
        if self.replay_start_time is None:
            raise ValueError("Call start() before getting current state")
        
        elapsed = time.time() - self.replay_start_time
        target_time = self.trajectory_start_time + elapsed * self.speed_multiplier
        
        return reconstruct_state_at_time(self.pixels, target_time)
```

---

## 🔍 **Anomaly Detection**

### Drift Analysis

Detect when autonomy index exceeds thresholds:

```python
def detect_drift_anomalies(pixels: List[TokenPixel], threshold: float = 0.3) -> List[Anomaly]:
    """Find all pixels where autonomy drift exceeded threshold."""
    anomalies = []
    
    for i, pixel in enumerate(pixels):
        if pixel.autonomyIndex > threshold:
            anomalies.append(Anomaly(
                pixel_index=i,
                token_pixel_id=pixel.tokenPixelId,
                timestamp=pixel.timestamp,
                autonomy_index=pixel.autonomyIndex,
                severity="CRITICAL" if pixel.autonomyIndex > 0.7 else "WARNING",
                corridor=pixel.corridor
            ))
    
    return anomalies
```

### Intent Changes

Track intent surface evolution:

```python
def track_intent_changes(pixels: List[TokenPixel]) -> List[IntentChange]:
    """Detect all intent hash changes."""
    changes = []
    prev_intent = None
    
    for i, pixel in enumerate(pixels):
        if prev_intent is not None and pixel.intentHash != prev_intent:
            changes.append(IntentChange(
                pixel_index=i,
                timestamp=pixel.timestamp,
                old_intent_hash=prev_intent,
                new_intent_hash=pixel.intentHash,
                corridor=pixel.corridor
            ))
        
        prev_intent = pixel.intentHash
    
    return changes
```

### Corridor Violations

Detect invalid corridor transitions:

```python
def detect_corridor_violations(pixels: List[TokenPixel], corridor_graph: CorridorGraph) -> List[Violation]:
    """Find invalid corridor transitions."""
    violations = []
    
    for i in range(1, len(pixels)):
        from_corridor = parse_corridor(pixels[i - 1].corridor)
        to_corridor = parse_corridor(pixels[i].corridor)
        
        if not corridor_graph.is_valid_transition(from_corridor, to_corridor):
            violations.append(Violation(
                pixel_index=i,
                timestamp=pixels[i].timestamp,
                from_corridor=pixels[i - 1].corridor,
                to_corridor=pixels[i].corridor,
                reason="Invalid corridor transition"
            ))
    
    return violations
```

---

## 🧪 **Counterfactual Simulation**

### "What-If" Analysis

Fork trajectory from any point with modified intent:

```python
def simulate_counterfactual(
    pixels: List[TokenPixel],
    fork_index: int,
    new_intent_hash: str,
    simulator: Callable
) -> List[TokenPixel]:
    """Simulate alternative trajectory from fork point."""
    # Take prefix up to fork point
    prefix = pixels[:fork_index]
    
    # Create modified pixel at fork
    fork_pixel = copy.deepcopy(pixels[fork_index])
    fork_pixel.intentHash = new_intent_hash
    fork_pixel.tokenPixelId = f"TPX_CF_{fork_pixel.tokenPixelId}"
    
    # Recalculate hash
    fork_pixel.hash = compute_token_pixel_hash(fork_pixel)
    
    # Simulate forward from fork
    current_state = ReplaySession.reconstruct_state(fork_pixel)
    new_trajectory = [fork_pixel]
    
    for _ in range(len(pixels) - fork_index - 1):
        next_state = simulator(current_state)
        next_pixel = create_token_pixel_from_state(next_state, new_trajectory[-1].hash)
        new_trajectory.append(next_pixel)
        current_state = next_state
    
    return prefix + new_trajectory
```

---

## 📊 **Trajectory Metrics**

### Compute Statistics

```python
def compute_trajectory_metrics(pixels: List[TokenPixel]) -> TrajectoryMetrics:
    """Compute summary statistics for trajectory."""
    autonomy_indices = [p.autonomyIndex for p in pixels]
    
    # Compute corridor dwell times
    corridor_durations = compute_corridor_durations(pixels)
    
    # Count district transitions
    district_transitions = count_district_transitions(pixels)
    
    # Compute intent stability
    intent_changes = len(track_intent_changes(pixels))
    
    return TrajectoryMetrics(
        total_pixels=len(pixels),
        duration_seconds=pixels[-1].timestamp - pixels[0].timestamp,
        mean_autonomy_index=np.mean(autonomy_indices),
        max_autonomy_index=np.max(autonomy_indices),
        corridor_durations=corridor_durations,
        district_transitions=district_transitions,
        intent_changes=intent_changes
    )

def compute_corridor_durations(pixels: List[TokenPixel]) -> Dict[str, float]:
    """Compute time spent in each corridor."""
    durations = {}
    current_corridor = None
    corridor_start = None
    
    for pixel in pixels:
        if pixel.corridor != current_corridor:
            if current_corridor is not None:
                duration = pixel.timestamp - corridor_start
                durations[current_corridor] = durations.get(current_corridor, 0) + duration
            
            current_corridor = pixel.corridor
            corridor_start = pixel.timestamp
    
    return durations
```

---

## 🎨 **Visualization**

### 4D Trajectory Plot

Project 4D trajectory to 3D for visualization:

```python
def visualize_trajectory_3d(pixels: List[TokenPixel], projection: str = "phi_psi_omega"):
    """Visualize 4D trajectory in 3D."""
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D
    
    fig = plt.figure(figsize=(12, 8))
    ax = fig.add_subplot(111, projection='3d')
    
    # Extract coordinates
    phi = [p.stateVector.phi for p in pixels]
    psi = [p.stateVector.psi for p in pixels]
    omega = [p.stateVector.omega for p in pixels]
    tau = [p.stateVector.tau for p in pixels]
    
    if projection == "phi_psi_omega":
        ax.plot(phi, psi, omega, 'b-', linewidth=2, label='Trajectory')
        ax.set_xlabel('φ (corridor phase)')
        ax.set_ylabel('ψ (intent alignment)')
        ax.set_zlabel('ω (angular velocity)')
    elif projection == "phi_psi_tau":
        ax.plot(phi, psi, tau, 'b-', linewidth=2, label='Trajectory')
        ax.set_xlabel('φ (corridor phase)')
        ax.set_ylabel('ψ (intent alignment)')
        ax.set_zlabel('τ (time)')
    
    # Color by autonomy index
    autonomy = [p.autonomyIndex for p in pixels]
    scatter = ax.scatter(phi, psi, omega if projection == "phi_psi_omega" else tau,
                         c=autonomy, cmap='viridis', s=50, alpha=0.6)
    plt.colorbar(scatter, label='Autonomy Drift Index')
    
    plt.title('Agent Trajectory Replay')
    plt.legend()
    plt.show()
```

### Corridor Flow Diagram

```python
def visualize_corridor_flow(pixels: List[TokenPixel]):
    """Visualize corridor transitions as Sankey diagram."""
    import plotly.graph_objects as go
    
    # Extract corridor transitions
    corridors = [p.corridor for p in pixels]
    transitions = [(corridors[i], corridors[i+1]) for i in range(len(corridors)-1)]
    
    # Count transitions
    transition_counts = {}
    for from_c, to_c in transitions:
        key = (from_c, to_c)
        transition_counts[key] = transition_counts.get(key, 0) + 1
    
    # Build Sankey diagram
    unique_corridors = list(set(corridors))
    corridor_to_idx = {c: i for i, c in enumerate(unique_corridors)}
    
    sources = [corridor_to_idx[from_c] for (from_c, to_c) in transition_counts.keys()]
    targets = [corridor_to_idx[to_c] for (from_c, to_c) in transition_counts.keys()]
    values = list(transition_counts.values())
    
    fig = go.Figure(go.Sankey(
        node=dict(label=unique_corridors),
        link=dict(source=sources, target=targets, value=values)
    ))
    
    fig.update_layout(title="Corridor Flow Diagram")
    fig.show()
```

---

## 🧮 **Causality Analysis**

### Event Chain Extraction

Reconstruct causal event chain:

```python
def extract_event_chain(pixels: List[TokenPixel], event_lattice: EventLattice) -> List[Event]:
    """Extract full causal event chain from trajectory."""
    event_refs = [p.eventDelta for p in pixels]
    events = []
    
    for ref in event_refs:
        event = event_lattice.get_event(ref)
        if event not in events:
            events.append(event)
    
    return events

def find_causal_path(event_a: str, event_b: str, pixels: List[TokenPixel]) -> List[TokenPixel]:
    """Find sequence of pixels between two events."""
    start_idx = None
    end_idx = None
    
    for i, pixel in enumerate(pixels):
        if pixel.eventDelta == event_a:
            start_idx = i
        if pixel.eventDelta == event_b:
            end_idx = i
            break
    
    if start_idx is None or end_idx is None:
        return []
    
    return pixels[start_idx:end_idx + 1]
```

---

## ✅ **Replay Court Guarantees**

### Determinism

Same token pixel sequence → same reconstructed trajectory.

### Completeness

All agent states reconstructable from pixels.

### Fidelity

Interpolated states bounded by checkpoint precision.

### Verifiability

Hash chain provides cryptographic proof of authenticity.

### Efficiency

O(log n) access via Merkle tree for large sequences.

---

## 📚 **References**

- **Token Pixel Schema**: See `TOKEN_PIXEL_SCHEMA_V1.md`
- **Checkpointing Ritual**: See `CHECKPOINTING_RITUAL.md`
- **Voxel Mapping**: See `VOXEL_TENSOR_MAPPING.md`

---

**Decoder Authority**: Replay Court Committee  
**Maintainer**: Agentic CI/CD Working Group  
**License**: Corridor-Grade Invariant License v1.0
