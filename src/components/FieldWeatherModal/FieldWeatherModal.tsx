import React, { useState, useEffect } from 'react';
import { X, HelpCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle, Bookmark } from 'lucide-react';
import type { WeatherData, ForecastData, MetricStatus } from '../../services/weatherService';
import { weatherService, getMetricStatus, getWindDirectionText, getWindDirectionArrow } from '../../services/weatherService';
import './FieldWeatherModal.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  coordinates: string;
  polygonData?: any;
}

interface FieldWeatherModalProps {
  field: Field;
  onClose: () => void;
  onAddPoint?: (name: string) => void;
}

type TabType = 'basic' | 'forecast';

const FieldWeatherModal: React.FC<FieldWeatherModalProps> = ({ field, onClose, onAddPoint }) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pointName, setPointName] = useState(field.name);

  // Parse coordinates from field
  const getFieldCoordinates = (): { lat: number; lng: number } | null => {
    if (field.polygonData && Array.isArray(field.polygonData) && field.polygonData.length > 0) {
      // Calculate centroid of polygon
      let latSum = 0, lngSum = 0;
      field.polygonData.forEach((coord: any) => {
        if (Array.isArray(coord)) {
          latSum += coord[0];
          lngSum += coord[1];
        } else if (coord.lat && coord.lng) {
          latSum += coord.lat;
          lngSum += coord.lng;
        }
      });
      return {
        lat: latSum / field.polygonData.length,
        lng: lngSum / field.polygonData.length
      };
    }

    if (field.coordinates) {
      const parts = field.coordinates.split(',').map(s => parseFloat(s.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }

    return null;
  };

  const coords = getFieldCoordinates();

  // Load weather data
  useEffect(() => {
    const loadWeatherData = async () => {
      if (!coords) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        if (activeTab === 'basic') {
          // Use FieldClimate API via coordinates
          const data = await weatherService.getWeatherByCoordinates(coords.lat, coords.lng);
          setWeatherData(data);
        } else {
          const forecast = await weatherService.getForecast(coords.lat, coords.lng);
          setForecastData(forecast);
        }
      } catch (error) {
        console.error('Error loading weather data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeatherData();
  }, [coords?.lat, coords?.lng, activeTab]);

  const formatCoordinates = () => {
    if (coords) {
      return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    }
    return field.coordinates || 'N/A';
  };

  const renderStatusIcon = (status: MetricStatus) => {
    switch (status) {
      case 'normal':
        return <CheckCircle size={20} className="status-icon normal" />;
      case 'above':
        return <ArrowUpCircle size={20} className="status-icon above" />;
      case 'below':
        return <ArrowDownCircle size={20} className="status-icon below" />;
    }
  };

  const handleAddPoint = () => {
    if (onAddPoint && pointName.trim()) {
      onAddPoint(pointName.trim());
    }
  };

  return (
    <div className="field-weather-modal-overlay" onClick={onClose}>
      <div className="field-weather-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="header-info">
            <h2>{field.name}</h2>
            <span className="coordinates">{formatCoordinates()}</span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="modal-tabs">
          <button
            className={`tab-btn ${activeTab === 'basic' ? 'active' : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            ძირითადი ინფორმაცია
          </button>
          <button
            className={`tab-btn ${activeTab === 'forecast' ? 'active' : ''}`}
            onClick={() => setActiveTab('forecast')}
          >
            პროგნოზის მონაცემები
          </button>
        </div>

        {/* Content */}
        <div className="modal-content">
          {activeTab === 'basic' ? (
            <>
              {/* Date and Provider */}
              <div className="filters-row">
                <div className="filter-group">
                  <label>თარიღი</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="date-input"
                  />
                </div>
                {/* <div className="filter-group">
                  <label>პროვაიდერი</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value as ProviderType)}
                    className="provider-select"
                  >
                    <option value="FieldClimate">FieldClimate</option>
                    <option value="OpenMeteo">OpenMeteo</option>
                  </select>
                </div> */}
              </div>

              {loading ? (
                <div className="loading-state">იტვირთება...</div>
              ) : weatherData ? (
                <div className="weather-content">
                  {/* Weather Metrics Grid */}
                  <div className="metrics-grid">
                    {/* Row 1 */}
                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">ნალექი</span>
                        {renderStatusIcon(getMetricStatus('precipitation', weatherData.precipitation))}
                      </div>
                      <div className="metric-value">
                        <span className="value">{weatherData.precipitation?.toFixed(1) ?? '-'}</span>
                        <span className="unit">მმ</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">ტემპერატურა</span>
                        {renderStatusIcon(getMetricStatus('temperature', weatherData.temperature))}
                      </div>
                      <div className="metric-value">
                        <span className="value">+{weatherData.temperature?.toFixed(1) ?? '-'}</span>
                        <span className="unit">°</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">მზის რადიაცია</span>
                        {renderStatusIcon(getMetricStatus('solarRadiation', weatherData.solarRadiation))}
                      </div>
                      <div className="metric-value">
                        <span className="value">{weatherData.solarRadiation?.toFixed(1) ?? '-'}</span>
                        <span className="unit">kcal/cm²</span>
                      </div>
                    </div>

                    {/* Legend */}
                    <div className="legend">
                      <div className="legend-item">
                        <CheckCircle size={16} className="status-icon normal" />
                        <span>ნორმალური</span>
                      </div>
                      <div className="legend-item">
                        <ArrowDownCircle size={16} className="status-icon below" />
                        <span>ნორმაზე დაბალი</span>
                      </div>
                      <div className="legend-item">
                        <ArrowUpCircle size={16} className="status-icon above" />
                        <span>ნორმაზე მაღალი</span>
                      </div>
                    </div>

                    {/* Row 2 */}
                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">ტენიანობა</span>
                        <HelpCircle size={14} className="help-icon" />
                        {renderStatusIcon(getMetricStatus('humidity', weatherData.humidity))}
                      </div>
                      <div className="metric-value">
                        <span className="value">{weatherData.humidity?.toFixed(0) ?? '-'}</span>
                        <span className="unit">%</span>
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">ქარის სიჩქარე</span>
                      </div>
                      <div className="metric-value">
                        <span className="value">{weatherData.windSpeed?.toFixed(2) ?? '-'}</span>
                        <span className="unit">მ/წმ</span>
                      </div>
                      <div className="metric-extra">
                        მაქს: {((weatherData.windSpeed ?? 0) * 3.6).toFixed(2)} კმ/სთ ({weatherData.windSpeed?.toFixed(2) ?? '-'} მ/წმ)
                      </div>
                    </div>

                    <div className="metric-card">
                      <div className="metric-header">
                        <span className="metric-label">ქარის მიმართულება</span>
                      </div>
                      <div className="metric-value wind-direction">
                        <span className="wind-arrow">{getWindDirectionArrow(weatherData.windDirection)}</span>
                        <span className="value">{getWindDirectionText(weatherData.windDirection)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="no-data">მონაცემები არ მოიძებნა</div>
              )}
            </>
          ) : (
            /* Forecast Tab */
            <div className="forecast-content">
              {loading ? (
                <div className="loading-state">იტვირთება...</div>
              ) : forecastData.length > 0 ? (
                <div className="forecast-list">
                  {forecastData.map((day, index) => (
                    <div key={index} className="forecast-day">
                      <div className="forecast-date">
                        {new Date(day.date).toLocaleDateString('ka-GE', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="forecast-temps">
                        <span className="temp-max">+{day.temperatureMax.toFixed(0)}°</span>
                        <span className="temp-min">+{day.temperatureMin.toFixed(0)}°</span>
                      </div>
                      <div className="forecast-precip">
                        <span>{day.precipitation.toFixed(1)} მმ</span>
                      </div>
                      <div className="forecast-humidity">
                        <span>{day.humidity.toFixed(0)}%</span>
                      </div>
                      <div className="forecast-wind">
                        <span>{day.windSpeed.toFixed(1)} მ/წმ</span>
                      </div>
                      <div className="forecast-desc">
                        {day.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-data">პროგნოზი არ მოიძებნა</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <input
            type="text"
            value={pointName}
            onChange={(e) => setPointName(e.target.value)}
            placeholder="წერტილის სახელი"
            className="point-name-input"
          />
          <button className="add-point-btn" onClick={handleAddPoint}>
            <Bookmark size={18} />
            <span>წერტილის დამატება</span>
          </button>
          <button className="close-footer-btn" onClick={onClose}>
            დახურვა
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldWeatherModal;
