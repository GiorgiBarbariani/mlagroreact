import { apiClient } from '../api/apiClient';

export interface WeatherStation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface WeatherData {
  temperature: number | null;
  humidity: number | null;
  precipitation: number | null;
  windSpeed: number | null;
  windDirection: number | null;
  pressure: number | null;
  solarRadiation: number | null;
  timestamp: string;
}

export interface ForecastData {
  date: string;
  temperatureMin: number;
  temperatureMax: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  windDirection?: number;
  description: string;
}

// Status types for weather metrics
export type MetricStatus = 'normal' | 'below' | 'above';

// Normal ranges for Georgian climate
const NORMAL_RANGES = {
  temperature: { min: 15, max: 25 },
  precipitation: { min: 0, max: 5 },
  humidity: { min: 40, max: 70 },
  solarRadiation: { min: 0.3, max: 0.7 },
  windSpeed: { min: 0, max: 5 }
};

export const getMetricStatus = (metric: string, value: number | null): MetricStatus => {
  if (value === null) return 'normal';

  const range = NORMAL_RANGES[metric as keyof typeof NORMAL_RANGES];
  if (!range) return 'normal';

  if (value < range.min) return 'below';
  if (value > range.max) return 'above';
  return 'normal';
};

export const getWindDirectionText = (degrees: number | null): string => {
  if (degrees === null) return '-';

  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};

export const getWindDirectionArrow = (degrees: number | null): string => {
  if (degrees === null) return '';

  // Rotate by 180 degrees because we show where wind is going TO, not FROM
  const adjusted = (degrees + 180) % 360;

  if (adjusted >= 337.5 || adjusted < 22.5) return '↑';
  if (adjusted >= 22.5 && adjusted < 67.5) return '↗';
  if (adjusted >= 67.5 && adjusted < 112.5) return '→';
  if (adjusted >= 112.5 && adjusted < 157.5) return '↘';
  if (adjusted >= 157.5 && adjusted < 202.5) return '↓';
  if (adjusted >= 202.5 && adjusted < 247.5) return '↙';
  if (adjusted >= 247.5 && adjusted < 292.5) return '←';
  if (adjusted >= 292.5 && adjusted < 337.5) return '↖';
  return '↓';
};

