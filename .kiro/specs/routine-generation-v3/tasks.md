# Implementation Tasks: Routine Generation V3 Upgrade

## Overview

This document outlines the implementation tasks for upgrading the existing routine generation system to V3. The upgrade adds AI-powered generation modes (Automatic and Manual), full system integration (habits, deep work, evening review, analytics, profile), and energy-based scheduling powered by Google Gemini AI.

**CRITICAL**: This is an **upgrade** to existing files, not a new separate system. We will modify:
- `backend/src/services/routineService.ts` (existing)
- `backend/src/controllers/routineController.ts` (existing)
- `frontend/src/components/WakeUpRoutineGenerator.tsx` (existing)
- Database schema (add new fields to existing tables)

## Task Breakdown

### Phase 1: Backend Infrastructure (Days 1-3)

#### Task 1.1: Create AI Routine Service
**File**: `backend/src/services/aiRoutineService.ts` (NEW)
**Dependencies**: None
**Estimated Time**: 4 hours

**Description**: Create new service for Gemini AI integration specific to routine generation.

**Implementation Steps**:
1. Create `aiRoutineService.ts` with class `AIRoutineService`
2. Implement `parseRoutineRequest(input: string, context: UserContext)` for natural language parsing
3. Implement `generateAIRoutine(context: RoutineContext)` for automatic mode generation
4. Implement `suggestActivities(timeSlot: TimeSlot, context: RoutineContext)` for manual mode suggestions
5. Implement `recommendBreak(previousActivity, timeOfDay, userState)` for smart breaks
6. Implement `explainSchedulingDecision(activity, timeSlot, context)` for AI reasoning
7. Add error handling with fallback to rule-based generation
8. Add 10-second timeout for AI requests
9. Leverage existing `aiParserService.ts` infrastructure for Gemini connection

**Acceptance Criteria**:
- AI service can parse natural language routine requests
- AI service generates complete routines with reasoning
- AI service provides activity suggestions for time slots
- Fallback to rule-based generation when AI unavailable
- All methods have proper error handling and logging

**Testing**:
- Unit tests for each method with mock AI responses
- Property test: AI responses always return valid JSON structure
- Integration test: Full routine generation with real AI (manual test only)

---

#### Task 1.2: Create Data Integration Orchestrator
**File**: `backend/src/services/routineDataOrchestrator.ts` (NEW)
**Dependencies**: None
**Estimated Time**: 3 hours

**Description**: Create service to fetch and aggregate data from all integrated services.

**Implementation Steps**:
1. Create `routineDataOrchestrator.ts` with class `RoutineDataOrchestrator`
2. Implement `buildRoutineContext(userId, date)` to fetch all data in parallel
3. Implement `fetchHabitData(userId)` using existing `HabitService`
4. Implement `fetchDeepWorkData(userId)` using existing `DeepWorkService`
5. Implement `fetchEveningReviewData(userId)` using existing `EveningReviewService`
6. Implement `fetchAnalyticsData(userId)` using existing `AnalyticsService`
7. Implement `fetchProfileData(userId)` using existing `ProfileService`
8. Add 5-second timeout per service with graceful degradation
9. Implement smart defaults for missing data
10. Add caching layer (5-minute TTL) for context data

**Acceptance Criteria**:
- Fetches data from all 5 services in parallel
- Handles service failures gracefully with defaults
- Returns complete `RoutineContext` object
- Caching reduces redundant service calls
- All methods have proper error handling

**Testing**:
- Unit tests with mocked services
- Property test: Context always contains all required fields
- Integration test: Parallel fetching completes within 5 seconds

---

#### Task 1.3: Create Energy-Based Scheduler
**File**: `backend/src/services/energyScheduler.ts` (NEW)
**Dependencies**: Task 1.2
**Estimated Time**: 4 hours

**Description**: Create service for energy-aware activity scheduling.

**Implementation Steps**:
1. Create `energyScheduler.ts` with class `EnergyScheduler`
2. Implement `classifyTimeSlotEnergy(timeSlot, energyPatterns)` to classify slots as high/medium/low energy
3. Implement `matchActivitiesToEnergy(activities, timeSlots, energyPatterns)` for optimal matching
4. Implement `optimizeActivityOrder(activities, energyPatterns)` for priority-based ordering
5. Implement `getOptimalTimeForActivity(activityType, energyPatterns)` for activity placement
6. Add fallback to time-of-day heuristics when energy data unavailable
7. Implement energy level classification algorithm (based on analytics data)

