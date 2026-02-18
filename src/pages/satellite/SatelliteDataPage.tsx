import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ZoomIn,
  ZoomOut,
  Maximize2,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  ImageIcon,
  Play,
  Pause
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
import './SatelliteDataPage.scss';

// Leaflet imports
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
  min: number;
  max: number;
  mean: number;
}

interface FieldStats {
  currentValue: number;
  previousValue: number;
  change: number;
  changePercent: number;
  min: number;
  max: number;
  mean: number;
  standardDeviation: number;
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
    id: 'reci',
    name: 'ReCI',
    nameKa: 'ქლოროფილის ინდექსი',
    description: 'Red Edge Chlorophyll Index',
    icon: <Leaf size={18} />,
    color: '#00BCD4',
    gradient: ['#004D40', '#00796B', '#009688', '#4DB6AC', '#80CBC4'],
    unit: '',
    minValue: 0,
    maxValue: 3
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
    id: 'ndwi',
    name: 'NDWI',
    nameKa: 'წყლის ინდექსი',
    description: 'Normalized Difference Water Index',
    icon: <Droplets size={18} />,
    color: '#03A9F4',
    gradient: ['#D2691E', '#F4A460', '#F0F8FF', '#87CEEB', '#0000CD'],
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

    // Simulate seasonal NDVI pattern
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
    const baseValue = 0.3 + 0.4 * Math.sin((dayOfYear - 80) * Math.PI / 180);
    const noise = (Math.random() - 0.5) * 0.1;
    const value = Math.max(-1, Math.min(1, baseValue + noise));

    data.push({
      date: date.toISOString().split('T')[0],
      value: value,
      min: value - 0.15 - Math.random() * 0.1,
      max: value + 0.15 + Math.random() * 0.1,
      mean: value
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
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const fieldLayerRef = useRef<L.GeoJSON | null>(null);

  // State
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);

  // Satellite layers state
  const [activeLayer, setActiveLayer] = useState<string>('ndvi');
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
  const [selectedImageDate, setSelectedImageDate] = useState<string>('');
  const [satelliteImages, setSatelliteImages] = useState<SatelliteImage[]>([]);
  const [historicalData, setHistoricalData] = useState<IndexDataPoint[]>([]);
  const [fieldStats, setFieldStats] = useState<FieldStats | null>(null);
  const [_dataLoading, setDataLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Get active layer info
  const activeLayerInfo = useMemo(() =>
    satelliteLayers.find(l => l.id === activeLayer),
    [activeLayer]
  );

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    const map = L.map(mapContainer.current).setView([41.7151, 44.8271], 7);
    mapInstance.current = map;

    // Add satellite layer
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri',
      maxZoom: 19
    }).addTo(map);

