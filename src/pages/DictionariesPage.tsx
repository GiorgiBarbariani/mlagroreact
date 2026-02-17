import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Cloud,
  BookOpen,
  Droplets,
  Leaf,
  ChevronRight,
  ArrowLeft,
  Plus,
  Download,
  Edit2,
  Trash2,
  X,
  Save,
  ChevronLeft,
  ChevronDown,
  Search
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import './DictionariesPage.scss';

// Dictionary sections data
interface DictionaryItem {
  id: string;
  key: string;
  label: string;
  labelKa: string;
  endpoint: string;
}

interface DictionarySection {
  id: string;
  key: string;
  label: string;
  labelKa: string;
  icon: React.ReactNode;
  color: string;
  items: DictionaryItem[];
}

const dictionarySections: DictionarySection[] = [
  {
    id: '1',
    key: 'regions',
    label: 'Regions',
    labelKa: 'რეგიონები',
    icon: <MapPin size={24} />,
    color: '#4CAF50',
    items: [
      { id: '1-1', key: 'regions-data', label: 'Regions Data', labelKa: 'რეგიონების მონაცემები', endpoint: '/regions' },
      { id: '1-2', key: 'administrative-units', label: 'Administrative Units', labelKa: 'ადმინისტრაციული ერთეულები', endpoint: '/administrative-units' },
      { id: '1-3', key: 'municipalities', label: 'Municipalities', labelKa: 'მუნიციპალიტეტები', endpoint: '/municipalities' },
    ]
  },
  {
    id: '2',
    key: 'climate-data',
    label: 'Climate Data',
    labelKa: 'კლიმატური მონაცემები',
    icon: <Cloud size={24} />,
    color: '#2196F3',
    items: [
      { id: '2-1', key: 'agroclimatic-zones', label: 'Agroclimatic Zones', labelKa: 'აგროკლიმატური ზონები', endpoint: '/agroclimatic-zones' },
      { id: '2-2', key: 'weather-stations', label: 'Weather Stations', labelKa: 'მეტეოროლოგიური სადგურები', endpoint: '/weather-stations' },
      { id: '2-3', key: 'climatic-standards', label: 'Climatic Standards', labelKa: 'კლიმატური სტანდარტები', endpoint: '/climatic-standards' },
    ]
  },
  {
    id: '3',
    key: 'general-dictionaries',
    label: 'General Dictionaries',
    labelKa: 'ზოგადი ცნობარები',
    icon: <BookOpen size={24} />,
    color: '#9C27B0',
    items: [
      { id: '3-1', key: 'measurement-units', label: 'Measurement Units', labelKa: 'საზომი ერთეულები', endpoint: '/measurement-units' },
      { id: '3-2', key: 'dictionary-types', label: 'Dictionary Types', labelKa: 'ცნობარის ტიპები', endpoint: '/dictionary-types' },
      { id: '3-3', key: 'task-statuses', label: 'Task Statuses', labelKa: 'ამოცანის სტატუსები', endpoint: '/task-statuses' },
      { id: '3-4', key: 'tags', label: 'Tags', labelKa: 'თეგები', endpoint: '/tags' },
    ]
  },
  {
    id: '4',
    key: 'natural-resources',
    label: 'Natural Resources',
    labelKa: 'ბუნებრივი რესურსები',
    icon: <Droplets size={24} />,
    color: '#00BCD4',
    items: [
      { id: '4-1', key: 'water-resources', label: 'Water Resources', labelKa: 'წყლის რესურსები', endpoint: '/water-resources' },
      { id: '4-2', key: 'irrigation-sources', label: 'Irrigation Sources', labelKa: 'სარწყავი წყაროები', endpoint: '/irrigation-sources' },
      { id: '4-3', key: 'soil-types', label: 'Soil Types', labelKa: 'ნიადაგის ტიპები', endpoint: '/soil-types' },
    ]
  },
  {
    id: '5',
    key: 'agro-data',
    label: 'Agricultural Data',
    labelKa: 'სასოფლო-სამეურნეო მონაცემები',
    icon: <Leaf size={24} />,
    color: '#FF9800',
    items: [
      { id: '5-1', key: 'crops', label: 'Crops', labelKa: 'კულტურები', endpoint: '/dictionaries/crops' },
      { id: '5-2', key: 'diseases', label: 'Diseases', labelKa: 'დაავადებები', endpoint: '/dictionaries/diseases' },
      { id: '5-3', key: 'fertilizers', label: 'Fertilizers', labelKa: 'სასუქები', endpoint: '/dictionaries/fertilizers' },
      { id: '5-4', key: 'pesticides', label: 'Pesticides', labelKa: 'პესტიციდები', endpoint: '/dictionaries/pesticides' },
      { id: '5-5', key: 'irrigation-methods', label: 'Irrigation Methods', labelKa: 'მორწყვის მეთოდები', endpoint: '/dictionaries/irrigation-methods' },
    ]
  }
];

