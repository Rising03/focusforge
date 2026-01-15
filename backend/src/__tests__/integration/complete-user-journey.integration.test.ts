import request from 'supertest';
import app from '../../index';

describe('Complete User Journey Integration Tests - Registration to Feature Usage', () => {
  let authToken: string;
  let userId: string;
  let profileId: string;
  let routineId: string;
  let habitId: string;
  let activitySessionId: string;
  let deepWorkSessionId: string;

  // Increase timeout for comprehensive integration tests
  jest.setTimeout(60000);

  describe('End-to-End User Journey: Registration to Full Feature Usage', () => {
    it('Step 1: User Registration and Authentication', async () => {
      // Test user registration with unique email
      const registrationData = {
        email: `journey-test-${Date.now()}@example.com`,
        password: 'SecurePassword123!',
        name: 'Journey Test User'
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registrationData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('accessToken');
      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user.email).toBe(registrationData.email);

      authToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;

      // Verify token works for authenticated requests
      const profileCheckResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileCheckResponse.body).toBeDefined();
    });

    it('Step 2: Initial Profile Setup and Identity Definition', async () => {
      // Create basic profile with target identity
      const profileData = {
        targetIdentity: 'disciplined computer science student',
        academicGoals: [
          'Complete data structures course with A grade',
          'Master algorithm design patterns',
          'Build portfolio projects'
        ],
        skillGoals: [
          'Advanced React development',
          'System design principles',
          'Problem-solving techniques'
        ],
        wakeUpTime: '06:00',
        sleepTime: '22:30',
        availableHours: 8,
        energyPattern: [
          { time: '06:00', level: 'high' },
          { time: '09:00', level: 'high' },
          { time: '14:00', level: 'medium' },
          { time: '18:00', level: 'medium' },
          { time: '21:00', level: 'low' }
        ]
      };

      const profileResponse = await request(app)
        .post('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(profileData)
        .expect(201);

      expect(profileResponse.body).toHaveProperty('id');
      expect(profileResponse.body.targetIdentity).toBe(profileData.targetIdentity);
      expect(profileResponse.body.academicGoals).toEqual(profileData.academicGoals);
      expect(profileResponse.body.skillGoals).toEqual(profileData.skillGoals);

      profileId = profileResponse.body.id;
    });

    it('Step 3: Detailed Profile Questionnaire and Personalization', async () => {
      // Complete detailed profiling for personalization
      const detailedProfileData = {
        learningStyle: 'visual',
        productivityPeaks: ['early_morning', 'late_morning'],
        distractionTriggers: ['social_media', 'notifications', 'noise'],
        motivationFactors: ['progress_tracking', 'achievement', 'identity_reinforcement'],
        studyEnvironmentPrefs: {
          preferredLocation: ['library', 'quiet_room', 'home_office'],
          noiseLevel: 'quiet',
          lightingPreference: 'bright',
          temperaturePreference: 'cool',
          organizationStyle: 'minimal'
        },
        challengeAreas: ['time_management', 'procrastination', 'consistency'],
        personalityTraits: {
          workStyle: 'structured',
          socialPreference: 'solo',
          feedbackStyle: 'encouraging',
          challengeLevel: 'gradual'
        },
        academicBackground: {
          currentLevel: 'undergraduate',
          subjects: ['computer_science', 'mathematics'],
          learningGoals: ['theoretical_understanding', 'practical_application'],
          timeConstraints: ['part_time_job', 'family_commitments'],
          previousChallenges: ['math_anxiety', 'time_pressure']
        }
      };

      const detailedResponse = await request(app)
        .put('/api/profile/detailed')
        .set('Authorization', `Bearer ${authToken}`)
        .send(detailedProfileData)
        .expect(200);

      expect(detailedResponse.body).toHaveProperty('success', true);

      // Verify detailed profile was saved
      const profileVerification = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(profileVerification.body.detailedProfile).toBeDefined();
      expect(profileVerification.body.detailedProfile.learningStyle).toBe('visual');
    });

    it('Step 4: Daily Routine Generation Based on Profile', async () => {
      // Generate personalized daily routine
      const routineRequest = {
        date: new Date().toISOString().split('T')[0],
        energyLevel: 'high',
        availableHours: 8,
        priorities: ['study', 'skill_practice', 'deep_work'],
        contextualFactors: {
          dayOfWeek: new Date().getDay(),
          hasExams: false,
          workload: 'normal'
        }
      };

      const routineResponse = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(routineRequest)
        .expect(201);

      expect(routineResponse.body).toHaveProperty('id');
      expect(routineResponse.body).toHaveProperty('segments');
      expect(routineResponse.body.segments).toHaveLength(3); // morning, afternoon, evening

      routineId = routineResponse.body.id;

      // Verify routine incorporates profile preferences
      const segments = routineResponse.body.segments;
      expect(segments.some((s: any) => s.type === 'deep_work')).toBe(true);
      expect(segments.some((s: any) => s.type === 'study')).toBe(true);
      expect(segments.some((s: any) => s.type === 'skill_practice')).toBe(true);

      // Verify high-energy activities are scheduled during peak times (early morning)
      const morningSegments = segments.filter((s: any) => 
        s.timeSlot.start.startsWith('06:') || s.timeSlot.start.startsWith('07:') || s.timeSlot.start.startsWith('08:')
      );
      expect(morningSegments.length).toBeGreaterThan(0);
    });

    it('Step 5: Activity Tracking and Time Management', async () => {
      // Start activity tracking session
      const activityStart = {
        activity: 'Data Structures Study Session',
        type: 'study',
        plannedDuration: 90,
        tags: ['algorithms', 'computer_science'],
        environment: {
          location: 'library',
          noiseLevel: 'quiet'
        }
      };

      const startResponse = await request(app)
        .post('/api/activities/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send(activityStart)
        .expect(201);

      expect(startResponse.body).toHaveProperty('data');
      expect(startResponse.body.data).toHaveProperty('session');
      activitySessionId = startResponse.body.data.session.id;

      // Simulate activity duration
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stop activity with quality metrics
      const stopResponse = await request(app)
        .patch(`/api/activities/${activitySessionId}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusQuality: 'high',
          distractions: 1,
          notes: 'Excellent focus on binary trees, minor phone distraction',
          achievements: ['Completed tree traversal exercises', 'Understood recursion better'],
          challenges: ['Complex time complexity analysis']
        })
        .expect(200);

      expect(stopResponse.body).toHaveProperty('duration');
      expect(stopResponse.body.focusQuality).toBe('high');

      // Verify activity appears in daily stats
      const statsResponse = await request(app)
        .get(`/api/activities/stats/${new Date().toISOString().split('T')[0]}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsResponse.body).toHaveProperty('focusedTime');
      expect(statsResponse.body).toHaveProperty('categories');
      expect(statsResponse.body.focusedTime).toBeGreaterThan(0);
    });

    it('Step 6: Habit Creation and Identity Reinforcement', async () => {
      // Create identity-aligned habit
      const habitData = {
        name: 'Morning Algorithm Practice',
        description: 'Practice one algorithm problem to reinforce disciplined student identity',
        frequency: 'daily',
        cue: 'After morning coffee and before first class',
        reward: 'Progress toward becoming a disciplined computer science student',
        identityAlignment: 'disciplined computer science student',
        estimatedDuration: 30,
        difficulty: 'medium'
      };

      const habitResponse = await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send(habitData)
        .expect(201);

      expect(habitResponse.body).toHaveProperty('data');
      expect(habitResponse.body.data).toHaveProperty('habit');
      expect(habitResponse.body.data.habit.name).toBe(habitData.name);

      habitId = habitResponse.body.data.habit.id;

      // Complete habit with quality assessment
      const completionResponse = await request(app)
        .post(`/api/habits/${habitId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          quality: 'excellent',
          notes: 'Solved binary search problem efficiently, felt confident',
          timeSpent: 25,
          identityReinforcement: 'Felt like a disciplined student taking consistent action'
        })
        .expect(200);

      expect(completionResponse.body).toHaveProperty('success', true);

      // Verify habit streak tracking
      const streaksResponse = await request(app)
        .get('/api/habits/streaks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(streaksResponse.body)).toBe(true);
      const habitStreak = streaksResponse.body.find((h: any) => h.habitId === habitId);
      expect(habitStreak).toBeDefined();
      expect(habitStreak.currentStreak).toBeGreaterThanOrEqual(1);
    });

    it('Step 7: Deep Work Session Management', async () => {
      // Schedule deep work session
      const deepWorkRequest = {
        date: new Date().toISOString().split('T')[0],
        preferredTimes: ['09:00', '14:00'],
        duration: 120,
        task: 'Algorithm Implementation Project',
        preparation: [
          'Clear desk and organize materials',
          'Turn off all notifications',
          'Prepare water and snacks',
          'Set up development environment'
        ],
        environmentRequirements: {
          location: 'library',
          noiseLevel: 'silent',
          tools: ['laptop', 'notebook', 'reference_books']
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

      deepWorkSessionId = deepWorkResponse.body.id;

      // Start deep work session
      const sessionStartResponse = await request(app)
        .post(`/api/deep-work/${deepWorkSessionId}/start`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualStartTime: new Date().toISOString(),
          preparationCompleted: true,
          environmentReady: true
        })
        .expect(200);

      expect(sessionStartResponse.body).toHaveProperty('sessionId');

      // Simulate deep work session progress
      await new Promise(resolve => setTimeout(resolve, 100));

      // End deep work session with insights
      const sessionEndResponse = await request(app)
        .post(`/api/deep-work/${deepWorkSessionId}/end`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          actualDuration: 115,
          qualityRating: 9,
          insights: 'Achieved flow state after 15 minutes, implemented binary search tree successfully',
          challenges: ['Initial difficulty with recursion logic'],
          achievements: ['Completed tree insertion and deletion methods'],
          cognitiveLoad: 'high',
          distractionCount: 0
        })
        .expect(200);

      expect(sessionEndResponse.body).toHaveProperty('success', true);
    });

    it('Step 8: Natural Language Processing and AI Integration', async () => {
      // Test AI parsing of natural language input
      const nlpInput = {
        input: 'I just finished a 2-hour study session on data structures, felt very focused and completed all binary tree exercises. Want to plan tomorrow to include more algorithm practice.',
        context: {
          currentDate: new Date().toISOString().split('T')[0],
          timeOfDay: 'afternoon',
          recentActivities: ['study'],
          currentGoals: ['master algorithms', 'improve problem-solving']
        }
      };

      const parseResponse = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${authToken}`)
        .send(nlpInput)
        .expect(200);

      // AI service is disabled in test environment, so expect fallback
      expect(parseResponse.body).toHaveProperty('data');
      if (parseResponse.body.success) {
        expect(parseResponse.body.data).toHaveProperty('parameters');
      } else {
        expect(parseResponse.body).toHaveProperty('fallbackOptions');
        expect(parseResponse.body.fallbackOptions).toHaveProperty('suggestedActions');
      }

      // Test AI coaching response
      const coachingResponse = await request(app)
        .post('/api/ai/coach')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          situation: 'successful_study_session',
          context: {
            recentSuccess: 'completed_binary_tree_exercises',
            identityGoal: 'disciplined computer science student',
            nextChallenge: 'algorithm_practice'
          }
        })
        .expect(200);

      expect(coachingResponse.body).toHaveProperty('response');
      expect(coachingResponse.body).toHaveProperty('suggestions');
    });

    it('Step 9: Evening Review and Reflection Process', async () => {
      // Complete comprehensive evening review
      const reviewData = {
        date: new Date().toISOString().split('T')[0],
        accomplished: [
          'Completed 2-hour data structures study session',
          'Finished morning algorithm practice habit',
          'Successfully completed deep work session on tree implementation',
          'Maintained focus with minimal distractions'
        ],
        missed: [
          'Planned reading session on system design'
        ],
        reasons: [
          'Deep work session ran longer than expected, but was highly productive'
        ],
        tomorrowTasks: [
          'Continue with graph algorithms',
          'Review system design principles',
          'Practice coding interview questions',
          'Plan weekend project work'
        ],
        mood: 8,
        energyLevel: 7,
        insights: 'Deep work sessions are most effective in the morning. Need to protect this time better.',
        identityReflection: 'Felt like a disciplined student today - consistent action on habits and deep focus',
        challengesOvercome: ['Initial recursion confusion', 'Maintained focus despite phone notifications'],
        gratitude: ['Access to quiet library space', 'Progress in understanding complex concepts'],
        tomorrowIntention: 'Focus on graph algorithms with same deep work approach'
      };

      const reviewResponse = await request(app)
        .post('/api/evening-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(reviewResponse.body).toHaveProperty('id');
      expect(reviewResponse.body.mood).toBe(reviewData.mood);
      expect(reviewResponse.body.insights).toBe(reviewData.insights);

      // Verify review influences routine adaptation
      const adaptationResponse = await request(app)
        .post(`/api/routines/${routineId}/performance`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          completionRate: 0.9,
          focusQuality: 'high',
          challenges: ['time_estimation'],
          successes: ['deep_work_sessions', 'habit_consistency', 'identity_alignment'],
          insights: reviewData.insights
        })
        .expect(200);

      expect(adaptationResponse.body).toHaveProperty('success', true);
    });

    it('Step 10: Analytics Dashboard and Progress Visualization', async () => {
      // Get comprehensive analytics dashboard
      const analyticsResponse = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(analyticsResponse.body).toHaveProperty('consistencyScore');
      expect(analyticsResponse.body).toHaveProperty('identityAlignment');
      expect(analyticsResponse.body).toHaveProperty('deepWorkHours');
      expect(analyticsResponse.body).toHaveProperty('habitStreaks');
      expect(analyticsResponse.body).toHaveProperty('categoryBreakdown');

      // Verify metrics reflect user activity
      expect(analyticsResponse.body.deepWorkHours).toBeGreaterThan(0);
      expect(analyticsResponse.body.consistencyScore).toBeGreaterThan(0);

      // Get behavioral patterns analysis
      const patternsResponse = await request(app)
        .get('/api/analytics/patterns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(patternsResponse.body).toHaveProperty('productivityPatterns');
      expect(patternsResponse.body).toHaveProperty('temporalPatterns');
      expect(patternsResponse.body).toHaveProperty('focusQualityTrends');

      // Get identity alignment tracking
      const identityResponse = await request(app)
        .get('/api/identity/alignment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(identityResponse.body).toHaveProperty('alignmentScore');
      expect(identityResponse.body).toHaveProperty('identityEvidence');
      expect(identityResponse.body.alignmentScore).toBeGreaterThan(0);
    });

    it('Step 11: Data Export and Portability', async () => {
      // Export comprehensive user data
      const exportResponse = await request(app)
        .get('/api/data-export/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const exportData = exportResponse.body;

      // Verify all major data categories are included
      expect(exportData).toHaveProperty('profile');
      expect(exportData).toHaveProperty('routines');
      expect(exportData).toHaveProperty('activities');
      expect(exportData).toHaveProperty('habits');
      expect(exportData).toHaveProperty('reviews');
      expect(exportData).toHaveProperty('analytics');
      expect(exportData).toHaveProperty('deepWorkSessions');
      expect(exportData).toHaveProperty('identityTracking');

      // Verify data consistency and completeness
      if (exportData.profile) {
        expect(exportData.profile.targetIdentity).toBe('disciplined computer science student');
      }
      expect(Array.isArray(exportData.routines)).toBe(true);
      expect(Array.isArray(exportData.activities)).toBe(true);
      expect(Array.isArray(exportData.habits)).toBe(true);
      expect(Array.isArray(exportData.reviews)).toBe(true);

      // Verify data relationships are maintained
      expect(exportData.routines.every((r: any) => r.userId === userId)).toBe(true);
      expect(exportData.activities.every((a: any) => a.userId === userId)).toBe(true);
      expect(exportData.habits.every((h: any) => h.userId === userId)).toBe(true);
    });

    it('Step 12: System Adaptation and Continuous Learning', async () => {
      // Generate next day routine to verify system adaptation
      const nextDayRoutine = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          energyLevel: 'high',
          availableHours: 8
        })
        .expect(201);

      // Verify routine incorporates learning from previous day
      expect(nextDayRoutine.body).toHaveProperty('segments');
      expect(nextDayRoutine.body.segments).toHaveLength(3);

      // Should prioritize deep work in morning based on successful pattern
      const morningSegments = nextDayRoutine.body.segments.filter((s: any) => 
        s.timeSlot.start.startsWith('06:') || s.timeSlot.start.startsWith('07:') || s.timeSlot.start.startsWith('08:') || s.timeSlot.start.startsWith('09:')
      );
      expect(morningSegments.some((s: any) => s.type === 'deep_work')).toBe(true);

      // Verify behavioral tracking has been updated
      const behavioralResponse = await request(app)
        .get('/api/analytics/behavioral-patterns')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(behavioralResponse.body).toHaveProperty('interactionPatterns');
      expect(behavioralResponse.body).toHaveProperty('adaptationHistory');
    });
  });

  describe('Cross-Component Integration Validation', () => {
    it('should validate profile-routine-activity integration', async () => {
      // Verify profile preferences influence routine generation
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const routineResponse = await request(app)
        .get(`/api/routines/${routineId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify routine reflects profile preferences
      expect(routineResponse.body.segments.some((s: any) => 
        s.activity.toLowerCase().includes('algorithm') || 
        s.activity.toLowerCase().includes('data structure') ||
        s.activity.toLowerCase().includes('computer science')
      )).toBe(true);
    });

    it('should validate habit-identity-analytics integration', async () => {
      // Verify habit completion affects identity alignment
      const identityBefore = await request(app)
        .get('/api/identity/alignment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Complete another habit instance
      await request(app)
        .post(`/api/habits/${habitId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          quality: 'good',
          notes: 'Consistent progress on algorithm practice'
        })
        .expect(200);

      const identityAfter = await request(app)
        .get('/api/identity/alignment')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Identity alignment should be maintained or improved
      expect(identityAfter.body.alignmentScore).toBeGreaterThanOrEqual(identityBefore.body.alignmentScore);
    });

    it('should validate evening review influences next-day planning', async () => {
      // Submit review with specific insights
      const reviewData = {
        date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        accomplished: ['Morning deep work session'],
        missed: ['Afternoon review session'],
        reasons: ['Energy dip after lunch'],
        insights: 'Need to schedule lighter activities after lunch',
        tomorrowTasks: ['Focus on morning productivity', 'Plan post-lunch activities carefully']
      };

      await request(app)
        .post('/api/evening-reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      // Generate routine for day after review
      const adaptedRoutine = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          energyLevel: 'medium'
        })
        .expect(201);

      // Verify routine adaptation based on review insights
      expect(adaptedRoutine.body.segments).toBeDefined();
      expect(adaptedRoutine.body.segments.length).toBeGreaterThan(0);
    });
  });

  describe('System Resilience Under Normal Usage Patterns', () => {
    it('should handle concurrent user operations', async () => {
      // Simulate concurrent operations that a user might perform
      const concurrentOperations = [
        request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/habits/streaks')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get(`/api/activities/stats/${new Date().toISOString().split('T')[0]}`)
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/identity/alignment')
          .set('Authorization', `Bearer ${authToken}`),
        request(app)
          .get('/api/profile')
          .set('Authorization', `Bearer ${authToken}`)
      ];

      const results = await Promise.all(concurrentOperations);
      
      // All operations should succeed
      results.forEach(result => {
        expect(result.status).toBe(200);
        expect(result.body).toBeDefined();
      });
    });

    it('should maintain data consistency across multiple sessions', async () => {
      // Verify data persists across multiple API calls
      const initialProfile = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const initialHabits = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Perform some operations
      await request(app)
        .post('/api/activities/log')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activity: 'Quick review session',
          type: 'study',
          duration: 30,
          focusQuality: 'medium',
          startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        })
        .expect(201);

      // Verify data consistency
      const finalProfile = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const finalHabits = await request(app)
        .get('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalProfile.body.id).toBe(initialProfile.body.id);
      expect(finalProfile.body.targetIdentity).toBe(initialProfile.body.targetIdentity);
      expect(finalHabits.body.length).toBe(initialHabits.body.length);
    });

    it('should handle realistic user workflow patterns', async () => {
      // Simulate a realistic daily workflow
      const workflowSteps = [
        // Morning routine check
        () => request(app)
          .get(`/api/routines/today`)
          .set('Authorization', `Bearer ${authToken}`),
        
        // Start morning activity
        () => request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            activity: 'Morning algorithm review',
            type: 'study'
          }),
        
        // Check habit status
        () => request(app)
          .get('/api/habits/today')
          .set('Authorization', `Bearer ${authToken}`),
        
        // Update profile energy
        () => request(app)
          .patch('/api/profile/energy')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ currentEnergyLevel: 'high' }),
        
        // Check analytics
        () => request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
      ];

      // Execute workflow steps sequentially
      for (const step of workflowSteps) {
        const response = await step();
        expect([200, 201].includes(response.status)).toBe(true);
      }
    });
  });

  describe('Error Recovery and Edge Cases', () => {
    it('should handle authentication edge cases gracefully', async () => {
      // Test expired token handling
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Test missing authorization header
      await request(app)
        .get('/api/profile')
        .expect(401);

      // Test malformed authorization header
      await request(app)
        .get('/api/profile')
        .set('Authorization', 'InvalidFormat')
        .expect(401);
    });

    it('should handle data validation edge cases', async () => {
      // Test invalid routine generation request
      await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: 'invalid-date',
          energyLevel: 'invalid-level'
        })
        .expect(400);

      // Test invalid habit creation
      await request(app)
        .post('/api/habits')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Empty name should be invalid
          frequency: 'invalid-frequency'
        })
        .expect(400);
    });

    it('should maintain system stability under error conditions', async () => {
      // Attempt operations that might fail but shouldn't crash the system
      const errorProneOperations = [
        request(app)
          .get('/api/nonexistent-endpoint')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404),
        
        request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({ invalidData: 'test' })
          .expect(400),
        
        request(app)
          .get('/api/routines/nonexistent-id')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404)
      ];

      await Promise.all(errorProneOperations);

      // Verify system is still functional after errors
      const healthCheck = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(healthCheck.body).toBeDefined();
    });
  });
});