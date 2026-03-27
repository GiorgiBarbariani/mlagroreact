import { apiClient } from '../api/apiClient';

// Types for field analysis
export interface RiskFactor {
  score: number;
  level: 'low' | 'medium' | 'high';
  factors: string[];
}

export interface RiskAnalysis {
  weather: RiskFactor;
  water: RiskFactor;
  nutrient: RiskFactor;
  disease: RiskFactor;
  overall: {
    score: number;
    level: 'low' | 'medium' | 'high';
  };
}

export interface HarvestPrediction {
  estimatedYield: number | null;
  yieldUnit: string;
  confidence: number;
  factors: string[];
  comparisonToAverage: {
    historicalAverage: number;
    difference: number;
  } | null;
}

export interface AIInsights {
  summary?: string;
  harvestAnalysis?: {
    prediction: string;
    optimalHarvestTime: string;
    yieldOptimization: string[];
  };
  riskAnalysis?: {
    primaryRisks: string[];
    mitigationStrategies: string[];
  };
  recommendations?: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  healthScore?: number;
  growthStage?: string;
  error?: boolean;
  message?: string;
}

export interface FieldAnalysisResult {
  fieldId: string;
  fieldName: string;
  analysisDate: string;
  fieldInfo: {
    area: number | null;
    cropType: string | null;
    soilType: string | null;
    irrigationType: string | null;
    plantingDate: string | null;
  };
  cropInfo: {
    name: string;
    optimalTemperature: number;
    growthDuration: number;
    yieldPotential: number;
  } | null;
  risks: RiskAnalysis;
  prediction: HarvestPrediction;
  aiInsights: AIInsights | null;
  historicalData: {
    harvestCount: number;
    irrigationCount: number;
    fertilizerCount: number;
  };
  analysisId: string;
}

export interface FieldAnalysisSummary {
  fieldId: string;
  fieldName: string;
  fieldArea: number | null;
  cropType: string | null;
  latestAnalysis: {
    date: string;
    riskLevel: string;
    riskScore: number;
    predictedYield: number | null;
    confidence: number;
  } | null;
}

export interface CompanyAnalysisSummary {
  fields: FieldAnalysisSummary[];
  summary: {
    totalFields: number;
    analyzedFields: number;
    highRiskFields: number;
    mediumRiskFields: number;
    lowRiskFields: number;
    totalPredictedYield: number;
  };
}

export interface AnalysisHistoryItem {
  id: string;
  fieldId: string;
  companyId: string;
  analysisType: string;
  riskScore: number;
  riskLevel: string;
  predictedYield: number | null;
  confidence: number | null;
  weatherRisk: number | null;
  waterRisk: number | null;
  nutrientRisk: number | null;
  diseaseRisk: number | null;
  aiInsights: AIInsights | null;
  riskFactors: any;
  predictionFactors: string[];
  healthScore: number | null;
  growthStage: string | null;
  date: string;
}

// Raw API response type (Pascal case)
interface RawAnalysisHistoryItem {
  Id: string;
  FieldId: string;
  CompanyId: string;
  AnalysisType: string;
  RiskScore: number;
  RiskLevel: string;
  PredictedYield: number | null;
  PredictionConfidence: number | null;
  WeatherRiskScore: number | null;
  WaterRiskScore: number | null;
  NutrientRiskScore: number | null;
  DiseaseRiskScore: number | null;
  AIInsights: AIInsights | null;
  RiskFactors: any;
  PredictionFactors: string[];
  HealthScore: number | null;
  GrowthStage: string | null;
  CreatedAt: string;
}

// Normalize API response to camelCase
const normalizeHistoryItem = (item: RawAnalysisHistoryItem): AnalysisHistoryItem => ({
  id: item.Id,
  fieldId: item.FieldId,
  companyId: item.CompanyId,
  analysisType: item.AnalysisType,
  riskScore: item.RiskScore,
  riskLevel: item.RiskLevel,
  predictedYield: item.PredictedYield,
  confidence: item.PredictionConfidence,
  weatherRisk: item.WeatherRiskScore,
  waterRisk: item.WaterRiskScore,
  nutrientRisk: item.NutrientRiskScore,
  diseaseRisk: item.DiseaseRiskScore,
  aiInsights: item.AIInsights,
  riskFactors: item.RiskFactors,
  predictionFactors: item.PredictionFactors || [],
  healthScore: item.HealthScore,
  growthStage: item.GrowthStage,
  date: item.CreatedAt
});

export const fieldAnalysisService = {
  /**
   * Perform comprehensive AI analysis on a field
   */
  async analyzeField(fieldId: string, companyId: string): Promise<FieldAnalysisResult> {
    const response = await apiClient.post<{ success: boolean; data: FieldAnalysisResult }>(
      `/field-analysis/analyze/${fieldId}`,
      { companyId }
    );
    return response.data?.data || response.data;
  },

  /**
   * Get analysis history for a field
   */
  async getAnalysisHistory(fieldId: string, companyId: string, limit = 10): Promise<AnalysisHistoryItem[]> {
    const response = await apiClient.get<{ success: boolean; data: RawAnalysisHistoryItem[] }>(
      `/field-analysis/history/${fieldId}?companyId=${companyId}&limit=${limit}`
    );
    const data = response.data?.data || response.data || [];
    const rawItems = Array.isArray(data) ? data : [];
    return rawItems.map(normalizeHistoryItem);
  },

  /**
   * Get latest analysis summary for all company fields
   */
  async getCompanyAnalysis(companyId: string): Promise<CompanyAnalysisSummary> {
    const response = await apiClient.get<{ success: boolean; data: CompanyAnalysisSummary }>(
      `/field-analysis/company/${companyId}`
    );
    return response.data?.data || response.data;
  },

  /**
   * Get quick risk assessment without full AI analysis
   */
  async getQuickRiskAssessment(fieldId: string, companyId: string): Promise<{
    fieldId: string;
    fieldName: string;
    risks: RiskAnalysis;
    timestamp: string;
  }> {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      `/field-analysis/quick-risk/${fieldId}`,
      { companyId }
    );
    return response.data?.data || response.data;
  },

  /**
   * Analyze multiple fields in batch
   */
  async batchAnalyze(fieldIds: string[], companyId: string): Promise<{
    total: number;
    successful: number;
    failed: number;
    analyses: Array<{
      fieldId: string;
      success: boolean;
      data: FieldAnalysisResult | null;
      error: string | null;
    }>;
  }> {
    const response = await apiClient.post<{ success: boolean; data: any }>(
      '/field-analysis/batch',
      { fieldIds, companyId }
    );
    return response.data?.data || response.data;
  }
};
