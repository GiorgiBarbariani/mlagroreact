import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { apiClient } from '../api/apiClient';
import { useAuth } from '../hooks/useAuth';
import './ElectronicFieldMapFieldsPage.scss';

interface Field {
  id: string;
  name: string;
  area: number;
  crop?: string;
  cropName?: string;
  regionName?: string;
  region?: string;
  companyId?: string;
}

interface Region {
  id: string;
  name: string;
  nameKa?: string;
}

interface CropOption {
  value: string;
  label: string;
}

const ElectronicFieldMapFieldsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Fields state
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter state
  const [filterName, setFilterName] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterCrop, setFilterCrop] = useState('');

  // Options for dropdowns
  const [regions, setRegions] = useState<Region[]>([]);
  const [cropsOptions, setCropsOptions] = useState<CropOption[]>([]);

  useEffect(() => {
    loadInitialData();
  }, [user?.companyId]);

  useEffect(() => {
    applyFilters();
  }, [fields, filterName, filterRegion, filterArea, filterCrop]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFields(),
        loadRegions(),
        loadCrops()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFields = async () => {
    try {
      const url = user?.companyId
        ? `/fields?companyId=${user.companyId}`
        : '/fields';
      const response = await apiClient.get(url);
      const fieldsData = response.data?.data || response.data || [];
      setFields(fieldsData);
      setTotalCount(fieldsData.length);
    } catch (error) {
      console.error('Error loading fields:', error);
      setFields([]);
    }
  };

  const loadRegions = async () => {
    try {
      const response = await apiClient.get('/regions');
      const regionsData = response.data || [];
      setRegions(regionsData);
    } catch (error) {
      console.error('Error loading regions:', error);
      setRegions([]);
    }
  };

  const loadCrops = async () => {
    try {
      const response = await apiClient.get('/dictionaries/crops');
      const cropsData = response.data || [];
      setCropsOptions(
        cropsData.map((crop: any) => ({
          value: crop.id || crop.name,
          label: crop.nameKa || crop.name
        }))
      );
    } catch (error) {
      console.error('Error loading crops:', error);
      setCropsOptions([]);
    }
  };

  const applyFilters = () => {
    let filtered = [...fields];

    if (filterName.trim()) {
      filtered = filtered.filter(f =>
        f.name.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    if (filterRegion) {
      filtered = filtered.filter(f =>
        f.regionName === filterRegion || f.region === filterRegion
      );
    }

    if (filterArea) {
      const areaValue = parseFloat(filterArea);
      if (!isNaN(areaValue)) {
        filtered = filtered.filter(f => f.area >= areaValue);
      }
    }

    if (filterCrop) {
      filtered = filtered.filter(f =>
        f.crop === filterCrop || f.cropName === filterCrop
      );
    }

    setFilteredFields(filtered);
    setTotalCount(filtered.length);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilterName('');
    setFilterRegion('');
    setFilterArea('');
    setFilterCrop('');
  };

  const handleExport = async () => {
    try {
      const response = await apiClient.post('/fields/export', {
        format: 'csv',
        fieldIds: filteredFields.map(f => f.id)
      }, { responseType: 'blob' });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'fields_export.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      alert('ექსპორტის შეცდომა');
    }
  };

  const handleEditField = (fieldId: string) => {
    navigate(`/app/electronic-field-map/fields/${fieldId}/general`);
  };

  // Pagination
  const totalPages = Math.ceil(filteredFields.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedFields = filteredFields.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getCropColor = (crop?: string) => {
    if (!crop) return '#9e9e9e';
    const colors: { [key: string]: string } = {
      'ხორბალი': '#FFD700',
      'სიმინდი': '#32CD32',
      'ბოსტნეული': '#228B22',
      'კარტოფილი': '#8B4513',
      'ვაზი': '#800080',
      'ხილი': '#FF6347',
    };
    return colors[crop] || '#9e9e9e';
  };

  return (
    <div className="electronic-field-map-fields-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <span onClick={() => navigate('/app/electronic-field-map')}>ველები</span>
        <span className="separator">&gt;</span>
        <span className="current">ელექტრონული საველე რუკები</span>
      </div>

      <div className="page-content">
        {/* Main Content */}
        <div className="main-content">
          {/* Header */}
          <div className="content-header">
            <button className="back-btn" onClick={() => navigate('/app/electronic-field-map')}>
              <ArrowLeft size={20} />
            </button>
            <div className="title-section">
              <h1>ველები</h1>
              <span className="count">სულ: {totalCount}</span>
            </div>
            <button className="export-btn" onClick={handleExport}>
              <Download size={18} />
              ექსპორტი
            </button>
          </div>

          {/* Table */}
          <div className="fields-table-container">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>იტვირთება...</p>
              </div>
            ) : (
              <>
                <table className="fields-table">
                  <thead>
                    <tr>
                      <th>დასახელება</th>
                      <th>რეგიონი</th>
                      <th>ველის ფართობი, ჰა</th>
                      <th>კულტურის სახეობა</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFields.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="empty-state">
                          ველები არ მოიძებნა
                        </td>
                      </tr>
                    ) : (
                      paginatedFields.map((field) => (
                        <tr key={field.id}>
                          <td className="field-name">{field.name}</td>
                          <td className="field-region">{field.regionName || field.region || '-'}</td>
                          <td className="field-area">{field.area.toFixed(2)} ჰა</td>
                          <td className="field-crop">
                            <div
                              className="crop-indicator"
                              style={{ backgroundColor: getCropColor(field.crop || field.cropName) }}
                            />
                          </td>
                          <td className="field-actions">
                            <button
                              className="edit-btn"
                              onClick={() => handleEditField(field.id)}
                            >
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>

                {/* Pagination */}
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
                    </select>
                    <span className="page-range">
                      {startIndex + 1} - {Math.min(endIndex, filteredFields.length)} of {filteredFields.length}
                    </span>
                  </div>
                  <div className="pagination-controls">
                    <button
                      className="page-btn"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="current-page">{currentPage}</span>
                    <button
                      className="page-btn"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Filters Sidebar */}
        <div className="filters-sidebar">
          <h2>ფილტრები</h2>

          <div className="filter-group">
            <label>ველის სახელი</label>
            <input
              type="text"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              placeholder="შეიყვანეთ ველის სახელი"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>რეგიონი</label>
            <div className="select-wrapper">
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="filter-select"
              >
                <option value="">აირჩიეთ რეგიონი</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.nameKa || region.name}>
                    {region.nameKa || region.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="filter-group">
            <label>ველის ფართობი</label>
            <input
              type="text"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              placeholder="შეიყვანეთ ველის ფართობი"
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>კულტურა</label>
            <div className="select-wrapper">
              <select
                value={filterCrop}
                onChange={(e) => setFilterCrop(e.target.value)}
                className="filter-select"
              >
                <option value="">აირჩიეთ კულტურა</option>
                {cropsOptions.map((crop) => (
                  <option key={crop.value} value={crop.label}>
                    {crop.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="select-icon" />
            </div>
          </div>

          <div className="filter-actions">
            <button className="apply-btn" onClick={applyFilters}>
              გამოყენება
            </button>
            <button className="clear-btn" onClick={clearFilters}>
              გასუფთავება
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicFieldMapFieldsPage;
