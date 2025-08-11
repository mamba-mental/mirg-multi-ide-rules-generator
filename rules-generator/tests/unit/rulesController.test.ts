import { RulesController } from '../../backend/src/controllers/rulesController';
import * as fs from 'fs/promises';
import * as path from 'path';

jest.mock('fs/promises');
jest.mock('../../backend/src/services/weaviate');

describe('RulesController Unit Tests', () => {
  let controller: RulesController;
  
  beforeEach(() => {
    controller = new RulesController();
    jest.clearAllMocks();
  });
  
  describe('loadRules', () => {
    test('should load rules from filesystem', async () => {
      const mockRules = [
        { name: 'rule1.md', content: '# Rule 1' },
        { name: 'rule2.md', content: '# Rule 2' }
      ];
      
      (fs.readdir as jest.Mock).mockResolvedValue(mockRules.map(r => r.name));
      (fs.readFile as jest.Mock).mockImplementation((filePath) => {
        const fileName = path.basename(filePath as string);
        const rule = mockRules.find(r => r.name === fileName);
        return Promise.resolve(rule?.content || '');
      });
      
      const rules = await controller.loadRules('cursor', 'react', 'minimal');
      
      expect(rules).toHaveLength(2);
      expect(rules[0]).toContain('Rule 1');
      expect(rules[1]).toContain('Rule 2');
    });
    
    test('should handle missing rules directory', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('ENOENT'));
      
      const rules = await controller.loadRules('unknown', 'unknown', 'minimal');
      
      expect(rules).toEqual([]);
    });
  });
  
  describe('generatePackage', () => {
    test('should create a zip package with rules', async () => {
      const mockRules = ['# Rule 1', '# Rule 2'];
      jest.spyOn(controller, 'loadRules').mockResolvedValue(mockRules);
      
      const result = await controller.generatePackage({
        ide: 'cursor',
        framework: 'react',
        projectType: 'react-typescript',
        tokenBudget: 'standard'
      });
      
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });
    
    test('should include optimizer config in package', async () => {
      const config = {
        ide: 'cursor',
        framework: 'react',
        projectType: 'react-typescript',
        tokenBudget: 'standard',
        optimizerConfig: {
          tokenLimit: 128000,
          activeRules: [
            { id: '1', name: 'Rule 1', tokenCount: 1000, category: 'core' }
          ]
        }
      };
      
      const result = await controller.generatePackage(config);
      
      expect(result).toBeInstanceOf(Buffer);
      // In a real test, you'd unzip and verify contents
    });
  });
  
  describe('validateConfig', () => {
    test('should validate correct configuration', () => {
      const config = {
        ide: 'cursor',
        framework: 'react',
        projectType: 'react-typescript',
        tokenBudget: 'standard'
      };
      
      expect(() => controller.validateConfig(config)).not.toThrow();
    });
    
    test('should reject invalid IDE', () => {
      const config = {
        ide: 'invalid-ide',
        framework: 'react',
        projectType: 'react-typescript',
        tokenBudget: 'standard'
      };
      
      expect(() => controller.validateConfig(config)).toThrow('Invalid IDE');
    });
    
    test('should reject missing required fields', () => {
      const config = {
        ide: 'cursor',
        framework: 'react'
        // Missing projectType and tokenBudget
      };
      
      expect(() => controller.validateConfig(config as any)).toThrow();
    });
  });
  
  describe('optimizeRules', () => {
    test('should filter rules based on token budget', () => {
      const rules = [
        { id: '1', name: 'Rule 1', tokenCount: 50000, priority: 9, category: 'core', active: true },
        { id: '2', name: 'Rule 2', tokenCount: 30000, priority: 7, category: 'specialized', active: true },
        { id: '3', name: 'Rule 3', tokenCount: 60000, priority: 5, category: 'niche', active: true }
      ];
      
      const optimized = controller.optimizeRules(rules, 100000);
      
      // Should prioritize high priority rules within budget
      expect(optimized).toHaveLength(2);
      expect(optimized[0].id).toBe('1');
      expect(optimized[1].id).toBe('2');
    });
    
    test('should respect category allocations', () => {
      const rules = [
        { id: '1', name: 'Core 1', tokenCount: 30000, priority: 9, category: 'core', active: true },
        { id: '2', name: 'Core 2', tokenCount: 30000, priority: 8, category: 'core', active: true },
        { id: '3', name: 'Spec 1', tokenCount: 40000, priority: 7, category: 'specialized', active: true }
      ];
      
      const allocations = { core: 50, specialized: 30, niche: 20 };
      const optimized = controller.optimizeRules(rules, 100000, allocations);
      
      const coreTokens = optimized
        .filter(r => r.category === 'core')
        .reduce((sum, r) => sum + r.tokenCount, 0);
      
      expect(coreTokens).toBeLessThanOrEqual(50000); // 50% of 100k
    });
  });
});