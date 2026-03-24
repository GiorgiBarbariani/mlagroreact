import React, { useState, useEffect, useCallback } from 'react';
import {
  Warehouse,
  Plus,
  Thermometer,
  Package,
  AlertTriangle,
  X,
  Trash2,
  Edit,
  Eye,
  LogIn,
  LogOut,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import storageService, {
  type Storage,
  type StorageItem,
  type StorageLog,
  type CompanySummary,
  type StorageType,
  type StorageKind,
} from '../../services/storageService';
import { companyService } from '../../services/companyService';
import './StoragePage.scss';

const StoragePage: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  // State
  const [storages, setStorages] = useState<Storage[]>([]);
  const [summary, setSummary] = useState<CompanySummary | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | StorageType>('all');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingStorage, setEditingStorage] = useState<Storage | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<Storage | null>(null);
  const [storageItems, setStorageItems] = useState<StorageItem[]>([]);
  const [storageLogs, setStorageLogs] = useState<StorageLog[]>([]);
  const [detailTab, setDetailTab] = useState<'items' | 'logs'>('items');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchFormData, setDispatchFormData] = useState({
    itemId: '',
    productName: '',
    quantity: '',
    unit: '',
    dispatchDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'WAREHOUSE' as StorageType,
    storageKind: 'DRY' as StorageKind,
    capacity: '',
    capacityUnit: 'ტონა',
    temperatureMin: '',
    temperatureMax: '',
    city: '',
    location: '',
    address: '',
    managerName: '',
    managerPhone: '',
    managerEmail: '',
    workingHours: '',
  });

  const [itemFormData, setItemFormData] = useState({
    productName: '',
    quantity: '',
    unit: 'ტონა',
    entryDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    notes: '',
  });


  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [storagesData, summaryData, companyInfo] = await Promise.all([
        storageService.getStorages(companyId || undefined),
        storageService.getCompanySummary(companyId || undefined),
        companyService.getCompanyInfo().catch(() => null),
      ]);
      setStorages(storagesData);
      setSummary(summaryData);
      if (companyInfo?.name) setCompanyName(companyInfo.name);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtered storages
  const filteredStorages = storages.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.location?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || s.type === filterType;
    return matchesSearch && matchesType;
  });

  // Storage CRUD
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        name: formData.name,
        code: formData.code || undefined,
        type: formData.type,
        storageKind: formData.storageKind,
        capacity: parseFloat(formData.capacity),
        capacityUnit: formData.capacityUnit,
        temperatureMin: formData.temperatureMin ? parseFloat(formData.temperatureMin) : null,
        temperatureMax: formData.temperatureMax ? parseFloat(formData.temperatureMax) : null,
        city: formData.city || undefined,
        location: formData.location || undefined,
        address: formData.address || undefined,
        managerName: formData.managerName || undefined,
        managerPhone: formData.managerPhone ? `+9955${formData.managerPhone}` : undefined,
        managerEmail: formData.managerEmail || undefined,
        workingHours: formData.workingHours || undefined,
      };

      if (editingStorage) {
        await storageService.updateStorage(editingStorage.id, data);
      } else {
        await storageService.createStorage(data, companyId || undefined);
      }

      setShowCreateModal(false);
      setEditingStorage(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving storage:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    await storageService.deleteStorage(id);
    if (selectedStorage?.id === id) setSelectedStorage(null);
    loadData();
  };

  const handleEdit = (storage: Storage) => {
    setEditingStorage(storage);
    setFormData({
      name: storage.name,
      code: storage.code || '',
      type: storage.type,
      storageKind: storage.storageKind || 'DRY',
      capacity: String(storage.capacity),
      capacityUnit: storage.capacityUnit,
      temperatureMin: storage.temperatureMin != null ? String(storage.temperatureMin) : '',
      temperatureMax: storage.temperatureMax != null ? String(storage.temperatureMax) : '',
      city: storage.city || '',
      location: storage.location || '',
      address: storage.address || '',
      managerName: storage.managerName || '',
      managerPhone: storage.managerPhone?.replace(/^\+9955/, '') || '',
      managerEmail: storage.managerEmail || '',
      workingHours: storage.workingHours || '',
    });
    setShowCreateModal(true);
  };

  // Detail view
  const handleViewDetail = async (storage: Storage) => {
    setSelectedStorage(storage);
    setDetailTab('items');
    const [items, logs] = await Promise.all([
      storageService.getStorageItems(storage.id),
      storageService.getStorageLogs(storage.id),
    ]);
    setStorageItems(items);
    setStorageLogs(logs);
  };

  // Item CRUD
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStorage) return;
    try {
      await storageService.addStorageItem(selectedStorage.id, {
        productName: itemFormData.productName,
        quantity: parseFloat(itemFormData.quantity),
        unit: itemFormData.unit,
        entryDate: itemFormData.entryDate || undefined,
        expiryDate: itemFormData.expiryDate || undefined,
        notes: itemFormData.notes || undefined,
      });
      setShowAddItemModal(false);
      setItemFormData({ productName: '', quantity: '', unit: 'ტონა', entryDate: new Date().toISOString().split('T')[0], expiryDate: '', notes: '' });
      handleViewDetail(selectedStorage);
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };


  const openDispatchModal = (item?: StorageItem) => {
    if (item) {
      setDispatchFormData({
        itemId: item.id,
        productName: item.productName,
        quantity: String(item.quantity),
        unit: item.unit,
        dispatchDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    } else {
      setDispatchFormData({
        itemId: '',
        productName: '',
        quantity: '',
        unit: '',
        dispatchDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
    }
    setShowDispatchModal(true);
  };

  const handleDispatchFromModal = async () => {
    if (!dispatchFormData.itemId) return;
    const item = storageItems.find(i => i.id === dispatchFormData.itemId);
    if (!item) return;
    const qty = parseFloat(dispatchFormData.quantity);
    if (!qty || qty <= 0 || qty > item.quantity) return;
    try {
      await storageService.updateStorageItem(item.id, {
        status: 'DISPATCHED',
        quantity: qty,
        notes: dispatchFormData.notes || undefined,
      });
      setShowDispatchModal(false);
      if (selectedStorage) handleViewDetail(selectedStorage);
      loadData();
    } catch (error) {
      console.error('Error dispatching item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    await storageService.deleteStorageItem(itemId);
    if (selectedStorage) handleViewDetail(selectedStorage);
    loadData();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      type: 'WAREHOUSE',
      storageKind: 'DRY',
      capacity: '',
      capacityUnit: 'ტონა',
      temperatureMin: '',
      temperatureMax: '',
      city: '',
      location: '',
      address: '',
      managerName: '',
      managerPhone: '',
      managerEmail: '',
      workingHours: '',
    });
  };

  const generateCode = async () => {
    const code = await storageService.generateCode(formData.type);
    if (code) setFormData({ ...formData, code });
  };

  const utilizationPercent = (s: Storage) =>
    s.capacity > 0 ? Math.round((s.currentLoad / s.capacity) * 100) : 0;

  if (loading) {
    return (
      <div className="storage-page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="storage-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Warehouse size={28} />
          <h1>საწყობი</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingStorage(null); setShowCreateModal(true); }}>
          <Plus size={18} /> დამატება
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#dbeafe' }}>
              <Warehouse size={22} color="#3b82f6" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.totalStorages}</span>
              <span className="card-label">სულ საწყობები</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#ede9fe' }}>
              <Package size={22} color="#8b5cf6" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.warehouseCount} / {summary.refrigeratorCount}</span>
              <span className="card-label">საწყობი / სამაცივრე</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#d1fae5' }}>
              <Package size={22} color="#10b981" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.utilizationPercent}%</span>
              <span className="card-label">საერთო დატვირთვა</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#fee2e2' }}>
              <AlertTriangle size={22} color="#ef4444" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.expiredItemsCount}</span>
              <span className="card-label">სულ ვადაგასული</span>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder="ძებნა..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-tabs">
          <button className={`tab ${filterType === 'all' ? 'active' : ''}`} onClick={() => setFilterType('all')}>
            ყველა ({storages.length})
          </button>
          <button className={`tab ${filterType === 'REFRIGERATOR' ? 'active' : ''}`} onClick={() => setFilterType('REFRIGERATOR')}>
            სამაცივრე ({storages.filter(s => s.type === 'REFRIGERATOR').length})
          </button>
          <button className={`tab ${filterType === 'WAREHOUSE' ? 'active' : ''}`} onClick={() => setFilterType('WAREHOUSE')}>
            საწყობი ({storages.filter(s => s.type === 'WAREHOUSE').length})
          </button>
        </div>
      </div>

      {/* Storage Cards Grid */}
      <div className="storages-grid">
        {filteredStorages.length === 0 ? (
          <div className="empty-state">
            <Warehouse size={48} />
            <p>საწყობები არ მოიძებნა</p>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus size={18} /> ახალი საწყობის დამატება
            </button>
          </div>
        ) : (
          filteredStorages.map((storage) => {
            const typeInfo = storageService.getTypeInfo(storage.type);
            const statusInfo = storageService.getStatusInfo(storage.status);
            const utilPct = utilizationPercent(storage);
            const utilColor = storageService.getUtilizationColor(utilPct);
            return (
              <div key={storage.id} className="storage-card" onClick={() => handleViewDetail(storage)}>
                <div className="card-header">
                  <div className="card-title">
                    <span className="type-icon">{typeInfo.icon}</span>
                    <h3>{storage.name}</h3>
                  </div>
                  <span className="status-badge" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}>
                    {statusInfo.label}
                  </span>
                </div>

                {(storage.city || storage.location) && (
                  <p className="card-location">{[storage.city, storage.location].filter(Boolean).join(', ')}</p>
                )}
                {storage.storageKind && (
                  <span className="kind-badge" style={{ color: storageService.getKindInfo(storage.storageKind).color, backgroundColor: storageService.getKindInfo(storage.storageKind).bgColor }}>
                    {storageService.getKindInfo(storage.storageKind).label}
                  </span>
                )}

                <div className="utilization-section">
                  <div className="utilization-header">
                    <span>დატვირთვა</span>
                    <span style={{ color: utilColor, fontWeight: 600 }}>{utilPct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${utilPct}%`, backgroundColor: utilColor }} />
                  </div>
                  <span className="utilization-detail">
                    {storage.currentLoad} / {storage.capacity} {storage.capacityUnit}
                  </span>
                </div>

                {(storage.storageKind === 'COLD' || storage.storageKind === 'MIXED') && storage.currentTemperature != null && (
                  <div className="temperature-display">
                    <Thermometer size={16} />
                    <span>{storage.currentTemperature}°C</span>
                    {storage.temperatureMin != null && storage.temperatureMax != null && (
                      <span className="temp-range">({storage.temperatureMin}° — {storage.temperatureMax}°)</span>
                    )}
                  </div>
                )}

                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="action-btn" title="ნახვა" onClick={() => handleViewDetail(storage)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn" title="რედაქტირება" onClick={() => handleEdit(storage)}>
                    <Edit size={16} />
                  </button>
                  <button className="action-btn danger" title="წაშლა" onClick={() => handleDelete(storage.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingStorage(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingStorage ? 'საწყობის რედაქტირება' : 'ახალი საწყობის დამატება'}</h2>
              <button className="close-btn" onClick={() => { setShowCreateModal(false); setEditingStorage(null); }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateOrUpdate}>
              <div className="form-group">
                <label>კომპანია</label>
                <input type="text" value={companyName} readOnly className="readonly-input" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>საწყობის სახელი *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>საწყობის კოდი</label>
                  <div className="code-input-group">
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="მაგ: WH-001" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={generateCode}>გენერაცია</button>
                  </div>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>საწყობის ტიპი *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as StorageType })}>
                    <option value="WAREHOUSE">საწყობი</option>
                    <option value="REFRIGERATOR">სამაცივრე</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>პროდუქტის ტიპი</label>
                  <select value={formData.storageKind} onChange={(e) => setFormData({ ...formData, storageKind: e.target.value as StorageKind })}>
                    <option value="DRY">მშრალი</option>
                    <option value="COLD">ცივი</option>
                    <option value="MIXED">შერეული</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ტევადობა *</label>
                  <input type="number" step="0.1" value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ერთეული</label>
                  <select value={formData.capacityUnit} onChange={(e) => setFormData({ ...formData, capacityUnit: e.target.value })}>
                    <option value="ტონა">ტონა</option>
                    <option value="კგ">კგ</option>
                  </select>
                </div>
              </div>
              {(formData.storageKind === 'COLD' || formData.storageKind === 'MIXED') && (
                <div className="form-row">
                  <div className="form-group">
                    <label>მინ. ტემპერატურა (°C)</label>
                    <input type="number" step="0.1" value={formData.temperatureMin} onChange={(e) => setFormData({ ...formData, temperatureMin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>მაქს. ტემპერატურა (°C)</label>
                    <input type="number" step="0.1" value={formData.temperatureMax} onChange={(e) => setFormData({ ...formData, temperatureMax: e.target.value })} />
                  </div>
                </div>
              )}

              <div className="form-section-title">მდებარეობა</div>
              <div className="form-row">
                <div className="form-group">
                  <label>ქალაქი</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })}>
                    <option value="">აირჩიეთ ქალაქი</option>
                    <option value="თბილისი">თბილისი</option>
                    <option value="ბათუმი">ბათუმი</option>
                    <option value="ქუთაისი">ქუთაისი</option>
                    <option value="რუსთავი">რუსთავი</option>
                    <option value="გორი">გორი</option>
                    <option value="ზუგდიდი">ზუგდიდი</option>
                    <option value="ფოთი">ფოთი</option>
                    <option value="ხაშური">ხაშური</option>
                    <option value="სამტრედია">სამტრედია</option>
                    <option value="სენაკი">სენაკი</option>
                    <option value="ზესტაფონი">ზესტაფონი</option>
                    <option value="მარნეული">მარნეული</option>
                    <option value="თელავი">თელავი</option>
                    <option value="ახალციხე">ახალციხე</option>
                    <option value="ოზურგეთი">ოზურგეთი</option>
                    <option value="კასპი">კასპი</option>
                    <option value="ჭიათურა">ჭიათურა</option>
                    <option value="წყალტუბო">წყალტუბო</option>
                    <option value="საგარეჯო">საგარეჯო</option>
                    <option value="გარდაბანი">გარდაბანი</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>მისამართი</label>
                  <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="ქუჩა, ნომერი" />
                </div>
              </div>

              <div className="form-section-title">პასუხისმგებელი პირი</div>
              <div className="form-row">
                <div className="form-group">
                  <label>სახელი</label>
                  <input type="text" value={formData.managerName} onChange={(e) => setFormData({ ...formData, managerName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>ელ. ფოსტა</label>
                  <input type="email" value={formData.managerEmail} onChange={(e) => setFormData({ ...formData, managerEmail: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>ტელეფონი</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+995</span>
                  <span className="phone-prefix">5</span>
                  <input
                    type="tel"
                    value={formData.managerPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, managerPhone: digits });
                    }}
                    placeholder="XX XXX XX XX"
                    maxLength={8}
                    pattern="\d{8}"
                    title="შეიყვანეთ 8 ციფრი"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setEditingStorage(null); }}>
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStorage ? 'განახლება' : 'შექმნა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedStorage && (
        <div className="modal-overlay" onClick={() => setSelectedStorage(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {storageService.getTypeInfo(selectedStorage.type).icon} {selectedStorage.name}
              </h2>
              <button className="close-btn" onClick={() => setSelectedStorage(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Detail Tabs */}
            <div className="detail-tabs">
              <button className={`tab ${detailTab === 'items' ? 'active' : ''}`} onClick={() => setDetailTab('items')}>
                <Package size={16} /> პროდუქცია ({storageItems.filter(i => i.status === 'STORED').length})
              </button>
              <button className={`tab ${detailTab === 'logs' ? 'active' : ''}`} onClick={() => setDetailTab('logs')}>
                <LogIn size={16} /> ისტორია ({storageLogs.length})
              </button>
            </div>

            {/* Items Tab */}
            {detailTab === 'items' && (
              <div className="detail-content">
                <div className="detail-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => setShowAddItemModal(true)}>
                    <LogIn size={16} /> პროდუქციის შეტანა
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => openDispatchModal()} style={{ marginLeft: '0.5rem' }}>
                    <LogOut size={16} /> პროდუქციის გატანა
                  </button>
                </div>
                {(() => {
                  const storedItems = storageItems.filter(i => i.status === 'STORED');
                  return storedItems.length === 0 ? (
                    <div className="empty-state small">
                      <Package size={32} />
                      <p>პროდუქცია არ არის</p>
                    </div>
                  ) : (
                    <div className="items-table">
                      <table>
                        <thead>
                          <tr>
                            <th>პროდუქტი</th>
                            <th>რაოდენობა</th>
                            <th>შეტანის თარიღი</th>
                            <th>ვარგისიანობა</th>
                            <th>მოქმედება</th>
                          </tr>
                        </thead>
                        <tbody>
                          {storedItems.map((item) => (
                            <tr key={item.id}>
                              <td className="product-name">{item.productName}</td>
                              <td>{item.quantity} {item.unit}</td>
                              <td>{storageService.formatDate(item.entryDate)}</td>
                              <td>{item.expiryDate ? storageService.formatDate(item.expiryDate) : '-'}</td>
                              <td className="item-actions">
                                <button className="action-btn" title="გატანა" onClick={() => openDispatchModal(item)}>
                                  <LogOut size={14} />
                                </button>
                                <button className="action-btn danger" title="წაშლა" onClick={() => handleDeleteItem(item.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Logs Tab */}
            {detailTab === 'logs' && (
              <div className="detail-content">
                {storageLogs.length === 0 ? (
                  <div className="empty-state small">
                    <LogIn size={32} />
                    <p>ისტორია ცარიელია</p>
                  </div>
                ) : (
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>თარიღი</th>
                          <th>მოქმედება</th>
                          <th>რაოდენობა</th>
                          <th>ტემპერატურა</th>
                          <th>შენიშვნა</th>
                        </tr>
                      </thead>
                      <tbody>
                        {storageLogs.map((log) => {
                          const actionInfo = storageService.getLogActionInfo(log.action);
                          return (
                            <tr key={log.id}>
                              <td>{storageService.formatDate(log.createdAt)}</td>
                              <td>
                                <span style={{ color: actionInfo.color, fontWeight: 500 }}>
                                  {actionInfo.label}
                                </span>
                              </td>
                              <td>{log.quantity ?? '-'}</td>
                              <td>{log.temperature != null ? `${log.temperature}°C` : '-'}</td>
                              <td>{log.notes || '-'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="modal-overlay" onClick={() => setShowDispatchModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>პროდუქციის გატანა</h2>
              <button className="close-btn" onClick={() => setShowDispatchModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handleDispatchFromModal(); }}>
              <div className="form-group">
                <label>პროდუქტის სახელი *</label>
                {dispatchFormData.productName ? (
                  <input type="text" value={dispatchFormData.productName} readOnly className="readonly-input" />
                ) : (
                  <select
                    value={dispatchFormData.itemId}
                    onChange={(e) => {
                      const item = storageItems.find(i => i.id === e.target.value);
                      if (item) {
                        setDispatchFormData({ ...dispatchFormData, itemId: item.id, productName: '', quantity: String(item.quantity), unit: item.unit });
                      } else {
                        setDispatchFormData({ ...dispatchFormData, itemId: '', quantity: '', unit: '' });
                      }
                    }}
                    required
                  >
                    <option value="">აირჩიეთ პროდუქტი</option>
                    {storageItems.filter(i => i.status === 'STORED').map(item => (
                      <option key={item.id} value={item.id}>
                        {item.productName} — {item.quantity} {item.unit}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>რაოდენობა * {(() => {
                    const item = storageItems.find(i => i.id === dispatchFormData.itemId);
                    return item ? <span style={{ color: '#6b7280', fontWeight: 400 }}>(საწყობში: {item.quantity} {item.unit})</span> : null;
                  })()}</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max={storageItems.find(i => i.id === dispatchFormData.itemId)?.quantity}
                    value={dispatchFormData.quantity}
                    onChange={(e) => setDispatchFormData({ ...dispatchFormData, quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>ერთეული</label>
                  <input type="text" value={dispatchFormData.unit || storageItems.find(i => i.id === dispatchFormData.itemId)?.unit || ''} readOnly className="readonly-input" />
                </div>
              </div>
              <div className="form-group">
                <label>გატანის თარიღი</label>
                <div className="code-input-group">
                  <input type="date" value={dispatchFormData.dispatchDate} onChange={(e) => setDispatchFormData({ ...dispatchFormData, dispatchDate: e.target.value })} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setDispatchFormData({ ...dispatchFormData, dispatchDate: new Date().toISOString().split('T')[0] })}>
                    დღეს
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>შენიშვნა</label>
                <textarea value={dispatchFormData.notes} onChange={(e) => setDispatchFormData({ ...dispatchFormData, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowDispatchModal(false)}>გაუქმება</button>
                <button type="submit" className="btn btn-primary" disabled={!dispatchFormData.itemId}>გატანა</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>პროდუქციის შეტანა</h2>
              <button className="close-btn" onClick={() => setShowAddItemModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddItem}>
              <div className="form-group">
                <label>პროდუქტის სახელი *</label>
                <input type="text" value={itemFormData.productName} onChange={(e) => setItemFormData({ ...itemFormData, productName: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>რაოდენობა *</label>
                  <input type="number" step="0.1" value={itemFormData.quantity} onChange={(e) => setItemFormData({ ...itemFormData, quantity: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>ერთეული *</label>
                  <select value={itemFormData.unit} onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}>
                    <option value="ტონა">ტონა</option>
                    <option value="კგ">კგ</option>
                    <option value="ცალი">ცალი</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>შეტანის თარიღი</label>
                <div className="code-input-group">
                  <input type="date" value={itemFormData.entryDate} onChange={(e) => setItemFormData({ ...itemFormData, entryDate: e.target.value })} />
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setItemFormData({ ...itemFormData, entryDate: new Date().toISOString().split('T')[0] })}>
                    დღეს
                  </button>
                </div>
              </div>
              <div className="form-group">
                <label>ვარგისიანობის ვადა</label>
                <input type="date" value={itemFormData.expiryDate} onChange={(e) => setItemFormData({ ...itemFormData, expiryDate: e.target.value })} />
              </div>
              <div className="form-group">
                <label>შენიშვნა</label>
                <textarea value={itemFormData.notes} onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItemModal(false)}>
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  შეტანა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoragePage;
