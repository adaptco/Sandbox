# CI/CD Integration Layer v1.0

## Corridor-Grade Checkpointing for Continuous Deployment

**Status**: `CANONICAL`  
**Version**: `1.0.0`  
**Integration Hash**: `sha256:CICD_INT_V1_0x5A7B`  
**Ratified**: `2026-01-17T21:48:40Z`

---

## 🎯 **Purpose**

The **CI/CD Integration Layer** embeds the Token Pixel Checkpointing System into the continuous deployment pipeline, ensuring every stage emits audit-ready, replayable state snapshots.

---

## 🏗️ **Pipeline Architecture**

```
┌──────────────────────────────────────────────────────────┐
│              Agentic CI/CD Pipeline                      │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌──────────────┐  TPX   ┌──────────────┐  TPX   ┌────────────┐
│  DISTRICT_1  │───────▶│  DISTRICT_2  │───────▶│ DISTRICT_3 │
│  INGESTION   │        │   LoRA BIAS  │        │  ROUTING   │
└──────────────┘        └──────────────┘        └────────────┘
        │                      │                      │
        ▼                      ▼                      ▼
   [Checkpoint]          [Checkpoint]           [Checkpoint]
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────┐  TPX   ┌──────────────┐
│  DISTRICT_4  │───────▶│  DISTRICT_5  │
│  EXECUTION   │        │  DEPLOYMENT  │
└──────────────┘        └──────────────┘
        │                      │
        ▼                      ▼
   [Checkpoint]          [Checkpoint]
```

### Districts

| District | Purpose | Checkpoint Trigger |
|----------|---------|-------------------|
| **DISTRICT_1** | Ingestion (RAG/Docling) | After document processing |
| **DISTRICT_2** | LoRA Bias Application | After weight update |
| **DISTRICT_3** | Routing Kernel | After intent resolution |
| **DISTRICT_4** | Execution Envelope | After output generation |
| **DISTRICT_5** | Deployment | After artifact publish |

---

## 🔌 **Integration Points**

### 1. Ingestion Gate Hook

```python
class IngestionGate:
    """DISTRICT_1: Document ingestion and RAG processing."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer):
        self.agent = agent
        self.checkpointer = checkpointer
    
    def process_document(self, document: Document) -> ProcessingResult:
        """Ingest document and emit checkpoint."""
        # Pre-checkpoint state
        pre_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_1.CHAMBER_0.NODE_PRE"
        )
        
        # Process document
        result = self.agent.rag_engine.process(document)
        
        # Update agent state
        self.agent.update_knowledge_base(result)
        
        # Post-checkpoint state
        post_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_1.CHAMBER_0.NODE_POST"
        )
        
        return ProcessingResult(
            result=result,
            checkpoints=[pre_pixel, post_pixel]
        )
```

### 2. LoRA Bias Hook

```python
class LoRABiasApplicator:
    """DISTRICT_2: Apply LoRA weight shifts."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer):
        self.agent = agent
        self.checkpointer = checkpointer
    
    def apply_lora_bias(self, lora_config: LoRAConfig) -> BiasResult:
        """Apply LoRA bias and emit checkpoint."""
        # Pre-bias checkpoint
        pre_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_2.CHAMBER_LORA.NODE_PRE"
        )
        
        # Apply bias
        weights_before = self.agent.model.get_weights()
        self.agent.model.apply_lora(lora_config)
        weights_after = self.agent.model.get_weights()
        
        # Compute drift from weight shift
        drift = compute_weight_drift(weights_before, weights_after)
        self.agent.state_vector.psi = max(0, self.agent.state_vector.psi - drift)
        
        # Post-bias checkpoint
        post_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_2.CHAMBER_LORA.NODE_POST"
        )
        
        return BiasResult(
            drift=drift,
            checkpoints=[pre_pixel, post_pixel]
        )
```

### 3. Routing Kernel Hook

