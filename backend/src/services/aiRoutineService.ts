import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';

// Types for AI Routine Service
export interface UserContext {
  userId: string;
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
  currentTime: Date;
  dayOfWeek: string;
}

export interface ClassSchedule {
  hasClasses: boolean;
  classStartTime?: string;
  classEndTime?: string;
  classDays?: string[];
}

export interface EnergyPattern {
  timeOfDay: string;
  energyLevel: 'high' | 'medium' | 'low';
  productivity: number;
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  energyLevel?: 'high' | 'medium' | 'low';
}

export interface RoutineContext {
  userId: string;
  date: Date;
  profile: any;
  habits: any;
  deepWork: any;
  eveningReview: any;
  analytics: any;
  preferences: any;
}

export interface AIGeneratedRoutine {
  segments: Array<{
    id: string;
    startTime: string;
    endTime: string;
    activity: string;
    type: 'deep_work' | 'skill_practice' | 'study' | 'break' | 'personal';
    priority: 'critical' | 'high' | 'medium' | 'low';
    duration: number;
  }>;
  reasoning: SchedulingReasoning[];
  confidence: number;
  alternatives: AlternativeSchedule[];
}

export interface SchedulingReasoning {
  segmentId: string;
  decision: string;
  factors: string[];
  confidence: number;
}

export interface AlternativeSchedule {
  description: string;
  segments: any[];
}

export interface ActivitySuggestion {
  activity: string;
  description: string;
  duration: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  reasoning: string;
  confidence: number;
}

export interface BreakRecommendation {
  type: 'physical' | 'mental' | 'social' | 'creative';
  activity: string;
  duration: number;
  reasoning: string;
}

export interface ParsedRoutineRequest {
  mode: 'automatic' | 'manual';
  timeRange?: {
    start: string;
    end: string;
  };
  priorityFocus?: 'critical' | 'high' | 'medium' | 'low';
  preferences?: any;
}

/**
 * AI Routine Service
 * 
 * Handles all Gemini AI integration for routine generation:
 * - Natural language parsing for routine requests
 * - AI-powered automatic routine generation
 * - Activity suggestions for manual mode
 * - Smart break recommendations
 * - Scheduling decision explanations
 */
