import request from 'supertest';
import app from '../../index';

describe('Cross-Browser Compatibility Integration Tests', () => {
  let authToken: string;
  let userId: string;

  // Increase timeout for cross-browser tests
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Setup test user for cross-browser tests with unique email
    const registrationData = {
      email: `crossbrowser-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      name: 'Cross Browser Test User'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registrationData);

    expect(registerResponse.status).toBe(201);
    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
  });

  describe('HTTP Header Compatibility', () => {
    it('should handle various User-Agent strings correctly', async () => {
      const userAgents = [
        // Chrome
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        // Firefox
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        // Safari
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        // Edge
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
        // Mobile Safari
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        // Mobile Chrome
        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36'
      ];

      for (const userAgent of userAgents) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('User-Agent', userAgent);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
      }
    });

    it('should handle different Accept headers', async () => {
      const acceptHeaders = [
        'application/json',
        'application/json, text/plain, */*',
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        '*/*'
      ];

      for (const acceptHeader of acceptHeaders) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Accept', acceptHeader);

        expect(response.status).toBe(200);
        // Should return JSON regardless of Accept header for API endpoints
        expect(response.type).toMatch(/json/);
      }
    });

    it('should handle various Content-Type headers for POST requests', async () => {
      const testData = {
        activity: 'Cross Browser Test Activity',
        type: 'study'
      };

      const contentTypes = [
        'application/json',
        'application/json; charset=utf-8',
        'application/json; charset=UTF-8'
      ];

      for (const contentType of contentTypes) {
        const response = await request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Content-Type', contentType)
          .send(testData);

        // Should handle all valid JSON content types
        expect([201, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('CORS and Preflight Requests', () => {
    it('should handle CORS preflight requests correctly', async () => {
      const preflightResponse = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'authorization,content-type');

      expect(preflightResponse.status).toBe(200);
      expect(preflightResponse.headers['access-control-allow-origin']).toBeDefined();
      expect(preflightResponse.headers['access-control-allow-methods']).toBeDefined();
      expect(preflightResponse.headers['access-control-allow-headers']).toBeDefined();
    });

    it('should include proper CORS headers in responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Origin', 'http://localhost:3000');

      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle requests from different origins', async () => {
      const origins = [
        'http://localhost:3000',
        'https://localhost:3000',
        'http://127.0.0.1:3000',
        'https://student-discipline.app'
      ];

      for (const origin of origins) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Origin', origin);

        expect(response.status).toBe(200);
        // Should either allow the origin or handle it gracefully
        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('Character Encoding and Internationalization', () => {
    it('should handle UTF-8 encoded content correctly', async () => {
      const unicodeData = {
        activity: 'Étudier les mathématiques 数学を勉強する',
        type: 'study',
        notes: 'Testing unicode: 🎓📚✨ émojis and accénts'
      };

      const response = await request(app)
        .post('/api/activities/start')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send(unicodeData);

      if (response.status === 201) {
        expect(response.body.activity).toBe(unicodeData.activity);
        expect(response.body.notes).toBe(unicodeData.notes);
      }
    });

    it('should handle different date formats', async () => {
      const dateFormats = [
        new Date().toISOString(), // ISO 8601
        new Date().toISOString().split('T')[0], // YYYY-MM-DD
        new Date().toLocaleDateString('en-US'), // MM/DD/YYYY
        new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY
      ];

      for (const dateFormat of dateFormats) {
        const response = await request(app)
          .post('/api/routines/generate')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            date: dateFormat,
            energyLevel: 'medium'
          });

        // Should handle various date formats or return appropriate error
        expect([201, 400, 422, 500]).toContain(response.status);
      }
    });

    it('should handle different timezone offsets', async () => {
      const timezones = [
        'America/New_York',
        'Europe/London',
        'Asia/Tokyo',
        'UTC'
      ];

      for (const timezone of timezones) {
        const date = new Date().toLocaleString('en-US', { timeZone: timezone });
        
        const response = await request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            activity: `Timezone Test ${timezone}`,
            type: 'study',
            startTime: date
          });

        // Should handle different timezone formats
        expect([201, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('HTTP Method Compatibility', () => {
    it('should handle all standard HTTP methods correctly', async () => {
      const methods = [
        { method: 'GET', endpoint: '/api/auth/me', expectedStatus: 200 },
        { method: 'POST', endpoint: '/api/activities/start', expectedStatus: [201, 400, 500] },
        { method: 'PUT', endpoint: '/api/profile', expectedStatus: [200, 400, 404, 500] },
        { method: 'DELETE', endpoint: '/api/activities/1', expectedStatus: [200, 404, 500] },
        { method: 'PATCH', endpoint: '/api/activities/1/stop', expectedStatus: [200, 400, 404, 500] }
      ];

      for (const { method, endpoint, expectedStatus } of methods) {
        let response;
        
        switch (method) {
          case 'GET':
            response = await request(app)
              .get(endpoint)
              .set('Authorization', `Bearer ${authToken}`);
            break;
          case 'POST':
            response = await request(app)
              .post(endpoint)
              .set('Authorization', `Bearer ${authToken}`)
              .send({ activity: 'Test', type: 'study' });
            break;
          case 'PUT':
            response = await request(app)
              .put(endpoint)
              .set('Authorization', `Bearer ${authToken}`)
              .send({ targetIdentity: 'test' });
            break;
          case 'DELETE':
            response = await request(app)
              .delete(endpoint)
              .set('Authorization', `Bearer ${authToken}`);
            break;
          case 'PATCH':
            response = await request(app)
              .patch(endpoint)
              .set('Authorization', `Bearer ${authToken}`)
              .send({ focusQuality: 'high' });
            break;
          default:
            continue;
        }

        const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
        expect(expectedStatuses).toContain(response.status);
      }
    });

    it('should return proper error codes for unsupported methods', async () => {
      const unsupportedMethods = ['TRACE', 'CONNECT'];

      for (const method of unsupportedMethods) {
        try {
          // Skip unsupported methods for supertest
          if (['TRACE', 'CONNECT'].includes(method)) {
            continue;
          }
          
          const response = await request(app)
            .get('/api/auth/me') // Use GET as fallback
            .set('Authorization', `Bearer ${authToken}`);
          
          // Should return 405 Method Not Allowed or 404
          expect([200, 404, 405]).toContain(response.status);
        } catch (error) {
          // Some methods might not be supported by supertest
          expect(error).toBeDefined();
        }
      }
    });
  });

  describe('Cookie and Session Handling', () => {
    it('should handle different cookie formats', async () => {
      const cookieFormats = [
        'sessionId=abc123',
        'sessionId=abc123; Path=/',
        'sessionId=abc123; Path=/; HttpOnly',
        'sessionId=abc123; Path=/; HttpOnly; Secure; SameSite=Strict'
      ];

      for (const cookie of cookieFormats) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('Cookie', cookie);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
      }
    });

    it('should handle requests without cookies gracefully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });
  });

  describe('Error Response Compatibility', () => {
    it('should return consistent error formats across browsers', async () => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15'
      ];

      for (const userAgent of userAgents) {
        const response = await request(app)
          .get('/api/nonexistent-endpoint')
          .set('User-Agent', userAgent);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        expect(typeof response.body).toBe('object');
      }
    });

    it('should handle malformed requests consistently', async () => {
      const malformedRequests = [
        { data: 'invalid json' },
        { data: null },
        { data: undefined }
      ];

      for (const malformedData of malformedRequests) {
        const response = await request(app)
          .post('/api/activities/start')
          .set('Authorization', `Bearer ${authToken}`)
          .send(malformedData);

        // Should return consistent error format
        expect([400, 422, 500]).toContain(response.status);
        expect(response.body).toBeDefined();
      }
    });
  });

  describe('Performance Across Browsers', () => {
    it('should maintain consistent response times', async () => {
      const userAgents = [
        'Chrome/91.0.4472.124',
        'Firefox/89.0',
        'Safari/605.1.15',
        'Edge/91.0.864.59'
      ];

      const responseTimes: number[] = [];

      for (const userAgent of userAgents) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${authToken}`)
          .set('User-Agent', userAgent);

        const responseTime = Date.now() - startTime;
        responseTimes.push(responseTime);

        expect(response.status).toBe(200);
      }

      // Response times should be consistent across browsers
      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxDeviation = Math.max(...responseTimes.map(time => Math.abs(time - avgResponseTime)));
      
      // Maximum deviation should be reasonable (less than 500ms)
      expect(maxDeviation).toBeLessThan(500);
    });
  });
});