**Acceptance Criteria**:
- Time slots correctly classified by energy level
- High-priority activities matched to high-energy slots
- Fallback heuristics work when no energy data available
- Activity ordering respects both priority and energy

**Testing**:
- Unit tests for classification and matching algorithms
- Property test: High-priority activities always in high-energy slots (Property 8, 9)
- Property test: All activities assigned to exactly one slot

---

#### Task 1.4: Create Manual Slot Builder
**File**: `backend/src/services/manualSlotBuilder.ts` (NEW)
**Dependencies**: Task 1.1, Task 1.3
**Estimated Time**: 3 hours

**Description**: Create service for manual mode slot validation and filling.

**Implementation Steps**:
1. Create `manualSlotBuilder.ts` with class `ManualSlotBuilder`
2. Implement `validateManualSlots(slots)` to check for overlaps and valid times
3. Implement `fillSlotsWithActivities(slots, context)` to populate slots with activities
4. Implement `getSuggestionsForSlot(slot, context)` using AI service
5. Implement `applyEnergyBasedScheduling(slots, activities, energyPatterns)` for energy matching
6. Add validation for slot duration (min 30 min, max 120 min for focused work)

**Acceptance Criteria**:
- Manual slots validated for overlaps and time constraints
- Slots filled with appropriate activities based on energy
- AI suggestions provided for each slot
- Validation errors return specific, actionable messages

**Testing**:
- Unit tests for validation logic
- Property test: No two manual slots overlap (Property 10)
- Property test: All slots within specified time range (Property 11)

---

#### Task 1.5: Upgrade Routine Service with Generation Modes
**File**: `backend/src/services/routineService.ts` (MODIFY EXISTING)
**Dependencies**: Tasks 1.1, 1.2, 1.3, 1.4
**Estimated Time**: 6 hours

**Description**: Upgrade existing `RoutineService` to support automatic and manual generation modes.

**Implementation Steps**:
1. Add imports for new services (AI, Orchestrator, Energy, Manual)
2. Modify `generateDailyRoutine()` to route based on `request.mode`
3. Implement `generateAutomaticRoutine(userId, context)` method:
   - Fetch context using orchestrator
   - Call AI service for generation
   - Apply energy-based scheduling
   - Insert intelligent breaks
   - Save routine with AI reasoning
4. Implement `generateManualRoutine(userId, slots, context)` method:
   - Validate manual slots
   - Fetch context using orchestrator
   - Fill slots using manual slot builder
   - Apply energy-based scheduling
   - Save routine
5. Implement `adaptRoutineMidDay(userId, routineId, remainingTime)` method:
   - Fetch existing routine
   - Preserve completed segments
   - Regenerate remaining time
   - Maintain consistency
6. Implement `compareRoutineVariations(userId, variations)` method:
   - Compare activity distribution
   - Analyze energy alignment
   - Predict performance
7. Keep existing methods for backward compatibility
8. Add generation mode field to routine response

**Acceptance Criteria**:
- Automatic mode generates complete routine using AI
- Manual mode fills user-created slots with activities
- Mid-day adaptation preserves completed segments (Property 18)
- Routine comparison provides meaningful insights
- Existing functionality remains intact
- All new methods have proper error handling

**Testing**:
- Unit tests for each generation mode
- Property test: Time boundaries respected (Property 1)
- Property test: Class times protected (Property 2)
- Property test: Break insertion between activities (Property 5)
- Property test: Energy alignment for deep work (Property 8)
- Integration test: End-to-end automatic generation
- Integration test: End-to-end manual generation

---

#### Task 1.6: Upgrade Routine Controller
**File**: `backend/src/controllers/routineController.ts` (MODIFY EXISTING)
**Dependencies**: Task 1.5
**Estimated Time**: 2 hours

**Description**: Upgrade controller to handle new generation modes and features.

**Implementation Steps**:
1. Modify `generateDailyRoutine()` to accept new request fields:
   - `mode`: 'automatic' | 'manual' | 'hybrid'
   - `timeRange`: { start, end, preset }
   - `priorityFocus`: 'critical' | 'high' | 'medium' | 'low'
   - `manualSlots`: ManualTimeSlot[]
   - `naturalLanguageRequest`: string
