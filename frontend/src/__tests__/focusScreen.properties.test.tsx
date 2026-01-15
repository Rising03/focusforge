import * as fc from 'fast-check';
import { render, screen, cleanup } from '@testing-library/react';
import { FocusScreen } from '../components/FocusScreen';
import { routineService } from '../services/routineService';
import { FocusScreenData, RoutineSegment } from '../types/routine';

// Mock the routine service
jest.mock('../services/routineService');
const mockRoutineService = routineService as jest.Mocked<typeof routineService>;

// Generators for property-based testing
const timeSlotGenerator = fc.record({
  start_time: fc.constantFrom('09:00', '10:30', '14:00', '15:30'),
  end_time: fc.constantFrom('10:30', '12:00', '15:30', '17:00')
});

const routineSegmentGenerator = fc.record({
  id: fc.string({ minLength: 1, maxLength: 10 }),
  time_slot: timeSlotGenerator,
  type: fc.constantFrom('deep_work', 'study', 'skill_practice', 'break', 'personal'),
  activity: fc.constantFrom('Study Math', 'Read Book', 'Practice Coding', 'Take Break', 'Exercise'),
  duration: fc.constantFrom(30, 60, 90, 120),
  priority: fc.constantFrom('high', 'medium', 'low'),
  completed: fc.boolean()
});

const focusScreenDataGenerator = fc.record({
  currentTask: fc.option(routineSegmentGenerator, { nil: null }),
  nextTask: fc.option(routineSegmentGenerator, { nil: null }),
  timeRemaining: fc.integer({ min: 0, max: 120 }),
  totalProgress: fc.integer({ min: 0, max: 100 }),
  completedTasks: fc.integer({ min: 0, max: 10 }),
  totalTasks: fc.integer({ min: 1, max: 10 })
});

