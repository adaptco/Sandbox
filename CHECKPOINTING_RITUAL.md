# Checkpointing Ritual v1.0

## Canonicalization → Parity → Seal → Publish

**Status**: `CANONICAL`  
**Version**: `1.0.0`  
**Ritual Hash**: `sha256:RITUAL_V1_0x3F8D`  
**Ratified**: `2026-01-17T21:48:40Z`

---

## 🎯 **Purpose**

The **Checkpointing Ritual** is a formalized, deterministic procedure for emitting Token Pixel snapshots. It ensures:

- **Reproducibility**: Same agent state → same token pixel
- **Auditability**: Every step logged and attributable
- **Integrity**: Cryptographic proof of correctness
- **Completeness**: No state information lost

The ritual transforms an agent's volatile runtime state into a **corridor-grade invariant** suitable for:

- Replay Court analysis
- Edge deployment
- Audit compliance
- Byzantine fault tolerance

---

## 🔄 **The Four Phases**

```
AGENT STATE
    ↓
[1] CANONICALIZATION   ─→  Normalized state representation
    ↓
[2] PARITY CHECK       ─→  Integrity validation
    ↓
[3] SEAL               ─→  Cryptographic commitment
    ↓
[4] PUBLISH            ─→  Append to ledger
    ↓
TOKEN PIXEL (immutable)
```

---

## 📐 **Phase 1: CANONICALIZATION**

**Objective**: Transform agent's current state into canonical form.

### Steps

#### 1.1 Capture State Vector

```python
def capture_state_vector(agent) -> StateVector:
    """Extract phase-space coordinates from agent."""
    phi = compute_corridor_phase(agent)      # [0, 2π]
    psi = compute_intent_alignment(agent)    # [0, 1]
    omega = compute_angular_velocity(agent)  # [0, ∞)
    tau = agent.corridor_time                # ℝ
    
    return StateVector(phi, psi, omega, tau)
```

#### 1.2 Normalize Intent Embedding

```python
def normalize_intent(agent) -> np.ndarray:
    """Normalize and quantize intent vector."""
    intent = agent.current_intent
    normalized = intent / np.linalg.norm(intent)
    quantized = np.round(normalized, decimals=8)
    return quantized
```

#### 1.3 Resolve Corridor Position

```python
def resolve_corridor(agent) -> str:
    """Determine hierarchical corridor address."""
    district = agent.current_district.id
    chamber = agent.current_chamber.id
    node = agent.current_node.id
    return f"DISTRICT_{district}.CHAMBER_{chamber}.NODE_{node}"
```

#### 1.4 Extract Event Delta

```python
def extract_event_delta(agent) -> str:
    """Get reference to last committed event."""
    last_event = agent.event_lattice.get_latest()
    event_hash = compute_hash(last_event)
    return f"EVENT_0x{event_hash[:4].upper()}"
```

#### 1.5 Compute Autonomy Drift

```python
def compute_autonomy_drift(agent) -> float:
    """Measure deviation from expected behavior."""
    s_actual = agent.state_vector
    s_expected = agent.program_spec.predict_state(agent.corridor_time)
    drift = np.linalg.norm(s_actual - s_expected) / np.linalg.norm(s_expected)
    return min(drift, 1.0)  # Clamp to [0, 1]
```

#### 1.6 Generate Voxel Signature

```python
def generate_voxel_signature(agent) -> str:
    """Encode local manifold neighborhood."""
    voxel_cube = agent.manifold.sample_neighborhood_3x3x3()
    occupancy = voxel_cube.to_bit_vector()
    voxel_hash = sha256(occupancy).hexdigest()
    return f"VXL_0x{voxel_hash[:4].upper()}"
```

### Output

A **Canonical State Tuple**:

```python
canonical_state = CanonicalState(
    state_vector=state_vector,
    corridor=corridor_pos,
    intent_hash=sha256(normalized_intent),
    event_delta=event_ref,
    autonomy_index=drift,
    voxel_signature=voxel_sig
)
```

---

## ✓ **Phase 2: PARITY CHECK**

**Objective**: Validate integrity and consistency of canonical state.

### Parity Rules

#### Rule P1: State Vector Bounds

```python
assert 0 <= canonical_state.state_vector.phi <= 2 * np.pi
assert 0 <= canonical_state.state_vector.psi <= 1
assert canonical_state.state_vector.omega >= 0
```

#### Rule P2: Corridor Path Exists

```python
assert agent.corridor_graph.path_exists(canonical_state.corridor)
```

#### Rule P3: Intent Hash Valid

```python
assert canonical_state.intent_hash.startswith("sha256:")
assert len(canonical_state.intent_hash) == 71  # "sha256:" + 64 hex chars
```

#### Rule P4: Event Delta References Valid Event

```python
assert agent.event_lattice.contains(canonical_state.event_delta)
```

#### Rule P5: Autonomy Index in Range

```python
assert 0 <= canonical_state.autonomy_index <= 1
```

#### Rule P6: Voxel Signature Format

```python
assert canonical_state.voxel_signature.startswith("VXL_0x")
```

#### Rule P7: Temporal Consistency

```python
if prev_token_pixel is not None:
    assert canonical_state.state_vector.tau > prev_token_pixel.state_vector.tau
```

### Parity Check Outcome

```python
def verify_parity(canonical_state, prev_token_pixel=None) -> ParityResult:
    """Run all parity checks."""
    checks = [
        verify_p1_bounds(canonical_state),
        verify_p2_corridor(canonical_state),
        verify_p3_intent(canonical_state),
        verify_p4_event(canonical_state),
        verify_p5_autonomy(canonical_state),
        verify_p6_voxel(canonical_state),
        verify_p7_temporal(canonical_state, prev_token_pixel)
    ]
    
    return ParityResult(
        passed=all(checks),
        checks=checks,
        timestamp=time.time()
    )
```

**If parity fails**: Ritual **ABORTS**. Agent enters **QUARANTINE** state.

---

## 🔐 **Phase 3: SEAL**

**Objective**: Create cryptographic commitment with hash chain linkage.

### Steps

#### 3.1 Generate Token Pixel ID

```python
def generate_token_pixel_id() -> str:
    """Create unique identifier for this pixel."""
    random_bytes = os.urandom(4)
    pixel_id = f"TPX_0x{random_bytes.hex().upper()}"
    return pixel_id
```

#### 3.2 Retrieve Previous Hash

```python
def get_previous_hash(agent) -> str:
    """Get hash of last token pixel (or genesis hash)."""
    prev_pixel = agent.token_pixel_ledger.get_latest()
    if prev_pixel is None:
        return "sha256:" + "0" * 64  # Genesis hash
    return prev_pixel.hash
```

#### 3.3 Construct Token Pixel

```python
token_pixel = TokenPixel(
    tokenPixelId=pixel_id,
    timestamp=int(time.time()),
    agentId=agent.id,
    corridor=canonical_state.corridor,
    stateVector=canonical_state.state_vector,
    intentHash=canonical_state.intent_hash,
    eventDelta=canonical_state.event_delta,
    autonomyIndex=canonical_state.autonomy_index,
    voxelSignature=canonical_state.voxel_signature,
    prevHash=prev_hash
)
```

#### 3.4 Compute Hash

```python
def compute_token_pixel_hash(token_pixel: TokenPixel) -> str:
    """Cryptographically seal the token pixel."""
    serialized = json.dumps({
        "tokenPixelId": token_pixel.tokenPixelId,
        "timestamp": token_pixel.timestamp,
        "agentId": token_pixel.agentId,
        "corridor": token_pixel.corridor,
        "stateVector": asdict(token_pixel.stateVector),
        "intentHash": token_pixel.intentHash,
        "eventDelta": token_pixel.eventDelta,
        "autonomyIndex": token_pixel.autonomyIndex,
        "voxelSignature": token_pixel.voxelSignature,
        "prevHash": token_pixel.prevHash
    }, sort_keys=True, separators=(',', ':'))
    
    hash_digest = hashlib.sha256(serialized.encode('utf-8')).hexdigest()
    return f"sha256:{hash_digest}"
```

#### 3.5 Seal Token Pixel

```python
token_pixel.hash = compute_token_pixel_hash(token_pixel)
```

### Output

A **Sealed Token Pixel** with cryptographic commitment.

---

## 📤 **Phase 4: PUBLISH**

**Objective**: Append sealed token pixel to immutable ledger.

### Steps

#### 4.1 Append to Local Ledger

```python
agent.token_pixel_ledger.append(token_pixel)
```

