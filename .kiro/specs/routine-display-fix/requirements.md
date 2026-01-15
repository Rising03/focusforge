# Requirements Document: Routine Display Fix

## Introduction

This specification addresses a critical bug where the RoutineViewer component fails to display generated routines. The issue was identified through user testing and comprehensive debugging, revealing a response format mismatch between the backend API and frontend service.

## Problem Statement

**User Report**: "My routine section is not showing the actual generated routine"

**Root Cause**: The backend controller returns routine data wrapped in `{ success: true, data: routine }` format, but the frontend service expects the routine object directly or doesn't properly unwrap the response.

**Impact**: Users can generate routines successfully, but cannot view them in the RoutineViewer component, making the feature unusable.

## Glossary

- **RoutineViewer**: Frontend React component that displays daily routines
- **RoutineController**: Backend controller handling routine API endpoints
- **RoutineService (Frontend)**: Frontend service layer for routine API calls
- **RoutineService (Backend)**: Backend service layer for routine business logic
- **Response Format**: The structure of data returned by API endpoints

## Requirements

### Requirement 1: Consistent API Response Format

**User Story:** As a developer, I want consistent API response formats across all routine endpoints, so that the frontend can reliably parse and display data.

#### Acceptance Criteria

1. WHEN the backend returns routine data, THE response format SHALL be consistent across all routine endpoints
2. THE System SHALL document the expected response format in API documentation
3. WHEN a routine is fetched by date, THE response SHALL include all necessary fields for display
4. THE response format SHALL match the TypeScript interface definitions in the frontend
5. WHEN an error occurs, THE response SHALL follow a consistent error format

### Requirement 2: Frontend Service Response Handling

**User Story:** As a frontend developer, I want the routine service to properly handle API responses, so that components receive data in the expected format.

#### Acceptance Criteria

1. WHEN the frontend service receives a response, IT SHALL properly unwrap nested data structures
2. THE service SHALL handle both wrapped (`{ success: true, data: routine }`) and direct response formats
3. WHEN response parsing fails, THE service SHALL throw a descriptive error
4. THE service SHALL validate that required fields are present before returning data
5. WHEN the API returns 404, THE service SHALL return null instead of throwing an error

### Requirement 3: RoutineViewer Component Data Display

**User Story:** As a user, I want to see my generated routine in the RoutineViewer, so that I can follow my daily schedule.

#### Acceptance Criteria

1. WHEN a routine exists for the selected date, THE RoutineViewer SHALL display all routine segments
2. WHEN no routine exists, THE RoutineViewer SHALL show a helpful message with a link to generate one
3. THE RoutineViewer SHALL display loading states while fetching data
4. WHEN an error occurs, THE RoutineViewer SHALL display a user-friendly error message
5. THE RoutineViewer SHALL refresh automatically after a routine is generated

### Requirement 4: Backend Controller Response Consistency

**User Story:** As a backend developer, I want the routine controller to return data in a consistent format, so that the frontend can reliably consume it.

#### Acceptance Criteria

1. THE `getRoutineByDate` endpoint SHALL return routine data in the same format as `generateDailyRoutine`
2. WHEN a routine is found, THE response SHALL include `{ success: true, data: routine }` OR just the routine object directly
3. THE controller SHALL document which format is used and maintain consistency
4. WHEN a routine is not found, THE response SHALL return 404 with `{ error: 'Routine not found' }`
5. THE controller SHALL include all necessary fields in the response (id, date, segments, etc.)

### Requirement 5: Database Persistence Verification

**User Story:** As a developer, I want to verify that routines are being saved to the database, so that they can be retrieved later.

#### Acceptance Criteria

1. WHEN a routine is generated, IT SHALL be saved to the `daily_routines` table
2. THE save operation SHALL complete before the response is sent to the client
3. WHEN a save operation fails, THE system SHALL return an error instead of a success response
4. THE system SHALL log successful saves and failures for debugging
5. THE system SHALL verify that the saved routine can be retrieved immediately after generation

### Requirement 6: Comprehensive Testing

**User Story:** As a QA engineer, I want comprehensive tests for the routine display flow, so that this issue doesn't recur.

#### Acceptance Criteria

