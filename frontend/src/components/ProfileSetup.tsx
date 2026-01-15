import React, { useState } from 'react';
import { ProfileFormData } from '../types/profile';
import { profileService } from '../services/profileService';

interface ProfileSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const ProfileSetup: React.FC<ProfileSetupProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    target_identity: '',
    academic_goals: [],
    skill_goals: [],
    wake_up_time: '07:00',
    sleep_time: '23:00',
    available_hours: 8,
    energy_pattern: []
  });

  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([]);
  const [tempGoal, setTempGoal] = useState('');
  const [tempSkill, setTempSkill] = useState('');
  const [showCustomGoal, setShowCustomGoal] = useState(false);
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [showCustomIdentity, setShowCustomIdentity] = useState(false);
  const [customIdentityInput, setCustomIdentityInput] = useState('');

  // Predefined options
  const identityOptions = [
    { icon: '🎓', label: 'Disciplined Student', value: 'Disciplined Student' },
    { icon: '📚', label: 'Focused Learner', value: 'Focused Learner' },
    { icon: '🔬', label: 'Productive Researcher', value: 'Productive Researcher' },
    { icon: '💡', label: 'Creative Thinker', value: 'Creative Thinker' },
    { icon: '🎯', label: 'Goal-Oriented Achiever', value: 'Goal-Oriented Achiever' },
    { icon: '⚡', label: 'High Performer', value: 'High Performer' },
    { icon: '🧠', label: 'Lifelong Learner', value: 'Lifelong Learner' },
    { icon: '🚀', label: 'Ambitious Professional', value: 'Ambitious Professional' },
    { icon: '💪', label: 'Consistent Practitioner', value: 'Consistent Practitioner' },
    { icon: '🌟', label: 'Excellence Seeker', value: 'Excellence Seeker' },
    { icon: '📖', label: 'Knowledge Builder', value: 'Knowledge Builder' },
    { icon: '🎨', label: 'Skilled Craftsperson', value: 'Skilled Craftsperson' },
  ];

  const skillOptions = [
    { icon: '💻', label: 'Programming', value: 'Programming' },
    { icon: '📊', label: 'Data Science', value: 'Data Science' },
    { icon: '🎨', label: 'Design', value: 'Design' },
    { icon: '📝', label: 'Writing', value: 'Writing' },
    { icon: '🗣️', label: 'Languages', value: 'Languages' },
    { icon: '🎵', label: 'Music', value: 'Music' },
    { icon: '🏃', label: 'Fitness', value: 'Fitness' },
    { icon: '📚', label: 'Academic Study', value: 'Academic Study' },
  ];

  const goalOptions = [
    { icon: '🎓', label: 'Pass Exams', value: 'Pass Exams' },
    { icon: '💼', label: 'Get Internship', value: 'Get Internship' },
    { icon: '🚀', label: 'Build Project', value: 'Build Project' },
    { icon: '📈', label: 'Improve GPA', value: 'Improve GPA' },
    { icon: '🏆', label: 'Win Competition', value: 'Win Competition' },
    { icon: '💪', label: 'Stay Healthy', value: 'Stay Healthy' },
    { icon: '🧠', label: 'Learn New Skill', value: 'Learn New Skill' },
    { icon: '📖', label: 'Complete Course', value: 'Complete Course' },
  ];

  const totalSteps = 4;

  const handleInputChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const addIdentity = (identity?: string) => {
    const identityToAdd = identity || customIdentityInput.trim();
    if (identityToAdd && !selectedIdentities.includes(identityToAdd)) {
      const newIdentities = [...selectedIdentities, identityToAdd];
      setSelectedIdentities(newIdentities);
      // Update formData with combined identities
      handleInputChange('target_identity', newIdentities.join(' + '));
      setCustomIdentityInput('');
      setShowCustomIdentity(false);
    }
  };

  const removeIdentity = (identity: string) => {
    const newIdentities = selectedIdentities.filter(i => i !== identity);
    setSelectedIdentities(newIdentities);
    handleInputChange('target_identity', newIdentities.join(' + '));
  };

  const toggleIdentity = (identity: string) => {
    if (selectedIdentities.includes(identity)) {
      removeIdentity(identity);
    } else {
      addIdentity(identity);
    }
  };

  const addGoal = (goal?: string) => {
    const goalToAdd = goal || tempGoal.trim();
    if (goalToAdd && !formData.academic_goals.includes(goalToAdd)) {
      handleInputChange('academic_goals', [...formData.academic_goals, goalToAdd]);
      setTempGoal('');
      setShowCustomGoal(false);
    }
  };

  const removeGoal = (goal: string) => {
    handleInputChange('academic_goals', formData.academic_goals.filter(g => g !== goal));
  };

  const addSkill = (skill?: string) => {
    const skillToAdd = skill || tempSkill.trim();
    if (skillToAdd && !formData.skill_goals.includes(skillToAdd)) {
      handleInputChange('skill_goals', [...formData.skill_goals, skillToAdd]);
      setTempSkill('');
      setShowCustomSkill(false);
    }
  };

  const removeSkill = (skill: string) => {
    handleInputChange('skill_goals', formData.skill_goals.filter(s => s !== skill));
  };

  const addEnergyLevel = (time: string, level: 'low' | 'medium' | 'high') => {
    const existingIndex = formData.energy_pattern.findIndex(ep => ep.time === time);
    const newPattern = [...formData.energy_pattern];
    
    if (existingIndex >= 0) {
      newPattern[existingIndex] = { time, level };
    } else {
      newPattern.push({ time, level });
    }
    
    handleInputChange('energy_pattern', newPattern.sort((a, b) => a.time.localeCompare(b.time)));
  };

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 1:
        return selectedIdentities.length > 0; // At least one identity selected
      case 2:
        return formData.academic_goals.length > 0 || formData.skill_goals.length > 0;
      case 3:
        return true; // Schedule is optional but has defaults
      case 4:
        return true; // Energy pattern is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateCurrentStep() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setError(null);

    try {
      await profileService.createProfile(formData);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Define Your Target Identities
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Who do you want to become? Select one or more identities that resonate with you.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Choose Your Target Identities (Select Multiple)
        </label>
        
        {/* Identity option buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {identityOptions.map((option) => {
            const isSelected = selectedIdentities.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => toggleIdentity(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-purple-600 dark:bg-purple-500 text-white shadow-md ring-2 ring-purple-300 dark:ring-purple-400'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
          
          {/* Add Custom button */}
          <button
            type="button"
            onClick={() => setShowCustomIdentity(!showCustomIdentity)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              showCustomIdentity
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30'
            }`}
          >
            ✏️ Custom
          </button>
        </div>

        {/* Custom identity input */}
        {showCustomIdentity && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customIdentityInput}
              onChange={(e) => setCustomIdentityInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addIdentity()}
              placeholder="Enter custom identity"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => addIdentity()}
              className="px-4 py-2 bg-purple-600 dark:bg-purple-500 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {/* Selected identities display */}
        {selectedIdentities.length > 0 && (
          <div className="mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Your Target Identities:</p>
            <div className="flex flex-wrap gap-2">
              {selectedIdentities.map((identity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white dark:bg-white/10 text-purple-800 dark:text-purple-300 shadow-sm"
                >
                  {identity}
                  <button
                    type="button"
                    onClick={() => removeIdentity(identity)}
                    className="ml-2 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Combined: {selectedIdentities.join(' + ')}
            </p>
          </div>
        )}

        {selectedIdentities.length === 0 && (
          <p className="text-sm text-gray-500 text-center mt-3">
            Select at least one identity to continue
          </p>
        )}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Set Your Goals
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Select your goals or add custom ones
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Academic Goals
        </label>
        
        {/* Goal option buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {goalOptions.map((option) => {
            const isSelected = formData.academic_goals.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => isSelected ? removeGoal(option.value) : addGoal(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
          
          {/* Add Custom button */}
          <button
            type="button"
            onClick={() => setShowCustomGoal(!showCustomGoal)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 transition-colors"
          >
            ➕ Add Custom
          </button>
        </div>

        {/* Custom goal input */}
        {showCustomGoal && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tempGoal}
              onChange={(e) => setTempGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addGoal()}
              placeholder="Enter custom goal"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => addGoal()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {/* Selected goals */}
        {formData.academic_goals.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            {formData.academic_goals.map((goal, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white dark:bg-white/10 text-blue-800 dark:text-blue-300 shadow-sm"
              >
                {goal}
                <button
                  type="button"
                  onClick={() => removeGoal(goal)}
                  className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-3">
          Skill Goals
        </label>
        
        {/* Skill option buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
          {skillOptions.map((option) => {
            const isSelected = formData.skill_goals.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => isSelected ? removeSkill(option.value) : addSkill(option.value)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                <span className="mr-1">{option.icon}</span>
                {option.label}
              </button>
            );
          })}
          
          {/* Add Custom button */}
          <button
            type="button"
            onClick={() => setShowCustomSkill(!showCustomSkill)}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-slate-400 border-2 border-dashed border-gray-300 dark:border-white/20 hover:border-gray-400 dark:hover:border-white/30 transition-colors"
          >
            ➕ Add Custom
          </button>
        </div>

        {/* Custom skill input */}
        {showCustomSkill && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={tempSkill}
              onChange={(e) => setTempSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
              placeholder="Enter custom skill"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400 focus:border-transparent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => addSkill()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add
            </button>
          </div>
        )}

        {/* Selected skills */}
        {formData.skill_goals.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            {formData.skill_goals.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-white dark:bg-white/10 text-green-800 dark:text-green-300 shadow-sm"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="ml-2 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-bold"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Daily Schedule
        </h2>
        <p className="text-gray-600 dark:text-slate-400">
          Help us understand your daily rhythm and available time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="wake_up_time" className="block text-sm font-medium text-gray-700 mb-2">
            Wake Up Time
          </label>
          <input
            type="time"
            id="wake_up_time"
            value={formData.wake_up_time}
            onChange={(e) => handleInputChange('wake_up_time', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="sleep_time" className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Time
          </label>
          <input
            type="time"
            id="sleep_time"
            value={formData.sleep_time}
            onChange={(e) => handleInputChange('sleep_time', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="available_hours" className="block text-sm font-medium text-gray-700 mb-2">
          Available Study Hours per Day
        </label>
        <input
          type="number"
          id="available_hours"
          min="1"
          max="16"
          value={formData.available_hours}
          onChange={(e) => handleInputChange('available_hours', parseInt(e.target.value) || 8)}
          className="w-full px-4 py-3 border border-gray-300 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-slate-500 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
        />
        <p className="text-sm text-gray-500 mt-2">
          How many hours can you dedicate to focused work and learning each day?
        </p>
      </div>
    </div>
  );

  const renderStep4 = () => {
    // Generate time slots based on wake up and sleep times
    const generateTimeSlots = () => {
      const wakeHour = parseInt(formData.wake_up_time.split(':')[0]);
      const sleepHour = parseInt(formData.sleep_time.split(':')[0]);
      
      const slots: string[] = [];
      let currentHour = wakeHour;
      
      // Handle case where sleep time is past midnight
      const endHour = sleepHour < wakeHour ? sleepHour + 24 : sleepHour;
      
      while (currentHour <= endHour) {
        const displayHour = currentHour % 24;
        const timeString = `${displayHour.toString().padStart(2, '0')}:00`;
        slots.push(timeString);
        currentHour++;
      }
      
      return slots;
    };

    const timeSlots = generateTimeSlots();
    const awakeHours = timeSlots.length;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Energy Patterns (Optional)
          </h2>
          <p className="text-gray-600 dark:text-slate-400">
            When do you feel most energetic during your waking hours?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Based on your schedule: {formData.wake_up_time} - {formData.sleep_time} ({awakeHours} hours)
          </p>
        </div>

        {timeSlots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {timeSlots.map((time) => {
              const currentLevel = formData.energy_pattern.find(ep => ep.time === time)?.level;
              return (
                <div key={time} className="border border-gray-200 dark:border-white/10 rounded-lg p-3">
                  <div className="text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 text-center">{time}</div>
                  <div className="flex flex-col gap-1">
                    {(['high', 'medium', 'low'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => addEnergyLevel(time, level)}
                        className={`py-1 px-2 text-xs rounded transition-colors ${
                          currentLevel === level
                            ? level === 'high'
                              ? 'bg-green-500 text-white'
                              : level === 'medium'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-red-500 text-white'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10'
                        }`}
                      >
                        {level === 'high' ? '⚡ High' : level === 'medium' ? '➖ Medium' : '💤 Low'}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 bg-gray-50 dark:bg-white/5 rounded-lg">
            <p className="text-gray-600 dark:text-slate-400">
              Please set your wake up and sleep times in the previous step to see energy pattern options.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-500 text-center">
          Click on energy levels for different times. You can skip this step and add it later.
        </p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-lg p-8">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 dark:text-slate-400 mb-2">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
              <div
                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="mb-8">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-2 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-slate-300 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  Previous
                </button>
              )}
            </div>

            <div className="flex gap-3">
              {onSkip && currentStep === 1 && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="px-6 py-2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Skip Setup
                </button>
              )}

              {currentStep < totalSteps ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading || !validateCurrentStep()}
                  className="px-6 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Creating Profile...' : 'Complete Setup'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;