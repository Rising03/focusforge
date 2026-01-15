import * as fc from 'fast-check';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { identityService } from '../services/identityService';
import { IdentityTracker } from '../components/IdentityTracker';
import { EnvironmentDesigner } from '../components/EnvironmentDesigner';
import { IdentityActivitySuggestions } from '../components/IdentityActivitySuggestions';
import { EnvironmentProductivityCorrelations } from '../components/EnvironmentProductivityCorrelations';

// Mock the identity service
jest.mock('../services/identityService');
const mockIdentityService = identityService as jest.Mocked<typeof identityService>;

describe('Identity and Environment Frontend Property-Based Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Property 34: Identity-Based Task Acknowledgment UI', () => {
    /**
     * Feature: student-discipline-system, Property 34: Identity-Based Task Acknowledgment
     * For any completed task, the UI should provide acknowledgment that frames the action as evidence of the user's target identity.
     * Validates: Requirements 14.2
     */
    it('should display identity-based acknowledgments for any task input', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            task: fc.string({ minLength: 1, maxLength: 100 }),
            targetIdentity: fc.string({ minLength: 5, maxLength: 50 }),
            alignmentScore: fc.float({ min: 0, max: 1 })
          }),
          async (testData) => {
            // Mock service responses
            const mockAlignment = {
              alignment: {
                id: 'test-id',
                user_id: 'test-user',
                target_identity: testData.targetIdentity,
                alignment_score: testData.alignmentScore,
                last_calculated: new Date(),
                contributing_activities: [],
                created_at: new Date(),
                updated_at: new Date()
              },
              insights: [`Your identity as a ${testData.targetIdentity} is showing progress`],
              recommendations: ['Keep up the consistent work'],
              trend: 'improving' as const
            };

            const mockAcknowledgment = {
              acknowledgment: {
                id: 'ack-id',
                user_id: 'test-user',
                task: testData.task,
                identity_context: `As a ${testData.targetIdentity}`,
                acknowledgment_message: `Excellent work! This is exactly what a ${testData.targetIdentity} does - taking consistent action on ${testData.task}.`,
                created_at: new Date()
              },
              identity_boost: 0.1
            };

            mockIdentityService.calculateIdentityAlignment.mockResolvedValue(mockAlignment);
            mockIdentityService.acknowledgeTask.mockResolvedValue(mockAcknowledgment);

            render(<IdentityTracker />);

            // Wait for component to load
            await waitFor(() => {
              expect(screen.getByText(testData.targetIdentity)).toBeInTheDocument();
            });

            // Find and fill the task acknowledgment input
            const taskInput = screen.getByPlaceholderText('What did you just complete?');
            const submitButton = screen.getByText('Acknowledge Task');

            fireEvent.change(taskInput, { target: { value: testData.task } });
            fireEvent.click(submitButton);

            // Wait for acknowledgment to appear
            await waitFor(() => {
              const acknowledgmentElement = screen.getByText(mockAcknowledgment.acknowledgment.acknowledgment_message);
              expect(acknowledgmentElement).toBeInTheDocument();
            });

            // Verify the acknowledgment contains identity reference
            const acknowledgmentText = mockAcknowledgment.acknowledgment.acknowledgment_message;
            expect(acknowledgmentText.toLowerCase()).toContain(testData.targetIdentity.toLowerCase());
            expect(acknowledgmentText).toContain(testData.task);

            // Verify service was called correctly
            expect(mockIdentityService.acknowledgeTask).toHaveBeenCalledWith({
              task: testData.task
            });

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });

  describe('Property 35: Identity Alignment Score Display Accuracy', () => {
    /**
     * Feature: student-discipline-system, Property 35: Identity Alignment Score Accuracy
     * For any alignment score, the UI should accurately display the score and provide appropriate visual feedback.
     * Validates: Requirements 14.3
     */
    it('should accurately display alignment scores with appropriate visual indicators', () => {
      fc.assert(
        fc.property(
          fc.record({
            targetIdentity: fc.string({ minLength: 5, maxLength: 50 }),
            alignmentScore: fc.float({ min: 0, max: 1 }),
            trend: fc.oneof(fc.constant('improving'), fc.constant('declining'), fc.constant('stable'))
          }),
          (testData) => {
            const mockAlignment = {
              alignment: {
                id: 'test-id',
                user_id: 'test-user',
                target_identity: testData.targetIdentity,
                alignment_score: testData.alignmentScore,
                last_calculated: new Date(),
                contributing_activities: [],
                created_at: new Date(),
                updated_at: new Date()
              },
              insights: ['Test insight'],
              recommendations: ['Test recommendation'],
              trend: testData.trend
            };

            mockIdentityService.calculateIdentityAlignment.mockResolvedValue(mockAlignment);

            render(<IdentityTracker />);

            // Check that target identity is displayed
            expect(screen.getByText(testData.targetIdentity)).toBeInTheDocument();

            // Check that alignment score is displayed as percentage
            const expectedPercentage = Math.round(testData.alignmentScore * 100);
            expect(screen.getByText(`${expectedPercentage}%`)).toBeInTheDocument();

            // Check that trend indicator is present
            const trendElement = screen.getByText(testData.trend, { exact: false });
            expect(trendElement).toBeInTheDocument();

            // Verify color coding based on score
            const scoreElement = screen.getByText(`${expectedPercentage}%`);
            const scoreClasses = scoreElement.className;

            if (testData.alignmentScore >= 0.8) {
              expect(scoreClasses).toContain('text-green-600');
            } else if (testData.alignmentScore >= 0.6) {
              expect(scoreClasses).toContain('text-yellow-600');
            } else if (testData.alignmentScore >= 0.4) {
              expect(scoreClasses).toContain('text-orange-600');
            } else {
              expect(scoreClasses).toContain('text-red-600');
            }

            return true;
          }
        ),
        { numRuns: 20 }
      );
    });
  });

  describe('Property 36: Identity-Based Activity Suggestions Display', () => {
    /**
     * Feature: student-discipline-system, Property 36: Identity-Based Activity Suggestions
     * For any activity suggestion, the UI should display the identity-based question format and reasoning.
     * Validates: Requirements 14.4
     */
    it('should display identity-based activity suggestions with proper question format', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            targetIdentity: fc.string({ minLength: 5, maxLength: 50 }),
            availableTime: fc.integer({ min: 15, max: 180 }),
            energyLevel: fc.oneof(fc.constant('low'), fc.constant('medium'), fc.constant('high')),
            suggestions: fc.array(
              fc.record({
                id: fc.uuid(),
                activity: fc.string({ minLength: 5, maxLength: 100 }),
                priority: fc.oneof(fc.constant('high'), fc.constant('medium'), fc.constant('low')),
                estimated_duration: fc.integer({ min: 10, max: 120 }),
                identity_alignment_boost: fc.float({ min: 0.1, max: 1 })
              }),
              { minLength: 1, maxLength: 3 }
            )
          }),
          async (testData) => {
            const identityQuestion = `What would a ${testData.targetIdentity.toLowerCase()} do right now?`;
            
            const mockResponse = {
              suggestions: testData.suggestions.map(s => ({
                ...s,
                identity_question: identityQuestion,
                reasoning: `A ${testData.targetIdentity.toLowerCase()} would prioritize this activity.`
              })),
              identity_question: identityQuestion,
              reasoning: 'These activities align with your target identity and current context.'
            };

            mockIdentityService.suggestActivities.mockResolvedValue(mockResponse);

            render(<IdentityActivitySuggestions />);

            // Wait for suggestions to load
            await waitFor(() => {
              expect(screen.getByText(identityQuestion)).toBeInTheDocument();
            });

            // Verify each suggestion is displayed
            testData.suggestions.forEach(suggestion => {
              expect(screen.getByText(suggestion.activity)).toBeInTheDocument();
              expect(screen.getByText(`${suggestion.estimated_duration} min`)).toBeInTheDocument();
              expect(screen.getByText(`+${Math.round(suggestion.identity_alignment_boost * 100)}% alignment`)).toBeInTheDocument();
            });

            // Verify identity question format
            expect(screen.getByText(identityQuestion)).toBeInTheDocument();
            expect(identityQuestion.toLowerCase()).toContain('what would a');
            expect(identityQuestion.toLowerCase()).toContain(testData.targetIdentity.toLowerCase());
            expect(identityQuestion.toLowerCase()).toContain('do');

            return true;
          }
        ),
        { numRuns: 8 }
      );
    }, 30000);
  });

  describe('Property 37: Environment Design Suggestion Display', () => {
    /**
     * Feature: student-discipline-system, Property 37: Environment Design Suggestion Provision
     * For any environment assessment, the UI should display optimization suggestions and scores.
     * Validates: Requirements 15.1, 15.3
     */
    it('should display environment optimization suggestions for any environment type', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            environmentType: fc.oneof(fc.constant('physical'), fc.constant('digital')),
            optimizationScore: fc.float({ min: 0, max: 1 }),
            suggestions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 5 })
          }),
          async (testData) => {
            const mockAssessmentResponse = {
              assessment: {
                id: 'test-id',
                user_id: 'test-user',
                environment_type: testData.environmentType,
                assessment_data: {},
                productivity_correlation: 0.5,
                last_updated: new Date(),
                created_at: new Date()
              },
              suggestions: testData.suggestions,
              optimization_score: testData.optimizationScore
            };

            mockIdentityService.assessEnvironment.mockResolvedValue(mockAssessmentResponse);

            render(<EnvironmentDesigner />);

            // Click on the appropriate tab
            const tabButton = screen.getByText(testData.environmentType === 'physical' ? 'Physical' : 'Digital');
            fireEvent.click(tabButton);

            // Submit assessment (mock form submission)
            const assessButton = screen.getByText(
              testData.environmentType === 'physical' ? 'Assess Physical Environment' : 'Assess Digital Environment'
            );
            fireEvent.click(assessButton);

            // Wait for results to appear
            await waitFor(() => {
              const scoreText = `${Math.round(testData.optimizationScore * 100)}%`;
              expect(screen.getByText(scoreText)).toBeInTheDocument();
            });

            // Verify suggestions are displayed
            testData.suggestions.forEach(suggestion => {
              expect(screen.getByText(suggestion)).toBeInTheDocument();
            });

            // Verify optimization score is displayed
            const expectedScore = Math.round(testData.optimizationScore * 100);
            expect(screen.getByText(`${expectedScore}%`)).toBeInTheDocument();

            return true;
          }
        ),
        { numRuns: 6 }
      );
    }, 30000);
  });

  describe('Property 38: Distraction Report UI Functionality', () => {
    /**
     * Feature: student-discipline-system, Property 38: Distraction Response and Friction Identification
     * For any distraction report, the UI should display solutions and friction points.
     * Validates: Requirements 15.2
     */
    it('should display distraction solutions for any reported distraction', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            distractionType: fc.string({ minLength: 3, maxLength: 50 }),
            context: fc.string({ minLength: 5, maxLength: 200 }),
            immediateSolutions: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 3 }),
            longTermStrategies: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 1, maxLength: 3 })
          }),
          async (testData) => {
            const mockDistractionResponse = {
              report: {
                id: 'test-id',
                user_id: 'test-user',
                distraction_type: testData.distractionType,
                context: testData.context,
                frequency: 1,
                impact_level: 'medium' as const,
                suggested_solutions: [...testData.immediateSolutions, ...testData.longTermStrategies],
                friction_points: [],
                created_at: new Date()
              },
              immediate_solutions: testData.immediateSolutions,
              long_term_strategies: testData.longTermStrategies
            };

            mockIdentityService.reportDistraction.mockResolvedValue(mockDistractionResponse);

            render(<EnvironmentDesigner />);

            // Click on distractions tab
            const distractionsTab = screen.getByText('Distractions');
            fireEvent.click(distractionsTab);

            // Fill out distraction form
            const typeInput = screen.getByPlaceholderText(/distraction type/i);
            const contextInput = screen.getByPlaceholderText(/describe when and how/i);
            const reportButton = screen.getByText('Report Distraction');

            fireEvent.change(typeInput, { target: { value: testData.distractionType } });
            fireEvent.change(contextInput, { target: { value: testData.context } });
            fireEvent.click(reportButton);

            // Wait for results to appear
            await waitFor(() => {
              expect(screen.getByText('Distraction Solutions')).toBeInTheDocument();
            });

            // Verify immediate solutions are displayed
            testData.immediateSolutions.forEach(solution => {
              expect(screen.getByText(solution)).toBeInTheDocument();
            });

            // Verify long-term strategies are displayed
            testData.longTermStrategies.forEach(strategy => {
              expect(screen.getByText(strategy)).toBeInTheDocument();
            });

            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);
  });

  describe('Property 39: Environment-Productivity Correlation Display', () => {
    /**
     * Feature: student-discipline-system, Property 39: Environment-Productivity Correlation Tracking
     * For any correlation data, the UI should display correlations with appropriate visual indicators.
     * Validates: Requirements 15.4, 15.5
     */
    it('should display environment correlations with proper visual indicators', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            correlations: fc.array(
              fc.record({
                id: fc.uuid(),
                user_id: fc.constant('test-user'),
                environment_factor: fc.string({ minLength: 3, maxLength: 20 }),
                factor_value: fc.string({ minLength: 1, maxLength: 20 }),
                productivity_impact: fc.float({ min: 0, max: 1 }),
                confidence_level: fc.float({ min: 0.1, max: 1 }),
                sample_size: fc.integer({ min: 1, max: 50 }),
                last_updated: fc.constant(new Date())
              }),
              { minLength: 1, maxLength: 5 }
            ),
            insights: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 0, maxLength: 3 }),
            recommendations: fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 0, maxLength: 3 })
          }),
          async (testData) => {
            const mockCorrelationResponse = {
              correlations: testData.correlations,
              insights: testData.insights,
              optimization_recommendations: testData.recommendations
            };

            mockIdentityService.getEnvironmentCorrelations.mockResolvedValue(mockCorrelationResponse);

            render(<EnvironmentProductivityCorrelations />);

            // Wait for correlations to load
            await waitFor(() => {
              if (testData.correlations.length > 0) {
                expect(screen.getByText('Environment-Productivity Correlations')).toBeInTheDocument();
              }
            });

            // Verify each correlation is displayed
            testData.correlations.forEach(correlation => {
              expect(screen.getByText(correlation.environment_factor)).toBeInTheDocument();
              expect(screen.getByText(correlation.factor_value)).toBeInTheDocument();
              
              const impactPercentage = `${Math.round(correlation.productivity_impact * 100)}%`;
              expect(screen.getByText(impactPercentage)).toBeInTheDocument();
              
              const confidencePercentage = `${Math.round(correlation.confidence_level * 100)}% confidence`;
              expect(screen.getByText(confidencePercentage)).toBeInTheDocument();
            });

            // Verify insights are displayed
            testData.insights.forEach(insight => {
              expect(screen.getByText(insight)).toBeInTheDocument();
            });

            // Verify recommendations are displayed
            testData.recommendations.forEach(recommendation => {
              expect(screen.getByText(recommendation)).toBeInTheDocument();
            });

            return true;
          }
        ),
        { numRuns: 5 }
      );
    }, 30000);
  });
});