export const weatherService = {
  // Get all FieldClimate stations
  async getStations(): Promise<WeatherStation[]> {
    try {
      const response = await apiClient.get('/weather/fieldclimate/stations');
      const data = response.data;

      if (data.stations && Array.isArray(data.stations)) {
        return data.stations.map((station: any) => ({
          id: station.station_id || station.id,
          name: station.name || station.custom_name || `Station ${station.station_id}`,
          latitude: station.latitude,
          longitude: station.longitude,
          altitude: station.altitude || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching stations:', error);
      return [];
    }
  },

  // Get weather data by station ID
  async getStationData(stationId: string, fromDate?: string, toDate?: string): Promise<WeatherData> {
    try {
      const params: any = { stationId };
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const response = await apiClient.get('/weather/fieldclimate/station-data', { params });
      const data = response.data;

      if (data.data && Array.isArray(data.data) && data.data.length > 0) {
        const latest = data.data[data.data.length - 1];
        return {
          temperature: latest.temperature ?? latest['Air temperature'] ?? null,
          humidity: latest.humidity ?? latest['Relative humidity'] ?? null,
          precipitation: latest.precipitation ?? latest['Precipitation'] ?? 0,
          windSpeed: latest.wind_speed ?? latest['Wind speed'] ?? null,
          windDirection: latest.wind_direction ?? latest['Wind direction'] ?? null,
          pressure: latest.pressure ?? latest['Air pressure'] ?? null,
          solarRadiation: latest.solar_radiation ?? latest['Solar radiation'] ?? 0.5,
          timestamp: latest.time ? new Date(latest.time * 1000).toISOString() : new Date().toISOString()
        };
      }

      // Return mock data if no real data available
      return generateMockWeatherData();
    } catch (error) {
      console.error('Error fetching station data:', error);
      return generateMockWeatherData();
    }
  },

  // Get weather forecast by coordinates (uses FieldClimate)
  async getForecast(latitude: number, longitude: number): Promise<ForecastData[]> {
    try {
      const response = await apiClient.get('/weather/fieldclimate/forecast', {
        params: { latitude, longitude }
      });
      const data = response.data;

      if (data.forecast && Array.isArray(data.forecast)) {
        return data.forecast.map((item: any) => ({
          date: item.date,
          temperatureMin: item.temperature_min ?? item.temperatureMin ?? 10,
          temperatureMax: item.temperature_max ?? item.temperatureMax ?? 20,
          precipitation: item.precipitation ?? 0,
          humidity: item.humidity ?? 50,
          windSpeed: item.wind_speed ?? item.windSpeed ?? 0,
          windDirection: item.wind_direction ?? item.windDirection,
          description: item.description ?? getWeatherDescription(item)
        }));
      }
      return generateMockForecast();
    } catch (error) {
      console.error('Error fetching forecast:', error);
      return generateMockForecast();
    }
  },

  // Get current weather by coordinates
  async getWeatherByCoordinates(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      // First try to get forecast data which includes current conditions
      const response = await apiClient.get('/weather/fieldclimate/forecast', {
        params: { latitude, longitude }
      });
      const data = response.data;

      if (data.forecast && Array.isArray(data.forecast) && data.forecast.length > 0) {
        const today = data.forecast[0];
        return {
          temperature: today.temperature ?? ((today.temperature_min + today.temperature_max) / 2) ?? null,
          humidity: today.humidity ?? null,
          precipitation: today.precipitation ?? 0,
          windSpeed: today.wind_speed ?? today.windSpeed ?? null,
          windDirection: today.wind_direction ?? today.windDirection ?? null,
          pressure: today.pressure ?? null,
          solarRadiation: today.solar_radiation ?? 0.5,
          timestamp: new Date().toISOString()
        };
      }

      return generateMockWeatherData();
    } catch (error) {
      console.error('Error fetching weather by coordinates:', error);
      return generateMockWeatherData();
    }
  },

  // Find nearest station to coordinates
  findNearestStation(latitude: number, longitude: number, stations: WeatherStation[]): WeatherStation | null {
    if (!stations || stations.length === 0) return null;

    let nearest: WeatherStation | null = null;
    let minDistance = Infinity;

    stations.forEach(station => {
      const distance = calculateDistance(latitude, longitude, station.latitude, station.longitude);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = station;
      }
    });

    return nearest;
  }
};

// Helper: Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return value * Math.PI / 180;
}

// Helper: Get weather description
function getWeatherDescription(data: any): string {
  if (data.precipitation > 10) return 'წვიმიანი';
  if (data.precipitation > 0) return 'მცირე წვიმა';
  if (data.humidity > 80) return 'მოღრუბლული';
  if (data.humidity > 50) return 'ნაწილობრივ მოღრუბლული';
  return 'მზიანი';
}

// Generate mock weather data for fallback
function generateMockWeatherData(): WeatherData {
  return {
    temperature: 20 + Math.random() * 10,
    humidity: 60 + Math.random() * 20,
    precipitation: Math.random() * 5,
    windSpeed: 2 + Math.random() * 5,
    windDirection: Math.random() * 360,
    pressure: 1010 + Math.random() * 10,
    solarRadiation: 0.3 + Math.random() * 0.5,
    timestamp: new Date().toISOString()
  };
}

// Generate mock forecast data
function generateMockForecast(): ForecastData[] {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return {
      date: date.toISOString(),
      temperatureMin: 12 + Math.random() * 5,
      temperatureMax: 22 + Math.random() * 8,
      precipitation: Math.random() * 10,
      humidity: 50 + Math.random() * 30,
      windSpeed: 2 + Math.random() * 6,
      windDirection: Math.random() * 360,
      description: ['მზიანი', 'ნაწილობრივ მოღრუბლული', 'მოღრუბლული', 'წვიმიანი'][Math.floor(Math.random() * 4)]
    };
  });
}

export default weatherService;
