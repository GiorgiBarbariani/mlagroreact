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
  Info,
  Thermometer,
  Droplets,
  Leaf,
  Sun,
  Cloud,
  TrendingUp,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeafletMap, { type LeafletMapRef } from '../../components/LeafletMap/LeafletMap';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
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
  unit: string;
  minValue: number;
  maxValue: number;
}

interface SatelliteData {
  fieldId: string;
  date: string;
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
    description: 'Normalized Difference Vegetation Index - მცენარეულობის ჯანმრთელობის მაჩვენებელი',
    icon: <Leaf size={18} />,
    color: '#4CAF50',
    unit: '',
    minValue: -1,
    maxValue: 1
  },
  {
    id: 'moisture',
    name: 'Soil Moisture',
    nameKa: 'ნიადაგის ტენიანობა',
    description: 'ნიადაგის ტენიანობის დონე პროცენტებში',
    icon: <Droplets size={18} />,
    color: '#2196F3',
    unit: '%',
    minValue: 0,
    maxValue: 100
  },
  {
    id: 'temperature',
    name: 'Surface Temperature',
    nameKa: 'ზედაპირის ტემპერატურა',
    description: 'მიწის ზედაპირის ტემპერატურა',
    icon: <Thermometer size={18} />,
    color: '#FF5722',
    unit: '°C',
    minValue: -10,
    maxValue: 50
  },
  {
    id: 'lai',
    name: 'LAI',
    nameKa: 'ფოთლის ფართობის ინდექსი',
    description: 'Leaf Area Index - ფოთლების სიმჭიდროვე',
    icon: <TrendingUp size={18} />,
    color: '#8BC34A',
    unit: '',
    minValue: 0,
    maxValue: 8
  },
  {
    id: 'trueColor',
    name: 'True Color',
    nameKa: 'რეალური ფერები',
    description: 'RGB კომპოზიცია - რეალური ფერების გამოსახულება',
    icon: <Sun size={18} />,
    color: '#FFC107',
    unit: '',
    minValue: 0,
    maxValue: 255
  },
  {
    id: 'cloudMask',
    name: 'Cloud Coverage',
    nameKa: 'ღრუბლიანობა',
    description: 'ღრუბლების დაფარვის პროცენტი',
    icon: <Cloud size={18} />,
    color: '#9E9E9E',
    unit: '%',
    minValue: 0,
    maxValue: 100
  }
];

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Satellite layers state
  const [activeLayer, setActiveLayer] = useState<string>('ndvi');
  const [layerOpacity, setLayerOpacity] = useState<number>(80);
  const [showLegend, setShowLegend] = useState(true);

  // Date range state
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Satellite data state
  const [satelliteData, setSatelliteData] = useState<SatelliteData | null>(null);
  const [dataLoading, setDataLoading] = useState(false);

  // Map settings
  const mapCenter: [number, number] = [41.7151, 44.8271];
  const mapZoom = 7;

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

  // Load satellite data when field or dates change
  useEffect(() => {
    if (selectedField) {
      loadSatelliteData(selectedField.id);
    }
  }, [selectedField, startDate, endDate, activeLayer]);

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
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
      setFilteredFields([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSatelliteData = async (fieldId: string) => {
    try {
      setDataLoading(true);
      // Simulated satellite data - in production, this would come from an API
      // that integrates with satellite data providers like Sentinel, Landsat, etc.
      await new Promise(resolve => setTimeout(resolve, 800));

      const mockData: SatelliteData = {
        fieldId,
        date: endDate,
        ndvi: 0.45 + Math.random() * 0.4,
        moisture: 30 + Math.random() * 40,
        temperature: 15 + Math.random() * 20,
        cloudCover: Math.random() * 30,
        healthIndex: 60 + Math.random() * 35
      };

      setSatelliteData(mockData);
    } catch (error) {
      console.error('Error loading satellite data:', error);
      setSatelliteData(null);
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

  const getActiveLayerInfo = () => {
    return satelliteLayers.find(l => l.id === activeLayer);
  };

  const getHealthStatus = (value: number) => {
    if (value >= 80) return { status: 'კარგი', color: '#4CAF50' };
    if (value >= 60) return { status: 'საშუალო', color: '#FFC107' };
    if (value >= 40) return { status: 'დაბალი', color: '#FF9800' };
    return { status: 'კრიტიკული', color: '#F44336' };
  };

  const exportData = () => {
    if (!satelliteData || !selectedField) return;

    const exportContent = {
      field: selectedField.name,
      date: satelliteData.date,
      layer: activeLayer,
      data: satelliteData
    };

    const blob = new Blob([JSON.stringify(exportContent, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `satellite-data-${selectedField.name}-${endDate}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeLayerInfo = getActiveLayerInfo();

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
              <h1>სატელიტური მონაცემები</h1>
              <span className="subtitle">Satellite Data Analysis</span>
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
            disabled={!satelliteData}
            title="ექსპორტი"
          >
            <Download size={18} />
            <span>ექსპორტი</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Sidebar */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <button
            className="collapse-btn"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>

          {!sidebarCollapsed && (
            <>
              {/* Layer Selection */}
              <div className="sidebar-section">
                <h3><Layers size={16} /> ფენები</h3>
                <div className="layer-list">
                  {satelliteLayers.map(layer => (
                    <button
                      key={layer.id}
                      className={`layer-item ${activeLayer === layer.id ? 'active' : ''}`}
                      onClick={() => setActiveLayer(layer.id)}
                      style={{ '--layer-color': layer.color } as React.CSSProperties}
                    >
                      <span className="layer-icon">{layer.icon}</span>
                      <div className="layer-info">
                        <span className="layer-name">{layer.nameKa}</span>
                        <span className="layer-desc">{layer.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Opacity Control */}
              <div className="sidebar-section">
                <h3>გამჭვირვალობა: {layerOpacity}%</h3>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layerOpacity}
                  onChange={(e) => setLayerOpacity(Number(e.target.value))}
                  className="opacity-slider"
                />
              </div>

              {/* Fields List */}
              <div className="sidebar-section fields-section">
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
                <div className="fields-list">
                  {loading ? (
                    <div className="loading-state">იტვირთება...</div>
                  ) : filteredFields.length === 0 ? (
                    <div className="empty-state">ნაკვეთები არ მოიძებნა</div>
                  ) : (
                    filteredFields.map(field => (
                      <button
                        key={field.id}
                        className={`field-item ${selectedField?.id === field.id ? 'active' : ''}`}
                        onClick={() => selectField(field)}
                      >
                        <div className="field-name">{field.name}</div>
                        <div className="field-meta">
                          <span>{field.area} ჰა</span>
                          {field.crop && <span className="crop">{field.crop}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>
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
          />

          {/* Map Controls */}
          <div className="map-controls">
            <button className="map-control-btn" title="მიახლოება">
              <ZoomIn size={18} />
            </button>
            <button className="map-control-btn" title="დაშორება">
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
                <span>{activeLayerInfo.nameKa}</span>
              </div>
              <div className="legend-gradient" style={{
                background: activeLayerInfo.id === 'ndvi'
                  ? 'linear-gradient(to right, #8B4513, #FFFF00, #228B22)'
                  : activeLayerInfo.id === 'moisture'
                  ? 'linear-gradient(to right, #F4A460, #87CEEB, #0000FF)'
                  : activeLayerInfo.id === 'temperature'
                  ? 'linear-gradient(to right, #0000FF, #00FF00, #FFFF00, #FF0000)'
                  : `linear-gradient(to right, ${activeLayerInfo.color}33, ${activeLayerInfo.color})`
              }}></div>
              <div className="legend-labels">
                <span>{activeLayerInfo.minValue}{activeLayerInfo.unit}</span>
                <span>{activeLayerInfo.maxValue}{activeLayerInfo.unit}</span>
              </div>
            </div>
          )}

          {/* Data Panel */}
          {selectedField && (
            <div className="data-panel">
              <div className="panel-header">
                <h3>{selectedField.name}</h3>
                <span className="panel-subtitle">{selectedField.area} ჰა • {selectedField.crop || 'კულტურა არ არის მითითებული'}</span>
              </div>

              {dataLoading ? (
                <div className="panel-loading">
                  <RefreshCw className="spin" size={24} />
                  <span>მონაცემები იტვირთება...</span>
                </div>
              ) : satelliteData ? (
                <div className="panel-content">
                  <div className="data-grid">
                    <div className="data-card">
                      <div className="data-icon" style={{ background: '#4CAF5020', color: '#4CAF50' }}>
                        <Leaf size={20} />
                      </div>
                      <div className="data-info">
                        <span className="data-label">NDVI</span>
                        <span className="data-value">{satelliteData.ndvi.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="data-card">
                      <div className="data-icon" style={{ background: '#2196F320', color: '#2196F3' }}>
                        <Droplets size={20} />
                      </div>
                      <div className="data-info">
                        <span className="data-label">ტენიანობა</span>
                        <span className="data-value">{satelliteData.moisture.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="data-card">
                      <div className="data-icon" style={{ background: '#FF572220', color: '#FF5722' }}>
                        <Thermometer size={20} />
                      </div>
                      <div className="data-info">
                        <span className="data-label">ტემპერატურა</span>
                        <span className="data-value">{satelliteData.temperature.toFixed(1)}°C</span>
                      </div>
                    </div>
                    <div className="data-card">
                      <div className="data-icon" style={{ background: '#9E9E9E20', color: '#9E9E9E' }}>
                        <Cloud size={20} />
                      </div>
                      <div className="data-info">
                        <span className="data-label">ღრუბლიანობა</span>
                        <span className="data-value">{satelliteData.cloudCover.toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="health-indicator">
                    <div className="health-header">
                      <span>ჯანმრთელობის ინდექსი</span>
                      <span
                        className="health-status"
                        style={{ color: getHealthStatus(satelliteData.healthIndex).color }}
                      >
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
                    <div className="health-value">{satelliteData.healthIndex.toFixed(0)}%</div>
                  </div>

                  <div className="data-footer">
                    <Info size={14} />
                    <span>ბოლო განახლება: {new Date(satelliteData.date).toLocaleDateString('ka-GE')}</span>
                  </div>
                </div>
              ) : (
                <div className="panel-empty">
                  <Info size={24} />
                  <span>მონაცემები არ არის ხელმისაწვდომი</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SatelliteDataPage;
