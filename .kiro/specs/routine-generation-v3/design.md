# Design Document: Intelligent Routine Generation System V3

## Overview

The Intelligent Routine Generation System V3 is a complete redesign that transforms routine generation from a simple scheduling tool into an AI-powered, holistic system that integrates all discipline components. The system offers two generation modes (Automatic and Manual), leverages Google Gemini AI for intelligent decision-making, and learns from user behavior across habits, deep work, evening reviews, and analytics.

### Key Design Principles

1. **AI-First Architecture**: Gemini AI is the core intelligence, not just a feature
2. **Holistic Integration**: All system components (habits, deep work, evening review, analytics) feed into routine generation
3. **User Control**: Users choose between full automation or manual control with AI assistance
4. **Adaptive Learning**: System improves over time based on user behavior and feedback
5. **Energy Optimization**: Activities are matched to user's natural energy patterns
6. **Graceful Degradation**: System works even when AI or data services are unavailable

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ Routine Generator│  │  Manual Slot     │  │  Natural      │ │
│  │   Component      │  │   Builder        │  │  Language     │ │
│  │                  │  │                  │  │  Input        │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                   (routineController.ts)                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Routine Generation Service                     │
│                    (routineService.ts)                           │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Generation Mode Router                       │  │
│  │  ┌─────────────────────┐  ┌──────────────────────────┐  │  │
│  │  │  Automatic Mode     │  │    Manual Mode           │  │  │
│  │  │  (AI-Powered)       │  │    (User-Controlled)     │  │  │
│  │  └─────────────────────┘  └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI Integration Layer                          │
│                   (Gemini AI Service)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Natural Language Processing                           │  │
│  │  • Activity Suggestion Generation                        │  │
│  │  • Break Recommendation                                  │  │
│  │  • Routine Optimization                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Data Integration Layer                        │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────┐│
│  │   Profile    │ │    Habits    │ │  Deep Work   │ │Evening ││
│  │   Service    │ │   Service    │ │   Service    │ │Review  ││
│  └──────────────┘ └──────────────┘ └──────────────┘ └────────┘│
│  ┌──────────────┐                                               │
│  │  Analytics   │                                               │
│  │   Service    │                                               │
│  └──────────────┘                                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Database Layer                              │
│  • daily_routines table                                         │
│  • routine_templates table                                      │
│  • routine_performance_metrics table                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Routine Generation Service (Core)

**File**: `backend/src/services/routineService.ts`

**Responsibilities**:
- Route requests to appropriate generation mode (Automatic or Manual)
- Orchestrate data fetching from all integrated services
- Validate and save generated routines
- Handle routine regeneration and mid-day adaptation
- Track routine performance metrics

**Key Methods**:

```typescript
class RoutineService {
  // Main generation entry point
  async generateDailyRoutine(
    userId: string, 
    request: CreateRoutineRequest
  ): Promise<RoutineResponse>
  
  // Automatic mode generation
  async generateAutomaticRoutine(
    userId: string,
    context: RoutineContext
  ): Promise<DailyRoutine>
  
  // Manual mode generation
  async generateManualRoutine(
    userId: string,
    slots: ManualTimeSlot[],
    context: RoutineContext
  ): Promise<DailyRoutine>
  
  // Mid-day adaptation
  async adaptRoutineMidDay(
    userId: string,
    routineId: string,
    remainingTime: number
  ): Promise<DailyRoutine>
  
  // Routine comparison
  async compareRoutineVariations(
    userId: string,
    variations: DailyRoutine[]
  ): Promise<RoutineComparison>
}
```

### 2. AI Integration Service

**File**: `backend/src/services/aiRoutineService.ts` (new)

**Responsibilities**:
- Interface with Gemini AI for routine generation
- Parse natural language routine requests
- Generate AI-powered activity suggestions
- Provide reasoning for scheduling decisions
- Handle AI fallback scenarios

**Key Methods**:

```typescript
class AIRoutineService {
  // Parse natural language request
  async parseRoutineRequest(
    input: string,
    context: UserContext
  ): Promise<ParsedRoutineRequest>
  
  // Generate complete routine using AI
  async generateAIRoutine(
    context: RoutineContext
  ): Promise<AIGeneratedRoutine>
  
  // Suggest activities for time slots
  async suggestActivities(
    timeSlot: TimeSlot,
    context: RoutineContext
  ): Promise<ActivitySuggestion[]>
  
  // Generate break recommendations
  async recommendBreak(
    previousActivity: Activity,
    timeOfDay: string,
    userState: UserState
  ): Promise<BreakRecommendation>
  
  // Provide scheduling reasoning
  async explainSchedulingDecision(
    activity: Activity,
    timeSlot: TimeSlot,
    context: RoutineContext
  ): Promise<string>
}
```

### 3. Data Integration Orchestrator

**File**: `backend/src/services/routineDataOrchestrator.ts` (new)

**Responsibilities**:
- Fetch data from all integrated services in parallel
- Build comprehensive routine context
- Handle service failures gracefully
- Cache frequently accessed data

**Key Methods**:

```typescript
class RoutineDataOrchestrator {
  // Fetch all context data
  async buildRoutineContext(
    userId: string,
    date: Date
  ): Promise<RoutineContext>
  
  // Fetch habit data
  async fetchHabitData(userId: string): Promise<HabitData>
  
  // Fetch deep work patterns
  async fetchDeepWorkData(userId: string): Promise<DeepWorkData>
  
  // Fetch evening review insights
  async fetchEveningReviewData(userId: string): Promise<EveningReviewData>
  
  // Fetch analytics patterns
  async fetchAnalyticsData(userId: string): Promise<AnalyticsData>
  
  // Fetch profile data
  async fetchProfileData(userId: string): Promise<ProfileData>
}
```

### 4. Energy-Based Scheduler

**File**: `backend/src/services/energyScheduler.ts` (new)

**Responsibilities**:
- Classify time slots by energy level
- Match activities to appropriate energy levels
- Optimize activity ordering based on energy patterns
- Handle manual mode energy-based scheduling

**Key Methods**:

```typescript
class EnergyScheduler {
  // Classify time slot energy level
  classifyTimeSlotEnergy(
    timeSlot: TimeSlot,
    energyPatterns: EnergyPattern[]
  ): EnergyLevel
  
  // Match activities to energy levels
  matchActivitiesToEnergy(
    activities: Activity[],
    timeSlots: TimeSlot[],
    energyPatterns: EnergyPattern[]
  ): ScheduledActivity[]
  
  // Optimize activity order
  optimizeActivityOrder(
    activities: Activity[],
    energyPatterns: EnergyPattern[]
  ): Activity[]
  
  // Get optimal time for activity type
  getOptimalTimeForActivity(
    activityType: ActivityType,
    energyPatterns: EnergyPattern[]
  ): TimeSlot
}
```

### 5. Manual Slot Builder

**File**: `backend/src/services/manualSlotBuilder.ts` (new)

**Responsibilities**:
- Validate user-created time slots
- Fill slots with appropriate activities
- Apply energy-based scheduling to manual slots
- Provide AI suggestions for each slot

**Key Methods**:

```typescript
class ManualSlotBuilder {
  // Validate manual slots
  validateManualSlots(
    slots: ManualTimeSlot[]
  ): ValidationResult
  
  // Fill slots with activities
  async fillSlotsWithActivities(
    slots: ManualTimeSlot[],
    context: RoutineContext
  ): Promise<RoutineSegment[]>
  
  // Get AI suggestions for slot
  async getSuggestionsForSlot(
    slot: ManualTimeSlot,
    context: RoutineContext
  ): Promise<ActivitySuggestion[]>
  
  // Apply energy-based scheduling
  applyEnergyBasedScheduling(
    slots: ManualTimeSlot[],
    activities: Activity[],
    energyPatterns: EnergyPattern[]
  ): ScheduledActivity[]
}
```

## Data Models

### Core Types

```typescript
// Generation mode
type GenerationMode = 'automatic' | 'manual' | 'hybrid';

// Priority levels
type Priority = 'critical' | 'high' | 'medium' | 'low';

// Energy levels
type EnergyLevel = 'high' | 'medium' | 'low';

// Time range presets
type TimeRangePreset = 'morning' | 'afternoon' | 'evening' | 'full_day' | 'custom';

// Routine request
interface CreateRoutineRequest {
  date: string;
  mode: GenerationMode;
  timeRange?: {
    start: string;
    end: string;
    preset?: TimeRangePreset;
  };
  priorityFocus?: Priority;
  manualSlots?: ManualTimeSlot[];
  naturalLanguageRequest?: string;
  preferences?: RoutinePreferences;
}

// Manual time slot
interface ManualTimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  activityType?: ActivityType;
  priority?: Priority;
  isFlexible: boolean;
  userNotes?: string;
}

// Routine context (all integrated data)
interface RoutineContext {
  userId: string;
  date: Date;
  profile: ProfileData;
  habits: HabitData;
  deepWork: DeepWorkData;
  eveningReview: EveningReviewData;
  analytics: AnalyticsData;
  preferences: RoutinePreferences;
}

// Profile data
interface ProfileData {
  targetIdentity: string;
  academicGoals: string[];
  skillGoals: string[];
  wakeUpTime: string;
  sleepTime: string;
  availableHours: number;
  classSchedule?: ClassSchedule;
  commuteTime?: number;
  energyPattern?: EnergyPattern[];
  learningStyle?: string;
}

// Habit data
interface HabitData {
  activeHabits: Habit[];
  habitStacks: HabitStack[];
  scheduledHabits: ScheduledHabit[];
  consistencyScores: Record<string, number>;
}

// Deep work data
interface DeepWorkData {
  optimalTimeSlots: TimeSlot[];
  energyPatterns: EnergyPattern[];
  averageSessionDuration: number;
  preferredCognitiveLoad: string;
  recentPerformance: DeepWorkPerformance[];
}

// Evening review data
interface EveningReviewData {
  lastReview?: EveningReview;
  tomorrowTasks: string[];
  energyLevel: number;
  mood: number;
  insights: string;
  skippedActivities: string[];
}

// Analytics data
interface AnalyticsData {
  consistencyScore: number;
  identityAlignment: number;
  productivityPatterns: ProductivityMetrics;
  behavioralInsights: BehavioralInsight[];
  completionRates: Record<string, number>;
  optimalActivityTimes: Record<ActivityType, TimeSlot[]>;
}

// AI-generated routine
interface AIGeneratedRoutine {
  segments: RoutineSegment[];
  reasoning: SchedulingReasoning[];
  confidence: number;
  alternatives: AlternativeSchedule[];
}

// Scheduling reasoning
interface SchedulingReasoning {
  segmentId: string;
  decision: string;
  factors: string[];
  confidence: number;
}

// Activity suggestion
interface ActivitySuggestion {
  activity: string;
  description: string;
  duration: number;
  priority: Priority;
  reasoning: string;
  confidence: number;
}

// Break recommendation
interface BreakRecommendation {
  type: 'physical' | 'mental' | 'social' | 'creative';
  activity: string;
  duration: number;
  reasoning: string;
}

// Routine comparison
interface RoutineComparison {
  variations: DailyRoutine[];
  differences: RoutineDifference[];
  recommendations: string[];
  predictedPerformance: Record<string, number>;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property 1: Time Slot Boundaries

*For any* generated routine and user wake/sleep times, all time slots should start at or after wake time and end at or before sleep time.

**Validates: Requirements 1.1**

### Property 2: Class Time Protection

*For any* routine with class schedule, no activity segments should overlap with class time blocks.

**Validates: Requirements 1.2**

### Property 3: Available Time Calculation

*For any* user schedule with classes, meals, and commute time, the calculated available hours should equal total hours minus blocked time.

**Validates: Requirements 1.3**

### Property 4: Segment Duration Constraints

*For any* generated routine, all focused work segments should have duration >= 30 minutes and <= 120 minutes.

**Validates: Requirements 1.4**

### Property 5: Automatic Break Insertion

*For any* two consecutive activities in a routine, there should be a 10-15 minute break segment between them.

**Validates: Requirements 1.5**

### Property 6: Data Integration Completeness

*For any* automatic mode generation, the system should fetch data from all five services: Profile, Habits, Deep Work, Evening Review, and Analytics.

**Validates: Requirements 17.1**

### Property 7: Habit Integration

*For any* routine with scheduled habits, all time-specific habits should appear in the routine at their designated times.

**Validates: Requirements 17.3, 21.2**

### Property 8: Deep Work Energy Alignment

*For any* routine with deep work sessions, all deep work blocks should be scheduled during time slots classified as high-energy.

**Validates: Requirements 17.4, 22.2**

### Property 9: Energy-Based Activity Assignment

*For any* manual mode routine with energy data, activities should be assigned to slots such that high-priority activities are in high-energy slots.

**Validates: Requirements 18.3, 18.4, 27.3**

### Property 10: Manual Slot Non-Overlap

*For any* set of manual time slots, no two slots should have overlapping time ranges.

**Validates: Requirements 18.8**

### Property 11: Time Range Containment

*For any* routine with specified time range, all activity segments should have start and end times within that range.

**Validates: Requirements 19.3**

### Property 12: Priority-Based Scheduling Order

*For any* routine with mixed priority activities, critical and high priority activities should be scheduled before medium and low priority activities in the timeline.

**Validates: Requirements 20.2, 20.4**

### Property 13: Habit Stack Grouping

*For any* set of consecutive related habits, they should be grouped into a single habit stack segment.

**Validates: Requirements 21.4**

### Property 14: Deep Work Duration

*For any* deep work session in a routine, the duration should be between 90 and 120 minutes.

**Validates: Requirements 22.2**

### Property 15: Evening Review Adaptation

*For any* routine generated after an evening review indicating low energy, the routine complexity (number of segments) should be less than the user's baseline complexity.

**Validates: Requirements 23.2**

### Property 16: Completion Rate Adaptation

*For any* user with historical completion rate data, routine complexity should be inversely correlated with recent completion rate (lower completion rate = simpler routine).

**Validates: Requirements 24.2**

### Property 17: Energy Level Classification

*For any* time slot with historical energy data, the slot should be classified as exactly one of: high, medium, or low energy.

**Validates: Requirements 27.2**

### Property 18: Mid-Day Preservation

*For any* mid-day routine regeneration, all segments marked as completed should remain unchanged in the new routine.

**Validates: Requirements 30.2**

### Property 19: Remaining Time Fit

*For any* mid-day routine regeneration, the sum of all new activity durations should equal the remaining available time.

**Validates: Requirements 30.4**

## Error Handling

### AI Service Failures

**Scenario**: Gemini AI service is unavailable or returns errors

**Handling**:
1. Detect AI service failure within 10-second timeout
2. Log failure with context for debugging
3. Fall back to rule-based generation algorithm
4. Notify user that routine was generated without AI assistance
5. Cache last successful AI response for similar requests
6. Retry AI service on next generation attempt

**Fallback Algorithm**:
- Use energy patterns from analytics for time slot classification
- Apply priority-based scheduling rules
- Use template-based activity descriptions
- Generate breaks using fixed rules (every 90 minutes)

### Data Service Failures

**Scenario**: One or more integrated services (Habits, Deep Work, etc.) are unavailable

**Handling**:
1. Fetch data from all services in parallel with 5-second timeout per service
2. Continue generation with partial data if some services succeed
3. Use smart defaults for missing data:
   - **Profile**: Use system defaults (8am wake, 11pm sleep, 8 hours available)
   - **Habits**: Skip habit integration, note in routine
   - **Deep Work**: Use time-of-day heuristics (morning = high energy)
   - **Evening Review**: Skip adaptation, use baseline complexity
   - **Analytics**: Use population averages for energy patterns
4. Mark routine as "generated with limited data"
5. Suggest user complete missing profile sections

### Invalid User Input

**Scenario**: User provides invalid time ranges, conflicting priorities, or malformed manual slots

**Handling**:
1. Validate all inputs before processing
2. Return specific error messages for each validation failure
3. Suggest corrections (e.g., "Time range overlaps with sleep time")
4. Provide examples of valid inputs
5. Allow partial generation with corrected inputs

### Routine Generation Failures

**Scenario**: Unable to generate valid routine due to constraints

**Handling**:
1. Identify conflicting constraints (e.g., too many activities for available time)
2. Attempt constraint relaxation in order:
   - Reduce number of activities
   - Shorten activity durations
   - Remove low-priority activities
   - Simplify break requirements
3. If still unable to generate, return error with explanation
4. Suggest user adjustments (e.g., "Increase available time or reduce goals")

## Testing Strategy

### Unit Testing

Unit tests will verify specific examples and edge cases:

**Time Slot Generation**:
- Test wake/sleep time boundary cases (midnight crossing, same day)
- Test class schedule blocking with various configurations
- Test break insertion between activities
- Test segment duration constraints

**Energy Classification**:
- Test energy level classification with various historical data
- Test activity-to-slot matching with different energy patterns
- Test fallback to time-of-day heuristics when data is missing

**Priority Scheduling**:
- Test priority ordering with mixed priority activities
- Test critical activity placement in peak energy times
- Test low-priority activity dropping when time is limited

**Data Integration**:
- Test parallel data fetching with all services available
- Test partial data scenarios with service failures
- Test smart defaults for missing data

**AI Integration**:
- Test natural language parsing with various requests
- Test AI fallback when service is unavailable
- Test activity suggestion generation

### Property-Based Testing

Property tests will verify universal properties across all inputs (minimum 100 iterations per test):

**Property Test 1: Time Boundaries** (Property 1)
- Generate random wake/sleep times and routines
- Verify all segments fall within boundaries
- **Feature: routine-generation-v3, Property 1: Time Slot Boundaries**

**Property Test 2: Class Protection** (Property 2)
- Generate random class schedules and routines
- Verify no activity overlaps with classes
- **Feature: routine-generation-v3, Property 2: Class Time Protection**

**Property Test 3: Duration Constraints** (Property 4)
- Generate random routines
- Verify all focused work segments are 30-120 minutes
- **Feature: routine-generation-v3, Property 4: Segment Duration Constraints**

**Property Test 4: Break Insertion** (Property 5)
- Generate random routines with consecutive activities
- Verify breaks exist between all consecutive activities
- **Feature: routine-generation-v3, Property 5: Automatic Break Insertion**

**Property Test 5: Energy Alignment** (Property 8, 9)
- Generate random routines with energy data
- Verify high-priority activities in high-energy slots
- **Feature: routine-generation-v3, Property 8: Deep Work Energy Alignment**

**Property Test 6: Manual Slot Non-Overlap** (Property 10)
- Generate random manual slot configurations
- Verify no two slots overlap
- **Feature: routine-generation-v3, Property 10: Manual Slot Non-Overlap**

**Property Test 7: Priority Ordering** (Property 12)
- Generate random routines with mixed priorities
- Verify critical/high activities come before medium/low
- **Feature: routine-generation-v3, Property 12: Priority-Based Scheduling Order**

**Property Test 8: Time Range Containment** (Property 11)
- Generate random time ranges and routines
- Verify all activities fall within specified range
- **Feature: routine-generation-v3, Property 11: Time Range Containment**

**Property Test 9: Mid-Day Preservation** (Property 18)
- Generate random routines with completed segments
- Regenerate mid-day and verify completed segments unchanged
- **Feature: routine-generation-v3, Property 18: Mid-Day Preservation**

**Property Test 10: Remaining Time Fit** (Property 19)
- Generate random mid-day regenerations
- Verify sum of new activity durations equals remaining time
- **Feature: routine-generation-v3, Property 19: Remaining Time Fit**

### Integration Testing

Integration tests will verify end-to-end workflows:

**Automatic Mode Flow**:
1. User selects automatic mode with time range
2. System fetches all integrated data
3. AI generates routine with reasoning
4. Routine is saved and returned to user
5. Verify all components work together

**Manual Mode Flow**:
1. User creates manual time slots
2. System classifies slots by energy level
3. System assigns activities based on energy
4. User accepts or modifies suggestions
5. Routine is saved and returned

**Mid-Day Adaptation Flow**:
1. User has active routine with some completed activities
2. User requests mid-day regeneration
3. System preserves completed activities
4. System regenerates remaining time
5. New routine maintains consistency

**Natural Language Flow**:
1. User enters natural language request
2. AI parses request and extracts parameters
3. System generates routine matching request
4. User receives routine with AI explanation

### Performance Testing

- Automatic generation should complete in < 5 seconds
- Manual generation should complete in < 2 seconds
- Data fetching should use parallel requests (< 3 seconds total)
- AI requests should timeout at 10 seconds with fallback
- System should handle 1000+ concurrent generations

## Implementation Notes

### Gemini AI Prompt Engineering

**Context Building**:
- Include full user profile (identity, goals, preferences)
- Include recent habit completion data (last 7 days)
- Include energy patterns from analytics
- Include last evening review insights
- Include current date/time and day of week

**Prompt Structure**:
```
You are an expert productivity coach helping a student create an optimal daily routine.

User Context:
- Target Identity: [identity]
- Academic Goals: [goals]
- Skill Goals: [goals]
- Energy Patterns: [patterns]
- Recent Performance: [metrics]
- Last Evening Review: [insights]

Generate a daily routine for [date] with the following requirements:
- Time Range: [start] to [end]
- Priority Focus: [priority]
- Mode: [automatic/manual]
[Additional constraints...]

Provide:
1. Complete schedule with time slots and activities
2. Reasoning for key scheduling decisions
3. Confidence score (0-1)
4. Alternative suggestions if applicable

Format response as JSON: {...}
```

**Response Parsing**:
- Validate JSON structure
- Extract segments, reasoning, confidence
- Handle malformed responses gracefully
- Fall back to rule-based generation if parsing fails

### Database Schema Updates

**New Tables**:

```sql
-- Routine templates
CREATE TABLE routine_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  mode VARCHAR(50) NOT NULL, -- 'automatic' or 'manual'
  time_range JSONB,
  manual_slots JSONB,
  preferences JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Routine performance metrics
CREATE TABLE routine_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  routine_id UUID REFERENCES daily_routines(id),
  user_id UUID REFERENCES users(id),
  completion_rate DECIMAL(5,2),
  segments_completed INTEGER,
  segments_total INTEGER,
  average_segment_duration INTEGER,
  energy_alignment_score DECIMAL(5,2),
  user_satisfaction INTEGER, -- 1-5 rating
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- AI generation logs
CREATE TABLE ai_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  routine_id UUID REFERENCES daily_routines(id),
  request_type VARCHAR(100),
  ai_model VARCHAR(100),
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Updated Tables**:

