import * as fc from 'fast-check';
import { aiParserService } from '../services/aiParserService';
import { ParsedCommand, UserContext } from '../types/ai';
import dotenv from 'dotenv';

// Load environment variables for tests
dotenv.config();

// Mock the Gemini API to avoid hitting real API during tests
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn().mockResolvedValue({
        response: {
          text: () => JSON.stringify({
            type: 'log_activity',
            parameters: { activity: 'test', duration: 30 },
            confidence: 0.8,
            fallbackRequired: false
          })
        }
      })
    })
  }))
}));

describe('AI Integration Property-Based Tests', () => {
  describe('Property 10: Natural Language Processing Round Trip', () => {
    /**
     * Feature: student-discipline-system, Property 10: Natural Language Processing Round Trip
     * For any valid natural language command, the AI parser should convert it to structured data that can be executed by the system, with fallback to manual input when parsing fails.
     * Validates: Requirements 4.1, 4.4, 4.6
     */
    it('should convert natural language to structured commands or provide fallback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            input: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            targetIdentity: fc.constantFrom('disciplined student', 'focused learner', 'academic achiever'),
            academicGoals: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 }),
            skillGoals: fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 5 })
          }),
          async (testData) => {
            const context: UserContext = {
              userId: 'test-user-id',
              currentTime: new Date(),
              timezone: 'UTC',
              recentActivities: ['study', 'exercise'],
              activeRoutine: undefined,
              preferences: {
                targetIdentity: testData.targetIdentity,
                academicGoals: testData.academicGoals,
                skillGoals: testData.skillGoals
              }
            };

            const result = await aiParserService.parseNaturalLanguage(testData.input, context);
            
            // Should always return a response (not crash)
            expect(result).toBeDefined();
            expect(result).toHaveProperty('success');
            
            if (result.success) {
              // Successful parsing should return structured command
              expect(result).toHaveProperty('data');
              expect(result.data).toHaveProperty('type');
              expect(result.data).toHaveProperty('parameters');
              expect(result.data).toHaveProperty('confidence');
              expect(result.data).toHaveProperty('fallbackRequired');
              
              // Type should be one of the valid command types
              expect(['log_activity', 'add_task', 'request_plan', 'ask_question'])
                .toContain(result.data!.type);
              
              // Confidence should be between 0 and 1
              expect(result.data!.confidence).toBeGreaterThanOrEqual(0);
              expect(result.data!.confidence).toBeLessThanOrEqual(1);
            } else {
              // Failed parsing should provide fallback options
              expect(result).toHaveProperty('fallbackOptions');
              expect(result.fallbackOptions).toHaveProperty('suggestedActions');
              expect(result.fallbackOptions).toHaveProperty('fallbackMessage');
              expect(result.fallbackOptions).toHaveProperty('inputFields');
              
              // Should have at least one suggested action
              expect(result.fallbackOptions!.suggestedActions.length).toBeGreaterThan(0);
            }
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 11: Text Input Reliability', () => {
    /**
     * Feature: student-discipline-system, Property 11: Text Input Reliability
     * For any system functionality, text input should always be available and functional regardless of AI or voice feature availability.
     * Validates: Requirements 4.2
     */
    it('should always provide text input alternatives regardless of AI availability', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          async (input) => {
            // Test fallback options (should always work)
            const fallbackOptions = await aiParserService.fallbackToManualInput(input);
            
            expect(fallbackOptions).toHaveProperty('suggestedActions');
            expect(fallbackOptions).toHaveProperty('fallbackMessage');
            expect(fallbackOptions).toHaveProperty('inputFields');
            
            // Should always provide manual input alternatives
            expect(fallbackOptions.suggestedActions.length).toBeGreaterThan(0);
            expect(fallbackOptions.inputFields.length).toBeGreaterThan(0);
            
            // Each suggested action should have required properties
            fallbackOptions.suggestedActions.forEach((action: any) => {
              expect(action).toHaveProperty('label');
              expect(action).toHaveProperty('action');
              expect(typeof action.label).toBe('string');
              expect(typeof action.action).toBe('string');
            });
            
            // Each input field should have required properties
            fallbackOptions.inputFields.forEach((field: any) => {
              expect(field).toHaveProperty('name');
              expect(field).toHaveProperty('type');
              expect(field).toHaveProperty('label');
              expect(field).toHaveProperty('required');
              expect(['text', 'number', 'select', 'datetime']).toContain(field.type);
            });
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 47: AI Service Constraint Compliance', () => {
    /**
     * Feature: student-discipline-system, Property 47: AI Service Constraint Compliance
     * For any AI functionality, only Gemini API free tier endpoints should be used, with clear feedback about processing results.
     * Validates: Requirements 18.1, 18.4
     */
    it('should comply with free tier constraints and provide clear feedback', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 20 }),
          async (inputs) => {
            // Test service status
            const stats = aiParserService.getUsageStats();
            const isAvailable = aiParserService.isServiceAvailable();
            
            expect(stats).toHaveProperty('requestsThisMinute');
            expect(stats).toHaveProperty('requestsToday');
            expect(stats).toHaveProperty('available');
            
            // Usage should track rate limits (free tier constraints)
            expect(typeof stats.requestsThisMinute).toBe('number');
            expect(typeof stats.requestsToday).toBe('number');
            expect(typeof stats.available).toBe('boolean');
            
            // Should not exceed free tier limits
            expect(stats.requestsThisMinute).toBeLessThanOrEqual(15);
            expect(stats.requestsToday).toBeLessThanOrEqual(1500);
            
            // Service availability should be consistent
            expect(typeof isAvailable).toBe('boolean');
            expect(isAvailable).toBe(stats.available);
          }
        ),
        { numRuns: 5 }
      );
    });
  });

  describe('Property 48: AI-Independent Core Functionality', () => {
    /**
     * Feature: student-discipline-system, Property 48: AI-Independent Core Functionality
     * For any core system feature, it should remain fully functional when AI services are unavailable or disabled, with manual alternatives provided.
     * Validates: Requirements 18.2, 18.3
     */
    it('should provide manual alternatives when AI is unavailable', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            commandType: fc.constantFrom('log_activity', 'add_task', 'request_plan', 'ask_question'),
            parameters: fc.record({
              activity: fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0),
              duration: fc.integer({ min: 1, max: 480 }),
              task: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              priority: fc.constantFrom('high', 'medium', 'low'),
              timeframe: fc.constantFrom('today', 'tomorrow', 'week'),
              question: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0)
            })
          }),
          async (testData) => {
            // Create a manual command (simulating fallback scenario)
            const manualCommand: ParsedCommand = {
              type: testData.commandType as ParsedCommand['type'],
              parameters: testData.parameters,
              confidence: 0.8,
              fallbackRequired: false
            };

            // Test response generation with manual command
            const response = await aiParserService.generateResponse(manualCommand, {
              todayProgress: { completedTasks: 5, totalTasks: 10, focusedTime: 120 },
              recentHabits: ['morning_routine', 'exercise'],
              energyLevel: 'medium'
            });

            // Should always be able to generate some response
            expect(typeof response).toBe('string');
            expect(response.length).toBeGreaterThan(0);
            
            // Response should be supportive and relevant
            expect(response).not.toContain('error');
            expect(response).not.toContain('failed');
          }
        ),
        { numRuns: 3 }
      );
    });
  });

  describe('Property 49: AI Service Error Handling', () => {
    /**
     * Feature: student-discipline-system, Property 49: AI Service Error Handling
     * For any AI service limitation or rate limit, the system should handle the error gracefully without system failure or data loss.
     * Validates: Requirements 18.5
     */
    it('should handle AI service errors gracefully without system failure', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            input: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
            malformedContext: fc.boolean()
          }),
          async (testData) => {
            const context: UserContext = testData.malformedContext ? 
              // Intentionally malformed context
              {} as UserContext :
              {
                userId: 'test-user-id',
                currentTime: new Date(),
                timezone: 'UTC',
                recentActivities: ['study'],
                activeRoutine: undefined,
                preferences: {
                  targetIdentity: 'disciplined student',
                  academicGoals: ['learn programming'],
                  skillGoals: ['time management']
                }
              };

            const result = await aiParserService.parseNaturalLanguage(testData.input, context);

            // Should never crash (always return a result)
            expect(result).toBeDefined();
            expect(result).toHaveProperty('success');
            
            if (!result.success) {
              // Failed parsing should provide helpful error messages
              expect(result).toHaveProperty('error');
              expect(typeof result.error).toBe('string');
              
              // Should still provide fallback options
              expect(result).toHaveProperty('fallbackOptions');
              expect(result.fallbackOptions).toHaveProperty('suggestedActions');
              expect(result.fallbackOptions).toHaveProperty('fallbackMessage');
            }
            
            if (result.success) {
              // Successful responses should have proper structure
              expect(result).toHaveProperty('data');
              expect(result.data).toHaveProperty('type');
              expect(result.data).toHaveProperty('parameters');
              expect(result.data).toHaveProperty('confidence');
              expect(result.data).toHaveProperty('fallbackRequired');
            }
          }
        ),
        { numRuns: 3 }
      );
    });
  });
});

