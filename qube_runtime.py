#!/usr/bin/env python3
"""
Qube-Native Token Pixel Runtime v1.0
Codename: "Q" (The Atomic Commit Agent)

Minimal, zero-dependency edge runtime for processing token pixel streams.
Implements the Corridor-Grade Invariant System.

Status: CANONICAL
Hash: sha256:QUBE_AGENT_Q_0x7F2A
"""

import json
import math
import sys
import io
import time
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Iterator, Any
import logging
import argparse

# Configure minimal logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] Q: %(message)s')
logger = logging.getLogger("Q")

# --- Data Structures ---

@dataclass
class StateVector:
    phi: float    # Corridor phase angle [0, 2π]
    psi: float    # Intent alignment [0, 1]
    omega: float  # Angular velocity
    tau: float    # Time parameter

@dataclass
class TokenPixel:
    tokenPixelId: str
    timestamp: float
    agentId: str
    corridor: str
    stateVector: StateVector
    intentHash: str
    eventDelta: str
    autonomyIndex: float
    voxelSignature: str
    prevHash: str
    hash: str

@dataclass
class Corridor:
    district: int
    chamber: str
    node: str

@dataclass
class Decision:
    action: str
    reason: str
    params: Dict[str, Any]

@dataclass
class ActionResult:
    success: bool
    result: Optional[Any] = None
    error: Optional[str] = None

class DriftStatus:
    NOMINAL = "NOMINAL"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"

@dataclass
class QubeConfig:
    corridor_graph: Dict[str, List[str]]
    intent_database: Dict[str, str]
    action_registry: Dict[str, Any]

# --- Core Components ---

class TokenPixelDeserializer:
    """Fast, minimal token pixel parser."""
    
    @staticmethod
    def parse(line: str) -> Optional[TokenPixel]:
        """Parse JSONL line to token pixel."""
        try:
            if not line.strip():
                return None
            
            data = json.loads(line)
            
            return TokenPixel(
                tokenPixelId=data["tokenPixelId"],
                timestamp=data["timestamp"],
                agentId=data["agentId"],
                corridor=data["corridor"],
                stateVector=StateVector(**data["stateVector"]),
                intentHash=data["intentHash"],
                eventDelta=data["eventDelta"],
                autonomyIndex=data["autonomyIndex"],
                voxelSignature=data["voxelSignature"],
                prevHash=data["prevHash"],
                hash=data["hash"]
            )
        except json.JSONDecodeError:
            logger.error(f"Failed to decode JSON: {line[:50]}...")
            return None
        except KeyError as e:
            logger.error(f"Missing field in token pixel: {e}")
            return None
    
    @staticmethod
    def parse_stream(stream: io.TextIOBase) -> Iterator[TokenPixel]:
        """Stream token pixels from file."""
        for line in stream:
            pixel = TokenPixelDeserializer.parse(line.strip())
            if pixel:
                yield pixel