1. THE system SHALL include an end-to-end test for the complete routine generation and display flow
2. THE test SHALL verify that generated routines can be fetched by date
3. THE test SHALL verify that the RoutineViewer component displays fetched routines correctly
4. THE test SHALL verify response format consistency across all routine endpoints
5. THE test SHALL include both automated tests and manual testing procedures

## Technical Specifications

### Current Backend Response Format (getRoutineByDate)

```typescript
// backend/src/controllers/routineController.ts - Line 147
res.status(200).json({
  success: true,
  data: routine
});
```

### Current Frontend Service Implementation

```typescript
// frontend/src/services/routineService.ts
async getRoutineByDate(date: string): Promise<DailyRoutine | null> {
  try {
    return await this.makeRequest<DailyRoutine>(`/routines/date/${date}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw error;
  }
}

// makeRequest method
private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // ...
  const data = await response.json();
  return data.data || data; // This line attempts to unwrap
}
```

### Issue Analysis

The `makeRequest` method tries to unwrap with `data.data || data`, which should work. However, there may be edge cases where:
1. The response structure is different than expected
2. The TypeScript type `T` doesn't match the actual response
3. The unwrapping logic fails silently

### Proposed Solutions

**Option 1: Standardize Backend to Return Unwrapped Data**
- Change `getRoutineByDate` to return `res.status(200).json(routine)` directly
- Update all routine endpoints to return unwrapped data
- Update frontend to expect unwrapped data

**Option 2: Improve Frontend Unwrapping Logic**
- Add explicit checks for `success` and `data` fields
- Add logging to track response structure
- Add validation to ensure required fields are present

**Option 3: Hybrid Approach (Recommended)**
- Keep backend format consistent with other endpoints
- Improve frontend unwrapping with better error handling
- Add comprehensive logging for debugging

## Non-Functional Requirements

### Reliability
- Fix SHALL resolve the issue for 100% of users
- Fix SHALL not break existing functionality
- Fix SHALL include proper error handling

### Performance
- Response format changes SHALL not impact API performance
- Frontend parsing SHALL complete in < 10ms

### Maintainability
- Code SHALL include comments explaining the response format
- API documentation SHALL be updated to reflect the format
- Tests SHALL verify the format remains consistent

### Debugging
- System SHALL log response structures for debugging
- System SHALL provide clear error messages when parsing fails
- Test tools SHALL help identify similar issues in the future

## Success Criteria

1. ✅ Users can view generated routines in the RoutineViewer component
2. ✅ The test-routine-display.html test passes all 5 steps
3. ✅ Response format is consistent across all routine endpoints
4. ✅ Frontend service properly handles all response formats
5. ✅ Comprehensive tests prevent regression
6. ✅ Documentation is updated with correct response formats

## Testing Strategy

### Manual Testing
1. Run `test-routine-display.html` in browser
2. Verify all 5 steps pass (Login → Profile → Generate → Fetch → Display)
3. Test in actual application (http://localhost:5173)
4. Verify RoutineViewer shows generated routine

### Automated Testing
1. Unit tests for response parsing logic
2. Integration tests for complete flow
3. Property tests for response format consistency

### Regression Testing
1. Verify existing routine functionality still works
2. Test all routine endpoints (generate, fetch, update, history)
3. Test error scenarios (404, 500, network errors)

## Rollout Plan

1. **Phase 1**: Fix the response format issue (backend or frontend)
2. **Phase 2**: Add comprehensive logging for debugging
3. **Phase 3**: Update tests to verify the fix
4. **Phase 4**: Update documentation
5. **Phase 5**: Deploy and verify in production

## Related Issues

- **11AM Wake-Up Time Issue**: Fixed in previous conversation (routines starting before wake-up time)
- **Routine V3 Integration**: Completed in previous conversation
- **Wake-Up Time Validation**: 4-layer defense implemented

## References

- Test Tool: `test-routine-display.html`
- Debug Guide: `ROUTINE_DISPLAY_DEBUG_GUIDE.md`
- Backend Controller: `backend/src/controllers/routineController.ts`
- Frontend Service: `frontend/src/services/routineService.ts`
- Frontend Component: `frontend/src/components/RoutineViewer.tsx`

---

**Document Version**: 1.0  
**Created**: January 15, 2026  
**Status**: Ready for Implementation  
**Priority**: CRITICAL - Blocking user functionality
