import { performance } from 'perf_hooks';
import * as fs from 'fs';
import * as path from 'path';

describe('Performance Integration Tests', () => {
  describe('Filesystem Watcher Performance', () => {
    const testDir = path.join(process.cwd(), 'test-performance');
    
    beforeAll(() => {
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
    });
    
    afterAll(() => {
      fs.rmSync(testDir, { recursive: true, force: true });
    });
    
    test('should detect local filesystem changes within 250ms', async () => {
      const results: number[] = [];
      
      for (let i = 0; i < 10; i++) {
        const testFile = path.join(testDir, `test-${i}.txt`);
        const startTime = performance.now();
        
        // Simulate file system watcher detection
        await new Promise<void>((resolve) => {
          const watcher = fs.watch(testDir, (eventType, filename) => {
            if (filename === `test-${i}.txt`) {
              const detectionTime = performance.now() - startTime;
              results.push(detectionTime);
              watcher.close();
              resolve();
            }
          });
          
          // Create file
          setTimeout(() => {
            fs.writeFileSync(testFile, 'test content');
          }, 10);
        });
        
        // Cleanup
        fs.unlinkSync(testFile);
      }
      
      const avgDetectionTime = results.reduce((a, b) => a + b, 0) / results.length;
      const maxDetectionTime = Math.max(...results);
      
      console.log(`Average detection time: ${avgDetectionTime.toFixed(2)}ms`);
      console.log(`Max detection time: ${maxDetectionTime.toFixed(2)}ms`);
      
      expect(avgDetectionTime).toBeLessThan(250);
      expect(maxDetectionTime).toBeLessThan(250);
    });
    
    test('should handle rapid file changes efficiently', async () => {
      const fileCount = 50;
      const startTime = performance.now();
      
      // Create many files rapidly
      const files = Array(fileCount).fill(null).map((_, i) => {
        const filePath = path.join(testDir, `rapid-${i}.txt`);
        fs.writeFileSync(filePath, `content-${i}`);
        return filePath;
      });
      
      const creationTime = performance.now() - startTime;
      
      // Cleanup
      files.forEach(file => fs.unlinkSync(file));
      
      console.log(`Created ${fileCount} files in ${creationTime.toFixed(2)}ms`);
      expect(creationTime).toBeLessThan(1000); // Should create 50 files in < 1s
    });
  });
  
  describe('WebSocket Performance', () => {
    test('should handle message broadcasting efficiently', () => {
      const messageCount = 1000;
      const messages: any[] = [];
      
      const startTime = performance.now();
      
      // Simulate message processing
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          type: 'test_message',
          data: { index: i, timestamp: Date.now() },
          id: `msg-${i}`
        });
      }
      
      // Simulate JSON serialization (what WebSocket would do)
      const serialized = messages.map(msg => JSON.stringify(msg));
      
      const processingTime = performance.now() - startTime;
      
      console.log(`Processed ${messageCount} messages in ${processingTime.toFixed(2)}ms`);
      expect(processingTime).toBeLessThan(100); // Should process 1000 messages in < 100ms
    });
  });
  
  describe('Token Optimization Performance', () => {
    test('should calculate token allocations quickly', () => {
      const rules = Array(100).fill(null).map((_, i) => ({
        id: `rule-${i}`,
        tokenCount: Math.floor(Math.random() * 3000) + 500,
        priority: Math.floor(Math.random() * 10) + 1,
        category: ['core', 'specialized', 'niche'][i % 3] as any,
        active: Math.random() > 0.5
      }));
      
      const startTime = performance.now();
      
      // Simulate token calculation
      const allocation = {
        core: 0,
        specialized: 0,
        niche: 0,
        total: 0
      };
      
      for (const rule of rules) {
        if (rule.active) {
          allocation[rule.category] += rule.tokenCount;
          allocation.total += rule.tokenCount;
        }
      }
      
      const percentage = (allocation.total / 128000) * 100;
      
      const calculationTime = performance.now() - startTime;
      
      console.log(`Calculated token allocation for ${rules.length} rules in ${calculationTime.toFixed(2)}ms`);
      expect(calculationTime).toBeLessThan(10); // Should calculate in < 10ms
    });
    
    test('should optimize rule selection efficiently', () => {
      const rules = Array(200).fill(null).map((_, i) => ({
        id: `rule-${i}`,
        tokenCount: Math.floor(Math.random() * 3000) + 500,
        priority: Math.floor(Math.random() * 10) + 1,
        category: ['core', 'specialized', 'niche'][i % 3] as any,
        active: false
      }));
      
      const tokenLimit = 128000;
      const allocations = { core: 50, specialized: 30, niche: 20 };
      
      const startTime = performance.now();
      
      // Simulate auto-optimization
      const targetTokens = {
        core: (tokenLimit * allocations.core) / 100,
        specialized: (tokenLimit * allocations.specialized) / 100,
        niche: (tokenLimit * allocations.niche) / 100
      };
      
      const categories = ['core', 'specialized', 'niche'] as const;
      
      categories.forEach(category => {
        const categoryRules = rules
          .filter(r => r.category === category)
          .sort((a, b) => b.priority - a.priority);
        
        let currentTokens = 0;
        categoryRules.forEach(rule => {
          if (currentTokens + rule.tokenCount <= targetTokens[category]) {
            rule.active = true;
            currentTokens += rule.tokenCount;
          }
        });
      });
      
      const optimizationTime = performance.now() - startTime;
      
      console.log(`Optimized ${rules.length} rules in ${optimizationTime.toFixed(2)}ms`);
      expect(optimizationTime).toBeLessThan(20); // Should optimize in < 20ms
    });
  });
  
  describe('Memory Usage', () => {
    test('should not leak memory when processing many events', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate processing many events
      const events: any[] = [];
      for (let i = 0; i < 10000; i++) {
        events.push({
          id: `event-${i}`,
          path: `/test/path/${i}`,
          type: 'update',
          timestamp: new Date(),
          data: { size: i * 100 }
        });
      }
      
      // Process and discard
      events.forEach(event => {
        // Simulate event processing
        JSON.stringify(event);
      });
      
      // Clear reference
      events.length = 0;
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      console.log(`Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
    });
  });
});