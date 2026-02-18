import { apiClient } from '../api/apiClient';

// Types for satellite data responses
export interface IndexPoint {
  latitude: number;
  longitude: number;
  value: number;
  ndvi?: number;
  ndmi?: number;
  msavi?: number;
  gndvi?: number;
  reci?: number;
}

export interface NdviPoint {
  lat: number;
  lng: number;
  ndvi: number;
  date: string;
}

export interface SatelliteIndexData {
  fieldId: string;
  indexType: string;
  points: NdviPoint[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
  date: string;
  source: string;
}

export interface SatelliteImageInfo {
  date: string;
  cloudCover: number;
  source: string;
  available: boolean;
  imageUrl?: string;
}

export interface FieldSatelliteData {
  fieldId: string;
  ndvi: number;
  ndmi: number;
  msavi: number;
  ndre: number;
  gndvi: number;
  moisture: number;
  temperature: number;
  cloudCover: number;
  healthIndex: number;
  lastUpdated: string;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

class SatelliteService {
  /**
   * Get NDVI points for a field
   * Uses the Copernicus/Sentinel-2 integration in the backend
   * Endpoint: GET /api/cropMonitoring/NdviPoint/GetByFieldId?fieldId=xxx
   */
  async getNdviPoints(fieldId: string): Promise<IndexPoint[]> {
    try {
      const url = `/cropMonitoring/NdviPoint/GetByFieldId?fieldId=${fieldId}`;
      const response = await apiClient.get(url);
      // Backend returns array of points directly
      if (Array.isArray(response.data)) {
        return response.data.map((p: any) => {
          // Handle nested Point object format from backend
          // Format: { Point: { latitude, longitude, X, Y }, Value, Ndvi }
          const point = p.Point || p.point || p;
          const lat = point.latitude ?? point.lat ?? point.Y ?? point.y;
          const lng = point.longitude ?? point.lng ?? point.X ?? point.x;
          const value = p.Value ?? p.value ?? p.Ndvi ?? p.ndvi ?? 0;

          return {
            latitude: lat,
            longitude: lng,
            value: value
          };
        }).filter((p: IndexPoint) => p.latitude != null && p.longitude != null);
      }
      return [];
    } catch (error) {
      console.error('Error fetching NDVI points:', error);
      return [];
    }
  }

