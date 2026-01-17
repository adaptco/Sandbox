# Token Pixel Schema v1.0

## Formal Specification for Audit-Ready, Replayable, Edge-Deployable State Snapshots

**Status**: `CANONICAL`
**Version**: `1.0.0`
**Schema Hash**: `sha256:TPX_SCHEMA_V1_0x1A2F`
**Ratified**: `2026-01-17T21:48:40Z`

---

## 🧩 **Definition**

A **Token Pixel** is a minimal, lossless, hash-anchored representation of an agent's eigenstate within the CI/CD corridor. It is the atomic "frame" in the 4D manifold tail — a single, deterministic sample of the agent's phase-space trajectory.

### Mathematical Formulation

```text
TokenPixel_t = (S_t, C_t, I_t, E_t, A_t, V_t, H_t)

where:
  S_t ∈ ℝ⁴  : State Vector [φ, ψ, ω, τ]
  C_t ∈ G   : Corridor Position (district.chamber.node)
  I_t ∈ H   : Intent Surface (hashed embedding)
  E_t ∈ L   : Event Delta (lattice reference)
  A_t ∈ [0,1]: Autonomy Drift Index
  V_t ∈ V   : Voxel Signature (manifold neighborhood)
  H_t ∈ H   : Hash Chain (prev_hash → current_hash)
```

---

## 📐 **Core Components**

### 1. State Vector (φ, ψ, ω, τ)

The agent's current tensor state in phase-space coordinates:

| Component | Domain | Semantic | Canonical Range |
| ----------- | -------- | ---------- | ----------------- |
| **φ** (phi) | [0, 2π] | Corridor phase angle | Cyclic, modulo 2π |
| **ψ** (psi) | [0, 1] | Intent alignment | 0=misaligned, 1=perfect |
| **ω** (omega) | [0, ∞) | Angular velocity | Event production rate |
| **τ** (tau) | ℝ | Time parameter | Corridor-local time |

**Serialization**:

```json
"stateVector": {
  "phi": 0.442,
  "psi": 0.118,
  "omega": 0.993,
  "tau": 0.221
}
```

**Invariants**:

- `φ mod 2π` must be preserved across corridors
- `ψ ∈ [0, 1]` enforced by normalization
- `ω ≥ 0` monotonically increasing within chamber
- `τ` is corridor-local, hash-anchored to wall-clock time

---

### 2. Corridor Position

A hierarchical address in the pipeline graph:

```text
DISTRICT → CHAMBER → NODE
```

**Format**: `DISTRICT_N.CHAMBER_M.NODE_K`

**Example**: `DISTRICT_3.CHAMBER_12.NODE_7`

**Semantics**:

- **DISTRICT**: Major phase of CI/CD (Ingestion, LoRA, Routing, Execution, Deployment)
- **CHAMBER**: Sub-phase or decision boundary
- **NODE**: Atomic execution unit (function call, API request, model inference)

**Serialization**:

```json
"corridor": "DISTRICT_3.CHAMBER_12.NODE_7"
```

**Graph Topology**:

- Districts form a DAG (Directed Acyclic Graph)
- Chambers are chambers within districts
- Nodes are terminal execution points

---

### 3. Intent Surface

A normalized, hashed representation of the agent's active intent embedding.

**Construction**:

1. Extract intent vector `i ∈ ℝⁿ` from agent's current goal
 2. Normalize: `î = i / |  | i |  | ₂`
3. Quantize to fixed precision (8 decimal places)
4. Hash: `H(î) = sha256(serialize(î))`

**Serialization**:

```json
"intentHash": "sha256:9f2c8d4a7b1e6f3c2a5d8e1b4f7a9c2e5d8a1b4f"
```

**Properties**:

- **Deterministic**: Same intent → same hash
- **Collision-resistant**: Different intents → different hashes
- **Privacy-preserving**: Hash reveals no intent details
- **Compact**: 32 bytes regardless of embedding dimension

---

### 4. Event Delta

Reference to the last committed event in the AgentEvents lattice.

