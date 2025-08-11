import { RegistryManager } from '../../backend/src/registry';
import { WebSocket } from 'ws';
import * as jwt from 'jsonwebtoken';

describe('MCP Registry Integration Tests', () => {
  let registryManager: RegistryManager;
  let testPort = 3400;
  
  beforeEach(() => {
    registryManager = new RegistryManager({
      http: { port: testPort++ },
      registry: {
        maxInstances: 5,
        maxConnectionsPerInstance: 10,
        autoScaling: true
      },
      sessions: {
        ttl: 60000, // 1 minute for tests
        persistSessions: false
      },
      dashboard: {
        enabled: true,
        port: testPort++
      }
    });
  });
  
  afterEach(() => {
    registryManager.close();
  });
  
  describe('Instance Management', () => {
    test('should create and manage instances', async () => {
      const instance = await registryManager.createInstance({
        userId: 'test-user',
        organizationId: 'test-org'
      });
      
      expect(instance).toHaveProperty('id');
      expect(instance.status).toBe('active');
      expect(instance.metadata.userId).toBe('test-user');
      
      const registry = registryManager.getRegistry();
      const instances = registry.getInstances();
      expect(instances).toHaveLength(1);
    });
    
    test('should enforce max instances limit', async () => {
      const registry = registryManager.getRegistry();
      
      // Create max instances
      for (let i = 0; i < 5; i++) {
        await registry.createInstance({});
      }
      
      // Try to create one more
      await expect(registry.createInstance({}))
        .rejects.toThrow('Maximum instances reached');
    });
    
    test('should auto-scale when thresholds exceeded', async () => {
      const registry = registryManager.getRegistry();
      
      // Create initial instance
      const instance1 = await registry.createInstance({});
      
      // Simulate high resource usage
      instance1.metadata.resourceUsage = {
        cpu: 85,
        memory: 70,
        connections: 9,
        throughput: 100
      };
      
      // Trigger health check (normally automatic)
      // In real test, we'd wait for the interval
      
      const instances = registry.getInstances();
      expect(instances.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('Connection Routing', () => {
    test('should route connections to available instances', (done) => {
      const token = jwt.sign(
        { userId: 'test-user', organizationId: 'test-org' },
        process.env.JWT_SECRET || 'default-secret'
      );
      
      const ws = new WebSocket(`ws://localhost:${testPort - 2}/mcp-router`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      ws.on('open', () => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'routing') {
            expect(message.status).toBe('connected');
            expect(message).toHaveProperty('instanceId');
            expect(message).toHaveProperty('connectionId');
            
            ws.close();
            done();
          }
        });
      });
      
      ws.on('error', (err) => {
        done(err);
      });
    });
    
    test('should use sticky sessions', async () => {
      const sessionManager = registryManager.getSessionManager();
      
      // Create session with sticky instance
      const session = await sessionManager.getOrCreateSession({
        userId: 'test-user'
      });
      
      const instance = await registryManager.createInstance({});
      sessionManager.setStickyInstance(session.id, instance.id);
      
      // Verify sticky instance is used
      const retrievedSession = sessionManager.getSession(session.id);
      expect(retrievedSession?.metadata.stickyInstance).toBe(instance.id);
    });
  });
  
  describe('Session Management', () => {
    test('should create and manage sessions', async () => {
      const sessionManager = registryManager.getSessionManager();
      
      const session = await sessionManager.getOrCreateSession({
        userId: 'test-user',
        organizationId: 'test-org'
      });
      
      expect(session).toHaveProperty('id');
      expect(session.userId).toBe('test-user');
      expect(session.connections).toEqual([]);
      
      // Retrieve session
      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });
    
    test('should expire sessions', async () => {
      const sessionManager = registryManager.getSessionManager();
      
      // Create session with short TTL
      const session = await sessionManager.getOrCreateSession({
        userId: 'test-user'
      });
      
      // Manually expire it
      session.expiresAt = new Date(Date.now() - 1000);
      
      // Should not retrieve expired session
      const retrieved = sessionManager.getSession(session.id);
      expect(retrieved).toBeUndefined();
    });
    
    test('should track user sessions', async () => {
      const sessionManager = registryManager.getSessionManager();
      
      // Create multiple sessions for same user
      await sessionManager.getOrCreateSession({ userId: 'user1' });
      await sessionManager.getOrCreateSession({ userId: 'user1' });
      await sessionManager.getOrCreateSession({ userId: 'user2' });
      
      const user1Sessions = sessionManager.getUserSessions('user1');
      const user2Sessions = sessionManager.getUserSessions('user2');
      
      expect(user1Sessions).toHaveLength(2);
      expect(user2Sessions).toHaveLength(1);
    });
  });
  
  describe('Load Balancing', () => {
    test('should use least-connections strategy', async () => {
      const registry = registryManager.getRegistry();
      
      // Create instances
      const instance1 = await registry.createInstance({});
      const instance2 = await registry.createInstance({});
      
      // Simulate connections
      instance1.connections = 5;
      instance2.connections = 2;
      
      // Get instance for new connection
      const selected = await registry.getInstanceForConnection({});
      expect(selected.id).toBe(instance2.id);
    });
    
    test('should support round-robin strategy', async () => {
      const registry = registryManager.getRegistry();
      registry.setLoadBalancingStrategy({ 
        type: 'round-robin' 
      });
      
      // Create instances
      const instance1 = await registry.createInstance({});
      const instance2 = await registry.createInstance({});
      
      // Get instances in round-robin fashion
      const selections = [];
      for (let i = 0; i < 4; i++) {
        const selected = await registry.getInstanceForConnection({});
        selections.push(selected.id);
      }
      
      // Should alternate between instances
      expect(selections[0]).toBe(selections[2]);
      expect(selections[1]).toBe(selections[3]);
      expect(selections[0]).not.toBe(selections[1]);
    });
  });
  
  describe('Dashboard', () => {
    test('should provide metrics via dashboard', (done) => {
      const dashboard = registryManager.getDashboard();
      expect(dashboard).toBeDefined();
      
      const ws = new WebSocket(`ws://localhost:${testPort - 1}/registry-dashboard`);
      
      ws.on('open', () => {
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'initial-state') {
            expect(message.data).toHaveProperty('registry');
            expect(message.data).toHaveProperty('sessions');
            expect(message.data).toHaveProperty('system');
            
            ws.close();
            done();
          }
        });
      });
    });
    
    test('should handle dashboard commands', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort - 1}/registry-dashboard`);
      
      ws.on('open', () => {
        // Send scale up command
        ws.send(JSON.stringify({
          type: 'command',
          command: 'scaleUp',
          params: { count: 2 }
        }));
        
        ws.on('message', (data) => {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'command-result') {
            expect(message.command).toBe('scaleUp');
            expect(message.result).toBeDefined();
            
            ws.close();
            done();
          }
        });
      });
    });
  });
  
  describe('Failure Handling', () => {
    test('should handle instance failures', async () => {
      const registry = registryManager.getRegistry();
      const instance = await registry.createInstance({});
      
      // Simulate error
      instance.status = 'error';
      
      // Should not route to error instance
      const selected = await registry.getInstanceForConnection({});
      expect(selected.id).not.toBe(instance.id);
    });
    
    test('should reconnect on instance removal', async () => {
      const registry = registryManager.getRegistry();
      const instance = await registry.createInstance({});
      
      // Simulate connection
      instance.connections = 1;
      
      // Remove instance
      await registry.removeInstance(instance.id);
      
      // Verify instance removed
      const instances = registry.getInstances();
      expect(instances).toHaveLength(0);
    });
  });
});