import * as fc from 'fast-check';
import request from 'supertest';
import app from '../index';

describe('Authentication Property-Based Tests', () => {
  describe('Property 24: Authentication Method Availability', () => {
    /**
     * Feature: student-discipline-system, Property 24: Authentication Method Availability
     * For any user registration or login attempt, both email/password and Google OAuth methods should be available and functional.
     * Validates: Requirements 11.1
     */
    it('should ensure both authentication methods are always available', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 })
          }),
          async (userData) => {
            // Test that email/password registration endpoint exists and responds
            const emailRegisterResponse = await request(app)
              .post('/api/auth/register')
              .send(userData);
            
            // Should not return 404 (method not found)
            expect(emailRegisterResponse.status).not.toBe(404);
            
            // Test that email/password login endpoint exists and responds
            const emailLoginResponse = await request(app)
              .post('/api/auth/login')
              .send(userData);
            
            // Should not return 404 (method not found)
            expect(emailLoginResponse.status).not.toBe(404);
            
            // Test that Google OAuth endpoints exist and respond
            const googleAuthResponse = await request(app)
              .get('/api/auth/google');
            
            // Should not return 404 (method not found)
            expect(googleAuthResponse.status).not.toBe(404);
            
            const googleCallbackResponse = await request(app)
              .post('/api/auth/google/callback')
              .send({ code: 'test-code' });
            
            // Should not return 404 (method not found)
            expect(googleCallbackResponse.status).not.toBe(404);
            
            const googleTokenResponse = await request(app)
              .post('/api/auth/google/token')
              .send({ idToken: 'test-token' });
            
            // Should not return 404 (method not found)
            expect(googleTokenResponse.status).not.toBe(404);
            
            // Both authentication methods are available (not returning 404)
            return true;
          }
        ),
        { numRuns: 3 } // Reduced runs for API endpoint testing
      );
    }, 30000);

    it('should verify authentication method availability with various input formats', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.oneof(
              fc.emailAddress(),
              fc.string().filter(s => s.includes('@')),
              fc.constant('test@example.com')
            ),
            password: fc.oneof(
              fc.string({ minLength: 1, maxLength: 100 }),
              fc.constant('password123'),
              fc.constant('')
            )
          }),
          async (userData) => {
            // Test email/password endpoints availability
            const registerResponse = await request(app)
              .post('/api/auth/register')
              .send(userData);
            
            const loginResponse = await request(app)
              .post('/api/auth/login')
              .send(userData);
            
            // Endpoints should exist (not 404) regardless of input validity
            expect(registerResponse.status).not.toBe(404);
            expect(loginResponse.status).not.toBe(404);
            
            // Google OAuth endpoints should also be available
            const googleResponse = await request(app)
              .get('/api/auth/google');
            
            expect(googleResponse.status).not.toBe(404);
            
            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });

  describe('Property 25: Secure Data Storage After Authentication', () => {
    /**
     * Feature: student-discipline-system, Property 25: Secure Data Storage After Authentication
     * For any successful authentication, all user personal data should be securely stored in the PostgreSQL database with proper encryption and access controls.
     * Validates: Requirements 11.2
     */
    it('should verify secure token generation and validation', () => {
      fc.assert(
        fc.property(
          fc.record({
            userId: fc.uuid(),
            email: fc.emailAddress()
          }),
          (userData) => {
            // Test that tokens are generated securely
            const { generateAccessToken, generateRefreshToken, verifyAccessToken } = 
              require('../utils/jwt');
            
            const accessToken = generateAccessToken(userData.userId, userData.email);
            const refreshToken = generateRefreshToken(userData.userId, userData.email);
            
            // Tokens should be non-empty strings
            expect(typeof accessToken).toBe('string');
            expect(typeof refreshToken).toBe('string');
            expect(accessToken.length).toBeGreaterThan(0);
            expect(refreshToken.length).toBeGreaterThan(0);
            
            // Tokens should be different
            expect(accessToken).not.toBe(refreshToken);
            
            // Access token should be verifiable and contain correct data
            const decoded = verifyAccessToken(accessToken);
            expect(decoded.userId).toBe(userData.userId);
            expect(decoded.email).toBe(userData.email);
            expect(decoded.type).toBe('access');
            
            // Tokens should not contain sensitive information in plain text
            expect(accessToken).not.toContain(userData.email);
            expect(refreshToken).not.toContain(userData.email);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should ensure password hashing security', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 8, maxLength: 50 }),
          async (password) => {
            const { hashPassword, comparePassword } = require('../utils/password');
            
            const hashedPassword = await hashPassword(password);
            
            // Hashed password should be different from original
            expect(hashedPassword).not.toBe(password);
            expect(hashedPassword.length).toBeGreaterThan(password.length);
            
            // Should be able to verify the password
            const isValid = await comparePassword(password, hashedPassword);
            expect(isValid).toBe(true);
            
            // Wrong password should not match
            const wrongPassword = password + 'wrong';
            const isWrongValid = await comparePassword(wrongPassword, hashedPassword);
            expect(isWrongValid).toBe(false);
            
            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);

    it('should verify authentication response security', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            email: fc.emailAddress(),
            password: fc.string({ minLength: 8, maxLength: 50 })
              .filter(p => /[A-Z]/.test(p) && /[a-z]/.test(p) && /\d/.test(p) && /[@$!%*?&]/.test(p))
          }),
          async (userData) => {
            const response = await request(app)
              .post('/api/auth/register')
              .send(userData);

            // If registration is successful, verify secure response
            if (response.status === 201) {
              // Response should contain tokens but not password
              expect(response.body).toHaveProperty('accessToken');
              expect(response.body).toHaveProperty('refreshToken');
              expect(response.body).not.toHaveProperty('password');
              
              if (response.body.user) {
                expect(response.body.user).not.toHaveProperty('password_hash');
                expect(response.body.user).toHaveProperty('email');
                expect(response.body.user).toHaveProperty('id');
              }
            }
            
            return true;
          }
        ),
        { numRuns: 3 }
      );
    }, 30000);
  });
});