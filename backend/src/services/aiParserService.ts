import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedCommand, UserContext, UserState, ManualInputOptions, AIResponse } from '../types/ai';

export class AIParserService {
  private genAI?: GoogleGenerativeAI;
  private model?: any;
  private isAvailable: boolean = true;
  private requestCount: number = 0;
  private lastResetTime: Date = new Date();
  
  // Free tier constraints: More conservative limits to avoid quota exhaustion
  private readonly MAX_REQUESTS_PER_MINUTE = 5; // Reduced from 15
  private readonly MAX_REQUESTS_PER_DAY = 15; // Reduced from 1500 to be very conservative
  private dailyRequestCount: number = 0;

  // Failure tracking for graceful degradation
  private failureCount: number = 0;
  private lastFailureTime: Date = new Date();
  private readonly MAX_FAILURES = 5;
  private readonly FAILURE_RESET_TIME = 5 * 60 * 1000; // 5 minutes

  // Performance metrics
  private totalRequests: number = 0;
  private successfulRequests: number = 0;
  private averageResponseTime: number = 0;
  private lastResponseTimes: number[] = [];
  private readonly MAX_RESPONSE_TIME_SAMPLES = 10;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // In test environment, disable AI to avoid quota issues
    if (process.env.NODE_ENV === 'test') {
      console.log('AI service disabled in test environment to avoid quota issues');
      this.isAvailable = false;
      return;
    }
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not found. AI features will be disabled.');
      this.isAvailable = false;
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      
      // Primary model: gemini-2.5-flash-lite
      // - Optimized for cost-efficiency and high throughput
      // - Stable model as of January 2025
      // - Supports text, image, video, audio, PDF inputs
      // - 1M token context window, 65K output tokens
      // - Fallback models: gemini-2.5-flash, gemini-2.5-pro
      const modelName = 'gemini-2.5-flash-lite';
      this.model = this.genAI.getGenerativeModel({ model: modelName });
      console.log(`AI service initialized successfully with model: ${modelName}`);
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
      this.isAvailable = false;
    }
  }

  private checkRateLimit(): boolean {
    const now = new Date();
    const minutesSinceReset = (now.getTime() - this.lastResetTime.getTime()) / (1000 * 60);
    
    // Reset minute counter if more than a minute has passed
    if (minutesSinceReset >= 1) {
      this.requestCount = 0;
      this.lastResetTime = now;
    }

    // Reset daily counter at midnight
    const today = now.toDateString();
    const lastResetDay = this.lastResetTime.toDateString();
    if (today !== lastResetDay) {
      this.dailyRequestCount = 0;
    }

    // Check limits
    if (this.requestCount >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    if (this.dailyRequestCount >= this.MAX_REQUESTS_PER_DAY) {
      return false;
    }

    return true;
  }

  private incrementRequestCount(): void {
    this.requestCount++;
    this.dailyRequestCount++;
  }

  async parseNaturalLanguage(input: string, context: UserContext): Promise<AIResponse> {
    // Input validation and sanitization
    if (!input || typeof input !== 'string') {
      const fallbackOptions = await this.fallbackToManualInput('');
      return {
        success: false,
        error: 'Invalid input provided. Please use manual input options below.',
        fallbackOptions
      };
    }

    // Sanitize input
    const sanitizedInput = input.trim();
    if (sanitizedInput.length === 0) {
      const fallbackOptions = await this.fallbackToManualInput('');
      return {
        success: false,
        error: 'Empty input provided. Please use manual input options below.',
        fallbackOptions
      };
    }

    // Check for extremely long inputs (potential DoS)
    if (sanitizedInput.length > 2000) {
      const fallbackOptions = await this.fallbackToManualInput(sanitizedInput.substring(0, 100));
      return {
        success: false,
        error: 'Input too long. Please use shorter descriptions or manual input options below.',
        fallbackOptions
      };
    }

    // Always provide fallback options regardless of AI availability
    const fallbackOptions = await this.fallbackToManualInput(sanitizedInput);
    
    if (!this.isAvailable) {
      return {
        success: false,
        error: 'AI service is not available. Please use manual input options below.',
        fallbackOptions
      };
    }

    if (!this.checkRateLimit()) {
      return {
        success: false,
        error: 'AI service rate limit exceeded. Please try again later or use manual input options below.',
        fallbackOptions
      };
    }

    try {
      this.incrementRequestCount();
      this.totalRequests++;

      const startTime = Date.now();
      const prompt = this.buildPrompt(sanitizedInput, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const endTime = Date.now();

      // Track response time
      const responseTime = endTime - startTime;
      this.recordResponseTime(responseTime);

      const parsedCommand = this.parseAIResponse(text, sanitizedInput);
      
      // Record successful operation
      this.recordSuccess();
      this.successfulRequests++;
      
      console.log(`AI parsing successful in ${responseTime}ms, confidence: ${parsedCommand.confidence}`);
      
      // If confidence is too low, suggest fallback
      if (parsedCommand.confidence < 0.3 || parsedCommand.fallbackRequired) {
        return {
          success: false,
          error: 'AI parsing confidence too low. Please use manual input options below.',
          fallbackOptions
        };
      }
      
      return {
        success: true,
        data: parsedCommand
      };
    } catch (error) {
      console.error('AI parsing error:', error);
      
      // Record failure for degradation tracking
      this.recordFailure();
      
      // Provide specific error messages based on error type
      let errorMessage = 'Failed to process natural language input. Please use manual input options below.';
      
      if (error instanceof Error) {
        if (error.message.includes('overloaded') || error.message.includes('503')) {
          errorMessage = 'AI service is temporarily overloaded. Please try again later or use manual input options below.';
        } else if (error.message.includes('quota') || error.message.includes('429')) {
          errorMessage = 'AI service quota exceeded. Please use manual input options below.';
        } else if (error.message.includes('404') || error.message.includes('model') || error.message.includes('not found')) {
          // Model not found error - try to reinitialize with fallback model
          console.warn('Model not found, attempting to reinitialize with fallback model');
          await this.initializeFallbackModel();
          errorMessage = 'AI model updated. Please try again or use manual input options below.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'AI service authentication failed. Please use manual input options below.';
        } else if (error.message.includes('400')) {
          errorMessage = 'Invalid request format. Please use manual input options below.';
        } else if (error.message.includes('500')) {
          errorMessage = 'AI service internal error. Please use manual input options below.';
        }
      }
      
      return {
        success: false,
        error: errorMessage,
        fallbackOptions
      };
    }
  }

  private buildPrompt(input: string, context: UserContext): string {
    return `You are a discipline coach helping a student manage their daily routine. 
Parse the following user input into a structured command.

User Context:
- Target Identity: ${context.preferences.targetIdentity}
- Academic Goals: ${context.preferences.academicGoals.join(', ')}
- Current Time: ${context.currentTime.toISOString()}
- Recent Activities: ${context.recentActivities.join(', ')}

User Input: "${input}"

Respond with a JSON object in this exact format:
{
  "type": "log_activity" | "add_task" | "request_plan" | "ask_question",
  "parameters": {
    // relevant parameters based on the command type
  },
  "confidence": 0.0-1.0,
  "fallbackRequired": true/false
}

Command Types:
- log_activity: For logging completed activities (parameters: activity, duration, quality)
- add_task: For adding new tasks (parameters: task, priority, deadline)
- request_plan: For requesting routine or planning help (parameters: timeframe, focus_area)
- ask_question: For general questions (parameters: question, category)

Only respond with the JSON object, no additional text.`;
  }

  private parseAIResponse(aiResponse: string, originalInput: string): ParsedCommand {
    try {
      // Validate response is not empty
      if (!aiResponse || aiResponse.trim().length === 0) {
        throw new Error('Empty AI response');
      }

      // Clean the response to extract JSON
      const cleanResponse = aiResponse.trim();
      
      // Try to find JSON in the response
      let jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        // Try to find JSON with markdown code blocks
        jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch) {
          jsonMatch[0] = jsonMatch[1];
        }
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      let parsed;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch (jsonError) {
        // Try to fix common JSON issues
        let fixedJson = jsonMatch[0]
          .replace(/'/g, '"') // Replace single quotes with double quotes
          .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Add quotes to unquoted keys
          .replace(/:\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*([,}])/g, ':"$1"$2'); // Add quotes to unquoted string values
        
        try {
          parsed = JSON.parse(fixedJson);
        } catch (fixError) {
          throw new Error(`Invalid JSON format: ${jsonError instanceof Error ? jsonError.message : jsonError}`);
        }
      }
      
      // Validate the structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Parsed response is not an object');
      }

      if (!parsed.type || !['log_activity', 'add_task', 'request_plan', 'ask_question'].includes(parsed.type)) {
        throw new Error(`Invalid command type: ${parsed.type}`);
      }

      // Validate and sanitize parameters
      const parameters = parsed.parameters || {};
      if (typeof parameters !== 'object' || Array.isArray(parameters)) {
        throw new Error('Parameters must be an object');
      }

      // Sanitize parameters to prevent injection
      const sanitizedParameters: Record<string, any> = {};
      for (const [key, value] of Object.entries(parameters)) {
        if (typeof key === 'string' && key.length <= 100) {
          if (typeof value === 'string' && value.length <= 1000) {
            sanitizedParameters[key] = value.trim();
          } else if (typeof value === 'number' && isFinite(value)) {
            sanitizedParameters[key] = value;
          } else if (typeof value === 'boolean') {
            sanitizedParameters[key] = value;
          } else if (Array.isArray(value) && value.length <= 10) {
            sanitizedParameters[key] = value.filter(item => 
              typeof item === 'string' && item.length <= 100
            ).map(item => item.trim());
          }
        }
      }

      // Validate confidence
      let confidence = 0.5;
      if (typeof parsed.confidence === 'number' && isFinite(parsed.confidence)) {
        confidence = Math.max(0, Math.min(1, parsed.confidence));
      }

      // Validate fallbackRequired
      const fallbackRequired = Boolean(parsed.fallbackRequired);

      return {
        type: parsed.type,
        parameters: sanitizedParameters,
        confidence,
        fallbackRequired
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      console.error('Original AI response:', aiResponse);
      
      // Return a safe fallback command
      return {
        type: 'ask_question',
        parameters: { 
          question: originalInput.substring(0, 500), // Limit length
          category: 'general' 
        },
        confidence: 0.1,
        fallbackRequired: true
      };
    }
  }

  async generateResponse(command: ParsedCommand, userState: UserState): Promise<string> {
    // Always have a fallback response ready
    const fallbackResponse = this.generateFallbackResponse(command, userState);
    
    if (!this.isAvailable || !this.checkRateLimit()) {
      return fallbackResponse;
    }

    try {
      this.incrementRequestCount();

      const prompt = this.buildResponsePrompt(command, userState);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Validate response is reasonable (not empty, not too long)
      if (!text || text.trim().length === 0) {
        console.warn('AI returned empty response, using fallback');
        return fallbackResponse;
      }
      
      if (text.length > 500) {
        console.warn('AI response too long, using fallback');
        return fallbackResponse;
      }
      
      return text.trim();
    } catch (error) {
      console.error('AI response generation error:', error);
      return fallbackResponse;
    }
  }

  private buildResponsePrompt(command: ParsedCommand, userState: UserState): string {
    return `You are a calm, supportive discipline coach. Respond to the user's command with encouragement and guidance.

Command: ${JSON.stringify(command)}
User State: ${JSON.stringify(userState)}

Provide a brief, encouraging response (1-2 sentences) that:
1. Acknowledges their action
2. Reinforces their target identity
3. Provides gentle guidance if needed

Keep the tone supportive but not overly enthusiastic. Focus on discipline and systems over motivation.`;
  }

  // Fallback model initialization for when primary model fails
  private async initializeFallbackModel(): Promise<void> {
    if (!this.genAI) {
      return;
    }

    // Updated fallback models based on current availability (January 2025)
    const fallbackModels = [
      'gemini-2.5-flash',      // Alternative 2.5 model (confirmed working)
      'gemini-2.5-pro',        // More capable but slower model
      'gemini-3-flash-preview' // Latest preview model (if available)
    ];

    for (const modelName of fallbackModels) {
      try {
        console.log(`Attempting to initialize fallback model: ${modelName}`);
        this.model = this.genAI.getGenerativeModel({ model: modelName });
        
        // Test the model with a simple request
        const testResult = await this.model.generateContent('Test');
        await testResult.response;
        
        console.log(`Successfully initialized fallback model: ${modelName}`);
        this.isAvailable = true;
        return;
      } catch (error) {
        console.warn(`Fallback model ${modelName} failed:`, error instanceof Error ? error.message : error);
        continue;
      }
    }

    console.error('All fallback models failed, AI service disabled');
    this.isAvailable = false;
  }

  // Get current model information
  getCurrentModelInfo(): { 
    modelName: string; 
    isAvailable: boolean; 
    lastVerified: Date;
    capabilities: string[];
  } {
    return {
      modelName: 'gemini-2.5-flash-lite',
      isAvailable: this.isAvailable,
      lastVerified: new Date(),
      capabilities: [
        'Text input/output',
        'Image input',
        'Video input', 
        'Audio input',
        'PDF input',
        '1M token context window',
        '65K output tokens',
        'Function calling',
        'Structured outputs',
        'Thinking capability',
        'Search grounding',
        'Code execution'
      ]
    };
  }

  private generateFallbackResponse(command: ParsedCommand, userState: UserState): string {
    const responses = {
      log_activity: "Great work! Logging your activities helps build awareness of how you spend your time.",
      add_task: "Task added. Breaking down your goals into specific actions is a key habit of disciplined students.",
      request_plan: "I'll help you create a structured plan. Consistent planning is what separates successful students from the rest.",
      ask_question: "That's a thoughtful question. Seeking clarity shows you're taking ownership of your learning."
    };

    return responses[command.type] || "I understand. Let's keep building these disciplined habits together.";
  }

  async fallbackToManualInput(input: string): Promise<ManualInputOptions> {
    // Analyze the input to suggest appropriate manual actions
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('study') || lowerInput.includes('learn') || lowerInput.includes('read')) {
      return {
        suggestedActions: [
          { label: 'Log Study Session', action: 'log_activity', parameters: { activity: 'study' } },
          { label: 'Add Study Task', action: 'add_task', parameters: { category: 'academic' } }
        ],
        fallbackMessage: 'I detected you might want to log studying or add a study task.',
        inputFields: [
          { name: 'activity', type: 'text', label: 'What did you study?', required: true },
          { name: 'duration', type: 'number', label: 'Duration (minutes)', required: true },
          { name: 'quality', type: 'select', label: 'Focus Quality', options: ['high', 'medium', 'low'], required: false }
        ]
      };
    }

    if (lowerInput.includes('task') || lowerInput.includes('todo') || lowerInput.includes('homework')) {
      return {
        suggestedActions: [
          { label: 'Add New Task', action: 'add_task' },
          { label: 'Log Completed Task', action: 'log_activity', parameters: { activity: 'task completion' } }
        ],
        fallbackMessage: 'Would you like to add a new task or log a completed one?',
        inputFields: [
          { name: 'task', type: 'text', label: 'Task Description', required: true },
          { name: 'priority', type: 'select', label: 'Priority', options: ['high', 'medium', 'low'], required: false },
          { name: 'deadline', type: 'datetime', label: 'Deadline', required: false }
        ]
      };
    }

    if (lowerInput.includes('plan') || lowerInput.includes('schedule') || lowerInput.includes('routine')) {
      return {
        suggestedActions: [
          { label: 'Request Daily Plan', action: 'request_plan', parameters: { timeframe: 'today' } },
          { label: 'Request Weekly Plan', action: 'request_plan', parameters: { timeframe: 'week' } }
        ],
        fallbackMessage: 'I can help you create a structured plan for your day or week.',
        inputFields: [
          { name: 'timeframe', type: 'select', label: 'Planning Timeframe', options: ['today', 'tomorrow', 'week'], required: true },
          { name: 'focus_area', type: 'text', label: 'Main Focus Area', required: false }
        ]
      };
    }

    // Default fallback
    return {
      suggestedActions: [
        { label: 'Log Activity', action: 'log_activity' },
        { label: 'Add Task', action: 'add_task' },
        { label: 'Request Plan', action: 'request_plan' },
        { label: 'Ask Question', action: 'ask_question' }
      ],
      fallbackMessage: 'I couldn\'t understand your request. Please choose one of these actions:',
      inputFields: [
        { name: 'input', type: 'text', label: 'Please describe what you\'d like to do', required: true }
      ]
    };
  }

  // Health check method
  isServiceAvailable(): boolean {
    return this.isAvailable && this.checkRateLimit();
  }

  // Get current usage stats
  getUsageStats(): { requestsThisMinute: number; requestsToday: number; available: boolean } {
    return {
      requestsThisMinute: this.requestCount,
      requestsToday: this.dailyRequestCount,
      available: this.isServiceAvailable()
    };
  }

  private recordResponseTime(responseTime: number): void {
    this.lastResponseTimes.push(responseTime);
    if (this.lastResponseTimes.length > this.MAX_RESPONSE_TIME_SAMPLES) {
      this.lastResponseTimes.shift();
    }
    
    // Calculate average response time
    this.averageResponseTime = this.lastResponseTimes.reduce((sum, time) => sum + time, 0) / this.lastResponseTimes.length;
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();
    
    console.warn(`AI service failure recorded. Count: ${this.failureCount}/${this.MAX_FAILURES}`);
    
    if (this.failureCount >= this.MAX_FAILURES) {
      console.warn(`AI service temporarily disabled due to ${this.failureCount} consecutive failures`);
      this.isAvailable = false;
      
      // Re-enable after reset time
      setTimeout(() => {
        this.failureCount = 0;
        this.isAvailable = !!process.env.GEMINI_API_KEY;
        console.log('AI service re-enabled after failure recovery period');
      }, this.FAILURE_RESET_TIME);
    }
  }

  private recordSuccess(): void {
    // Reset failure count on successful operation
    if (this.failureCount > 0) {
      console.log(`AI service failure count reset after successful operation (was ${this.failureCount})`);
      this.failureCount = 0;
    }
  }

  // Enhanced service status with degradation info
  getDetailedStatus(): {
    available: boolean;
    degraded: boolean;
    failureCount: number;
    usage: { requestsThisMinute: number; requestsToday: number; available: boolean };
    performance: {
      totalRequests: number;
      successfulRequests: number;
      successRate: number;
      averageResponseTime: number;
    };
    lastFailure?: Date;
  } {
    const successRate = this.totalRequests > 0 ? (this.successfulRequests / this.totalRequests) * 100 : 0;
    
    return {
      available: this.isServiceAvailable(),
      degraded: this.failureCount > 0,
      failureCount: this.failureCount,
      usage: this.getUsageStats(),
      performance: {
        totalRequests: this.totalRequests,
        successfulRequests: this.successfulRequests,
        successRate: Math.round(successRate * 100) / 100,
        averageResponseTime: Math.round(this.averageResponseTime)
      },
      lastFailure: this.failureCount > 0 ? this.lastFailureTime : undefined
    };
  }
}

// Export singleton instance
export const aiParserService = new AIParserService();