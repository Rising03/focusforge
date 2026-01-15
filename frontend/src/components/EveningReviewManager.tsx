import React, { useState, useEffect } from 'react';
import EveningReview from './EveningReview';
import EveningReviewHistory from './EveningReviewHistory';
import { EveningReview as EveningReviewType } from '../types/eveningReview';
import eveningReviewService from '../services/eveningReviewService';

interface EveningReviewManagerProps {
  initialView?: 'create' | 'history';
  onClose?: () => void;
}

const EveningReviewManager: React.FC<EveningReviewManagerProps> = ({ 
  initialView = 'create', 
  onClose 
}) => {
  const [currentView, setCurrentView] = useState<'create' | 'history' | 'view'>(initialView);
  const [selectedReview, setSelectedReview] = useState<EveningReviewType | null>(null);
  const [todayReview, setTodayReview] = useState<EveningReviewType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkTodayReview();
  }, []);

  const checkTodayReview = async () => {
    try {
      setIsLoading(true);
      const review = await eveningReviewService.getTodayReview();
      setTodayReview(review);
      
      // If there's already a review for today, show history by default
      if (review && initialView === 'create') {
        setCurrentView('history');
      }
    } catch (error) {
      // No review for today is expected, continue with create view
      console.log('No review for today yet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewComplete = (review: EveningReviewType) => {
    setTodayReview(review);
    setCurrentView('history');
  };

  const handleEditReview = (review: EveningReviewType) => {
    setSelectedReview(review);
    setCurrentView('view');
  };

  const handleBackToHistory = () => {
    setSelectedReview(null);
    setCurrentView('history');
  };

  const handleCreateNew = () => {
    setSelectedReview(null);
    setCurrentView('create');
  };

  const renderNavigation = () => (
    <div className="mb-6 border-b border-gray-200">
      <nav className="flex space-x-8">
        <button
          onClick={() => setCurrentView('create')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            currentView === 'create'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          {todayReview ? 'Update Today' : 'Create Review'}
        </button>
        <button
          onClick={() => setCurrentView('history')}
          className={`py-2 px-1 border-b-2 font-medium text-sm ${
            currentView === 'history'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          History & Analytics
        </button>
      </nav>
    </div>
  );

  const renderTodayStatus = () => {
    if (isLoading) return null;

    return (
      <div className="mb-6">
        {todayReview ? (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-green-800">
                  Today's Review Complete
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  Completed at {new Date(todayReview.created_at).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
              >
                Update
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-blue-800">
                  Evening Review Pending
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Take a few minutes to reflect on your day
                </p>
              </div>
              <button
                onClick={handleCreateNew}
                className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
              >
                Start Review
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading evening review...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Evening Review</h1>
            <p className="text-gray-600 mt-1">
              Reflect on your day and plan for tomorrow
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Today's Status */}
      {renderTodayStatus()}

      {/* Navigation */}
      {currentView !== 'view' && renderNavigation()}

      {/* Content */}
      {currentView === 'create' && (
        <EveningReview
          onReviewComplete={handleReviewComplete}
          onClose={onClose}
        />
      )}

      {currentView === 'history' && (
        <EveningReviewHistory
          onEditReview={handleEditReview}
        />
      )}

      {currentView === 'view' && selectedReview && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-gray-900">
              Review for {new Date(selectedReview.date).toLocaleDateString()}
            </h2>
            <button
              onClick={handleBackToHistory}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Back to History
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Accomplished</h3>
                <ul className="space-y-2">
                  {selectedReview.accomplished.map((task, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-gray-700">{task}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedReview.missed.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Missed</h3>
                  <ul className="space-y-2">
                    {selectedReview.missed.map((task, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-orange-600 mt-1">⚠</span>
                        <span className="text-gray-700">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {selectedReview.reasons.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reasons for Missed Tasks</h3>
                <ul className="space-y-1">
                  {selectedReview.reasons.map((reason, index) => (
                    <li key={index} className="text-gray-700">• {reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Mood & Energy</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mood:</span>
                    <span className="font-medium">{selectedReview.mood}/10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Energy:</span>
                    <span className="font-medium">{selectedReview.energy_level}/10</span>
                  </div>
                </div>
              </div>

              {selectedReview.tomorrow_tasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Tomorrow's Tasks</h3>
                  <ul className="space-y-1">
                    {selectedReview.tomorrow_tasks.map((task, index) => (
                      <li key={index} className="text-gray-700">→ {task}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {selectedReview.insights && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Insights</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.insights}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EveningReviewManager;