2. Add validation for new fields
3. Add endpoint `POST /routines/natural-language` for NL requests
4. Add endpoint `POST /routines/:routineId/adapt` for mid-day adaptation
5. Add endpoint `POST /routines/compare` for routine comparison
6. Keep existing endpoints for backward compatibility

**Acceptance Criteria**:
- Controller accepts and validates new request fields
- Natural language endpoint parses and generates routine
- Mid-day adaptation endpoint works correctly
- Comparison endpoint returns meaningful data
- Existing endpoints remain functional

**Testing**:
- Unit tests for request validation
- Integration test: Full request/response cycle for each mode
- Integration test: Natural language request handling

---

#### Task 1.7: Update Database Schema
**File**: `database/routine_generation_v3_migration.sql` (NEW)
**Dependencies**: None
**Estimated Time**: 2 hours

**Description**: Add new fields to existing tables and create new tables for V3 features.

**Implementation Steps**:
1. Create migration file `routine_generation_v3_migration.sql`
2. Add new fields to `daily_routines` table:
   ```sql
   ALTER TABLE daily_routines ADD COLUMN generation_mode VARCHAR(50);
   ALTER TABLE daily_routines ADD COLUMN time_range JSONB;
   ALTER TABLE daily_routines ADD COLUMN ai_reasoning JSONB;
   ALTER TABLE daily_routines ADD COLUMN confidence_score DECIMAL(3,2);
   ALTER TABLE daily_routines ADD COLUMN data_sources_used JSONB;
   ALTER TABLE daily_routines ADD COLUMN priority_focus VARCHAR(50);
   ```
3. Create `routine_templates` table for saved templates
4. Create `routine_performance_metrics` table for tracking
5. Create `ai_generation_logs` table for monitoring
6. Add indexes for performance
7. Add migration rollback script

**Acceptance Criteria**:
- Migration runs successfully without errors
- New fields added to existing table
- New tables created with proper constraints
- Indexes improve query performance
- Rollback script works correctly

**Testing**:
- Test migration on clean database
- Test migration on database with existing data
- Test rollback script
- Verify indexes improve query performance

---

### Phase 2: Frontend Implementation (Days 4-5)

#### Task 2.1: Upgrade WakeUpRoutineGenerator Component
**File**: `frontend/src/components/WakeUpRoutineGenerator.tsx` (MODIFY EXISTING)
**Dependencies**: Task 1.6
**Estimated Time**: 5 hours

**Description**: Upgrade existing component to support mode selection and new features.

**Implementation Steps**:
1. Add state for generation mode selection
2. Add UI for mode selection (Automatic vs Manual)
3. For Automatic mode:
   - Add time range selection with presets
   - Add priority focus selector
   - Add natural language input field (optional)
   - Keep existing class schedule inputs
4. For Manual mode:
   - Add time slot creation interface
   - Add drag-and-drop for slot reordering
   - Show AI suggestions for each slot
   - Add energy level indicators
5. Update routine display to show:
   - Generation mode used
   - AI reasoning (if available)
   - Confidence score
   - Energy alignment indicators
6. Add "Regenerate" button with mode persistence
7. Keep existing functionality for backward compatibility
8. Add loading states for AI generation
9. Add error handling with fallback UI

**Acceptance Criteria**:
- Mode selection UI is clear and intuitive
- Automatic mode generates routine with minimal input
- Manual mode allows slot creation and editing
- AI suggestions displayed for manual slots
- Routine display shows all new information
- Existing functionality remains intact
- Loading and error states handled gracefully

**Testing**:
- Manual testing of all UI interactions
- Test automatic mode generation
- Test manual mode slot creation
- Test mode switching
- Test error scenarios

---

#### Task 2.2: Create Routine Service Frontend Methods
**File**: `frontend/src/services/routineService.ts` (MODIFY EXISTING)
**Dependencies**: Task 1.6
**Estimated Time**: 2 hours

**Description**: Add frontend service methods for new API endpoints.

**Implementation Steps**:
1. Add `generateRoutineAutomatic(request)` method
2. Add `generateRoutineManual(request)` method
3. Add `generateRoutineNaturalLanguage(input)` method
4. Add `adaptRoutineMidDay(routineId, remainingTime)` method
5. Add `compareRoutineVariations(variations)` method
6. Update existing methods to handle new response fields
7. Add proper TypeScript types for all new methods