**Format**: `EVENT_0xHHHH` where `HHHH` is the event's hash prefix

**Lattice Structure**:

```text
EventLattice := {E₁, E₂, ..., Eₙ}
  where E_i = (timestamp, agent_id, event_type, payload, hash)
```

**Serialization**:

```json
"eventDelta": "EVENT_0x7F4A"
```

**Semantics**:

- Points to the most recent event that modified agent state
- Forms a Merkle-tree lineage for full event history
- Enables delta-compression between token pixels

---

### 5. Autonomy Drift Index

A scalar `A ∈ [0, 1]` measuring deviation from programmed behavior.

**Definition**:

```text
 A = |  | s_actual - s_expected |  | ₂ / |  | s_expected |  | ₂
```

Where:

- `s_actual`: Observed state vector
- `s_expected`: Predicted state from program specification

**Interpretation**:

| Range | Classification | Action |
| ------- | ---------------- | -------- |
| [0, 0.1] | **Nominal** | Continue |
| (0.1, 0.3] | **Deviation** | Log warning |
| (0.3, 0.7] | **Drift** | Trigger review |
| (0.7, 1.0] | **Critical** | Emergency halt |

**Serialization**:

```json
"autonomyIndex": 0.14
```

---

### 6. Voxel Signature

A compact representation of the agent's local manifold neighborhood.

**Construction**:

1. Sample 27 voxels around agent (3×3×3 cube in state space)
2. Encode occupancy as bit vector
3. Hash to fixed-size signature

**Format**: `VXL_0xHHHH` where `HHHH` is voxel hash prefix

**Serialization**:

```json
"voxelSignature": "VXL_0x44B1"
```

**Topology**:

- Center voxel = agent's current position
- 26 neighbors encode local geometry
- Captures manifold curvature and obstacles
- Enables collision prediction and pathfinding

---

### 7. Hash Chain

Cryptographic linkage forming an append-only, tamper-evident ledger.

**Construction**:

```text
H_t = sha256(concat(
  tokenPixelId,
  timestamp,
  agentId,
  corridor,
  stateVector,
  intentHash,
  eventDelta,
  autonomyIndex,
  voxelSignature,
  prevHash
))
```

**Serialization**:

```json
"prevHash": "sha256:8b2d4f1a9c3e7d5b2f8a1c4e7d9b3f6a2e5d8c1b",
"hash": "sha256:1c9a5e2d8b4f7c3a6e9d1b5f8a2c4e7d9b1f3a6c"
```

**Properties**:

- **Append-only**: Cannot modify past pixels without breaking chain
- **Tamper-evident**: Any alteration invalidates all subsequent hashes
- **Merkle-compatible**: Can construct Merkle trees for fast validation
- **Replay-ready**: Full trajectory reconstructable from hash chain

---

## 📋 **Full Schema**

### JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": [
    "tokenPixelId",
    "timestamp",
    "agentId",
    "corridor",
    "stateVector",
    "intentHash",
    "eventDelta",
    "autonomyIndex",
    "voxelSignature",
    "prevHash",
    "hash"
  ],
  "properties": {
    "tokenPixelId": {
      "type": "string",
      "pattern": "^TPX_0x[0-9A-F]{4,}$",
      "description": "Unique identifier for this token pixel"
    },
    "timestamp": {
      "type": "integer",
      "minimum": 0,
      "description": "Unix epoch timestamp (seconds)"
    },
    "agentId": {
      "type": "string",
      "pattern": "^AGENT_[A-Z0-9_]+$",
      "description": "Canonical agent identifier"
    },
    "corridor": {
      "type": "string",
      "pattern": "^DISTRICT_\\d+\\.CHAMBER_\\d+\\.NODE_\\d+$",
      "description": "Hierarchical corridor position"
    },
    "stateVector": {
      "type": "object",
      "required": ["phi", "psi", "omega", "tau"],
      "properties": {
        "phi": {"type": "number", "minimum": 0, "maximum": 6.283185307},
        "psi": {"type": "number", "minimum": 0, "maximum": 1},
        "omega": {"type": "number", "minimum": 0},
        "tau": {"type": "number"}
      }
    },
    "intentHash": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "SHA-256 hash of normalized intent embedding"
    },
    "eventDelta": {
      "type": "string",
      "pattern": "^EVENT_0x[0-9A-F]{4,}$",
      "description": "Reference to last committed event"
    },
    "autonomyIndex": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "description": "Autonomy drift measurement"
    },
    "voxelSignature": {
      "type": "string",
      "pattern": "^VXL_0x[0-9A-F]{4,}$",
      "description": "Voxelized manifold neighborhood"
    },
    "prevHash": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Hash of previous token pixel (chain linkage)"
    },
    "hash": {
      "type": "string",
      "pattern": "^sha256:[a-f0-9]{64}$",
      "description": "Hash of this token pixel"
    }
  }
}
```

---

## 🔐 **Canonical Example**

```json
{
  "tokenPixelId": "TPX_0xA14F",
  "timestamp": 1737140000,
  "agentId": "AGENT_QUBE_07",
  "corridor": "DISTRICT_3.CHAMBER_12.NODE_7",
  "stateVector": {
    "phi": 0.442,
    "psi": 0.118,
    "omega": 0.993,
    "tau": 0.221
  },
  "intentHash": "sha256:9f2c8d4a7b1e6f3c2a5d8e1b4f7a9c2e5d8a1b4f7a3c6e9d1b5f8a2c4e7d9b1f",
  "eventDelta": "EVENT_0x7F4A",
  "autonomyIndex": 0.14,
  "voxelSignature": "VXL_0x44B1",
  "prevHash": "sha256:8b2d4f1a9c3e7d5b2f8a1c4e7d9b3f6a2e5d8c1b4f7a3c6e9d1b5f8a2c4e7d",
  "hash": "sha256:1c9a5e2d8b4f7c3a6e9d1b5f8a2c4e7d9b1f3a6c5e8d2b4f7c9a1e3d6b8f4a"
}
```

---

## ✅ **Design Invariants**

### Immutability

Once emitted, a token pixel **CANNOT** be modified.

### Determinism

Same agent state + same corridor → same token pixel.

### Completeness

Token pixel contains **all information** needed to reconstruct agent state.

### Compactness

Typically < 1KB serialized (edge-friendly).

### Hash-Anchored

Every pixel is cryptographically linked to predecessor.

### Replay-Ready

Full agent trajectory reconstructable from pixel sequence.

### Audit-Ready

Every state transition attributable to specific event.

### Edge-Deployable

Small models can parse and act on single pixel.

---

## 🎯 **Use Cases**

### 1. State Reconstruction

Given token pixel `TPX_t`, reconstruct full agent state at time `t`.

### 2. Trajectory Replay

Given sequence `{TPX_1, TPX_2, ..., TPX_n}`, replay entire agent execution.

### 3. Anomaly Detection

Monitor `autonomyIndex` across pixels to detect drift.

### 4. Corridor Navigation

Use `corridor` field to track agent movement through pipeline.

### 5. Intent Tracing

Track `intentHash` evolution to understand goal progression.

### 6. Event Attribution

Use `eventDelta` to link state changes to causal events.

### 7. Manifold Analysis

Analyze `voxelSignature` sequence to understand state-space topology.

### 8. Audit Trail

Hash chain provides tamper-evident log of all agent states.

---

## 🔄 **Version History**

| Version | Date | Changes |
| --------- | ------ | --------- |
| 1.0.0 | 2026-01-17 | Initial canonical specification |

---

## 📚 **References**

- **Corridor Architecture**: See `CHECKPOINT_SYSTEM.md`
- **Voxel State Space**: See `VOXEL_TENSOR_MAPPING.md`
- **Checkpointing Ritual**: See `CHECKPOINTING_RITUAL.md`
- **Replay Court**: See `REPLAY_COURT_DECODER.md`

---

**Schema Authority**: Token Pixel Specification Committee
**Maintainer**: Agentic CI/CD Working Group
**License**: Corridor-Grade Invariant License v1.0
