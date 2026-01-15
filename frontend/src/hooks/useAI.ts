import { useState, useCallback, useEffect } from 'react';
import { aiService, ParsedCommand, UserContext, UserState, ManualInputOptions } from '../services/aiService';

interface UseAIOptions {
  context?: Partial<UserContext>;
  userState?: Partial<UserState>;
  onCommandParsed?: (command: ParsedCommand) => void;
  onResponse?: (response: string) => void;
  onError?: (error: string) => void;
}

interface UseAIReturn {
  parseInput: (input: string) => Promise<void>;
  isProcessing: boolean;
  isAvailable: boolean;
  error: string | null;
  lastCommand: ParsedCommand | null;
  lastResponse: string | null;
  fallbackOptions: ManualInputOptions | null;
  clearError: () => void;
  clearFallback: () => void;
  executeCommand: (command: ParsedCommand) => Promise<void>;
}

export const useAI = (options: UseAIOptions = {}): UseAIReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<ParsedCommand | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [fallbackOptions, setFallbackOptions] = useState<ManualInputOptions | null>(null);

  const { context, userState, onCommandParsed, onResponse, onError } = options;

  useEffect(() => {
    // Check AI availability on mount
    checkAvailability();
  }, []);

  const checkAvailability = useCallback(async () => {
    try {
      const available = await aiService.isAvailable();
      setIsAvailable(available);
    } catch {
      setIsAvailable(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearFallback = useCallback(() => {
    setFallbackOptions(null);
  }, []);

  const executeCommand = useCallback(async (command: ParsedCommand) => {
    try {
      setLastCommand(command);
      onCommandParsed?.(command);

      // Generate response
      const response = await aiService.generateResponse(command, userState);
      setLastResponse(response);
      onResponse?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute command';
      setError(errorMessage);
      onError?.(errorMessage);
    }
  }, [userState, onCommandParsed, onResponse, onError]);

  const parseInput = useCallback(async (input: string) => {
    if (!input.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setFallbackOptions(null);

    try {
      const result = await aiService.parseInput(input.trim(), context);
      
      if (result.success && result.data) {
        await executeCommand(result.data);
      } else {
        // AI parsing failed
        const errorMessage = result.error || 'Failed to understand input';
        setError(errorMessage);
        onError?.(errorMessage);

        // Show fallback options if available
        if (result.fallbackOptions) {
          setFallbackOptions(result.fallbackOptions);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      onError?.(errorMessage);

      // Try to get fallback options
      try {
        const fallback = await aiService.getFallbackOptions(input.trim());
        setFallbackOptions(fallback);
      } catch {
        // Even fallback failed
        console.error('Failed to get fallback options');
      }
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, context, executeCommand, onError]);

  return {
    parseInput,
    isProcessing,
    isAvailable,
    error,
    lastCommand,
    lastResponse,
    fallbackOptions,
    clearError,
    clearFallback,
    executeCommand
  };
};