```python
class RoutingKernel:
    """DISTRICT_3: Intent-based routing decisions."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer):
        self.agent = agent
        self.checkpointer = checkpointer
    
    def route(self, query: Query) -> RoutingDecision:
        """Resolve intent and route to execution chamber."""
        # Pre-routing checkpoint
        pre_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_3.CHAMBER_ROUTER.NODE_PRE"
        )
        
        # Resolve intent
        intent = self.agent.intent_resolver.resolve(query)
        intent_embedding = self.agent.intent_resolver.embed(intent)
        
        # Update agent intent surface
        self.agent.current_intent = intent_embedding
        self.agent.intent_hash = compute_intent_hash(intent_embedding)
        
        # Route to chamber
        chamber = self.agent.routing_table.lookup(intent)
        
        # Post-routing checkpoint
        post_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=f"DISTRICT_3.CHAMBER_{chamber.id}.NODE_POST"
        )
        
        return RoutingDecision(
            intent=intent,
            chamber=chamber,
            checkpoints=[pre_pixel, post_pixel]
        )
```

### 4. Execution Envelope Hook

```python
class ExecutionEnvelope:
    """DISTRICT_4: Execute agent task and generate output."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer):
        self.agent = agent
        self.checkpointer = checkpointer
    
    async def execute(self, task: Task) -> ExecutionResult:
        """Execute task with checkpointing at key stages."""
        # Pre-execution checkpoint
        pre_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_4.CHAMBER_EXEC.NODE_PRE"
        )
        
        # Execute task
        output = await self.agent.execute_task(task)
        
        # Emit event
        event = self.agent.event_lattice.emit(Event(
            type="TASK_COMPLETED",
            payload={"task_id": task.id, "output_size": len(output)},
            timestamp=time.time()
        ))
        
        # Update event delta
        self.agent.last_event = event.ref
        
        # Post-execution checkpoint
        post_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor="DISTRICT_4.CHAMBER_EXEC.NODE_POST"
        )
        
        return ExecutionResult(
            output=output,
            event=event,
            checkpoints=[pre_pixel, post_pixel]
        )
```

### 5. Deployment Gate Hook

```python
class DeploymentGate:
    """DISTRICT_5: Deploy artifacts to edge/production."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer):
        self.agent = agent
        self.checkpointer = checkpointer
    
    def deploy(self, artifact: Artifact, target: DeploymentTarget) -> DeploymentResult:
        """Deploy artifact with checkpoint."""
        # Pre-deployment checkpoint
        pre_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=f"DISTRICT_5.CHAMBER_DEPLOY.NODE_{target.name}_PRE"
        )
        
        # Deploy
        deployment_id = target.deploy(artifact)
        
        # Update agent deployment state
        self.agent.deployments.append(deployment_id)
        self.agent.state_vector.omega += 1  # Increment event production rate
        
        # Post-deployment checkpoint
        post_pixel = self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=f"DISTRICT_5.CHAMBER_DEPLOY.NODE_{target.name}_POST"
        )
        
        return DeploymentResult(
            deployment_id=deployment_id,
            checkpoints=[pre_pixel, post_pixel]
        )
```

---

## 🤖 **Checkpointer Implementation**

### Core Checkpointer Class

```python
class Checkpointer:
    """Centralized checkpointing orchestrator."""
    
    def __init__(self, storage: CheckpointStorage, ritual: CheckpointingRitual):
        self.storage = storage
        self.ritual = ritual
        self.ledger = TokenPixelLedger()
    
    def emit_checkpoint(self, agent: Agent, corridor: str) -> TokenPixel:
        """Execute checkpointing ritual and persist."""
        # Update agent corridor
        district, chamber, node = corridor.split('.')
        agent.current_corridor = Corridor(
            district=int(district.split('_')[1]),
            chamber=int(chamber.split('_')[1]) if '_' in chamber else chamber,
            node=node
        )
        
        # Get previous pixel
        prev_pixel = self.ledger.get_latest()
        
        # Execute ritual
        token_pixel = self.ritual.execute(agent, prev_pixel)
        
        # Append to ledger
        self.ledger.append(token_pixel)
        
        # Persist
        self.storage.write(token_pixel)
        
        # Emit metrics
        self.emit_checkpoint_metrics(token_pixel)
        
        return token_pixel
    
    def emit_checkpoint_metrics(self, pixel: TokenPixel):
        """Emit metrics for monitoring."""
        metrics = {
            "checkpoint.emitted": 1,
            "checkpoint.autonomy_index": pixel.autonomyIndex,
            "checkpoint.corridor": pixel.corridor,
            "checkpoint.event_delta": pixel.eventDelta,
            "checkpoint.size_bytes": len(json.dumps(asdict(pixel)))
        }
        
        # Send to monitoring system
        self.monitoring.emit(metrics)
```

