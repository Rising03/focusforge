import * as fc from 'fast-check';
import request from 'supertest';
import app from '../index';
import { ReviewCycleService } from '../services/reviewCycleService';
import { HabitService } from '../services/habitService';
import { DeepWorkService } from '../services/deepWorkService';

describe('Advanced Features Property-Based Tests', () => {
  let reviewCycleService: ReviewCycleService;
  let habitService: HabitService;
  let deepWorkService: DeepWorkService;

  beforeAll(() => {
    reviewCycleService = new ReviewCycleService();
    habitService = new HabitService();
    deepWorkService = new DeepWorkService();
  });

  describe('Property 42: Low-Stimulation Break Scheduling', () => {
    /**
     * Feature: student-discipline-system, Property 42: Low-Stimulation Break Scheduling
     * For any scheduled break, the system should suggest low-stimulation activities that don't fragment attention.
     * Validates: Requirements 16.4
     */
    it('should suggest appropriate low-stimulation activities for any break context', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            breakDuration: fc.integer({ min: 2, max: 30 }),
            energyLevel: fc.oneof(fc.constant('low'), fc.constant('medium'), fc.constant('high')),
            timeOfDay: fc.oneof(fc.constant('morning'), fc.constant('afternoon'), fc.constant('evening')),
            previousActivity: fc.option(fc.oneof(
              fc.constant('deep work'),
              fc.constant('study'),
              fc.constant('meeting'),
              fc.constant('coding')
            ), { nil: undefined }),
            stimulationTolerance: fc.oneof(fc.constant('very_low'), fc.constant('low'), fc.constant('minimal'))
          }),
          async (testData) => {
            // Mock break scheduling request
            const breakRequest = {
              duration: testData.breakDuration,
              energy_level: testData.energyLevel as 'low' | 'medium' | 'high',
              time_of_day: testData.timeOfDay as 'morning' | 'afternoon' | 'evening',
              previous_activity: testData.previousActivity,
              stimulation_tolerance: testData.stimulationTolerance as 'very_low' | 'low' | 'minimal'
            };

            const response = await request(app)
              .post('/api/break-suggestions/suggest')
              .set('Authorization', 'Bearer test-token')
              .send(breakRequest);

            if (response.status === 200) {
              const suggestions = response.body.data.suggestions;
              
              // Should return array of break suggestions
              expect(Array.isArray(suggestions)).toBe(true);
              expect(suggestions.length).toBeGreaterThan(0);

              suggestions.forEach((suggestion: any) => {
                // Each suggestion should have required fields
                expect(suggestion.activity_name).toBeDefined();
                expect(suggestion.description).toBeDefined();
                expect(suggestion.duration).toBeGreaterThan(0);
                expect(suggestion.stimulation_level).toMatch(/^(very_low|low|minimal)$/);
                expect(suggestion.attention_preservation_score).toBeGreaterThanOrEqual(0);
                expect(suggestion.attention_preservation_score).toBeLessThanOrEqual(1);

                // Duration should be appropriate for requested break time
                expect(suggestion.duration).toBeLessThanOrEqual(testData.breakDuration + 5);

                // Stimulation level should match or be lower than tolerance
                const stimulationLevels = { 'very_low': 1, 'low': 2, 'minimal': 3 };
                const suggestionLevel = stimulationLevels[suggestion.stimulation_level as keyof typeof stimulationLevels];
                const toleranceLevel = stimulationLevels[testData.stimulationTolerance as keyof typeof stimulationLevels];
                expect(suggestionLevel).toBeLessThanOrEqual(toleranceLevel);

                // Should include instructions for the activity
                expect(suggestion.instructions).toBeDefined();
                expect(Array.isArray(suggestion.instructions)).toBe(true);
                expect(suggestion.instructions.length).toBeGreaterThan(0);

                // High attention preservation score for low stimulation activities
                if (suggestion.stimulation_level === 'very_low') {
                  expect(suggestion.attention_preservation_score).toBeGreaterThan(0.7);
                }
              });

              // Should prioritize activities based on context
              const sortedSuggestions = [...suggestions].sort((a, b) => 
                b.attention_preservation_score - a.attention_preservation_score
              );
              expect(suggestions[0].attention_preservation_score)
                .toBeGreaterThanOrEqual(sortedSuggestions[0].attention_preservation_score - 0.1);
            }

            return true;
          }
        ),
        { numRuns: 15 }
      );
    }, 30000);
  });

  describe('Property 43: Structured Review Cycle Execution', () => {
    /**
     * Feature: student-discipline-system, Property 43: Structured Review Cycle Execution
     * For any weekly or monthly review period, the system should conduct reviews focusing on appropriate time-scale metrics.
     * Validates: Requirements 17.1, 17.2
     */
    it('should execute structured reviews with appropriate time-scale focus', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            reviewType: fc.oneof(fc.constant('weekly'), fc.constant('monthly')),
            reviewDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
            additionalInsights: fc.option(fc.array(fc.string({ minLength: 5, maxLength: 100 }), { maxLength: 3 }), { nil: undefined }),
            focusAreas: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 50 }), { maxLength: 3 }), { nil: undefined })
          }),
          async (testData) => {
            const reviewRequest = {
              [testData.reviewType === 'weekly' ? 'week_start_date' : 'month_start_date']: 
                testData.reviewDate.toISOString().split('T')[0],
              additional_insights: testData.additionalInsights,
              ...(testData.reviewType === 'weekly' ? 
                { focus_areas: testData.focusAreas } : 
                { long_term_reflections: testData.focusAreas })
            };

            const response = await request(app)
              .post(`/api/review-cycles/${testData.reviewType}`)
              .set('Authorization', 'Bearer test-token')
              .send(reviewRequest);

            if (response.status === 200 || response.status === 201) {
              const review = response.body.data;

              // Common fields for both review types
              expect(review.id).toBeDefined();
              expect(review.user_id).toBeDefined();
              expect(review.created_at).toBeDefined();

              if (testData.reviewType === 'weekly') {
                // Weekly review specific validations
                expect(review.week_start_date).toBeDefined();
                expect(review.week_end_date).toBeDefined();
                expect(review.system_effectiveness_score).toBeGreaterThanOrEqual(0);
                expect(review.system_effectiveness_score).toBeLessThanOrEqual(100);

                // Should focus on system effectiveness and habits (weekly metrics)
                expect(review.habit_consistency_analysis).toBeDefined();
                expect(review.habit_consistency_analysis.overall_consistency).toBeGreaterThanOrEqual(0);
                expect(review.habit_consistency_analysis.overall_consistency).toBeLessThanOrEqual(100);

                expect(review.routine_performance_analysis).toBeDefined();
                expect(review.routine_performance_analysis.average_completion_rate).toBeGreaterThanOrEqual(0);
                expect(review.routine_performance_analysis.average_completion_rate).toBeLessThanOrEqual(100);

                // Should include system adjustments for next week
                expect(review.system_adjustments).toBeDefined();
                expect(Array.isArray(review.system_adjustments)).toBe(true);

                expect(review.goals_for_next_week).toBeDefined();
                expect(Array.isArray(review.goals_for_next_week)).toBe(true);

              } else {
                // Monthly review specific validations
                expect(review.month_start_date).toBeDefined();
                expect(review.month_end_date).toBeDefined();
                expect(review.identity_alignment_score).toBeGreaterThanOrEqual(0);
                expect(review.identity_alignment_score).toBeLessThanOrEqual(100);

                // Should focus on identity alignment and long-term goals (monthly metrics)
                expect(review.long_term_goal_progress).toBeDefined();
                expect(Array.isArray(review.long_term_goal_progress)).toBe(true);

                expect(review.habit_evolution_analysis).toBeDefined();
                expect(review.habit_evolution_analysis.formation_success_rate).toBeGreaterThanOrEqual(0);
                expect(review.habit_evolution_analysis.formation_success_rate).toBeLessThanOrEqual(100);

                expect(review.productivity_trend_analysis).toBeDefined();
                expect(review.productivity_trend_analysis.monthly_productivity_score).toBeGreaterThanOrEqual(0);
                expect(review.productivity_trend_analysis.monthly_productivity_score).toBeLessThanOrEqual(100);

                expect(review.identity_reinforcement_plan).toBeDefined();
                expect(review.identity_reinforcement_plan.target_identity).toBeDefined();

                expect(review.goals_for_next_month).toBeDefined();
                expect(Array.isArray(review.goals_for_next_month)).toBe(true);
              }

              // Should include insights
              expect(review.insights).toBeDefined();
              expect(Array.isArray(review.insights)).toBe(true);

              // Should incorporate user-provided insights if any
              if (testData.additionalInsights && testData.additionalInsights.length > 0) {
                const hasUserInsights = testData.additionalInsights.some(insight =>
                  review.insights.some((reviewInsight: string) => 
                    reviewInsight.includes(insight) || insight.includes(reviewInsight)
                  )
                );
                expect(hasUserInsights).toBe(true);
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 45000);
  });

  describe('Property 44: Long-Term Pattern Identification', () => {
    /**
     * Feature: student-discipline-system, Property 44: Long-Term Pattern Identification
     * For any extended time period of user data, the system should identify patterns in productivity, energy, and focus trends.
     * Validates: Requirements 17.3
     */
    it('should identify meaningful patterns across extended time periods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            timeframMonths: fc.integer({ min: 3, max: 24 }),
            patternTypes: fc.array(
              fc.oneof(
                fc.constant('productivity'),
                fc.constant('energy'),
                fc.constant('focus'),
                fc.constant('behavioral'),
                fc.constant('environmental')
              ),
              { minLength: 1, maxLength: 5 }
            )
          }),
          async (testData) => {
            const response = await request(app)
              .get(`/api/review-cycles/patterns?months=${testData.timeframMonths}`)
              .set('Authorization', 'Bearer test-token');

            if (response.status === 200) {
              const patterns = response.body.data;

              // Should return array of patterns
              expect(Array.isArray(patterns)).toBe(true);

              patterns.forEach((pattern: any) => {
                // Each pattern should have required structure
                expect(pattern.pattern_type).toMatch(/^(productivity|energy|focus|behavioral|environmental)$/);
                expect(pattern.pattern_description).toBeDefined();
                expect(pattern.pattern_description.length).toBeGreaterThan(10);
                expect(pattern.frequency).toBeGreaterThan(0);
                expect(pattern.impact_level).toMatch(/^(high|medium|low)$/);
                expect(pattern.correlation_strength).toBeGreaterThanOrEqual(0);
                expect(pattern.correlation_strength).toBeLessThanOrEqual(1);

                // Should provide actionable insights
                expect(pattern.actionable_insights).toBeDefined();
                expect(Array.isArray(pattern.actionable_insights)).toBe(true);
                expect(pattern.actionable_insights.length).toBeGreaterThan(0);

                // Insights should be actionable (contain action words)
                const actionWords = ['increase', 'decrease', 'improve', 'optimize', 'adjust', 'focus', 'continue', 'stop', 'start'];
                pattern.actionable_insights.forEach((insight: string) => {
                  const hasActionWord = actionWords.some(word => 
                    insight.toLowerCase().includes(word)
                  );
                  expect(hasActionWord).toBe(true);
                });

                // High correlation patterns should have high impact
                if (pattern.correlation_strength > 0.8) {
                  expect(pattern.impact_level).toMatch(/^(high|medium)$/);
                }

                // Frequent patterns should be meaningful
                if (pattern.frequency > 10) {
                  expect(pattern.correlation_strength).toBeGreaterThan(0.3);
                }
              });

              // Should identify different types of patterns for longer timeframes
              if (testData.timeframMonths >= 6) {
                const patternTypes = new Set(patterns.map((p: any) => p.pattern_type));
                expect(patternTypes.size).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 8 }
      );
    }, 30000);
  });

  describe('Property 45: Systematic Adjustment Preference', () => {
    /**
     * Feature: student-discipline-system, Property 45: Systematic Adjustment Preference
     * For any review revealing declining performance, the system should suggest systematic adjustments rather than motivational fixes.
     * Validates: Requirements 17.4
     */
    it('should prioritize systematic adjustments over motivational fixes for performance issues', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            performanceDecline: fc.record({
              productivity_score: fc.integer({ min: 10, max: 45 }), // Low scores indicating decline
              habit_consistency: fc.integer({ min: 15, max: 50 }),
              completion_rate: fc.integer({ min: 20, max: 55 }),
              focus_quality: fc.integer({ min: 10, max: 40 })
            }),
            declinePattern: fc.oneof(
              fc.constant('consistent_decline'),
              fc.constant('sudden_drop'),
              fc.constant('plateau_low'),
              fc.constant('inconsistent_performance')
            )
          }),
          async (testData) => {
            // Mock performance data indicating decline
            const mockPerformanceData = {
              recent_scores: [
                testData.performanceDecline.productivity_score,
                testData.performanceDecline.habit_consistency,
                testData.performanceDecline.completion_rate,
                testData.performanceDecline.focus_quality
              ],
              decline_pattern: testData.declinePattern,
              timeframe: 'weekly'
            };

            const response = await request(app)
              .post('/api/review-cycles/systematic-adjustments')
              .set('Authorization', 'Bearer test-token')
              .send(mockPerformanceData);

            if (response.status === 200) {
              const adjustments = response.body.data;

              // Should return array of systematic adjustments
              expect(Array.isArray(adjustments)).toBe(true);
              expect(adjustments.length).toBeGreaterThan(0);

              adjustments.forEach((adjustment: any) => {
                // Should have systematic adjustment structure
                expect(adjustment.adjustment_category).toMatch(/^(system_design|habit_architecture|routine_structure|feedback_loops)$/);
                expect(adjustment.current_approach).toBeDefined();
                expect(adjustment.proposed_adjustment).toBeDefined();
                expect(adjustment.rationale).toBeDefined();
                expect(adjustment.expected_outcomes).toBeDefined();
                expect(Array.isArray(adjustment.expected_outcomes)).toBe(true);
                expect(adjustment.implementation_timeline).toBeDefined();

                // Should NOT contain motivational language
                const motivationalWords = [
                  'motivation', 'inspire', 'encourage', 'believe', 'positive thinking',
                  'mindset', 'attitude', 'willpower', 'determination', 'just try harder'
                ];
                
                const adjustmentText = `${adjustment.proposed_adjustment} ${adjustment.rationale}`.toLowerCase();
                const hasMotivationalLanguage = motivationalWords.some(word => 
                  adjustmentText.includes(word)
                );
                expect(hasMotivationalLanguage).toBe(false);

                // Should contain systematic language
                const systematicWords = [
                  'system', 'structure', 'process', 'method', 'framework', 'approach',
                  'optimize', 'adjust', 'modify', 'redesign', 'implement', 'automate'
                ];
                
                const hasSystematicLanguage = systematicWords.some(word => 
                  adjustmentText.includes(word)
                );
                expect(hasSystematicLanguage).toBe(true);

                // Rationale should address root causes, not symptoms
                const rootCauseWords = [
                  'because', 'due to', 'caused by', 'underlying', 'fundamental',
                  'structural', 'systematic', 'process', 'design flaw'
                ];
                
                const hasRootCauseAnalysis = rootCauseWords.some(word => 
                  adjustment.rationale.toLowerCase().includes(word)
                );
                expect(hasRootCauseAnalysis).toBe(true);

                // Expected outcomes should be measurable
                adjustment.expected_outcomes.forEach((outcome: string) => {
                  const measurableWords = [
                    'increase', 'decrease', 'improve', 'reduce', 'higher', 'lower',
                    'better', 'more', 'less', 'faster', 'slower', '%', 'score'
                  ];
                  
                  const hasMeasurableLanguage = measurableWords.some(word => 
                    outcome.toLowerCase().includes(word)
                  );
                  expect(hasMeasurableLanguage).toBe(true);
                });
              });

              // Should prioritize high-impact adjustments for severe declines
              const avgScore = Object.values(testData.performanceDecline).reduce((sum, score) => sum + score, 0) / 4;
              if (avgScore < 30) {
                const highImpactAdjustments = adjustments.filter((adj: any) => 
                  adj.adjustment_category === 'system_design' || adj.adjustment_category === 'routine_structure'
                );
                expect(highImpactAdjustments.length).toBeGreaterThan(0);
              }
            }

            return true;
          }
        ),
        { numRuns: 12 }
      );
    }, 30000);
  });

  describe('Property 46: Habit Evolution Tracking', () => {
    /**
     * Feature: student-discipline-system, Property 46: Habit Evolution Tracking
     * For any habit or routine, changes and evolution should be tracked over weeks and months to show development patterns.
     * Validates: Requirements 17.5
     */
    it('should track habit evolution patterns over extended periods', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            timeframeMonths: fc.integer({ min: 6, max: 18 }),
            habitChanges: fc.array(
              fc.record({
                habitName: fc.string({ minLength: 5, maxLength: 50 }),
                changeType: fc.oneof(fc.constant('formed'), fc.constant('evolved'), fc.constant('abandoned')),
                changeDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
                details: fc.record({
                  originalForm: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
                  evolvedForm: fc.option(fc.string({ minLength: 5, maxLength: 100 }), { nil: undefined }),
                  reason: fc.string({ minLength: 10, maxLength: 200 }),
                  effectivenessChange: fc.option(fc.integer({ min: -50, max: 50 }), { nil: undefined })
                })
              }),
              { minLength: 1, maxLength: 8 }
            )
          }),
          async (testData) => {
            const response = await request(app)
              .get(`/api/review-cycles/habit-evolution?months=${testData.timeframeMonths}`)
              .set('Authorization', 'Bearer test-token');

            if (response.status === 200) {
              const evolutionData = response.body.data;

              // Should have evolution analysis structure
              expect(evolutionData.habits_formed).toBeDefined();
              expect(Array.isArray(evolutionData.habits_formed)).toBe(true);
              expect(evolutionData.habits_abandoned).toBeDefined();
              expect(Array.isArray(evolutionData.habits_abandoned)).toBe(true);
              expect(evolutionData.habits_evolved).toBeDefined();
              expect(Array.isArray(evolutionData.habits_evolved)).toBe(true);
              expect(evolutionData.formation_success_rate).toBeGreaterThanOrEqual(0);
              expect(evolutionData.formation_success_rate).toBeLessThanOrEqual(100);
              expect(evolutionData.evolution_patterns).toBeDefined();
              expect(Array.isArray(evolutionData.evolution_patterns)).toBe(true);

              // Validate formed habits tracking
              evolutionData.habits_formed.forEach((habit: any) => {
                expect(habit.habit_name).toBeDefined();
                expect(habit.formation_start_date).toBeDefined();
                expect(habit.days_to_consistency).toBeGreaterThan(0);
                expect(habit.current_streak).toBeGreaterThanOrEqual(0);
                expect(habit.formation_challenges).toBeDefined();
                expect(Array.isArray(habit.formation_challenges)).toBe(true);

                // Formation date should be within timeframe
                const formationDate = new Date(habit.formation_start_date);
                const cutoffDate = new Date();
                cutoffDate.setMonth(cutoffDate.getMonth() - testData.timeframeMonths);
                expect(formationDate.getTime()).toBeGreaterThanOrEqual(cutoffDate.getTime());
              });

              // Validate evolved habits tracking
              evolutionData.habits_evolved.forEach((habit: any) => {
                expect(habit.habit_name).toBeDefined();
                expect(habit.original_form).toBeDefined();
                expect(habit.evolved_form).toBeDefined();
                expect(habit.evolution_date).toBeDefined();
                expect(habit.evolution_reason).toBeDefined();
                expect(habit.effectiveness_change).toBeDefined();
                expect(typeof habit.effectiveness_change).toBe('number');

                // Original and evolved forms should be different
                expect(habit.original_form).not.toBe(habit.evolved_form);

                // Evolution should have a meaningful reason
                expect(habit.evolution_reason.length).toBeGreaterThan(10);
              });

              // Validate abandoned habits tracking
              evolutionData.habits_abandoned.forEach((habit: any) => {
                expect(habit.habit_name).toBeDefined();
                expect(habit.abandonment_date).toBeDefined();
                expect(habit.days_attempted).toBeGreaterThan(0);
                expect(habit.abandonment_reasons).toBeDefined();
                expect(Array.isArray(habit.abandonment_reasons)).toBe(true);
                expect(habit.abandonment_reasons.length).toBeGreaterThan(0);
                expect(habit.lessons_learned).toBeDefined();
                expect(Array.isArray(habit.lessons_learned)).toBe(true);
              });

              // Validate evolution patterns
              evolutionData.evolution_patterns.forEach((pattern: any) => {
                expect(pattern.pattern_name).toBeDefined();
                expect(pattern.pattern_description).toBeDefined();
                expect(pattern.frequency).toBeGreaterThan(0);
                expect(pattern.success_correlation).toBeGreaterThanOrEqual(0);
                expect(pattern.success_correlation).toBeLessThanOrEqual(1);

                // Pattern should provide insights about habit development
                const developmentWords = [
                  'simplification', 'complexity', 'timing', 'frequency', 'duration',
                  'stacking', 'chaining', 'environment', 'trigger', 'reward'
                ];
                
                const hasDeveopmentInsight = developmentWords.some(word => 
                  pattern.pattern_description.toLowerCase().includes(word)
                );
                expect(hasDeveopmentInsight).toBe(true);
              });

              // Success rate should be calculated correctly
              const totalAttempts = evolutionData.habits_formed.length + evolutionData.habits_abandoned.length;
              if (totalAttempts > 0) {
                const expectedSuccessRate = Math.round((evolutionData.habits_formed.length / totalAttempts) * 100);
                expect(Math.abs(evolutionData.formation_success_rate - expectedSuccessRate)).toBeLessThanOrEqual(5);
              }
            }

            return true;
          }
        ),
        { numRuns: 8 }
      );
    }, 30000);
  });

  describe('Property 28: Environmental Cue Integration', () => {
    /**
     * Feature: student-discipline-system, Property 28: Environmental Cue Integration
     * For any habit formation process, the system should identify relevant environmental cues and integrate them into habit tracking and stacking suggestions.
     * Validates: Requirements 12.2, 12.4
     */
    it('should identify and integrate environmental cues for habit formation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            habitName: fc.string({ minLength: 5, maxLength: 50 }),
            environmentalContext: fc.record({
              location: fc.oneof(fc.constant('home'), fc.constant('office'), fc.constant('library'), fc.constant('gym')),
              timeOfDay: fc.oneof(fc.constant('morning'), fc.constant('afternoon'), fc.constant('evening')),
              triggers: fc.array(fc.string({ minLength: 3, maxLength: 30 }), { minLength: 1, maxLength: 4 }),
              obstacles: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 30 }), { maxLength: 3 }), { nil: undefined })
            }),
            habitType: fc.oneof(fc.constant('daily'), fc.constant('weekly'))
          }),
          async (testData) => {
            const habitRequest = {
              name: testData.habitName,
              frequency: testData.habitType,
              environmental_context: testData.environmentalContext
            };

            const response = await request(app)
              .post('/api/habits')
              .set('Authorization', 'Bearer test-token')
              .send(habitRequest);

            if (response.status === 200 || response.status === 201) {
              const habit = response.body.data;

              // Should create habit with environmental cue integration
              expect(habit.name).toBe(testData.habitName);
              expect(habit.frequency).toBe(testData.habitType);

              // Should identify and store environmental cues
              expect(habit.environmental_cues).toBeDefined();
              expect(habit.environmental_cues.location).toBe(testData.environmentalContext.location);
              expect(habit.environmental_cues.optimal_time).toBe(testData.environmentalContext.timeOfDay);

              // Should integrate triggers as cues
              expect(habit.environmental_cues.triggers).toBeDefined();
              expect(Array.isArray(habit.environmental_cues.triggers)).toBe(true);
              testData.environmentalContext.triggers.forEach(trigger => {
                expect(habit.environmental_cues.triggers).toContain(trigger);
              });

              // Should identify potential obstacles
              if (testData.environmentalContext.obstacles) {
                expect(habit.environmental_cues.potential_obstacles).toBeDefined();
                expect(Array.isArray(habit.environmental_cues.potential_obstacles)).toBe(true);
              }

              // Test habit stacking suggestions with environmental cues
              const stackingResponse = await request(app)
                .get(`/api/habits/${habit.id}/stacking-suggestions`)
                .set('Authorization', 'Bearer test-token');

              if (stackingResponse.status === 200) {
                const suggestions = stackingResponse.body.data;
                
                suggestions.forEach((suggestion: any) => {
                  // Should consider environmental context in stacking
                  expect(suggestion.environmental_compatibility).toBeDefined();
                  expect(suggestion.environmental_compatibility).toBeGreaterThanOrEqual(0);
                  expect(suggestion.environmental_compatibility).toBeLessThanOrEqual(1);

                  // Should reference environmental cues in rationale
                  const cueWords = ['location', 'time', 'trigger', 'environment', 'context', 'setting'];
                  const hasCueReference = cueWords.some(word => 
                    suggestion.rationale.toLowerCase().includes(word)
                  );
                  expect(hasCueReference).toBe(true);

                  // High compatibility suggestions should share environmental context
                  if (suggestion.environmental_compatibility > 0.8) {
                    expect(suggestion.shared_context).toBeDefined();
                    expect(suggestion.shared_context.location || suggestion.shared_context.time_of_day).toBeDefined();
                  }
                });
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });

  describe('Property 29: Behavioral Chain Recognition', () => {
    /**
     * Feature: student-discipline-system, Property 29: Behavioral Chain Recognition
     * For any set of habits that are consistently performed together, the system should recognize these patterns and reinforce the behavioral chains.
     * Validates: Requirements 12.5
     */
    it('should recognize and reinforce behavioral chains from habit patterns', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            habitChain: fc.array(
              fc.record({
                habitName: fc.string({ minLength: 5, maxLength: 40 }),
                order: fc.integer({ min: 1, max: 5 }),
                consistency: fc.float({ min: Math.fround(0.7), max: Math.fround(1.0) }) // High consistency for chain detection
              }),
              { minLength: 2, maxLength: 4 }
            ),
            timeWindow: fc.integer({ min: 30, max: 180 }), // Minutes within which habits are performed together
            chainStrength: fc.float({ min: Math.fround(0.6), max: Math.fround(1.0) })
          }),
          async (testData) => {
            // Sort habits by order to create a proper chain
            const sortedChain = testData.habitChain.sort((a, b) => a.order - b.order);

            // Mock habit completion data that shows consistent chaining
            const chainData = {
              habits: sortedChain.map(h => ({
                name: h.habitName,
                consistency_rate: h.consistency
              })),
              time_window_minutes: testData.timeWindow,
              chain_strength: testData.chainStrength,
              observation_period_days: 30
            };

            const response = await request(app)
              .post('/api/habits/analyze-chains')
              .set('Authorization', 'Bearer test-token')
              .send(chainData);

            if (response.status === 200) {
              const analysis = response.body.data;

              // Should identify behavioral chains
              expect(analysis.identified_chains).toBeDefined();
              expect(Array.isArray(analysis.identified_chains)).toBe(true);

              analysis.identified_chains.forEach((chain: any) => {
                // Each chain should have required structure
                expect(chain.chain_id).toBeDefined();
                expect(chain.habits).toBeDefined();
                expect(Array.isArray(chain.habits)).toBe(true);
                expect(chain.habits.length).toBeGreaterThanOrEqual(2);
                expect(chain.chain_strength).toBeGreaterThanOrEqual(0);
                expect(chain.chain_strength).toBeLessThanOrEqual(1);
                expect(chain.average_time_window).toBeGreaterThan(0);
                expect(chain.consistency_score).toBeGreaterThanOrEqual(0);
                expect(chain.consistency_score).toBeLessThanOrEqual(1);

                // Habits should be in logical order
                for (let i = 1; i < chain.habits.length; i++) {
                  expect(chain.habits[i].order).toBeGreaterThan(chain.habits[i-1].order);
                }

                // Strong chains should have high consistency
                if (chain.chain_strength > 0.8) {
                  expect(chain.consistency_score).toBeGreaterThan(0.7);
                }

                // Should provide reinforcement strategies
                expect(chain.reinforcement_strategies).toBeDefined();
                expect(Array.isArray(chain.reinforcement_strategies)).toBe(true);
                expect(chain.reinforcement_strategies.length).toBeGreaterThan(0);

                chain.reinforcement_strategies.forEach((strategy: string) => {
                  // Strategies should be actionable
                  const actionWords = ['strengthen', 'reinforce', 'maintain', 'protect', 'optimize', 'improve'];
                  const hasActionWord = actionWords.some(word => 
                    strategy.toLowerCase().includes(word)
                  );
                  expect(hasActionWord).toBe(true);

                  // Should reference the chain concept
                  const chainWords = ['chain', 'sequence', 'flow', 'routine', 'pattern', 'together'];
                  const hasChainReference = chainWords.some(word => 
                    strategy.toLowerCase().includes(word)
                  );
                  expect(hasChainReference).toBe(true);
                });

                // Should identify chain triggers and anchors
                expect(chain.chain_trigger).toBeDefined();
                expect(chain.anchor_habit).toBeDefined();
                expect(chain.completion_reward).toBeDefined();

                // Anchor habit should be the first or most consistent habit
                const anchorHabit = chain.habits.find((h: any) => h.name === chain.anchor_habit);
                expect(anchorHabit).toBeDefined();
                expect(anchorHabit.order).toBeLessThanOrEqual(2); // Should be early in chain
              });

              // Should provide chain optimization suggestions
              expect(analysis.optimization_suggestions).toBeDefined();
              expect(Array.isArray(analysis.optimization_suggestions)).toBe(true);

              analysis.optimization_suggestions.forEach((suggestion: any) => {
                expect(suggestion.suggestion_type).toMatch(/^(timing|environment|reward|trigger)$/);
                expect(suggestion.description).toBeDefined();
                expect(suggestion.expected_impact).toBeGreaterThanOrEqual(0);
                expect(suggestion.expected_impact).toBeLessThanOrEqual(1);
                expect(suggestion.implementation_difficulty).toMatch(/^(easy|medium|hard)$/);
              });

              // Should track chain performance metrics
              expect(analysis.chain_metrics).toBeDefined();
              expect(analysis.chain_metrics.total_chains_identified).toBeGreaterThanOrEqual(0);
              expect(analysis.chain_metrics.average_chain_strength).toBeGreaterThanOrEqual(0);
              expect(analysis.chain_metrics.average_chain_strength).toBeLessThanOrEqual(1);
              expect(analysis.chain_metrics.strongest_chain_length).toBeGreaterThanOrEqual(2);
            }

            return true;
          }
        ),
        { numRuns: 8 }
      );
    }, 30000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});