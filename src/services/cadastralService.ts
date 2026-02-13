import axios from 'axios';

interface CadastralParcel {
  cadastralCode: string;
  area: number;
  geometry: any;
  owner?: string;
  landUse?: string;
  municipality?: string;
  village?: string;
  coordinates?: number[][];
}

interface CadastralSearchOptions {
  bbox?: string; // Bounding box: minX,minY,maxX,maxY
  cadastralCode?: string;
  municipality?: string;
  limit?: number;
}

class CadastralService {
  private baseUrl = 'https://maps.gov.ge/geoserver/napr';

  /**
   * Search for cadastral parcels by code
   */
  async searchByCadastralCode(code: string): Promise<CadastralParcel | null> {
    try {
      const url = `${this.baseUrl}/wfs`;
      const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'napr:cadastral_parcels',
        outputFormat: 'application/json',
        CQL_FILTER: `cadastral_code='${code}'`
      };

      const response = await axios.get(url, { params });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return this.parseFeature(feature);
      }

      return null;
    } catch (error) {
      // Silently fail - external cadastral API may be unavailable or blocked by CORS
      return null;
    }
  }

  /**
   * Get cadastral parcels within a bounding box
   */
  async getParcelsByBoundingBox(
    minLng: number,
    minLat: number,
    maxLng: number,
    maxLat: number,
    limit: number = 100
  ): Promise<CadastralParcel[]> {
    try {
      const bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
      const url = `${this.baseUrl}/wfs`;
      const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'napr:cadastral_parcels',
        outputFormat: 'application/json',
        bbox: `${bbox},EPSG:4326`,
        maxFeatures: limit
      };

      const response = await axios.get(url, { params });

      if (response.data.features) {
        return response.data.features.map((f: any) => this.parseFeature(f));
      }

      return [];
    } catch (error) {
      // Silently fail - external cadastral API may be unavailable or blocked by CORS
      return [];
    }
  }

  /**
   * Get cadastral parcel at specific coordinates
   */
  async getParcelAtLocation(lat: number, lng: number): Promise<CadastralParcel | null> {
    try {
      // Create a small bounding box around the point
      const buffer = 0.0001; // About 11 meters
      const bbox = `${lng - buffer},${lat - buffer},${lng + buffer},${lat + buffer}`;

      const url = `${this.baseUrl}/wfs`;
      const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'napr:cadastral_parcels',
        outputFormat: 'application/json',
        bbox: `${bbox},EPSG:4326`,
        maxFeatures: 1
      };

      const response = await axios.get(url, { params });

      if (response.data.features && response.data.features.length > 0) {
        const feature = response.data.features[0];
        return this.parseFeature(feature);
      }

      return null;
    } catch (error) {
      // Silently fail - external cadastral API may be unavailable or blocked by CORS
      return null;
    }
  }

  /**
   * Get all cadastral codes in a municipality
   */
  async getParcelsByMunicipality(municipalityName: string, limit: number = 1000): Promise<CadastralParcel[]> {
    try {
      const url = `${this.baseUrl}/wfs`;
      const params = {
        service: 'WFS',
        version: '1.0.0',
        request: 'GetFeature',
        typeName: 'napr:cadastral_parcels',
        outputFormat: 'application/json',
        CQL_FILTER: `municipality='${municipalityName}'`,
        maxFeatures: limit
      };

      const response = await axios.get(url, { params });

      if (response.data.features) {
        return response.data.features.map((f: any) => this.parseFeature(f));
      }

      return [];
    } catch (error) {
      // Silently fail - external cadastral API may be unavailable or blocked by CORS
      return [];
    }
  }

  /**
   * Batch fetch cadastral data for multiple codes
   */
  async batchFetchCadastralData(codes: string[]): Promise<Map<string, CadastralParcel>> {
    const results = new Map<string, CadastralParcel>();

    // Process in batches to avoid overwhelming the server
    const batchSize = 10;
    for (let i = 0; i < codes.length; i += batchSize) {
      const batch = codes.slice(i, i + batchSize);
      const promises = batch.map(code => this.searchByCadastralCode(code));

      try {
        const batchResults = await Promise.all(promises);
        batchResults.forEach((result, index) => {
          if (result) {
            results.set(batch[index], result);
          }
        });

        // Add a small delay between batches
        if (i + batchSize < codes.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        // Silently fail batch processing
      }
    }

    return results;
  }

  /**
   * Get cadastral layer as WMS tile URL for map overlay
   */
  getCadastralWMSUrl(): string {
    return `${this.baseUrl}/wms`;
  }

  /**
   * Get cadastral layer parameters for WMS
   */
  getCadastralWMSParams() {
    return {
      layers: 'napr:cadastral_parcels',
      format: 'image/png',
      transparent: true,
      version: '1.1.0',
      srs: 'EPSG:4326'
    };
  }

  /**
   * Parse GeoJSON feature to CadastralParcel
   */
  private parseFeature(feature: any): CadastralParcel {
    const properties = feature.properties || {};
    const geometry = feature.geometry;

    // Extract coordinates from geometry
    let coordinates: number[][] = [];
    if (geometry && geometry.type === 'Polygon' && geometry.coordinates) {
      coordinates = geometry.coordinates[0];
    } else if (geometry && geometry.type === 'MultiPolygon' && geometry.coordinates) {
      coordinates = geometry.coordinates[0][0];
    }

    // Calculate area if not provided (area in square meters)
    let area = properties.area || 0;
    if (!area && coordinates.length > 0) {
      area = this.calculatePolygonArea(coordinates);
    }

    return {
      cadastralCode: properties.cadastral_code || properties.cad_code || '',
      area: area,
      geometry: geometry,
      owner: properties.owner || '',
      landUse: properties.land_use || properties.usage || '',
      municipality: properties.municipality || properties.mun_name || '',
      village: properties.village || properties.settlement || '',
      coordinates: coordinates
    };
  }

  /**
   * Calculate polygon area using Shoelace formula
   */
  private calculatePolygonArea(coordinates: number[][]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [x1, y1] = coordinates[i];
      const [x2, y2] = coordinates[i + 1];

      // Convert to meters using approximate conversion
      const lat = (y1 + y2) / 2;
      const mPerDegLat = 111320;
      const mPerDegLng = mPerDegLat * Math.cos(lat * Math.PI / 180);

      area += (x1 * mPerDegLng) * (y2 * mPerDegLat) - (x2 * mPerDegLng) * (y1 * mPerDegLat);
    }

    return Math.abs(area / 2);
  }

  /**
   * Export cadastral data to various formats
   */
  exportToGeoJSON(parcels: CadastralParcel[]): string {
    const features = parcels.map(parcel => ({
      type: 'Feature',
      properties: {
        cadastralCode: parcel.cadastralCode,
        area: parcel.area,
        owner: parcel.owner,
        landUse: parcel.landUse,
        municipality: parcel.municipality,
        village: parcel.village
      },
      geometry: parcel.geometry
    }));

    return JSON.stringify({
      type: 'FeatureCollection',
      features: features
    }, null, 2);
  }

  exportToCSV(parcels: CadastralParcel[]): string {
    const headers = ['Cadastral Code', 'Area (m²)', 'Area (ha)', 'Municipality', 'Village', 'Land Use', 'Owner'];
    const rows = parcels.map(p => [
      p.cadastralCode,
      p.area.toFixed(2),
      (p.area / 10000).toFixed(4),
      p.municipality || '',
      p.village || '',
      p.landUse || '',
      p.owner || ''
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
  }

  /**
   * Validate cadastral code format
   */
  validateCadastralCode(code: string): boolean {
    // Georgian cadastral code format: XX.XX.XX.XXX
    const pattern = /^\d{2}\.\d{2}\.\d{2}\.\d{3}$/;
    return pattern.test(code);
  }

  /**
   * Format cadastral code
   */
  formatCadastralCode(code: string): string {
    // Remove all non-digits
    const digits = code.replace(/\D/g, '');

    // Format as XX.XX.XX.XXX
    if (digits.length >= 10) {
      return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 6)}.${digits.slice(6, 9)}`;
    }

    return code;
  }
}

export const cadastralService = new CadastralService();
export type { CadastralParcel, CadastralSearchOptions };