export class AIRoutineService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private isAvailable: boolean = true;
  private readonly AI_TIMEOUT = 10000; // 10 seconds
  private readonly MODEL_NAME = 'gemini-2.5-flash-lite';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (process.env.NODE_ENV === 'test') {
      logger.info('AI Routine Service disabled in test environment');
      this.isAvailable = false;
      return;
    }
    
    if (!apiKey) {
      logger.warn('GEMINI_API_KEY not found. AI routine features will be disabled.');
      this.isAvailable = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: this.MODEL_NAME });
      logger.info(`AI Routine Service initialized with model: ${this.MODEL_NAME}`);
    } catch (error) {
      logger.error('Failed to initialize AI Routine Service:', error);
      this.isAvailable = false;
    }
  }

  /**
   * Parse natural language routine request
   * Example: "Generate an exam prep routine for tomorrow"
   */
  async parseRoutineRequest(input: string, context: UserContext): Promise<ParsedRoutineRequest> {
    if (!this.isAvailable) {
      return this.fallbackParseRequest(input);
    }

    try {
      const prompt = this.buildParseRequestPrompt(input, context);
      const result = await this.callAIWithTimeout(prompt);
      
      return this.parseRequestResponse(result);
    } catch (error) {
      logger.error('Error parsing routine request:', error);
      return this.fallbackParseRequest(input);
    }
  }

  /**
   * Generate complete routine using AI (Automatic Mode)
   */
  async generateAIRoutine(context: RoutineContext): Promise<AIGeneratedRoutine> {
    if (!this.isAvailable) {
      return this.fallbackGenerateRoutine(context);
    }

    try {
      const prompt = this.buildGenerateRoutinePrompt(context);
      const result = await this.callAIWithTimeout(prompt);
      
      return this.parseRoutineResponse(result);
    } catch (error) {
      logger.error('Error generating AI routine:', error);
      return this.fallbackGenerateRoutine(context);
    }
  }

  /**
   * Suggest activities for time slots (Manual Mode)
   */
  async suggestActivities(
    timeSlot: TimeSlot,
    context: RoutineContext
  ): Promise<ActivitySuggestion[]> {
    if (!this.isAvailable) {
      return this.fallbackSuggestActivities(timeSlot, context);
    }

    try {
      const prompt = this.buildSuggestActivitiesPrompt(timeSlot, context);
      const result = await this.callAIWithTimeout(prompt);
      
      return this.parseActivitySuggestions(result);
    } catch (error) {
      logger.error('Error suggesting activities:', error);
      return this.fallbackSuggestActivities(timeSlot, context);
    }
  }

  /**
   * Generate break recommendations
   */
  async recommendBreak(
    previousActivity: string,
    timeOfDay: string,
    userState: any
  ): Promise<BreakRecommendation> {
    if (!this.isAvailable) {
      return this.fallbackRecommendBreak(timeOfDay);
    }

    try {
      const prompt = this.buildBreakRecommendationPrompt(previousActivity, timeOfDay, userState);
      const result = await this.callAIWithTimeout(prompt);
      
      return this.parseBreakRecommendation(result);
    } catch (error) {
      logger.error('Error recommending break:', error);
      return this.fallbackRecommendBreak(timeOfDay);
    }
  }

  /**
   * Provide scheduling reasoning
   */
  async explainSchedulingDecision(
    activity: string,
    timeSlot: TimeSlot,
    context: RoutineContext
  ): Promise<string> {
    if (!this.isAvailable) {
      return this.fallbackExplainDecision(activity, timeSlot);
    }

    try {
      const prompt = this.buildExplainDecisionPrompt(activity, timeSlot, context);
      const result = await this.callAIWithTimeout(prompt);
      
      return result.trim();
    } catch (error) {
      logger.error('Error explaining scheduling decision:', error);
      return this.fallbackExplainDecision(activity, timeSlot);
    }
  }

  // ============ Private Helper Methods ============

  private async callAIWithTimeout(prompt: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('AI request timeout'));
      }, this.AI_TIMEOUT);

      try {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        clearTimeout(timeout);
        resolve(text);
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  private buildParseRequestPrompt(input: string, context: UserContext): string {
    return `You are an AI assistant helping parse natural language routine requests.

User Context:
- Target Identity: ${context.targetIdentity}
- Academic Goals: ${context.academicGoals.join(', ')}
- Skill Goals: ${context.skillGoals.join(', ')}
- Available Hours: ${context.availableHours}
- Current Time: ${context.currentTime.toISOString()}

User Request: "${input}"

Parse this request and respond with JSON in this exact format:
{
  "mode": "automatic" | "manual",
  "timeRange": {
    "start": "HH:MM",
    "end": "HH:MM"
  },
  "priorityFocus": "critical" | "high" | "medium" | "low",
  "preferences": {
    "routineType": "exam_prep" | "balanced" | "light" | "intense",
    "focusAreas": ["area1", "area2"]
  }
}

Only respond with valid JSON, no additional text.`;
  }

  private buildGenerateRoutinePrompt(context: RoutineContext): string {
    const profile = context.profile || {};
    const habits = context.habits || {};
    const deepWork = context.deepWork || {};
    const eveningReview = context.eveningReview || {};
    const analytics = context.analytics || {};

    const wakeUpTime = profile.wake_up_time || '07:00';
    const sleepTime = profile.sleep_time || '23:00';

    return `You are an expert productivity coach creating an optimal daily routine.

User Profile:
- Target Identity: ${profile.target_identity || 'Student'}
- Academic Goals: ${(profile.academic_goals || []).join(', ')}
- Skill Goals: ${(profile.skill_goals || []).join(', ')}
- Wake Time: ${wakeUpTime}
- Sleep Time: ${sleepTime}
- Available Hours: ${profile.available_hours || 8}

Active Habits: ${(habits.activeHabits || []).length} habits
Deep Work Patterns: ${(deepWork.optimalTimeSlots || []).length} optimal slots
Last Evening Review: ${eveningReview.lastReview ? 'Available' : 'None'}
Analytics: Consistency ${analytics.consistencyScore || 0.5}

IMPORTANT: The routine MUST start at or after the wake-up time (${wakeUpTime}) and end before sleep time (${sleepTime}). 
The first segment should begin at ${wakeUpTime} or shortly after.

Generate a complete daily routine with 4-6 segments. Respond with JSON:
{
  "segments": [
    {
      "id": "segment_1",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "activity": "Specific activity description",
      "type": "deep_work" | "skill_practice" | "study" | "break" | "personal",
      "priority": "critical" | "high" | "medium" | "low",
      "duration": minutes
    }
  ],
  "reasoning": [
    {
      "segmentId": "segment_1",
      "decision": "Why this activity at this time",
      "factors": ["factor1", "factor2"],
      "confidence": 0.0-1.0
    }
  ],
  "confidence": 0.0-1.0,
  "alternatives": []
}

Only respond with valid JSON, no additional text.`;
  }

  private buildSuggestActivitiesPrompt(timeSlot: TimeSlot, context: RoutineContext): string {
    const profile = context.profile || {};
    
    return `Suggest 3 activities for this time slot.

Time Slot: ${timeSlot.startTime} - ${timeSlot.endTime}
Energy Level: ${timeSlot.energyLevel || 'medium'}
User Goals: ${(profile.academic_goals || []).concat(profile.skill_goals || []).join(', ')}

Respond with JSON array:
[
  {
    "activity": "Activity name",
    "description": "Detailed description",
    "duration": minutes,
    "priority": "critical" | "high" | "medium" | "low",
    "reasoning": "Why this activity fits",
    "confidence": 0.0-1.0
  }
]

Only respond with valid JSON, no additional text.`;
  }

  private buildBreakRecommendationPrompt(
    previousActivity: string,
    timeOfDay: string,
    userState: any
  ): string {
    return `Recommend a break activity.

Previous Activity: ${previousActivity}
Time of Day: ${timeOfDay}
User State: ${JSON.stringify(userState)}

Respond with JSON:
{
  "type": "physical" | "mental" | "social" | "creative",
  "activity": "Specific break activity",
  "duration": minutes,
  "reasoning": "Why this break is beneficial"
}

Only respond with valid JSON, no additional text.`;
  }

  private buildExplainDecisionPrompt(
    activity: string,
    timeSlot: TimeSlot,
    context: RoutineContext
  ): string {
    return `Explain why this activity is scheduled at this time.

Activity: ${activity}
Time Slot: ${timeSlot.startTime} - ${timeSlot.endTime}
Energy Level: ${timeSlot.energyLevel || 'medium'}

Provide a brief explanation (1-2 sentences) of the scheduling rationale.`;
  }

  // ============ Response Parsing Methods ============

  private parseRequestResponse(response: string): ParsedRoutineRequest {
    try {
      const json = this.extractJSON(response);
      return {
        mode: json.mode || 'automatic',
        timeRange: json.timeRange,
        priorityFocus: json.priorityFocus,
        preferences: json.preferences
      };
    } catch (error) {
      logger.error('Error parsing request response:', error);
      return { mode: 'automatic' };
    }
  }

  private parseRoutineResponse(response: string): AIGeneratedRoutine {
    try {
      const json = this.extractJSON(response);
      return {
        segments: json.segments || [],
        reasoning: json.reasoning || [],
        confidence: json.confidence || 0.5,
        alternatives: json.alternatives || []
      };
    } catch (error) {
      logger.error('Error parsing routine response:', error);
      throw error;
    }
  }

  private parseActivitySuggestions(response: string): ActivitySuggestion[] {
    try {
      const json = this.extractJSON(response);
      return Array.isArray(json) ? json : [];
    } catch (error) {
      logger.error('Error parsing activity suggestions:', error);
      return [];
    }
  }

  private parseBreakRecommendation(response: string): BreakRecommendation {
    try {
      const json = this.extractJSON(response);
      return {
        type: json.type || 'mental',
        activity: json.activity || 'Short rest',
        duration: json.duration || 10,
        reasoning: json.reasoning || 'Standard break'
      };
    } catch (error) {
      logger.error('Error parsing break recommendation:', error);
      throw error;
    }
  }

  private extractJSON(text: string): any {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]);
  }

  // ============ Fallback Methods (Rule-Based) ============

  private fallbackParseRequest(input: string): ParsedRoutineRequest {
    const lowerInput = input.toLowerCase();
    
    // Detect mode
    const mode = lowerInput.includes('manual') || lowerInput.includes('custom') 
      ? 'manual' 
      : 'automatic';
    
    // Detect priority
    let priorityFocus: 'critical' | 'high' | 'medium' | 'low' = 'medium';
    if (lowerInput.includes('urgent') || lowerInput.includes('critical')) {
      priorityFocus = 'critical';
    } else if (lowerInput.includes('important') || lowerInput.includes('exam')) {
      priorityFocus = 'high';
    }
    
    return { mode, priorityFocus };
  }

  private fallbackGenerateRoutine(context: RoutineContext): AIGeneratedRoutine {
    // Rule-based routine generation
    const profile = context.profile || {};
    const wakeTime = profile.wake_up_time || '07:00';
    const availableHours = profile.available_hours || 8;
    
    const segments = this.generateRuleBasedSegments(wakeTime, availableHours, profile);
    
    return {
      segments,
      reasoning: [{
        segmentId: 'all',
        decision: 'Generated using rule-based algorithm (AI unavailable)',
        factors: ['time_available', 'energy_patterns'],
        confidence: 0.6
      }],
      confidence: 0.6,
      alternatives: []
    };
  }

  private generateRuleBasedSegments(wakeTime: string, availableHours: number, profile: any): any[] {
    const segments = [];
    const [wakeHour, wakeMin] = wakeTime.split(':').map(Number);
    let currentMinutes = wakeHour * 60 + wakeMin;
    
    const segmentCount = Math.min(6, Math.max(3, Math.floor(availableHours / 1.5)));
    const segmentDuration = Math.floor((availableHours * 60) / segmentCount);
    
    for (let i = 0; i < segmentCount; i++) {
      const startTime = this.formatTime(currentMinutes);
      currentMinutes += segmentDuration;
      const endTime = this.formatTime(currentMinutes);
      
      segments.push({
        id: `segment_${i + 1}`,
        startTime,
        endTime,
        activity: `Study session ${i + 1}`,
        type: i % 2 === 0 ? 'deep_work' : 'study',
        priority: i < 2 ? 'high' : 'medium',
        duration: segmentDuration
      });
      
      currentMinutes += 15; // Break
    }
    
    return segments;
  }

  private fallbackSuggestActivities(timeSlot: TimeSlot, context: RoutineContext): ActivitySuggestion[] {
    const profile = context.profile || {};
    const goals = (profile.academic_goals || []).concat(profile.skill_goals || []);
    
    return goals.slice(0, 3).map((goal: string, index: number) => ({
      activity: goal,
      description: `Work on ${goal}`,
      duration: 60,
      priority: index === 0 ? 'high' : 'medium',
      reasoning: 'Based on your goals',
      confidence: 0.5
    }));
  }

  private fallbackRecommendBreak(timeOfDay: string): BreakRecommendation {
    const hour = parseInt(timeOfDay.split(':')[0]);
    
    if (hour < 12) {
      return {
        type: 'physical',
        activity: 'Short walk or stretch',
        duration: 10,
        reasoning: 'Morning energy boost'
      };
    } else if (hour < 18) {
      return {
        type: 'mental',
        activity: 'Rest eyes, hydrate',
        duration: 15,
        reasoning: 'Afternoon recharge'
      };
    } else {
      return {
        type: 'creative',
        activity: 'Light activity or hobby',
        duration: 20,
        reasoning: 'Evening wind-down'
      };
    }
  }

  private fallbackExplainDecision(activity: string, timeSlot: TimeSlot): string {
    return `${activity} is scheduled at ${timeSlot.startTime} based on available time and energy patterns.`;
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24;
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }

  // ============ Service Status ============

  isServiceAvailable(): boolean {
    return this.isAvailable;
  }

  getServiceStatus(): { available: boolean; model: string } {
    return {
      available: this.isAvailable,
      model: this.MODEL_NAME
    };
  }
}