**Acceptance Criteria**:
- All new API endpoints accessible from frontend
- Methods return properly typed responses
- Error handling for all methods
- Backward compatibility maintained

**Testing**:
- Unit tests for each method with mocked fetch
- Integration test with real backend (manual)

---

### Phase 3: Testing & Validation (Days 6-7)

#### Task 3.1: Property-Based Tests
**File**: `backend/src/__tests__/routine-generation-v3.properties.test.ts` (NEW)
**Dependencies**: All Phase 1 tasks
**Estimated Time**: 6 hours

**Description**: Implement property-based tests for all 19 correctness properties.

**Implementation Steps**:
1. Create test file with fast-check library
2. Implement property tests for:
   - Property 1: Time Slot Boundaries
   - Property 2: Class Time Protection
   - Property 3: Available Time Calculation
   - Property 4: Segment Duration Constraints
   - Property 5: Automatic Break Insertion
   - Property 6: Data Integration Completeness
   - Property 7: Habit Integration
   - Property 8: Deep Work Energy Alignment
   - Property 9: Energy-Based Activity Assignment
   - Property 10: Manual Slot Non-Overlap
   - Property 11: Time Range Containment
   - Property 12: Priority-Based Scheduling Order
   - Property 13: Habit Stack Grouping
   - Property 14: Deep Work Duration
   - Property 15: Evening Review Adaptation
   - Property 16: Completion Rate Adaptation
   - Property 17: Energy Level Classification
   - Property 18: Mid-Day Preservation
   - Property 19: Remaining Time Fit
3. Run each test with minimum 100 iterations
4. Add generators for test data (routines, profiles, energy patterns)

**Acceptance Criteria**:
- All 19 properties have passing tests
- Tests run with 100+ iterations each
- Test coverage > 80% for new code
- All edge cases covered

**Testing**:
- Run full property test suite
- Verify all properties pass consistently
- Check test execution time (< 5 minutes total)

---

#### Task 3.2: Integration Tests
**File**: `backend/src/__tests__/integration/routine-generation-v3.integration.test.ts` (NEW)
**Dependencies**: All Phase 1 and 2 tasks
**Estimated Time**: 4 hours

**Description**: Implement end-to-end integration tests for complete workflows.

**Implementation Steps**:
1. Create integration test file
2. Implement test: Automatic mode full workflow
3. Implement test: Manual mode full workflow
4. Implement test: Natural language request workflow
5. Implement test: Mid-day adaptation workflow
6. Implement test: Routine comparison workflow
7. Implement test: AI fallback scenario
8. Implement test: Service failure handling
9. Mock external services (AI, database)
10. Use test database for data persistence tests

**Acceptance Criteria**:
- All workflows complete successfully
- Tests cover happy path and error scenarios
- AI fallback tested and working
- Service failures handled gracefully
- Tests run in < 30 seconds

**Testing**:
- Run full integration test suite
- Verify all tests pass
- Check test coverage

---

#### Task 3.3: Performance Testing
**File**: `backend/src/__tests__/performance/routine-generation-v3.performance.test.ts` (NEW)
**Dependencies**: All Phase 1 tasks
**Estimated Time**: 2 hours

**Description**: Verify performance requirements are met.

**Implementation Steps**:
1. Create performance test file
2. Test automatic generation completes in < 5 seconds
3. Test manual generation completes in < 2 seconds
4. Test data fetching completes in < 3 seconds
5. Test AI requests timeout at 10 seconds
6. Test concurrent generation (1000+ users)
7. Measure and log performance metrics

**Acceptance Criteria**:
- Automatic generation < 5 seconds
- Manual generation < 2 seconds
- Data fetching < 3 seconds
- AI timeout at 10 seconds
- System handles 1000+ concurrent requests

**Testing**:
- Run performance tests multiple times
- Verify consistent performance
- Identify and fix bottlenecks

---

### Phase 4: Documentation & Deployment (Day 8)

#### Task 4.1: API Documentation
**File**: `backend/API_DOCUMENTATION_V3.md` (NEW)
**Dependencies**: All Phase 1 tasks
**Estimated Time**: 2 hours

**Description**: Document all new API endpoints and request/response formats.

**Implementation Steps**:
1. Create API documentation file
2. Document all new endpoints with examples
3. Document request/response schemas
4. Document error codes and messages
5. Add usage examples for each mode
6. Document natural language request format
7. Add migration guide from V2 to V3

