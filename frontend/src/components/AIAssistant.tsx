import React, { useState } from 'react';
import { useAI } from '../hooks/useAI';
import { ParsedCommand, UserContext, UserState } from '../services/aiService';
import { AIProcessingFeedback } from './AIProcessingFeedback';

interface AIAssistantProps {
  onCommandParsed?: (command: ParsedCommand) => void;
  onActivityLogged?: (activity: string, duration: number, quality?: string) => void;
  onTaskAdded?: (task: string, priority?: string, deadline?: Date) => void;
  onPlanRequested?: (timeframe: string, focusArea?: string) => void;
  onQuestionAsked?: (question: string, category?: string) => void;
  context?: Partial<UserContext>;
  userState?: Partial<UserState>;
  className?: string;
  placeholder?: string;
  compact?: boolean;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
  onCommandParsed,
  onActivityLogged,
  onTaskAdded,
  onPlanRequested,
  onQuestionAsked,
  context,
  userState,
  className = '',
  placeholder = "Tell me what you'd like to do... (e.g., 'studied math for 1 hour', 'add homework task')",
  compact = false
}) => {
  const [input, setInput] = useState('');
  const [showResponse, setShowResponse] = useState(false);

  const handleCommandParsed = (command: ParsedCommand) => {
    onCommandParsed?.(command);

    // Route to specific handlers based on command type
    switch (command.type) {
      case 'log_activity':
        onActivityLogged?.(
          command.parameters.activity || 'Unknown activity',
          command.parameters.duration || 0,
          command.parameters.quality
        );
        break;
      
      case 'add_task':
        onTaskAdded?.(
          command.parameters.task || 'New task',
          command.parameters.priority,
          command.parameters.deadline ? new Date(command.parameters.deadline) : undefined
        );
        break;
      
      case 'request_plan':
        onPlanRequested?.(
          command.parameters.timeframe || 'today',
          command.parameters.focus_area
        );
        break;
      
      case 'ask_question':
        onQuestionAsked?.(
          command.parameters.question || input,
          command.parameters.category || 'general'
        );
        break;
    }
  };

  const handleResponse = (response: string) => {
    setShowResponse(true);
    // Auto-hide response after 5 seconds
    setTimeout(() => setShowResponse(false), 5000);
  };

  const {
    parseInput,
    isProcessing,
    isAvailable,
    error,
    lastResponse,
    fallbackOptions,
    clearError,
    clearFallback,
    executeCommand
  } = useAI({
    context,
    userState,
    onCommandParsed: handleCommandParsed,
    onResponse: handleResponse
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await parseInput(input);
    setInput('');
  };

  const handleFallbackAction = (action: string, parameters?: Record<string, any>) => {
    const command: ParsedCommand = {
      type: action as ParsedCommand['type'],
      parameters: parameters || {},
      confidence: 0.8,
      fallbackRequired: false
    };

    executeCommand(command);
    clearFallback();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (compact) {
    return (
      <div className={`ai-assistant-compact ${className}`}>
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {isProcessing ? '...' : '🤖'}
          </button>
        </form>

        {/* Response Toast */}
        {showResponse && lastResponse && (
          <div className="absolute top-full left-0 mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg shadow-lg z-10 max-w-sm">
            <p className="text-sm text-blue-800">{lastResponse}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`ai-assistant ${className}`}>
      {/* AI Status */}
      <div className="mb-3">
        <AIProcessingFeedback />
      </div>

      {/* Main Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isProcessing}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500 disabled:bg-gray-100"
          />
          
          {isProcessing && (
            <div className="absolute top-3 right-3">
              <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            {isAvailable ? (
              <>Press Enter to send, Shift+Enter for new line</>
            ) : (
              <>AI features unavailable - manual alternatives provided</>
            )}
          </div>
          
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex justify-between items-start">
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* AI Response */}
      {lastResponse && showResponse && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">{lastResponse}</p>
        </div>
      )}

      {/* Fallback Options */}
      {fallbackOptions && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex justify-between items-start mb-3">
            <p className="text-sm text-amber-800">{fallbackOptions.fallbackMessage}</p>
            <button
              onClick={clearFallback}
              className="text-amber-600 hover:text-amber-800 text-xs"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
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
        </div>
      )}
    </div>
  );
};