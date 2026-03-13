import React, { useState, useEffect, useRef } from 'react';
import {
  Satellite,
  Map,
  Layers,
  Calendar,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
  Droplets,
  Leaf,
  TrendingUp,
  Eye,
  EyeOff,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Thermometer,
  Cloud,
  AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeafletMap, { type LeafletMapRef } from '../../components/LeafletMap/LeafletMap';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { satelliteService, type TimeSeriesDataPoint, type IndexPoint, type HighResolutionOptions } from '../../services/satelliteService';
import './SatelliteDataPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  coordinates: string;
  polygonData?: any;
}

interface SatelliteLayer {
  id: string;
  name: string;
  nameKa: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string[];
  unit: string;
  minValue: number;
  maxValue: number;
}

interface SatelliteImage {
  date: string;
  cloudCover: number;
  source: string;
  available: boolean;
}

interface IndexDataPoint {
  date: string;
  value: number;
}

interface FieldStats {
  currentValue: number;
  previousValue: number;
  change: number;
  min: number;
  max: number;
  mean: number;
}

interface SatelliteData {
  ndvi: number;
  moisture: number;
  temperature: number;
  cloudCover: number;
  healthIndex: number;
}

const satelliteLayers: SatelliteLayer[] = [
  {
    id: 'ndvi',
    name: 'NDVI',
    nameKa: 'ვეგეტაციის ინდექსი',
    description: 'Normalized Difference Vegetation Index',
    icon: <Leaf size={18} />,
    color: '#4CAF50',
    gradient: ['#8B4513', '#CD853F', '#F4A460', '#FFFF00', '#ADFF2F', '#32CD32', '#228B22', '#006400'],
    unit: '',
    minValue: -1,
    maxValue: 1
  },
  {
    id: 'msavi',
    name: 'MSAVI',
    nameKa: 'მოდიფიცირებული SAVI',
    description: 'Modified Soil Adjusted Vegetation Index',
    icon: <Leaf size={18} />,
    color: '#8BC34A',
    gradient: ['#8B4513', '#DEB887', '#F0E68C', '#98FB98', '#32CD32', '#228B22'],
    unit: '',
    minValue: -1,
    maxValue: 1
  },
  {
    id: 'ndmi',
    name: 'NDMI',
    nameKa: 'ტენიანობის ინდექსი',
    description: 'Normalized Difference Moisture Index',
    icon: <Droplets size={18} />,
    color: '#2196F3',
    gradient: ['#8B4513', '#DEB887', '#87CEEB', '#4169E1', '#00008B'],
    unit: '',
    minValue: -1,
    maxValue: 1
  },
  {
    id: 'ndre',
    name: 'NDRE',
    nameKa: 'წითელი კიდის ინდექსი',
    description: 'Normalized Difference Red Edge',
    icon: <TrendingUp size={18} />,
    color: '#9C27B0',
    gradient: ['#4A148C', '#7B1FA2', '#AB47BC', '#CE93D8', '#E1BEE7'],
    unit: '',
    minValue: -1,
    maxValue: 1
  },
  {
    id: 'gndvi',
    name: 'GNDVI',
    nameKa: 'მწვანე NDVI',
    description: 'Green Normalized Difference Vegetation Index',
    icon: <Leaf size={18} />,
    color: '#00BCD4',
    gradient: ['#8B4513', '#DEB887', '#B2DFDB', '#4DB6AC', '#00897B', '#004D40'],
    unit: '',
    minValue: -1,
    maxValue: 1
  }
];

// Generate mock historical data
const generateHistoricalData = (days: number): IndexDataPoint[] => {
  const data: IndexDataPoint[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i -= 5) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const baseValue = 0.3 + 0.4 * Math.sin((dayOfYear - 80) * Math.PI / 180);
    const noise = (Math.random() - 0.5) * 0.1;
    const value = Math.max(-1, Math.min(1, baseValue + noise));

    data.push({
      date: date.toISOString().split('T')[0],
      value: value
    });
  }

  return data;
};

// Generate mock satellite images
const generateSatelliteImages = (days: number): SatelliteImage[] => {
  const images: SatelliteImage[] = [];
  const now = new Date();

  for (let i = days; i >= 0; i -= 5) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    images.push({
      date: date.toISOString().split('T')[0],
      cloudCover: Math.random() * 40,
      source: Math.random() > 0.5 ? 'Sentinel-2' : 'Landsat-8',
      available: Math.random() > 0.2
    });
  }

  return images.reverse();
};

const SatelliteDataPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<LeafletMapRef>(null);

  // State
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Satellite layers state
  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [layerOpacity, setLayerOpacity] = useState<number>(80);
  const [showLegend, setShowLegend] = useState(true);

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Satellite data state
  const [_selectedImageDate, setSelectedImageDate] = useState<string>('');
  const [satelliteImages, setSatelliteImages] = useState<SatelliteImage[]>([]);
  const [historicalData, setHistoricalData] = useState<IndexDataPoint[]>([]);
  const [fieldStats, setFieldStats] = useState<FieldStats | null>(null);
  const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(null);
  const [_dataLoading, setDataLoading] = useState(false);
  const [isPlaying, _setIsPlaying] = useState(false);
  const [usingRealData, setUsingRealData] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [indexOverlay, setIndexOverlay] = useState<{
    fieldId: string;
    imageUrl: string;
    bounds: [[number, number], [number, number]];
    opacity?: number;
  } | null>(null);
  const [indexPoints, setIndexPoints] = useState<{
    points: IndexPoint[];
    indexType: string;
    gradient: string[];
    minValue: number;
    maxValue: number;
  } | null>(null);
  const [overlayLoading, setOverlayLoading] = useState(false);

  // Map settings
  const mapCenter: [number, number] = [41.7151, 44.8271];
  const mapZoom = 7;

  // Get active layer info
  const activeLayerInfo = activeLayer ? satelliteLayers.find(l => l.id === activeLayer) : null;

  // Load fields
  useEffect(() => {
    if (user?.companyId) {
      loadFields();
    }
  }, [user]);

  // Filter fields
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = fields.filter(field =>
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (field.crop || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFields(filtered);
    } else {
      setFilteredFields(fields);
    }
  }, [searchTerm, fields]);

  // Load satellite data when field changes
  useEffect(() => {
    if (selectedField && activeLayer) {
      loadSatelliteData();
    }
  }, [selectedField, startDate, endDate, activeLayer]);

  // Load index overlay when layer is selected (only when field or layer changes, not on date changes)
  useEffect(() => {
    if (selectedField && activeLayer) {
      loadIndexOverlay();
    } else {
      setIndexOverlay(null);
      setIndexPoints(null);
    }
  }, [selectedField, activeLayer]);

  const loadIndexOverlay = async () => {
    if (!selectedField || !activeLayer) {
      setIndexOverlay(null);
      setIndexPoints(null);
      return;
    }

    try {
      setOverlayLoading(true);

      // Get field bounds from polygonData or coordinates
      let bounds: [[number, number], [number, number]] | null = null;

      if (selectedField.polygonData && Array.isArray(selectedField.polygonData)) {
        // Calculate bounds from polygon data
        const lats = selectedField.polygonData.map((p: [number, number]) => p[0]);
        const lngs = selectedField.polygonData.map((p: [number, number]) => p[1]);
        bounds = [
          [Math.min(...lats), Math.min(...lngs)],
          [Math.max(...lats), Math.max(...lngs)]
        ];
      } else if (selectedField.coordinates) {
        // Parse coordinates string
        const pairs = selectedField.coordinates.split(';').map(pair => pair.trim());
        const coords = pairs.map(pair => {
          const [lat, lng] = pair.split(',').map(v => parseFloat(v.trim()));
          return [lat, lng] as [number, number];
        }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

        if (coords.length > 0) {
          const lats = coords.map(c => c[0]);
          const lngs = coords.map(c => c[1]);
          bounds = [
            [Math.min(...lats), Math.min(...lngs)],
            [Math.max(...lats), Math.max(...lngs)]
          ];
        }
      }

      if (!bounds) {
        console.warn('Could not determine field bounds');
        setIndexOverlay(null);
        setIndexPoints(null);
        return;
      }

      // Get the active layer info for gradient colors
      // Optimized settings - image shows full data, points are for hover values
      const highResOptions: HighResolutionOptions = {
        resolution: 0,      // Auto-calculate for Sentinel-2 native 10m accuracy
        maxPoints: 500,     // Limit points for performance (image shows full coverage)
        maxCloudCover: 30
      };

      // Fetch only the image overlay (points not needed - image shows full NDVI data)
      // Don't pass date - let the API use the most recent available image
      const imageUrl = await satelliteService.getIndexImageUrl(
        selectedField.id,
        activeLayer,
        undefined,  // No date - use most recent
        highResOptions
      );

      if (imageUrl) {
        setIndexOverlay({
          fieldId: selectedField.id,
          imageUrl,
          bounds,
          opacity: layerOpacity / 100
        });
      } else {
        setIndexOverlay(null);
      }

      // Don't show points - the image overlay provides the full NDVI visualization
      setIndexPoints(null);
    } catch (error) {
      console.error('Error loading index overlay:', error);
      setIndexOverlay(null);
      setIndexPoints(null);
    } finally {
      setOverlayLoading(false);
    }
  };

  // Animation effect
  useEffect(() => {
    if (!isPlaying || satelliteImages.length === 0) return;

    const interval = setInterval(() => {
      setSelectedImageDate(prev => {
        const currentIndex = satelliteImages.findIndex(img => img.date === prev);
        const nextIndex = (currentIndex + 1) % satelliteImages.length;
        return satelliteImages[nextIndex].date;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isPlaying, satelliteImages]);

  const loadFields = async () => {
    try {
      setLoading(true);
      if (!user?.companyId) {
        setFields([]);
        setFilteredFields([]);
        return;
      }

      const response = await apiClient.get(`/fields?companyId=${user.companyId}`);
      const data = response.data?.data || response.data || [];
      setFields(data);
      setFilteredFields(data);

      // Auto-select first field
      if (data.length > 0 && !selectedField) {
        selectField(data[0]);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
      setFilteredFields([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSatelliteData = async () => {
    if (!selectedField) return;

    try {
      setDataLoading(true);
      setDataError(null);

      // High-resolution options for accurate per-coordinate data (like cropmonitoring)
      const highResOptions: HighResolutionOptions = {
        resolution: 1024,   // Higher resolution for better accuracy
        maxPoints: 0,       // Get all points for per-coordinate accuracy
        maxCloudCover: 30
      };

      // Try to fetch real satellite data from backend with high-resolution
      const [fieldIndices, timeSeries] = await Promise.all([
        satelliteService.getFieldIndices(selectedField.id, highResOptions),
        activeLayer ? satelliteService.getTimeSeries(selectedField.id, activeLayer, startDate, endDate) : Promise.resolve([])
      ]);

      // If we got real data, use it
      if (fieldIndices) {
        const realData: SatelliteData = {
          ndvi: fieldIndices.ndvi,
          moisture: fieldIndices.moisture || fieldIndices.ndmi * 100,
          temperature: fieldIndices.temperature || 20,
          cloudCover: fieldIndices.cloudCover || 0,
          healthIndex: fieldIndices.healthIndex || satelliteService.calculateHealthIndex(fieldIndices.ndvi)
        };
        setSatelliteData(realData);
        setUsingRealData(true);
      } else {
        // Fallback to mock data if backend is unavailable
        const mockData: SatelliteData = {
          ndvi: 0.45 + Math.random() * 0.4,
          moisture: 30 + Math.random() * 40,
          temperature: 15 + Math.random() * 20,
          cloudCover: Math.random() * 30,
          healthIndex: 60 + Math.random() * 35
        };
        setSatelliteData(mockData);
        setUsingRealData(false);
      }

      // Use real time series or generate mock
      let history: IndexDataPoint[];
      if (timeSeries && timeSeries.length > 0) {
        history = timeSeries.map((ts: TimeSeriesDataPoint) => ({
          date: ts.date,
          value: ts.value
        }));
        setUsingRealData(true);
      } else {
        history = generateHistoricalData(90);
        setUsingRealData(false);
      }
      setHistoricalData(history);

      // Generate satellite images (timeline)
      const images = generateSatelliteImages(90);
      setSatelliteImages(images);

      if (images.length > 0) {
        setSelectedImageDate(images[0].date);
      }

      // Calculate field statistics
      if (history.length > 0) {
        const current = history[0];
        const previous = history.length > 1 ? history[1] : current;
        const values = history.map(h => h.value);

        setFieldStats({
          currentValue: current.value,
          previousValue: previous.value,
          change: current.value - previous.value,
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((a, b) => a + b, 0) / values.length
        });
      }

    } catch (error) {
      console.error('Error loading satellite data:', error);
      setDataError('მონაცემების ჩატვირთვა ვერ მოხერხდა');

      // Fallback to mock data on error
      const mockData: SatelliteData = {
        ndvi: 0.45 + Math.random() * 0.4,
        moisture: 30 + Math.random() * 40,
        temperature: 15 + Math.random() * 20,
        cloudCover: Math.random() * 30,
        healthIndex: 60 + Math.random() * 35
      };
      setSatelliteData(mockData);

      const history = generateHistoricalData(90);
      setHistoricalData(history);

      const images = generateSatelliteImages(90);
      setSatelliteImages(images);

      if (images.length > 0) {
        setSelectedImageDate(images[0].date);
      }

      if (history.length > 0) {
        const current = history[0];
        const previous = history.length > 1 ? history[1] : current;
        const values = history.map(h => h.value);
        setFieldStats({
          currentValue: current.value,
          previousValue: previous.value,
          change: current.value - previous.value,
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((a, b) => a + b, 0) / values.length
        });
      }
      setUsingRealData(false);
    } finally {
      setDataLoading(false);
    }
  };

  const selectField = (field: Field) => {
    setSelectedField(field);
    if (mapRef.current) {
      mapRef.current.centerOnField(field);
    }
  };

  const handleAreaDrawn = (area: number, coordinates: any[]) => {
    console.log('Area drawn:', area, coordinates);
  };

  const getIndexColor = (value: number, layer: SatelliteLayer | null | undefined): string => {
    if (!layer) return '#808080';
    const normalized = (value - layer.minValue) / (layer.maxValue - layer.minValue);
    const index = Math.floor(normalized * (layer.gradient.length - 1));
    const clampedIndex = Math.max(0, Math.min(layer.gradient.length - 1, index));
    return layer.gradient[clampedIndex];
  };

  const getChangeIcon = (change: number) => {
    if (change > 0.01) return <ArrowUp size={14} className="trend-up" />;
    if (change < -0.01) return <ArrowDown size={14} className="trend-down" />;
    return <Minus size={14} className="trend-neutral" />;
  };

  const getHealthStatus = (value: number) => {
    if (value >= 80) return { status: 'კარგი', color: '#4CAF50' };
    if (value >= 60) return { status: 'საშუალო', color: '#FFC107' };
    if (value >= 40) return { status: 'დაბალი', color: '#FF9800' };
    return { status: 'კრიტიკული', color: '#F44336' };
  };

  const exportData = () => {
    if (!historicalData.length || !selectedField) return;

    const csv = [
      'Date,Value',
      ...historicalData.map(d => `${d.date},${d.value.toFixed(4)}`)
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedField.name}-${activeLayer}-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Chart dimensions
  const chartWidth = 260;
  const chartHeight = 100;
  const chartPadding = { top: 10, right: 10, bottom: 20, left: 30 };

  // Create chart path
  const createChartPath = () => {
    if (historicalData.length < 2) return '';

    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    const minVal = activeLayerInfo?.minValue ?? -1;
    const maxVal = activeLayerInfo?.maxValue ?? 1;

    const xScale = (i: number) => chartPadding.left + (i / (historicalData.length - 1)) * innerWidth;
    const yScale = (v: number) => chartPadding.top + innerHeight - ((v - minVal) / (maxVal - minVal)) * innerHeight;

    return historicalData.map((d, i) =>
      `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`
    ).join(' ');
  };

  return (
    <div className="satellite-data-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate(-1)}>
            <ChevronLeft size={20} />
          </button>
          <div className="title-section">
            <Satellite className="title-icon" size={24} />
            <div>
              <h1>სატელიტური მონიტორინგი</h1>
              <span className="subtitle">Satellite Crop Monitoring</span>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <div className="date-range">
            <Calendar size={16} />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
            />
            <span>-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button className="action-btn" onClick={() => loadFields()} title="განახლება">
            <RefreshCw size={18} />
          </button>
          <button
            className="action-btn primary"
            onClick={exportData}
            disabled={!historicalData.length}
            title="ექსპორტი"
          >
            <Download size={18} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Left Panel - Index Selection & Stats */}
        <div className={`left-panel ${leftPanelCollapsed ? 'collapsed' : ''}`}>
          <button
            className="panel-toggle left"
            onClick={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
          >
            {leftPanelCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>

          {!leftPanelCollapsed && (
            <>
              {/* Index Selection */}
              <div className="panel-section">
                <h3><Layers size={16} /> ინდექსები</h3>
                {!activeLayer && (
                  <p className="index-hint">აირჩიეთ ინდექსი ნაკვეთზე ვიზუალიზაციისთვის</p>
                )}
                <div className="index-list">
                  {satelliteLayers.map(layer => (
                    <button
                      key={layer.id}
                      className={`index-item ${activeLayer === layer.id ? 'active' : ''}`}
                      onClick={() => setActiveLayer(activeLayer === layer.id ? null : layer.id)}
                      style={{ '--index-color': layer.color } as React.CSSProperties}
                    >
                      <span className="index-icon">{layer.icon}</span>
                      <div className="index-info">
                        <span className="index-name">{layer.name}</span>
                        <span className="index-desc">{layer.nameKa}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Current Stats */}
              {selectedField && fieldStats && (
                <div className="panel-section stats-section">
                  <h3><BarChart3 size={16} /> სტატისტიკა</h3>
                  <div className="stats-grid">
                    <div className="stat-card main">
                      <div className="stat-label">მიმდინარე {activeLayerInfo?.name}</div>
                      <div className="stat-value" style={{ color: activeLayerInfo?.color }}>
                        {fieldStats.currentValue.toFixed(3)}
                      </div>
                      <div className={`stat-change ${fieldStats.change >= 0 ? 'positive' : 'negative'}`}>
                        {getChangeIcon(fieldStats.change)}
                        <span>{fieldStats.change >= 0 ? '+' : ''}{fieldStats.change.toFixed(3)}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">მინ.</div>
                      <div className="stat-value">{fieldStats.min.toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">მაქს.</div>
                      <div className="stat-value">{fieldStats.max.toFixed(2)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">საშუალო</div>
                      <div className="stat-value">{fieldStats.mean.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="chart-container">
                    <svg width={chartWidth} height={chartHeight} className="index-chart">
                      <line
                        x1={chartPadding.left}
                        y1={chartHeight - chartPadding.bottom}
                        x2={chartWidth - chartPadding.right}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="#e0e0e0"
                      />
                      <path
                        d={createChartPath()}
                        fill="none"
                        stroke={activeLayerInfo?.color || '#4CAF50'}
                        strokeWidth={2}
                      />
                    </svg>
                  </div>
                </div>
              )}

              {/* Opacity Control */}
              <div className="panel-section">
                <h3><Eye size={16} /> გამჭვირვალობა: {layerOpacity}%</h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layerOpacity}
                  onChange={(e) => setLayerOpacity(Number(e.target.value))}
                  className="opacity-slider"
                />
              </div>
            </>
          )}
        </div>

        {/* Main Map Area */}
        <div className="map-container">
          <LeafletMap
            ref={mapRef}
            fields={filteredFields}
            selectedField={selectedField}
            onFieldSelect={selectField}
            onAreaDrawn={handleAreaDrawn}
            center={mapCenter}
            zoom={mapZoom}
            enableDrawing={false}
            indexOverlay={indexOverlay ? {
              ...indexOverlay,
              opacity: layerOpacity / 100
            } : null}
            indexPoints={indexPoints}
          />

          {/* Overlay Loading Indicator */}
          {overlayLoading && (
            <div className="overlay-loading">
              <RefreshCw className="spin" size={24} />
              <span>იტვირთება {activeLayer?.toUpperCase()}...</span>
            </div>
          )}

          {/* Legend */}
          {showLegend && activeLayerInfo && (
            <div className="map-legend">
              <div className="legend-header">
                <span className="legend-icon" style={{ color: activeLayerInfo.color }}>
                  {activeLayerInfo.icon}
                </span>
                <span>{activeLayerInfo.name}</span>
                <button className="legend-close" onClick={() => setShowLegend(false)}>
                  <EyeOff size={14} />
                </button>
              </div>
              <div
                className="legend-gradient"
                style={{
                  background: `linear-gradient(to right, ${activeLayerInfo.gradient.join(', ')})`
                }}
              />
              <div className="legend-labels">
                <span>{activeLayerInfo.minValue}</span>
                <span>{activeLayerInfo.maxValue}</span>
              </div>
            </div>
          )}



          {/* Data Panel - Bottom Right */}
          {selectedField && satelliteData && (
            <div className="data-panel">
              <div className="panel-header">
                <div className="panel-title-row">
                  <h3>{selectedField.name}</h3>
                  <span className={`data-source-badge ${usingRealData ? 'real' : 'mock'}`}>
                    {usingRealData ? 'Sentinel-2' : 'Demo'}
                  </span>
                </div>
                <span className="panel-subtitle">{selectedField.area} ჰა • {selectedField.crop || 'კულტურა არ არის'}</span>
                {dataError && (
                  <div className="data-error">
                    <AlertCircle size={14} />
                    <span>{dataError}</span>
                  </div>
                )}
              </div>
              <div className="panel-content">
                <div className="data-grid">
                  <div className="data-card">
                    <div className="data-icon" style={{ background: '#4CAF5020', color: '#4CAF50' }}>
                      <Leaf size={18} />
                    </div>
                    <div className="data-info">
                      <span className="data-label">NDVI</span>
                      <span className="data-value">{satelliteData.ndvi.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="data-card">
                    <div className="data-icon" style={{ background: '#2196F320', color: '#2196F3' }}>
                      <Droplets size={18} />
                    </div>
                    <div className="data-info">
                      <span className="data-label">ტენიანობა</span>
                      <span className="data-value">{satelliteData.moisture.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="data-card">
                    <div className="data-icon" style={{ background: '#FF572220', color: '#FF5722' }}>
                      <Thermometer size={18} />
                    </div>
                    <div className="data-info">
                      <span className="data-label">ტემპ.</span>
                      <span className="data-value">{satelliteData.temperature.toFixed(0)}°C</span>
                    </div>
                  </div>
                  <div className="data-card">
                    <div className="data-icon" style={{ background: '#9E9E9E20', color: '#9E9E9E' }}>
                      <Cloud size={18} />
                    </div>
                    <div className="data-info">
                      <span className="data-label">ღრუბლები</span>
                      <span className="data-value">{satelliteData.cloudCover.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
                <div className="health-indicator">
                  <div className="health-header">
                    <span>ჯანმრთელობა</span>
                    <span className="health-status" style={{ color: getHealthStatus(satelliteData.healthIndex).color }}>
                      {getHealthStatus(satelliteData.healthIndex).status}
                    </span>
                  </div>
                  <div className="health-bar">
                    <div
                      className="health-fill"
                      style={{
                        width: `${satelliteData.healthIndex}%`,
                        background: getHealthStatus(satelliteData.healthIndex).color
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Fields List */}
        <div className={`right-panel ${rightPanelCollapsed ? 'collapsed' : ''}`}>
          <button
            className="panel-toggle right"
            onClick={() => setRightPanelCollapsed(!rightPanelCollapsed)}
          >
            {rightPanelCollapsed ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
          </button>

          {!rightPanelCollapsed && (
            <>
              <div className="panel-section">
                <h3><Map size={16} /> ნაკვეთები ({filteredFields.length})</h3>
                <div className="search-box">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="ძებნა..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="fields-list">
                {loading ? (
                  <div className="loading-state">
                    <RefreshCw className="spin" size={20} />
                    <span>იტვირთება...</span>
                  </div>
                ) : filteredFields.length === 0 ? (
                  <div className="empty-state">
                    <Map size={32} />
                    <span>ნაკვეთები არ მოიძებნა</span>
                  </div>
                ) : (
                  filteredFields.map(field => (
                    <button
                      key={field.id}
                      className={`field-card ${selectedField?.id === field.id ? 'active' : ''}`}
                      onClick={() => selectField(field)}
                    >
                      <div className="field-preview">
                        <Leaf size={20} />
                      </div>
                      <div className="field-details">
                        <div className="field-name">{field.name}</div>
                        <div className="field-meta">
                          <span className="area">{field.area} ჰა</span>
                          {field.crop && <span className="crop">{field.crop}</span>}
                        </div>
                      </div>
                      {selectedField?.id === field.id && fieldStats && (
                        <div
                          className="field-index"
                          style={{
                            background: getIndexColor(fieldStats.currentValue, activeLayerInfo),
                            color: '#fff'
                          }}
                        >
                          {fieldStats.currentValue.toFixed(2)}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatelliteDataPage;
