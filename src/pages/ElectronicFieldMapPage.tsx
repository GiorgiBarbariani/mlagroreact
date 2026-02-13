import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Map,
  Users,
  FileText,
  Calendar,
  Settings,
  BarChart3,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/apiClient';
import './ElectronicFieldMapPage.scss';

interface FieldStats {
  totalFields: number;
  totalArea: number;
  totalPolygons: number;
  lastUpdate?: string;
}

interface SystemModule {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  errorCount: number;
}

interface SystemStatus {
  overallStatus: 'healthy' | 'warning' | 'error';
  modules: SystemModule[];
  modulesWithErrors: number;
  totalErrors: number;
}

const ElectronicFieldMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [fieldStats, setFieldStats] = useState<FieldStats>({
    totalFields: 0,
    totalArea: 0,
    totalPolygons: 0
  });
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load field statistics
      try {
        const fieldsResponse = await apiClient.get('/fields/statistics');
        if (fieldsResponse.data) {
          setFieldStats({
            totalFields: fieldsResponse.data.totalFields || 0,
            totalArea: fieldsResponse.data.totalArea || 0,
            totalPolygons: fieldsResponse.data.totalPolygons || 0,
            lastUpdate: fieldsResponse.data.lastUpdate
          });
        }
      } catch (err) {
        console.error('Error loading field stats:', err);
      }

      // Load system status
      try {
        const statusResponse = await apiClient.get('/system/health');
        if (statusResponse.data) {
          setSystemStatus(statusResponse.data);
        }
      } catch (err) {
        console.error('Error loading system status:', err);
      }
    } catch (err) {
      setError('შეცდომა მონაცემების ჩატვირთვისას');
    } finally {
      setLoading(false);
    }
  };

  const navigationCards = [
    {
      id: 'fields',
      title: 'მინდვრების რუკა',
      icon: Map,
      color: 'green',
      path: '/app/electronic-field-map/fields',
      description: 'იხილეთ და მართეთ ყველა მინდორი რუკაზე'
    },
    {
      id: 'my-fields',
      title: 'ჩემი მინდვრები',
      icon: FileText,
      color: 'blue',
      path: '/app/my-fields',
      description: 'თქვენი პირადი მინდვრების მართვა'
    },
    {
      id: 'satellite',
      title: 'სატელიტური მონაცემები',
      icon: BarChart3,
      color: 'purple',
      path: '/app/satellite-data',
      description: 'სატელიტური სურათები და ანალიზი'
    },
    {
      id: 'weather',
      title: 'ამინდის GIS',
      icon: Calendar,
      color: 'orange',
      path: '/app/weather/gis',
      description: 'ამინდის მონაცემები რუკაზე'
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const getStatusIcon = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle size={16} className="status-icon healthy" />;
      case 'warning':
        return <AlertCircle size={16} className="status-icon warning" />;
      case 'error':
        return <AlertCircle size={16} className="status-icon error" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: 'healthy' | 'warning' | 'error') => {
    switch (status) {
      case 'healthy':
        return 'ნორმალური';
      case 'warning':
        return 'გაფრთხილება';
      case 'error':
        return 'შეცდომა';
      default:
        return 'უცნობი';
    }
  };

  return (
    <div className="electronic-field-map-page">
      <div className="page-header">
        <h1 className="page-title">ელექტრონული მინდვრების რუკა</h1>
        <div className="header-actions">
          <button className="btn-settings" onClick={() => navigate('/app/settings')}>
            <Settings size={18} />
            <span>პარამეტრები</span>
          </button>
        </div>
      </div>

      <div className="page-content">
        <div className="content-wrapper">
          {/* Left Column - Navigation Cards */}
          <div className="left-column">
            <div className="navigation-cards">
              <div className="card-grid">
                {navigationCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`nav-card card-${card.color}`}
                      onClick={() => handleCardClick(card.path)}
                    >
                      <div className="card-background-icon">
                        <Icon size={80} strokeWidth={1} />
                      </div>
                      <div className="card-icon">
                        <Icon size={28} />
                      </div>
                      <h3 className="card-title">{card.title}</h3>
                      <p className="card-description">{card.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="divider-line"></div>

          {/* Right Column - Summary Panel */}
          <div className="right-column">
            <div className="summary-panel">
              <div className="summary-header">
                <h2>შემაჯამებელი ინფორმაცია</h2>
                <button
                  className="refresh-btn"
                  onClick={loadData}
                  disabled={loading}
                >
                  <RefreshCw size={18} className={loading ? 'spinning' : ''} />
                </button>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>იტვირთება...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <AlertCircle size={24} />
                  <p>{error}</p>
                  <button onClick={loadData}>თავიდან ცდა</button>
                </div>
              ) : (
                <>
                  {/* Statistics Cards */}
                  <div className="info-cards">
                    <div className="info-card">
                      <div className="card-content">
                        <span className="card-title">სულ მინდვრები</span>
                        <div className="card-value">{fieldStats.totalFields}</div>
                      </div>
                      <div className="card-icon-wrapper">
                        <Map size={24} />
                      </div>
                    </div>

                    <div className="info-card">
                      <div className="card-content">
                        <span className="card-title">სულ ფართობი</span>
                        <div className="card-value">{fieldStats.totalArea.toFixed(2)} ჰა</div>
                      </div>
                      <div className="card-icon-wrapper">
                        <FileText size={24} />
                      </div>
                    </div>

                    <div className="info-card">
                      <div className="card-content">
                        <span className="card-title">პოლიგონები</span>
                        <div className="card-value">{fieldStats.totalPolygons}</div>
                      </div>
                      <div className="card-icon-wrapper">
                        <BarChart3 size={24} />
                      </div>
                    </div>
                  </div>

                  {/* System Status */}
                  {systemStatus && (
                    <div className="system-status-panel">
                      <div className="status-header">
                        <Clock size={18} />
                        <span>სისტემის სტატუსი</span>
                        <button
                          className="details-btn"
                          onClick={() => navigate('/app/admin/system-status')}
                        >
                          დეტალები
                        </button>
                      </div>

                      <div className="modules-grid">
                        {systemStatus.modules?.slice(0, 6).map((module, index) => (
                          <div
                            key={index}
                            className={`module-item status-${module.status}`}
                          >
                            <div className="module-indicator">
                              <div className={`status-dot ${module.status}`}></div>
                              <span className="module-name">{module.name}</span>
                            </div>
                            {module.errorCount > 0 ? (
                              <span className="error-count">{module.errorCount}</span>
                            ) : (
                              <CheckCircle size={14} className="success-icon" />
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="status-summary">
                        <div className="summary-stats">
                          <div className="stat-item">
                            <span className="stat-label">მოდულები</span>
                            <span className="stat-value">{systemStatus.modules?.length || 0}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">შეცდომებით</span>
                            <span className="stat-value error">{systemStatus.modulesWithErrors}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">სულ შეცდომები</span>
                            <span className="stat-value error">{systemStatus.totalErrors}</span>
                          </div>
                        </div>
                        <div className={`overall-status status-${systemStatus.overallStatus}`}>
                          {getStatusIcon(systemStatus.overallStatus)}
                          <span>{getStatusText(systemStatus.overallStatus)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="quick-actions">
                    <h3>სწრაფი მოქმედებები</h3>
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/electronic-field-map/fields')}
                      >
                        <Map size={16} />
                        <span>რუკის ნახვა</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/my-fields')}
                      >
                        <Upload size={16} />
                        <span>მინდვრის დამატება</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/satellite-images')}
                      >
                        <Download size={16} />
                        <span>მონაცემების ექსპორტი</span>
                      </button>
                    </div>
                  </div>

                  {/* Last Update */}
                  {fieldStats.lastUpdate && (
                    <div className="last-update">
                      <Clock size={14} />
                      <span>ბოლო განახლება: {new Date(fieldStats.lastUpdate).toLocaleString('ka-GE')}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElectronicFieldMapPage;
