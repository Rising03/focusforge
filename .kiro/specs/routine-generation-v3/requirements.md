# Requirements Document: Intelligent Routine Generation System V3

## Introduction

This specification defines a complete redesign of the daily routine generation system powered by Google Gemini AI. The system integrates all discipline components (habits, deep work, evening review, analytics) to create intelligent, personalized, and holistic daily schedules. The AI-powered system learns from user behavior, adapts to patterns, and provides contextual recommendations for optimal productivity and well-being.

## Glossary

- **System**: The AI-powered routine generation service and UI components
- **User**: A student using the discipline system
- **Routine**: An AI-generated daily schedule with time-blocked activities
- **Segment**: A single time-blocked activity within a routine
- **Energy_Pattern**: User's energy levels throughout the day tracked via analytics
- **Class_Schedule**: University/school class times
- **Study_Block**: Focused academic work session
- **Break**: Rest period between activities
- **Habit_Stack**: Related habits grouped together for efficiency
- **Adaptive_Algorithm**: AI system that learns from user behavior
- **Deep_Work_Session**: Uninterrupted focused work period (90-120 minutes)
- **Evening_Review**: End-of-day reflection and planning session
- **Habit**: Recurring activity tracked for consistency
- **Analytics_Data**: Historical performance and behavioral data
- **Gemini_AI**: Google's AI model used for intelligent routine generation
- **Context_Window**: User's current state, goals, and historical data used by AI

## Requirements

### Requirement 1: Intelligent Time Slot Generation

**User Story:** As a student, I want my routine to have realistic time slots that fit my actual schedule, so that I can actually follow it.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL create time slots that respect the user's wake-up and sleep times
2. WHEN a user has classes, THE System SHALL block out class times and not schedule activities during those periods
3. WHEN calculating available time, THE System SHALL subtract class hours, meal times, and commute time from total available hours
4. THE System SHALL ensure minimum 30-minute segments and maximum 2-hour segments for focused work
5. WHEN scheduling back-to-back activities, THE System SHALL insert 10-15 minute breaks automatically

### Requirement 2: Class Schedule Integration

**User Story:** As a student with classes, I want my routine to work around my class schedule, so that it's actually usable on class days.

#### Acceptance Criteria

1. WHEN a user indicates they have classes, THE System SHALL prompt for class start and end times
2. WHEN class times are provided, THE System SHALL mark those time blocks as "University/Classes" and make them non-editable
3. WHEN generating activities, THE System SHALL only schedule in time slots before classes, between classes (if gap > 1 hour), and after classes
4. THE System SHALL detect if there's insufficient time around classes and adjust activity count accordingly
5. WHEN a user has morning classes, THE System SHALL prioritize pre-class preparation activities

### Requirement 3: Smart Activity Distribution

**User Story:** As a user with multiple goals, I want my routine to balance all my goals fairly, so that I make progress on everything.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL include activities from ALL academic goals in rotation
2. WHEN generating a routine, THE System SHALL include activities from ALL skill goals in rotation
3. THE System SHALL ensure no single goal dominates more than 40% of the routine
4. WHEN a user has 3+ goals, THE System SHALL cycle through them across multiple days
5. THE System SHALL track which goals were used yesterday and prioritize unused goals today

### Requirement 4: Energy-Aware Scheduling

**User Story:** As a user with varying energy levels, I want difficult tasks scheduled when I have high energy, so that I can perform better.

#### Acceptance Criteria

1. WHEN a user has defined energy patterns, THE System SHALL schedule high-priority deep work during high-energy periods
2. WHEN energy pattern data is unavailable, THE System SHALL use smart defaults (morning = high energy for early risers)
3. THE System SHALL schedule lighter activities (review, practice) during low-energy periods
4. WHEN a user consistently fails afternoon tasks, THE System SHALL adapt by moving them to morning slots
5. THE System SHALL never schedule deep work in the 2 hours before sleep time

### Requirement 5: Realistic Activity Types

**User Story:** As a student, I want activity descriptions that are specific and actionable, so that I know exactly what to do.

#### Acceptance Criteria

1. WHEN creating an activity, THE System SHALL use specific, actionable descriptions (e.g., "Study Chapter 3: Calculus" not "Study")
2. THE System SHALL vary activity types: deep work, active recall, practice problems, reading, review, skill practice
3. WHEN scheduling study activities, THE System SHALL include specific study techniques (Pomodoro, active recall, spaced repetition)
4. THE System SHALL include preparation activities (gather materials, set up workspace) for deep work sessions
5. THE System SHALL include transition activities (review notes, plan next session) at the end of study blocks

