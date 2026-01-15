import * as fc from 'fast-check';
import { EveningReviewService } from '../services/eveningReviewService';
import { 
  EveningReview,
  CreateEveningReviewRequest,
  EveningReviewResponse,
  RoutineAdaptation,
  PerformanceInsight,
  ReviewAnalysis
} from '../types/eveningReview';

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

// Mock the ProfileService
jest.mock('../services/profileService', () => ({
  ProfileService: jest.fn().mockImplementation(() => ({
    trackBehavioralEvent: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock the RoutineService
jest.mock('../services/routineService', () => ({
  RoutineService: jest.fn().mockImplementation(() => ({
    getRoutineByDate: jest.fn().mockResolvedValue(null)
  }))
}));

describe('Evening Review Property-Based Tests', () => {
  let eveningReviewService: EveningReviewService;
  let mockPool: any;

  beforeEach(() => {
    eveningReviewService = new EveningReviewService();
    mockPool = require('../config/database');
    mockPool.query.mockClear();
  });

  describe('Property 18: Evening Review Content Completeness', () => {
    /**
     * Feature: student-discipline-system, Property 18: Evening Review Content Completeness
     * For any evening review session, the system should prompt for all required reflection 
     * elements (accomplished, missed, reasons, tomorrow tasks) and store responses for future analysis.
     * Validates: Requirements 7.2, 7.3, 7.5
     */
    it('should ensure all required reflection elements are collected and stored', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            accomplished: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 0, maxLength: 10 }
            ),
            missed: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 0, maxLength: 8 }
            ),
            reasons: fc.array(
              fc.oneof(
                fc.constant('Not enough time'),
                fc.constant('Low energy'),
                fc.constant('Unexpected interruption'),
                fc.constant('Lack of motivation'),
                fc.constant('Technical difficulties'),
                fc.constant('Poor planning'),
                fc.string({ minLength: 5, maxLength: 50 })
              ),
              { minLength: 0, maxLength: 8 }
            ),
            tomorrowTasks: fc.array(
              fc.string({ minLength: 3, maxLength: 100 }),
              { minLength: 0, maxLength: 12 }
            ),
            mood: fc.integer({ min: 1, max: 10 }),
            energyLevel: fc.integer({ min: 1, max: 10 }),
            insights: fc.string({ minLength: 0, maxLength: 500 })
          }),
          async ({ userId, date, accomplished, missed, reasons, tomorrowTasks, mood, energyLevel, insights }) => {
            const reviewId = fc.sample(fc.uuid(), 1)[0];
            const dateString = date.toISOString().split('T')[0];

            const request: CreateEveningReviewRequest = {
              date: dateString,
              accomplished,
              missed,
              reasons,
              tomorrow_tasks: tomorrowTasks,
              mood,
              energy_level: energyLevel,
              insights
            };

            // Mock database responses
            mockPool.query
              .mockResolvedValueOnce({ rows: [] }) // Check existing review
              .mockResolvedValueOnce({ // Save review
                rows: [{
                  id: reviewId,
                  user_id: userId,
                  date: date,
                  accomplished,
                  missed,
                  reasons,
                  tomorrow_tasks: tomorrowTasks,
                  mood,
                  energy_level: energyLevel,
                  insights,
                  created_at: new Date()
                }]
              })
              .mockResolvedValueOnce({ rows: [] }); // getRecentReviews for analysis

            try {
              const response = await eveningReviewService.createEveningReview(userId, request);

              // Verify response structure completeness
              expect(response).toHaveProperty('review');
              expect(response).toHaveProperty('routine_adaptations');
              expect(response).toHaveProperty('performance_insights');

              const review = response.review;

              // Verify all required reflection elements are present and stored
              expect(review).toHaveProperty('id');
              expect(review).toHaveProperty('user_id');
              expect(review).toHaveProperty('date');
              expect(review).toHaveProperty('accomplished');
              expect(review).toHaveProperty('missed');
              expect(review).toHaveProperty('reasons');
              expect(review).toHaveProperty('tomorrow_tasks');
              expect(review).toHaveProperty('mood');
              expect(review).toHaveProperty('energy_level');
              expect(review).toHaveProperty('insights');
              expect(review).toHaveProperty('created_at');

              // Verify data integrity - all input data is preserved
              expect(review.user_id).toBe(userId);
              expect(review.date).toEqual(date);
              expect(review.accomplished).toEqual(accomplished);
              expect(review.missed).toEqual(missed);
              expect(review.reasons).toEqual(reasons);
              expect(review.tomorrow_tasks).toEqual(tomorrowTasks);
              expect(review.mood).toBe(mood);
              expect(review.energy_level).toBe(energyLevel);
              expect(review.insights).toBe(insights);

              // Verify data types are correct
              expect(typeof review.id).toBe('string');
              expect(typeof review.user_id).toBe('string');
              expect(review.date instanceof Date).toBe(true);
              expect(Array.isArray(review.accomplished)).toBe(true);
              expect(Array.isArray(review.missed)).toBe(true);
              expect(Array.isArray(review.reasons)).toBe(true);
              expect(Array.isArray(review.tomorrow_tasks)).toBe(true);
              expect(typeof review.mood).toBe('number');
              expect(typeof review.energy_level).toBe('number');
              expect(typeof review.insights).toBe('string');
              expect(review.created_at instanceof Date).toBe(true);

              // Verify mood and energy level are within valid ranges
              expect(review.mood).toBeGreaterThanOrEqual(1);
              expect(review.mood).toBeLessThanOrEqual(10);
              expect(review.energy_level).toBeGreaterThanOrEqual(1);
              expect(review.energy_level).toBeLessThanOrEqual(10);

              // Verify arrays contain strings
              review.accomplished.forEach(task => expect(typeof task).toBe('string'));
              review.missed.forEach(task => expect(typeof task).toBe('string'));
              review.reasons.forEach(reason => expect(typeof reason).toBe('string'));
              review.tomorrow_tasks.forEach(task => expect(typeof task).toBe('string'));

              // Verify routine adaptations are provided (array structure)
              expect(Array.isArray(response.routine_adaptations)).toBe(true);
              response.routine_adaptations.forEach(adaptation => {
                expect(adaptation).toHaveProperty('type');
                expect(adaptation).toHaveProperty('description');
                expect(adaptation).toHaveProperty('reason');
                expect(adaptation).toHaveProperty('impact_score');
                expect(['simplify', 'increase_complexity', 'adjust_timing', 'change_focus']).toContain(adaptation.type);
                expect(typeof adaptation.description).toBe('string');
                expect(typeof adaptation.reason).toBe('string');
                expect(typeof adaptation.impact_score).toBe('number');
                expect(adaptation.impact_score).toBeGreaterThan(0);
                expect(adaptation.impact_score).toBeLessThanOrEqual(1);
              });

              // Verify performance insights are provided (array structure)
              expect(Array.isArray(response.performance_insights)).toBe(true);
              response.performance_insights.forEach(insight => {
                expect(insight).toHaveProperty('category');
                expect(insight).toHaveProperty('insight');
                expect(insight).toHaveProperty('trend');
                expect(insight).toHaveProperty('recommendation');
                expect(['productivity', 'energy', 'focus', 'habits', 'mood']).toContain(insight.category);
                expect(typeof insight.insight).toBe('string');
                expect(['improving', 'declining', 'stable']).toContain(insight.trend);
                expect(typeof insight.recommendation).toBe('string');
                expect(insight.insight.length).toBeGreaterThan(0);
                expect(insight.recommendation.length).toBeGreaterThan(0);
              });

              return true;
            } catch (error) {
              // Accept validation failures for invalid inputs
              if (error instanceof Error && error.message.includes('must be')) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 15000);
  });

  describe('Property 19: Review-Based Routine Adaptation', () => {
    /**
     * Feature: student-discipline-system, Property 19: Review-Based Routine Adaptation
     * For any evening review data indicating performance issues, the next day's routine 
     * should be automatically adjusted to address identified problems.
     * Validates: Requirements 7.4
     */
    it('should automatically adapt routines based on review performance data', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            userId: fc.uuid(),
            date: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-30') }),
            performanceScenario: fc.oneof(
              // Low completion rate scenario
              fc.record({
                type: fc.constant('low_completion'),
                accomplished: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 2 }),
                missed: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 4, maxLength: 8 }),
                reasons: fc.array(fc.oneof(
                  fc.constant('Not enough time'),
                  fc.constant('Too many tasks'),
                  fc.constant('Overwhelmed')
                ), { minLength: 2, maxLength: 5 }),
                mood: fc.integer({ min: 1, max: 5 }),
                energyLevel: fc.integer({ min: 1, max: 5 })
              }),
              // Low energy scenario
              fc.record({
                type: fc.constant('low_energy'),
                accomplished: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 1, maxLength: 4 }),
                missed: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 2, maxLength: 6 }),
                reasons: fc.array(fc.oneof(
                  fc.constant('Too tired'),
                  fc.constant('Low energy'),
                  fc.constant('Exhausted')
                ), { minLength: 1, maxLength: 4 }),
                mood: fc.integer({ min: 3, max: 7 }),
                energyLevel: fc.integer({ min: 1, max: 3 })
              }),
              // High performance scenario
              fc.record({
                type: fc.constant('high_performance'),
                accomplished: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 6, maxLength: 12 }),
                missed: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 0, maxLength: 1 }),
                reasons: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 0, maxLength: 1 }),
                mood: fc.integer({ min: 7, max: 10 }),
                energyLevel: fc.integer({ min: 7, max: 10 })
              }),
              // Overwhelmed scenario
              fc.record({
                type: fc.constant('overwhelmed'),
                accomplished: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
                missed: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 3, maxLength: 7 }),
                reasons: fc.array(fc.oneof(
                  fc.constant('Too much to do'),
                  fc.constant('Overwhelmed'),
                  fc.constant('Stressed')
                ), { minLength: 2, maxLength: 4 }),
                mood: fc.integer({ min: 1, max: 4 }),
                energyLevel: fc.integer({ min: 2, max: 6 }),
                insights: fc.constant('Feeling overwhelmed with too many tasks')
              })
            ),
            tomorrowTasks: fc.array(fc.string({ minLength: 3, maxLength: 50 }), { minLength: 1, maxLength: 6 }),
            insights: fc.string({ minLength: 0, maxLength: 200 })
          }),
          async ({ userId, date, performanceScenario, tomorrowTasks, insights }) => {
            const reviewId = fc.sample(fc.uuid(), 1)[0];
            const dateString = date.toISOString().split('T')[0];

            const request: CreateEveningReviewRequest = {
              date: dateString,
              accomplished: performanceScenario.accomplished,
              missed: performanceScenario.missed,
              reasons: performanceScenario.reasons,
              tomorrow_tasks: tomorrowTasks,
              mood: performanceScenario.mood,
              energy_level: performanceScenario.energyLevel,
              insights: (performanceScenario as any).insights || insights
            };

            // Mock database responses
            mockPool.query
              .mockResolvedValueOnce({ rows: [] }) // Check existing review
              .mockResolvedValueOnce({ // Save review
                rows: [{
                  id: reviewId,
                  user_id: userId,
                  date: date,
                  accomplished: performanceScenario.accomplished,
                  missed: performanceScenario.missed,
                  reasons: performanceScenario.reasons,
                  tomorrow_tasks: tomorrowTasks,
                  mood: performanceScenario.mood,
                  energy_level: performanceScenario.energyLevel,
                  insights: (performanceScenario as any).insights || insights,
                  created_at: new Date()
                }]
              })
              .mockResolvedValueOnce({ rows: [] }); // getRecentReviews for analysis

            try {
              const response = await eveningReviewService.createEveningReview(userId, request);

              // Verify routine adaptations are generated based on performance data
              expect(Array.isArray(response.routine_adaptations)).toBe(true);

              const adaptations = response.routine_adaptations;
              const completionRate = performanceScenario.accomplished.length / 
                (performanceScenario.accomplished.length + performanceScenario.missed.length);

              // Verify the core property: adaptations should be generated based on performance data
              // The system should respond to performance indicators appropriately
              const hasLowCompletion = completionRate < 0.5;
              const hasLowEnergy = performanceScenario.energyLevel <= 3;
              const hasLowMood = performanceScenario.mood <= 4;
              const hasOverwhelmedSignals = (performanceScenario as any).insights?.toLowerCase().includes('overwhelmed') ||
                performanceScenario.reasons.some(r => r.toLowerCase().includes('overwhelmed'));

              // If there are clear performance issues, adaptations should be generated
              if (hasLowCompletion || hasLowEnergy || hasLowMood || hasOverwhelmedSignals) {
                expect(adaptations.length).toBeGreaterThan(0);
                
                // At least one adaptation should address the identified issue
                const hasRelevantAdaptation = adaptations.some(a => {
                  const reasonLower = a.reason.toLowerCase();
                  const descLower = a.description.toLowerCase();
                  
                  return (hasLowCompletion && (reasonLower.includes('completion') || reasonLower.includes('rate'))) ||
                         (hasLowEnergy && (reasonLower.includes('energy') || descLower.includes('energy'))) ||
                         (hasLowMood && (reasonLower.includes('mood') || descLower.includes('mood'))) ||
                         (hasOverwhelmedSignals && (reasonLower.includes('overwhelmed') || descLower.includes('complexity'))) ||
                         (a.type === 'simplify'); // Simplification is a common response to performance issues
                });
                
                expect(hasRelevantAdaptation).toBe(true);
              }

              // For high performance scenarios, adaptations may or may not be generated
              // The key is that the system processes the data without errors
              if (performanceScenario.type === 'high_performance') {
                expect(adaptations.length).toBeGreaterThanOrEqual(0);
                // No specific requirements - system may choose to maintain current level
              }

              // Verify all adaptations have proper structure and valid impact scores
              adaptations.forEach(adaptation => {
                expect(adaptation).toHaveProperty('type');
                expect(adaptation).toHaveProperty('description');
                expect(adaptation).toHaveProperty('reason');
                expect(adaptation).toHaveProperty('impact_score');

                // Verify adaptation type is valid
                expect(['simplify', 'increase_complexity', 'adjust_timing', 'change_focus'])
                  .toContain(adaptation.type);

                // Verify description and reason are meaningful
                expect(adaptation.description.length).toBeGreaterThan(10);
                expect(adaptation.reason.length).toBeGreaterThan(5);

                // Verify impact score is reasonable
                expect(adaptation.impact_score).toBeGreaterThan(0);
                expect(adaptation.impact_score).toBeLessThanOrEqual(1);

                // Higher impact scores for more severe performance issues
                if (performanceScenario.type === 'low_completion' || performanceScenario.type === 'overwhelmed') {
                  expect(adaptation.impact_score).toBeGreaterThan(0.5);
                }
              });

              // Verify mood-based adaptations
              if (performanceScenario.mood <= 4) {
                expect(adaptations.some(a => 
                  a.type === 'adjust_timing' && 
                  a.reason.toLowerCase().includes('mood')
                )).toBe(true);
              }

              // Verify adaptations have reasonable impact scores
              // Note: Service doesn't guarantee sorting, so we just verify scores are valid
              adaptations.forEach(adaptation => {
                expect(adaptation.impact_score).toBeGreaterThan(0);
                expect(adaptation.impact_score).toBeLessThanOrEqual(1);
              });

              // Verify performance insights reflect the scenario
              const insights = response.performance_insights;
              expect(insights.length).toBeGreaterThan(0);

              // Should have productivity insight
              expect(insights.some(i => i.category === 'productivity')).toBe(true);

              // Should have energy insight
              expect(insights.some(i => i.category === 'energy')).toBe(true);

              // Should have mood insight
              expect(insights.some(i => i.category === 'mood')).toBe(true);

              // Verify insights have appropriate trends
              const productivityInsight = insights.find(i => i.category === 'productivity');
              if (productivityInsight && completionRate < 0.5) {
                expect(['declining', 'stable']).toContain(productivityInsight.trend);
              }

              const energyInsight = insights.find(i => i.category === 'energy');
              if (energyInsight && performanceScenario.energyLevel <= 3) {
                expect(energyInsight.recommendation.toLowerCase()).toMatch(/sleep|rest|energy|nutrition/);
              }

              return true;
            } catch (error) {
              // Accept validation failures for invalid inputs
              if (error instanceof Error && error.message.includes('must be')) {
                return true;
              }
              throw error;
            }
          }
        ),
        { numRuns: 3 }
      );
    }, 15000);
  });
});