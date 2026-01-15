import React, { useState, useRef, useEffect } from 'react';
import { aiService, ParsedCommand, ManualInputOptions, UserContext, UserState } from '../services/aiService';

interface NaturalLanguageInputProps {
  onCommandParsed?: (command: ParsedCommand) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  context?: Partial<UserContext>;
  userState?: Partial<UserState>;
  className?: string;
  showFallbackOptions?: boolean;
}

export const NaturalLanguageInput: React.FC<NaturalLanguageInputProps> = ({
  onCommandParsed,
  onResponse,
  onError,
  placeholder = "Tell me what you'd like to do... (e.g., 'studied math for 1 hour', 'add homework task')",
  context,
  userState,
  className = '',
  showFallbackOptions = true
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [fallbackOptions, setFallbackOptions] = useState<ManualInputOptions | null>(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Check AI availability on mount
    checkAIAvailability();
  }, []);

  const checkAIAvailability = async () => {
    try {
      const available = await aiService.isAvailable();
      setAiAvailable(available);
    } catch {
      setAiAvailable(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setFallbackOptions(null);

    try {
      const result = await aiService.parseInput(input.trim(), context);
      
      if (result.success && result.data) {
        // Successfully parsed
        onCommandParsed?.(result.data);
        
        // Generate AI response
        try {
          const response = await aiService.generateResponse(result.data, userState);
          onResponse?.(response);
        } catch (responseError) {
          console.warn('Failed to generate AI response:', responseError);
          onResponse?.("Command understood. Let's keep building these disciplined habits together.");
        }
        
        setInput('');
      } else {
        // AI parsing failed, show fallback options
        if (result.fallbackOptions && showFallbackOptions) {
          setFallbackOptions(result.fallbackOptions);
        }
        onError?.(result.error || 'Failed to understand input');
      }
    } catch (error) {
      console.error('Natural language processing error:', error);
      onError?.(error instanceof Error ? error.message : 'Processing failed');
      
      // Try to get fallback options
      if (showFallbackOptions) {
        try {
          const fallback = await aiService.getFallbackOptions(input.trim());
          setFallbackOptions(fallback);
        } catch {
          // Even fallback failed, show manual input
          setShowManualInput(true);
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFallbackAction = (action: string, parameters?: Record<string, any>) => {
    const command: ParsedCommand = {
      type: action as ParsedCommand['type'],
      parameters: parameters || {},
      confidence: 0.8,
      fallbackRequired: false
    };

    onCommandParsed?.(command);
    onResponse?.(`Action selected: ${action}. Let's keep building these disciplined habits together.`);
    
    setFallbackOptions(null);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={`natural-language-input ${className}`}>
      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* AI Status Indicator */}
          <div className="absolute top-2 right-2 flex items-center space-x-2">
            {!aiAvailable && (
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                AI Offline
              </span>
            )}
            {isProcessing && (
              <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {aiAvailable ? (
              <>Press Enter to send, Shift+Enter for new line</>
            ) : (
              <>AI features unavailable - manual input available</>
            )}
          </div>
          
          <div className="flex space-x-2">
            {showFallbackOptions && (
              <button
                type="button"
                onClick={() => setShowManualInput(!showManualInput)}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Manual Input
              </button>
            )}
            
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isProcessing ? 'Processing...' : 'Send'}
            </button>
          </div>
        </div>
      </form>

      {/* Fallback Options */}
      {fallbackOptions && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800 mb-3">{fallbackOptions.fallbackMessage}</p>
          
          <div className="grid grid-cols-2 gap-2 mb-3">
            {fallbackOptions.suggestedActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleFallbackAction(action.action, action.parameters)}
                className="px-3 py-2 text-sm bg-white border border-amber-300 rounded hover:bg-amber-50 text-amber-800"
              >
                {action.label}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setFallbackOptions(null)}
            className="text-xs text-amber-600 hover:text-amber-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Manual Input Form */}
      {showManualInput && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Manual Input</h4>
          
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Action Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                <option value="log_activity">Log Activity</option>
                <option value="add_task">Add Task</option>
                <option value="request_plan">Request Plan</option>
                <option value="ask_question">Ask Question</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="Enter details..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowManualInput(false)}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Handle manual input submission
                  setShowManualInput(false);
                }}
                className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};