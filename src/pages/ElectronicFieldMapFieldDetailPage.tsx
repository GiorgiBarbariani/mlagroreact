import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Copy,
  MapPin,
  Leaf,
  Droplets,
  Bug,
  FileText,
  History,
  Layers,
  Save,
  X,
  Plus,
  Download,
  Trash2,
  BarChart2
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import LeafletMap, { type LeafletMapRef } from '../components/LeafletMap/LeafletMap';
import './ElectronicFieldMapFieldDetailPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  fieldArea?: number;
  crop?: string;
  cropName?: string;
  coordinates?: string;
  polygonData?: number[][] | string;
  polygonJson?: string;
  companyId?: string;
  regionName?: string;
  regionId?: string;
  soilType?: string;
  soilTypeId?: string;
  district?: string;
  cadastreNumber?: string;
  comment?: string;
  bonitetScore?: number;
  agroclimaticZone?: string;
}

// Helper function to parse polygon data into the format expected by LeafletMap
const parsePolygonData = (field: Field): number[][] | null => {
  // Try polygonData first
  if (field.polygonData) {
    if (Array.isArray(field.polygonData)) {
      return field.polygonData;
    }
    if (typeof field.polygonData === 'string') {
      try {
        return JSON.parse(field.polygonData);
      } catch (e) {
        console.error('Error parsing polygonData:', e);
      }
    }
  }

  // Try polygonJson
  if (field.polygonJson) {
    try {
      const parsed = JSON.parse(field.polygonJson);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      console.error('Error parsing polygonJson:', e);
    }
  }

  // Try coordinates string
  if (field.coordinates && typeof field.coordinates === 'string') {
    try {
      // Format: "lat1,lng1;lat2,lng2;..."
      const pairs = field.coordinates.split(';').map(pair => {
        const [lat, lng] = pair.trim().split(',').map(Number);
        return [lat, lng];
      }).filter(coord => !isNaN(coord[0]) && !isNaN(coord[1]));

      if (pairs.length > 0) {
        return pairs;
      }
    } catch (e) {
      console.error('Error parsing coordinates:', e);
    }
  }

  return null;
};

// Helper function to get the center of a field's polygon
const getFieldCenter = (field: Field): [number, number] => {
  const polygonData = parsePolygonData(field);

  if (polygonData && polygonData.length > 0) {
    let sumLat = 0, sumLng = 0;
    polygonData.forEach(coord => {
      // Coordinates can be [lat, lng] or [lng, lat] depending on format
      sumLat += coord[0];
      sumLng += coord[1];
    });
    return [sumLat / polygonData.length, sumLng / polygonData.length];
  }

  // Default to Georgia center
  return [41.7151, 44.8271];
};

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface Season {
  id: string;
  fieldId: string;
  cropId?: string;
  cropName?: string;
  crop?: string;
  plantingDate?: string;
  harvestDate?: string;
  area?: number;
  comment?: string;
  year?: number;
  status?: string;
}

