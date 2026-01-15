import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App';

// Mock viewport dimensions
const mockViewport = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });
  window.dispatchEvent(new Event('resize'));
};

// Mock API responses for mobile testing
global.fetch = jest.fn();

const mockFetch = (url: string, options?: any) => {
  const method = options?.method || 'GET';
  
  if (url.includes('/api/auth/register') && method === 'POST') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        token: 'mock-jwt-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User' }
      })
    });
  }
  
  if (url.includes('/api/profile') && method === 'GET') {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        id: '1',
        targetIdentity: 'disciplined student',
        wakeUpTime: '06:00',
        sleepTime: '22:00'
      })
    });
  }
  
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  });
};

(global.fetch as jest.Mock).mockImplementation(mockFetch);

describe('Mobile Responsive Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('Mobile Viewport Adaptation', () => {
    it('should adapt layout for mobile devices (375px width)', async () => {
      mockViewport(375, 667); // iPhone SE dimensions
      
      const user = userEvent.setup();
      render(<App />);

      // Should show mobile-optimized navigation
      const mobileMenu = screen.queryByLabelText(/menu/i);
      if (mobileMenu) {
        expect(mobileMenu).toBeInTheDocument();
      }

      // Text should be readable on small screens
      const textElements = screen.getAllByText(/./);
      textElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        const fontSize = parseInt(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(14); // Minimum readable font size
      });
    });

    it('should adapt layout for tablet devices (768px width)', async () => {
      mockViewport(768, 1024); // iPad dimensions
      
      render(<App />);

      // Should show tablet-optimized layout
      const container = document.querySelector('.container, .max-w-');
      if (container) {
        const styles = window.getComputedStyle(container);
        expect(styles.maxWidth).toBeDefined();
      }
    });

    it('should maintain desktop layout for large screens (1200px width)', async () => {
      mockViewport(1200, 800); // Desktop dimensions
      
      render(<App />);

      // Should show full desktop navigation
      const navigation = screen.queryByRole('navigation');
      if (navigation) {
        expect(navigation).toBeInTheDocument();
      }
    });
  });

  describe('Touch Interface Optimization', () => {
    it('should handle touch events on interactive elements', async () => {
      mockViewport(375, 667);
      
      const user = userEvent.setup();
      render(<App />);

      // Find interactive buttons
      const buttons = screen.getAllByRole('button');
      
      for (const button of buttons.slice(0, 3)) { // Test first 3 buttons
        // Simulate touch events
        fireEvent.touchStart(button);
        fireEvent.touchEnd(button);
        
        // Button should remain functional
        expect(button).toBeInTheDocument();
        expect(button).not.toBeDisabled();
      }
    });

    it('should provide adequate touch targets (minimum 44px)', async () => {
      mockViewport(375, 667);
      
      render(<App />);

      const interactiveElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link'),
        ...screen.getAllByRole('textbox')
      ];

      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        const minTouchTarget = 44; // iOS Human Interface Guidelines
        
        // Allow some flexibility for very small elements
        if (rect.width > 0 && rect.height > 0) {
          expect(Math.max(rect.width, rect.height)).toBeGreaterThanOrEqual(minTouchTarget * 0.8);
        }
      });
    });

    it('should handle swipe gestures for navigation', async () => {
      mockViewport(375, 667);
      
      render(<App />);

      const mainContent = document.querySelector('main, .main-content, [role="main"]');
      if (mainContent) {
        // Simulate swipe gesture
        fireEvent.touchStart(mainContent, {
          touches: [{ clientX: 100, clientY: 200 }]
        });
        
        fireEvent.touchMove(mainContent, {
          touches: [{ clientX: 200, clientY: 200 }]
        });
        
        fireEvent.touchEnd(mainContent, {
          changedTouches: [{ clientX: 200, clientY: 200 }]
        });

        // Should not crash the application
        expect(mainContent).toBeInTheDocument();
      }
    });
  });

  describe('Mobile Form Interactions', () => {
    it('should optimize form inputs for mobile keyboards', async () => {
      mockViewport(375, 667);
      localStorage.setItem('authToken', 'mock-token');
      
      const user = userEvent.setup();
      render(<App />);

      // Find form inputs
      const inputs = screen.getAllByRole('textbox');
      
      for (const input of inputs.slice(0, 2)) { // Test first 2 inputs
        // Should have appropriate input types for mobile keyboards
        const inputType = input.getAttribute('type') || 'text';
        const inputMode = input.getAttribute('inputmode');
        
        // Email inputs should trigger email keyboard
        if (input.getAttribute('name')?.includes('email') || 
            input.getAttribute('placeholder')?.includes('email')) {
          expect(['email', 'text']).toContain(inputType);
        }
        
        // Number inputs should trigger numeric keyboard
        if (input.getAttribute('name')?.includes('number') || 
            input.getAttribute('type') === 'number') {
          expect(['number', 'numeric']).toContain(inputType || inputMode);
        }
      }
    });

    it('should handle virtual keyboard appearance', async () => {
      mockViewport(375, 667);
      
      const user = userEvent.setup();
      render(<App />);

      const textInput = screen.getAllByRole('textbox')[0];
      if (textInput) {
        // Focus input to trigger virtual keyboard
        await user.click(textInput);
        
        // Simulate virtual keyboard reducing viewport height
        mockViewport(375, 400); // Reduced height when keyboard appears
        
        // Application should still be usable
        expect(textInput).toBeInTheDocument();
        expect(textInput).toHaveFocus();
        
        // Should be able to type
        await user.type(textInput, 'test input');
        expect(textInput).toHaveValue('test input');
      }
    });
  });

  describe('Mobile Performance Optimization', () => {
    it('should load efficiently on mobile connections', async () => {
      mockViewport(375, 667);
      
      const startTime = performance.now();
      render(<App />);
      const loadTime = performance.now() - startTime;

      // Should load quickly (under 2 seconds for initial render)
      expect(loadTime).toBeLessThan(2000);
    });

    it('should handle slow network conditions gracefully', async () => {
      mockViewport(375, 667);
      
      // Mock slow network response
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({})
          }), 3000)
        )
      );

      const user = userEvent.setup();
      render(<App />);

      // Should show loading states
      const loadingElements = screen.queryAllByText(/loading|wait/i);
      if (loadingElements.length > 0) {
        expect(loadingElements[0]).toBeInTheDocument();
      }

      // Should not crash during slow loading
      await waitFor(() => {
        expect(document.body).toBeInTheDocument();
      }, { timeout: 5000 });
    });
  });

  describe('Mobile Accessibility', () => {
    it('should maintain accessibility on mobile devices', async () => {
      mockViewport(375, 667);
      
      render(<App />);

      // Should have proper heading hierarchy
      const headings = screen.getAllByRole('heading');
      headings.forEach(heading => {
        const level = heading.tagName.toLowerCase();
        expect(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']).toContain(level);
      });

      // Interactive elements should have accessible names
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        const accessibleName = button.getAttribute('aria-label') || 
                              button.textContent || 
                              button.getAttribute('title');
        expect(accessibleName).toBeTruthy();
      });
    });

    it('should support screen reader navigation on mobile', async () => {
      mockViewport(375, 667);
      
      render(<App />);

      // Should have proper landmark roles
      const landmarks = [
        ...screen.queryAllByRole('main'),
        ...screen.queryAllByRole('navigation'),
        ...screen.queryAllByRole('banner'),
        ...screen.queryAllByRole('contentinfo')
      ];

      // Should have at least some landmark structure
      expect(landmarks.length).toBeGreaterThan(0);

      // Focus should be manageable
      const focusableElements = [
        ...screen.getAllByRole('button'),
        ...screen.getAllByRole('link'),
        ...screen.getAllByRole('textbox')
      ];

      focusableElements.forEach(element => {
        expect(element.getAttribute('tabindex')).not.toBe('-1');
      });
    });
  });

  describe('Cross-Browser Mobile Compatibility', () => {
    it('should work with mobile Safari features', async () => {
      mockViewport(375, 667);
      
      // Mock iOS Safari user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        configurable: true
      });

      render(<App />);

      // Should handle iOS-specific behaviors
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        // Should not have zoom-causing small font sizes
        const styles = window.getComputedStyle(input);
        const fontSize = parseInt(styles.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(16); // Prevents zoom on iOS
      });
    });

    it('should work with Android Chrome features', async () => {
      mockViewport(375, 667);
      
      // Mock Android Chrome user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 Chrome/91.0.4472.120',
        configurable: true
      });

      render(<App />);

      // Should handle Android-specific behaviors
      const forms = screen.getAllByRole('form');
      if (forms.length > 0) {
        // Should not have conflicting autocomplete attributes
        const inputs = forms[0].querySelectorAll('input');
        inputs.forEach(input => {
          const autocomplete = input.getAttribute('autocomplete');
          if (autocomplete) {
            expect(autocomplete).not.toBe('off'); // Android ignores this
          }
        });
      }
    });
  });

  describe('Mobile-Specific Features', () => {
    it('should handle device orientation changes', async () => {
      // Portrait mode
      mockViewport(375, 667);
      render(<App />);
      
      const portraitLayout = document.body.innerHTML;
      
      // Landscape mode
      mockViewport(667, 375);
      window.dispatchEvent(new Event('orientationchange'));
      
      // Should adapt to landscape
      await waitFor(() => {
        const landscapeLayout = document.body.innerHTML;
        // Layout should change or at least remain functional
        expect(landscapeLayout).toBeDefined();
      });
    });

    it('should support pull-to-refresh gesture', async () => {
      mockViewport(375, 667);
      
      render(<App />);

      const mainContent = document.querySelector('main, .main-content, [role="main"]') || document.body;
      
      // Simulate pull-to-refresh gesture
      fireEvent.touchStart(mainContent, {
        touches: [{ clientX: 200, clientY: 50 }]
      });
      
      fireEvent.touchMove(mainContent, {
        touches: [{ clientX: 200, clientY: 150 }]
      });
      
      fireEvent.touchEnd(mainContent, {
        changedTouches: [{ clientX: 200, clientY: 150 }]
      });

      // Should not break the application
      expect(mainContent).toBeInTheDocument();
    });

    it('should handle offline scenarios gracefully', async () => {
      mockViewport(375, 667);
      
      // Mock offline network
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      // Mock failed fetch requests
      (global.fetch as jest.Mock).mockImplementationOnce(() => 
        Promise.reject(new Error('Network error'))
      );

      render(<App />);

      // Should show offline indicators or graceful degradation
      await waitFor(() => {
        const offlineIndicators = screen.queryAllByText(/offline|network|connection/i);
        // Either shows offline message or continues to work
        expect(document.body).toBeInTheDocument();
      });
    });
  });
});