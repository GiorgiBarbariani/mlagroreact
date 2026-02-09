import React, { useState } from 'react';
import { ArrowLeft, MapPin, Layers, ZoomIn, ZoomOut, Download, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GisPage.scss';

const GisPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedLayer, setSelectedLayer] = useState('satellite');
  const [zoomLevel, setZoomLevel] = useState(10);

  const layers = [
    { id: 'satellite', name: 'სატელიტი', icon: '🛰️' },
    { id: 'terrain', name: 'რელიეფი', icon: '⛰️' },
    { id: 'weather', name: 'ამინდი', icon: '☁️' },
    { id: 'fields', name: 'მინდვრები', icon: '🌾' }
  ];

  const handleZoomIn = () => {
    if (zoomLevel < 20) setZoomLevel(zoomLevel + 1);
  };

  const handleZoomOut = () => {
    if (zoomLevel > 1) setZoomLevel(zoomLevel - 1);
  };

  return (
    <div className="gis-page">
      <div className="gis-header">
        <button className="back-button" onClick={() => navigate('/app/weather')}>
          <ArrowLeft size={20} />
          <span>უკან</span>
        </button>
        <h1>GIS - გეოინფორმაციული სისტემა</h1>
      </div>

      <div className="gis-container">
        <div className="gis-sidebar">
          <div className="sidebar-section">
            <h3>
              <Layers size={18} />
              <span>ფენები</span>
            </h3>
            <div className="layers-list">
              {layers.map((layer) => (
                <div
                  key={layer.id}
                  className={`layer-item ${selectedLayer === layer.id ? 'active' : ''}`}
                  onClick={() => setSelectedLayer(layer.id)}
                >
                  <span className="layer-icon">{layer.icon}</span>
                  <span className="layer-name">{layer.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>
              <MapPin size={18} />
              <span>მდებარეობები</span>
            </h3>
            <div className="locations-list">
              <div className="location-item">
                <MapPin size={14} />
                <span>თბილისი</span>
              </div>
              <div className="location-item">
                <MapPin size={14} />
                <span>ბათუმი</span>
              </div>
              <div className="location-item">
                <MapPin size={14} />
                <span>ქუთაისი</span>
              </div>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>ინსტრუმენტები</h3>
            <div className="tools-grid">
              <button className="tool-button" title="ატვირთვა">
                <Upload size={18} />
              </button>
              <button className="tool-button" title="ჩამოტვირთვა">
                <Download size={18} />
              </button>
            </div>
          </div>
        </div>

        <div className="gis-main">
          <div className="map-container">
            {/* Map placeholder */}
            <div className="map-placeholder">
              <div className="placeholder-content">
                <MapPin size={48} />
                <h2>რუკა იტვირთება...</h2>
                <p>აირჩიეთ ფენა და მდებარეობა რუკის სანახავად</p>
                <p className="selected-info">
                  არჩეული ფენა: <strong>{layers.find(l => l.id === selectedLayer)?.name}</strong>
                </p>
              </div>
            </div>

            {/* Map Controls */}
            <div className="map-controls">
              <button className="control-button" onClick={handleZoomIn}>
                <ZoomIn size={20} />
              </button>
              <div className="zoom-level">{zoomLevel}x</div>
              <button className="control-button" onClick={handleZoomOut}>
                <ZoomOut size={20} />
              </button>
            </div>
          </div>

          <div className="map-info">
            <div className="info-card">
              <h3>მიმდინარე ინფორმაცია</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">კოორდინატები:</span>
                  <span className="info-value">41.7151° N, 44.8271° E</span>
                </div>
                <div className="info-item">
                  <span className="info-label">მასშტაბი:</span>
                  <span className="info-value">1:{Math.pow(2, 20 - zoomLevel) * 1000}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">ფენა:</span>
                  <span className="info-value">{layers.find(l => l.id === selectedLayer)?.name}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">თარიღი:</span>
                  <span className="info-value">{new Date().toLocaleDateString('ka-GE')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GisPage;