  /**
   * Get NDVI image overlay URL for a field
   * Returns a PNG image that can be overlaid on the map
   * Endpoint: GET /api/cropMonitoring/NdviImage/GetByFieldId?fieldId=xxx
   */
  async getNdviImageUrl(fieldId: string): Promise<string | null> {
    try {
      const url = `/cropMonitoring/NdviImage/GetByFieldId?fieldId=${fieldId}`;
      const response = await apiClient.get(url, { responseType: 'blob' });
      // Create blob URL for the image
      const blob = new Blob([response.data], { type: 'image/png' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error('Error fetching NDVI image:', error);
      return null;
    }
  }

  /**
   * Get index points for a field (array of lat/lng/value)
   * These can be used to show values on hover
   * Endpoint: GET /api/cropMonitoring/:indexType/GetByFieldId?fieldId=xxx
   */
  async getIndexPoints(fieldId: string, indexType: string = 'ndvi'): Promise<IndexPoint[]> {
    try {
      // Map index type to correct endpoint name
      const indexMap: Record<string, string> = {
        'ndvi': 'NdviPoint',
        'ndmi': 'NdmiPoint',
        'msavi': 'MsaviPoint',
        'gndvi': 'GndviPoint',
        'ndre': 'NdrePoint',
        'reci': 'ReciPoint'
      };

      const endpointName = indexMap[indexType.toLowerCase()] || `${indexType.charAt(0).toUpperCase() + indexType.slice(1)}Point`;
      const url = `/cropMonitoring/${endpointName}/GetByFieldId?fieldId=${fieldId}`;

      const response = await apiClient.get(url);
      console.log(`Raw ${indexType} points response:`, response.data);

      // Backend returns array of points directly
      if (Array.isArray(response.data)) {
        const parsedPoints = response.data.map((p: any) => {
          // Handle nested Point object format from backend
          // Format: { Point: { latitude, longitude, X, Y }, Value, Ndvi/Ndmi/etc }
          const point = p.Point || p.point || p;
          const lat = point.latitude ?? point.lat ?? point.Y ?? point.y;
          const lng = point.longitude ?? point.lng ?? point.X ?? point.x;
          // Try different value field names
          const value = p.Value ?? p.value ?? p[indexType] ?? p[indexType.toUpperCase()] ??
                       p[indexType.charAt(0).toUpperCase() + indexType.slice(1)] ?? 0;

          return {
            latitude: lat,
            longitude: lng,
            value: value
          };
        }).filter((p: IndexPoint) => p.latitude != null && p.longitude != null);

        console.log(`Parsed ${indexType} points:`, parsedPoints.slice(0, 5));
        return parsedPoints;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching ${indexType} points:`, error);
      return [];
    }
  }

  /**
   * Get any vegetation index image overlay for a field
   * Supported indices: ndvi, ndmi, msavi, ndre, gndvi
   * Endpoint: GET /api/cropMonitoring/:indexType/Image/GetByFieldId?fieldId=xxx
   */
  async getIndexImageUrl(fieldId: string, indexType: string, _date?: string): Promise<string | null> {
    try {
      // Map index type to correct endpoint name
      const indexMap: Record<string, string> = {
        'ndvi': 'NdviImage',
        'ndmi': 'NdmiImage',
        'msavi': 'MsaviImage',
        'gndvi': 'GndviImage',
        'ndre': 'NdreImage',
        'reci': 'ReciImage'
      };

      const endpointName = indexMap[indexType.toLowerCase()] || `${indexType.charAt(0).toUpperCase() + indexType.slice(1)}Image`;
      const url = `/cropMonitoring/${endpointName}/GetByFieldId?fieldId=${fieldId}`;

      const response = await apiClient.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'image/png' });
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error(`Error fetching ${indexType} image:`, error);
      return null;
    }
  }

  /**
   * Get all satellite indices for a field
   * Fetches NDVI points and calculates statistics
   */
  async getFieldIndices(fieldId: string): Promise<FieldSatelliteData | null> {
    try {
      // Get NDVI points and calculate statistics
      const ndviPoints = await this.getNdviPoints(fieldId);

      if (ndviPoints && ndviPoints.length > 0) {
        const values = ndviPoints.map(p => p.value);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;

        return {
          fieldId,
          ndvi: mean,
          ndmi: 0,
          msavi: 0,
          ndre: 0,
          gndvi: 0,
          moisture: mean * 100, // Estimate from NDVI
          temperature: 20,
          cloudCover: 0,
          healthIndex: this.calculateHealthIndex(mean),
          lastUpdated: new Date().toISOString()
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching field indices:', error);
      return null;
    }
  }

  /**
   * Get time series data for a specific index
   * Endpoint: POST /api/satellite/time-series
   */
  async getTimeSeries(
    fieldId: string,
    indexType: string,
    startDate: string,
    endDate: string
  ): Promise<TimeSeriesDataPoint[]> {
    try {
      const url = `/satellite/time-series`;
      const response = await apiClient.post(url, {
        fieldId,
        index: indexType.toUpperCase(),
        dateFrom: startDate,
        dateTo: endDate
      });

      // Backend returns { series: [...] }
      if (response.data && response.data.series) {
        return response.data.series.map((item: any) => ({
          date: item.date,
          value: item.value
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching time series:', error);
      return [];
    }
  }

  /**
   * Get available satellite images for a field in date range
   */
  async getAvailableImages(
    fieldId: string,
    startDate: string,
    endDate: string
  ): Promise<SatelliteImageInfo[]> {
    try {
      const url = `/satellite/available-images?fieldId=${fieldId}&startDate=${startDate}&endDate=${endDate}`;
      const response = await apiClient.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching available images:', error);
      return [];
    }
  }

  /**
   * Calculate vegetation health based on NDVI value
   */
  calculateHealthIndex(ndvi: number): number {
    // NDVI ranges from -1 to 1
    // Healthy vegetation: 0.6 - 1.0
    // Moderate vegetation: 0.3 - 0.6
    // Sparse vegetation: 0.1 - 0.3
    // Bare soil: 0 - 0.1
    // Water/Snow: negative values

    if (ndvi < 0) return 0;
    if (ndvi > 1) return 100;

    // Map NDVI 0-1 to health index 0-100
    // Using a non-linear scale that emphasizes higher NDVI values
    return Math.round(Math.pow(ndvi, 0.7) * 100);
  }

  /**
   * Get health status label from health index
   */
  getHealthStatus(healthIndex: number): { status: string; statusKa: string; color: string } {
    if (healthIndex >= 80) {
      return { status: 'Excellent', statusKa: 'შესანიშნავი', color: '#4CAF50' };
    }
    if (healthIndex >= 60) {
      return { status: 'Good', statusKa: 'კარგი', color: '#8BC34A' };
    }
    if (healthIndex >= 40) {
      return { status: 'Moderate', statusKa: 'საშუალო', color: '#FFC107' };
    }
    if (healthIndex >= 20) {
      return { status: 'Poor', statusKa: 'დაბალი', color: '#FF9800' };
    }
    return { status: 'Critical', statusKa: 'კრიტიკული', color: '#F44336' };
  }
}

export const satelliteService = new SatelliteService();