```sql
-- Add new fields to daily_routines
ALTER TABLE daily_routines ADD COLUMN generation_mode VARCHAR(50);
ALTER TABLE daily_routines ADD COLUMN time_range JSONB;
ALTER TABLE daily_routines ADD COLUMN ai_reasoning JSONB;
ALTER TABLE daily_routines ADD COLUMN confidence_score DECIMAL(3,2);
ALTER TABLE daily_routines ADD COLUMN data_sources_used JSONB;
```

### Caching Strategy

**AI Response Caching**:
- Cache AI responses for similar requests (same user, date, parameters)
- Cache key: hash of (userId, date, mode, timeRange, priorityFocus)
- TTL: 1 hour
- Invalidate on profile or preference changes

**Data Context Caching**:
- Cache integrated data context for 5 minutes
- Reduces load on integrated services
- Invalidate on data updates (habit completion, evening review submission)

**Energy Pattern Caching**:
- Cache energy patterns for 24 hours
- Patterns change slowly, safe to cache longer
- Invalidate on new analytics data

### Monitoring and Observability

**Metrics to Track**:
- Generation success rate (automatic vs manual)
- AI service availability and response times
- Data service availability per service
- Average generation time by mode
- User satisfaction ratings
- Routine completion rates by generation mode
- AI confidence scores vs actual performance

