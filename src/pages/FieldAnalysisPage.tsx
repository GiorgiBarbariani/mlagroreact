import React, { useState, useEffect } from 'react';
import {
  Brain, TrendingUp, AlertTriangle, Droplets, Leaf, Bug,
  Cloud, ArrowLeft, Loader2, RefreshCw, BarChart3, Target,
  Calendar, MapPin, Wheat, Lightbulb, Shield, Clock,
  ChevronDown, ChevronUp, Activity, ThermometerSun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  fieldAnalysisService,
  type FieldAnalysisResult,
  type CompanyAnalysisSummary
} from '../services/fieldAnalysisService';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import './FieldAnalysisPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  // Also support uppercase variants from API
  Id?: string;
  Name?: string;
  FieldArea?: number | null;
  CropType?: string | null;
}

const FieldAnalysisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [analysis, setAnalysis] = useState<FieldAnalysisResult | null>(null);
  const [companySummary, setCompanySummary] = useState<CompanyAnalysisSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    risks: true,
    prediction: true,
    aiInsights: true,
    recommendations: true
  });

  // Helper to get normalized field properties
  const getFieldId = (field: Field) => field.id || field.Id || '';
  const getFieldName = (field: Field) => field.name || field.Name || '';
  const getFieldArea = (field: Field) => field.area || field.FieldArea || 0;
  const getFieldCrop = (field: Field) => field.crop || field.CropType || '';

  // Get companyId from user
  const companyId = user?.companyId || '';

  // Load fields when user data changes
  useEffect(() => {
    console.log('FieldAnalysisPage: user =', user);
    console.log('FieldAnalysisPage: companyId =', user?.companyId);

    if (user?.companyId) {
      loadFields(user.companyId);
      loadCompanySummary(user.companyId);
    } else {
      setIsLoadingFields(false);
    }
  }, [user]);

  const loadFields = async (cId: string) => {
    try {
      setIsLoadingFields(true);
      console.log('FieldAnalysisPage: Loading fields for company:', cId);
      const response = await apiClient.get(`/fields?companyId=${cId}`);
      console.log('FieldAnalysisPage: Fields response:', response.data);
      const fieldsData = response.data?.data || response.data || [];
      const fieldsArray = Array.isArray(fieldsData) ? fieldsData : [];
      console.log('FieldAnalysisPage: Fields array:', fieldsArray);
      setFields(fieldsArray);
    } catch (err) {
      console.error('Error loading fields:', err);
      setFields([]);
    } finally {
      setIsLoadingFields(false);
    }
  };

  const loadCompanySummary = async (cId: string) => {
    try {
      const summary = await fieldAnalysisService.getCompanyAnalysis(cId);
      setCompanySummary(summary);
    } catch (err) {
      console.error('Error loading company summary:', err);
      // Don't fail if summary can't load - fields should still work
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFieldId || !companyId) {
      setError('გთხოვთ აირჩიოთ მინდორი');
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await fieldAnalysisService.analyzeField(selectedFieldId, companyId);
      setAnalysis(result);
      // Refresh company summary after analysis
      await loadCompanySummary(companyId);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.response?.data?.message || 'ანალიზის შესრულება ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getRiskLevelText = (level: string) => {
    switch (level) {
      case 'high': return 'მაღალი';
      case 'medium': return 'საშუალო';
      case 'low': return 'დაბალი';
      default: return 'უცნობი';
    }
  };

  const getRiskIcon = (type: string) => {
    switch (type) {
      case 'weather': return Cloud;
      case 'water': return Droplets;
      case 'nutrient': return Leaf;
      case 'disease': return Bug;
      default: return AlertTriangle;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ka-GE');
  };

  return (
    <div className="field-analysis-page">
      {/* Header */}
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          <span>უკან</span>
        </button>
        <div className="header-content">
          <Brain size={28} className="header-icon" />
          <div>
            <h1>AI მინდვრის ანალიზი</h1>
            <p>მოსავლის პროგნოზირება და რისკების შეფასება</p>
          </div>
        </div>
      </div>

      {/* Company Summary */}
      {companySummary && (
        <div className="company-summary">
          <h2>მინდვრების მოკლე მიმოხილვა</h2>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon">
                <MapPin size={24} />
              </div>
              <div className="card-content">
                <span className="card-value">{companySummary.summary.totalFields}</span>
                <span className="card-label">სულ მინდვრები</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon analyzed">
                <BarChart3 size={24} />
              </div>
              <div className="card-content">
                <span className="card-value">{companySummary.summary.analyzedFields}</span>
                <span className="card-label">გაანალიზებული</span>
              </div>
            </div>
            <div className="summary-card high-risk">
              <div className="card-icon">
                <AlertTriangle size={24} />
              </div>
              <div className="card-content">
                <span className="card-value">{companySummary.summary.highRiskFields}</span>
                <span className="card-label">მაღალი რისკი</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon yield">
                <Wheat size={24} />
              </div>
              <div className="card-content">
                <span className="card-value">
                  {companySummary.summary.totalPredictedYield > 0
                    ? `${Math.round(companySummary.summary.totalPredictedYield / 1000)}t`
                    : '-'}
                </span>
                <span className="card-label">პროგნოზირებული მოსავალი</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Selection */}
      <div className="analysis-section">
        <div className="field-selector">
          <label>აირჩიეთ მინდორი ანალიზისთვის</label>
          {!companyId && (
            <div className="error-message" style={{ marginBottom: '12px' }}>
              <AlertTriangle size={20} />
              <span>კომპანია ვერ მოიძებნა. გთხოვთ, შედით სისტემაში ხელახლა.</span>
            </div>
          )}
          {companyId && fields.length === 0 && !isLoadingFields && (
            <div className="error-message" style={{ marginBottom: '12px', background: '#fff3e0', color: '#e65100' }}>
              <AlertTriangle size={20} />
              <span>მინდვრები ვერ მოიძებნა. გთხოვთ, დაამატოთ მინდორი "ჩემი მინდვრები" გვერდზე.</span>
            </div>
          )}
          <div className="selector-row">
            <select
              value={selectedFieldId}
              onChange={(e) => setSelectedFieldId(e.target.value)}
              disabled={isLoadingFields || isLoading || !companyId}
            >
              <option value="">{isLoadingFields ? 'იტვირთება...' : '-- აირჩიეთ მინდორი --'}</option>
              {fields.map(field => {
                const fieldId = getFieldId(field);
                const fieldName = getFieldName(field);
                const fieldArea = getFieldArea(field);
                const fieldCrop = getFieldCrop(field);
                return (
                  <option key={fieldId} value={fieldId}>
                    {fieldName} {fieldArea ? `(${fieldArea} ჰა)` : ''} {fieldCrop ? `- ${fieldCrop}` : ''}
                  </option>
                );
              })}
            </select>
            <button
              className="btn-analyze"
              onClick={handleAnalyze}
              disabled={!selectedFieldId || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  <span>მიმდინარეობს...</span>
                </>
              ) : (
                <>
                  <Brain size={20} />
                  <span>AI ანალიზი</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <AlertTriangle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Analysis Results */}
      {analysis && (
        <div className="analysis-results">
          {/* Field Info Header */}
          <div className="result-header">
            <div className="field-info">
              <h2>{analysis.fieldName}</h2>
              <div className="field-meta">
                {analysis.fieldInfo.area && (
                  <span><MapPin size={16} /> {analysis.fieldInfo.area} ჰა</span>
                )}
                {analysis.fieldInfo.cropType && (
                  <span><Wheat size={16} /> {analysis.fieldInfo.cropType}</span>
                )}
                {analysis.fieldInfo.plantingDate && (
                  <span><Calendar size={16} /> დარგვა: {formatDate(analysis.fieldInfo.plantingDate)}</span>
                )}
              </div>
            </div>
            <div className="analysis-date">
              <Clock size={16} />
              <span>{formatDate(analysis.analysisDate)}</span>
            </div>
          </div>

          {/* Overall Risk Score */}
          <div className="overall-risk-card">
            <div className="risk-gauge">
              <div
                className="risk-score"
                style={{ backgroundColor: getRiskLevelColor(analysis.risks.overall.level) }}
              >
                <span className="score-value">{analysis.risks.overall.score}</span>
                <span className="score-label">რისკის ქულა</span>
              </div>
              <div className="risk-level" style={{ color: getRiskLevelColor(analysis.risks.overall.level) }}>
                {getRiskLevelText(analysis.risks.overall.level)} რისკი
              </div>
            </div>

            {/* AI Health Score */}
            {analysis.aiInsights?.healthScore && (
              <div className="health-gauge">
                <Activity size={24} />
                <div className="health-info">
                  <span className="health-value">{analysis.aiInsights.healthScore}%</span>
                  <span className="health-label">ჯანმრთელობის ქულა</span>
                </div>
              </div>
            )}
          </div>

          {/* Risk Details */}
          <div className="collapsible-section">
            <button className="section-header" onClick={() => toggleSection('risks')}>
              <AlertTriangle size={20} />
              <span>რისკების დეტალური ანალიზი</span>
              {expandedSections.risks ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.risks && (
              <div className="section-content">
                <div className="risk-grid">
                  {(['weather', 'water', 'nutrient', 'disease'] as const).map(riskType => {
                    const risk = analysis.risks[riskType];
                    const RiskIcon = getRiskIcon(riskType);
                    const riskLabels = {
                      weather: 'ამინდი',
                      water: 'წყალი',
                      nutrient: 'საკვები ნივთიერებები',
                      disease: 'დაავადება'
                    };

                    return (
                      <div key={riskType} className={`risk-card ${risk.level}`}>
                        <div className="risk-header">
                          <RiskIcon size={24} style={{ color: getRiskLevelColor(risk.level) }} />
                          <div>
                            <h4>{riskLabels[riskType]}</h4>
                            <span
                              className="risk-badge"
                              style={{ backgroundColor: getRiskLevelColor(risk.level) }}
                            >
                              {risk.score}%
                            </span>
                          </div>
                        </div>
                        {risk.factors.length > 0 && (
                          <ul className="risk-factors">
                            {risk.factors.map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Harvest Prediction */}
          <div className="collapsible-section">
            <button className="section-header" onClick={() => toggleSection('prediction')}>
              <TrendingUp size={20} />
              <span>მოსავლის პროგნოზი</span>
              {expandedSections.prediction ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            {expandedSections.prediction && (
              <div className="section-content">
                <div className="prediction-card">
                  <div className="prediction-main">
                    <div className="prediction-value">
                      <Wheat size={32} />
                      <div>
                        <span className="value">
                          {analysis.prediction.estimatedYield
                            ? `${Math.round(analysis.prediction.estimatedYield).toLocaleString()}`
                            : 'N/A'}
                        </span>
                        <span className="unit">{analysis.prediction.yieldUnit}</span>
                      </div>
                    </div>
                    <div className="confidence-meter">
                      <div className="meter-bar">
                        <div
                          className="meter-fill"
                          style={{ width: `${analysis.prediction.confidence}%` }}
                        />
                      </div>
                      <span className="confidence-text">
                        სანდოობა: {analysis.prediction.confidence}%
                      </span>
                    </div>
                  </div>

                  {analysis.prediction.comparisonToAverage && (
                    <div className="comparison">
                      <span>ისტორიული საშუალო: {analysis.prediction.comparisonToAverage.historicalAverage} kg/ha</span>
                      <span className={analysis.prediction.comparisonToAverage.difference >= 0 ? 'positive' : 'negative'}>
                        {analysis.prediction.comparisonToAverage.difference >= 0 ? '+' : ''}
                        {analysis.prediction.comparisonToAverage.difference} kg/ha
                      </span>
                    </div>
                  )}

                  {analysis.prediction.factors.length > 0 && (
                    <div className="prediction-factors">
                      <h4>გათვალისწინებული ფაქტორები:</h4>
                      <ul>
                        {analysis.prediction.factors.map((factor, idx) => (
                          <li key={idx}>{factor}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* AI Insights */}
          {analysis.aiInsights && !analysis.aiInsights.error && (
            <div className="collapsible-section">
              <button className="section-header" onClick={() => toggleSection('aiInsights')}>
                <Brain size={20} />
                <span>AI ანალიზი და ინსაითები</span>
                {expandedSections.aiInsights ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.aiInsights && (
                <div className="section-content">
                  {/* Summary */}
                  {analysis.aiInsights.summary && (
                    <div className="insight-card summary">
                      <p>{analysis.aiInsights.summary}</p>
                    </div>
                  )}

                  {/* Growth Stage */}
                  {analysis.aiInsights.growthStage && (
                    <div className="insight-card growth-stage">
                      <ThermometerSun size={20} />
                      <div>
                        <span className="label">ზრდის ფაზა:</span>
                        <span className="value">{analysis.aiInsights.growthStage}</span>
                      </div>
                    </div>
                  )}

                  {/* Harvest Analysis */}
                  {analysis.aiInsights.harvestAnalysis && (
                    <div className="insight-card">
                      <h4><Target size={18} /> მოსავლის ანალიზი</h4>
                      <p>{analysis.aiInsights.harvestAnalysis.prediction}</p>
                      {analysis.aiInsights.harvestAnalysis.optimalHarvestTime && (
                        <p className="highlight">
                          <Calendar size={16} />
                          <strong>ოპტიმალური დრო:</strong> {analysis.aiInsights.harvestAnalysis.optimalHarvestTime}
                        </p>
                      )}
                      {analysis.aiInsights.harvestAnalysis.yieldOptimization?.length > 0 && (
                        <div className="optimization-tips">
                          <h5>მოსავლიანობის ოპტიმიზაცია:</h5>
                          <ul>
                            {analysis.aiInsights.harvestAnalysis.yieldOptimization.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Risk Analysis */}
                  {analysis.aiInsights.riskAnalysis && (
                    <div className="insight-card">
                      <h4><AlertTriangle size={18} /> რისკების ანალიზი</h4>
                      {analysis.aiInsights.riskAnalysis.primaryRisks?.length > 0 && (
                        <div className="primary-risks">
                          <h5>მთავარი რისკები:</h5>
                          <ul>
                            {analysis.aiInsights.riskAnalysis.primaryRisks.map((risk, idx) => (
                              <li key={idx}>{risk}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {analysis.aiInsights.riskAnalysis.mitigationStrategies?.length > 0 && (
                        <div className="mitigation">
                          <h5>რისკის შემცირების გზები:</h5>
                          <ul>
                            {analysis.aiInsights.riskAnalysis.mitigationStrategies.map((strategy, idx) => (
                              <li key={idx}>{strategy}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analysis.aiInsights?.recommendations && (
            <div className="collapsible-section">
              <button className="section-header" onClick={() => toggleSection('recommendations')}>
                <Lightbulb size={20} />
                <span>რეკომენდაციები</span>
                {expandedSections.recommendations ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {expandedSections.recommendations && (
                <div className="section-content">
                  <div className="recommendations-grid">
                    {/* Immediate */}
                    {analysis.aiInsights.recommendations.immediate?.length > 0 && (
                      <div className="recommendation-card immediate">
                        <div className="card-header">
                          <Shield size={20} />
                          <h4>გადაუდებელი</h4>
                        </div>
                        <ul>
                          {analysis.aiInsights.recommendations.immediate.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Short Term */}
                    {analysis.aiInsights.recommendations.shortTerm?.length > 0 && (
                      <div className="recommendation-card short-term">
                        <div className="card-header">
                          <Clock size={20} />
                          <h4>მოკლევადიანი</h4>
                        </div>
                        <ul>
                          {analysis.aiInsights.recommendations.shortTerm.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Long Term */}
                    {analysis.aiInsights.recommendations.longTerm?.length > 0 && (
                      <div className="recommendation-card long-term">
                        <div className="card-header">
                          <TrendingUp size={20} />
                          <h4>გრძელვადიანი</h4>
                        </div>
                        <ul>
                          {analysis.aiInsights.recommendations.longTerm.map((rec, idx) => (
                            <li key={idx}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* New Analysis Button */}
          <div className="analysis-actions">
            <button className="btn-new-analysis" onClick={() => {
              setAnalysis(null);
              setSelectedFieldId('');
            }}>
              <RefreshCw size={20} />
              <span>ახალი ანალიზი</span>
            </button>
          </div>
        </div>
      )}

      {/* Fields Overview (when no analysis is active) */}
      {!analysis && companySummary && companySummary.fields.length > 0 && (
        <div className="fields-overview">
          <h2>მინდვრების სტატუსი</h2>
          <div className="fields-table">
            <table>
              <thead>
                <tr>
                  <th>მინდორი</th>
                  <th>ფართობი</th>
                  <th>კულტურა</th>
                  <th>რისკი</th>
                  <th>პროგნოზი</th>
                  <th>ბოლო ანალიზი</th>
                </tr>
              </thead>
              <tbody>
                {companySummary.fields.map(field => (
                  <tr
                    key={field.fieldId}
                    onClick={() => setSelectedFieldId(field.fieldId)}
                    className={selectedFieldId === field.fieldId ? 'selected' : ''}
                  >
                    <td>{field.fieldName}</td>
                    <td>{field.fieldArea ? `${field.fieldArea} ჰა` : '-'}</td>
                    <td>{field.cropType || '-'}</td>
                    <td>
                      {field.latestAnalysis ? (
                        <span
                          className="risk-indicator"
                          style={{ backgroundColor: getRiskLevelColor(field.latestAnalysis.riskLevel) }}
                        >
                          {getRiskLevelText(field.latestAnalysis.riskLevel)}
                        </span>
                      ) : '-'}
                    </td>
                    <td>
                      {field.latestAnalysis?.predictedYield
                        ? `${Math.round(field.latestAnalysis.predictedYield).toLocaleString()} kg`
                        : '-'}
                    </td>
                    <td>
                      {field.latestAnalysis
                        ? formatDate(field.latestAnalysis.date)
                        : 'არ არის'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FieldAnalysisPage;
