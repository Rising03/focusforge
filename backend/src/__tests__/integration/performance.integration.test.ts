import request from 'supertest';
import app from '../../index';

describe('Performance Integration Tests', () => {
  let authToken: string;
  let userId: string;

  // Increase timeout for performance tests
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Setup test user for performance tests with unique email
    const registrationData = {
      email: `performance-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Performance Test User'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registrationData);

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;

    // Setup basic profile
    await request(app)
      .post('/api/profile')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        targetIdentity: 'disciplined student',
        academicGoals: ['Test performance'],
        skillGoals: ['Optimize systems'],
        wakeUpTime: '06:00',
        sleepTime: '22:00',
        availableHours: 8
      });
  });

  describe('API Response Time Performance', () => {
    it('should respond to routine generation within acceptable time limits', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/routines/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          date: new Date().toISOString().split('T')[0],
          energyLevel: 'high',
          availableHours: 8
        })
        .expect(201);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
      expect(response.body).toHaveProperty('segments');
    });

    it('should handle analytics queries efficiently', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1000); // Analytics should be fast
      expect(response.body).toHaveProperty('consistencyScore');
    });

    it('should process activity tracking operations quickly', async () => {
      const startTime = Date.now();

      const startResponse = await request(app)
        .post('/api/activities/start')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          activity: 'Performance Test Activity',
          type: 'study'
        })
        .expect(201);

      const stopResponse = await request(app)
        .patch(`/api/activities/${startResponse.body.id}/stop`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          focusQuality: 'high',
          distractions: 0
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(500); // Activity tracking should be very fast
      expect(stopResponse.body).toHaveProperty('duration');
    });
  });

  describe('Concurrent Request Handling', () => {
    it('should handle multiple simultaneous routine generations', async () => {
      const concurrentRequests = 10;
      const requests = Array.from({ length: concurrentRequests }, (_, i) =>
        request(app)
          .post('/api/routines/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            energyLevel: 'medium',
            availableHours: 6
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const totalTime = Date.now() - startTime;

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('segments');
      });

      // Total time should be reasonable for concurrent processing
      expect(totalTime).toBeLessThan(5000); // 5 seconds for 10 concurrent requests
    });

    it('should handle concurrent activity tracking without conflicts', async () => {
      const concurrentActivities = 5;
      const activities = Array.from({ length: concurrentActivities }, (_, i) => ({
        activity: `Concurrent Activity ${i + 1}`,
        type: 'study'
      }));

      const startPromises = activities.map(activity =>
        request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send(activity)
      );

      const startTime = Date.now();
      const startResponses = await Promise.all(startPromises);
      
      // Stop all activities
      const stopPromises = startResponses.map(response =>
        request(app)
          .patch(`/api/activities/${response.body.id}/stop`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            focusQuality: 'medium',
            distractions: 1
          })
      );

      const stopResponses = await Promise.all(stopPromises);
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      startResponses.forEach(response => {
        expect(response.status).toBe(201);
      });

      stopResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(2000); // Should complete within 2 seconds
    });
  });

  describe('Data Volume Performance', () => {
    it('should handle large routine history queries efficiently', async () => {
      // Generate multiple routines for history
      const routinePromises = Array.from({ length: 30 }, (_, i) =>
        request(app)
          .post('/api/routines/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            energyLevel: 'medium',
            availableHours: 6
          })
      );

      await Promise.all(routinePromises);

      // Query routine history
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/routines/history?limit=30')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(1500); // Should handle large queries efficiently
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should handle bulk habit completion logging', async () => {
      // Create multiple habits
      const habitPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/habits')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: `Performance Habit ${i + 1}`,
            description: `Test habit for performance ${i + 1}`,
            frequency: 'daily',
            cue: `Test cue ${i + 1}`,
            reward: `Test reward ${i + 1}`
          })
      );

      const habitResponses = await Promise.all(habitPromises);

      // Log completions for multiple days
      const completionPromises = [];
      for (let day = 0; day < 7; day++) {
        for (const habitResponse of habitResponses) {
          completionPromises.push(
            request(app)
              .post(`/api/habits/${habitResponse.body.data.habit.id}/complete`)
              .set('Authorization', `Bearer ${authToken}`)
              .send({
                date: new Date(Date.now() - day * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                quality: 'good'
              })
          );
        }
      }

      const startTime = Date.now();
      const completionResponses = await Promise.all(completionPromises);
      const totalTime = Date.now() - startTime;

      // All completions should succeed
      completionResponses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(3000); // Should handle bulk operations efficiently
    });
  });

  describe('Memory Usage and Resource Management', () => {
    it('should not leak memory during repeated operations', async () => {
      const initialMemory = process.memoryUsage();

      // Perform many operations
      for (let i = 0; i < 100; i++) {
        const startResponse = await request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            activity: `Memory Test Activity ${i}`,
            type: 'study'
          });

        await request(app)
          .patch(`/api/activities/${startResponse.body.id}/stop`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            focusQuality: 'medium',
            distractions: 0
          });
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should handle database connection pooling efficiently', async () => {
      // Create many concurrent database operations
      const operations = Array.from({ length: 50 }, (_, i) =>
        request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const startTime = Date.now();
      const responses = await Promise.all(operations);
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Should complete within reasonable time despite many DB operations
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 50 operations
    });
  });

  describe('AI Service Performance', () => {
    it('should handle AI parsing requests within timeout limits', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          input: 'I studied mathematics for 2 hours and completed 5 problems',
          context: {
            currentActivity: 'study',
            timeOfDay: 'afternoon'
          }
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      // AI requests should complete within reasonable time
      expect(responseTime).toBeLessThan(5000); // 5 seconds max for AI processing
      expect(response.body).toHaveProperty('data');
    });

    it('should handle AI service failures gracefully without performance impact', async () => {
      // This test would require mocking AI service failures
      // For now, we'll test the fallback mechanism performance
      const startTime = Date.now();

      const response = await request(app)
        .post('/api/ai/parse')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          input: 'Complex input that might challenge AI parsing',
          context: { fallbackTest: true }
        })
        .expect(200);

      const responseTime = Date.now() - startTime;

      // Even with potential AI issues, response should be fast
      expect(responseTime).toBeLessThan(6000);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Data Export Performance', () => {
    it('should export complete user data within acceptable time', async () => {
      // Generate some data to export
      await Promise.all([
        // Create some activities
        ...Array.from({ length: 10 }, (_, i) =>
          request(app)
            .post('/api/activities/start')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ activity: `Export Test Activity ${i}`, type: 'study' })
            .then(response =>
              request(app)
                .patch(`/api/activities/${response.body.id}/stop`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ focusQuality: 'medium', distractions: 0 })
            )
        ),
        // Create some evening reviews
        ...Array.from({ length: 5 }, (_, i) =>
          request(app)
            .post('/api/evening-reviews')
            .set('Authorization', `Bearer ${authToken}`)
            .send({
              date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              accomplished: [`Task ${i}`],
              missed: [],
              reasons: [],
              mood: 8,
              energyLevel: 7,
              insights: `Insight ${i}`
            })
        )
      ]);

      // Export data
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/data-export/export')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const responseTime = Date.now() - startTime;

      expect(responseTime).toBeLessThan(3000); // Export should complete within 3 seconds
      expect(response.body).toHaveProperty('profile');
      expect(response.body).toHaveProperty('activities');
      expect(response.body).toHaveProperty('reviews');
    });
  });

  describe('System Stress Testing', () => {
    it('should maintain performance under sustained load', async () => {
      const testDuration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const startTime = Date.now();
      const responses: any[] = [];
      let requestCount = 0;

      while (Date.now() - startTime < testDuration) {
        const requestPromise = request(app)
          .get('/api/analytics/dashboard')
          .set('Authorization', `Bearer ${authToken}`)
          .then(response => {
            responses.push(response);
            return response;
          });

        requestCount++;
        
        // Wait for interval before next request
        await new Promise(resolve => setTimeout(resolve, requestInterval));
      }

      // Wait for all requests to complete
      await Promise.all(responses);

      // Calculate success rate
      const successfulResponses = responses.filter(r => r.status === 200).length;
      const successRate = successfulResponses / requestCount;

      expect(successRate).toBeGreaterThan(0.95); // 95% success rate under load
      expect(requestCount).toBeGreaterThan(50); // Should have made many requests
    });
  });
});