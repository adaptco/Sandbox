import unittest
import json
import io
from qube_runtime import (
    QubeRuntime, get_default_config, TokenPixel, StateVector, 
    TokenPixelDeserializer, Decision, DriftStatus
)

class TestAgentQ(unittest.TestCase):
    
    def setUp(self):
        self.config = get_default_config()
        self.agent_q = QubeRuntime(self.config)
        
        # Sample valid token pixel JSON
        self.sample_pixel_json = json.dumps({
            "tokenPixelId": "TPX_TEST_01",
            "timestamp": 1737140000.0,
            "agentId": "AGENT_Q",
            "corridor": "DISTRICT_1.CHAMBER_0.NODE_START",
            "stateVector": {
                "phi": 0.5,
                "psi": 0.9,
                "omega": 1.0,
                "tau": 100.0
            },
            "intentHash": "sha256:9f2c8d1e",
            "eventDelta": "EVENT_001",
            "autonomyIndex": 0.1,
            "voxelSignature": "VXL_0x00000000",
            "prevHash": "hash_prev",
            "hash": "hash_curr"
        })

    def test_startup(self):
        """Verify Agent Q initializes correctly."""
        self.assertIsNotNone(self.agent_q)
        self.assertEqual(len(self.agent_q.decision_log), 0)

    def test_deserializer(self):
        """Verify parsing mechanism."""
        pixel = TokenPixelDeserializer.parse(self.sample_pixel_json)
        self.assertIsNotNone(pixel)
        self.assertEqual(pixel.tokenPixelId, "TPX_TEST_01")
        self.assertEqual(pixel.stateVector.phi, 0.5)

    def test_nominal_decision(self):
        """Verify standard decision making."""
        pixel = TokenPixelDeserializer.parse(self.sample_pixel_json)
        decision = self.agent_q.process_pixel(pixel)
        
        self.assertEqual(decision.action, "CONTINUE")
        self.assertEqual(decision.reason, "Nominal operation")
        
        # Verify log
        self.assertEqual(len(self.agent_q.decision_log), 1)
        self.assertEqual(self.agent_q.decision_log[0]["decision"]["action"], "CONTINUE")

    def test_autonomy_drift_alert(self):
        """Verify Q halts on critical drift."""
        # Create pixel with critical drift
        data = json.loads(self.sample_pixel_json)
        data["autonomyIndex"] = 0.95 # Critical > 0.7
        bad_pixel = TokenPixelDeserializer.parse(json.dumps(data))
        
        decision = self.agent_q.process_pixel(bad_pixel)
        self.assertEqual(decision.action, "HALT")
        self.assertEqual(decision.reason, "Critical autonomy drift detected")

    def test_intent_realignment(self):
        """Verify Q realigns when intent low."""
        data = json.loads(self.sample_pixel_json)
        data["stateVector"]["psi"] = 0.2 # Low alignment < 0.5
        misaligned_pixel = TokenPixelDeserializer.parse(json.dumps(data))
        
        decision = self.agent_q.process_pixel(misaligned_pixel)
        self.assertEqual(decision.action, "REALIGN_INTENT")

    def test_collision_avoidance(self):
        """Verify collision detection triggers avoidance."""
        data = json.loads(self.sample_pixel_json)
        # Mock a voxel signature that decodes to having bits in 'forward' direction
        # Forward bits: 2,5,8... 
        # 0x04 = bit 2 set
        data["voxelSignature"] = "VXL_0x00000004" 
        collision_pixel = TokenPixelDeserializer.parse(json.dumps(data))
        
        decision = self.agent_q.process_pixel(collision_pixel)
        self.assertEqual(decision.action, "AVOID_OBSTACLE")

if __name__ == '__main__':
    unittest.main()
