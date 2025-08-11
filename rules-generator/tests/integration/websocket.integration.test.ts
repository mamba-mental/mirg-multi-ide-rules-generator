import { WebSocket } from 'ws';
import { Server } from 'http';

describe('WebSocket Integration Tests', () => {
  let ws: WebSocket;
  let server: Server;
  const WS_URL = 'ws://localhost:3121';
  
  beforeAll(async () => {
    // Start server if not running
    // This assumes the server is started separately
  });
  
  beforeEach(async () => {
    ws = new WebSocket(WS_URL);
    await new Promise((resolve) => {
      ws.on('open', resolve);
    });
  });
  
  afterEach(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
  
  describe('Connection Management', () => {
    test('should establish WebSocket connection', (done) => {
      const testWs = new WebSocket(WS_URL);
      testWs.on('open', () => {
        expect(testWs.readyState).toBe(WebSocket.OPEN);
        testWs.close();
        done();
      });
    });
    
    test('should handle multiple concurrent connections', async () => {
      const connections = await Promise.all(
        Array(5).fill(null).map(() => {
          return new Promise<WebSocket>((resolve) => {
            const ws = new WebSocket(WS_URL);
            ws.on('open', () => resolve(ws));
          });
        })
      );
      
      expect(connections.length).toBe(5);
      connections.forEach(ws => {
        expect(ws.readyState).toBe(WebSocket.OPEN);
        ws.close();
      });
    });
  });
  
  describe('Message Handling', () => {
    test('should receive connection acknowledgment', (done) => {
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection' && message.status === 'connected') {
          expect(message).toHaveProperty('connectionId');
          done();
        }
      });
    });
    
    test('should handle ping/pong for keep-alive', (done) => {
      ws.on('pong', () => {
        done();
      });
      ws.ping();
    });
  });
  
  describe('Rule Generation Messages', () => {
    test('should handle rule generation request', (done) => {
      const request = {
        type: 'generate_rules',
        data: {
          ide: 'cursor',
          framework: 'react',
          projectType: 'react-typescript',
          tokenBudget: 'standard'
        }
      };
      
      ws.send(JSON.stringify(request));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'generation_progress') {
          expect(message.data).toHaveProperty('progress');
          expect(message.data).toHaveProperty('message');
          if (message.data.progress === 100) {
            done();
          }
        }
      });
    }, 30000);
  });
  
  describe('System Metrics', () => {
    test('should receive system metrics updates', (done) => {
      let metricsReceived = false;
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'system_metrics') {
          expect(message.data).toHaveProperty('cpu');
          expect(message.data).toHaveProperty('memory');
          expect(message.data).toHaveProperty('activeConnections');
          metricsReceived = true;
          done();
        }
      });
      
      // Metrics should be sent periodically
      setTimeout(() => {
        if (!metricsReceived) {
          done(new Error('No metrics received within timeout'));
        }
      }, 6000);
    });
  });
  
  describe('Filesystem Events', () => {
    test('should handle filesystem watcher control', (done) => {
      const request = {
        type: 'fs_watcher_control',
        data: {
          action: 'add',
          path: '/test/path',
          type: 'local'
        }
      };
      
      ws.send(JSON.stringify(request));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'fs_watcher_status') {
          expect(message.data.success).toBe(true);
          done();
        }
      });
    });
    
    test('should receive filesystem events', (done) => {
      // First add a watcher
      const addWatcher = {
        type: 'fs_watcher_control',
        data: {
          action: 'add',
          path: process.cwd(),
          type: 'local'
        }
      };
      
      ws.send(JSON.stringify(addWatcher));
      
      // Listen for events
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'fs_event') {
          expect(message.data).toHaveProperty('path');
          expect(message.data).toHaveProperty('type');
          expect(message.data).toHaveProperty('latency');
          expect(message.data.latency).toBeLessThan(250); // Local should be <250ms
          done();
        }
      });
      
      // Trigger a filesystem change
      setTimeout(() => {
        const fs = require('fs');
        const testFile = `${process.cwd()}/test-${Date.now()}.tmp`;
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
      }, 1000);
    }, 10000);
  });
  
  describe('Error Handling', () => {
    test('should handle invalid message format', (done) => {
      ws.send('invalid json');
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          expect(message.error).toContain('Invalid message format');
          done();
        }
      });
    });
    
    test('should handle unknown message type', (done) => {
      ws.send(JSON.stringify({ type: 'unknown_type' }));
      
      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'error') {
          expect(message.error).toContain('Unknown message type');
          done();
        }
      });
    });
  });
  
  describe('Performance Tests', () => {
    test('should handle rapid message sending', async () => {
      const messageCount = 100;
      const startTime = Date.now();
      
      const promises = Array(messageCount).fill(null).map((_, i) => {
        return new Promise((resolve) => {
          ws.send(JSON.stringify({
            type: 'echo_test',
            data: { index: i }
          }));
          resolve(null);
        });
      });
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(1000); // Should handle 100 messages in < 1s
    });
    
    test('should maintain performance under load', async () => {
      const connections = await Promise.all(
        Array(20).fill(null).map(() => {
          return new Promise<WebSocket>((resolve) => {
            const ws = new WebSocket(WS_URL);
            ws.on('open', () => resolve(ws));
          });
        })
      );
      
      // Each connection sends messages
      const startTime = Date.now();
      await Promise.all(
        connections.map(ws => {
          return new Promise((resolve) => {
            ws.send(JSON.stringify({ type: 'echo_test' }));
            ws.on('message', () => resolve(null));
          });
        })
      );
      
      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(500); // Should handle 20 concurrent messages quickly
      
      connections.forEach(ws => ws.close());
    });
  });
});