**Acceptance Criteria**:
- All endpoints documented with examples
- Request/response schemas clearly defined
- Error handling documented
- Migration guide complete

---

#### Task 4.2: User Guide
**File**: `ROUTINE_GENERATION_V3_USER_GUIDE.md` (NEW)
**Dependencies**: All Phase 2 tasks
**Estimated Time**: 2 hours

**Description**: Create user-facing guide for new features.

**Implementation Steps**:
1. Create user guide file
2. Explain automatic vs manual modes
3. Provide examples of natural language requests
4. Explain energy-based scheduling
5. Document time range presets
6. Explain priority-based scheduling
7. Add screenshots of UI
8. Add FAQ section

**Acceptance Criteria**:
- Guide covers all new features
- Examples are clear and helpful
- Screenshots show actual UI
- FAQ addresses common questions

---

#### Task 4.3: Deployment Preparation
**File**: `DEPLOYMENT_CHECKLIST_V3.md` (NEW)
**Dependencies**: All tasks
**Estimated Time**: 2 hours

**Description**: Prepare deployment checklist and rollout plan.

**Implementation Steps**:
1. Create deployment checklist
2. Document database migration steps
3. Document environment variable requirements
4. Create feature flag configuration
5. Document rollback procedure
6. Create monitoring dashboard configuration
7. Document A/B testing setup
8. Create phased rollout plan (10% → 50% → 100%)

**Acceptance Criteria**:
- Checklist covers all deployment steps
- Migration procedure documented
- Rollback procedure tested
- Monitoring configured
- Rollout plan approved

---

## Task Dependencies Graph

```
Phase 1 (Backend):
1.1 (AI Service) ─────────┐
1.2 (Orchestrator) ───────┼─────┐
1.3 (Energy Scheduler) ───┤     │
1.4 (Manual Builder) ─────┘     │
                                ▼
                        1.5 (Upgrade Service)
                                │
                                ▼
                        1.6 (Upgrade Controller)
1.7 (Database) ──────────────────┘

Phase 2 (Frontend):
1.6 ──────────────────────┐
                          ▼
                  2.1 (Upgrade Component)
                          │
                          ▼
                  2.2 (Service Methods)

Phase 3 (Testing):
All Phase 1 & 2 ──────────┐
                          ├──▶ 3.1 (Property Tests)
                          ├──▶ 3.2 (Integration Tests)
                          └──▶ 3.3 (Performance Tests)

Phase 4 (Documentation):
All Phases ───────────────┐
                          ├──▶ 4.1 (API Docs)
                          ├──▶ 4.2 (User Guide)
                          └──▶ 4.3 (Deployment)
```

## Estimated Timeline

- **Phase 1 (Backend)**: 3 days (24 hours)
- **Phase 2 (Frontend)**: 2 days (14 hours)
- **Phase 3 (Testing)**: 2 days (12 hours)
- **Phase 4 (Documentation)**: 1 day (6 hours)

**Total**: 8 days (56 hours)

## Risk Mitigation

### Risk 1: AI Service Unavailability
**Mitigation**: Implement robust fallback to rule-based generation (Task 1.1)

### Risk 2: Performance Degradation
**Mitigation**: Implement caching and parallel data fetching (Task 1.2)

### Risk 3: Breaking Existing Functionality
**Mitigation**: Maintain backward compatibility, comprehensive testing (All tasks)

### Risk 4: Complex User Interface
**Mitigation**: Progressive disclosure, clear mode selection (Task 2.1)

### Risk 5: Data Integration Failures
**Mitigation**: Graceful degradation with smart defaults (Task 1.2)

## Success Criteria

1. ✅ All 30 requirements implemented and tested
2. ✅ All 19 correctness properties verified
3. ✅ Performance requirements met (< 5s automatic, < 2s manual)
4. ✅ Existing functionality remains intact
5. ✅ AI fallback works when service unavailable
6. ✅ User interface is intuitive and responsive
7. ✅ Documentation complete and accurate
8. ✅ Deployment checklist ready

## Next Steps

1. Review and approve this task breakdown
2. Begin Phase 1 implementation
3. Daily standup to track progress
4. Weekly demo of completed features
5. Final review before deployment

---

**Document Version**: 1.0  
**Last Updated**: January 15, 2026  
**Status**: Ready for Implementation