interface DictionaryRecord {
  id: string;
  name?: string;
  nameKa?: string;
  nameEn?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
  [key: string]: any;
}

const DictionariesPage: React.FC = () => {
  const { section, page } = useParams<{ section?: string; page?: string }>();
  const navigate = useNavigate();

  // State for detail page
  const [records, setRecords] = useState<DictionaryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<DictionaryRecord | null>(null);
  const [formData, setFormData] = useState<Partial<DictionaryRecord>>({});
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const currentSection = dictionarySections.find(s => s.key === section);
  const currentItem = currentSection?.items.find(i => i.key === page);

  useEffect(() => {
    if (page && currentItem) {
      loadRecords();
    }
  }, [page, currentPage, pageSize, searchQuery]);

  const loadRecords = async () => {
    if (!currentItem) return;

    setLoading(true);
    try {
      const response = await apiClient.get(currentItem.endpoint, {
        params: {
          page: currentPage,
          limit: pageSize,
          search: searchQuery || undefined
        }
      });
      const data = response.data?.data || response.data || [];
      setRecords(Array.isArray(data) ? data : []);
      setTotalCount(response.data?.total || data.length || 0);
    } catch (error) {
      console.error('Error loading records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingRecord(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (record: DictionaryRecord) => {
    setEditingRecord(record);
    setFormData(record);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingId || !currentItem) return;

    try {
      await apiClient.delete(`${currentItem.endpoint}/${deletingId}`);
      await loadRecords();
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('წაშლა ვერ მოხერხდა');
    }
  };

  const handleSave = async () => {
    if (!currentItem) return;

    setSaving(true);
    try {
      if (editingRecord) {
        await apiClient.put(`${currentItem.endpoint}/${editingRecord.id}`, formData);
      } else {
        await apiClient.post(currentItem.endpoint, formData);
      }
      await loadRecords();
      setShowModal(false);
      setFormData({});
      setEditingRecord(null);
    } catch (error) {
      console.error('Error saving record:', error);
      alert('შენახვა ვერ მოხერხდა');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    if (!currentItem) return;

    try {
      const response = await apiClient.get(`${currentItem.endpoint}/export`, {
        responseType: 'blob'
      });
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentItem.key}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Render main categories page
  const renderMainPage = () => {
    // Featured section - Agricultural Data
    const featuredSection = dictionarySections.find(s => s.key === 'agro-data');
    const otherSections = dictionarySections.filter(s => s.key !== 'agro-data');

    return (
      <div className="dictionaries-main">
        <div className="page-header">
          <h1>ცნობარები</h1>
          <p>სისტემის ცნობარების მართვა</p>
        </div>

        {/* Featured Section - Agricultural Data */}
        {featuredSection && (
          <div className="featured-section">
            <div
              className="featured-card"
              onClick={() => navigate(`/app/dictionaries/${featuredSection.key}`)}
              style={{ background: `linear-gradient(135deg, ${featuredSection.color} 0%, ${featuredSection.color}dd 100%)` }}
            >
              <div className="featured-icon">
                {featuredSection.icon}
              </div>
              <div className="featured-content">
                <h2>{featuredSection.labelKa}</h2>
                <span className="featured-count">{featuredSection.items.length} ცნობარი</span>
              </div>
              <ChevronRight size={24} className="featured-arrow" />
            </div>

            <div className="featured-items">
              {featuredSection.items.map((item) => (
                <div
                  key={item.id}
                  className="featured-item"
                  onClick={() => navigate(`/app/dictionaries/${featuredSection.key}/${item.key}`)}
                >
                  <span>{item.labelKa}</span>
                  <ChevronRight size={16} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Categories */}
        <div className="other-categories">
          <h3>სხვა ცნობარები</h3>
          <div className="categories-grid">
            {otherSections.map((section) => (
              <div
                key={section.id}
                className="category-card"
                onClick={() => navigate(`/app/dictionaries/${section.key}`)}
                style={{ '--card-color': section.color } as React.CSSProperties}
              >
                <div className="card-icon" style={{ backgroundColor: section.color }}>
                  {section.icon}
                </div>
                <div className="card-content">
                  <h3>{section.labelKa}</h3>
                  <span className="item-count">{section.items.length} ცნობარი</span>
                </div>
                <ChevronRight size={20} className="card-arrow" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render section page (list of items in a category)
  const renderSectionPage = () => {
    if (!currentSection) {
      return <div className="not-found">სექცია ვერ მოიძებნა</div>;
    }

    return (
      <div className="dictionaries-section">
        <div className="section-header">
          <button className="back-btn" onClick={() => navigate('/app/dictionaries')}>
            <ArrowLeft size={20} />
            <span>უკან</span>
          </button>
          <div className="section-title">
            <div className="section-icon" style={{ backgroundColor: currentSection.color }}>
              {currentSection.icon}
            </div>
            <h1>{currentSection.labelKa}</h1>
          </div>
        </div>

        <div className="section-items">
          {currentSection.items.map((item) => (
            <div
              key={item.id}
              className="section-item"
              onClick={() => navigate(`/app/dictionaries/${section}/${item.key}`)}
            >
              <span className="item-label">{item.labelKa}</span>
              <ChevronRight size={18} className="item-arrow" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render detail page (table with records)
  const renderDetailPage = () => {
    if (!currentSection || !currentItem) {
      return <div className="not-found">გვერდი ვერ მოიძებნა</div>;
    }

    return (
      <div className="dictionaries-detail">
        <div className="detail-header">
          <button className="back-btn" onClick={() => navigate(`/app/dictionaries/${section}`)}>
            <ArrowLeft size={20} />
            <span>უკან</span>
          </button>
          <div className="detail-title">
            <h1>{currentItem.labelKa}</h1>
            <span className="record-count">სულ: {totalCount}</span>
          </div>
        </div>

        <div className="detail-content">
          <div className="content-main">
            <div className="table-header">
              <div className="search-box">
                <Search size={18} />
                <input
                  type="text"
                  placeholder="ძიება..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="table-actions">
                <button className="action-btn export-btn" onClick={handleExport}>
                  <Download size={16} />
                  ექსპორტი
                </button>
                <button className="action-btn add-btn" onClick={handleAdd}>
                  <Plus size={16} />
                  დამატება
                </button>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>იტვირთება...</p>
              </div>
            ) : (
              <>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>დასახელება</th>
                        <th>კოდი</th>
                        <th>აღწერა</th>
                        <th>სტატუსი</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="empty-state">
                            ჩანაწერები არ მოიძებნა
                          </td>
                        </tr>
                      ) : (
                        records.map((record) => (
                          <tr key={record.id}>
                            <td className="name-cell">
                              {record.nameKa || record.name || '-'}
                            </td>
                            <td className="code-cell">{record.code || '-'}</td>
                            <td className="description-cell">
                              {record.description || '-'}
                            </td>
                            <td className="status-cell">
                              <span className={`status-badge ${record.isActive !== false ? 'active' : 'inactive'}`}>
                                {record.isActive !== false ? 'აქტიური' : 'არააქტიური'}
                              </span>
                            </td>
                            <td className="actions-cell">
                              <button
                                className="row-action edit"
                                onClick={() => handleEdit(record)}
                                title="რედაქტირება"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="row-action delete"
                                onClick={() => handleDelete(record.id)}
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

                {totalCount > 0 && (
                  <div className="pagination">
                    <div className="pagination-info">
                      <span>სულ: {totalCount}</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          setCurrentPage(1);
                        }}
                        className="page-size-select"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                    </div>
                    <div className="pagination-controls">
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <span className="current-page">{currentPage}</span>
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || totalPages === 0}
                      >
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="filters-sidebar">
            <h3>ფილტრები</h3>
            <div className="filter-group">
              <label>სტატუსი</label>
              <div className="select-wrapper">
                <select>
                  <option value="">ყველა</option>
                  <option value="active">აქტიური</option>
                  <option value="inactive">არააქტიური</option>
                </select>
                <ChevronDown size={16} className="select-icon" />
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingRecord ? 'რედაქტირება' : 'დამატება'}</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>დასახელება (ქართული)</label>
                  <input
                    type="text"
                    value={formData.nameKa || ''}
                    onChange={(e) => setFormData({ ...formData, nameKa: e.target.value })}
                    placeholder="შეიყვანეთ დასახელება"
                  />
                </div>
                <div className="form-group">
                  <label>დასახელება (ინგლისური)</label>
                  <input
                    type="text"
                    value={formData.nameEn || formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value, name: e.target.value })}
                    placeholder="Enter name"
                  />
                </div>
                <div className="form-group">
                  <label>კოდი</label>
                  <input
                    type="text"
                    value={formData.code || ''}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="შეიყვანეთ კოდი"
                  />
                </div>
                <div className="form-group">
                  <label>აღწერა</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="აღწერა"
                    rows={3}
                  />
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                    <span>აქტიური</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowModal(false)}>
                  გაუქმება
                </button>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'ინახება...' : 'შენახვა'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>წაშლის დადასტურება</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="modal-body">
                <p>დარწმუნებული ხართ რომ გსურთ ამ ჩანაწერის წაშლა?</p>
              </div>
              <div className="modal-footer">
                <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>
                  არა
                </button>
                <button className="delete-btn" onClick={confirmDelete}>
                  <Trash2 size={16} />
                  დიახ, წაშლა
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Determine which view to render
  if (page) {
    return renderDetailPage();
  } else if (section) {
    return renderSectionPage();
  } else {
    return renderMainPage();
  }
};

export default DictionariesPage;