### Requirement 6: Break and Rest Management

**User Story:** As a user who gets fatigued, I want appropriate breaks built into my routine, so that I can maintain focus and avoid burnout.

#### Acceptance Criteria

1. WHEN two activities are scheduled back-to-back, THE System SHALL insert a 10-15 minute break between them
2. WHEN a study session exceeds 90 minutes, THE System SHALL split it into two sessions with a break
3. THE System SHALL include a longer break (30-45 minutes) for lunch if routine spans midday
4. WHEN a user has classes, THE System SHALL include a post-class decompression break (15-20 minutes)
5. THE System SHALL suggest break activities (walk, stretch, snack) based on time of day

### Requirement 7: Adaptive Learning

**User Story:** As a user who completes routines, I want the system to learn from my behavior and improve future routines, so that they get better over time.

#### Acceptance Criteria

1. WHEN a user marks segments as completed, THE System SHALL track completion rates per activity type
2. WHEN a user consistently skips certain activity types, THE System SHALL reduce their frequency
3. WHEN a user consistently completes certain time slots, THE System SHALL prioritize important tasks in those slots
4. THE System SHALL track which goals get completed most and adjust difficulty accordingly
5. WHEN completion rate drops below 60%, THE System SHALL simplify the next routine (fewer segments, longer breaks)

### Requirement 8: Flexible Routine Complexity

**User Story:** As a user with varying capacity, I want routines that match my current energy and availability, so that I don't get overwhelmed.

#### Acceptance Criteria

1. WHEN available hours < 4, THE System SHALL generate a "light" routine with 2-3 core activities
2. WHEN available hours is 4-6, THE System SHALL generate a "moderate" routine with 4-5 activities
3. WHEN available hours > 6, THE System SHALL generate a "full" routine with 6-8 activities
4. THE System SHALL allow users to request "easy day" routines with reduced complexity
5. WHEN a user has low energy level, THE System SHALL reduce segment count by 25%

### Requirement 9: Morning Routine Optimization

**User Story:** As a user who generates routines in the morning, I want the system to adapt to my actual wake-up time, so that the routine is immediately useful.

#### Acceptance Criteria

1. WHEN generating a routine after wake-up time, THE System SHALL start the routine from current time + 30 minutes
2. THE System SHALL detect if user woke up late and adjust routine accordingly (skip morning activities if needed)
3. WHEN current time is past scheduled class time, THE System SHALL mark those classes as "missed" and reschedule around remaining time
4. THE System SHALL prioritize urgent/high-priority tasks when time is limited
5. WHEN generating mid-day, THE System SHALL focus on afternoon and evening activities only

### Requirement 10: Visual Routine Presentation

**User Story:** As a user viewing my routine, I want a clear, visual timeline, so that I can quickly understand my day.

#### Acceptance Criteria

1. WHEN displaying a routine, THE System SHALL show a visual timeline with color-coded activity types
2. THE System SHALL display time remaining until next activity
3. THE System SHALL highlight the current active segment
4. WHEN a segment is completed, THE System SHALL show visual progress (checkmark, strikethrough)
5. THE System SHALL show total estimated time and completion percentage

### Requirement 11: Quick Routine Regeneration

**User Story:** As a user whose plans change, I want to quickly regenerate my routine, so that I can adapt to unexpected events.

#### Acceptance Criteria

1. THE System SHALL provide a "Regenerate" button that creates a new routine for today
2. WHEN regenerating, THE System SHALL preserve completed segments and only regenerate remaining time
3. THE System SHALL allow users to specify "I have X hours left today" for mid-day regeneration
4. WHEN regenerating, THE System SHALL ask if circumstances changed (energy level, class schedule)
5. THE System SHALL limit regeneration to 3 times per day to encourage commitment

### Requirement 12: Routine Templates

**User Story:** As a user with recurring schedules, I want to save routine templates, so that I don't have to regenerate similar routines.

#### Acceptance Criteria

1. THE System SHALL allow users to save a routine as a template with a custom name
2. WHEN creating a routine, THE System SHALL offer saved templates as quick-start options
3. THE System SHALL allow editing template time slots before applying
4. WHEN applying a template, THE System SHALL adapt it to current day's available time
5. THE System SHALL provide default templates: "Class Day", "Free Day", "Exam Prep Day", "Light Day"

