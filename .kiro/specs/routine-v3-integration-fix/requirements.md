# Requirements Document: Routine V3 Integration Fix

## Introduction

Fix the integration between Routine Generation V3 and the main Routine tab in the Student Discipline System. The routine generator creates routines but they are not properly displayed in the Routine Viewer, and there may be issues with database persistence and frontend-backend communication.

## Glossary

- **Routine_Generator_V3**: The component that creates new daily routines using AI or manual input
- **Routine_Viewer**: The component that displays saved routines and allows tracking progress
- **Routine_Tab**: The main dashboard tab containing both the generator and viewer
- **Backend_API**: The Express.js API that handles routine generation and storage
- **Database**: PostgreSQL database storing routine data
- **Response_Format**: The JSON structure returned by the API

## Requirements

### Requirement 1: Database Persistence

**User Story:** As a user, I want my generated routines to be saved to the database, so that I can access them later and track my progress.

#### Acceptance Criteria

1. WHEN a routine is generated through any mode (automatic, manual, or natural language), THE System SHALL save the routine to the daily_routines table in the database
2. WHEN saving a routine, THE System SHALL include all required fields: user_id, date, segments, adaptations, and completed status
3. WHEN a routine already exists for a given date, THE System SHALL return the existing routine instead of creating a duplicate
4. WHEN the database save operation fails, THE System SHALL return a clear error message to the user
5. WHEN a routine is successfully saved, THE System SHALL return the complete routine data including the database-generated ID

### Requirement 2: API Response Format Consistency

**User Story:** As a frontend developer, I want consistent API response formats, so that the UI can reliably display routine data.

#### Acceptance Criteria

1. WHEN the backend returns a routine, THE System SHALL wrap the response in a consistent format with success, data, and message fields
2. WHEN returning routine segments, THE System SHALL include both time_slot (backend format) and timeSlot (frontend format) for compatibility
3. WHEN an error occurs, THE System SHALL return a standardized error response with error and message fields
4. WHEN a routine is generated, THE Response SHALL include the routine object nested under a "routine" or "data" key
5. WHEN the frontend receives a routine response, THE System SHALL be able to extract the routine data without additional transformation

### Requirement 3: Frontend-Backend Communication

**User Story:** As a user, I want the Routine tab to automatically refresh after generating a routine, so that I can immediately see my new schedule.

#### Acceptance Criteria

1. WHEN a routine is successfully generated, THE Routine_Generator_V3 SHALL trigger a refresh of the Routine_Viewer component
2. WHEN the Routine_Viewer loads, THE System SHALL fetch the routine for the current date from the backend
3. WHEN no routine exists for the current date, THE Routine_Viewer SHALL display a message prompting the user to generate one
4. WHEN the backend API call fails, THE System SHALL display a user-friendly error message
5. WHEN switching to the Routine tab, THE System SHALL fetch the latest routine data from the database

### Requirement 4: Component State Management

**User Story:** As a user, I want the Routine tab components to stay synchronized, so that changes in one component are reflected in the other.

#### Acceptance Criteria

1. WHEN a routine is generated in Routine_Generator_V3, THE System SHALL update the shared state to trigger Routine_Viewer refresh
2. WHEN a routine segment is marked as completed in Routine_Viewer, THE System SHALL update the database and local state
3. WHEN the user navigates away from and back to the Routine tab, THE System SHALL reload the current routine data
4. WHEN multiple routines exist, THE System SHALL display the most recent routine by default
5. WHEN the refresh key changes in Dashboard, THE System SHALL remount both Routine_Generator_V3 and Routine_Viewer components

### Requirement 5: Error Handling and User Feedback

**User Story:** As a user, I want clear feedback when something goes wrong, so that I know what action to take.

#### Acceptance Criteria

1. WHEN a routine generation fails, THE System SHALL display the specific error message from the backend
2. WHEN the database is unavailable, THE System SHALL display a message indicating the service is temporarily unavailable
3. WHEN authentication fails, THE System SHALL redirect the user to the login page
4. WHEN a routine is successfully generated, THE System SHALL display a success message for 3 seconds
5. WHEN loading data, THE System SHALL display a loading indicator to show progress

### Requirement 6: Data Validation

**User Story:** As a developer, I want data validation on both frontend and backend, so that invalid data never reaches the database.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL validate that the date is in YYYY-MM-DD format
2. WHEN generating a routine, THE System SHALL validate that the user is authenticated
3. WHEN using manual mode, THE System SHALL validate that at least one time slot is provided
4. WHEN using natural language mode, THE System SHALL validate that the input is not empty
5. WHEN saving routine segments, THE System SHALL validate that each segment has required fields: id, time_slot, activity, type, and duration

### Requirement 7: Routine Viewer Integration

**User Story:** As a user, I want to see my generated routine immediately in the Routine Viewer, so that I can start following my schedule.

#### Acceptance Criteria

1. WHEN a routine is generated, THE Routine_Viewer SHALL automatically fetch and display the new routine
2. WHEN displaying a routine, THE System SHALL show all segments in chronological order
3. WHEN a routine has no segments, THE System SHALL display a message indicating the routine is empty
4. WHEN fetching a routine fails, THE System SHALL display an error message and provide a retry option
5. WHEN the routine data is loading, THE System SHALL display a loading skeleton or spinner

### Requirement 8: Backward Compatibility

**User Story:** As a system maintainer, I want V3 to be backward compatible with V2, so that existing functionality continues to work.

#### Acceptance Criteria

1. WHEN a V2 API request is received, THE System SHALL process it using the V2 algorithm
2. WHEN V2 fields are provided (energy_level, available_time_override), THE System SHALL map them to V3 equivalents
3. WHEN the mode field is not provided, THE System SHALL default to automatic mode
4. WHEN V2 response format is expected, THE System SHALL provide it alongside V3 format
5. WHEN existing routines are fetched, THE System SHALL format them correctly regardless of which version created them