**Logging**:
- Log all generation requests with parameters
- Log AI requests and responses (sanitized)
- Log data fetching failures with service name
- Log fallback activations
- Log user feedback on generated routines

**Alerts**:
- Alert when AI service availability < 95%
- Alert when generation time > 10 seconds
- Alert when success rate < 90%
- Alert when data service failures > 10%

## Deployment Considerations

### Rollout Strategy

**Phase 1: Beta Testing**
- Deploy to 10% of users
- Monitor performance and gather feedback
- Fix critical issues
- Validate AI quality

**Phase 2: Gradual Rollout**
- Deploy to 50% of users
- A/B test against old system
- Compare completion rates and user satisfaction
- Optimize based on data

**Phase 3: Full Deployment**
- Deploy to 100% of users
- Deprecate old routine generation
- Monitor for issues
- Iterate based on feedback

### Feature Flags

- `routine_v3_enabled`: Master flag for entire system
- `automatic_mode_enabled`: Enable automatic AI generation
- `manual_mode_enabled`: Enable manual slot creation
- `natural_language_enabled`: Enable NL requests
- `ai_fallback_enabled`: Enable fallback to rule-based generation

### Migration Plan

**User Data Migration**:
- No migration needed (new system, new tables)
- Old routines remain accessible
- Users can switch between v2 and v3

**API Compatibility**:
- Maintain v2 API endpoints during transition
- Add v3 endpoints with new features
- Deprecate v2 after 3 months

## Future Enhancements

1. **Multi-Day Planning**: Generate routines for entire week
2. **Collaborative Routines**: Share and adapt routines from other users
3. **Voice Input**: Generate routines via voice commands
4. **Smart Notifications**: Remind users of upcoming activities
5. **Routine Analytics Dashboard**: Visualize routine performance over time
6. **Integration with Calendar Apps**: Sync routines to Google Calendar, etc.
7. **Offline Mode**: Generate routines without internet connection
8. **Routine Marketplace**: Browse and purchase expert-created routine templates