### Requirement 13: Goal Progress Tracking

**User Story:** As a user working toward goals, I want to see which goals I've worked on recently, so that I can ensure balanced progress.

#### Acceptance Criteria

1. WHEN viewing routine generation, THE System SHALL show "Last worked on" date for each goal
2. THE System SHALL highlight goals that haven't been worked on in 3+ days
3. WHEN generating a routine, THE System SHALL prioritize neglected goals
4. THE System SHALL show weekly goal distribution (% of time per goal)
5. WHEN a goal is consistently neglected, THE System SHALL prompt user to remove or deprioritize it

### Requirement 14: Realistic Study Techniques

**User Story:** As a student, I want my study activities to include proven techniques, so that I study more effectively.

#### Acceptance Criteria

1. WHEN scheduling study activities, THE System SHALL suggest specific techniques: Pomodoro (25/5), Active Recall, Spaced Repetition, Practice Problems
2. THE System SHALL include technique instructions in activity description
3. WHEN a study session is 60+ minutes, THE System SHALL default to Pomodoro technique with breaks
4. THE System SHALL rotate through different techniques across days for variety
5. THE System SHALL track which techniques user completes most and prioritize those

### Requirement 15: Commute and Transition Time

**User Story:** As a student who commutes, I want my routine to account for travel time, so that I'm not constantly late.

#### Acceptance Criteria

1. WHEN a user has classes, THE System SHALL ask for commute time to campus
2. THE System SHALL block out commute time before and after classes
3. WHEN scheduling activities before classes, THE System SHALL end them at least [commute_time + 15 min] before class
4. THE System SHALL include "Prepare to leave" activities 15 minutes before commute time
5. WHEN returning from classes, THE System SHALL include a transition/decompression period

### Requirement 16: Automatic vs Manual Generation Modes

**User Story:** As a user, I want to choose between automatic AI-powered generation and manual slot creation, so that I have control over how my routine is built.

#### Acceptance Criteria

1. WHEN accessing routine generation, THE System SHALL present two mode options: "Automatic (AI-Powered)" and "Manual (Custom Slots)"
2. THE System SHALL display clear descriptions of each mode before user selection
3. WHEN a user selects a mode, THE System SHALL remember their preference for future sessions
4. THE System SHALL allow users to switch modes at any time
5. THE System SHALL provide a "Hybrid" option that combines AI suggestions with manual adjustments

### Requirement 17: Automatic Mode - AI-Powered Generation

**User Story:** As a user who wants intelligent scheduling, I want Gemini AI to automatically generate my entire routine based on my profile and historical data, so that I get optimal scheduling without manual work.

#### Acceptance Criteria

1. WHEN automatic mode is selected, THE System SHALL use Gemini AI to analyze user profile, habits, deep work patterns, evening review insights, and analytics data
2. THE System SHALL generate a complete routine with time slots, activities, and priorities automatically
3. WHEN generating automatically, THE System SHALL integrate scheduled habits from the habit tracker
4. WHEN generating automatically, THE System SHALL schedule deep work sessions during optimal energy periods from analytics
5. WHEN generating automatically, THE System SHALL incorporate insights from previous evening reviews
6. THE System SHALL use analytics data to predict optimal activity types and durations
7. WHEN automatic generation completes, THE System SHALL provide AI reasoning for key scheduling decisions
8. THE System SHALL allow users to regenerate with different parameters without losing the current routine

### Requirement 18: Manual Mode - Custom Slot Creation

**User Story:** As a user who wants full control, I want to manually create time slots and then have them intelligently filled based on my energy levels, so that I control the structure but get smart activity suggestions.

#### Acceptance Criteria

1. WHEN manual mode is selected, THE System SHALL provide an interface for creating custom time slots
2. THE System SHALL allow users to specify start time, end time, and activity type for each slot
3. WHEN a user creates empty slots, THE System SHALL automatically schedule activities based on energy level data from analytics
4. THE System SHALL sort and prioritize activities according to the time slot's energy level
5. WHEN scheduling in manual mode, THE System SHALL respect user-defined slot boundaries and not modify time ranges
6. THE System SHALL provide AI suggestions for each slot that users can accept or modify
7. WHEN a slot is marked as "flexible", THE System SHALL allow AI to adjust its timing within constraints
8. THE System SHALL validate that manual slots don't overlap and cover reasonable time ranges

### Requirement 19: Time Range Selection

