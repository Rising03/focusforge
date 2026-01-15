import * as fc from 'fast-check';
import request from 'supertest';
import app from '../index';
import { IdentityService } from '../services/identityService';
import { ProfileService } from '../services/profileService';
import pool from '../config/database';

// Mock the database pool
jest.mock('../config/database', () => ({
  query: jest.fn()
}));

describe('Identity and Environment Property-Based Tests', () => {
  let identityService: IdentityService;
  let profileService: ProfileService;

  beforeAll(() => {
    identityService = new IdentityService();
    profileService = new ProfileService();
  });

  describe('Property 34: Identity-Based Task Acknowledgment', () => {
    /**
     * Feature: student-discipline-system, Property 34: Identity-Based Task Acknowledgment
     * For any completed task, the system should provide acknowledgment that frames the action as evidence of the user's target identity.
     * Validates: Requirements 14.2
     */
    it('should generate identity-based acknowledgments for any task', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            task: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            targetIdentity: fc.oneof(
              fc.constant('disciplined student'),
              fc.constant('focused learner'),
              fc.constant('productive developer'),
              fc.constant('dedicated researcher'),
              fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5)
            ).filter(s => s.trim().length >= 5),
            activityType: fc.option(fc.oneof(
              fc.constant('study'),
              fc.constant('practice'),
              fc.constant('work'),
              fc.constant('exercise')
            ), { nil: undefined })
          }),
          async (testData) => {
            // Mock user profile for testing
            const mockProfile = {
              profile: {
                target_identity: testData.targetIdentity,
                academic_goals: ['test goal'],
                skill_goals: ['test skill'],
                wake_up_time: '07:00',
                sleep_time: '23:00',
                available_hours: 8,
                energy_pattern: [],
                detailed_profile: {}
              }
            };

            // Mock the profile service method on the identity service's internal instance
            jest.spyOn(identityService['profileService'], 'getProfile').mockResolvedValue(mockProfile as any);

            // Mock the database query for task acknowledgment
            const mockAcknowledgment = {
              id: 'test-id',
              user_id: 'test-user-id',
              task: testData.task,
              identity_context: `As a ${testData.targetIdentity}`,
              acknowledgment_message: `Excellent work! This is exactly what a ${testData.targetIdentity.toLowerCase()} does - taking consistent action on ${testData.task}.`,
              created_at: new Date()
            };
            
            (pool.query as jest.Mock).mockResolvedValue({
              rows: [mockAcknowledgment]
            });

            const acknowledgment = await identityService.acknowledgeTask('test-user-id', {
              task: testData.task,
              activity_type: testData.activityType
            });

            // Acknowledgment should exist and contain required fields
            expect(acknowledgment).toBeDefined();
            expect(acknowledgment.task).toBe(testData.task);
            expect(acknowledgment.identity_context).toContain(testData.targetIdentity);
            expect(acknowledgment.acknowledgment_message).toBeDefined();
            expect(acknowledgment.acknowledgment_message.length).toBeGreaterThan(0);

            // Message should reference the target identity
            expect(acknowledgment.acknowledgment_message.toLowerCase())
              .toContain(testData.targetIdentity.toLowerCase());

            // Message should reference the task
            expect(acknowledgment.acknowledgment_message).toContain(testData.task);

            // Message should be encouraging/positive
            const positiveWords = ['excellent', 'great', 'perfect', 'good', 'evidence', 'shows', 'demonstrates'];
            const hasPositiveLanguage = positiveWords.some(word => 
              acknowledgment.acknowledgment_message.toLowerCase().includes(word)
            );
            expect(hasPositiveLanguage).toBe(true);

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 35: Identity Alignment Score Accuracy', () => {
    /**
     * Feature: student-discipline-system, Property 35: Identity Alignment Score Accuracy
     * For any user behavior data, the identity alignment score should accurately reflect consistency with target identity behaviors.
     * Validates: Requirements 14.3
     */
    it('should calculate accurate alignment scores based on activity patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            targetIdentity: fc.oneof(
              fc.constant('disciplined student'),
              fc.constant('focused developer'),
              fc.constant('dedicated researcher')
            ),
            activities: fc.array(
              fc.record({
                activity: fc.oneof(
                  fc.constant('study mathematics'),
                  fc.constant('code review'),
                  fc.constant('research paper'),
                  fc.constant('social media'),
                  fc.constant('deep work session'),
                  fc.constant('entertainment')
                ),
                duration: fc.integer({ min: 5, max: 180 }),
                focus_quality: fc.oneof(fc.constant('high'), fc.constant('medium'), fc.constant('low'))
              }),
              { minLength: 1, maxLength: 10 }
            )
          }),
          async (testData) => {
            // Mock profile and activity data
            const mockProfile = {
              profile: {
                target_identity: testData.targetIdentity,
                academic_goals: ['test goal'],
                skill_goals: ['test skill'],
                wake_up_time: '07:00',
                sleep_time: '23:00',
                available_hours: 8,
                energy_pattern: [],
                detailed_profile: {}
              }
            };

            const mockSessions = testData.activities.map((activity, index) => ({
              id: `session-${index}`,
              user_id: 'test-user',
              activity: activity.activity,
              duration: activity.duration,
              focus_quality: activity.focus_quality as 'high' | 'medium' | 'low',
              distractions: 0,
              start_time: new Date(),
              end_time: new Date(),
              created_at: new Date(),
              notes: undefined
            }));

            // Mock service methods
            jest.spyOn(identityService['profileService'], 'getProfile').mockResolvedValue(mockProfile as any);
            jest.spyOn(identityService['activityService'], 'getActivityHistory')
              .mockResolvedValue({ sessions: mockSessions, totalCount: mockSessions.length });

            // Mock database query for identity alignment storage
            const mockAlignment = {
              id: 'test-alignment-id',
              user_id: 'test-user-id',
              target_identity: testData.targetIdentity,
              alignment_score: 0.75, // Will be calculated properly by the service
              last_calculated: new Date(),
              contributing_activities: JSON.stringify([]),
              created_at: new Date(),
              updated_at: new Date()
            };
            
            (pool.query as jest.Mock).mockResolvedValue({
              rows: [mockAlignment]
            });

            const alignment = await identityService.calculateIdentityAlignment('test-user-id');

            // Alignment score should be between 0 and 1
            expect(alignment.alignment_score).toBeGreaterThanOrEqual(0);
            expect(alignment.alignment_score).toBeLessThanOrEqual(1);

            // Score should reflect activity alignment
            const highAlignmentActivities = testData.activities.filter(a => 
              a.activity.includes('study') || a.activity.includes('research') || a.activity.includes('deep work')
            );
            const lowAlignmentActivities = testData.activities.filter(a => 
              a.activity.includes('social media') || a.activity.includes('entertainment')
            );

            if (highAlignmentActivities.length > lowAlignmentActivities.length) {
              expect(alignment.alignment_score).toBeGreaterThan(0.4);
            }

            // Contributing activities should be analyzed
            expect(alignment.contributing_activities).toBeDefined();
            expect(Array.isArray(alignment.contributing_activities)).toBe(true);

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 36: Identity-Based Activity Suggestions', () => {
    /**
     * Feature: student-discipline-system, Property 36: Identity-Based Activity Suggestions
     * For any activity suggestion, the system should include the identity-based question format "What would a [target identity] do in this situation?"
     * Validates: Requirements 14.4
     */
    it('should generate identity-based activity suggestions with proper question format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            targetIdentity: fc.oneof(
              fc.constant('disciplined student'),
              fc.constant('focused learner'),
              fc.constant('productive developer'),
              fc.constant('dedicated researcher'),
              fc.string({ minLength: 5, maxLength: 50 }).filter(s => s.trim().length >= 5 && /[a-zA-Z]/.test(s))
            ),
            availableTime: fc.integer({ min: 10, max: 240 }),
            energyLevel: fc.oneof(fc.constant('low'), fc.constant('medium'), fc.constant('high')),
            context: fc.option(fc.string({ minLength: 1, maxLength: 100 }), { nil: undefined })
          }),
          async (testData) => {
            // Mock profile
            const mockProfile = {
              profile: {
                target_identity: testData.targetIdentity,
                academic_goals: ['mathematics', 'physics'],
                skill_goals: ['programming', 'research'],
                wake_up_time: '07:00',
                sleep_time: '23:00',
                available_hours: 8,
                energy_pattern: [],
                detailed_profile: {}
              }
            };

            jest.spyOn(identityService['profileService'], 'getProfile').mockResolvedValue(mockProfile as any);

            // Mock database query for activity suggestions storage (if needed)
            (pool.query as jest.Mock).mockResolvedValue({
              rows: []
            });

            const suggestions = await identityService.suggestIdentityBasedActivities('test-user-id', {
              available_time: testData.availableTime,
              energy_level: testData.energyLevel as 'low' | 'medium' | 'high',
              context: testData.context
            });

            // Should return array of suggestions
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeGreaterThan(0);

            suggestions.forEach(suggestion => {
              // Each suggestion should have required fields
              expect(suggestion.activity).toBeDefined();
              expect(suggestion.identity_question).toBeDefined();
              expect(suggestion.reasoning).toBeDefined();
              expect(suggestion.priority).toMatch(/^(high|medium|low)$/);
              expect(suggestion.estimated_duration).toBeGreaterThan(0);
              expect(suggestion.identity_alignment_boost).toBeGreaterThanOrEqual(0);
              expect(suggestion.identity_alignment_boost).toBeLessThanOrEqual(1);

              // Identity question should follow the required format
              // Escape special regex characters in target identity
              const escapedIdentity = testData.targetIdentity.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const expectedQuestionPattern = new RegExp(
                `what would a.*${escapedIdentity}.*do`,
                'i'
              );
              expect(suggestion.identity_question).toMatch(expectedQuestionPattern);

              // Reasoning should reference the target identity
              expect(suggestion.reasoning.toLowerCase())
                .toContain(testData.targetIdentity.toLowerCase());

              // Duration should be reasonable for available time
              expect(suggestion.estimated_duration).toBeLessThanOrEqual(testData.availableTime + 30);
            });

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 37: Environment Design Suggestion Provision', () => {
    /**
     * Feature: student-discipline-system, Property 37: Environment Design Suggestion Provision
     * For any environment design request, the system should provide suggestions based on Deep Work principles for both physical and digital environments.
     * Validates: Requirements 15.1, 15.3
     */
    it('should provide environment optimization suggestions for any environment type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            environmentType: fc.oneof(fc.constant('physical' as const), fc.constant('digital' as const)),
            environmentData: fc.record({
              location: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
              noise_level: fc.option(fc.oneof(
                fc.constant('silent' as const), fc.constant('quiet' as const), 
                fc.constant('moderate' as const), fc.constant('noisy' as const)
              ), { nil: undefined }),
              lighting: fc.option(fc.oneof(
                fc.constant('bright' as const), fc.constant('moderate' as const), fc.constant('dim' as const)
              ), { nil: undefined }),
              organization_level: fc.option(fc.oneof(
                fc.constant('minimal' as const), fc.constant('organized' as const), fc.constant('cluttered' as const)
              ), { nil: undefined }),
              digital_distractions: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }), { nil: undefined }),
              physical_distractions: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }), { nil: undefined }),
              focus_aids: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 30 }), { maxLength: 5 }), { nil: undefined })
            })
          }),
          async (testData) => {
            // Mock database query for environment assessment
            const mockAssessment = {
              id: 'test-assessment-id',
              user_id: 'test-user-id',
              environment_type: testData.environmentType,
              assessment_data: JSON.stringify(testData.environmentData),
              productivity_correlation: 0.5,
              last_updated: new Date(),
              created_at: new Date()
            };
            
            (pool.query as jest.Mock).mockResolvedValue({
              rows: [mockAssessment]
            });

            const assessment = await identityService.assessEnvironment('test-user-id', {
              environment_type: testData.environmentType,
              environment_data: testData.environmentData
            });

            // Assessment should be created
            expect(assessment).toBeDefined();
            expect(assessment.environment_type).toBe(testData.environmentType);
            expect(assessment.assessment_data).toEqual(testData.environmentData);
            expect(assessment.productivity_correlation).toBeGreaterThanOrEqual(0);
            expect(assessment.productivity_correlation).toBeLessThanOrEqual(1);

            // Should generate suggestions based on environment type
            // This would be tested via the controller endpoint
            const response = await request(app)
              .post('/api/identity/assess-environment')
              .set('Authorization', 'Bearer test-token')
              .send({
                environment_type: testData.environmentType,
                environment_data: testData.environmentData
              });

            if (response.status === 200) {
              expect(response.body.data.assessment).toBeDefined();
              expect(response.body.data.suggestions).toBeDefined();
              expect(Array.isArray(response.body.data.suggestions)).toBe(true);
              expect(response.body.data.optimization_score).toBeGreaterThanOrEqual(0);
              expect(response.body.data.optimization_score).toBeLessThanOrEqual(1);
            }

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 38: Distraction Response and Friction Identification', () => {
    /**
     * Feature: student-discipline-system, Property 38: Distraction Response and Friction Identification
     * For any reported distraction, the system should help identify specific friction points and suggest elimination strategies.
     * Validates: Requirements 15.2
     */
    it('should identify friction points and solutions for any distraction type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            distractionType: fc.oneof(
              fc.constant('phone notifications'),
              fc.constant('social media'),
              fc.constant('noise'),
              fc.constant('internet browsing'),
              fc.constant('email'),
              fc.string({ minLength: 3, maxLength: 50 })
            ),
            context: fc.string({ minLength: 5, maxLength: 200 }),
            impactLevel: fc.oneof(fc.constant('low' as const), fc.constant('medium' as const), fc.constant('high' as const))
          }),
          async (testData) => {
            const report = await identityService.reportDistraction('test-user-id', {
              distraction_type: testData.distractionType,
              context: testData.context,
              impact_level: testData.impactLevel
            });

            // Report should be created with required fields
            expect(report).toBeDefined();
            
            // If distraction type was whitespace-only, it should be replaced with default
            const expectedDistractionType = testData.distractionType.trim().length === 0 
              ? 'general distraction' 
              : testData.distractionType;
            expect(report.distraction_type).toBe(expectedDistractionType);
            
            // Context should be converted to undefined if it was whitespace-only
            const expectedContext = testData.context.trim().length === 0 
              ? undefined 
              : testData.context;
            expect(report.context).toBe(expectedContext);
            
            expect(report.impact_level).toBe(testData.impactLevel);

            // Should provide suggested solutions
            expect(report.suggested_solutions).toBeDefined();
            expect(Array.isArray(report.suggested_solutions)).toBe(true);
            expect(report.suggested_solutions.length).toBeGreaterThan(0);

            // Should identify friction points
            expect(report.friction_points).toBeDefined();
            expect(Array.isArray(report.friction_points)).toBe(true);

            // Each friction point should have required structure
            report.friction_points.forEach(point => {
              expect(point.description).toBeDefined();
              expect(point.elimination_strategy).toBeDefined();
              expect(point.difficulty).toMatch(/^(easy|medium|hard)$/);
              expect(point.estimated_impact).toBeGreaterThanOrEqual(0);
              expect(point.estimated_impact).toBeLessThanOrEqual(1);
            });

            // Solutions should be actionable (contain verbs)
            const actionVerbs = ['use', 'set', 'enable', 'disable', 'place', 'remove', 'block', 'schedule', 'create'];
            report.suggested_solutions.forEach(solution => {
              const hasActionVerb = actionVerbs.some(verb => 
                solution.toLowerCase().includes(verb)
              );
              expect(hasActionVerb).toBe(true);
            });

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 39: Environment-Productivity Correlation Tracking', () => {
    /**
     * Feature: student-discipline-system, Property 39: Environment-Productivity Correlation Tracking
     * For any work session with environment data, the system should track correlations between environment factors and productivity outcomes.
     * Validates: Requirements 15.4, 15.5
     */
    it('should track and update environment-productivity correlations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            environmentFactor: fc.oneof(
              fc.constant('noise_level'),
              fc.constant('lighting'),
              fc.constant('temperature'),
              fc.constant('organization'),
              fc.string({ minLength: 3, maxLength: 30 })
            ),
            factorValue: fc.string({ minLength: 1, maxLength: 30 }),
            productivityImpact: fc.float({ min: 0, max: 1 })
          }),
          async (testData) => {
            // Track correlation (should not throw)
            await expect(
              identityService.trackEnvironmentProductivityCorrelation(
                'test-user-id',
                testData.environmentFactor,
                testData.factorValue,
                testData.productivityImpact
              )
            ).resolves.not.toThrow();

            // Get correlations to verify tracking
            const correlations = await identityService.getEnvironmentProductivityCorrelations('test-user-id');

            // Should return array
            expect(Array.isArray(correlations)).toBe(true);

            // If correlations exist, they should have proper structure
            correlations.forEach(correlation => {
              expect(correlation.environment_factor).toBeDefined();
              expect(correlation.factor_value).toBeDefined();
              expect(correlation.productivity_impact).toBeGreaterThanOrEqual(0);
              expect(correlation.productivity_impact).toBeLessThanOrEqual(1);
              expect(correlation.confidence_level).toBeGreaterThanOrEqual(0);
              expect(correlation.confidence_level).toBeLessThanOrEqual(1);
              expect(correlation.sample_size).toBeGreaterThan(0);
            });

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);

    it('should update existing correlations when tracking repeated factors', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            environmentFactor: fc.string({ minLength: 3, maxLength: 20 }),
            factorValue: fc.string({ minLength: 1, maxLength: 20 }),
            impacts: fc.array(fc.float({ min: 0, max: 1 }), { minLength: 2, maxLength: 5 })
          }),
          async (testData) => {
            // Track multiple impacts for the same factor-value combination
            for (const impact of testData.impacts) {
              await identityService.trackEnvironmentProductivityCorrelation(
                'test-user-id',
                testData.environmentFactor,
                testData.factorValue,
                impact
              );
            }

            const correlations = await identityService.getEnvironmentProductivityCorrelations('test-user-id');
            
            // Should have correlations
            expect(correlations.length).toBeGreaterThan(0);

            // Find the correlation for our test factor
            const testCorrelation = correlations.find(c => 
              c.environment_factor === testData.environmentFactor && 
              c.factor_value === testData.factorValue
            );

            if (testCorrelation) {
              // Sample size should reflect multiple tracking events
              expect(testCorrelation.sample_size).toBeGreaterThanOrEqual(testData.impacts.length);
              
              // Confidence should increase with sample size
              expect(testCorrelation.confidence_level).toBeGreaterThan(0);
              
              // Productivity impact should be within reasonable range of inputs
              const avgImpact = testData.impacts.reduce((sum, impact) => sum + impact, 0) / testData.impacts.length;
              expect(Math.abs(testCorrelation.productivity_impact - avgImpact)).toBeLessThan(0.5);
            }

            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});