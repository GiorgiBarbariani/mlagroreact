import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  Plus,
  Users,
  CheckCircle,
  Navigation,
  X,
  Trash2,
  Edit,
  Eye,
  Search,
  RefreshCw,
  Package,
  MapPin,
  Clock,
  Info,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import distributionService, {
  type Distribution,
  type DistributionItem,
  type DistributionLog,
  type DistributionSummary,
  type DistributionType,
  type DistributionStatus,
  type DistributionCustomer,
} from '../../services/distributionService';
import storageService, { type Storage } from '../../services/storageService';
import { companyService } from '../../services/companyService';
import './DistributionPage.scss';

const DistributionPage: React.FC = () => {
  const { user } = useAuth();
  const companyId = user?.companyId || '';

  // State
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [summary, setSummary] = useState<DistributionSummary | null>(null);
  const [customers, setCustomers] = useState<DistributionCustomer[]>([]);
  const [storages, setStorages] = useState<Storage[]>([]);
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | DistributionStatus>('all');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDistribution, setEditingDistribution] = useState<Distribution | null>(null);
  const [selectedDistribution, setSelectedDistribution] = useState<Distribution | null>(null);
  const [distributionItems, setDistributionItems] = useState<DistributionItem[]>([]);
  const [distributionLogs, setDistributionLogs] = useState<DistributionLog[]>([]);
  const [detailTab, setDetailTab] = useState<'items' | 'logs' | 'info'>('items');
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Distribution form
  const [formData, setFormData] = useState({
    code: '',
    type: 'DELIVERY' as DistributionType,
    customerId: '',
    scheduledDate: '',
    sourceStorageId: '',
    destinationCity: '',
    destinationAddress: '',
    vehiclePlate: '',
    driverName: '',
    driverPhone: '',
    notes: '',
  });

  // Item form
  const [itemFormData, setItemFormData] = useState({
    productName: '',
    quantity: '',
    unit: 'ტონა',
    notes: '',
  });

  // Customer form
  const [customerFormData, setCustomerFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    notes: '',
  });

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [distributionsData, summaryData, customersData, storagesData, companyInfo] = await Promise.all([
        distributionService.getDistributions(companyId || undefined),
        distributionService.getCompanySummary(companyId || undefined),
        distributionService.getCustomers(companyId || undefined),
        storageService.getStorages(companyId || undefined),
        companyService.getCompanyInfo().catch(() => null),
      ]);
      setDistributions(distributionsData);
      setSummary(summaryData);
      setCustomers(customersData);
      setStorages(storagesData);
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

  // Filtered distributions
  const filteredDistributions = distributions.filter((d) => {
    const matchesSearch =
      d.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.destinationCity?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.driverName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Distribution CRUD
  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        code: formData.code || undefined,
        type: formData.type,
        customerId: formData.customerId || undefined,
        scheduledDate: formData.scheduledDate || undefined,
        sourceStorageId: formData.sourceStorageId || undefined,
        destinationCity: formData.destinationCity || undefined,
        destinationAddress: formData.destinationAddress || undefined,
        vehiclePlate: formData.vehiclePlate || undefined,
        driverName: formData.driverName || undefined,
        driverPhone: formData.driverPhone ? `+9955${formData.driverPhone}` : undefined,
        notes: formData.notes || undefined,
      };

      if (editingDistribution) {
        await distributionService.updateDistribution(editingDistribution.id, data);
      } else {
        await distributionService.createDistribution(data, companyId || undefined);
      }

      setShowCreateModal(false);
      setEditingDistribution(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving distribution:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    await distributionService.deleteDistribution(id);
    if (selectedDistribution?.id === id) setSelectedDistribution(null);
    loadData();
  };

  const handleEdit = (distribution: Distribution) => {
    setEditingDistribution(distribution);
    setFormData({
      code: distribution.code || '',
      type: distribution.type,
      customerId: distribution.customerId || '',
      scheduledDate: distribution.scheduledDate ? distribution.scheduledDate.split('T')[0] : '',
      sourceStorageId: distribution.sourceStorageId || '',
      destinationCity: distribution.destinationCity || '',
      destinationAddress: distribution.destinationAddress || '',
      vehiclePlate: distribution.vehiclePlate || '',
      driverName: distribution.driverName || '',
      driverPhone: distribution.driverPhone?.replace(/^\+9955/, '') || '',
      notes: distribution.notes || '',
    });
    setShowCreateModal(true);
  };

  const handleStatusChange = async (id: string, newStatus: DistributionStatus) => {
    try {
      await distributionService.updateDistribution(id, { status: newStatus });
      loadData();
      if (selectedDistribution?.id === id) {
        handleViewDetail({ ...selectedDistribution, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Detail view
  const handleViewDetail = async (distribution: Distribution) => {
    setSelectedDistribution(distribution);
    setDetailTab('items');
    const [items, logs] = await Promise.all([
      distributionService.getDistributionItems(distribution.id),
      distributionService.getDistributionLogs(distribution.id),
    ]);
    setDistributionItems(items);
    setDistributionLogs(logs);
  };

  // Item CRUD
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDistribution) return;
    try {
      await distributionService.addDistributionItem(selectedDistribution.id, {
        productName: itemFormData.productName,
        quantity: parseFloat(itemFormData.quantity),
        unit: itemFormData.unit,
        notes: itemFormData.notes || undefined,
      });
      setShowAddItemModal(false);
      setItemFormData({ productName: '', quantity: '', unit: 'ტონა', notes: '' });
      handleViewDetail(selectedDistribution);
      loadData();
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('ნამდვილად გსურთ წაშლა?')) return;
    await distributionService.deleteDistributionItem(itemId);
    if (selectedDistribution) handleViewDetail(selectedDistribution);
    loadData();
  };

  // Customer CRUD
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const customer = await distributionService.createCustomer({
        name: customerFormData.name,
        contactPerson: customerFormData.contactPerson || undefined,
        phone: customerFormData.phone ? `+9955${customerFormData.phone}` : undefined,
        email: customerFormData.email || undefined,
        city: customerFormData.city || undefined,
        address: customerFormData.address || undefined,
        notes: customerFormData.notes || undefined,
      }, companyId || undefined);

      setShowCustomerModal(false);
      setCustomerFormData({ name: '', contactPerson: '', phone: '', email: '', city: '', address: '', notes: '' });

      if (customer) {
        setFormData({ ...formData, customerId: customer.id });
      }

      // Refresh customers list
      const customersData = await distributionService.getCustomers(companyId || undefined);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error creating customer:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      type: 'DELIVERY',
      customerId: '',
      scheduledDate: '',
      sourceStorageId: '',
      destinationCity: '',
      destinationAddress: '',
      vehiclePlate: '',
      driverName: '',
      driverPhone: '',
      notes: '',
    });
  };

  const generateCode = async () => {
    const code = await distributionService.generateCode(formData.type);
    if (code) setFormData({ ...formData, code });
  };

  if (loading) {
    return (
      <div className="distribution-page">
        <div className="loading-state">
          <RefreshCw className="spin" size={32} />
          <p>იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="distribution-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <Truck size={28} />
          <h1>დისტრიბუცია</h1>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setEditingDistribution(null); setShowCreateModal(true); }}>
          <Plus size={18} /> ახალი მიწოდება
        </button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#dbeafe' }}>
              <Truck size={22} color="#3b82f6" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.totalDistributions}</span>
              <span className="card-label">სულ მიწოდებები</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#ede9fe' }}>
              <Navigation size={22} color="#8b5cf6" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.inTransitCount}</span>
              <span className="card-label">გზაში</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#d1fae5' }}>
              <CheckCircle size={22} color="#10b981" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.deliveredCount}</span>
              <span className="card-label">ჩაბარებული</span>
            </div>
          </div>
          <div className="summary-card">
            <div className="card-icon" style={{ backgroundColor: '#fef3c7' }}>
              <Users size={22} color="#f59e0b" />
            </div>
            <div className="card-info">
              <span className="card-value">{summary.totalCustomers}</span>
              <span className="card-label">მომხმარებლები</span>
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
          <button className={`tab ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
            ყველა ({distributions.length})
          </button>
          <button className={`tab ${filterStatus === 'PENDING' ? 'active' : ''}`} onClick={() => setFilterStatus('PENDING')}>
            მოლოდინში ({distributions.filter(d => d.status === 'PENDING').length})
          </button>
          <button className={`tab ${filterStatus === 'IN_TRANSIT' ? 'active' : ''}`} onClick={() => setFilterStatus('IN_TRANSIT')}>
            გზაში ({distributions.filter(d => d.status === 'IN_TRANSIT').length})
          </button>
          <button className={`tab ${filterStatus === 'DELIVERED' ? 'active' : ''}`} onClick={() => setFilterStatus('DELIVERED')}>
            ჩაბარებული ({distributions.filter(d => d.status === 'DELIVERED').length})
          </button>
          <button className={`tab ${filterStatus === 'CANCELLED' ? 'active' : ''}`} onClick={() => setFilterStatus('CANCELLED')}>
            გაუქმებული ({distributions.filter(d => d.status === 'CANCELLED').length})
          </button>
        </div>
      </div>

      {/* Distribution Cards Grid */}
      <div className="distributions-grid">
        {filteredDistributions.length === 0 ? (
          <div className="empty-state">
            <Truck size={48} />
            <p>მიწოდებები არ მოიძებნა</p>
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowCreateModal(true); }}>
              <Plus size={18} /> ახალი მიწოდების შექმნა
            </button>
          </div>
        ) : (
          filteredDistributions.map((dist) => {
            const typeInfo = distributionService.getTypeInfo(dist.type);
            const statusInfo = distributionService.getStatusInfo(dist.status);
            const progress = distributionService.getDeliveryProgressPercent(dist.status);
            const progressColor = distributionService.getProgressColor(dist.status);
            return (
              <div key={dist.id} className="distribution-card" onClick={() => handleViewDetail(dist)}>
                <div className="card-header">
                  <div className="card-title">
                    <span className="type-icon">{typeInfo.icon}</span>
                    <h3>{dist.customer?.name || 'მომხმარებელი არ არის'}</h3>
                    {dist.code && <span className="code">{dist.code}</span>}
                  </div>
                  <span className="status-badge" style={{ color: statusInfo.color, backgroundColor: statusInfo.bgColor }}>
                    {statusInfo.label}
                  </span>
                </div>

                {(dist.destinationCity || dist.destinationAddress) && (
                  <p className="card-destination">
                    <MapPin size={14} />
                    {[dist.destinationCity, dist.destinationAddress].filter(Boolean).join(', ')}
                  </p>
                )}

                {dist.scheduledDate && (
                  <p className="card-date">
                    <Clock size={14} />
                    {distributionService.formatDate(dist.scheduledDate)}
                  </p>
                )}

                <div className="progress-section">
                  <div className="progress-header">
                    <span>პროგრესი</span>
                    <span style={{ color: progressColor, fontWeight: 600 }}>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%`, backgroundColor: progressColor }} />
                  </div>
                </div>

                <div className="card-meta">
                  <span className="weight">{dist.totalWeight} {dist.weightUnit}</span>
                  {dist.driverName && (
                    <span className="driver-info">
                      <Users size={14} />
                      {dist.driverName}
                    </span>
                  )}
                </div>

                <div className="card-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="action-btn" title="ნახვა" onClick={() => handleViewDetail(dist)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn" title="რედაქტირება" onClick={() => handleEdit(dist)}>
                    <Edit size={16} />
                  </button>
                  <button className="action-btn danger" title="წაშლა" onClick={() => handleDelete(dist.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Distribution Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => { setShowCreateModal(false); setEditingDistribution(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingDistribution ? 'მიწოდების რედაქტირება' : 'ახალი მიწოდება'}</h2>
              <button className="close-btn" onClick={() => { setShowCreateModal(false); setEditingDistribution(null); }}>
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
                  <label>მიწოდების ტიპი *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as DistributionType })}>
                    <option value="DELIVERY">მიტანა</option>
                    <option value="PICKUP">გატანა</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>კოდი</label>
                  <div className="code-input-group">
                    <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} placeholder="მაგ: DL-001" />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={generateCode}>გენერაცია</button>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>მომხმარებელი</label>
                <div className="code-input-group">
                  <select value={formData.customerId} onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}>
                    <option value="">აირჩიეთ მომხმარებელი</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} {c.city ? `(${c.city})` : ''}</option>
                    ))}
                  </select>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCustomerModal(true)}>ახალი</button>
                </div>
              </div>

              <div className="form-group">
                <label>დაგეგმილი თარიღი</label>
                <input type="date" value={formData.scheduledDate} onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })} />
              </div>

              <div className="form-group">
                <label>წყარო საწყობი</label>
                <select value={formData.sourceStorageId} onChange={(e) => setFormData({ ...formData, sourceStorageId: e.target.value })}>
                  <option value="">აირჩიეთ საწყობი (არასავალდებულო)</option>
                  {storages.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.city ? `(${s.city})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="form-section-title">მიმართულება</div>
              <div className="form-row">
                <div className="form-group">
                  <label>ქალაქი</label>
                  <select value={formData.destinationCity} onChange={(e) => setFormData({ ...formData, destinationCity: e.target.value })}>
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
                  <input type="text" value={formData.destinationAddress} onChange={(e) => setFormData({ ...formData, destinationAddress: e.target.value })} placeholder="ქუჩა, ნომერი" />
                </div>
              </div>

              <div className="form-section-title">ტრანსპორტი</div>
              <div className="form-row">
                <div className="form-group">
                  <label>მანქანის ნომერი</label>
                  <input type="text" value={formData.vehiclePlate} onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })} placeholder="AA-000-AA" />
                </div>
                <div className="form-group">
                  <label>მძღოლის სახელი</label>
                  <input type="text" value={formData.driverName} onChange={(e) => setFormData({ ...formData, driverName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>მძღოლის ტელეფონი</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+995</span>
                  <span className="phone-prefix">5</span>
                  <input
                    type="tel"
                    value={formData.driverPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setFormData({ ...formData, driverPhone: digits });
                    }}
                    placeholder="XX XXX XX XX"
                    maxLength={8}
                    pattern="\d{8}"
                    title="შეიყვანეთ 8 ციფრი"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>შენიშვნა</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => { setShowCreateModal(false); setEditingDistribution(null); }}>
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDistribution ? 'განახლება' : 'შექმნა'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedDistribution && (
        <div className="modal-overlay" onClick={() => setSelectedDistribution(null)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {distributionService.getTypeInfo(selectedDistribution.type).icon}{' '}
                {selectedDistribution.customer?.name || 'მიწოდება'}{' '}
                {selectedDistribution.code && <span style={{ color: '#9ca3af', fontWeight: 400 }}>({selectedDistribution.code})</span>}
              </h2>
              <button className="close-btn" onClick={() => setSelectedDistribution(null)}>
                <X size={20} />
              </button>
            </div>

            {/* Status Actions */}
            <div className="detail-content" style={{ paddingBottom: 0 }}>
              <div className="detail-actions">
                {selectedDistribution.status === 'PENDING' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'LOADING')}>
                      იტვირთება
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'CANCELLED')}>
                      გაუქმება
                    </button>
                  </>
                )}
                {selectedDistribution.status === 'LOADING' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'IN_TRANSIT')}>
                      გაგზავნა
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'CANCELLED')}>
                      გაუქმება
                    </button>
                  </>
                )}
                {selectedDistribution.status === 'IN_TRANSIT' && (
                  <>
                    <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'DELIVERED')}>
                      ჩაბარება
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'RETURNED')}>
                      დაბრუნება
                    </button>
                  </>
                )}
                {selectedDistribution.status === 'RETURNED' && (
                  <button className="btn btn-primary btn-sm" onClick={() => handleStatusChange(selectedDistribution.id, 'PENDING')}>
                    ხელახლა გაგზავნა
                  </button>
                )}
              </div>
            </div>

            {/* Detail Tabs */}
            <div className="detail-tabs">
              <button className={`tab ${detailTab === 'items' ? 'active' : ''}`} onClick={() => setDetailTab('items')}>
                <Package size={16} /> ნივთები ({distributionItems.length})
              </button>
              <button className={`tab ${detailTab === 'logs' ? 'active' : ''}`} onClick={() => setDetailTab('logs')}>
                <Clock size={16} /> ისტორია ({distributionLogs.length})
              </button>
              <button className={`tab ${detailTab === 'info' ? 'active' : ''}`} onClick={() => setDetailTab('info')}>
                <Info size={16} /> ინფორმაცია
              </button>
            </div>

            {/* Items Tab */}
            {detailTab === 'items' && (
              <div className="detail-content">
                {['PENDING', 'LOADING'].includes(selectedDistribution.status) && (
                  <div className="detail-actions">
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddItemModal(true)}>
                      <Plus size={16} /> ნივთის დამატება
                    </button>
                  </div>
                )}
                {distributionItems.length === 0 ? (
                  <div className="empty-state small">
                    <Package size={32} />
                    <p>ნივთები არ არის</p>
                  </div>
                ) : (
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>პროდუქტი</th>
                          <th>რაოდენობა</th>
                          <th>სტატუსი</th>
                          <th>შენიშვნა</th>
                          <th>მოქმედება</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distributionItems.map((item) => {
                          const itemStatus = distributionService.getItemStatusInfo(item.status);
                          return (
                            <tr key={item.id}>
                              <td className="product-name">{item.productName}</td>
                              <td>{item.quantity} {item.unit}</td>
                              <td>
                                <span className="status-badge small" style={{ color: itemStatus.color, backgroundColor: itemStatus.bgColor }}>
                                  {itemStatus.label}
                                </span>
                              </td>
                              <td>{item.notes || '-'}</td>
                              <td className="item-actions">
                                {['PENDING', 'LOADING'].includes(selectedDistribution.status) && (
                                  <button className="action-btn danger" title="წაშლა" onClick={() => handleDeleteItem(item.id)}>
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {detailTab === 'logs' && (
              <div className="detail-content">
                {distributionLogs.length === 0 ? (
                  <div className="empty-state small">
                    <Clock size={32} />
                    <p>ისტორია ცარიელია</p>
                  </div>
                ) : (
                  <div className="items-table">
                    <table>
                      <thead>
                        <tr>
                          <th>თარიღი</th>
                          <th>მოქმედება</th>
                          <th>შენიშვნა</th>
                        </tr>
                      </thead>
                      <tbody>
                        {distributionLogs.map((log) => {
                          const actionInfo = distributionService.getLogActionInfo(log.action);
                          return (
                            <tr key={log.id}>
                              <td>{distributionService.formatDate(log.createdAt)}</td>
                              <td>
                                <span style={{ color: actionInfo.color, fontWeight: 500 }}>
                                  {actionInfo.label}
                                </span>
                              </td>
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

            {/* Info Tab */}
            {detailTab === 'info' && (
              <div className="detail-content">
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">ტიპი</div>
                    <div className="info-value">{distributionService.getTypeInfo(selectedDistribution.type).label}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">სტატუსი</div>
                    <div className="info-value">
                      <span className="status-badge" style={{
                        color: distributionService.getStatusInfo(selectedDistribution.status).color,
                        backgroundColor: distributionService.getStatusInfo(selectedDistribution.status).bgColor,
                      }}>
                        {distributionService.getStatusInfo(selectedDistribution.status).label}
                      </span>
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">მომხმარებელი</div>
                    <div className="info-value">{selectedDistribution.customer?.name || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">საკონტაქტო პირი</div>
                    <div className="info-value">{selectedDistribution.customer?.contactPerson || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">მიმართულება</div>
                    <div className="info-value">
                      {[selectedDistribution.destinationCity, selectedDistribution.destinationAddress].filter(Boolean).join(', ') || '-'}
                    </div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">დაგეგმილი თარიღი</div>
                    <div className="info-value">{selectedDistribution.scheduledDate ? distributionService.formatDate(selectedDistribution.scheduledDate) : '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">მანქანის ნომერი</div>
                    <div className="info-value">{selectedDistribution.vehiclePlate || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">მძღოლი</div>
                    <div className="info-value">{selectedDistribution.driverName || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">მძღოლის ტელეფონი</div>
                    <div className="info-value">{selectedDistribution.driverPhone || '-'}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">საერთო წონა</div>
                    <div className="info-value">{selectedDistribution.totalWeight} {selectedDistribution.weightUnit}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">შექმნის თარიღი</div>
                    <div className="info-value">{distributionService.formatDate(selectedDistribution.createdAt)}</div>
                  </div>
                  {selectedDistribution.notes && (
                    <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                      <div className="info-label">შენიშვნა</div>
                      <div className="info-value">{selectedDistribution.notes}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItemModal && (
        <div className="modal-overlay" onClick={() => setShowAddItemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ნივთის დამატება</h2>
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
                <label>შენიშვნა</label>
                <textarea value={itemFormData.notes} onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddItemModal(false)}>
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  დამატება
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="modal-overlay" onClick={() => setShowCustomerModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>ახალი მომხმარებელი</h2>
              <button className="close-btn" onClick={() => setShowCustomerModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateCustomer}>
              <div className="form-group">
                <label>სახელი *</label>
                <input type="text" value={customerFormData.name} onChange={(e) => setCustomerFormData({ ...customerFormData, name: e.target.value })} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>საკონტაქტო პირი</label>
                  <input type="text" value={customerFormData.contactPerson} onChange={(e) => setCustomerFormData({ ...customerFormData, contactPerson: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>ელ. ფოსტა</label>
                  <input type="email" value={customerFormData.email} onChange={(e) => setCustomerFormData({ ...customerFormData, email: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label>ტელეფონი</label>
                <div className="phone-input-group">
                  <span className="phone-prefix">+995</span>
                  <span className="phone-prefix">5</span>
                  <input
                    type="tel"
                    value={customerFormData.phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                      setCustomerFormData({ ...customerFormData, phone: digits });
                    }}
                    placeholder="XX XXX XX XX"
                    maxLength={8}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ქალაქი</label>
                  <select value={customerFormData.city} onChange={(e) => setCustomerFormData({ ...customerFormData, city: e.target.value })}>
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
                  </select>
                </div>
                <div className="form-group">
                  <label>მისამართი</label>
                  <input type="text" value={customerFormData.address} onChange={(e) => setCustomerFormData({ ...customerFormData, address: e.target.value })} placeholder="ქუჩა, ნომერი" />
                </div>
              </div>
              <div className="form-group">
                <label>შენიშვნა</label>
                <textarea value={customerFormData.notes} onChange={(e) => setCustomerFormData({ ...customerFormData, notes: e.target.value })} rows={3} />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCustomerModal(false)}>
                  გაუქმება
                </button>
                <button type="submit" className="btn btn-primary">
                  შექმნა
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionPage;