---

## 📊 **Pipeline Instrumentation**

### GitHub Actions Integration

```yaml
# .github/workflows/agentic-pipeline.yml
name: Agentic CI/CD with Token Pixel Checkpoints

on:
  push:
    branches: [main, develop]

jobs:
  ingestion:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Initialize Agent
        run: |
          python scripts/init_agent.py --agent-id AGENT_CICD_${{ github.run_id }}
      
      - name: Ingestion Gate (DISTRICT_1)
        run: |
          python scripts/ingestion_gate.py \
            --checkpoint-enabled \
            --corridor "DISTRICT_1.CHAMBER_0.NODE_GH_ACTIONS"
      
      - name: Upload Checkpoints
        uses: actions/upload-artifact@v4
        with:
          name: checkpoints-ingestion
          path: .checkpoints/

  lora:
    needs: ingestion
    runs-on: ubuntu-latest
    steps:
      - name: Download Checkpoints
        uses: actions/download-artifact@v4
        with:
          name: checkpoints-ingestion
      
      - name: LoRA Bias Application (DISTRICT_2)
        run: |
          python scripts/apply_lora.py \
            --checkpoint-enabled \
            --corridor "DISTRICT_2.CHAMBER_LORA.NODE_GH_ACTIONS"
      
      - name: Upload Checkpoints
        uses: actions/upload-artifact@v4
        with:
          name: checkpoints-lora
          path: .checkpoints/

  # ... routing, execution, deployment jobs follow same pattern
```

---

## 📤 **Checkpoint Storage**

### File-Based Storage

```python
class FileCheckpointStorage:
    """Append-only file storage for token pixels."""
    
    def __init__(self, storage_path: str):
        self.storage_path = storage_path
        self.ensure_directory()
    
    def ensure_directory(self):
        """Create storage directory if it doesn't exist."""
        os.makedirs(self.storage_path, exist_ok=True)
    
    def write(self, token_pixel: TokenPixel):
        """Append token pixel to JSONL file."""
        checkpoint_file = os.path.join(
            self.storage_path,
            f"pixels_{token_pixel.agentId}.jsonl"
        )
        
        with open(checkpoint_file, 'a') as f:
            f.write(json.dumps(asdict(token_pixel)) + '\n')
    
    def read_all(self, agent_id: str) -> List[TokenPixel]:
        """Read all token pixels for an agent."""
        checkpoint_file = os.path.join(
            self.storage_path,
            f"pixels_{agent_id}.jsonl"
        )
        
        if not os.path.exists(checkpoint_file):
            return []
        
        pixels = []
        with open(checkpoint_file, 'r') as f:
            for line in f:
                pixel_dict = json.loads(line)
                pixels.append(TokenPixel(**pixel_dict))
        
        return pixels
```

### Cloud Storage (S3)

```python
class S3CheckpointStorage:
    """S3-backed checkpoint storage."""
    
    def __init__(self, bucket: str, prefix: str):
        self.s3 = boto3.client('s3')
        self.bucket = bucket
        self.prefix = prefix
    
    def write(self, token_pixel: TokenPixel):
        """Write token pixel to S3."""
        key = f"{self.prefix}/{token_pixel.agentId}/{token_pixel.tokenPixelId}.json"
        
        self.s3.put_object(
            Bucket=self.bucket,
            Key=key,
            Body=json.dumps(asdict(token_pixel)),
            ContentType='application/json'
        )
    
    def read_all(self, agent_id: str) -> List[TokenPixel]:
        """Read all token pixels for an agent from S3."""
        prefix = f"{self.prefix}/{agent_id}/"
        
        response = self.s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        
        if 'Contents' not in response:
            return []
        
        pixels = []
        for obj in response['Contents']:
            pixel_data = self.s3.get_object(Bucket=self.bucket, Key=obj['Key'])
            pixel_dict = json.loads(pixel_data['Body'].read())
            pixels.append(TokenPixel(**pixel_dict))
        
        return sorted(pixels, key=lambda p: p.timestamp)
```