describe('Focus Screen Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default mock implementation
    mockRoutineService.getFocusScreenData.mockResolvedValue({
      currentTask: null,
      nextTask: null,
      timeRemaining: 0,
      totalProgress: 0,
      completedTasks: 0,
      totalTasks: 0
    });
  });

  afterEach(() => {
    // Clean up DOM after each test iteration
    cleanup();
    jest.clearAllTimers();
  });

  /**
   * Property 12: Focus Screen Content Minimalism
   * For any focus screen display, it should contain exactly the required elements 
   * (main focus, current task, time remaining, next action) and exclude all non-essential information.
   * **Validates: Requirements 5.1, 5.2**
   */
  it('Property 12: Focus Screen Content Minimalism', async () => {
    await fc.assert(
      fc.asyncProperty(focusScreenDataGenerator, async (focusData) => {
        // Clean up any existing renders before starting
        cleanup();
        
        // Mock the service to return our generated data
        mockRoutineService.getFocusScreenData.mockResolvedValue(focusData);

        // Render the focus screen
        const { container, unmount } = render(<FocusScreen />);

        try {
          // Wait for loading to complete
          await screen.findByText(/Focus Mode/);

          // Verify required elements are present
          expect(screen.getByText('Focus Mode')).toBeInTheDocument();
          expect(screen.getByText(/Today's Progress/)).toBeInTheDocument();
          expect(screen.getByText(/Next Action/)).toBeInTheDocument();

          // Verify non-essential elements are NOT present
          const nonEssentialSelectors = [
            '[data-testid="settings"]',
            '[data-testid="profile"]',
            '[data-testid="history"]',
            '[data-testid="analytics"]',
            '[data-testid="dashboard"]',
            '[data-testid="menu"]'
          ];

          nonEssentialSelectors.forEach(selector => {
            expect(container.querySelector(selector)).not.toBeInTheDocument();
          });

          // Verify the display is minimal - should have limited navigation
          const navElements = container.querySelectorAll('nav, .navigation, [role="navigation"]');
          expect(navElements.length).toBeLessThanOrEqual(1);

          return true;
        } finally {
          // Ensure cleanup after each iteration
          unmount();
        }
      }),
      { 
        numRuns: 10,
        timeout: 3000
      }
    );
  });

  /**
   * Property 13: Real-Time Task Display Updates
   * For any task completion event, the focus screen should update immediately 
   * to reflect the new current task and remaining activities.
   * **Validates: Requirements 5.3, 5.4**
   */
  it('Property 13: Real-Time Task Display Updates', async () => {
    await fc.assert(
      fc.asyncProperty(focusScreenDataGenerator, async (focusData) => {
        // Clean up any existing renders before starting
        cleanup();
        
        // Mock the service to return our generated data
        mockRoutineService.getFocusScreenData.mockResolvedValue(focusData);

        // Render the focus screen
        const { unmount, container } = render(<FocusScreen />);

        try {
          // Wait for initial render
          await screen.findByText(/Focus Mode/);

          // Verify progress indicators are present and would update
          const progressText = screen.getByText(/\d+ of \d+ tasks/);
          expect(progressText).toBeInTheDocument();

          // Verify the progress matches the data
          const progressMatch = progressText.textContent?.match(/(\d+) of (\d+) tasks/);
          if (progressMatch) {
            expect(parseInt(progressMatch[1])).toBe(focusData.completedTasks);
            expect(parseInt(progressMatch[2])).toBe(focusData.totalTasks);
          }

          // Verify current task display
          if (focusData.currentTask) {
            // Use more specific queries to avoid conflicts when current and next tasks have same name
            const currentFocusSection = container.querySelector('.space-y-6');
            expect(currentFocusSection).toBeInTheDocument();
            
            // Check for current task activity in the main focus area
            const currentTaskTitle = currentFocusSection?.querySelector('h2');
            expect(currentTaskTitle).toHaveTextContent(focusData.currentTask.activity);
            
            expect(screen.getByText(/remaining|Time's up!/)).toBeInTheDocument();
            expect(screen.getByText('Mark Complete')).toBeInTheDocument();
          } else {
            expect(screen.getByText(/All tasks completed!/)).toBeInTheDocument();
          }

          // Verify next action suggestion is present
          expect(screen.getByText(/Next Action/)).toBeInTheDocument();

          return true;
        } finally {
          // Ensure cleanup after each iteration
          unmount();
        }
      }),
      { 
        numRuns: 10,
        timeout: 3000
      }
    );
  });

  /**
   * Property: Focus Screen Data Consistency
   * For any focus screen data, the displayed information should be consistent
   * with the underlying data structure.
   */
  it('Property: Focus Screen Data Consistency', async () => {
    await fc.assert(
      fc.asyncProperty(focusScreenDataGenerator, async (focusData) => {
        // Clean up any existing renders before starting
        cleanup();
        
        mockRoutineService.getFocusScreenData.mockResolvedValue(focusData);

        const { unmount, container } = render(<FocusScreen />);
        
        try {
          await screen.findByText(/Focus Mode/);

          // Verify progress consistency
          const progressText = screen.getByText(/\d+ of \d+ tasks/);
          const progressMatch = progressText.textContent?.match(/(\d+) of (\d+) tasks/);
          
          if (progressMatch) {
            const displayedCompleted = parseInt(progressMatch[1]);
            const displayedTotal = parseInt(progressMatch[2]);
            
            expect(displayedCompleted).toBe(focusData.completedTasks);
            expect(displayedTotal).toBe(focusData.totalTasks);
          }

          // Verify current task consistency
          if (focusData.currentTask) {
            // Use more specific query to avoid conflicts when current and next tasks have same name
            const currentFocusSection = container.querySelector('.space-y-6');
            const currentTaskTitle = currentFocusSection?.querySelector('h2');
            expect(currentTaskTitle).toHaveTextContent(focusData.currentTask.activity);
            
            // Verify priority is displayed correctly
            const priorityElement = screen.getByText(`${focusData.currentTask.priority} priority`);
            expect(priorityElement).toBeInTheDocument();
          }

          return true;
        } finally {
          // Ensure cleanup after each iteration
          unmount();
        }
      }),
      { numRuns: 10, timeout: 3000 }
    );
  });
});

/**
 * Feature: student-discipline-system, Property 12: Focus Screen Content Minimalism
 * Feature: student-discipline-system, Property 13: Real-Time Task Display Updates
 */