    // Add labels layer on top
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
      attribution: '',
      maxZoom: 19,
      pane: 'shadowPane'
    }).addTo(map);

    return () => {
      map.remove();
      mapInstance.current = null;
    };
  }, []);

  // Update field visualization on map
  useEffect(() => {
    if (!mapInstance.current || !selectedField) return;

    // Remove existing field layer
    if (fieldLayerRef.current) {
      mapInstance.current.removeLayer(fieldLayerRef.current);
    }

    // Parse field coordinates
    let coordinates: number[][] = [];
    if (selectedField.polygonData && Array.isArray(selectedField.polygonData)) {
      coordinates = selectedField.polygonData.map((coord: any) =>
        Array.isArray(coord) ? [coord[1], coord[0]] : [coord.lng, coord.lat]
      );
    } else if (selectedField.coordinates) {
      const pairs = selectedField.coordinates.split(';').map(p => p.trim());
      coordinates = pairs.map(pair => {
        const [lat, lng] = pair.split(',').map(v => parseFloat(v.trim()));
        return [lng, lat];
      }).filter(c => !isNaN(c[0]) && !isNaN(c[1]));
    }

    if (coordinates.length < 3) return;

    // Create GeoJSON feature
    const feature: GeoJSON.Feature<GeoJSON.Polygon> = {
      type: 'Feature',
      properties: { name: selectedField.name },
      geometry: {
        type: 'Polygon',
        coordinates: [coordinates]
      }
    };

    // Get color based on current index value
    const currentValue = fieldStats?.currentValue ?? 0.5;
    const indexColor = getIndexColor(currentValue, activeLayerInfo);

    // Create styled layer
    fieldLayerRef.current = L.geoJSON(feature, {
      style: {
        fillColor: indexColor,
        fillOpacity: layerOpacity / 100,
        color: '#fff',
        weight: 3,
        opacity: 1
      }
    }).addTo(mapInstance.current);

    // Fit map to field bounds
    const bounds = fieldLayerRef.current.getBounds();
    mapInstance.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });

  }, [selectedField, fieldStats, activeLayer, layerOpacity, activeLayerInfo]);

  // Load satellite data when field changes
  useEffect(() => {
    if (selectedField) {
      loadSatelliteData();
    }
  }, [selectedField, startDate, endDate, activeLayer]);

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

      // Generate mock data (in production, this would come from satellite API)
      await new Promise(resolve => setTimeout(resolve, 500));

      const images = generateSatelliteImages(90);
      const history = generateHistoricalData(90);

      setSatelliteImages(images);
      setHistoricalData(history);

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
          changePercent: previous.value !== 0
            ? ((current.value - previous.value) / Math.abs(previous.value)) * 100
            : 0,
          min: Math.min(...values),
          max: Math.max(...values),
          mean: values.reduce((a, b) => a + b, 0) / values.length,
          standardDeviation: Math.sqrt(
            values.reduce((sq, n) => sq + Math.pow(n - (values.reduce((a, b) => a + b, 0) / values.length), 2), 0) / values.length
          )
        });
      }

    } catch (error) {
      console.error('Error loading satellite data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const selectField = (field: Field) => {
    setSelectedField(field);
  };

  const getIndexColor = (value: number, layer: SatelliteLayer | undefined): string => {
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

  const exportData = () => {
    if (!historicalData.length || !selectedField) return;

    const csv = [
      'Date,Value,Min,Max,Mean',
      ...historicalData.map(d => `${d.date},${d.value.toFixed(4)},${d.min.toFixed(4)},${d.max.toFixed(4)},${d.mean.toFixed(4)}`)
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
  const chartWidth = 280;
  const chartHeight = 120;
  const chartPadding = { top: 10, right: 10, bottom: 20, left: 35 };

  // Create chart path
  const chartPath = useMemo(() => {
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
  }, [historicalData, activeLayerInfo]);

  // Create area path for chart
  const areaPath = useMemo(() => {
    if (historicalData.length < 2) return '';

    const innerWidth = chartWidth - chartPadding.left - chartPadding.right;
    const innerHeight = chartHeight - chartPadding.top - chartPadding.bottom;

    const minVal = activeLayerInfo?.minValue ?? -1;
    const maxVal = activeLayerInfo?.maxValue ?? 1;

    const xScale = (i: number) => chartPadding.left + (i / (historicalData.length - 1)) * innerWidth;
    const yScale = (v: number) => chartPadding.top + innerHeight - ((v - minVal) / (maxVal - minVal)) * innerHeight;

    const points = historicalData.map((d, i) => `${xScale(i)},${yScale(d.value)}`).join(' L');
    const baseline = chartPadding.top + innerHeight;

    return `M ${chartPadding.left},${baseline} L${points} L${xScale(historicalData.length - 1)},${baseline} Z`;
  }, [historicalData, activeLayerInfo]);

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
                <div className="index-list">
                  {satelliteLayers.map(layer => (
                    <button
                      key={layer.id}
                      className={`index-item ${activeLayer === layer.id ? 'active' : ''}`}
                      onClick={() => setActiveLayer(layer.id)}
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
                      <div className="stat-label">მიმდინარე</div>
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
                      <div className="stat-value">{fieldStats.min.toFixed(3)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">მაქს.</div>
                      <div className="stat-value">{fieldStats.max.toFixed(3)}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">საშუალო</div>
                      <div className="stat-value">{fieldStats.mean.toFixed(3)}</div>
                    </div>
                  </div>

                  {/* Mini Chart */}
                  <div className="chart-container">
                    <svg width={chartWidth} height={chartHeight} className="index-chart">
                      {/* Grid lines */}
                      <line
                        x1={chartPadding.left}
                        y1={chartPadding.top}
                        x2={chartPadding.left}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="#e0e0e0"
                      />
                      <line
                        x1={chartPadding.left}
                        y1={chartHeight - chartPadding.bottom}
                        x2={chartWidth - chartPadding.right}
                        y2={chartHeight - chartPadding.bottom}
                        stroke="#e0e0e0"
                      />

                      {/* Area fill */}
                      <path
                        d={areaPath}
                        fill={activeLayerInfo?.color || '#4CAF50'}
                        fillOpacity={0.2}
                      />

                      {/* Line */}
                      <path
                        d={chartPath}
                        fill="none"
                        stroke={activeLayerInfo?.color || '#4CAF50'}
                        strokeWidth={2}
                      />

                      {/* Y-axis labels */}
                      <text x={chartPadding.left - 5} y={chartPadding.top + 5} textAnchor="end" fontSize={10} fill="#666">
                        {activeLayerInfo?.maxValue}
                      </text>
                      <text x={chartPadding.left - 5} y={chartHeight - chartPadding.bottom} textAnchor="end" fontSize={10} fill="#666">
                        {activeLayerInfo?.minValue}
                      </text>
                    </svg>
                    <div className="chart-labels">
                      <span>{historicalData[historicalData.length - 1]?.date}</span>
                      <span>{historicalData[0]?.date}</span>
                    </div>
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
          <div ref={mapContainer} className="leaflet-map" />

          {/* Map Controls */}
          <div className="map-controls">
            <button
              className="map-control-btn"
              title="მიახლოება"
              onClick={() => mapInstance.current?.zoomIn()}
            >
              <ZoomIn size={18} />
            </button>
            <button
              className="map-control-btn"
              title="დაშორება"
              onClick={() => mapInstance.current?.zoomOut()}
            >
              <ZoomOut size={18} />
            </button>
            <button className="map-control-btn" title="სრული ეკრანი">
              <Maximize2 size={18} />
            </button>
            <button
              className={`map-control-btn ${showLegend ? 'active' : ''}`}
              onClick={() => setShowLegend(!showLegend)}
              title="ლეგენდა"
            >
              {showLegend ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>

          {/* Legend */}
          {showLegend && activeLayerInfo && (
            <div className="map-legend">
              <div className="legend-header">
                <span className="legend-icon" style={{ color: activeLayerInfo.color }}>
                  {activeLayerInfo.icon}
                </span>
                <span>{activeLayerInfo.name}</span>
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

          {/* Image Timeline */}
          {selectedField && satelliteImages.length > 0 && (
            <div className="image-timeline">
              <div className="timeline-header">
                <ImageIcon size={16} />
                <span>სატელიტური სურათები</span>
                <button
                  className={`play-btn ${isPlaying ? 'active' : ''}`}
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
              </div>
              <div className="timeline-track">
                {satelliteImages.slice(0, 12).map((img, index) => (
                  <button
                    key={img.date}
                    className={`timeline-item ${selectedImageDate === img.date ? 'active' : ''} ${!img.available ? 'unavailable' : ''}`}
                    onClick={() => img.available && setSelectedImageDate(img.date)}
                    title={`${img.date} - ${img.source} - ღრუბლიანობა: ${img.cloudCover.toFixed(0)}%`}
                  >
                    <div className="item-dot" />
                    {index % 3 === 0 && (
                      <span className="item-date">{new Date(img.date).toLocaleDateString('ka-GE', { month: 'short', day: 'numeric' })}</span>
                    )}
                  </button>
                ))}
              </div>
              <div className="timeline-info">
                <span>{selectedImageDate && new Date(selectedImageDate).toLocaleDateString('ka-GE')}</span>
                <span className="source">{satelliteImages.find(i => i.date === selectedImageDate)?.source}</span>
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

              {/* Selected Field Info */}
              {selectedField && (
                <div className="selected-field-info">
                  <h4>{selectedField.name}</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">ფართობი</span>
                      <span className="value">{selectedField.area} ჰა</span>
                    </div>
                    <div className="info-item">
                      <span className="label">კულტურა</span>
                      <span className="value">{selectedField.crop || '-'}</span>
                    </div>
                    {fieldStats && (
                      <>
                        <div className="info-item">
                          <span className="label">{activeLayerInfo?.name}</span>
                          <span className="value" style={{ color: activeLayerInfo?.color }}>
                            {fieldStats.currentValue.toFixed(3)}
                          </span>
                        </div>
                        <div className="info-item">
                          <span className="label">ცვლილება</span>
                          <span className={`value ${fieldStats.change >= 0 ? 'positive' : 'negative'}`}>
                            {fieldStats.change >= 0 ? '+' : ''}{fieldStats.change.toFixed(3)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatelliteDataPage;
