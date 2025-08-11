import { chromium, Browser, Page } from 'playwright';
import { WebSocket } from 'ws';
import * as fs from 'fs';
import * as path from 'path';

describe('MIRG E2E Tests', () => {
  let browser: Browser;
  let page: Page;
  let ws: WebSocket;
  
  const APP_URL = 'http://localhost:5173';
  const WS_URL = 'ws://localhost:3121';
  const API_URL = 'http://localhost:3120';
  
  beforeAll(async () => {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(APP_URL);
    
    // Wait for app to load
    await page.waitForSelector('[data-testid="app-container"]', { timeout: 5000 });
  });
  
  afterEach(async () => {
    await page.close();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });
  
  describe('Complete Rule Generation Workflow', () => {
    test('should complete full rule generation workflow', async () => {
      // 1. Navigate to Rules Generator
      await page.click('[data-testid="nav-rules-generator"]');
      await page.waitForSelector('text=Generate Rules Package');
      
      // 2. Fill in the form
      await page.click('text=Select IDE');
      await page.click('text=cursor');
      
      await page.click('text=Select Project Type');
      await page.click('text=react-typescript');
      
      await page.click('text=Select Token Budget');
      await page.click('text=standard');
      
      await page.click('text=Select Framework');
      await page.click('text=react');
      
      // 3. Open Token Optimizer
      await page.click('text=Token Optimizer');
      await page.waitForSelector('text=Token Usage Overview');
      
      // 4. Verify token calculations
      const tokenUsage = await page.textContent('[data-testid="total-token-usage"]');
      expect(tokenUsage).toContain('tokens');
      
      // 5. Adjust allocations
      const coreSlider = await page.$('[data-testid="core-allocation-slider"]');
      if (coreSlider) {
        await coreSlider.evaluate((el: HTMLInputElement) => {
          el.value = '60';
          el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      }
      
      // 6. Generate package
      await page.click('text=Generate Rules Package');
      
      // 7. Wait for download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toContain('rules-package');
      expect(download.suggestedFilename()).toContain('.zip');
      
      // 8. Verify WebSocket notifications
      const wsMessages = await page.evaluate(() => {
        return window.localStorage.getItem('ws-messages');
      });
      
      expect(wsMessages).toContain('generation_progress');
    });
  });
  
  describe('Filesystem Watcher Integration', () => {
    test('should monitor filesystem changes in real-time', async () => {
      // Navigate to dashboard
      await page.click('[data-testid="nav-dashboard"]');
      
      // Find filesystem watcher section
      await page.waitForSelector('text=Filesystem Activity');
      
      // Add a watched path
      await page.click('text=Watched Paths');
      await page.click('[data-testid="add-path-button"]');
      
      await page.fill('[data-testid="path-input"]', '/test/watch/path');
      await page.click('[data-testid="path-type-local"]');
      await page.click('text=Add Path');
      
      // Verify path was added
      await page.waitForSelector('text=/test/watch/path');
      
      // Check events tab
      await page.click('text=Events');
      
      // Create a test file to trigger event
      const testFile = path.join(process.cwd(), 'test-fs-event.txt');
      fs.writeFileSync(testFile, 'test content');
      
      // Wait for event to appear
      await page.waitForSelector('[data-testid="fs-event-item"]', { timeout: 5000 });
      
      // Verify event details
      const eventText = await page.textContent('[data-testid="fs-event-item"]');
      expect(eventText).toContain('create');
      
      // Cleanup
      fs.unlinkSync(testFile);
    });
    
    test('should track performance metrics', async () => {
      await page.click('[data-testid="nav-dashboard"]');
      
      // Check metrics
      await page.waitForSelector('[data-testid="fs-metrics"]');
      
      const avgLatency = await page.textContent('[data-testid="avg-latency"]');
      expect(avgLatency).toMatch(/\d+ms/);
      
      // Verify performance thresholds
      const localLatency = await page.getAttribute('[data-testid="local-latency"]', 'data-value');
      expect(parseInt(localLatency || '0')).toBeLessThan(250);
    });
  });
  
  describe('Multi-User Collaboration', () => {
    test('should show active users in real-time', async () => {
      // Open second browser window
      const page2 = await browser.newPage();
      await page2.goto(APP_URL);
      
      // Both pages should show 2 active users
      await page.waitForSelector('text=Active Users: 2');
      await page2.waitForSelector('text=Active Users: 2');
      
      // Activity from page1 should appear on page2
      await page.click('[data-testid="nav-rules-generator"]');
      
      await page2.waitForSelector('[data-testid="activity-feed"]');
      const activity = await page2.textContent('[data-testid="activity-feed"]');
      expect(activity).toContain('navigated to Rules Generator');
      
      await page2.close();
    });
  });
  
  describe('Error Handling and Recovery', () => {
    test('should handle WebSocket disconnection gracefully', async () => {
      // Simulate WebSocket disconnection
      await page.evaluate(() => {
        window.dispatchEvent(new Event('offline'));
      });
      
      // Should show reconnection status
      await page.waitForSelector('text=Reconnecting...');
      
      // Simulate reconnection
      await page.evaluate(() => {
        window.dispatchEvent(new Event('online'));
      });
      
      // Should reconnect
      await page.waitForSelector('text=Connected');
    });
    
    test('should handle API errors with user feedback', async () => {
      // Intercept API calls and force error
      await page.route(`${API_URL}/api/rules/generate`, route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        });
      });
      
      // Try to generate rules
      await page.click('[data-testid="nav-rules-generator"]');
      await page.click('text=Generate Rules Package');
      
      // Should show error message
      await page.waitForSelector('text=Generation failed');
      expect(await page.textContent('[data-testid="error-message"]'))
        .toContain('Internal server error');
    });
  });
  
  describe('Performance Monitoring', () => {
    test('should track and display performance metrics', async () => {
      await page.click('[data-testid="nav-dashboard"]');
      
      // Check system metrics
      const cpuUsage = await page.textContent('[data-testid="cpu-usage"]');
      expect(cpuUsage).toMatch(/\d+%/);
      
      const memoryUsage = await page.textContent('[data-testid="memory-usage"]');
      expect(memoryUsage).toMatch(/\d+MB/);
      
      // Check API health
      const apiStatus = await page.textContent('[data-testid="api-status"]');
      expect(['Healthy', 'Degraded', 'Down']).toContain(apiStatus);
    });
  });
  
  describe('Search and Filter', () => {
    test('should search and filter rules effectively', async () => {
      await page.click('[data-testid="nav-search"]');
      
      // Search for React rules
      await page.fill('[data-testid="search-input"]', 'React hooks');
      await page.click('[data-testid="search-button"]');
      
      // Wait for results
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Verify results
      const results = await page.$$('[data-testid="search-result-item"]');
      expect(results.length).toBeGreaterThan(0);
      
      // Apply filters
      await page.click('[data-testid="filter-ide-cursor"]');
      await page.click('[data-testid="filter-category-core"]');
      
      // Results should update
      await page.waitForTimeout(500); // Wait for filter to apply
      const filteredResults = await page.$$('[data-testid="search-result-item"]');
      expect(filteredResults.length).toBeLessThanOrEqual(results.length);
    });
  });
});