#### 4.2 Write to Persistent Storage

```python
def persist_token_pixel(token_pixel: TokenPixel, storage_path: str):
    """Write to append-only file."""
    with open(storage_path, 'a') as f:
        f.write(json.dumps(asdict(token_pixel)) + '\n')
```

#### 4.3 Broadcast to Network (Optional)

```python
if agent.config.broadcast_enabled:
    agent.network.broadcast_token_pixel(token_pixel)
```

#### 4.4 Emit Checkpoint Event

```python
agent.event_lattice.emit(Event(
    type="CHECKPOINT_PUBLISHED",
    payload={
        "tokenPixelId": token_pixel.tokenPixelId,
        "hash": token_pixel.hash
    },
    timestamp=time.time()
))
```

#### 4.5 Update Agent Metadata

```python
agent.last_checkpoint_time = token_pixel.timestamp
agent.last_checkpoint_hash = token_pixel.hash
agent.checkpoint_count += 1
```

### Output

Token pixel is now **immutable, public, and auditable**.

---

## 🔁 **Complete Ritual Flow**

```python
def checkpointing_ritual(agent: Agent, prev_token_pixel: Optional[TokenPixel] = None) -> TokenPixel:
    """Execute the full checkpointing ritual."""
    
    # PHASE 1: CANONICALIZATION
    canonical_state = canonicalize_agent_state(agent)
    
    # PHASE 2: PARITY CHECK
    parity_result = verify_parity(canonical_state, prev_token_pixel)
    if not parity_result.passed:
        agent.enter_quarantine()
        raise ParityCheckFailure(parity_result)
    
    # PHASE 3: SEAL
    token_pixel = seal_token_pixel(canonical_state, agent, prev_token_pixel)
    
    # PHASE 4: PUBLISH
    publish_token_pixel(token_pixel, agent)
    
    return token_pixel
```

---

## 📊 **Ritual Metrics**

Each ritual execution emits metrics:

```python
@dataclass
class RitualMetrics:
    ritual_id: str
    agent_id: str
    phase_durations: Dict[str, float]  # ms per phase
    parity_checks_passed: int
    parity_checks_failed: int
    token_pixel_size_bytes: int
    hash_computation_time_ms: float
    total_duration_ms: float
    timestamp: float
```

---

## ⚠️ **Failure Modes**

| Failure | Phase | Action |
|---------|-------|--------|
| Invalid state vector | 1 | ABORT, log error |
| Corridor unreachable | 1 | ABORT, log error |
| Parity check failed | 2 | QUARANTINE, escalate |
| Hash collision | 3 | Regenerate ID, retry |
| Storage write failed | 4 | Queue retry, alert |

---

## 🎯 **Invocation Points**

The ritual is invoked at corridor crossing points:

1. **Ingestion Gate**: After RAG/Docling update
2. **LoRA Bias Application**: After weight shift
3. **Routing Kernel Decision**: After intent surface change
4. **Execution Envelope**: After agent produces output
5. **Corridor Crossing**: On district/chamber/node transition
6. **Emergency Halt**: On anomaly detection
7. **Scheduled Checkpoint**: Every N seconds (configurable)

---

## ✅ **Ritual Invariants**

### Reproducibility

Same agent state → same canonical state → same token pixel (except ID & timestamp).

### Auditability

Every ritual execution logged with full metrics.

### Integrity

Parity checks ensure consistency.

### Immutability

Published token pixels cannot be modified.

### Progress

Each token pixel advances `tau` monotonically.

---

## 🔐 **Security Properties**

### Tamper-Evident

Hash chain breaks if any pixel modified.

### Non-Repudiation

Agent cannot deny emitting a signed pixel.

### Replay Protection

Timestamp and hash chain prevent replay attacks.

### Byzantine Tolerance

Parity checks detect malicious state corruption.

---

## 📚 **References**

- **Token Pixel Schema**: See `TOKEN_PIXEL_SCHEMA_V1.md`
- **Corridor Architecture**: See `CHECKPOINT_SYSTEM.md`
- **Event Lattice**: See `EVENT_LATTICE_SPEC.md`

---

**Ritual Authority**: Checkpointing Ritual Committee  
**Maintainer**: Agentic CI/CD Working Group  
**License**: Corridor-Grade Invariant License v1.0
