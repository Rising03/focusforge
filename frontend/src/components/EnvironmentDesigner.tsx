import React, { useState, useEffect } from 'react';
import { identityService } from '../services/identityService';
import { 
  EnvironmentAssessmentRequest, 
  EnvironmentAssessmentResponse,
  DistractionReportRequest,
  DistractionReportResponse,
  EnvironmentCorrelationResponse,
  EnvironmentData
} from '../types/identity';

interface EnvironmentDesignerProps {
  className?: string;
}

export const EnvironmentDesigner: React.FC<EnvironmentDesignerProps> = ({ className = '' }) => {
  const [activeTab, setActiveTab] = useState<'physical' | 'digital' | 'distractions' | 'correlations'>('physical');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Physical environment state
  const [physicalEnv, setPhysicalEnv] = useState<EnvironmentData>({
    location: '',
    noise_level: 'quiet',
    lighting: 'moderate',
    temperature: 'moderate',
    organization_level: 'organized',
    physical_distractions: [],
    focus_aids: []
  });
  
  // Digital environment state
  const [digitalEnv, setDigitalEnv] = useState<EnvironmentData>({
    digital_distractions: [],
    focus_aids: []
  });
  
  // Distraction report state
  const [distractionType, setDistractionType] = useState('');
  const [distractionContext, setDistractionContext] = useState('');
  const [distractionImpact, setDistractionImpact] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Results state
  const [assessmentResult, setAssessmentResult] = useState<EnvironmentAssessmentResponse | null>(null);
  const [distractionResult, setDistractionResult] = useState<DistractionReportResponse | null>(null);
  const [correlations, setCorrelations] = useState<EnvironmentCorrelationResponse | null>(null);

  useEffect(() => {
    if (activeTab === 'correlations') {
      loadCorrelations();
    }
  }, [activeTab]);

  const loadCorrelations = async () => {
    try {
      setLoading(true);
      const data = await identityService.getEnvironmentCorrelations();
      setCorrelations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load correlations');
    } finally {
      setLoading(false);
    }
  };

  const handlePhysicalAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const request: EnvironmentAssessmentRequest = {
        environment_type: 'physical',
        environment_data: physicalEnv
      };
      
      const result = await identityService.assessEnvironment(request);
      setAssessmentResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assess physical environment');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalAssessment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const request: EnvironmentAssessmentRequest = {
        environment_type: 'digital',
        environment_data: digitalEnv
      };
      
      const result = await identityService.assessEnvironment(request);
      setAssessmentResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assess digital environment');
    } finally {
      setLoading(false);
    }
  };

  const handleDistractionReport = async () => {
    if (!distractionType.trim() || !distractionContext.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const request: DistractionReportRequest = {
        distraction_type: distractionType.trim(),
        context: distractionContext.trim(),
        impact_level: distractionImpact
      };
      
      const result = await identityService.reportDistraction(request);
      setDistractionResult(result);
      setDistractionType('');
      setDistractionContext('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to report distraction');
    } finally {
      setLoading(false);
    }
  };

  const addArrayItem = (
    currentArray: string[], 
    newItem: string, 
    setter: (items: string[]) => void
  ) => {
    if (newItem.trim() && !currentArray.includes(newItem.trim())) {
      setter([...currentArray, newItem.trim()]);
    }
  };

  const removeArrayItem = (
    currentArray: string[], 
    itemToRemove: string, 
    setter: (items: string[]) => void
  ) => {
    setter(currentArray.filter(item => item !== itemToRemove));
  };

  const renderPhysicalEnvironment = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Location
        </label>
        <input
          type="text"
          value={physicalEnv.location || ''}
          onChange={(e) => setPhysicalEnv({ ...physicalEnv, location: e.target.value })}
          placeholder="e.g., Home office, Library, Coffee shop"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Noise Level
          </label>
          <select
            value={physicalEnv.noise_level}
            onChange={(e) => setPhysicalEnv({ ...physicalEnv, noise_level: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="silent">Silent</option>
            <option value="quiet">Quiet</option>
            <option value="moderate">Moderate</option>
            <option value="noisy">Noisy</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lighting
          </label>
          <select
            value={physicalEnv.lighting}
            onChange={(e) => setPhysicalEnv({ ...physicalEnv, lighting: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bright">Bright</option>
            <option value="moderate">Moderate</option>
            <option value="dim">Dim</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Organization
          </label>
          <select
            value={physicalEnv.organization_level}
            onChange={(e) => setPhysicalEnv({ ...physicalEnv, organization_level: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="minimal">Minimal</option>
            <option value="organized">Organized</option>
            <option value="cluttered">Cluttered</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Physical Distractions
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {physicalEnv.physical_distractions?.map((distraction, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
            >
              {distraction}
              <button
                onClick={() => removeArrayItem(
                  physicalEnv.physical_distractions || [], 
                  distraction, 
                  (items) => setPhysicalEnv({ ...physicalEnv, physical_distractions: items })
                )}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add distraction (press Enter)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addArrayItem(
                physicalEnv.physical_distractions || [], 
                e.currentTarget.value, 
                (items) => setPhysicalEnv({ ...physicalEnv, physical_distractions: items })
              );
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Focus Aids
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {physicalEnv.focus_aids?.map((aid, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
            >
              {aid}
              <button
                onClick={() => removeArrayItem(
                  physicalEnv.focus_aids || [], 
                  aid, 
                  (items) => setPhysicalEnv({ ...physicalEnv, focus_aids: items })
                )}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add focus aid (press Enter)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addArrayItem(
                physicalEnv.focus_aids || [], 
                e.currentTarget.value, 
                (items) => setPhysicalEnv({ ...physicalEnv, focus_aids: items })
              );
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <button
        onClick={handlePhysicalAssessment}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Assessing...' : 'Assess Physical Environment'}
      </button>
    </div>
  );

  const renderDigitalEnvironment = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Digital Distractions
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {digitalEnv.digital_distractions?.map((distraction, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
            >
              {distraction}
              <button
                onClick={() => removeArrayItem(
                  digitalEnv.digital_distractions || [], 
                  distraction, 
                  (items) => setDigitalEnv({ ...digitalEnv, digital_distractions: items })
                )}
                className="ml-1 text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add digital distraction (press Enter)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addArrayItem(
                digitalEnv.digital_distractions || [], 
                e.currentTarget.value, 
                (items) => setDigitalEnv({ ...digitalEnv, digital_distractions: items })
              );
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Digital Focus Aids
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {digitalEnv.focus_aids?.map((aid, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
            >
              {aid}
              <button
                onClick={() => removeArrayItem(
                  digitalEnv.focus_aids || [], 
                  aid, 
                  (items) => setDigitalEnv({ ...digitalEnv, focus_aids: items })
                )}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          type="text"
          placeholder="Add digital focus aid (press Enter)"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              addArrayItem(
                digitalEnv.focus_aids || [], 
                e.currentTarget.value, 
                (items) => setDigitalEnv({ ...digitalEnv, focus_aids: items })
              );
              e.currentTarget.value = '';
            }
          }}
        />
      </div>

      <button
        onClick={handleDigitalAssessment}
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Assessing...' : 'Assess Digital Environment'}
      </button>
    </div>
  );

  const renderDistractionReport = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Distraction Type
        </label>
        <input
          type="text"
          value={distractionType}
          onChange={(e) => setDistractionType(e.target.value)}
          placeholder="e.g., Phone notifications, Social media, Noise"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Context
        </label>
        <textarea
          value={distractionContext}
          onChange={(e) => setDistractionContext(e.target.value)}
          placeholder="Describe when and how this distraction occurs..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Impact Level
        </label>
        <select
          value={distractionImpact}
          onChange={(e) => setDistractionImpact(e.target.value as any)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <button
        onClick={handleDistractionReport}
        disabled={loading || !distractionType.trim() || !distractionContext.trim()}
        className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 transition-colors"
      >
        {loading ? 'Reporting...' : 'Report Distraction'}
      </button>
    </div>
  );

  const renderCorrelations = () => (
    <div className="space-y-6">
      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      ) : correlations ? (
        <>
          {correlations.insights && correlations.insights.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Insights</h4>
              <div className="space-y-2">
                {correlations.insights.map((insight, index) => (
                  <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {correlations.correlations && correlations.correlations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Environment Correlations</h4>
              <div className="space-y-2">
                {correlations.correlations.map((correlation, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {correlation.environment_factor}: {correlation.factor_value}
                        </p>
                        <p className="text-xs text-gray-600">
                          {correlation.sample_size} samples • {Math.round(correlation.confidence_level * 100)}% confidence
                        </p>
                      </div>
                      <div className={`text-sm font-medium ${
                        correlation.productivity_impact > 0.6 ? 'text-green-600' : 
                        correlation.productivity_impact < 0.4 ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                        {Math.round(correlation.productivity_impact * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {correlations.optimization_recommendations && correlations.optimization_recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Optimization Recommendations</h4>
              <div className="space-y-2">
                {correlations.optimization_recommendations.map((recommendation, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-600 text-center">No correlation data available yet</p>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Environment Designer</h2>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { key: 'physical', label: 'Physical' },
            { key: 'digital', label: 'Digital' },
            { key: 'distractions', label: 'Distractions' },
            { key: 'correlations', label: 'Insights' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Tab Content */}
        <div className="mb-6">
          {activeTab === 'physical' && renderPhysicalEnvironment()}
          {activeTab === 'digital' && renderDigitalEnvironment()}
          {activeTab === 'distractions' && renderDistractionReport()}
          {activeTab === 'correlations' && renderCorrelations()}
        </div>

        {/* Results */}
        {assessmentResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Assessment Results</h4>
            <div className="mb-3">
              <p className="text-sm text-gray-600">
                Optimization Score: <span className="font-medium text-gray-900">
                  {Math.round(assessmentResult.optimization_score * 100)}%
                </span>
              </p>
            </div>
            {assessmentResult.suggestions && assessmentResult.suggestions.length > 0 && (
              <div className="space-y-2">
                {assessmentResult.suggestions.map((suggestion, index) => (
                  <div key={index} className="p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-800">{suggestion}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {distractionResult && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Distraction Solutions</h4>
            {distractionResult.immediate_solutions && distractionResult.immediate_solutions.length > 0 && (
              <div className="mb-4">
                <h5 className="text-xs font-medium text-gray-700 mb-2">Immediate Solutions</h5>
                <div className="space-y-1">
                  {distractionResult.immediate_solutions.map((solution, index) => (
                    <div key={index} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-sm text-yellow-800">{solution}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {distractionResult.long_term_strategies && distractionResult.long_term_strategies.length > 0 && (
              <div>
                <h5 className="text-xs font-medium text-gray-700 mb-2">Long-term Strategies</h5>
                <div className="space-y-1">
                  {distractionResult.long_term_strategies.map((strategy, index) => (
                    <div key={index} className="p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-800">{strategy}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};