import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Save,
  X,
  AlertTriangle
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import LeafletMap, { type LeafletMapRef } from '../components/LeafletMap/LeafletMap';
import { useAuth } from '../hooks/useAuth';
import './MyFieldsPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  coordinates: string;
  polygonData?: any;
  companyId?: string;
  companyName?: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface FieldForm {
  name: string;
  crop: string;
  area: number;
  coordinates: string;
}

const MyFieldsPage: React.FC = () => {
  const { user } = useAuth();

  // State management
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fieldsPanelCollapsed, setFieldsPanelCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const mapRef = useRef<LeafletMapRef>(null);

  // Map state
  const mapCenter: [number, number] = [41.7151, 44.8271];
  const mapZoom = 7;
  const [currentDrawnArea, setCurrentDrawnArea] = useState(0);
  const [currentDrawnCoordinates, setCurrentDrawnCoordinates] = useState<any[]>([]);

  // Modal states
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fieldToDelete, setFieldToDelete] = useState<Field | null>(null);
  const [drawnFieldName, setDrawnFieldName] = useState('');
  const [fieldForm, setFieldForm] = useState<FieldForm>({
    name: '',
    crop: '',
    area: 0,
    coordinates: ''
  });

  // Cadastral search state
  const [cadastralSearchQuery, setCadastralSearchQuery] = useState('');
  const [selectedCadastralCode, setSelectedCadastralCode] = useState<string>('');
  const [selectedCadastralArea, setSelectedCadastralArea] = useState<number>(0);

  // Load fields when user data changes
  useEffect(() => {
    // Debug: Check user data
    console.log('Current user:', user);
    console.log('User companyId:', user?.companyId);

    // Only load fields if we have a user with companyId
    if (user?.companyId) {
      loadFields();
    } else if (user && user.role === 'Company') {
      // User is a Company but no companyId yet - try to ensure company
      console.log('Company user without companyId, calling ensureCompany...');
      import('../services/authService').then(({ authService }) => {
        authService.ensureCompany().then(response => {
          console.log('Company ensured:', response);
          // Reload the page to get updated user data
          window.location.reload();
        }).catch(error => {
          console.error('Failed to ensure company:', error);
        });
      });
    }

    // Test cadastral service
    import('../utils/testCadastral').then(() => {
      console.log('Cadastral service test started - check console for results');
    });
  }, [user]); // Re-run when user changes

  // Filter fields when search term changes
  useEffect(() => {
    filterFields();
  }, [searchTerm, fields]);

  const loadFields = async () => {
    try {
      setLoading(true);

      // Debug: Check user and companyId
      console.log('Loading fields for user:', user);
      console.log('Company ID:', user?.companyId);

      if (!user?.companyId) {
        console.warn('No company ID available for loading fields');
        setFields([]);
        setFilteredFields([]);
        setLoading(false);
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
      // Use default empty array if load fails
      setFields([]);
      setFilteredFields([]);
    } finally {
      setLoading(false);
    }
  };

  const filterFields = () => {
    if (searchTerm.trim()) {
      const filtered = fields.filter(field =>
        field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (field.crop || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFields(filtered);
    } else {
      setFilteredFields(fields);
    }
  };

  const selectField = (field: Field) => {
    setSelectedField(field);
    // Center map on field
    if (mapRef.current) {
      mapRef.current.centerOnField(field);
    }
  };

  const editField = (field: Field, event: React.MouseEvent) => {
    event.stopPropagation();
    setSelectedField(field);
    setFieldForm({
      name: field.name,
      crop: field.crop || '',
      area: field.area,
      coordinates: field.coordinates
    });
    setShowFieldModal(true);
  };

  const deleteField = (field: Field, event: React.MouseEvent) => {
    event.stopPropagation();
    setFieldToDelete(field);
    setShowDeleteModal(true);
  };

  const confirmDeleteField = async () => {
    if (!fieldToDelete || !user?.companyId) return;

    try {
      await apiClient.delete(`/fields/${fieldToDelete.id}`, {
        data: { companyId: user.companyId }
      });
      await loadFields();
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting field:', error);
      alert('ველის წაშლა ვერ მოხერხდა');
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setFieldToDelete(null);
  };

  const addNewField = () => {
    setSelectedField(null);
    setFieldForm({
      name: '',
      crop: '',
      area: 0,
      coordinates: ''
    });
    setShowFieldModal(true);
  };

  const saveField = async () => {
    if (!fieldForm.name) {
      alert('გთხოვთ შეავსოთ ყველა აუცილებელი ველი');
      return;
    }

    // Debug: Check user and companyId
    console.log('Current user:', user);
    console.log('Company ID:', user?.companyId);

    if (!user?.companyId) {
      alert('კომპანია ვერ მოიძებნა. გთხოვთ გადატვირთოთ გვერდი.');
      return;
    }

    try {
      const fieldData = {
        ...fieldForm,
        companyId: user.companyId
      };

      console.log('Saving field with data:', fieldData);

      if (selectedField) {
        // Update existing field
        await apiClient.put(`/fields/${selectedField.id}`, fieldData);
      } else {
        // Create new field
        await apiClient.post('/fields', fieldData);
      }
      await loadFields();
      closeFieldModal();
    } catch (error) {
      console.error('Error saving field:', error);
    }
  };

  const closeFieldModal = () => {
    setShowFieldModal(false);
    setSelectedField(null);
    setFieldForm({
      name: '',
      crop: '',
      area: 0,
      coordinates: ''
    });
  };

  const saveDrawnField = async () => {
    if (!drawnFieldName.trim()) {
      alert('გთხოვთ შეიყვანოთ ველის სახელი');
      return;
    }

    // Debug: Check user and companyId
    console.log('Current user:', user);
    console.log('Company ID:', user?.companyId);

    if (!user?.companyId) {
      alert('კომპანია ვერ მოიძებნა. გთხოვთ გადატვირთოთ გვერდი.');
      return;
    }

    try {
      const newField = {
        name: drawnFieldName.trim(),
        crop: 'უცნობი',
        area: currentDrawnArea,
        coordinates: formatCoordinatesForSaving(currentDrawnCoordinates),
        polygonData: currentDrawnCoordinates,
        companyId: user.companyId
      };

      console.log('Saving field with data:', newField);
      await apiClient.post('/fields', newField);
      await loadFields();
      cancelSaveField();
      // Clear drawn items on map
      if (mapRef.current) {
        mapRef.current.clearDrawnItems();
      }
    } catch (error) {
      console.error('Error saving drawn field:', error);
    }
  };

  const cancelSaveField = () => {
    setShowSaveModal(false);
    setCurrentDrawnArea(0);
    setCurrentDrawnCoordinates([]);
    setDrawnFieldName('');
    // Clear drawn items on map
    if (mapRef.current) {
      mapRef.current.clearDrawnItems();
    }
  };

  const formatCoordinatesForSaving = (coordinates: any[]): string => {
    if (!coordinates || coordinates.length === 0) return '';

    return coordinates.map(coord => {
      if (Array.isArray(coord) && coord.length >= 2) {
        return `${coord[0]}, ${coord[1]}`;
      } else if (coord.lat && coord.lng) {
        return `${coord.lat}, ${coord.lng}`;
      }
      return '';
    }).filter(coord => coord !== '').join('; ');
  };

  const toggleFieldsPanel = () => {
    setFieldsPanelCollapsed(!fieldsPanelCollapsed);
  };

  const handleAreaDrawn = (area: number, coordinates: any[]) => {
    setCurrentDrawnArea(area);
    setCurrentDrawnCoordinates(coordinates);
    setShowSaveModal(true);
  };

  const handleCadastralSearch = () => {
    if (cadastralSearchQuery.trim() && mapRef.current) {
      mapRef.current.searchCadastralCode(cadastralSearchQuery.trim());
    }
  };

  const handleCadastralClick = (code: string, area: number) => {
    setSelectedCadastralCode(code);
    setSelectedCadastralArea(area);
    setCadastralSearchQuery(code);
  };

  // Crop types for dropdown
  const cropTypes = [
    'სიმინდი',
    'ხორბალი',
    'ქერი',
    'ბოსტნეული',
    'კარტოფილი',
    'პომიდორი',
    'კიტრი',
    'ხახვი',
    'ნიორი',
    'სხვა'
  ];

  return (
    <div className="my-fields-page">
      <div className="page-header">
        <h1 className="page-title">ჩემი მინდვრები</h1>
        <div className="header-actions">
          <button className="btn-add-field" onClick={addNewField}>
            <Plus size={18} />
            <span>ახალი ველი</span>
          </button>
        </div>
      </div>

      <div className="map-wrapper">
        <div className="map-container">
          {/* Leaflet Map */}
          <div className="map-view">
            <LeafletMap
              ref={mapRef}
              fields={fields}
              selectedField={selectedField}
              onFieldSelect={selectField}
              onAreaDrawn={handleAreaDrawn}
              onCadastralClick={handleCadastralClick}
              center={mapCenter}
              zoom={mapZoom}
              enableDrawing={true}
            />
          </div>

          {/* Fields List Panel */}
          <div className={`fields-panel ${fieldsPanelCollapsed ? 'collapsed' : ''}`}>
            <button
              className="panel-toggle-trigger"
              onClick={toggleFieldsPanel}
              title={fieldsPanelCollapsed ? 'გაშლა' : 'აკეცვა'}
            >
              {fieldsPanelCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
            <div className="fields-panel-header">
              {!fieldsPanelCollapsed && <h3>ჩემი მინდვრების სია</h3>}
            </div>

            <div className="fields-content" style={{ display: fieldsPanelCollapsed ? 'none' : 'block' }}>
              {/* Area Display */}
              {currentDrawnArea > 0 && (
                <div className="area-display">
                  <div className="area-info">
                    <h4>დახატული ფართობი</h4>
                    <p className="area-value">{currentDrawnArea} ჰა</p>
                    <span className="area-note">რეალური ჰექტარები</span>
                  </div>
                </div>
              )}

              {/* Cadastral Search */}
              <div className="cadastral-search">
                <div className="search-header">
                  <h4>საკადასტრო კოდით ძებნა</h4>
                </div>
                <div className="search-input-group">
                  <input
                    type="text"
                    value={cadastralSearchQuery}
                    onChange={(e) => setCadastralSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCadastralSearch()}
                    placeholder="XX.XX.XX.XXX"
                    className="cadastral-input"
                  />
                  <button
                    className="search-btn"
                    onClick={handleCadastralSearch}
                    title="ძებნა"
                  >
                    <Search size={18} />
                  </button>
                </div>
                {selectedCadastralCode && (
                  <div className="cadastral-result">
                    <p className="code-display">კოდი: <strong>{selectedCadastralCode}</strong></p>
                    {selectedCadastralArea > 0 && (
                      <p className="area-display">ფართობი: <strong>{(selectedCadastralArea / 10000).toFixed(2)} ჰა</strong></p>
                    )}
                  </div>
                )}
              </div>

              {/* Search Bar */}
              <div className="fields-search">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ძებნა..."
                  className="search-input"
                />
              </div>

              {/* Fields Statistics */}
              <div className="fields-stats">
                <div className="stat-item">
                  <span className="stat-value">{fields.length}</span>
                  <span className="stat-label">სულ ველები</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {fields.reduce((sum, field) => sum + field.area, 0).toFixed(2)}
                  </span>
                  <span className="stat-label">სულ ჰექტარი</span>
                </div>
              </div>

              {/* Fields List */}
              <div className="fields-list">
                {loading ? (
                  <div className="loading-state">იტვირთება...</div>
                ) : filteredFields.length === 0 ? (
                  <div className="empty-state">
                    <Map size={48} />
                    <p>ველები არ მოიძებნა</p>
                    <button className="btn-add-first" onClick={addNewField}>
                      დაამატე პირველი ველი
                    </button>
                  </div>
                ) : (
                  filteredFields.map(field => (
                    <div
                      key={field.id}
                      className={`field-item ${selectedField?.id === field.id ? 'selected' : ''}`}
                      onClick={() => selectField(field)}
                    >
                      <div className="field-main-info">
                        <h4 className="field-name">{field.name}</h4>
                        <p className="field-crop">{field.crop || 'არ არის მითითებული'}</p>
                      </div>
                      <div className="field-details">
                        <span className="field-area">{field.area} ჰა</span>
                      </div>
                      <div className="field-actions">
                        <button
                          className="action-btn"
                          onClick={(e) => editField(field, e)}
                          title="რედაქტირება"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={(e) => deleteField(field, e)}
                          title="წაშლა"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Field Modal */}
      {showFieldModal && (
        <div className="modal-overlay" onClick={closeFieldModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedField ? 'ველის რედაქტირება' : 'ახალი ველის დამატება'}</h2>
              <button className="modal-close" onClick={closeFieldModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>ველის სახელი *</label>
                <input
                  type="text"
                  value={fieldForm.name}
                  onChange={(e) => setFieldForm({ ...fieldForm, name: e.target.value })}
                  placeholder="მაგ: ჩრდილოეთი ნაკვეთი"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>კულტურა</label>
                <select
                  value={fieldForm.crop}
                  onChange={(e) => setFieldForm({ ...fieldForm, crop: e.target.value })}
                  className="form-select"
                >
                  <option value="">აირჩიეთ კულტურა</option>
                  {cropTypes.map(crop => (
                    <option key={crop} value={crop}>{crop}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>ფართობი (ჰა)</label>
                <input
                  type="number"
                  value={fieldForm.area}
                  onChange={(e) => setFieldForm({ ...fieldForm, area: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>კოორდინატები</label>
                <textarea
                  value={fieldForm.coordinates}
                  onChange={(e) => setFieldForm({ ...fieldForm, coordinates: e.target.value })}
                  placeholder="41.7151, 44.8271"
                  className="form-textarea"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeFieldModal}>
                გაუქმება
              </button>
              <button className="btn-save" onClick={saveField}>
                <Save size={18} />
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Drawn Field Modal */}
      {showSaveModal && (
        <div className="modal-overlay" onClick={cancelSaveField}>
          <div className="modal-content small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>დახატული ველის შენახვა</h2>
            </div>
            <div className="modal-body">
              <div className="drawn-area-info">
                <p>ფართობი: <strong>{currentDrawnArea} ჰა</strong></p>
              </div>
              <div className="form-group">
                <label>ველის სახელი *</label>
                <input
                  type="text"
                  value={drawnFieldName}
                  onChange={(e) => setDrawnFieldName(e.target.value)}
                  placeholder="შეიყვანეთ ველის სახელი"
                  className="form-input"
                  autoFocus
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={cancelSaveField}>
                გაუქმება
              </button>
              <button className="btn-save" onClick={saveDrawnField}>
                <Save size={18} />
                შენახვა
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fieldToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header delete-header">
              <div className="warning-icon">
                <AlertTriangle size={24} />
              </div>
              <h2>ველის წაშლა</h2>
              <button className="modal-close" onClick={closeDeleteModal}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p className="delete-message">
                დარწმუნებული ხართ, რომ გსურთ ამ ველის წაშლა?
              </p>
              <div className="field-to-delete">
                <div className="field-icon">
                  <Map size={24} />
                </div>
                <div className="field-info">
                  <h4>{fieldToDelete.name}</h4>
                  <p>ფართობი: {fieldToDelete.area} ჰა</p>
                </div>
              </div>
              <p className="delete-warning">
                <AlertTriangle size={16} />
                ეს მოქმედება შეუქცევადია
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={closeDeleteModal}>
                გაუქმება
              </button>
              <button className="btn-delete" onClick={confirmDeleteField}>
                <Trash2 size={18} />
                წაშლა
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyFieldsPage;