import React, { useState } from 'react';
import { eveningReviewService, CreateEveningReviewRequest, EveningReview as EveningReviewType } from '../services/eveningReviewService';

interface ReviewFormData {
  accomplished: string[];
  missed: string[];
  reasons: string[];
  tomorrow_tasks: string[];
  mood: number;
  energy_level: number;
  insights: string;
}

interface EveningReviewProps {
  onReviewComplete?: (review: EveningReviewType) => void;
  onClose?: () => void;
}

export const EveningReview: React.FC<EveningReviewProps> = ({ onReviewComplete, onClose }) => {
  const [formData, setFormData] = useState<ReviewFormData>({
    accomplished: [],
    missed: [],
    reasons: [],
    tomorrow_tasks: [],
    mood: 5,
    energy_level: 5,
    insights: ''
  });

  const [currentInput, setCurrentInput] = useState({
    accomplished: '',
    missed: '',
    reason: '',
    tomorrow_task: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [existingReview, setExistingReview] = useState<EveningReviewType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if review already exists for today
  React.useEffect(() => {
    const checkExistingReview = async () => {
      try {
        const review = await eveningReviewService.getTodayReview();
        if (review) {
          setExistingReview(review);
        }
      } catch (err) {
        // No review exists, which is fine
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingReview();
  }, []);

  const addItem = (field: keyof Pick<ReviewFormData, 'accomplished' | 'missed' | 'reasons' | 'tomorrow_tasks'>, value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
      
      // Clear input
      if (field === 'accomplished') setCurrentInput(prev => ({ ...prev, accomplished: '' }));
      if (field === 'missed') setCurrentInput(prev => ({ ...prev, missed: '' }));
      if (field === 'reasons') setCurrentInput(prev => ({ ...prev, reason: '' }));
      if (field === 'tomorrow_tasks') setCurrentInput(prev => ({ ...prev, tomorrow_task: '' }));
    }
  };

  const removeItem = (field: keyof Pick<ReviewFormData, 'accomplished' | 'missed' | 'reasons' | 'tomorrow_tasks'>, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const request: CreateEveningReviewRequest = {
        date: new Date().toISOString().split('T')[0],
        accomplished: formData.accomplished,
        missed: formData.missed,
        reasons: formData.reasons,
        tomorrow_tasks: formData.tomorrow_tasks,
        mood: formData.mood,
        energy_level: formData.energy_level,
        insights: formData.insights
      };

      const response = await eveningReviewService.createEveningReview(request);
      
      if (onReviewComplete) {
        onReviewComplete(response.review);
      }
      
      // Show success message
      alert('Evening review saved successfully! 🎉');
      
      // Refresh to show the existing review
      setExistingReview(response.review);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save evening review';
      
      // Check if it's a duplicate error
      if (errorMessage.includes('already exists')) {
        setError('You have already completed your evening review for today. You can view it below.');
        // Try to fetch the existing review
        try {
          const review = await eveningReviewService.getTodayReview();
          if (review) {
            setExistingReview(review);
          }
        } catch (fetchErr) {
          // Ignore fetch error
        }
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If loading, show spinner
  if (isLoading) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  // If review already exists, show it
  if (existingReview) {
    return (
      <div className="border border-white/5 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-white mb-2">🌙 Today's Evening Review</h2>
          <p className="text-slate-400">You've already completed your review for today!</p>
        </div>

        <div className="space-y-6">
          {/* Accomplished */}
          {existingReview.accomplished.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">✅ Accomplished</h3>
              <ul className="space-y-2">
                {existingReview.accomplished.map((item, index) => (
                  <li key={index} className="flex items-start border border-white/5 px-3 py-2 rounded-md">
                    <span className="text-white">✓ {item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missed */}
          {existingReview.missed.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">⏭️ Missed</h3>
              <ul className="space-y-2">
                {existingReview.missed.map((item, index) => (
                  <li key={index} className="flex items-start border border-white/5 px-3 py-2 rounded-md">
                    <span className="text-slate-400">• {item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reasons */}
          {existingReview.reasons.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💭 Reasons</h3>
              <ul className="space-y-2">
                {existingReview.reasons.map((item, index) => (
                  <li key={index} className="border border-white/5 px-3 py-2 rounded-md text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tomorrow's Tasks */}
          {existingReview.tomorrow_tasks.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📅 Tomorrow's Plan</h3>
              <ul className="space-y-2">
                {existingReview.tomorrow_tasks.map((item, index) => (
                  <li key={index} className="flex items-start border border-white/5 px-3 py-2 rounded-md">
                    <span className="text-white">→ {item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mood & Energy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-white/5 p-4 rounded-md">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Mood</h3>
              <div className="text-2xl font-bold text-white">{existingReview.mood}/10</div>
            </div>
            <div className="border border-white/5 p-4 rounded-md">
              <h3 className="text-sm font-semibold text-slate-400 mb-2">Energy</h3>
              <div className="text-2xl font-bold text-white">{existingReview.energy_level}/10</div>
            </div>
          </div>

          {/* Insights */}
          {existingReview.insights && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💡 Insights</h3>
              <div className="border border-white/10 px-4 py-3 rounded-md">
                <p className="text-slate-400">{existingReview.insights}</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-white/5">
            <p className="text-sm text-slate-500 text-center">
              Review completed at {new Date(existingReview.created_at).toLocaleTimeString()}
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-white/10 text-white rounded-md hover:border-white/20"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-white/5 rounded-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2">🌙 Evening Review</h2>
        <p className="text-slate-400">Take a few minutes to reflect on your day</p>
        
        {/* Progress indicator */}
        <div className="mt-4 flex items-center space-x-4">
          <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-white text-slate-950' : 'border border-white/10'}`}>
              1
            </div>
            <span className="text-sm font-medium hidden sm:inline">Tasks</span>
          </div>
          <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-white' : 'bg-white/10'}`}></div>
          <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-white text-slate-950' : 'border border-white/10'}`}>
              2
            </div>
            <span className="text-sm font-medium hidden sm:inline">Reflection</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-white/10 rounded-md">
          <p className="text-slate-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Accomplished */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">✅ What did you accomplish?</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentInput.accomplished}
                    onChange={(e) => setCurrentInput(prev => ({ ...prev, accomplished: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('accomplished', currentInput.accomplished))}
                    placeholder="Add an accomplishment..."
                    className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => addItem('accomplished', currentInput.accomplished)}
                    className="px-4 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                
                {formData.accomplished.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border border-white/5 px-3 py-2 rounded-lg">
                    <span className="text-green-400">✓ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('accomplished', index)}
                      className="text-red-400 hover:text-red-300 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Missed */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">⚠️ What tasks did you miss?</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentInput.missed}
                    onChange={(e) => setCurrentInput(prev => ({ ...prev, missed: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('missed', currentInput.missed))}
                    placeholder="Add a missed task..."
                    className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => addItem('missed', currentInput.missed)}
                    className="px-4 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                
                {formData.missed.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border border-white/5 px-3 py-2 rounded-lg">
                    <span className="text-orange-400">⚠ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('missed', index)}
                      className="text-red-400 hover:text-red-300 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reasons */}
            {formData.missed.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">🤔 Why did you miss these?</h3>
                <div className="space-y-2">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={currentInput.reason}
                      onChange={(e) => setCurrentInput(prev => ({ ...prev, reason: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('reasons', currentInput.reason))}
                      placeholder="Add a reason..."
                      className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => addItem('reasons', currentInput.reason)}
                      className="px-4 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                    >
                      Add
                    </button>
                  </div>
                  
                  {formData.reasons.map((item, index) => (
                    <div key={index} className="flex items-center justify-between border border-white/5 px-3 py-2 rounded-lg">
                      <span className="text-slate-300">• {item}</span>
                      <button
                        type="button"
                        onClick={() => removeItem('reasons', index)}
                        className="text-red-400 hover:text-red-300 font-bold text-xl"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Mood */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">😊 How was your mood?</h3>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.mood}
                  onChange={(e) => setFormData(prev => ({ ...prev, mood: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 (Low)</span>
                  <span className="font-semibold text-lg text-white">{formData.mood}/10</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>
            </div>

            {/* Energy */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">⚡ How was your energy?</h3>
              <div className="space-y-3">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.energy_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, energy_level: parseInt(e.target.value) }))}
                  className="w-full h-2 bg-white/5 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>1 (Exhausted)</span>
                  <span className="font-semibold text-lg text-white">{formData.energy_level}/10</span>
                  <span>10 (Energized)</span>
                </div>
              </div>
            </div>

            {/* Tomorrow */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">📅 Tomorrow's priorities</h3>
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={currentInput.tomorrow_task}
                    onChange={(e) => setCurrentInput(prev => ({ ...prev, tomorrow_task: e.target.value }))}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('tomorrow_tasks', currentInput.tomorrow_task))}
                    placeholder="Add a task for tomorrow..."
                    className="flex-1 px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => addItem('tomorrow_tasks', currentInput.tomorrow_task)}
                    className="px-4 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>
                
                {formData.tomorrow_tasks.map((item, index) => (
                  <div key={index} className="flex items-center justify-between border border-white/5 px-3 py-2 rounded-lg">
                    <span className="text-purple-400">→ {item}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('tomorrow_tasks', index)}
                      className="text-red-400 hover:text-red-300 font-bold text-xl"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">💭 Insights & Reflections</h3>
              <textarea
                value={formData.insights}
                onChange={(e) => setFormData(prev => ({ ...prev, insights: e.target.value }))}
                placeholder="What did you learn? Any patterns you noticed?"
                rows={4}
                className="w-full px-3 py-2 bg-transparent border border-white/10 rounded-lg text-white focus:outline-none focus:border-white/20 placeholder-slate-500"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:border-white/20 transition-colors font-medium"
              >
                Previous
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/10 text-white rounded-lg hover:border-white/20 transition-colors font-medium"
              >
                Cancel
              </button>
            )}
          </div>

          <div>
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-white text-slate-950 rounded-lg hover:bg-slate-100 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Saving...' : 'Complete Review'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default EveningReview;