**User Story:** As a user with varying availability, I want to specify the time range for my routine, so that it only covers the hours I'm actually available.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL prompt for start time and end time
2. THE System SHALL provide quick presets: "Morning Only" (6am-12pm), "Afternoon Only" (12pm-6pm), "Evening Only" (6pm-11pm), "Full Day" (wake to sleep)
3. WHEN a time range is selected, THE System SHALL only generate activities within that range
4. THE System SHALL calculate available hours based on the selected time range minus class times and breaks
5. WHEN time range conflicts with class schedule, THE System SHALL warn user and suggest adjustments

### Requirement 20: Priority-Based Activity Scheduling

**User Story:** As a user with urgent tasks, I want to set priorities for different goals and activities, so that important work gets scheduled first.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL allow users to set priority levels: Critical, High, Medium, Low
2. THE System SHALL schedule Critical priority activities in the user's peak energy periods
3. WHEN multiple activities have the same priority, THE System SHALL use analytics data to determine optimal ordering
4. THE System SHALL ensure Critical and High priority activities are scheduled before Medium and Low priority ones
5. WHEN time is limited, THE System SHALL drop Low priority activities first to fit higher priorities

### Requirement 21: Habit Integration

**User Story:** As a user with established habits, I want my routine to automatically include my scheduled habits, so that I maintain consistency.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL fetch all active habits from the habit tracker
2. THE System SHALL schedule time-specific habits (e.g., "Morning meditation at 7am") at their designated times
3. WHEN a habit has a preferred time range, THE System SHALL schedule it within that range
4. THE System SHALL group related habits into habit stacks when they occur consecutively
5. WHEN a habit conflicts with a class or deep work session, THE System SHALL suggest an alternative time

### Requirement 22: Deep Work Session Integration

**User Story:** As a user who does deep work, I want my routine to include protected deep work blocks during my optimal focus times, so that I can accomplish cognitively demanding tasks.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL query the deep work service for optimal time slots based on energy patterns
2. THE System SHALL schedule 90-120 minute deep work blocks during high-energy periods
3. WHEN a deep work session is scheduled, THE System SHALL mark it as "protected" and prevent other activities from overlapping
4. THE System SHALL include 15-minute preparation time before deep work sessions
5. WHEN deep work sessions are completed, THE System SHALL use that data to refine future scheduling

### Requirement 23: Evening Review Integration

**User Story:** As a user who does evening reviews, I want insights from my reviews to influence tomorrow's routine, so that I learn from what worked and what didn't.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL fetch the most recent evening review
2. WHEN the evening review indicates low energy, THE System SHALL reduce routine complexity for the next day
3. WHEN the evening review shows certain activities were skipped, THE System SHALL adjust their scheduling or priority
4. THE System SHALL incorporate "tomorrow tasks" from evening reviews as high-priority activities
5. WHEN evening review mood is low, THE System SHALL include more breaks and lighter activities

### Requirement 24: Analytics-Driven Personalization

**User Story:** As a user with historical data, I want my routine to be personalized based on my past performance patterns, so that it gets better over time.

#### Acceptance Criteria

1. WHEN generating a routine, THE System SHALL query analytics service for consistency scores, energy patterns, and productivity metrics
2. THE System SHALL use historical completion rates to adjust routine complexity
3. WHEN analytics show declining patterns, THE System SHALL simplify the routine and add more breaks
4. THE System SHALL schedule activities during historically productive time periods
5. WHEN analytics show strong performance, THE System SHALL gradually increase routine complexity

### Requirement 25: Gemini AI Natural Language Requests

**User Story:** As a user, I want to request routines using natural language, so that I can quickly generate specialized routines without filling out forms.

#### Acceptance Criteria

1. THE System SHALL provide a natural language input field powered by Gemini AI
2. WHEN a user types a request like "Generate an exam prep routine for tomorrow", THE System SHALL parse the intent and generate accordingly
3. THE System SHALL support requests for specific routine types: "light day", "intense study day", "balanced day", "exam prep"
4. WHEN a natural language request is ambiguous, THE System SHALL ask clarifying questions
5. THE System SHALL remember context from previous requests in the same session

### Requirement 26: AI-Powered Activity Suggestions

**User Story:** As a user, I want Gemini AI to suggest specific activities based on my goals and current progress, so that I know exactly what to work on.

#### Acceptance Criteria