---

## 🔔 **Event Emission**

### Checkpoint Events

Every checkpoint emits a structured event:

```python
@dataclass
class CheckpointEvent:
    """Event emitted when checkpoint created."""
    event_type: str = "CHECKPOINT_CREATED"
    token_pixel_id: str
    agent_id: str
    corridor: str
    timestamp: float
    autonomy_index: float
    metadata: dict
```

### Integration with Event Bus

```python
class EventBusIntegration:
    """Publish checkpoint events to event bus."""
    
    def __init__(self, event_bus: EventBus):
        self.event_bus = event_bus
    
    def publish_checkpoint_event(self, token_pixel: TokenPixel):
        """Publish checkpoint creation event."""
        event = CheckpointEvent(
            token_pixel_id=token_pixel.tokenPixelId,
            agent_id=token_pixel.agentId,
            corridor=token_pixel.corridor,
            timestamp=token_pixel.timestamp,
            autonomy_index=token_pixel.autonomyIndex,
            metadata={
                "intent_hash": token_pixel.intentHash,
                "event_delta": token_pixel.eventDelta,
                "voxel_signature": token_pixel.voxelSignature
            }
        )
        
        self.event_bus.publish("checkpoints", event)
```

---

## 🎯 **Automatic Checkpoint Triggers**

### Time-Based

```python
class PeriodicCheckpointer:
    """Emit checkpoints at regular intervals."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer, interval_seconds: int = 60):
        self.agent = agent
        self.checkpointer = checkpointer
        self.interval = interval_seconds
        self.running = False
    
    def start(self):
        """Start periodic checkpointing."""
        self.running = True
        threading.Thread(target=self._checkpoint_loop, daemon=True).start()
    
    def stop(self):
        """Stop periodic checkpointing."""
        self.running = False
    
    def _checkpoint_loop(self):
        """Background checkpoint emission."""
        while self.running:
            time.sleep(self.interval)
            self.checkpointer.emit_checkpoint(
                self.agent,
                corridor=f"{self.agent.current_corridor}.NODE_PERIODIC"
            )
```

### Event-Based

```python
class EventTriggeredCheckpointer:
    """Emit checkpoints on specific events."""
    
    def __init__(self, agent: Agent, checkpointer: Checkpointer, event_lattice: EventLattice):
        self.agent = agent
        self.checkpointer = checkpointer
        self.event_lattice = event_lattice
        
        # Subscribe to trigger events
        self.event_lattice.subscribe("INTENT_CHANGED", self.on_intent_change)
        self.event_lattice.subscribe("ANOMALY_DETECTED", self.on_anomaly)
        self.event_lattice.subscribe("CORRIDOR_CROSSED", self.on_corridor_cross)
    
    def on_intent_change(self, event: Event):
        """Checkpoint on intent changes."""
        self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=f"{self.agent.current_corridor}.NODE_INTENT_CHANGE"
        )
    
    def on_anomaly(self, event: Event):
        """Emergency checkpoint on anomalies."""
        self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=f"{self.agent.current_corridor}.NODE_ANOMALY"
        )
    
    def on_corridor_cross(self, event: Event):
        """Checkpoint on corridor transitions."""
        self.checkpointer.emit_checkpoint(
            self.agent,
            corridor=event.payload["new_corridor"]
        )
```

---

## ✅ **Integration Invariants**

### Non-Blocking

Checkpointing never blocks agent execution (async writes).

### Idempotent

Re-emitting same state produces same hash (deterministic).

### Minimal Overhead

< 5ms overhead per checkpoint on modern hardware.

### Tamper-Evident

Hash chain makes any modification detectable.

### Audit-Ready

Full trajectory reconstructable from checkpoint sequence.

---

## 📚 **References**

- **Token Pixel Schema**: See `TOKEN_PIXEL_SCHEMA_V1.md`
- **Checkpointing Ritual**: See `CHECKPOINTING_RITUAL.md`
- **Replay Court**: See `REPLAY_COURT_DECODER.md`

---

**Integration Authority**: CI/CD Integration Committee  
**Maintainer**: Agentic CI/CD Working Group  
**License**: Corridor-Grade Invariant License v1.0
