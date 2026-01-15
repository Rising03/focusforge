import { Request, Response } from 'express';
import { IdentityService } from '../services/identityService';
import { 
  CalculateIdentityAlignmentRequest,
  TaskAcknowledgmentRequest,
  ActivitySuggestionRequest,
  EnvironmentAssessmentRequest,
  DistractionReportRequest
} from '../types/identity';
import { logger } from '../utils/logger';

interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export class IdentityController {
  private identityService: IdentityService;

  constructor() {
    this.identityService = new IdentityService();
  }

  async calculateIdentityAlignment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: CalculateIdentityAlignmentRequest = {
        days: parseInt(req.query.days as string) || 7
      };

      const alignment = await this.identityService.calculateIdentityAlignment(userId, request);

      // Generate insights and recommendations
      const insights = this.generateAlignmentInsights(alignment);
      const recommendations = this.generateAlignmentRecommendations(alignment);
      const trend = this.determineTrend(alignment.alignment_score);

      res.json({
        alignmentScore: parseFloat(alignment.alignment_score.toString()),
        targetIdentity: alignment.target_identity,
        success: true,
        data: {
          alignment,
          insights,
          recommendations,
          trend
        }
      });
    } catch (error) {
      logger.error('Error in calculateIdentityAlignment controller:', error);
      
      if (error instanceof Error && error.message === 'User profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async acknowledgeTask(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: TaskAcknowledgmentRequest = req.body;
      
      if (!request.task) {
        res.status(400).json({ error: 'Task is required' });
        return;
      }

      const acknowledgment = await this.identityService.acknowledgeTask(userId, request);
      const identityBoost = this.calculateIdentityBoost(request.task, request.activity_type);

      res.json({
        success: true,
        data: {
          acknowledgment,
          identity_boost: identityBoost
        }
      });
    } catch (error) {
      logger.error('Error in acknowledgeTask controller:', error);
      
      if (error instanceof Error && error.message === 'User profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async suggestActivities(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: ActivitySuggestionRequest = {
        context: req.query.context as string,
        available_time: req.query.available_time ? parseInt(req.query.available_time as string) : undefined,
        energy_level: req.query.energy_level as 'low' | 'medium' | 'high'
      };

      const suggestions = await this.identityService.suggestIdentityBasedActivities(userId, request);
      
      const identityQuestion = suggestions.length > 0 ? suggestions[0].identity_question : 'What would your ideal self do right now?';
      const reasoning = 'These activities align with your target identity and current context.';

      res.json({
        success: true,
        data: {
          suggestions,
          identity_question: identityQuestion,
          reasoning
        }
      });
    } catch (error) {
      logger.error('Error in suggestActivities controller:', error);
      
      if (error instanceof Error && error.message === 'User profile not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async assessEnvironment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: EnvironmentAssessmentRequest = req.body;
      
      if (!request.environment_type || !request.environment_data) {
        res.status(400).json({ error: 'Environment type and data are required' });
        return;
      }

      const assessment = await this.identityService.assessEnvironment(userId, request);
      const suggestions = this.generateEnvironmentSuggestions(assessment);
      const optimizationScore = this.calculateOptimizationScore(assessment);

      res.json({
        success: true,
        data: {
          assessment,
          suggestions,
          optimization_score: optimizationScore
        }
      });
    } catch (error) {
      logger.error('Error in assessEnvironment controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async reportDistraction(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const request: DistractionReportRequest = req.body;
      
      if (!request.distraction_type || !request.context) {
        res.status(400).json({ error: 'Distraction type and context are required' });
        return;
      }

      const report = await this.identityService.reportDistraction(userId, request);
      
      const immediateSolutions = report.suggested_solutions.slice(0, 3);
      const longTermStrategies = report.friction_points.map(fp => fp.elimination_strategy);

      res.json({
        success: true,
        data: {
          report,
          immediate_solutions: immediateSolutions,
          long_term_strategies: longTermStrategies
        }
      });
    } catch (error) {
      logger.error('Error in reportDistraction controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async getEnvironmentCorrelations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const correlations = await this.identityService.getEnvironmentProductivityCorrelations(userId);
      const insights = this.generateCorrelationInsights(correlations);
      const optimizationRecommendations = this.generateOptimizationRecommendations(correlations);

      res.json({
        success: true,
        data: {
          correlations,
          insights,
          optimization_recommendations: optimizationRecommendations
        }
      });
    } catch (error) {
      logger.error('Error in getEnvironmentCorrelations controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  async trackEnvironmentCorrelation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { environment_factor, factor_value, productivity_impact } = req.body;
      
      if (!environment_factor || !factor_value || productivity_impact === undefined) {
        res.status(400).json({ error: 'Environment factor, factor value, and productivity impact are required' });
        return;
      }

      await this.identityService.trackEnvironmentProductivityCorrelation(
        userId, 
        environment_factor, 
        factor_value, 
        productivity_impact
      );

      res.json({
        success: true,
        message: 'Environment correlation tracked successfully'
      });
    } catch (error) {
      logger.error('Error in trackEnvironmentCorrelation controller:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  private generateAlignmentInsights(alignment: any): string[] {
    const insights: string[] = [];
    const score = alignment.alignment_score;

    if (score >= 0.8) {
      insights.push('Excellent identity alignment! Your actions consistently reflect your target identity.');
    } else if (score >= 0.6) {
      insights.push('Good identity alignment. You\'re on the right track with room for improvement.');
    } else if (score >= 0.4) {
      insights.push('Moderate identity alignment. Consider focusing more on identity-aligned activities.');
    } else {
      insights.push('Low identity alignment. Your current activities may not be supporting your target identity.');
    }

    // Analyze contributing activities
    const highAlignmentActivities = alignment.contributing_activities?.filter((a: any) => a.identity_relevance === 'high') || [];
    if (highAlignmentActivities.length > 0) {
      insights.push(`Your strongest identity-aligned activities: ${highAlignmentActivities.map((a: any) => a.activity).join(', ')}`);
    }

    return insights;
  }

  private generateAlignmentRecommendations(alignment: any): string[] {
    const recommendations: string[] = [];
    const score = alignment.alignment_score;

    if (score < 0.6) {
      recommendations.push('Increase time spent on activities that directly support your target identity');
      recommendations.push('Consider reducing time on activities that don\'t align with your goals');
    }

    const lowPerformanceActivities = alignment.contributing_activities?.filter((a: any) => a.recent_performance < 0.5) || [];
    if (lowPerformanceActivities.length > 0) {
      recommendations.push('Focus on improving quality and consistency in your key activities');
    }

    recommendations.push('Set daily intentions that reinforce your target identity');
    recommendations.push('Celebrate small wins that demonstrate your identity in action');

    return recommendations;
  }

  private determineTrend(score: number): 'improving' | 'declining' | 'stable' {
    // This is a simplified implementation. In a real system, you'd compare with historical data
    if (score >= 0.7) return 'improving';
    if (score <= 0.4) return 'declining';
    return 'stable';
  }

  private calculateIdentityBoost(task: string, activityType?: string): number {
    // Simple calculation based on task complexity and type
    let boost = 0.1; // Base boost

    if (task.toLowerCase().includes('study') || task.toLowerCase().includes('learn')) {
      boost += 0.2;
    }
    if (task.toLowerCase().includes('practice') || task.toLowerCase().includes('skill')) {
      boost += 0.15;
    }
    if (task.toLowerCase().includes('deep work') || task.toLowerCase().includes('focus')) {
      boost += 0.25;
    }

    return Math.min(1.0, boost);
  }

  private generateEnvironmentSuggestions(assessment: any): string[] {
    const suggestions: string[] = [];
    const envData = assessment.assessment_data;

    if (assessment.environment_type === 'physical') {
      if (envData.noise_level === 'noisy') {
        suggestions.push('Consider using noise-canceling headphones or finding a quieter space');
      }
      if (envData.organization_level === 'cluttered') {
        suggestions.push('Organize your workspace to reduce visual distractions');
      }
      if (envData.lighting_preference === 'dim') {
        suggestions.push('Improve lighting to reduce eye strain and increase alertness');
      }
    } else if (assessment.environment_type === 'digital') {
      if (envData.digital_distractions?.length > 0) {
        suggestions.push('Use website blockers to eliminate digital distractions during work sessions');
      }
      suggestions.push('Set up a dedicated browser profile for work with minimal bookmarks');
    }

    if (suggestions.length === 0) {
      suggestions.push('Your environment looks well-optimized for productivity!');
    }

    return suggestions;
  }

  private calculateOptimizationScore(assessment: any): number {
    // Simple scoring based on environment factors
    let score = 0.5; // Base score

    const envData = assessment.assessment_data;

    if (assessment.environment_type === 'physical') {
      if (envData.noise_level === 'quiet' || envData.noise_level === 'silent') score += 0.2;
      if (envData.organization_level === 'organized' || envData.organization_level === 'minimal') score += 0.2;
      if (envData.lighting_preference === 'bright' || envData.lighting_preference === 'moderate') score += 0.1;
    }

    if (assessment.environment_type === 'digital') {
      if (!envData.digital_distractions || envData.digital_distractions.length === 0) score += 0.3;
      if (envData.focus_aids && envData.focus_aids.length > 0) score += 0.2;
    }

    return Math.min(1.0, score);
  }

  private generateCorrelationInsights(correlations: any[]): string[] {
    const insights: string[] = [];

    if (correlations.length === 0) {
      insights.push('Not enough data yet to identify environment-productivity correlations');
      return insights;
    }

    const positiveCorrelations = correlations.filter(c => c.productivity_impact > 0.6);
    const negativeCorrelations = correlations.filter(c => c.productivity_impact < 0.4);

    if (positiveCorrelations.length > 0) {
      const bestFactor = positiveCorrelations[0];
      insights.push(`${bestFactor.environment_factor}: ${bestFactor.factor_value} has a strong positive impact on your productivity`);
    }

    if (negativeCorrelations.length > 0) {
      const worstFactor = negativeCorrelations[negativeCorrelations.length - 1];
      insights.push(`${worstFactor.environment_factor}: ${worstFactor.factor_value} appears to negatively impact your productivity`);
    }

    return insights;
  }

  private generateOptimizationRecommendations(correlations: any[]): string[] {
    const recommendations: string[] = [];

    const positiveCorrelations = correlations.filter(c => c.productivity_impact > 0.6 && c.confidence_level > 0.5);
    const negativeCorrelations = correlations.filter(c => c.productivity_impact < 0.4 && c.confidence_level > 0.5);

    positiveCorrelations.forEach(correlation => {
      recommendations.push(`Try to maintain ${correlation.environment_factor} as ${correlation.factor_value} more often`);
    });

    negativeCorrelations.forEach(correlation => {
      recommendations.push(`Avoid ${correlation.environment_factor} being ${correlation.factor_value} during work sessions`);
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue tracking your environment to identify optimization opportunities');
    }

    return recommendations;
  }
}