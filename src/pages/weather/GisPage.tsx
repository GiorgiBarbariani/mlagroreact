import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Map, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LeafletMap, { type LeafletMapRef } from '../../components/LeafletMap/LeafletMap';
import FieldWeatherModal from '../../components/FieldWeatherModal/FieldWeatherModal';
import { apiClient } from '../../api/apiClient';
import { useAuth } from '../../hooks/useAuth';
import './GisPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  coordinates: string;
  polygonData?: any;
}

const GisPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const mapRef = useRef<LeafletMapRef>(null);

  // State
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showWeatherModal, setShowWeatherModal] = useState(false);

  // Map center and zoom (Georgia)
  const mapCenter: [number, number] = [41.7151, 44.8271];
  const mapZoom = 7;

  // Load fields
  useEffect(() => {
    if (user?.companyId) {
      loadFields();
    }
  }, [user]);

  // Filter fields when search changes
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

  const loadFields = async () => {
    try {
      setLoading(true);
      if (!user?.companyId) {
        setFields([]);
        setFilteredFields([]);
        return;
      }

      const response = await apiClient.get(`/fields?companyId=${user.companyId}`);
      if (response.data && response.data.data) {
        setFields(response.data.data);
        setFilteredFields(response.data.data);
      } else if (response.data) {
        setFields(response.data);
        setFilteredFields(response.data);
      }
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
      setFilteredFields([]);
    } finally {
      setLoading(false);
    }
  };

  const selectField = (field: Field) => {
    setSelectedField(field);
    setShowWeatherModal(true);
    if (mapRef.current) {
      mapRef.current.centerOnField(field);
    }
  };

  const closeWeatherModal = () => {
    setShowWeatherModal(false);
  };

  const handleAddPoint = (name: string) => {
    console.log('Adding point:', name);
    // TODO: Implement point saving logic
    setShowWeatherModal(false);
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
        <div className="gis-main">
          <div className="map-container">
            <LeafletMap
              ref={mapRef}
              fields={fields}
              selectedField={selectedField}
              onFieldSelect={selectField}
              onAreaDrawn={() => {}}
              center={mapCenter}
              zoom={mapZoom}
              enableDrawing={false}
            />
          </div>
        </div>

        <div className="gis-sidebar">
          <div className="sidebar-header">
            <h3>
              <Map size={18} />
              <span>ჩემი მინდვრები</span>
            </h3>
          </div>

          <div className="fields-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ძებნა..."
              className="search-input"
            />
          </div>

          <div className="fields-list">
            {loading ? (
              <div className="loading-state">იტვირთება...</div>
            ) : filteredFields.length === 0 ? (
              <div className="empty-state">
                <Map size={32} />
                <p>მინდვრები არ მოიძებნა</p>
              </div>
            ) : (
              filteredFields.map(field => (
                <div
                  key={field.id}
                  className={`field-item ${selectedField?.id === field.id ? 'selected' : ''}`}
                  onClick={() => selectField(field)}
                >
                  <div className="field-info">
                    <h4 className="field-name">{field.name}</h4>
                    <p className="field-crop">{field.crop || 'არ არის მითითებული'}</p>
                  </div>
                  <span className="field-area">{field.area} ჰა</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Weather Modal */}
      {showWeatherModal && selectedField && (
        <FieldWeatherModal
          field={selectedField}
          onClose={closeWeatherModal}
          onAddPoint={handleAddPoint}
        />
      )}
    </div>
  );
};

export default GisPage;