// Unit tests for service-level functionality
describe('AI Parser Service Unit Tests', () => {
  describe('Rate Limiting', () => {
    it('should track and enforce rate limits', () => {
      const service = aiParserService;
      const stats = service.getUsageStats();
      
      expect(stats).toHaveProperty('requestsThisMinute');
      expect(stats).toHaveProperty('requestsToday');
      expect(stats).toHaveProperty('available');
      
      expect(typeof stats.requestsThisMinute).toBe('number');
      expect(typeof stats.requestsToday).toBe('number');
      expect(typeof stats.available).toBe('boolean');
    });

    it('should indicate service availability correctly', () => {
      const service = aiParserService;
      const isAvailable = service.isServiceAvailable();
      
      expect(typeof isAvailable).toBe('boolean');
    });
  });

  describe('Fallback Generation', () => {
    it('should generate appropriate fallback options for different input types', async () => {
      const service = aiParserService;
      
      const studyFallback = await service.fallbackToManualInput('I studied math for 2 hours');
      expect(studyFallback.suggestedActions.some(action => 
        action.action === 'log_activity'
      )).toBe(true);
      
      const taskFallback = await service.fallbackToManualInput('add homework task');
      expect(taskFallback.suggestedActions.some(action => 
        action.action === 'add_task'
      )).toBe(true);
      
      const planFallback = await service.fallbackToManualInput('plan my day');
      expect(planFallback.suggestedActions.some(action => 
        action.action === 'request_plan'
      )).toBe(true);
    });
  });
});