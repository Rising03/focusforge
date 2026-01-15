import React, { useState } from 'react';
import { aiService, ParsedCommand } from '../services/aiService';

interface AIInputFieldProps {
  onCommandParsed: (command: ParsedCommand) => void;
  placeholder?: string;
  className?: string;
  compact?: boolean;
}

export const AIInputField: React.FC<AIInputFieldProps> = ({
  onCommandParsed,
  placeholder = "Type naturally... (e.g., 'studied math for 1 hour')",
  className = '',
  compact = false
}) => {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);

    try {
      const result = await aiService.parseInput(input.trim());
      
      if (result.success && result.data) {
        onCommandParsed(result.data);
        setInput('');
      } else {
        setError(result.error || 'Could not understand input');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Processing failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className={`flex items-center space-x-2 ${className}`}>
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
          {isProcessing ? '...' : 'Send'}
        </button>
        {error && (
          <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </form>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isProcessing}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm disabled:bg-gray-100"
        />
        
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">
            Press Enter to send, Shift+Enter for new line
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm"
          >
            {isProcessing ? 'Processing...' : 'Send'}
          </button>
        </div>
      </form>
      
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
};