// Georgia's administrative regions (მხარეები) GeoJSON data
export interface RegionProperties {
  name: string;
  nameKa: string;
  code: string;
  capital: string;
  capitalKa: string;
}

export const georgiaRegionsGeoJSON: GeoJSON.FeatureCollection<GeoJSON.Polygon, RegionProperties> = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: {
        name: "Tbilisi",
        nameKa: "თბილისი",
        code: "TB",
        capital: "Tbilisi",
        capitalKa: "თბილისი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [44.65, 41.82],
          [44.95, 41.82],
          [44.95, 41.62],
          [44.65, 41.62],
          [44.65, 41.82]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Adjara",
        nameKa: "აჭარა",
        code: "AJ",
        capital: "Batumi",
        capitalKa: "ბათუმი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [41.35, 41.95],
          [41.60, 41.95],
          [41.85, 41.85],
          [42.15, 41.80],
          [42.50, 41.65],
          [42.55, 41.45],
          [42.35, 41.35],
          [42.00, 41.40],
          [41.70, 41.50],
          [41.45, 41.55],
          [41.35, 41.70],
          [41.35, 41.95]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Guria",
        nameKa: "გურია",
        code: "GU",
        capital: "Ozurgeti",
        capitalKa: "ოზურგეთი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [41.70, 42.20],
          [42.15, 42.25],
          [42.50, 42.15],
          [42.55, 41.95],
          [42.50, 41.65],
          [42.15, 41.80],
          [41.85, 41.85],
          [41.70, 42.00],
          [41.70, 42.20]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Imereti",
        nameKa: "იმერეთი",
        code: "IM",
        capital: "Kutaisi",
        capitalKa: "ქუთაისი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [42.15, 42.60],
          [42.70, 42.65],
          [43.20, 42.55],
          [43.65, 42.35],
          [43.80, 42.10],
          [43.60, 41.95],
          [43.20, 41.95],
          [42.80, 42.00],
          [42.55, 41.95],
          [42.50, 42.15],
          [42.15, 42.25],
          [42.15, 42.60]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Kakheti",
        nameKa: "კახეთი",
        code: "KA",
        capital: "Telavi",
        capitalKa: "თელავი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [44.95, 42.35],
          [45.40, 42.30],
          [46.00, 42.00],
          [46.45, 41.90],
          [46.70, 41.55],
          [46.45, 41.25],
          [46.00, 41.15],
          [45.60, 41.20],
          [45.20, 41.35],
          [44.95, 41.50],
          [44.95, 41.82],
          [45.10, 42.00],
          [44.95, 42.35]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Kvemo Kartli",
        nameKa: "ქვემო ქართლი",
        code: "KK",
        capital: "Rustavi",
        capitalKa: "რუსთავი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [43.85, 41.75],
          [44.30, 41.75],
          [44.65, 41.62],
          [44.95, 41.50],
          [45.20, 41.35],
          [45.10, 41.10],
          [44.70, 41.00],
          [44.15, 41.10],
          [43.70, 41.25],
          [43.50, 41.45],
          [43.60, 41.65],
          [43.85, 41.75]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Mtskheta-Mtianeti",
        nameKa: "მცხეთა-მთიანეთი",
        code: "MM",
        capital: "Mtskheta",
        capitalKa: "მცხეთა"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [44.30, 42.55],
          [44.80, 42.70],
          [45.20, 42.60],
          [45.10, 42.25],
          [44.95, 42.00],
          [44.95, 41.82],
          [44.65, 41.82],
          [44.30, 41.90],
          [44.05, 42.05],
          [44.05, 42.35],
          [44.30, 42.55]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Racha-Lechkhumi and Kvemo Svaneti",
        nameKa: "რაჭა-ლეჩხუმი და ქვემო სვანეთი",
        code: "RL",
        capital: "Ambrolauri",
        capitalKa: "ამბროლაური"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [42.45, 43.00],
          [43.00, 43.05],
          [43.50, 42.90],
          [43.80, 42.70],
          [43.65, 42.35],
          [43.20, 42.55],
          [42.70, 42.65],
          [42.45, 42.75],
          [42.45, 43.00]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Samegrelo-Zemo Svaneti",
        nameKa: "სამეგრელო-ზემო სვანეთი",
        code: "SZ",
        capital: "Zugdidi",
        capitalKa: "ზუგდიდი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [41.55, 42.85],
          [42.00, 43.20],
          [42.50, 43.30],
          [43.00, 43.05],
          [42.45, 43.00],
          [42.45, 42.75],
          [42.15, 42.60],
          [41.70, 42.55],
          [41.55, 42.65],
          [41.55, 42.85]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Samtskhe-Javakheti",
        nameKa: "სამცხე-ჯავახეთი",
        code: "SJ",
        capital: "Akhaltsikhe",
        capitalKa: "ახალციხე"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [42.55, 41.95],
          [42.80, 42.00],
          [43.20, 41.95],
          [43.60, 41.95],
          [43.85, 41.75],
          [43.60, 41.65],
          [43.50, 41.45],
          [43.70, 41.25],
          [43.55, 41.05],
          [43.05, 41.10],
          [42.75, 41.25],
          [42.55, 41.45],
          [42.55, 41.65],
          [42.55, 41.95]
        ]]
      }
    },
    {
      type: "Feature",
      properties: {
        name: "Shida Kartli",
        nameKa: "შიდა ქართლი",
        code: "SK",
        capital: "Gori",
        capitalKa: "გორი"
      },
      geometry: {
        type: "Polygon",
        coordinates: [[
          [43.60, 42.35],
          [44.05, 42.35],
          [44.30, 42.20],
          [44.30, 41.90],
          [44.65, 41.82],
          [44.65, 41.62],
          [44.30, 41.75],
          [43.85, 41.75],
          [43.60, 41.95],
          [43.80, 42.10],
          [43.60, 42.35]
        ]]
      }
    }
  ]
};

// Region colors for visual distinction
export const regionColors: Record<string, string> = {
  TB: '#E53935', // Tbilisi - Red
  AJ: '#1E88E5', // Adjara - Blue
  GU: '#43A047', // Guria - Green
  IM: '#FB8C00', // Imereti - Orange
  KA: '#8E24AA', // Kakheti - Purple
  KK: '#00ACC1', // Kvemo Kartli - Cyan
  MM: '#7CB342', // Mtskheta-Mtianeti - Light Green
  RL: '#F4511E', // Racha-Lechkhumi - Deep Orange
  SZ: '#3949AB', // Samegrelo-Zemo Svaneti - Indigo
  SJ: '#D81B60', // Samtskhe-Javakheti - Pink
  SK: '#FFB300'  // Shida Kartli - Amber
};

// Get color by region code
export const getRegionColor = (code: string): string => {
  return regionColors[code] || '#757575';
};