1. WHEN generating activities, THE System SHALL use Gemini AI to create specific, actionable descriptions
2. THE System SHALL analyze goal progress and suggest activities that address gaps
3. WHEN a goal hasn't been worked on recently, THE System SHALL prioritize activities for that goal
4. THE System SHALL suggest study techniques appropriate for the activity type and duration
5. WHEN suggesting activities, THE System SHALL consider user's learning style from profile

### Requirement 27: Energy-Based Activity Scheduling (Manual Mode)

**User Story:** As a manual mode user, I want activities automatically assigned to my time slots based on my energy levels, so that difficult tasks are scheduled when I have high energy.

#### Acceptance Criteria

1. WHEN manual slots are created, THE System SHALL fetch energy pattern data from analytics
2. THE System SHALL classify each time slot as high, medium, or low energy based on historical data
3. WHEN assigning activities to slots, THE System SHALL match high-priority/difficult activities to high-energy slots
4. THE System SHALL assign lighter activities (review, practice) to low-energy slots
5. WHEN energy data is unavailable for a time slot, THE System SHALL use smart defaults based on time of day

### Requirement 28: Routine Comparison and A/B Testing

**User Story:** As a user, I want to compare different routine strategies, so that I can find what works best for me.

#### Acceptance Criteria

1. THE System SHALL allow users to generate multiple routine variations for the same day
2. WHEN comparing routines, THE System SHALL show differences in activity distribution, complexity, and energy alignment
3. THE System SHALL track which routine variations lead to better completion rates
4. WHEN a routine variation performs well, THE System SHALL suggest using that strategy more often
5. THE System SHALL provide insights on why one routine might work better than another

### Requirement 29: Smart Break Recommendations

**User Story:** As a user, I want AI-powered break suggestions that match my current state and time of day, so that breaks are actually restorative.

#### Acceptance Criteria

1. WHEN scheduling breaks, THE System SHALL use Gemini AI to suggest specific break activities
2. THE System SHALL vary break suggestions: physical movement, mental rest, social interaction, creative activities
3. WHEN a user has been sedentary, THE System SHALL suggest movement-based breaks
4. WHEN a user has been doing intense cognitive work, THE System SHALL suggest mental rest breaks
5. THE System SHALL learn which break types the user actually takes and prefers

### Requirement 30: Routine Adaptation Mid-Day

**User Story:** As a user whose day doesn't go as planned, I want the system to adapt my routine in real-time, so that I can stay on track despite disruptions.

#### Acceptance Criteria

1. WHEN a user marks activities as skipped or delayed, THE System SHALL offer to regenerate the remaining routine
2. THE System SHALL preserve completed activities and only regenerate future time slots
3. WHEN regenerating mid-day, THE System SHALL prioritize critical activities that haven't been completed
4. THE System SHALL adjust activity durations to fit remaining available time
5. WHEN multiple activities are skipped, THE System SHALL ask if the user wants a simplified routine for the rest of the day

## Non-Functional Requirements

### Performance
- Automatic routine generation SHALL complete within 5 seconds (including AI processing)
- Manual routine generation SHALL complete within 2 seconds
- UI SHALL be responsive on mobile devices
- System SHALL handle 1000+ concurrent routine generations
- Gemini AI requests SHALL have 10-second timeout with graceful fallback

### Usability
- Mode selection SHALL be clear and prominent
- Automatic mode SHALL require maximum 2 user inputs (time range, priority focus)
- Manual mode SHALL provide intuitive drag-and-drop slot creation
- UI SHALL be intuitive for first-time users
- System SHALL provide helpful tooltips and examples
- Natural language input SHALL support conversational requests

### Reliability
- System SHALL gracefully handle missing profile data with smart defaults
- System SHALL provide meaningful error messages
- System SHALL never generate overlapping time slots
- WHEN Gemini AI is unavailable, THE System SHALL fall back to rule-based generation
- System SHALL validate all generated routines for logical consistency

### AI Integration
- System SHALL use Gemini 2.5 Flash Lite model for cost-efficiency
- AI requests SHALL include full context: profile, habits, deep work, evening reviews, analytics
- System SHALL cache AI responses for similar requests to reduce API calls
- System SHALL track AI generation quality and adjust prompts based on user feedback

### Data Integration
- System SHALL fetch data from all services: Profile, Habits, Deep Work, Evening Review, Analytics
- Data fetching SHALL happen in parallel to minimize latency
- System SHALL handle service failures gracefully with partial data
- System SHALL maintain data consistency across all integrated components

