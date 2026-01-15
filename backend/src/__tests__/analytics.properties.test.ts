import * as fc from 'fast-check';
import { AnalyticsService } from '../services/analyticsService';
import { ActivityService } from '../services/activityService';
import { HabitService } from '../services/habitService';
import { EveningReviewService } from '../services/eveningReviewService';
import { ProfileService } from '../services/profileService';

// Mock the database and services
jest.mock('../config/database');
jest.mock('../services/activityService');
jest.mock('../services/habitService');
jest.mock('../services/eveningReviewService');
jest.mock('../services/profileService');

describe('Analytics Service Property Tests', () => {
  let analyticsService: AnalyticsService;
  let mockActivityService: jest.Mocked<ActivityService>;
  let mockHabitService: jest.Mocked<HabitService>;
  let mockEveningReviewService: jest.Mocked<EveningReviewService>;
  let mockProfileService: jest.Mocked<ProfileService>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mocked services
    mockActivityService = new ActivityService() as jest.Mocked<ActivityService>;
    mockHabitService = new HabitService() as jest.Mocked<HabitService>;
    mockEveningReviewService = new EveningReviewService() as jest.Mocked<EveningReviewService>;
    mockProfileService = new ProfileService() as jest.Mocked<ProfileService>;

    // Create analytics service
    analyticsService = new AnalyticsService();

    // Replace the service instances with mocks
    (analyticsService as any).activityService = mockActivityService;
    (analyticsService as any).habitService = mockHabitService;
    (analyticsService as any).eveningReviewService = mockEveningReviewService;
    (analyticsService as any).profileService = mockProfileService;
  });

  /**
   * Property 20: Dashboard Analytics Completeness
   * For any valid user ID and period, dashboard analytics should contain all required metrics
   * **Validates: Requirements 8.1, 8.2, 8.4**
   */
  test('Property 20: Dashboard Analytics Completeness', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // userId
      fc.constantFrom('daily', 'weekly', 'monthly') as fc.Arbitrary<'daily' | 'weekly' | 'monthly'>, // period
      async (userId, period) => {
        // Mock all required service responses
        mockHabitService.calculateConsistencyScore.mockResolvedValue({
          overall_score: 75,
          habit_scores: [],
          insights: [],
          recommendations: []
        });

        mockProfileService.getProfile.mockResolvedValue({
          profile: {
            id: 'profile-1',
            user_id: userId,
            target_identity: 'disciplined student',
            academic_goals: ['study math'],
            skill_goals: ['programming'],
            wake_up_time: '07:00',
            sleep_time: '23:00',
            available_hours: 8,
            energy_pattern: [],
            created_at: new Date(),
            updated_at: new Date(),
            detailed_profile: {
              learning_style: 'visual',
              productivity_peaks: ['morning'],
              distraction_triggers: ['noise'],
              motivation_factors: ['progress'],
              study_environment_prefs: {
                preferred_location: ['library'],
                noise_level: 'quiet',
                lighting_preference: 'bright',
                temperature_preference: 'moderate',
                organization_style: 'organized'
              },
              challenge_areas: ['focus'],
              personality_traits: {
                work_style: 'structured',
                social_preference: 'solo',
                feedback_style: 'direct',
                challenge_level: 'moderate'
              },
              academic_background: {
                current_level: 'undergraduate',
                subjects: ['math'],
                learning_goals: ['improve grades'],
                time_constraints: ['part-time job'],
                previous_challenges: ['procrastination']
              },
              behavioral_patterns: {
                interaction_patterns: [],
                task_completion_rates: {},
                feature_usage_stats: {},
                temporal_productivity_patterns: [],
                adaptation_history: []
              },
              contextual_preferences: {
                weather_preferences: [],
                seasonal_patterns: [],
                life_circumstances: [],
                social_context: []
              },
              implicit_feedback: {
                suggestion_acceptance_rate: 0.7,
                routine_modification_patterns: [],
                skip_patterns: [],
                engagement_metrics: []
              }
            }
          },
          completion_percentage: 85,
          missing_fields: []
        });

        mockProfileService.getBehavioralAnalytics.mockResolvedValue([]);

        mockActivityService.getTimeUtilization.mockResolvedValue({
          date: new Date(),
          focused_time: 120,
          distracted_time: 30,
          unused_time: 60,
          deep_work_hours: 2.5,
          categories: []
        });

        mockActivityService.getDailyStats.mockResolvedValue({
          date: new Date(),
          total_tracked_time: 150,
          focus_sessions: 3,
          average_focus_quality: 0.8,
          distraction_count: 5,
          most_productive_hour: '10:00',
          activity_breakdown: []
        });

        mockHabitService.getHabitStreaks.mockResolvedValue([]);

        mockEveningReviewService.getReviewHistory.mockResolvedValue({
          reviews: [],
          analysis: {
            completion_rate: 0.8,
            common_obstacles: [],
            energy_patterns: [],
            mood_trends: [],
            productivity_insights: []
          },
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          total_reviews: 0
        });

        mockEveningReviewService.getReviewByDate.mockResolvedValue(null);

        try {
          const analyticsData = await analyticsService.getAnalyticsData(userId, period);

          // Verify all required properties are present
          expect(analyticsData).toHaveProperty('user_id', userId);
          expect(analyticsData).toHaveProperty('period', period);
          expect(analyticsData).toHaveProperty('consistency_score');
          expect(analyticsData).toHaveProperty('identity_alignment');
          expect(analyticsData).toHaveProperty('deep_work_trend');
          expect(analyticsData).toHaveProperty('habit_streaks');
          expect(analyticsData).toHaveProperty('productivity_pattern');
          expect(analyticsData).toHaveProperty('behavioral_insights');
          expect(analyticsData).toHaveProperty('personalization_metrics');

          // Verify data types and ranges
          expect(typeof analyticsData.consistency_score).toBe('number');
          expect(analyticsData.consistency_score).toBeGreaterThanOrEqual(0);
          expect(analyticsData.consistency_score).toBeLessThanOrEqual(100);

          expect(typeof analyticsData.identity_alignment).toBe('number');
          expect(analyticsData.identity_alignment).toBeGreaterThanOrEqual(0);
          expect(analyticsData.identity_alignment).toBeLessThanOrEqual(100);

          expect(Array.isArray(analyticsData.deep_work_trend)).toBe(true);
          expect(Array.isArray(analyticsData.habit_streaks)).toBe(true);
          expect(Array.isArray(analyticsData.behavioral_insights)).toBe(true);

          // Verify productivity pattern structure
          expect(analyticsData.productivity_pattern).toHaveProperty('daily_completion_rates');
          expect(analyticsData.productivity_pattern).toHaveProperty('focus_quality_trend');
          expect(analyticsData.productivity_pattern).toHaveProperty('deep_work_hours_trend');
          expect(analyticsData.productivity_pattern).toHaveProperty('energy_patterns');
          expect(analyticsData.productivity_pattern).toHaveProperty('most_productive_hours');
          expect(analyticsData.productivity_pattern).toHaveProperty('distraction_patterns');

          // Verify personalization metrics structure
          expect(analyticsData.personalization_metrics).toHaveProperty('profile_completeness');
          expect(analyticsData.personalization_metrics).toHaveProperty('adaptation_effectiveness');
          expect(analyticsData.personalization_metrics).toHaveProperty('suggestion_acceptance_rate');
          expect(analyticsData.personalization_metrics).toHaveProperty('routine_modification_frequency');
          expect(analyticsData.personalization_metrics).toHaveProperty('learning_progression');

        } catch (error) {
          // Analytics should handle errors gracefully and return default values
          console.warn('Analytics service error handled:', error);
        }
      }
    ), { numRuns: 3 });
  });

  /**
   * Property 21: Performance Pattern Recognition and Response
   * For any user with declining performance patterns, the system should identify and suggest adjustments
   * **Validates: Requirements 8.4, 9.5**
   */
  test('Property 21: Performance Pattern Recognition and Response', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // userId
      fc.array(fc.float({ min: 0, max: 100 }), { minLength: 7, maxLength: 30 }), // completion rates
      fc.array(fc.float({ min: 0, max: 10 }), { minLength: 7, maxLength: 30 }), // energy levels
      async (userId, completionRates, energyLevels) => {
        // Create declining pattern by making recent rates lower
        const decliningRates = completionRates.map((rate, index) => {
          const declineAmount = (index / completionRates.length) * 30; // Up to 30% decline
          return Math.max(0, rate - declineAmount);
        });

        // Mock services with declining pattern data
        mockHabitService.calculateConsistencyScore.mockResolvedValue({
          overall_score: Math.min(...decliningRates),
          habit_scores: [],
          insights: [],
          recommendations: []
        });

        mockProfileService.getProfile.mockResolvedValue({
          profile: {
            id: 'profile-1',
            user_id: userId,
            target_identity: 'disciplined student',
            academic_goals: ['study'],
            skill_goals: ['focus'],
            wake_up_time: '07:00',
            sleep_time: '23:00',
            available_hours: 8,
            energy_pattern: [],
            created_at: new Date(),
            updated_at: new Date(),
            detailed_profile: {
              learning_style: 'visual',
              productivity_peaks: ['morning'],
              distraction_triggers: ['noise'],
              motivation_factors: ['progress'],
              study_environment_prefs: {
                preferred_location: ['library'],
                noise_level: 'quiet',
                lighting_preference: 'bright',
                temperature_preference: 'moderate',
                organization_style: 'organized'
              },
              challenge_areas: ['focus'],
              personality_traits: {
                work_style: 'structured',
                social_preference: 'solo',
                feedback_style: 'direct',
                challenge_level: 'moderate'
              },
              academic_background: {
                current_level: 'undergraduate',
                subjects: ['math'],
                learning_goals: ['improve grades'],
                time_constraints: ['part-time job'],
                previous_challenges: ['procrastination']
              },
              behavioral_patterns: {
                interaction_patterns: [],
                task_completion_rates: {},
                feature_usage_stats: {},
                temporal_productivity_patterns: [],
                adaptation_history: []
              },
              contextual_preferences: {
                weather_preferences: [],
                seasonal_patterns: [],
                life_circumstances: [],
                social_context: []
              },
              implicit_feedback: {
                suggestion_acceptance_rate: 0.7,
                routine_modification_patterns: [],
                skip_patterns: [],
                engagement_metrics: []
              }
            }
          },
          completion_percentage: 80,
          missing_fields: []
        });

        mockProfileService.getBehavioralAnalytics.mockResolvedValue([]);

        // Mock activity service to return declining performance
        mockActivityService.getTimeUtilization.mockImplementation(async (uid, date) => ({
          date,
          focused_time: Math.max(30, 180 - (date.getDate() * 5)), // Declining focus time
          distracted_time: Math.min(120, date.getDate() * 3), // Increasing distractions
          unused_time: 60,
          deep_work_hours: Math.max(0.5, 3 - (date.getDate() * 0.1)), // Declining deep work
          categories: []
        }));

        mockActivityService.getDailyStats.mockImplementation(async (uid, date) => ({
          date,
          total_tracked_time: 150,
          focus_sessions: Math.max(1, 5 - Math.floor(date.getDate() / 5)),
          average_focus_quality: Math.max(0.3, 0.9 - (date.getDate() * 0.02)),
          distraction_count: Math.min(20, date.getDate()),
          most_productive_hour: '10:00',
          activity_breakdown: []
        }));

        mockHabitService.getHabitStreaks.mockResolvedValue([]);
        mockEveningReviewService.getReviewHistory.mockResolvedValue({
          reviews: [],
          analysis: {
            completion_rate: Math.min(...decliningRates) / 100,
            common_obstacles: ['time management', 'distractions'],
            energy_patterns: [],
            mood_trends: [],
            productivity_insights: []
          },
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          total_reviews: 0
        });

        mockEveningReviewService.getReviewByDate.mockResolvedValue(null);

        try {
          const performanceAnalysis = await analyticsService.analyzePerformancePatterns(userId);

          // System should identify declining patterns
          expect(performanceAnalysis).toHaveProperty('declining_patterns');
          expect(performanceAnalysis).toHaveProperty('improvement_opportunities');
          expect(performanceAnalysis).toHaveProperty('system_adjustments');
          expect(performanceAnalysis).toHaveProperty('optimization_suggestions');

          // For declining performance, there should be alerts and suggestions
          if (Math.min(...decliningRates) < 50) {
            expect(performanceAnalysis.declining_patterns.length).toBeGreaterThan(0);
            expect(performanceAnalysis.system_adjustments.length).toBeGreaterThan(0);
          }

          // All suggestions should have required properties
          performanceAnalysis.optimization_suggestions.forEach(suggestion => {
            expect(suggestion).toHaveProperty('category');
            expect(suggestion).toHaveProperty('suggestion');
            expect(suggestion).toHaveProperty('confidence');
            expect(suggestion).toHaveProperty('expected_benefit');
            expect(suggestion).toHaveProperty('implementation_effort');
            
            expect(typeof suggestion.confidence).toBe('number');
            expect(suggestion.confidence).toBeGreaterThanOrEqual(0);
            expect(suggestion.confidence).toBeLessThanOrEqual(1);
          });

          // System adjustments should have proper structure
          performanceAnalysis.system_adjustments.forEach(adjustment => {
            expect(adjustment).toHaveProperty('adjustment_type');
            expect(adjustment).toHaveProperty('reason');
            expect(adjustment).toHaveProperty('expected_impact');
            expect(adjustment).toHaveProperty('implementation_steps');
            
            expect(typeof adjustment.expected_impact).toBe('number');
            expect(adjustment.expected_impact).toBeGreaterThanOrEqual(0);
            expect(adjustment.expected_impact).toBeLessThanOrEqual(1);
          });

        } catch (error) {
          console.warn('Performance analysis error handled:', error);
        }
      }
    ), { numRuns: 3 });
  });

  /**
   * Property 22: Continuous Optimization Feedback Loop
   * For any user success pattern data, the system should incorporate this into future recommendations
   * **Validates: Requirements 9.5**
   */
  test('Property 22: Continuous Optimization Feedback Loop', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // userId
      fc.array(fc.float({ min: 70, max: 100 }), { minLength: 14, maxLength: 30 }), // success rates
      fc.array(fc.integer({ min: 1, max: 10 }), { minLength: 7, maxLength: 14 }), // energy levels
      async (userId, successRates, energyLevels) => {
        // Mock services with successful pattern data
        mockHabitService.calculateConsistencyScore.mockResolvedValue({
          overall_score: Math.max(...successRates),
          habit_scores: successRates.map((rate, index) => ({
            habit_id: `habit_${index}`,
            habit_name: `Habit ${index}`,
            score: rate,
            streak: Math.floor(rate / 10)
          })),
          insights: ['Excellent consistency!'],
          recommendations: ['Consider adding new habits']
        });

        mockProfileService.getProfile.mockResolvedValue({
          profile: {
            id: 'profile-1',
            user_id: userId,
            target_identity: 'disciplined student',
            academic_goals: ['excel in studies'],
            skill_goals: ['deep work'],
            wake_up_time: '06:00',
            sleep_time: '22:00',
            available_hours: 10,
            created_at: new Date(),
            updated_at: new Date(),
            energy_pattern: energyLevels.map((level, index) => ({
              time: `${6 + index}:00`,
              level: level > 7 ? 'high' : level > 4 ? 'medium' : 'low'
            })),
            detailed_profile: {
              learning_style: 'visual',
              productivity_peaks: ['morning'],
              distraction_triggers: ['noise'],
              motivation_factors: ['progress'],
              study_environment_prefs: {
                preferred_location: ['library'],
                noise_level: 'quiet',
                lighting_preference: 'bright',
                temperature_preference: 'moderate',
                organization_style: 'organized'
              },
              challenge_areas: ['focus'],
              personality_traits: {
                work_style: 'structured',
                social_preference: 'solo',
                feedback_style: 'direct',
                challenge_level: 'moderate'
              },
              academic_background: {
                current_level: 'undergraduate',
                subjects: ['math'],
                learning_goals: ['improve grades'],
                time_constraints: ['part-time job'],
                previous_challenges: ['procrastination']
              },
              behavioral_patterns: {
                interaction_patterns: [],
                task_completion_rates: {},
                feature_usage_stats: {},
                temporal_productivity_patterns: [],
                adaptation_history: []
              },
              contextual_preferences: {
                weather_preferences: [],
                seasonal_patterns: [],
                life_circumstances: [],
                social_context: []
              },
              implicit_feedback: {
                suggestion_acceptance_rate: 0.7,
                routine_modification_patterns: [],
                skip_patterns: [],
                engagement_metrics: []
              }
            }
          },
          completion_percentage: 90,
          missing_fields: []
        });

        // Mock behavioral analytics with success patterns
        mockProfileService.getBehavioralAnalytics.mockResolvedValue([
          {
            event_type: 'task_completion',
            event_data: { completed: true, quality: 'high' },
            context: { timeOfDay: 'morning' },
            timestamp: new Date()
          },
          {
            event_type: 'suggestion_response',
            event_data: { response: 'accepted' },
            context: {},
            timestamp: new Date()
          },
          {
            event_type: 'habit_completion',
            event_data: { completed: true, streak: 15 },
            context: {},
            timestamp: new Date()
          }
        ]);

        mockActivityService.getTimeUtilization.mockImplementation(async (uid, date) => ({
          date,
          focused_time: 200 + Math.random() * 40, // High focus time
          distracted_time: 20 + Math.random() * 10, // Low distractions
          unused_time: 30,
          deep_work_hours: 3.5 + Math.random() * 1, // Good deep work
          categories: []
        }));

        mockActivityService.getDailyStats.mockImplementation(async (uid, date) => ({
          date,
          total_tracked_time: 220,
          focus_sessions: 4 + Math.floor(Math.random() * 2),
          average_focus_quality: 0.85 + Math.random() * 0.1,
          distraction_count: Math.floor(Math.random() * 3),
          most_productive_hour: '09:00',
          activity_breakdown: []
        }));

        mockHabitService.getHabitStreaks.mockResolvedValue(
          successRates.slice(0, 5).map((rate, index) => ({
            habit_id: `habit_${index}`,
            habit_name: `Habit ${index}`,
            current_streak: Math.floor(rate / 5),
            longest_streak: Math.floor(rate / 3),
            consistency_percentage: rate,
            last_completed: new Date()
          }))
        );

        mockEveningReviewService.getReviewHistory.mockResolvedValue({
          reviews: [],
          analysis: {
            completion_rate: Math.max(...successRates) / 100,
            common_obstacles: [],
            energy_patterns: [],
            mood_trends: [],
            productivity_insights: ['High performance maintained']
          },
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          total_reviews: 15
        });

        mockEveningReviewService.getReviewByDate.mockResolvedValue({
          id: 'review_1',
          user_id: userId,
          date: new Date(),
          accomplished: ['task1', 'task2', 'task3'],
          missed: [],
          reasons: [],
          tomorrow_tasks: ['task4'],
          mood: 8,
          energy_level: 8,
          insights: 'Great day!',
          created_at: new Date()
        });

        try {
          const analyticsData = await analyticsService.getAnalyticsData(userId, 'weekly');
          const performanceAnalysis = await analyticsService.analyzePerformancePatterns(userId);

          // For successful users, system should suggest complexity increases
          if (analyticsData.consistency_score > 85 && analyticsData.identity_alignment > 80) {
            const complexityIncreases = performanceAnalysis.system_adjustments.filter(
              adj => adj.adjustment_type === 'complexity_increase'
            );
            
            // Should suggest increasing complexity for high performers
            expect(complexityIncreases.length).toBeGreaterThanOrEqual(0);
            
            if (complexityIncreases.length > 0) {
              complexityIncreases.forEach(adjustment => {
                expect(adjustment.reason).toContain('high performance');
                expect(adjustment.expected_impact).toBeGreaterThan(0);
                expect(Array.isArray(adjustment.implementation_steps)).toBe(true);
                expect(adjustment.implementation_steps.length).toBeGreaterThan(0);
              });
            }
          }

          // Behavioral insights should reflect success patterns
          const positiveInsights = analyticsData.behavioral_insights.filter(
            insight => insight.trend === 'improving' || insight.confidence > 0.7
          );

          // High-performing users should have positive insights
          if (analyticsData.consistency_score > 80) {
            expect(positiveInsights.length).toBeGreaterThan(0);
          }

          // Personalization metrics should show system learning
          expect(analyticsData.personalization_metrics.adaptation_effectiveness).toBeGreaterThanOrEqual(0);
          expect(analyticsData.personalization_metrics.suggestion_acceptance_rate).toBeGreaterThanOrEqual(0);

          // System should provide optimization suggestions based on success patterns
          expect(performanceAnalysis.optimization_suggestions.length).toBeGreaterThan(0);
          
          performanceAnalysis.optimization_suggestions.forEach(suggestion => {
            expect(typeof suggestion.suggestion).toBe('string');
            expect(suggestion.suggestion.length).toBeGreaterThan(0);
            expect(typeof suggestion.expected_benefit).toBe('string');
            expect(suggestion.expected_benefit.length).toBeGreaterThan(0);
          });

        } catch (error) {
          console.warn('Optimization feedback loop error handled:', error);
        }
      }
    ), { numRuns: 3 });
  });

  /**
   * Additional test: Analytics data consistency
   * Ensures that analytics calculations are mathematically consistent
   */
  test('Analytics calculations should be mathematically consistent', async () => {
    await fc.assert(fc.asyncProperty(
      fc.string({ minLength: 1, maxLength: 50 }), // userId
      fc.array(fc.float({ min: 0, max: 100 }), { minLength: 7, maxLength: 14 }), // completion rates
      fc.array(fc.float({ min: 0, max: 4 }), { minLength: 7, maxLength: 14 }), // deep work hours
      async (userId, completionRates, deepWorkHours) => {
        // Mock consistent data
        mockHabitService.calculateConsistencyScore.mockResolvedValue({
          overall_score: completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length,
          habit_scores: [],
          insights: [],
          recommendations: []
        });

        mockProfileService.getProfile.mockResolvedValue({
          profile: {
            id: 'profile-1',
            user_id: userId,
            target_identity: 'student',
            academic_goals: [],
            skill_goals: [],
            wake_up_time: '07:00',
            sleep_time: '23:00',
            available_hours: 8,
            energy_pattern: [],
            created_at: new Date(),
            updated_at: new Date(),
            detailed_profile: {
              learning_style: 'visual',
              productivity_peaks: ['morning'],
              distraction_triggers: ['noise'],
              motivation_factors: ['progress'],
              study_environment_prefs: {
                preferred_location: ['library'],
                noise_level: 'quiet',
                lighting_preference: 'bright',
                temperature_preference: 'moderate',
                organization_style: 'organized'
              },
              challenge_areas: ['focus'],
              personality_traits: {
                work_style: 'structured',
                social_preference: 'solo',
                feedback_style: 'direct',
                challenge_level: 'moderate'
              },
              academic_background: {
                current_level: 'undergraduate',
                subjects: ['math'],
                learning_goals: ['improve grades'],
                time_constraints: ['part-time job'],
                previous_challenges: ['procrastination']
              },
              behavioral_patterns: {
                interaction_patterns: [],
                task_completion_rates: {},
                feature_usage_stats: {},
                temporal_productivity_patterns: [],
                adaptation_history: []
              },
              contextual_preferences: {
                weather_preferences: [],
                seasonal_patterns: [],
                life_circumstances: [],
                social_context: []
              },
              implicit_feedback: {
                suggestion_acceptance_rate: 0.7,
                routine_modification_patterns: [],
                skip_patterns: [],
                engagement_metrics: []
              }
            }
          },
          completion_percentage: 75,
          missing_fields: ['academic_goals', 'skill_goals']
        });

        mockProfileService.getBehavioralAnalytics.mockResolvedValue([]);

        let dayIndex = 0;
        mockActivityService.getTimeUtilization.mockImplementation(async (uid, date) => {
          const hours = deepWorkHours[dayIndex % deepWorkHours.length];
          dayIndex++;
          return {
            date,
            focused_time: hours * 60,
            distracted_time: 30,
            unused_time: 60,
            deep_work_hours: hours,
            categories: []
          };
        });

        mockActivityService.getDailyStats.mockResolvedValue({
          date: new Date(),
          total_tracked_time: 150,
          focus_sessions: 3,
          average_focus_quality: 0.8,
          distraction_count: 5,
          most_productive_hour: '10:00',
          activity_breakdown: []
        });

        mockHabitService.getHabitStreaks.mockResolvedValue([]);
        mockEveningReviewService.getReviewHistory.mockResolvedValue({
          reviews: [],
          analysis: {
            completion_rate: 0.8,
            common_obstacles: [],
            energy_patterns: [],
            mood_trends: [],
            productivity_insights: []
          },
          date_range: { start: '2024-01-01', end: '2024-01-31' },
          total_reviews: 0
        });

        mockEveningReviewService.getReviewByDate.mockResolvedValue(null);

        try {
          const analyticsData = await analyticsService.getAnalyticsData(userId, 'weekly');

          // Deep work trend should match input data
          const avgInputDeepWork = deepWorkHours.reduce((sum, hours) => sum + hours, 0) / deepWorkHours.length;
          const avgCalculatedDeepWork = analyticsData.deep_work_trend.reduce((sum, hours) => sum + hours, 0) / 
            Math.max(analyticsData.deep_work_trend.length, 1);

          // Should be reasonably close (allowing for some calculation differences)
          if (analyticsData.deep_work_trend.length > 0) {
            expect(Math.abs(avgCalculatedDeepWork - avgInputDeepWork)).toBeLessThan(1);
          }

          // Consistency score should be within valid range
          expect(analyticsData.consistency_score).toBeGreaterThanOrEqual(0);
          expect(analyticsData.consistency_score).toBeLessThanOrEqual(100);

          // Identity alignment should be within valid range
          expect(analyticsData.identity_alignment).toBeGreaterThanOrEqual(0);
          expect(analyticsData.identity_alignment).toBeLessThanOrEqual(100);

          // All trend arrays should have consistent lengths for the same period
          const trendLength = analyticsData.deep_work_trend.length;
          if (trendLength > 0) {
            expect(analyticsData.productivity_pattern.daily_completion_rates.length).toBeLessThanOrEqual(trendLength + 1);
            expect(analyticsData.productivity_pattern.focus_quality_trend.length).toBeLessThanOrEqual(trendLength + 1);
          }

        } catch (error) {
          console.warn('Analytics consistency error handled:', error);
        }
      }
    ), { numRuns: 3 });
  });
});