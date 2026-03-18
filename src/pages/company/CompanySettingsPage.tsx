import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2, Loader2 } from 'lucide-react';
import { companyService } from '../../services/companyService';
import type { Company } from '../../services/companyService';
import './CompanySettingsPage.scss';

const CompanySettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      setLoading(true);
      const data = await companyService.getCompanyInfo();
      setCompany(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        address: '',
        phone: '',
        email: '',
      });
    } catch (err) {
      console.error('Failed to fetch company info:', err);
      setError('კომპანიის ინფორმაცია ვერ ჩაიტვირთა');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('კომპანიის დასახელება აუცილებელია');
      return;
    }

    if (!company?.id) {
      setError('კომპანიის ID ვერ მოიძებნა');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await companyService.updateCompany(company.id, {
        name: formData.name,
        description: formData.description || undefined,
      } as any);
      setSuccess('ცვლილებები წარმატებით შეინახა');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'ცვლილებების შენახვა ვერ მოხერხდა';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    const months = [
      'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
      'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
    ];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="company-settings-page">
        <div className="loading-state">
          <Loader2 size={40} className="spinner" />
          <p>იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="company-settings-page">
      <div className="page-header">
        <button className="btn-back" onClick={() => navigate('/app/company')}>
          <ArrowLeft size={20} />
          <span>უკან</span>
        </button>
        <h1 className="page-title">
          <Building2 size={24} />
          კომპანიის პარამეტრები
        </h1>
      </div>

      <div className="settings-content">
        <div className="settings-main">
          <form className="settings-form" onSubmit={handleSubmit}>
            {error && <div className="message error-message">{error}</div>}
            {success && <div className="message success-message">{success}</div>}

            <div className="form-section">
              <h2>ძირითადი ინფორმაცია</h2>

              <div className="form-group">
                <label htmlFor="name">კომპანიის დასახელება</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ კომპანიის დასახელება"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">აღწერა</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="კომპანიის მოკლე აღწერა"
                  rows={3}
                />
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate('/app/company')}
              >
                გაუქმება
              </button>
              <button
                type="submit"
                className="btn-save"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spinner" />
                    <span>ინახება...</span>
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    <span>შენახვა</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        <div className="settings-sidebar">
          <div className="info-card">
            <h3>კომპანიის სტატისტიკა</h3>
            <div className="stat-list">
              <div className="stat-row">
                <span className="stat-label">თანამშრომლები</span>
                <span className="stat-value">{company?.employeeCount || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">მინდვრები</span>
                <span className="stat-value">{company?.fieldCount || 0}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">სულ ფართობი</span>
                <span className="stat-value">{company?.totalArea || 0} ჰა</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">გამოწერის გეგმა</span>
                <span className="stat-value">{company?.subscriptionType || 'Free'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">რეგისტრაციის თარიღი</span>
                <span className="stat-value">{formatDate(company?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanySettingsPage;
