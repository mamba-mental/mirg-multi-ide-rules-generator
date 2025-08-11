import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RulesGenerator } from '../../frontend/src/components/RulesGenerator';
import '@testing-library/jest-dom';

// Mock fetch
global.fetch = jest.fn();

describe('Rules Generator Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Component Rendering', () => {
    test('should render all main sections', () => {
      render(<RulesGenerator />);
      
      expect(screen.getByText('Generate Rules Package')).toBeInTheDocument();
      expect(screen.getByText('IDE')).toBeInTheDocument();
      expect(screen.getByText('Project Type')).toBeInTheDocument();
      expect(screen.getByText('Token Budget')).toBeInTheDocument();
      expect(screen.getByText('Framework')).toBeInTheDocument();
    });
    
    test('should show token optimizer when button clicked', () => {
      render(<RulesGenerator />);
      
      const optimizerButton = screen.getByText(/Token Optimizer/);
      fireEvent.click(optimizerButton);
      
      expect(screen.getByText('Token Usage Overview')).toBeInTheDocument();
      expect(screen.getByText('Optimization Settings')).toBeInTheDocument();
      expect(screen.getByText('Active Rules Management')).toBeInTheDocument();
    });
  });
  
  describe('Form Interactions', () => {
    test('should update form values when selections change', () => {
      render(<RulesGenerator />);
      
      const ideSelect = screen.getByText('Select IDE').closest('button');
      fireEvent.click(ideSelect!);
      fireEvent.click(screen.getByText('cursor'));
      
      expect(screen.getByText('cursor')).toBeInTheDocument();
    });
    
    test('should enable generate button when all fields are filled', () => {
      render(<RulesGenerator />);
      
      const generateButton = screen.getByText('Generate Rules Package');
      expect(generateButton).not.toBeDisabled();
    });
  });
  
  describe('Token Optimizer', () => {
    test('should display token usage metrics', () => {
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      
      expect(screen.getByText('Total Token Usage')).toBeInTheDocument();
      expect(screen.getByText('Core Rules')).toBeInTheDocument();
      expect(screen.getByText('Specialized Rules')).toBeInTheDocument();
      expect(screen.getByText('Niche Rules')).toBeInTheDocument();
    });
    
    test('should update allocation when sliders change', () => {
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      
      const sliders = screen.getAllByRole('slider');
      expect(sliders.length).toBeGreaterThan(0);
      
      // Simulate slider change
      fireEvent.change(sliders[0], { target: { value: 60 } });
      
      expect(screen.getByText('60%')).toBeInTheDocument();
    });
    
    test('should toggle rules when switches are clicked', () => {
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      
      const switches = screen.getAllByRole('checkbox');
      const activeRulesCount = switches.filter(s => (s as HTMLInputElement).checked).length;
      
      fireEvent.click(switches[0]);
      
      const newActiveCount = screen.getAllByRole('checkbox')
        .filter(s => (s as HTMLInputElement).checked).length;
      
      expect(newActiveCount).not.toBe(activeRulesCount);
    });
    
    test('should apply presets when clicked', () => {
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      fireEvent.click(screen.getByText('Presets'));
      
      const performancePreset = screen.getByText('Performance');
      fireEvent.click(performancePreset.closest('div')!);
      
      // Should update allocations
      expect(screen.getByText('Core: 70%')).toBeInTheDocument();
    });
  });
  
  describe('Rule Generation API', () => {
    test('should send correct request when generating rules', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: async () => new Blob(['test'], { type: 'application/zip' })
      });
      
      const mockWebSocketMessage = jest.fn();
      render(<RulesGenerator onWebSocketMessage={mockWebSocketMessage} />);
      
      // Fill form
      fireEvent.click(screen.getByText('Select IDE').closest('button')!);
      fireEvent.click(screen.getByText('cursor'));
      
      fireEvent.click(screen.getByText('Select Project Type').closest('button')!);
      fireEvent.click(screen.getByText('react-typescript'));
      
      fireEvent.click(screen.getByText('Select Token Budget').closest('button')!);
      fireEvent.click(screen.getByText('standard'));
      
      fireEvent.click(screen.getByText('Select Framework').closest('button')!);
      fireEvent.click(screen.getByText('react'));
      
      // Generate
      fireEvent.click(screen.getByText('Generate Rules Package'));
      
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/rules/generate'),
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('cursor')
          })
        );
      });
      
      // Should emit WebSocket events
      expect(mockWebSocketMessage).toHaveBeenCalledWith(
        'generation_progress',
        expect.objectContaining({
          isGenerating: true,
          progress: 0
        })
      );
    });
    
    test('should handle API errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
      
      const mockWebSocketMessage = jest.fn();
      render(<RulesGenerator onWebSocketMessage={mockWebSocketMessage} />);
      
      fireEvent.click(screen.getByText('Generate Rules Package'));
      
      await waitFor(() => {
        expect(mockWebSocketMessage).toHaveBeenCalledWith(
          'generation_progress',
          expect.objectContaining({
            isGenerating: false,
            message: 'Error during generation'
          })
        );
      });
    });
  });
  
  describe('Export Configuration', () => {
    test('should export configuration as JSON', () => {
      // Mock URL.createObjectURL
      global.URL.createObjectURL = jest.fn(() => 'blob:test');
      
      // Mock document.createElement
      const mockClick = jest.fn();
      const mockAnchor = { click: mockClick, href: '', download: '' };
      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      fireEvent.click(screen.getByText('Export Config'));
      
      expect(mockClick).toHaveBeenCalled();
      expect(mockAnchor.download).toContain('token-budget-config.json');
    });
  });
  
  describe('Performance Validation', () => {
    test('should render quickly with many rules', () => {
      const start = performance.now();
      render(<RulesGenerator />);
      const renderTime = performance.now() - start;
      
      expect(renderTime).toBeLessThan(100); // Should render in < 100ms
    });
    
    test('should handle rapid interactions smoothly', () => {
      render(<RulesGenerator />);
      
      fireEvent.click(screen.getByText(/Token Optimizer/));
      
      const start = performance.now();
      
      // Rapid toggling
      const switches = screen.getAllByRole('checkbox');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(switches[0]);
      }
      
      const interactionTime = performance.now() - start;
      expect(interactionTime).toBeLessThan(200); // Should handle 10 toggles in < 200ms
    });
  });
});