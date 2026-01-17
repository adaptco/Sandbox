const CheckpointAgent = require('../.checkpoint/edge_agent/checkpoint_agent');

describe('CheckpointAgent', () => {
    let agent;
    const config = {
        version: '1.0.0',
        agent_type: 'atomic_state_checkpoint'
    };

    beforeEach(() => {
        agent = new CheckpointAgent(config);
    });

    describe('Initialization', () => {
        test('should initialize with provided configuration', () => {
            expect(agent.config).toEqual(config);
            expect(agent.tokenPixels).toEqual([]);
            expect(agent.checkpointId).toMatch(/^ckpt_\d+$/);
        });
    });

    describe('Token Classification', () => {
        test('should classify numbers correctly', () => {
            expect(agent.classifyToken('123')).toBe('number');
            expect(agent.classifyToken('45.67')).toBe('number');
        });

        test('should classify identifiers correctly', () => {
            expect(agent.classifyToken('player')).toBe('identifier');
            expect(agent.classifyToken('score_val')).toBe('identifier');
        });

        test('should classify structures correctly', () => {
            expect(agent.classifyToken('{')).toBe('structure');
            expect(agent.classifyToken('}')).toBe('structure');
            expect(agent.classifyToken('[')).toBe('structure');
            expect(agent.classifyToken(']')).toBe('structure');
        });

        test('should classify operators correctly', () => {
            expect(agent.classifyToken(':')).toBe('operator');
            expect(agent.classifyToken('+')).toBe('operator');
            expect(agent.classifyToken('=')).toBe('operator');
        });
    });

    describe('State Atomization', () => {
        test('should atomize a state object correctly', () => {
            const stateKey = 'player';
            const stateData = { x: 10, y: 20, active: true };

            const atom = agent.atomizeState(stateKey, stateData);

            expect(atom.type).toBe('state_atom');
            expect(atom.id).toBe(stateKey);
            expect(atom.timestamp).toBeDefined();
            expect(atom.data).toBe(JSON.stringify(stateData));
            expect(atom.hash).toBeDefined();
            expect(Array.isArray(atom.tokens)).toBe(true);
        });

        test('should generate consistent hashes for identical states', () => {
            const stateA = { score: 100 };
            const stateB = { score: 100 };

            const hashA = agent.hashState(stateA);
            const hashB = agent.hashState(stateB);

            expect(hashA).toBe(hashB);
        });

        test('should generate different hashes for different states', () => {
            const stateA = { score: 100 };
            const stateB = { score: 101 };

            const hashA = agent.hashState(stateA);
            const hashB = agent.hashState(stateB);

            expect(hashA).not.toBe(hashB);
        });
    });

    describe('Checkpoint Generation', () => {
        test('should generate a complete checkpoint object', () => {
            const appState = {
                player: { x: 0, y: 0 },
                obstacles: [],
                eggs: [],
                particles: [],
                game: { score: 0 }
            };

            const checkpoint = agent.generateCheckpoint(appState);

            expect(checkpoint.id).toBe(agent.checkpointId);
            expect(checkpoint.format).toBe('token_pixel_v1');
            expect(checkpoint.state_atoms).toBeDefined();
            expect(checkpoint.state_atoms.player).toBeDefined();
            expect(checkpoint.state_atoms.game).toBeDefined();
            expect(checkpoint.metadata.token_count).toBeGreaterThanOrEqual(0);
        });
    });

    describe('Async Linearization', () => {
        test('should execute atomic requests and return results', async () => {
            const requests = [
                { id: 'req_1', atomic: true },
                { id: 'req_2', atomic: true }
            ];

            const results = await agent.linearizeRequests(requests);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[0].request).toBe('req_1');
            expect(results[1].success).toBe(true);
        });
    });
});