import { Server } from 'http';
import { WebSocketServer } from 'ws';

let server: Server;
let wss: WebSocketServer;

// Setup test environment
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3120';
  process.env.WS_PORT = '3121';
  process.env.VITE_API_URL = 'http://localhost:3120';
  process.env.VITE_WS_URL = 'ws://localhost:3121';
  
  // Start test servers if needed
  // Note: In real setup, you'd start actual servers here
  console.log('Integration test environment initialized');
});

afterAll(async () => {
  // Cleanup
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  if (wss) {
    await new Promise((resolve) => wss.close(resolve));
  }
});

// Global test utilities
global.testUtils = {
  waitForWebSocket: (ws: WebSocket) => {
    return new Promise((resolve) => {
      if (ws.readyState === WebSocket.OPEN) {
        resolve(ws);
      } else {
        ws.addEventListener('open', () => resolve(ws));
      }
    });
  },
  
  waitForMessage: (ws: WebSocket, messageType: string) => {
    return new Promise((resolve) => {
      const handler = (event: MessageEvent) => {
        const message = JSON.parse(event.data);
        if (message.type === messageType) {
          ws.removeEventListener('message', handler);
          resolve(message);
        }
      };
      ws.addEventListener('message', handler);
    });
  },
  
  createMockRule: (overrides = {}) => ({
    id: 'test-rule-1',
    name: 'Test Rule',
    content: 'Test content',
    tokenCount: 1000,
    priority: 8,
    category: 'core',
    framework: 'react',
    ide: 'cursor',
    tags: ['test'],
    active: true,
    ...overrides
  }),
  
  createMockFileEvent: (overrides = {}) => ({
    id: Date.now().toString(),
    path: '/test/file.txt',
    type: 'create',
    timestamp: new Date(),
    mountType: 'local',
    latency: 50,
    ...overrides
  })
};

// Extend global namespace
declare global {
  var testUtils: {
    waitForWebSocket: (ws: WebSocket) => Promise<WebSocket>;
    waitForMessage: (ws: WebSocket, messageType: string) => Promise<any>;
    createMockRule: (overrides?: any) => any;
    createMockFileEvent: (overrides?: any) => any;
  };
}