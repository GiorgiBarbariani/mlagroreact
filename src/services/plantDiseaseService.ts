import { apiClient } from '../api/apiClient';

export interface PlantDiseaseAnalysis {
  isPlant: boolean;
  plantIdentified?: string;
  healthStatus: 'healthy' | 'diseased' | 'stressed' | 'unknown';
  diseaseDetected: boolean;
  diseaseName?: string | null;
  diseaseNameKa?: string | null;
  confidence: number;
  symptoms?: string[];
  severity?: 'mild' | 'moderate' | 'severe' | 'critical' | null;
  possibleCauses?: string[];
  recommendations?: string[];
  preventionTips?: string[];
  additionalNotes?: string;
  rawAnalysis?: string;
  parseError?: boolean;
}

export interface PlantDiseaseResponse {
  success: boolean;
  analysis: PlantDiseaseAnalysis;
  imageInfo: {
    fileName: string;
    fileSize: number;
    mimeType: string;
  };
  timestamp: string;
}

export const plantDiseaseService = {
  async analyzeImage(imageFile: File): Promise<PlantDiseaseResponse> {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await apiClient.post<PlantDiseaseResponse>(
      '/plant-disease/analyze',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  },

  async getHistory(): Promise<any[]> {
    const response = await apiClient.get('/plant-disease/history');
    return response.data.history || [];
  },
};
