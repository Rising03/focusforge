import * as fc from 'fast-check';
import request from 'supertest';
import app from '../index';
import { DataExportService } from '../services/dataExportService';

describe('Export and Mobile Features Property-Based Tests', () => {
  let dataExportService: DataExportService;

  beforeAll(() => {
    dataExportService = new DataExportService();
  });

  describe('Property 27: Data Export Functionality', () => {
    /**
     * Feature: student-discipline-system, Property 27: Data Export Functionality
     * For any user data export request, the system should successfully generate and provide a complete export of the user's personal data in a portable format.
     * Validates: Requirements 11.5
     */
    it('should export complete user data in portable format for any valid request', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            exportFormat: fc.oneof(fc.constant('json'), fc.constant('csv')),
            dataTypes: fc.array(
              fc.oneof(
                fc.constant('profile'),
                fc.constant('routines'),
                fc.constant('activities'),
                fc.constant('habits'),
                fc.constant('reviews'),
                fc.constant('analytics')
              ),
              { minLength: 1, maxLength: 6 }
            ),
            dateRange: fc.option(
              fc.record({
                startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
                endDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') })
              }),
              { nil: undefined }
            ),
            includePersonalData: fc.boolean(),
            includeAnalytics: fc.boolean()
          }),
          async (testData) => {
            const exportRequest = {
              format: testData.exportFormat,
              data_types: testData.dataTypes,
              date_range: testData.dateRange ? {
                start_date: testData.dateRange.startDate.toISOString().split('T')[0],
                end_date: testData.dateRange.endDate.toISOString().split('T')[0]
              } : undefined,
              include_personal_data: testData.includePersonalData,
              include_analytics: testData.includeAnalytics
            };

            const response = await request(app)
              .post('/api/data-export/request')
              .set('Authorization', 'Bearer test-token')
              .send(exportRequest);

            if (response.status === 200 || response.status === 201) {
              const exportResult = response.body.data;

              // Should provide export metadata
              expect(exportResult.export_id).toBeDefined();
              expect(exportResult.format).toBe(testData.exportFormat);
              expect(exportResult.created_at).toBeDefined();
              expect(exportResult.file_size).toBeGreaterThan(0);
              expect(exportResult.download_url).toBeDefined();
              expect(exportResult.expires_at).toBeDefined();

              // Should include all requested data types
              expect(exportResult.included_data_types).toBeDefined();
              expect(Array.isArray(exportResult.included_data_types)).toBe(true);
              testData.dataTypes.forEach(dataType => {
                expect(exportResult.included_data_types).toContain(dataType);
              });

              // Should respect date range if provided
              if (testData.dateRange) {
                expect(exportResult.date_range).toBeDefined();
                expect(exportResult.date_range.start_date).toBe(
                  testData.dateRange.startDate.toISOString().split('T')[0]
                );
                expect(exportResult.date_range.end_date).toBe(
                  testData.dateRange.endDate.toISOString().split('T')[0]
                );
              }

              // Should indicate data privacy compliance
              expect(exportResult.privacy_compliant).toBe(true);
              expect(exportResult.data_portability_standard).toMatch(/^(GDPR|CCPA|standard)$/);

              // Test actual export download
              const downloadResponse = await request(app)
                .get(exportResult.download_url.replace(/^.*\/api/, '/api'))
                .set('Authorization', 'Bearer test-token');

              if (downloadResponse.status === 200) {
                // Should have appropriate content type
                if (testData.exportFormat === 'json') {
                  expect(downloadResponse.headers['content-type']).toContain('application/json');
                  
                  // Should be valid JSON
                  const exportData = downloadResponse.body;
                  expect(typeof exportData).toBe('object');
                  
                  // Should contain metadata
                  expect(exportData.export_metadata).toBeDefined();
                  expect(exportData.export_metadata.export_date).toBeDefined();
                  expect(exportData.export_metadata.user_id).toBeDefined();
                  expect(exportData.export_metadata.format).toBe('json');

                  // Should contain requested data sections
                  testData.dataTypes.forEach(dataType => {
                    expect(exportData[dataType]).toBeDefined();
                  });

                  // Personal data handling
                  if (testData.includePersonalData) {
                    if (testData.dataTypes.includes('profile')) {
                      expect(exportData.profile.email).toBeDefined();
                      expect(exportData.profile.target_identity).toBeDefined();
                    }
                  } else {
                    // Should anonymize personal data
                    if (testData.dataTypes.includes('profile') && exportData.profile.email) {
                      expect(exportData.profile.email).toMatch(/^[a-f0-9]+@anonymized\.local$/);
                    }
                  }

                  // Analytics data handling
                  if (testData.includeAnalytics && testData.dataTypes.includes('analytics')) {
                    expect(exportData.analytics).toBeDefined();
                    expect(exportData.analytics.productivity_scores).toBeDefined();
                    expect(Array.isArray(exportData.analytics.productivity_scores)).toBe(true);
                  }

                } else if (testData.exportFormat === 'csv') {
                  expect(downloadResponse.headers['content-type']).toContain('text/csv');
                  
                  // Should be valid CSV format
                  const csvContent = downloadResponse.text;
                  expect(csvContent).toBeDefined();
                  expect(csvContent.length).toBeGreaterThan(0);
                  
                  // Should have CSV headers
                  const lines = csvContent.split('\n');
                  expect(lines.length).toBeGreaterThan(1);
                  expect(lines[0]).toContain(','); // Header row should have commas
                  
                  // Should contain data for requested types
                  testData.dataTypes.forEach(dataType => {
                    expect(csvContent.toLowerCase()).toContain(dataType.toLowerCase());
                  });
                }

                // File size should be reasonable
                expect(exportResult.file_size).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
                expect(exportResult.file_size).toBeGreaterThan(100); // More than 100 bytes
              }

              // Should have reasonable expiration time (24-72 hours)
              const expiresAt = new Date(exportResult.expires_at);
              const createdAt = new Date(exportResult.created_at);
              const expirationHours = (expiresAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
              expect(expirationHours).toBeGreaterThanOrEqual(24);
              expect(expirationHours).toBeLessThanOrEqual(72);
            }

            return true;
          }
        ),
        { numRuns: 12 }
      );
    }, 45000);
  });

  describe('Property 26: Database Performance Optimization', () => {
    /**
     * Feature: student-discipline-system, Property 26: Database Performance Optimization
     * For any time-series analytics query, the database structure should be optimized to provide reasonable response times for historical data analysis.
     * Validates: Requirements 11.4
     */
    it('should provide reasonable response times for time-series analytics queries', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            queryType: fc.oneof(
              fc.constant('daily_analytics'),
              fc.constant('weekly_trends'),
              fc.constant('monthly_patterns'),
              fc.constant('habit_streaks'),
              fc.constant('productivity_analysis')
            ),
            timeRange: fc.record({
              startDate: fc.date({ min: new Date('2024-01-01'), max: new Date('2024-06-01') }),
              endDate: fc.date({ min: new Date('2024-06-01'), max: new Date('2024-12-31') }),
              granularity: fc.oneof(fc.constant('day'), fc.constant('week'), fc.constant('month'))
            }),
            aggregationLevel: fc.oneof(fc.constant('summary'), fc.constant('detailed'), fc.constant('raw')),
            filterCriteria: fc.option(
              fc.record({
                activityTypes: fc.option(fc.array(fc.string({ minLength: 3, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
                priorityLevels: fc.option(fc.array(fc.oneof(fc.constant('high'), fc.constant('medium'), fc.constant('low')), { maxLength: 3 }), { nil: undefined }),
                completionStatus: fc.option(fc.oneof(fc.constant('completed'), fc.constant('incomplete'), fc.constant('all')), { nil: undefined })
              }),
              { nil: undefined }
            )
          }),
          async (testData) => {
            const queryParams = new URLSearchParams({
              type: testData.queryType,
              start_date: testData.timeRange.startDate.toISOString().split('T')[0],
              end_date: testData.timeRange.endDate.toISOString().split('T')[0],
              granularity: testData.timeRange.granularity,
              aggregation: testData.aggregationLevel
            });

            // Add filter criteria if provided
            if (testData.filterCriteria) {
              if (testData.filterCriteria.activityTypes) {
                queryParams.append('activity_types', testData.filterCriteria.activityTypes.join(','));
              }
              if (testData.filterCriteria.priorityLevels) {
                queryParams.append('priority_levels', testData.filterCriteria.priorityLevels.join(','));
              }
              if (testData.filterCriteria.completionStatus) {
                queryParams.append('completion_status', testData.filterCriteria.completionStatus);
              }
            }

            const startTime = Date.now();
            
            const response = await request(app)
              .get(`/api/analytics/time-series?${queryParams.toString()}`)
              .set('Authorization', 'Bearer test-token');

            const responseTime = Date.now() - startTime;

            if (response.status === 200) {
              const analyticsData = response.body.data;

              // Performance requirements based on query complexity
              const timeRangeDays = Math.ceil(
                (testData.timeRange.endDate.getTime() - testData.timeRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
              );

              let maxResponseTime: number;
              
              // Set performance expectations based on query complexity
              if (timeRangeDays <= 30 && testData.aggregationLevel === 'summary') {
                maxResponseTime = 500; // 500ms for simple queries
              } else if (timeRangeDays <= 90 && testData.aggregationLevel !== 'raw') {
                maxResponseTime = 1500; // 1.5s for medium complexity
              } else if (timeRangeDays <= 365) {
                maxResponseTime = 3000; // 3s for complex queries
              } else {
                maxResponseTime = 5000; // 5s for very large datasets
              }

              // Response time should be reasonable
              expect(responseTime).toBeLessThan(maxResponseTime);

              // Should return structured time-series data
              expect(analyticsData.time_series).toBeDefined();
              expect(Array.isArray(analyticsData.time_series)).toBe(true);
              expect(analyticsData.query_metadata).toBeDefined();
              expect(analyticsData.query_metadata.total_records).toBeGreaterThanOrEqual(0);
              expect(analyticsData.query_metadata.query_time_ms).toBeDefined();
              expect(analyticsData.query_metadata.query_time_ms).toBeLessThan(maxResponseTime);

              // Data should be properly aggregated by granularity
              if (analyticsData.time_series.length > 0) {
                analyticsData.time_series.forEach((dataPoint: any, index: number) => {
                  expect(dataPoint.date).toBeDefined();
                  expect(dataPoint.value).toBeDefined();
                  expect(typeof dataPoint.value).toBe('number');

                  // Dates should be in chronological order
                  if (index > 0) {
                    const currentDate = new Date(dataPoint.date);
                    const previousDate = new Date(analyticsData.time_series[index - 1].date);
                    expect(currentDate.getTime()).toBeGreaterThanOrEqual(previousDate.getTime());
                  }

                  // Should include aggregation metadata for detailed queries
                  if (testData.aggregationLevel === 'detailed') {
                    expect(dataPoint.metadata).toBeDefined();
                    expect(dataPoint.metadata.record_count).toBeGreaterThanOrEqual(0);
                  }
                });

                // Should respect date range
                const firstDate = new Date(analyticsData.time_series[0].date);
                const lastDate = new Date(analyticsData.time_series[analyticsData.time_series.length - 1].date);
                expect(firstDate.getTime()).toBeGreaterThanOrEqual(testData.timeRange.startDate.getTime());
                expect(lastDate.getTime()).toBeLessThanOrEqual(testData.timeRange.endDate.getTime());
              }

              // Should include performance metrics
              expect(analyticsData.performance_metrics).toBeDefined();
              expect(analyticsData.performance_metrics.index_usage).toBeDefined();
              expect(analyticsData.performance_metrics.cache_hit_rate).toBeGreaterThanOrEqual(0);
              expect(analyticsData.performance_metrics.cache_hit_rate).toBeLessThanOrEqual(1);

              // Should indicate if query was optimized
              expect(analyticsData.performance_metrics.optimized_query).toBe(true);

              // For large datasets, should use pagination or limiting
              if (timeRangeDays > 365 && testData.aggregationLevel === 'raw') {
                expect(analyticsData.pagination).toBeDefined();
                expect(analyticsData.pagination.page_size).toBeLessThanOrEqual(1000);
              }
            }

            return true;
          }
        ),
        { numRuns: 10 }
      );
    }, 30000);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});