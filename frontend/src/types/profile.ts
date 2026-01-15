export interface UserProfile {
  id: string;
  user_id: string;
  target_identity: string;
  academic_goals: string[];
  skill_goals: string[];
  wake_up_time: string;
  sleep_time: string;
  available_hours: number;
  energy_pattern: EnergyLevel[];
  detailed_profile: DetailedUserProfile;
  created_at: Date;
  updated_at: Date;
}

export interface EnergyLevel {
  time: string;
  level: 'low' | 'medium' | 'high';
}

export interface DetailedUserProfile {
  learning_style?: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  productivity_peaks?: string[];
  distraction_triggers?: string[];
  motivation_factors?: string[];
  study_environment_prefs?: EnvironmentPreferences;
  challenge_areas?: string[];
  personality_traits?: PersonalityProfile;
  academic_background?: AcademicProfile;
  behavioral_patterns?: BehavioralAnalytics;
  contextual_preferences?: ContextualPreferences;
  implicit_feedback?: ImplicitFeedbackData;
}

export interface EnvironmentPreferences {
  preferred_location: string[];
  noise_level: 'silent' | 'quiet' | 'moderate' | 'background_music';
  lighting_preference: 'bright' | 'moderate' | 'dim';
  temperature_preference: 'cool' | 'moderate' | 'warm';
  organization_style: 'minimal' | 'organized' | 'flexible';
}

export interface PersonalityProfile {
  work_style: 'structured' | 'flexible' | 'mixed';
  social_preference: 'solo' | 'group' | 'mixed';
  feedback_style: 'direct' | 'encouraging' | 'analytical';
  challenge_level: 'gradual' | 'moderate' | 'aggressive';
}

export interface AcademicProfile {
  current_level: 'high_school' | 'undergraduate' | 'graduate' | 'professional';
  subjects: string[];
  learning_goals: string[];
  time_constraints: string[];
  previous_challenges: string[];
}

export interface BehavioralAnalytics {
  interaction_patterns: InteractionPattern[];
  task_completion_rates: Record<string, number>;
  feature_usage_stats: Record<string, number>;
  temporal_productivity_patterns: TemporalPattern[];
  adaptation_history: AdaptationEvent[];
}

export interface InteractionPattern {
  feature: string;
  engagement_score: number;
  click_through_rate: number;
  completion_rate: number;
  last_updated: Date;
}

export interface TemporalPattern {
  time_of_day: string;
  day_of_week: string;
  season: string;
  productivity_score: number;
  energy_level: number;
  focus_quality: number;
}

export interface ContextualPreferences {
  weather_preferences: WeatherPreference[];
  seasonal_patterns: SeasonalPattern[];
  life_circumstances: LifeCircumstance[];
  social_context: SocialContextPreference[];
}

export interface WeatherPreference {
  weather_type: string;
  productivity_impact: number;
  preferred_activities: string[];
}

export interface SeasonalPattern {
  season: 'spring' | 'summer' | 'fall' | 'winter';
  energy_adjustment: number;
  activity_preferences: string[];
}

export interface LifeCircumstance {
  circumstance: string;
  impact_level: 'low' | 'medium' | 'high';
  adaptation_needed: string[];
}

export interface SocialContextPreference {
  context: string;
  preference_level: number;
  optimal_activities: string[];
}

export interface ImplicitFeedbackData {
  suggestion_acceptance_rate: number;
  routine_modification_patterns: ModificationPattern[];
  skip_patterns: SkipPattern[];
  engagement_metrics: EngagementMetric[];
}

export interface ModificationPattern {
  modification_type: string;
  frequency: number;
  context: string;
  effectiveness: number;
}

export interface SkipPattern {
  skipped_activity: string;
  frequency: number;
  time_patterns: string[];
  reasons: string[];
}

export interface EngagementMetric {
  feature: string;
  engagement_duration: number;
  interaction_depth: number;
  return_frequency: number;
}

export interface AdaptationEvent {
  timestamp: Date;
  trigger: string;
  adaptation: string;
  effectiveness: number;
}

// Request/Response types for API
export interface CreateProfileRequest {
  target_identity: string;
  academic_goals: string[];
  skill_goals: string[];
  wake_up_time: string;
  sleep_time: string;
  available_hours: number;
  energy_pattern?: EnergyLevel[];
  detailed_profile?: Partial<DetailedUserProfile>;
}

export interface UpdateProfileRequest extends Partial<CreateProfileRequest> {}

export interface ProfileResponse {
  profile: UserProfile;
  completion_percentage: number;
  missing_fields: string[];
}

// Form state types
export interface ProfileFormData {
  target_identity: string;
  academic_goals: string[];
  skill_goals: string[];
  wake_up_time: string;
  sleep_time: string;
  available_hours: number;
  energy_pattern: EnergyLevel[];
}

export interface DetailedProfileFormData extends Partial<DetailedUserProfile> {}