const ElectronicFieldMapFieldDetailPage: React.FC = () => {
  const { fieldId } = useParams<{ fieldId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const mapRef = React.useRef<LeafletMapRef>(null);

  const [field, setField] = useState<Field | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Field>>({});
  const [saving, setSaving] = useState(false);

  // History/Seasons state
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [seasonsLoading, setSeasonsLoading] = useState(false);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [seasonForm, setSeasonForm] = useState<Partial<Season>>({});
  const [editingSeasonId, setEditingSeasonId] = useState<string | null>(null);
  const [savingSeason, setSavingSeason] = useState(false);
  const [crops, setCrops] = useState<{ id: string; name: string; nameKa?: string }[]>([]);

  const menuItems: MenuItem[] = [
    { id: 'general', label: 'ზოგადი ინფორმაცია', icon: <FileText size={18} /> },
    { id: 'history', label: ' დანათესების ისტორია ', icon: <History size={18} /> },
    { id: 'soil-preparation', label: 'ნიადაგის მომზადება', icon: <Layers size={18} /> },
    { id: 'irrigation', label: 'ირიგაცია / მელიორაცია', icon: <Droplets size={18} /> },
    { id: 'fertilizers', label: 'სასუქები, პესტიციდები', icon: <Leaf size={18} /> },
    { id: 'diseases', label: 'დაავადებები და მავნებლები', icon: <Bug size={18} /> },
    { id: 'recommendations', label: 'რეკომენდაციები', icon: <MapPin size={18} /> },
  ];

  useEffect(() => {
    // Set active tab from URL
    const pathParts = location.pathname.split('/');
    const tabFromUrl = pathParts[pathParts.length - 1];
    if (menuItems.some(item => item.id === tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (fieldId) {
      loadField();
    }
  }, [fieldId, user?.companyId]);

  useEffect(() => {
    if (activeTab === 'history' && fieldId) {
      loadSeasons();
      loadCrops();
    }
  }, [activeTab, fieldId]);

  const loadField = async () => {
    if (!fieldId) return;

    setLoading(true);
    try {
      let fieldData = null;

      // Try to get field using company endpoint first
      if (user?.companyId) {
        try {
          const response = await apiClient.get(`/fields/company/${user.companyId}/${fieldId}`);
          fieldData = response.data?.data || response.data;
        } catch (err) {
          console.log('Company endpoint failed, trying alternative');
        }
      }

      // If company endpoint fails, try getting all fields and finding the one we need
      if (!fieldData) {
        try {
          const url = user?.companyId
            ? `/fields?companyId=${user.companyId}`
            : '/fields';
          const response = await apiClient.get(url);
          const allFields = response.data?.data || response.data || [];
          fieldData = allFields.find((f: Field) => f.id === fieldId);
        } catch (err) {
          console.error('Error fetching fields list:', err);
        }
      }

      if (fieldData) {
        setField(fieldData);
        setEditForm(fieldData);
      }
    } catch (error) {
      console.error('Error loading field:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    navigate(`/app/electronic-field-map/fields/${fieldId}/${tabId}`);
  };

  const handleBack = () => {
    navigate('/app/electronic-field-map/fields');
  };

  const handleCopyField = () => {
    if (field?.polygonJson || field?.coordinates) {
      const textToCopy = field.polygonJson || field.coordinates || '';
      navigator.clipboard.writeText(textToCopy).then(() => {
        alert('კოორდინატები დაკოპირებულია');
      }).catch(() => {
        alert('კოპირება ვერ მოხერხდა');
      });
    }
  };

  const handleEditField = () => {
    setEditForm(field || {});
    setShowEditModal(true);
  };

  const handleSaveField = async () => {
    if (!fieldId || !editForm || !user?.companyId) return;

    setSaving(true);
    try {
      await apiClient.put(`/fields/company/${user.companyId}/${fieldId}`, {
        ...editForm
      });
      await loadField();
      setShowEditModal(false);
    } catch (error) {
      console.error('Error saving field:', error);
      alert('შენახვა ვერ მოხერხდა');
    } finally {
      setSaving(false);
    }
  };

  const loadSeasons = async () => {
    if (!fieldId) return;

    setSeasonsLoading(true);
    try {
      // Try different endpoints for seasons data
      let seasonsData: Season[] = [];

      try {
        const response = await apiClient.get(`/seasons/field/${fieldId}`);
        seasonsData = response.data?.data || response.data || [];
      } catch (err) {
        console.log('Seasons endpoint failed, trying alternative');
        try {
          const response = await apiClient.get(`/fields/${fieldId}/seasons`);
          seasonsData = response.data?.data || response.data || [];
        } catch (err2) {
          console.log('Alternative seasons endpoint also failed');
        }
      }

      setSeasons(seasonsData);
    } catch (error) {
      console.error('Error loading seasons:', error);
      setSeasons([]);
    } finally {
      setSeasonsLoading(false);
    }
  };

  const loadCrops = async () => {
    try {
      const response = await apiClient.get('/dictionaries/crops');
      const cropsData = response.data?.data || response.data || [];
      setCrops(cropsData);
    } catch (error) {
      console.error('Error loading crops:', error);
      setCrops([]);
    }
  };

  const handleAddSeason = () => {
    setSeasonForm({
      fieldId: fieldId,
      plantingDate: new Date().toISOString().split('T')[0]
    });
    setEditingSeasonId(null);
    setShowSeasonModal(true);
  };

  const handleEditSeason = (season: Season) => {
    setSeasonForm(season);
    setEditingSeasonId(season.id);
    setShowSeasonModal(true);
  };

  const handleDeleteSeason = async (seasonId: string) => {
    if (!confirm('დარწმუნებული ხართ რომ გსურთ წაშლა?')) return;

    try {
      await apiClient.delete(`/seasons/${seasonId}`);
      await loadSeasons();
    } catch (error) {
      console.error('Error deleting season:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleSaveSeason = async () => {
    if (!fieldId || !seasonForm) return;

    setSavingSeason(true);
    try {
      if (editingSeasonId) {
        await apiClient.put(`/seasons/${editingSeasonId}`, {
          ...seasonForm,
          fieldId
        });
      } else {
        await apiClient.post('/seasons', {
          ...seasonForm,
          fieldId
        });
      }
      await loadSeasons();
      setShowSeasonModal(false);
      setSeasonForm({});
      setEditingSeasonId(null);
    } catch (error) {
      console.error('Error saving season:', error);
      alert('შენახვა ვერ მოხერხდა');
    } finally {
      setSavingSeason(false);
    }
  };

  const handleExportSeasons = async () => {
    try {
      const response = await apiClient.post('/seasons/export', {
        format: 'csv',
        fieldId: fieldId,
        seasonIds: seasons.map(s => s.id)
      }, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seasons_${fieldId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('ექსპორტის შეცდომა');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('ka-GE');
    } catch {
      return dateString;
    }
  };

  const renderGeneralContent = () => (
    <div className="general-content">
      <div className="card-container">
        <div className="content-header">
          <h2>ზოგადი ინფორმაცია</h2>
          <div className="header-actions">
            <button className="copy-btn" onClick={handleCopyField}>
              <Copy size={16} />
              ველის კოპირება
            </button>
            <button className="edit-btn" onClick={handleEditField}>
              <Edit2 size={16} />
              რედაქტირება
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>იტვირთება...</p>
          </div>
        ) : field ? (
          <div className="field-info-container">
            <div className="info-layout">
              {/* Map Section */}
              <div className="map-section">
                <div className="map-wrapper">
                  <LeafletMap
                    ref={mapRef}
                    fields={[{
                      ...field,
                      polygonData: parsePolygonData(field),
                      coordinates: field.coordinates || ''
                    }]}
                    selectedField={{
                      ...field,
                      polygonData: parsePolygonData(field),
                      coordinates: field.coordinates || ''
                    }}
                    onFieldSelect={() => {}}
                    onAreaDrawn={() => {}}
                    center={getFieldCenter(field)}
                    zoom={15}
                    enableDrawing={false}
                  />
                </div>
                <button className="edit-map-btn" onClick={handleEditField}>
                  რედაქტირება
                </button>
              </div>

              {/* Info Section */}
              <div className="info-section">
                <div className="info-row">
                  <span className="info-label">ველის სახელი</span>
                  <span className="info-value">{field.name || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">ფართობი</span>
                  <span className="info-value">{field.fieldArea || field.area || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">ნიადაგის ტიპი</span>
                  <span className="info-value">{field.soilType || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">რეგიონი</span>
                  <span className="info-value">{field.regionName || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">რაიონი</span>
                  <span className="info-value">{field.district || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">კადასტრი</span>
                  <span className="info-value">{field.cadastreNumber || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">კომენტარი</span>
                  <span className="info-value">{field.comment || '-'}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p>ველი ვერ მოიძებნა</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderHistoryContent = () => (
    <div className="history-content">
      <div className="card-container">
        <div className="content-header">
          <h2>დანათესების ისტორია</h2>
          <div className="header-actions">
            <button className="export-btn" onClick={handleExportSeasons}>
              <Download size={16} />
              ექსპორტი
            </button>
            <button className="add-btn" onClick={handleAddSeason}>
              <Plus size={16} />
              დამატება
            </button>
          </div>
        </div>

        {seasonsLoading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>იტვირთება...</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="seasons-table">
              <thead>
                <tr>
                  <th>კულტურა</th>
                  <th>დარგვის თარიღი</th>
                  <th>ფართობი ჰა</th>
                  <th>კომენტარი</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {seasons.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-state">
                      დანათესების ისტორია არ მოიძებნა
                    </td>
                  </tr>
                ) : (
                  seasons.map((season) => (
                    <tr key={season.id}>
                      <td className="crop-name">{season.cropName || season.crop || '-'}</td>
                      <td className="planting-date">{formatDate(season.plantingDate)}</td>
                      <td className="area">{season.area ? `${season.area} ჰა` : '-'}</td>
                      <td className="comment">{season.comment || '-'}</td>
                      <td className="actions">
                        <button className="action-btn chart-btn" title="გრაფიკი">
                          <BarChart2 size={16} />
                        </button>
                        <button
                          className="action-btn edit-btn"
                          onClick={() => handleEditSeason(season)}
                          title="რედაქტირება"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDeleteSeason(season.id)}
                          title="წაშლა"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderPlaceholderContent = (title: string) => (
    <div className="placeholder-content">
      <h2>{title}</h2>
      <div className="coming-soon">
        <FileText size={48} />
        <p>ეს სექცია მალე იქნება ხელმისაწვდომი</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralContent();
      case 'history':
        return renderHistoryContent();
      case 'soil-preparation':
        return renderPlaceholderContent('ნიადაგის მომზადება');
      case 'irrigation':
        return renderPlaceholderContent('ირიგაცია / მელიორაცია');
      case 'fertilizers':
        return renderPlaceholderContent('სასუქები, პესტიციდები');
      case 'diseases':
        return renderPlaceholderContent('დაავადებები და მავნებლები');
      case 'recommendations':
        return renderPlaceholderContent('რეკომენდაციები');
      default:
        return renderGeneralContent();
    }
  };

  return (
    <div className="electronic-field-map-field-detail-page">
      {/* Header */}
      <div className="page-header">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>პასპორტი</span>
        </button>
      </div>

      {/* Main Layout */}
      <div className="page-content">
        {/* Left Menu */}
        <div className="menu-sidebar">
          <ul className="menu-list">
            {menuItems.map((item) => (
              <li
                key={item.id}
                className={`menu-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => handleTabChange(item.id)}
              >
                {item.icon}
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {renderTabContent()}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ზოგადი ინფორმაცია</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>სახელი</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="შეიყვანეთ"
                />
              </div>
              <div className="form-group">
                <label>ბონიტეტის ქულა</label>
                <input
                  type="number"
                  value={editForm.bonitetScore || ''}
                  onChange={(e) => setEditForm({ ...editForm, bonitetScore: Number(e.target.value) })}
                  placeholder="1-100"
                />
              </div>
              <div className="form-group">
                <label>რეგიონი</label>
                <input
                  type="text"
                  value={editForm.regionName || ''}
                  onChange={(e) => setEditForm({ ...editForm, regionName: e.target.value })}
                  placeholder="აირჩიეთ"
                />
              </div>
              <div className="form-group">
                <label>ნიადაგის ტიპი</label>
                <input
                  type="text"
                  value={editForm.soilType || ''}
                  onChange={(e) => setEditForm({ ...editForm, soilType: e.target.value })}
                  placeholder="აირჩიეთ"
                />
              </div>
              <div className="form-group">
                <label>აგროკლიმატური ზონა</label>
                <input
                  type="text"
                  value={editForm.agroclimaticZone || ''}
                  onChange={(e) => setEditForm({ ...editForm, agroclimaticZone: e.target.value })}
                  placeholder="აირჩიეთ"
                />
              </div>
              <div className="form-group">
                <label>კომენტარი</label>
                <textarea
                  value={editForm.comment || ''}
                  onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                  placeholder="კომენტარი"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowEditModal(false)}>
                გაუქმება
              </button>
              <button className="save-btn" onClick={handleSaveField} disabled={saving}>
                <Save size={16} />
                {saving ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Season Modal */}
      {showSeasonModal && (
        <div className="modal-overlay" onClick={() => setShowSeasonModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSeasonId ? 'რედაქტირება' : 'დანათესის დამატება'}</h2>
              <button className="modal-close" onClick={() => setShowSeasonModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>კულტურა</label>
                <select
                  value={seasonForm.cropId || ''}
                  onChange={(e) => {
                    const selectedCrop = crops.find(c => c.id === e.target.value);
                    setSeasonForm({
                      ...seasonForm,
                      cropId: e.target.value,
                      cropName: selectedCrop?.nameKa || selectedCrop?.name || ''
                    });
                  }}
                >
                  <option value="">აირჩიეთ კულტურა</option>
                  {crops.map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {crop.nameKa || crop.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>დარგვის თარიღი</label>
                <input
                  type="date"
                  value={seasonForm.plantingDate || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, plantingDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>მოსავლის აღების თარიღი</label>
                <input
                  type="date"
                  value={seasonForm.harvestDate || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, harvestDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>ფართობი (ჰა)</label>
                <input
                  type="number"
                  step="0.01"
                  value={seasonForm.area || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, area: Number(e.target.value) })}
                  placeholder="შეიყვანეთ ფართობი"
                />
              </div>
              <div className="form-group">
                <label>კომენტარი</label>
                <textarea
                  value={seasonForm.comment || ''}
                  onChange={(e) => setSeasonForm({ ...seasonForm, comment: e.target.value })}
                  placeholder="კომენტარი"
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSeasonModal(false)}>
                გაუქმება
              </button>
              <button className="save-btn" onClick={handleSaveSeason} disabled={savingSeason}>
                <Save size={16} />
                {savingSeason ? 'ინახება...' : 'შენახვა'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectronicFieldMapFieldDetailPage;
