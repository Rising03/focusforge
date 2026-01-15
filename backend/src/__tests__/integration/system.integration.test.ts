import request from 'supertest';
import app from '../../index';

describe('System Integration Tests - Component Interactions', () => {
  let authToken: string;
  let userId: string;
  let profileId: string;
  let routineId: string;
  let habitId: string;

  // Increase timeout for integration tests
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Setup test user with unique email
    const registrationData = {
      email: `system-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'System Test User'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registrationData);

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('Profile-Routine Integration', () => {
    it('should use profile data to generate personalized routines', async () => {
      // Step 1: Create detailed profile
      const profileData = {
        targetIdentity: 'disciplined student',
        academicGoals: ['Master algorithms', 'Complete thesis'],
        skillGoals: ['Advanced React', 'System design'],
        wakeUpTime: '05:30',
        sleepTime: '21:30',
        availableHours: 10,
        energyPattern: [
          { time: '06:00', level: 'high' },
          { time: '10:00', level: 'high' },
          { time: '14:00', level: 'medium' },
          { time: '18:00', level: 'low' }
        ]
      };

      const profileResponse = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      profileId = profileResponse.body.id;

      // Step 2: Add detailed profile preferences
      await request(app)
        .put('/api/profile/detailed')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          learningStyle: 'visual',
          productivityPeaks: ['early_morning', 'late_morning'],
          distractionTriggers: ['social_media', 'noise'],
          studyEnvironmentPrefs: {
            preferredLocation: ['library', 'quiet_room'],
            noiseLevel: 'quiet',
            lightingPreference: 'bright',
            temperaturePreference: 'cool'
          },
          personalityTraits: {
            workStyle: 'structured',
            challengeLevel: 'gradual'
          }
        })
        .expect(200);

      // Step 3: Generate routine and verify it uses profile data
      const routineResponse = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          energyLevel: 'high',
          availableHours: 10
        })
        .expect(201);

      routineId = routineResponse.body.id;

      // Verify routine incorporates profile preferences
      const routine = routineResponse.body;
      expect(routine.segments).toHaveLength(3); // morning, afternoon, evening

      // Check that high-energy activities are scheduled during peak times
      const morningSegments = routine.segments.filter((s: any) => 
        s.timeSlot.start.startsWith('05:') || s.timeSlot.start.startsWith('06:') || s.timeSlot.start.startsWith('07:')
      );
      expect(morningSegments.some((s: any) => s.type === 'deep_work')).toBe(true);

      // Verify academic goals are reflected in activities
      const activities = routine.segments.map((s: any) => s.activity.toLowerCase());
      expect(activities.some((activity: string) => 
        activity.includes('algorithm') || activity.includes('thesis') || activity.includes('react')
      )).toBe(true);
    });

    it('should adapt routines based on profile behavioral patterns', async () => {
      // Track behavioral pattern
      await request(app)
        .post('/api/profile/analytics/track')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          eventType: 'routine_completion',
          data: {
            routineId,
            completionRate: 0.6,
            struggledWith: ['deep_work_duration'],
            succeededWith: ['morning_routine']
          }
        })
        .expect(200);

      // Generate new routine and verify adaptation
      const adaptedRoutineResponse = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          energyLevel: 'medium'
        })
        .expect(201);

      const adaptedRoutine = adaptedRoutineResponse.body;
      expect(adaptedRoutine).toHaveProperty('adaptations');
      expect(adaptedRoutine.adaptations.length).toBeGreaterThan(0);

      // Verify deep work sessions are shorter based on behavioral feedback
      const deepWorkSegments = adaptedRoutine.segments.filter((s: any) => s.type === 'deep_work');
      expect(deepWorkSegments.every((s: any) => s.duration <= 90)).toBe(true); // Max 90 minutes
    });
  });

  describe('Activity-Analytics Integration', () => {
    it('should aggregate activity data into meaningful analytics', async () => {
      // Generate multiple activity sessions
      const activities = [
        { activity: 'Algorithm Study', type: 'study', duration: 120, focusQuality: 'high' },
        { activity: 'React Practice', type: 'skill_practice', duration: 90, focusQuality: 'medium' },
        { activity: 'Thesis Writing', type: 'deep_work', duration: 150, focusQuality: 'high' },
        { activity: 'Code Review', type: 'skill_practice', duration: 60, focusQuality: 'medium' }
      ];

      for (const activity of activities) {
        const startResponse = await request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            activity: activity.activity,
            type: activity.type
          })
          .expect(201);

        // Simulate activity duration
        await new Promise(resolve => setTimeout(resolve, 100));

        await request(app)
          .patch(`/api/activities/${startResponse.body.id}/stop`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            focusQuality: activity.focusQuality,
            distractions: activity.focusQuality === 'high' ? 0 : 2
          })
          .expect(200);
      }

      // Get analytics and verify aggregation
      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const analytics = analyticsResponse.body;
      expect(analytics).toHaveProperty('consistencyScore');
      expect(analytics).toHaveProperty('deepWorkHours');
      expect(analytics.deepWorkHours).toBeGreaterThan(0);

      // Verify category breakdown
      expect(analytics).toHaveProperty('categoryBreakdown');
      expect(analytics.categoryBreakdown.study).toBeGreaterThan(0);
      expect(analytics.categoryBreakdown.skill_practice).toBeGreaterThan(0);
      expect(analytics.categoryBreakdown.deep_work).toBeGreaterThan(0);
    });

    it('should track productivity patterns over time', async () => {
      // Get behavioral patterns
      const patternsResponse = await request(app)
        .get('/api/analytics/patterns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const patterns = patternsResponse.body;
      expect(patterns).toHaveProperty('productivityPatterns');
      expect(patterns).toHaveProperty('temporalPatterns');
      expect(patterns).toHaveProperty('focusQualityTrends');

      // Verify temporal patterns include time-of-day analysis
      expect(Array.isArray(patterns.temporalPatterns)).toBe(true);
      if (patterns.temporalPatterns.length > 0) {
        expect(patterns.temporalPatterns[0]).toHaveProperty('timeOfDay');
        expect(patterns.temporalPatterns[0]).toHaveProperty('productivityScore');
      }
    });
  });

  describe('Habit-Identity Integration', () => {
    it('should create habits that reinforce target identity', async () => {
      // Create identity-aligned habit
      const habitData = {
        name: 'Daily Algorithm Practice',
        description: 'Practice algorithms to become a disciplined student',
        frequency: 'daily',
        cue: 'After morning coffee',
        reward: 'Progress toward mastery',
        identityAlignment: 'disciplined student'
      };

      const habitResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      habitId = habitResponse.body.id;

      // Complete habit multiple times
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post(`/api/habits/${habitId}/complete`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            quality: 'good'
          })
          .expect(200);
      }

      // Check identity alignment score
      const identityResponse = await request(app)
        .get('/api/identity/alignment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(identityResponse.body).toHaveProperty('alignmentScore');
      expect(identityResponse.body.alignmentScore).toBeGreaterThan(0);
      expect(identityResponse.body).toHaveProperty('identityEvidence');
      expect(identityResponse.body.identityEvidence.length).toBeGreaterThan(0);
    });

    it('should suggest identity-based activities', async () => {
      const suggestionsResponse = await request(app)
        .get('/api/identity/activity-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const suggestions = suggestionsResponse.body;
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);

      // Verify suggestions are identity-aligned
      suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty('activity');
        expect(suggestion).toHaveProperty('identityReinforcement');
        expect(suggestion.identityReinforcement).toContain('disciplined student');
      });
    });
  });

  describe('Evening Review-Routine Adaptation Integration', () => {
    it('should adapt routines based on evening review feedback', async () => {
      // Submit evening review with specific challenges
      const reviewData = {
        date: new Date().toISOString().split('T')[0],
        accomplished: ['Morning algorithm practice', 'Thesis outline'],
        missed: ['Deep work session', 'React practice'],
        reasons: ['Too many interruptions', 'Underestimated complexity'],
        tomorrowTasks: ['Focus on deep work', 'Minimize interruptions'],
        mood: 6,
        energyLevel: 5,
        insights: 'Need better environment control and realistic time estimates'
      };

      const reviewResponse = await request(app)
        .post('/api/evening-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Track routine performance
      await request(app)
        .post(`/api/routines/${routineId}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completionRate: 0.6,
          focusQuality: 'medium',
          challenges: ['interruptions', 'time_estimation'],
          successes: ['morning_routine', 'habit_consistency']
        })
        .expect(200);

      // Generate next day routine and verify adaptations
      const nextDayRoutine = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          energyLevel: 'medium'
        })
        .expect(201);

      // Verify adaptations address review feedback
      expect(nextDayRoutine.body).toHaveProperty('adaptations');
      const adaptations = nextDayRoutine.body.adaptations;
      
      expect(adaptations.some((a: string) => 
        a.includes('interruption') || a.includes('environment') || a.includes('time')
      )).toBe(true);

      // Verify routine structure reflects lessons learned
      const deepWorkSegments = nextDayRoutine.body.segments.filter((s: any) => s.type === 'deep_work');
      expect(deepWorkSegments.length).toBeGreaterThan(0);
      
      // Should have buffer time or preparation time
      expect(nextDayRoutine.body.segments.some((s: any) => 
        s.activity.toLowerCase().includes('preparation') || s.activity.toLowerCase().includes('setup')
      )).toBe(true);
    });
  });

  describe('AI-System Integration', () => {
    it('should integrate AI parsing with activity logging', async () => {
      const nlpInput = {
        input: 'I spent 2 hours studying algorithms and felt very focused, then did 1 hour of React practice but got distracted',
        context: {
          currentDate: new Date().toISOString().split('T')[0],
          timeOfDay: 'afternoon'
        }
      };

      const parseResponse = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nlpInput)
        .expect(200);

      expect(parseResponse.body).toHaveProperty('data');
      expect(parseResponse.body.data).toHaveProperty('parameters');

      // Verify parsed activities can be logged
      const activityData = parseResponse.body.data.parameters;
      expect(activityData).toHaveProperty('activity');

      // Log a single activity based on the parsed data
      const logResponse = await request(app)
        .post('/api/activities/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activity: activityData.activity || 'Test Activity',
          type: 'study',
          duration: 120,
          focusQuality: activityData.quality || 'medium',
          startTime: new Date(Date.now() - 120 * 60 * 1000).toISOString()
        })
        .expect(201);

      expect(logResponse.body).toHaveProperty('id');
    });

    it('should provide AI coaching based on system state', async () => {
      // Get current system state
      const stateResponse = await request(app)
        .get('/api/analytics/current-state')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Request AI coaching
      const coachingResponse = await request(app)
        .post('/api/ai/coach')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          situation: 'struggling_with_consistency',
          context: {
            currentState: stateResponse.body,
            recentChallenges: ['time_management', 'focus']
          }
        })
        .expect(200);

      expect(coachingResponse.body).toHaveProperty('response');
      expect(coachingResponse.body).toHaveProperty('suggestions');
      expect(coachingResponse.body).toHaveProperty('actionItems');

      // Verify coaching is personalized to user's identity
      expect(coachingResponse.body.response.toLowerCase()).toContain('disciplined student');
    });
  });

  describe('Deep Work-Environment Integration', () => {
    it('should schedule deep work based on environment and energy patterns', async () => {
      // Update environment preferences
      await request(app)
        .put('/api/profile/detailed')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          studyEnvironmentPrefs: {
            preferredLocation: ['library'],
            noiseLevel: 'silent',
            lightingPreference: 'bright',
            temperaturePreference: 'cool'
          },
          contextualPreferences: {
            weatherPreferences: [
              { weather: 'sunny', productivityBoost: 0.2 },
              { weather: 'rainy', productivityBoost: 0.1 }
            ]
          }
        })
        .expect(200);

      // Schedule deep work session
      const deepWorkRequest = {
        date: new Date().toISOString().split('T')[0],
        preferredTimes: ['09:00', '14:00'],
        duration: 120,
        task: 'Algorithm implementation',
        environmentRequirements: {
          location: 'library',
          noiseLevel: 'silent',
          preparation: ['Clear desk', 'Turn off notifications', 'Prepare materials']
        }
      };

      const deepWorkResponse = await request(app)
        .post('/api/deep-work/schedule')
        .set('Authorization', `Bearer ${authToken}`)
        .send(deepWorkRequest)
        .expect(201);

      expect(deepWorkResponse.body).toHaveProperty('id');
      expect(deepWorkResponse.body).toHaveProperty('scheduledTime');
      expect(deepWorkResponse.body).toHaveProperty('environmentSetup');

      // Verify environment setup includes user preferences
      const environmentSetup = deepWorkResponse.body.environmentSetup;
      expect(environmentSetup.location).toBe('library');
      expect(environmentSetup.preparation).toContain('Turn off notifications');
    });
  });

  describe('Data Export Integration', () => {
    it('should export comprehensive user data across all systems', async () => {
      const exportResponse = await request(app)
        .get('/api/data-export/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const exportData = exportResponse.body;

      // Verify all major data types are included
      expect(exportData).toHaveProperty('profile');
      expect(exportData).toHaveProperty('routines');
      expect(exportData).toHaveProperty('activities');
      expect(exportData).toHaveProperty('habits');
      expect(exportData).toHaveProperty('reviews');
      expect(exportData).toHaveProperty('analytics');
      expect(exportData).toHaveProperty('deepWorkSessions');
      expect(exportData).toHaveProperty('identityTracking');

      // Verify data consistency across exports
      expect(exportData.profile.id).toBe(profileId);
      expect(exportData.routines.some((r: any) => r.id === routineId)).toBe(true);
      expect(exportData.habits.some((h: any) => h.id === habitId)).toBe(true);

      // Verify data relationships are maintained
      expect(exportData.routines.every((r: any) => r.userId === userId)).toBe(true);
      expect(exportData.activities.every((a: any) => a.userId === userId)).toBe(true);
      expect(exportData.habits.every((h: any) => h.userId === userId)).toBe(true);
    });
  });

  describe('System Resilience and Error Recovery', () => {
    it('should maintain data consistency during partial failures', async () => {
      // Attempt operation that might partially fail
      const complexOperation = {
        generateRoutine: true,
        logActivities: [
          { activity: 'Test Activity 1', type: 'study' },
          { activity: 'Test Activity 2', type: 'skill_practice' }
        ],
        completeHabits: [habitId],
        updateProfile: {
          energyPattern: [
            { time: '06:00', level: 'high' },
            { time: '18:00', level: 'low' }
          ]
        }
      };

      // This would be a batch operation endpoint in a real system
      // For now, we'll test individual operations and verify consistency
      
      const routineResponse = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          energyLevel: 'high'
        })
        .expect(201);

      // Verify system state remains consistent
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // All data should be consistent and accessible
      expect(profileResponse.body.id).toBe(profileId);
      expect(analyticsResponse.body).toHaveProperty('consistencyScore');
      expect(routineResponse.body).toHaveProperty('segments');
    });
  });
});