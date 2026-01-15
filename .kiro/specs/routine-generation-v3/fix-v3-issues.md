# Fix Routine V3 Issues

## Current Status

The V3 routine service code exists in `backend/src/services/routineService.v3-broken.ts` but has been swapped out for the stable V2 version due to compilation errors. The backend is currently running with V2 code.

## Issues to Fix

### 1. Type Mismatches in routineDataOrchestrator.ts

**Location**: `backend/src/services/routineDataOrchestrator.ts`

**Problems**:
- References non-existent `classSchedule` field in ProfileData interface (line 169)
- References non-existent `commuteTime` field in ProfileData interface (line 170)
- Uses incorrect method name `getPersonalizationMetrics` instead of `calculatePersonalizationMetrics` (line 234)
- References non-existent `skipped_activities` field in EveningReviewData interface

**Fix**:
- Remove `classSchedule` and `commuteTime` from ProfileData interface and usage
- Use correct method name `calculatePersonalizationMetrics`
- Remove `skipped_activities` reference

### 2. Circular Dependency

**Location**: Multiple files

**Problem**: 
- RoutineService → RoutineDataOrchestrator → EveningReviewService → RoutineService (circular)

**Current Workaround**:
- EveningReviewService has RoutineService commented out
- This breaks routine adaptation features

**Fix Options**:
1. **Dependency Injection**: Pass RoutineService as parameter when needed
2. **Event-Based**: Use events/callbacks instead of direct service calls
3. **Lazy Loading**: Import RoutineService only when needed inside methods
4. **Service Locator**: Use a service registry pattern

**Recommended**: Lazy loading for minimal code changes

### 3. V3 Routes Disabled

**Location**: `backend/src/routes/routineRoutes.ts` (lines 33-41)

**Problem**: V3 endpoints are commented out

**Fix**: Re-enable after fixing compilation issues

## Implementation Plan

### Phase 1: Fix Type Issues (5 min)
1. Update ProfileData interface in routineDataOrchestrator.ts
2. Remove invalid field references
3. Fix method name typo

### Phase 2: Fix Circular Dependency (10 min)
1. Implement lazy loading in EveningReviewService
2. Test that routine adaptation works

### Phase 3: Swap V3 Back (2 min)
1. Move routineService.ts to routineService.v2-stable.ts
2. Move routineService.v3-broken.ts to routineService.ts

### Phase 4: Re-enable V3 Routes (2 min)
1. Uncomment V3 routes in routineRoutes.ts

### Phase 5: Test (10 min)
1. Start backend server
2. Run test script: `node backend/test-routine-v3-debug.js`
3. Verify all V3 features work

## Success Criteria

- [ ] Backend compiles without errors
- [ ] Backend starts successfully
- [ ] V2 backward compatibility maintained
- [ ] V3 automatic mode works
- [ ] V3 manual mode works
- [ ] No circular dependency errors
- [ ] Test script passes all critical tests