class StateVectorInterpreter:
    """Extract actionable information from state vector."""
    
    @staticmethod
    def get_phase_quadrant(phi: float) -> int:
        """Determine which quadrant agent is in."""
        normalized = phi % (2 * math.pi)
        return int(normalized // (math.pi / 2))
    
    @staticmethod
    def is_intent_aligned(psi: float, threshold: float = 0.5) -> bool:
        """Check if intent alignment exceeds threshold."""
        return psi >= threshold
    
    @staticmethod
    def get_activity_level(omega: float) -> str:
        """Categorize activity level."""
        if omega < 0.5:
            return "IDLE"
        elif omega < 2.0:
            return "ACTIVE"
        else:
            return "HYPERACTIVE"

class CorridorNavigator:
    """Navigate corridor graph."""
    
    def __init__(self, corridor_graph: dict):
        self.graph = corridor_graph
    
    def parse_corridor(self, corridor_str: str) -> Corridor:
        """Parse corridor string to structured form."""
        try:
            parts = corridor_str.split('.')
            district = int(parts[0].split('_')[1])
            chamber = parts[1]
            node = parts[2]
            return Corridor(district, chamber, node)
        except (IndexError, ValueError):
            return Corridor(0, "UNKNOWN", "UNKNOWN")
    
    def get_neighbors(self, corridor: Corridor) -> List[str]:
        """Get reachable corridors from current position."""
        key = f"DISTRICT_{corridor.district}.{corridor.chamber}.{corridor.node}"
        return self.graph.get(key, [])

class VoxelCollisionDetector:
    """Lightweight collision detection from voxel signatures."""
    
    def __init__(self):
        self.voxel_cache = {}
    
    def decode_voxel_signature(self, signature: str) -> int:
        """Extract bit vector from voxel signature hash."""
        if signature in self.voxel_cache:
            return self.voxel_cache[signature]
        
        # Deterministic hash-based approximation for demo/minimal runtime
        try:
            hash_val = int(signature.split('0x')[1], 16)
            bits = hash_val & 0x7FFFFFF  # Take lower 27 bits
            self.voxel_cache[signature] = bits
            return bits
        except (IndexError, ValueError):
            return 0
    
    def is_collision_ahead(self, voxel_bits: int, direction: str) -> bool:
        """Check if voxels in given direction are occupied."""
        # Map direction to bit positions in 3x3x3 cube
        direction_map = {
            "forward": [2, 5, 8, 11, 14, 17, 20, 23, 26],  # Front face
            "backward": [0, 3, 6, 9, 12, 15, 18, 21, 24],  # Back face
            "left": [0, 1, 2, 9, 10, 11, 18, 19, 20],      # Left face
            "right": [6, 7, 8, 15, 16, 17, 24, 25, 26],    # Right face
        }
        
        bits_to_check = direction_map.get(direction, [])
        
        for bit_pos in bits_to_check:
            if voxel_bits & (1 << bit_pos):
                return True
        
        return False

class IntentMatcher:
    """Match intent hashes to known patterns."""
    
    def __init__(self, intent_database: dict):
        self.database = intent_database
    
    def lookup_intent(self, intent_hash: str) -> Optional[str]:
        """Look up intent label from hash."""
        return self.database.get(intent_hash)

class AutonomyDriftMonitor:
    """Monitor and alert on autonomy drift."""
    
    def __init__(self, warning_threshold: float = 0.3, critical_threshold: float = 0.7):
        self.warning_threshold = warning_threshold
        self.critical_threshold = critical_threshold
        self.drift_history = []
    
    def check_drift(self, autonomy_index: float) -> str:
        """Evaluate current drift level."""
        self.drift_history.append(autonomy_index)
        # Keep history manageable
        if len(self.drift_history) > 100:
            self.drift_history.pop(0)
            
        if autonomy_index >= self.critical_threshold:
            return DriftStatus.CRITICAL
        elif autonomy_index >= self.warning_threshold:
            return DriftStatus.WARNING
        else:
            return DriftStatus.NOMINAL

class ActionExecutor:
    """Execute decisions based on token pixel interpretation."""
    
    def __init__(self, action_registry: dict):
        self.registry = action_registry
    
    def execute(self, action_name: str, params: dict) -> ActionResult:
        """Execute registered action."""
        if action_name not in self.registry:
            logger.warning(f"Unknown action requested: {action_name}")
            return ActionResult(success=False, error=f"Unknown action: {action_name}")
        
        action_func = self.registry[action_name]
        
        try:
            if callable(action_func):
                result = action_func(**params)
                return ActionResult(success=True, result=result)
            return ActionResult(success=True, result=action_func)
        except Exception as e:
            logger.error(f"Action execution failed: {e}")
            return ActionResult(success=False, error=str(e))

# --- Q Agent Runtime ---

class QubeRuntime:
    """Minimal token pixel agent runtime (Agent Q)."""
    
    def __init__(self, config: QubeConfig):
        self.config = config
        self.deserializer = TokenPixelDeserializer()
        self.interpreter = StateVectorInterpreter()
        self.navigator = CorridorNavigator(config.corridor_graph)
        self.collision_detector = VoxelCollisionDetector()
        self.intent_matcher = IntentMatcher(config.intent_database)
        self.drift_monitor = AutonomyDriftMonitor()
        self.executor = ActionExecutor(config.action_registry)
        self.decision_log = []
        
        logger.info("Agent Q initialized and online.")
    
    def process_pixel(self, pixel: TokenPixel) -> Decision:
        """Process single token pixel and make decision."""
        # 1. Extract corridor
        corridor = self.navigator.parse_corridor(pixel.corridor)
        
        # 2. Interpret state vector
        quadrant = self.interpreter.get_phase_quadrant(pixel.stateVector.phi)
        aligned = self.interpreter.is_intent_aligned(pixel.stateVector.psi)
        activity = self.interpreter.get_activity_level(pixel.stateVector.omega)
        
        # 3. Check drift
        drift_status = self.drift_monitor.check_drift(pixel.autonomyIndex)
        
        # 4. Decode voxels
        voxel_bits = self.collision_detector.decode_voxel_signature(pixel.voxelSignature)
        collision_ahead = self.collision_detector.is_collision_ahead(voxel_bits, "forward")
        
        # 5. Match intent
        intent_label = self.intent_matcher.lookup_intent(pixel.intentHash)
        
        # 6. Make decision
        decision = self.decide(
            corridor=corridor,
            quadrant=quadrant,
            aligned=aligned,
            activity=activity,
            drift_status=drift_status,
            collision_ahead=collision_ahead,
            intent_label=intent_label,
            pixel=pixel
        )
        
        # 7. Log decision
        self.decision_log.append({
            "pixel_id": pixel.tokenPixelId,
            "decision": asdict(decision),
            "timestamp": pixel.timestamp
        })
        
        return decision
    
    def decide(self, **context) -> Decision:
        """Decision logic for Agent Q."""
        # Critical drift → halt
        if context["drift_status"] == DriftStatus.CRITICAL:
            return Decision(
                action="HALT",
                reason="Critical autonomy drift detected",
                params={}
            )
        
        # Collision ahead → avoid
        if context["collision_ahead"]:
            return Decision(
                action="AVOID_OBSTACLE",
                reason="Collision detected in voxel neighborhood",
                params={"direction": "left"}
            )
        
        # Intent not aligned → realign
        if not context["aligned"]:
            return Decision(
                action="REALIGN_INTENT",
                reason="Intent alignment below threshold",
                params={"target_psi": 0.8}
            )
        
        # Explicit intent override from pixel
        if context["intent_label"] == "EXECUTE_URGENT":
            return Decision(
                action="EXECUTE_IMMEDIATE",
                reason="Urgent intent detected",
                params={}
            )
            
        # Default: continue with standard operation
        return Decision(
            action="CONTINUE",
            reason="Nominal operation",
            params={}
        )
    
    def execute_decision(self, decision: Decision) -> ActionResult:
        """Execute the decided action."""
        logger.info(f"Executing: {decision.action} ({decision.reason})")
        return self.executor.execute(decision.action, decision.params)

# --- Default Configuration for "Q" ---

def get_default_config() -> QubeConfig:
    """Generate default configuration for Agent Q."""
    
    # Simple predefined corridor graph
    corridor_graph = {
        "DISTRICT_1.CHAMBER_0.NODE_START": ["DISTRICT_1.CHAMBER_0.NODE_PROCESS"],
        "DISTRICT_1.CHAMBER_0.NODE_PROCESS": ["DISTRICT_2.CHAMBER_LORA.NODE_PRE"],
    }
    
    # Known intent hashes (examples)
    intent_database = {
        "sha256:9f2c8d1e": "EXECUTE_TASK",
        "sha256:8b1d2f3c": "NAVIGATE_CORRIDOR",
        "sha256:urgent00": "EXECUTE_URGENT"
    }
    
    # Action implementations
    def halt_action():
        return {"status": "HALTED", "timestamp": time.time()}
    
    def avoid_obstacle(direction: str):
        return {"status": "AVOIDING", "direction": direction}
    
    def realign_intent(target_psi: float):
        return {"status": "REALIGNING", "target": target_psi}
    
    def continue_op():
        return {"status": "CONTINUING"}
        
    action_registry = {
        "HALT": halt_action,
        "AVOID_OBSTACLE": avoid_obstacle,
        "REALIGN_INTENT": realign_intent,
        "CONTINUE": continue_op,
        "EXECUTE_IMMEDIATE": lambda: {"status": "EXECUTED_IMMEDIATE"}
    }
    
    return QubeConfig(
        corridor_graph=corridor_graph,
        intent_database=intent_database,
        action_registry=action_registry
    )

def main():
    parser = argparse.ArgumentParser(description="Agent Q: Qube-Native Token Pixel Runtime")
    parser.add_argument("--stream", help="Path to token pixel JSONL stream file", required=False)
    parser.add_argument("--config", help="Path to configuration JSON", required=False)
    args = parser.parse_args()
    
    # Initialize Agent Q
    config = get_default_config()
    agent_q = QubeRuntime(config)
    
    logger.info("Agent Q waiting for input stream...")
    
    # If file provided, process it
    if args.stream:
        try:
            with open(args.stream, 'r') as f:
                start_time = time.time()
                pixel_count = 0
                
                for pixel in agent_q.deserializer.parse_stream(f):
                    decision = agent_q.process_pixel(pixel)
                    result = agent_q.execute_decision(decision)
                    pixel_count += 1
                
                duration = time.time() - start_time
                logger.info(f"Processed {pixel_count} pixels in {duration:.4f}s ({pixel_count/duration:.1f} pixels/sec)")
                
        except FileNotFoundError:
            logger.error(f"Stream file not found: {args.stream}")
            sys.exit(1)
    else:
        # Interactive mode / Stdin stream
        logger.info("Reading from stdin (Press Ctrl+C to exit)...")
        try:
            for pixel in agent_q.deserializer.parse_stream(sys.stdin):
                decision = agent_q.process_pixel(pixel)
                agent_q.execute_decision(decision)
        except KeyboardInterrupt:
            logger.info("Agent Q shutting down.")

if __name__ == "__main__":
    main()
