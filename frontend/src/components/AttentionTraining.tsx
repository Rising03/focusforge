import React, { useState, useEffect } from 'react';
import { deepWorkService } from '../services/deepWorkService';
import {
  AttentionTrainingRequest,
  AttentionTrainingSession,
  AttentionMetrics
} from '../types/deepWork';

export const AttentionTraining: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AttentionMetrics | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [currentExercise, setCurrentExercise] = useState<AttentionTrainingSession | null>(null);
  const [trainingTimer, setTrainingTimer] = useState(0);
  const [selectedExercise, setSelectedExercise] = useState<{
    type: 'focus_breathing' | 'attention_restoration' | 'cognitive_control' | 'sustained_attention';
    duration: number;
    difficulty: number;
  }>({
    type: 'focus_breathing',
    duration: 5,
    difficulty: 1
  });

  useEffect(() => {
    loadAttentionMetrics();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTraining && trainingTimer > 0) {
      interval = setInterval(() => {
        setTrainingTimer(prev => {
          if (prev <= 1) {
            completeTraining();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTraining, trainingTimer]);

  const loadAttentionMetrics = async () => {
    try {
      const response = await deepWorkService.getAttentionMetrics();
      setMetrics(response.metrics || null);
    } catch (error) {
      console.error('Failed to load attention metrics:', error);
    }
  };

  const startTraining = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setIsTraining(true);
      setTrainingTimer(selectedExercise.duration * 60); // Convert to seconds
      
      // In a real implementation, this would start the actual exercise
      // For now, we'll just simulate the training session
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to start training');
      setIsTraining(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTraining = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const request: AttentionTrainingRequest = {
        exercise_type: selectedExercise.type,
        duration: selectedExercise.duration,
        difficulty_level: selectedExercise.difficulty
      };

      const response = await deepWorkService.createAttentionTrainingSession(request);
      setCurrentExercise(response.session);
      setIsTraining(false);
      setTrainingTimer(0);

      // Reload metrics to show updated progress
      await loadAttentionMetrics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to complete training');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTraining = () => {
    setIsTraining(false);
    setTrainingTimer(0);
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getExerciseInstructions = (type: string): string[] => {
    switch (type) {
      case 'focus_breathing':
        return [
          'Sit comfortably with your back straight',
          'Close your eyes or soften your gaze',
          'Focus on your natural breathing',
          'When your mind wanders, gently return to your breath',
          'Notice the sensation of air entering and leaving your nostrils'
        ];
      case 'attention_restoration':
        return [
          'Look at a natural scene (window, photo, or visualization)',
          'Let your attention rest softly on the scene',
          'Notice details without forcing focus',
          'Allow your mind to wander naturally',
          'Return to the scene when you notice your attention has drifted'
        ];
      case 'cognitive_control':
        return [
          'Focus on a specific object or point',
          'Maintain unwavering attention on this target',
          'Resist all distractions and mind-wandering',
          'When you notice your attention has moved, immediately return it',
          'Practice sustained, controlled focus'
        ];
      case 'sustained_attention':
        return [
          'Choose a simple, repetitive task (counting, listening)',
          'Maintain consistent attention throughout',
          'Notice when your focus begins to fade',
          'Gently strengthen your attention without strain',
          'Build endurance for longer focus periods'
        ];
      default:
        return ['Follow the exercise instructions'];
    }
  };

  const renderMetrics = () => {
    if (!metrics) {
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Get Started</h3>
          <p className="text-sm text-blue-700 mb-3">
            Complete your first attention training session to see your progress metrics.
          </p>
          <div className="text-xs text-blue-600">
            <p>• Start with 5-minute focus breathing exercises</p>
            <p>• Practice regularly for best results</p>
            <p>• Track your improvement over time</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Your Progress</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {metrics.current_attention_span.toFixed(1)}m
            </div>
            <div className="text-sm text-gray-600">Current Span</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${deepWorkService.getAttentionTrendColor(metrics.trend)}`}>
              {metrics.improvement_percentage >= 0 ? '+' : ''}{metrics.improvement_percentage.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Improvement</div>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Baseline:</span>
            <span className="font-medium">{metrics.baseline_attention_span}m</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Sessions Completed:</span>
            <span className="font-medium">{metrics.training_sessions_completed}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Consistency Score:</span>
            <span className="font-medium">{metrics.consistency_score.toFixed(0)}/100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Trend:</span>
            <span className={`font-medium ${deepWorkService.getAttentionTrendColor(metrics.trend)}`}>
              {deepWorkService.getAttentionTrendIcon(metrics.trend)} {metrics.trend}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderTrainingSession = () => {
    if (!isTraining) return null;

    const progress = ((selectedExercise.duration * 60 - trainingTimer) / (selectedExercise.duration * 60)) * 100;

    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium text-green-900 mb-2">
            {deepWorkService.getExerciseTypeLabel(selectedExercise.type)}
          </h3>
          <div className="text-3xl font-bold text-green-600 mb-2">
            {formatTime(trainingTimer)}
          </div>
          <div className="w-full bg-green-200 rounded-full h-2 mb-4">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        <div className="space-y-2 text-sm text-green-700 mb-6">
          {getExerciseInstructions(selectedExercise.type).map((instruction, index) => (
            <p key={index}>• {instruction}</p>
          ))}
        </div>

        <button
          onClick={stopTraining}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Stop Training
        </button>
      </div>
    );
  };

  const renderExerciseSelection = () => {
    if (isTraining) return null;

    return (
      <div className="space-y-4">
        <div>
          <label htmlFor="exercise_type" className="block text-sm font-medium text-gray-700 mb-1">
            Exercise Type
          </label>
          <select
            id="exercise_type"
            value={selectedExercise.type}
            onChange={(e) => setSelectedExercise(prev => ({ 
              ...prev, 
              type: e.target.value as 'focus_breathing' | 'attention_restoration' | 'cognitive_control' | 'sustained_attention'
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="focus_breathing">Focus Breathing - Gentle attention training</option>
            <option value="attention_restoration">Attention Restoration - Relaxed awareness</option>
            <option value="cognitive_control">Cognitive Control - Focused concentration</option>
            <option value="sustained_attention">Sustained Attention - Endurance building</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <select
              id="duration"
              value={selectedExercise.duration}
              onChange={(e) => setSelectedExercise(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={3}>3 minutes</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>

          <div>
            <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={selectedExercise.difficulty}
              onChange={(e) => setSelectedExercise(prev => ({ ...prev, difficulty: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={1}>1 - Beginner</option>
              <option value={2}>2 - Easy</option>
              <option value={3}>3 - Medium</option>
              <option value={4}>4 - Hard</option>
              <option value={5}>5 - Expert</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Exercise Instructions</h4>
          <div className="space-y-1 text-sm text-gray-700">
            {getExerciseInstructions(selectedExercise.type).map((instruction, index) => (
              <p key={index}>• {instruction}</p>
            ))}
          </div>
        </div>

        <button
          onClick={startTraining}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          {isLoading ? 'Starting...' : 'Start Training'}
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Attention Training</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {renderMetrics()}
          {renderTrainingSession()}
          {renderExerciseSelection()}
        </div>

        {currentExercise && !isTraining && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-900 mb-2">Session Completed!</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-700">Exercise:</span>
                <p className="font-medium text-green-900">
                  {deepWorkService.getExerciseTypeLabel(currentExercise.exercise_type)}
                </p>
              </div>
              <div>
                <span className="text-green-700">Performance:</span>
                <p className={`font-medium ${deepWorkService.getPerformanceLevel(currentExercise.performance_score).color}`}>
                  {currentExercise.performance_score.toFixed(0)}% - {deepWorkService.getPerformanceLevel(currentExercise.performance_score).level}
                </p>
              </div>
              <div>
                <span className="text-green-700">Attention Span:</span>
                <p className="font-medium text-green-900">
                  {currentExercise.attention_span_measured.toFixed(1)} minutes
                </p>
              </div>
              <div>
                <span className="text-green-700">Improvement:</span>
                <p className="font-medium text-green-900">
                  {currentExercise.improvement_from_baseline >= 0 ? '+' : ''}{currentExercise.improvement_from_baseline.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};