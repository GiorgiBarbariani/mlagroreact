import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Map, Grid3X3, Calendar, CreditCard, Building2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/apiClient';
import './CompanyPage.scss';

interface CompanyInfo {
  id?: string;
  name: string;
  employees: number;
  fields: number;
  totalArea: number;
  subscription: string;
  owner?: string;
  createdAt?: string;
}

const CompanyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    name: 'ჩემი კომპანია',
    employees: 0,
    fields: 0,
    totalArea: 0,
    subscription: 'საბაზისო'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      // Fetch company info from API
      const response = await apiClient.get('/company/info');
      if (response.data) {
        setCompanyInfo({
          id: response.data.id,
          name: response.data.name || 'ჩემი კომპანია',
          employees: response.data.employeeCount || 0,
          fields: response.data.fieldCount || 0,
          totalArea: response.data.totalArea || 0,
          subscription: response.data.subscriptionType || 'საბაზისო',
          owner: response.data.ownerName,
          createdAt: response.data.createdAt
        });
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
      // Use default values if fetch fails
    } finally {
      setLoading(false);
    }
  };

  const companyCards = [
    {
      id: 'employees',
      title: 'თანამშრომლების მართვა',
      icon: Users,
      color: 'blue',
      path: '/app/company/employees',
      description: 'მართეთ თქვენი თანამშრომლები'
    },
    {
      id: 'fields',
      title: 'მინდვრების მართვა',
      icon: Map,
      color: 'green',
      path: '/app/company/chat',
      description: 'მართეთ კომპანიის მინდვრები'
    },
    {
      id: 'my-fields',
      title: 'ჩემი მინდვრები',
      icon: Grid3X3,
      color: 'orange',
      path: '/app/my-fields',
      description: 'იხილეთ და მართეთ თქვენი მინდვრები'
    },
    {
      id: 'tasks',
      title: 'დავალებების მართვა',
      icon: Calendar,
      color: 'purple',
      path: '/app/company/tasks',
      description: 'დაგეგმეთ და მართეთ დავალებები'
    },
    {
      id: 'payment',
      title: 'გადახდა და გამოწერა',
      icon: CreditCard,
      color: 'teal',
      path: '/app/subscription',
      description: 'მართეთ გამოწერები და გადახდები'
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  return (
    <div className="company-page">
      <div className="page-header">
        <h1 className="page-title">კომპანია</h1>
        <div className="header-actions">
          <button className="btn-company-settings" onClick={() => navigate('/app/company/settings')}>
            <Building2 size={18} />
            <span>პარამეტრები</span>
          </button>
        </div>
      </div>

      <div className="company-content">
        <div className="content-wrapper">
          <div className="left-column">
            <div className="company-cards">
              <div className="card-grid">
                {companyCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.id}
                      className={`company-card card-${card.color}`}
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

          <div className="right-column">
            <div className="summary-card">
              <h2 className="summary-title">კომპანიის ინფორმაცია</h2>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>იტვირთება...</p>
                </div>
              ) : (
                <>
                  <div className="company-stats">
                    <div className="stat-item">
                      <div className="stat-value">{companyInfo.employees}</div>
                      <div className="stat-label">თანამშრომლები</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{companyInfo.fields}</div>
                      <div className="stat-label">მინდვრები</div>
                    </div>
                    <div className="stat-item">
                      <div className="stat-value">{companyInfo.totalArea}</div>
                      <div className="stat-label">ჰექტარი</div>
                    </div>
                  </div>

                  <div className="data-sources">
                    <h3>კომპანიის დეტალები</h3>
                    <div className="sources-list">
                      <div className="info-row">
                        <span className="info-label">კომპანიის სახელი:</span>
                        <span className="info-value">{companyInfo.name}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">მფლობელი:</span>
                        <span className="info-value">{companyInfo.owner || user?.name || 'არ არის მითითებული'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">გამოწერა:</span>
                        <span className="info-value subscription-badge">{companyInfo.subscription}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">თანამშრომლები:</span>
                        <span className="info-value">{companyInfo.employees}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">სულ ფართობი:</span>
                        <span className="info-value">{companyInfo.totalArea} ჰა</span>
                      </div>
                    </div>
                  </div>

                  <div className="quick-actions">
                    <h3>სწრაფი მოქმედებები</h3>
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/company/employees')}
                      >
                        <Users size={16} />
                        <span>დაამატე თანამშრომელი</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/my-fields')}
                      >
                        <Map size={16} />
                        <span>დაამატე მინდვორი</span>
                      </button>
                      <button
                        className="action-btn"
                        onClick={() => navigate('/app/company/tasks')}
                      >
                        <Calendar size={16} />
                        <span>შექმენი დავალება</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyPage;