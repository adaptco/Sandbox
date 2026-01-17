# Token Pixel Checkpoint System

## Overview

The **Token Pixel Checkpoint System** is an agentic CI/CD component that captures state space snapshots and serializes them into token-based representations consumable by language models operating as atomic agents on the edge.

## Architecture

### State Space Atomization

The system breaks down application state into atomic units called "state atoms":

```
State Space → State Atoms → Token Pixels → LLM Consumable Format
```

### Components

#### 1. **State Inventory** (`.checkpoint/metadata/state_inventory.json`)

- Tracks all state variables across the codebase
- Records commit metadata and timestamps
- Provides state variable count and file analysis

#### 2. **Token Pixels** (`.checkpoint/token_pixels/`)

- `state_tokens.jsonl`: JSONL format of atomic state representations
- `pixel_grid.json`: Visual grid representation of state space
- Contains state transitions and atomic operation definitions

#### 3. **Request Queue** (`.checkpoint/request_queue/`)

- Linearizes asynchronous requests for mixture processing
- Defines atomic operations and priority levels
- Specifies reaction mixtures for different checkpoint types

#### 4. **Edge Agent** (`.checkpoint/edge_agent/`)

- `atomic_agent.json`: Agent specification and configuration
- `checkpoint_agent.js`: Executable agent for state capture
- Optimized for edge deployment with minimal footprint

## Token Pixel Format

### State Atom Structure

```json
{
  "type": "state_atom",
  "id": "<unique_identifier>",
  "properties": {
    "<property_name>": "<type>"
  },
  "timestamp": "<iso_timestamp>"
}
```

### Pixel Grid Representation

The pixel grid maps state space to a 2D coordinate system:

```json
{
  "state_space_grid": {
    "dimensions": {"width": 800, "height": 500},
    "pixel_states": {
      "<region_name>": {
        "x": 0, "y": 0,
        "w": 100, "h": 100,
        "state": "<current_state>"
      }
    }
  }
}
```

## Linearization Strategy

### Asynchronous Request Linearization

The system converts asynchronous state capture requests into a linear sequence:

```
req_001 (priority: 1, atomic: true)
  ↓
req_002 (priority: 1, atomic: true)
  ↓
req_003 (priority: 2, atomic: true)
  ↓
req_004 (priority: 3, atomic: true)
```

### Atomic Guarantees

Each request is processed with ACID properties:

- **Atomicity**: All-or-nothing execution
- **Consistency**: Sequential consistency model
- **Isolation**: Snapshot isolation level
- **Durability**: Persistent checkpoint storage

## Edge Agent Deployment

### Agent Configuration

```json
{
  "agent_type": "atomic_state_checkpoint",
  "architecture": "edge_optimized",
  "token_pixel_config": {
    "max_tokens_per_snapshot": 4096,
    "embedding_dimension": 768
  }
}
```

### Usage

```javascript
const CheckpointAgent = require('./edge_agent/checkpoint_agent.js');

const agent = new CheckpointAgent({
  version: '1.0.0',
  agent_type: 'atomic_state_checkpoint'
});

// Extract and checkpoint application state
const appState = {
  player: { x: 100, y: 400, velocityY: 0, jumping: false },
  obstacles: [],
  eggs: [],
  particles: [],
  game: { score: 0, lives: 3, level: 1 }
};

const checkpoint = agent.generateCheckpoint(appState);
const serialized = agent.serialize(checkpoint);

// Linearize async requests
const requests = [
  { id: 'req_001', atomic: true, /* ... */ },
  { id: 'req_002', atomic: true, /* ... */ }
];

const results = await agent.linearizeRequests(requests);
```

## CI/CD Integration

### Trigger Checkpoint Snapshot

The checkpoint system runs automatically on:

- Push to `main` or `develop` branches
- Manual workflow dispatch

### Manual Trigger

From GitHub Actions:

1. Go to Actions → Checkpoint State Snapshot
2. Click "Run workflow"
3. Select snapshot type: `full`, `incremental`, or `token_pixel`

### Artifacts

Each checkpoint generates:

- `checkpoint_<timestamp>.tar.gz`: Compressed snapshot archive
- `checkpoint_manifest.json`: Snapshot metadata and component paths
- `.checkpoint/`: Complete checkpoint directory structure

Artifacts are retained for 30 days and can be downloaded from the workflow run.

## Reaction Mixtures

The system defines mixtures for different checkpoint operations:

### Snapshot Generation Mixture

```json
"snapshot_generation": ["req_001", "req_002", "req_003"]
```

Combines state capture requests for player, physics, and entities.

### Checkpoint Persistence Mixture

```json
"checkpoint_persistence": ["req_004"]
```

Handles writing checkpoint to persistent storage.

### Edge Deployment Mixture

```json
"edge_deployment": ["req_001", "req_002", "req_003", "req_004"]
```

Full pipeline for edge agent deployment.

## Token Representation for LLMs

### Tokenization Strategy

State is converted to tokens using a structured approach:

1. **Serialize** state to JSON
2. **Tokenize** JSON string into lexical units
3. **Classify** tokens by type (number, identifier, structure, operator)
4. **Embed** tokens into vector space (768-dimensional)

### Token Limits

- Maximum tokens per snapshot: **4,096**
- Embedding dimension: **768**
- Format: **JSONL** for streaming consumption

### Example Token Stream

```jsonl
{"pos":0,"token":"player","type":"identifier"}
{"pos":1,"token":":","type":"operator"}
{"pos":2,"token":"{","type":"structure"}
{"pos":3,"token":"x","type":"identifier"}
{"pos":4,"token":":","type":"operator"}
{"pos":5,"token":"100","type":"number"}
```

## State Transitions

The system tracks all possible state transitions:

```
idle → jumping (trigger: space_key)
jumping → falling (trigger: apex_reached)
falling → idle (trigger: ground_collision)
playing → gameOver (trigger: lives_depleted)
```

## Edge Optimization

### Memory Footprint

- **Minimal**: Optimized for constrained edge devices
- **Incremental**: Delta compression for updates

### CPU Usage

- **Low Priority**: Background processing
- **Async**: Non-blocking operations

### Network Bandwidth

- **Compressed Stream**: Token-based compression
- **Batch Mode**: Aggregated checkpoints

### Storage Format

- **Incremental Delta**: Only changes stored
- **Binary Token Stream**: Compact representation

## Monitoring

Each checkpoint provides metrics:

- State variable count
- Files analyzed
- Token count
- Checkpoint size
- Processing time

## Best Practices

1. **Regular Snapshots**: Run checkpoints on every significant state change
2. **Atomic Operations**: Ensure all state captures are atomic
3. **Edge Testing**: Validate agent on target edge environment
4. **Token Budget**: Stay within 4K token limit for LLM processing
5. **Version Control**: Track checkpoint manifests in git

## Future Enhancements

- [ ] Delta compression between checkpoints
- [ ] Distributed checkpoint aggregation
- [ ] Real-time state streaming
- [ ] Multi-agent coordination
- [ ] Checkpoint replay and time-travel debugging
- [ ] Automatic anomaly detection in state space

## License

This checkpoint system is part of the Jurassic Pixels project and follows the same licensing terms.
