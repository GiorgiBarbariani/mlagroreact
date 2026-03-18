import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, AtSign, Calendar, Building2, Shield, LogOut, Loader2, Save, Pencil, X, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/apiClient';
import { companyService } from '../../services/companyService';
import { Input } from '../../components/common/Input';
import './ProfilePage.scss';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  companyId?: string;
}

interface CompanyInfo {
  Id: string;
  Name: string;
  Description?: string;
  Address?: string;
  Phone?: string;
  SubscriptionPlan?: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuth();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit mode for company info
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [companyEditName, setCompanyEditName] = useState('');
  const [companyEditError, setCompanyEditError] = useState('');
  const [savingCompany, setSavingCompany] = useState(false);
  const [companyMessage, setCompanyMessage] = useState('');

  // Edit mode for personal info
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ firstName: '', lastName: '' });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/auth/me');
      const userData = response.data.user;
      setProfile(userData);
      setEditData({
        firstName: userData.firstName || '',
        lastName: userData.lastName || ''
      });

      // Fetch company info if user has a company
      if (userData.companyId && (userData.role === 'Company' || userData.role === 'Admin')) {
        try {
          const companyData = await companyService.getCompanyInfo();
          if (companyData) {
            setCompany({
              Id: companyData.id,
              Name: companyData.name,
              Description: companyData.description,
              Address: undefined,
              Phone: undefined,
              SubscriptionPlan: companyData.subscriptionType
            });
          }
        } catch {
          // Company info fetch failed, not critical
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const processedValue = value.replace(/[^a-zA-Zა-ჰ]/g, '');
    setEditData(prev => ({ ...prev, [name]: processedValue }));

    // Validate
    if (!processedValue) {
      setEditErrors(prev => ({ ...prev, [name]: name === 'firstName' ? 'სახელი აუცილებელია' : 'გვარი აუცილებელია' }));
    } else if (processedValue.length < 2) {
      setEditErrors(prev => ({ ...prev, [name]: 'მინიმუმ 2 სიმბოლო' }));
    } else {
      setEditErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSaveProfile = async () => {
    const newErrors: Record<string, string> = {};
    if (!editData.firstName) newErrors.firstName = 'სახელი აუცილებელია';
    else if (editData.firstName.length < 2) newErrors.firstName = 'მინიმუმ 2 სიმბოლო';
    if (!editData.lastName) newErrors.lastName = 'გვარი აუცილებელია';
    else if (editData.lastName.length < 2) newErrors.lastName = 'მინიმუმ 2 სიმბოლო';

    if (Object.values(newErrors).some(e => e)) {
      setEditErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      setSaveMessage('');
      const response = await apiClient.put('/auth/profile', editData);
      const updatedUser = response.data.user;
      setProfile(prev => prev ? { ...prev, ...updatedUser } : prev);
      setIsEditing(false);
      setSaveMessage('პროფილი წარმატებით განახლდა');

      // Update AuthContext
      if (user) {
        updateUser({
          ...user,
          name: updatedUser.firstName || updatedUser.username || user.name
        });
      }

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'პროფილის განახლება ვერ მოხერხდა';
      setEditErrors({ general: msg });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || ''
    });
    setEditErrors({});
  };

  const handleStartEditCompany = () => {
    setIsEditingCompany(true);
    setCompanyEditName(company?.Name || '');
    setCompanyEditError('');
    setCompanyMessage('');
  };

  const handleCancelEditCompany = () => {
    setIsEditingCompany(false);
    setCompanyEditName(company?.Name || '');
    setCompanyEditError('');
  };

  const handleSaveCompany = async () => {
    if (!companyEditName.trim()) {
      setCompanyEditError('კომპანიის დასახელება აუცილებელია');
      return;
    }
    if (!company?.Id) {
      setCompanyEditError('კომპანიის ID ვერ მოიძებნა');
      return;
    }
    try {
      setSavingCompany(true);
      setCompanyEditError('');
      await companyService.updateCompany(company.Id, { name: companyEditName } as any);
      setCompany(prev => prev ? { ...prev, Name: companyEditName } : prev);
      setIsEditingCompany(false);
      setCompanyMessage('კომპანიის სახელი წარმატებით განახლდა');
      setTimeout(() => setCompanyMessage(''), 3000);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'კომპანიის სახელის განახლება ვერ მოხერხდა';
      setCompanyEditError(msg);
    } finally {
      setSavingCompany(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));

    // Validate
    const newErrors = { ...passwordErrors };
    if (name === 'currentPassword') {
      newErrors.currentPassword = !value ? 'ძველი პაროლი აუცილებელია' : '';
    } else if (name === 'newPassword') {
      newErrors.newPassword = !value ? 'ახალი პაროლი აუცილებელია' : value.length < 6 ? 'მინიმუმ 6 სიმბოლო' : '';
      if (passwordData.confirmPassword && value !== passwordData.confirmPassword) {
        newErrors.confirmPassword = 'პაროლები არ ემთხვევა';
      } else if (passwordData.confirmPassword) {
        newErrors.confirmPassword = '';
      }
    } else if (name === 'confirmPassword') {
      newErrors.confirmPassword = !value ? 'გაიმეორეთ პაროლი' : value !== passwordData.newPassword ? 'პაროლები არ ემთხვევა' : '';
    }
    setPasswordErrors(newErrors);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) newErrors.currentPassword = 'ძველი პაროლი აუცილებელია';
    if (!passwordData.newPassword) newErrors.newPassword = 'ახალი პაროლი აუცილებელია';
    else if (passwordData.newPassword.length < 6) newErrors.newPassword = 'მინიმუმ 6 სიმბოლო';
    if (!passwordData.confirmPassword) newErrors.confirmPassword = 'გაიმეორეთ პაროლი';
    else if (passwordData.confirmPassword !== passwordData.newPassword) newErrors.confirmPassword = 'პაროლები არ ემთხვევა';

    if (Object.values(newErrors).some(e => e)) {
      setPasswordErrors(newErrors);
      return;
    }

    try {
      setChangingPassword(true);
      setPasswordMessage('');
      setPasswordErrors({});
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordMessage('პაროლი წარმატებით შეიცვალა');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordMessage(''), 3000);
    } catch (error: any) {
      const msg = error.response?.data?.error || 'პაროლის შეცვლა ვერ მოხერხდა';
      setPasswordErrors({ general: msg });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const months = [
        'იანვარი', 'თებერვალი', 'მარტი', 'აპრილი', 'მაისი', 'ივნისი',
        'ივლისი', 'აგვისტო', 'სექტემბერი', 'ოქტომბერი', 'ნოემბერი', 'დეკემბერი'
      ];
      return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'Admin': return 'ადმინისტრატორი';
      case 'Company': return 'კომპანიის მფლობელი';
      case 'Employee': return 'თანამშრომელი';
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <Loader2 size={32} className="spinner" />
          <span>იტვირთება...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>პროფილი</h1>
        <p>მართეთ თქვენი პირადი ინფორმაცია და პარამეტრები</p>
      </div>

      <div className="profile-content">
        {/* Company Info Section */}
        {(profile?.role === 'Company' || profile?.role === 'Admin') && company && (
          <section className="profile-section">
            <div className="section-header">
              <div className="section-title">
                <Building2 size={20} />
                <h2>კომპანიის ინფორმაცია</h2>
              </div>
              {!isEditingCompany ? (
                <button className="btn-edit" onClick={handleStartEditCompany}>
                  <Pencil size={16} />
                  რედაქტირება
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="btn-cancel" onClick={handleCancelEditCompany}>
                    <X size={16} />
                    გაუქმება
                  </button>
                  <button className="btn-save" onClick={handleSaveCompany} disabled={savingCompany}>
                    {savingCompany ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                    შენახვა
                  </button>
                </div>
              )}
            </div>

            {companyMessage && <div className="success-message"><Check size={16} /> {companyMessage}</div>}
            {companyEditError && <div className="error-message">{companyEditError}</div>}

            <div className="info-grid">
              {isEditingCompany ? (
                <>
                  <div className="form-row">
                    <Input
                      label="კომპანიის სახელი"
                      name="companyName"
                      value={companyEditName}
                      onChange={(e) => {
                        setCompanyEditName(e.target.value);
                        setCompanyEditError('');
                      }}
                      placeholder="შეიყვანეთ კომპანიის სახელი"
                      leftIcon={<Building2 size={18} />}
                      error={companyEditError}
                      required
                    />
                  </div>
                  <div className="info-row readonly">
                    <div className="info-item">
                      <span className="info-label"><Shield size={16} /> გამოწერის გეგმა</span>
                      <span className="info-value">{company.SubscriptionPlan || '—'}</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="info-row">
                    <div className="info-item">
                      <span className="info-label"><Building2 size={16} /> კომპანიის სახელი</span>
                      <span className="info-value">{company.Name || '—'}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label"><Shield size={16} /> გამოწერის გეგმა</span>
                      <span className="info-value">{company.SubscriptionPlan || '—'}</span>
                    </div>
                  </div>
                  {(company.Address || company.Phone) && (
                    <div className="info-row">
                      {company.Address && (
                        <div className="info-item">
                          <span className="info-label">მისამართი</span>
                          <span className="info-value">{company.Address}</span>
                        </div>
                      )}
                      {company.Phone && (
                        <div className="info-item">
                          <span className="info-label">ტელეფონი</span>
                          <span className="info-value">{company.Phone}</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </section>
        )}

        {/* Personal Information Section */}
        <section className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <User size={20} />
              <h2>პირადი ინფორმაცია</h2>
            </div>
            {!isEditing ? (
              <button className="btn-edit" onClick={() => setIsEditing(true)}>
                <Pencil size={16} />
                რედაქტირება
              </button>
            ) : (
              <div className="edit-actions">
                <button className="btn-cancel" onClick={handleCancelEdit}>
                  <X size={16} />
                  გაუქმება
                </button>
                <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : <Save size={16} />}
                  შენახვა
                </button>
              </div>
            )}
          </div>

          {saveMessage && <div className="success-message"><Check size={16} /> {saveMessage}</div>}
          {editErrors.general && <div className="error-message">{editErrors.general}</div>}

          <div className="info-grid">
            {isEditing ? (
              <>
                <div className="form-row">
                  <Input
                    label="სახელი"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleEditChange}
                    placeholder="შეიყვანეთ სახელი"
                    leftIcon={<User size={18} />}
                    error={editErrors.firstName}
                    required
                  />
                  <Input
                    label="გვარი"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleEditChange}
                    placeholder="შეიყვანეთ გვარი"
                    leftIcon={<User size={18} />}
                    error={editErrors.lastName}
                    required
                  />
                </div>
                <div className="info-row readonly">
                  <div className="info-item">
                    <span className="info-label"><Mail size={16} /> ელ.ფოსტა</span>
                    <span className="info-value">{profile?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><AtSign size={16} /> მომხმარებლის სახელი</span>
                    <span className="info-value">{profile?.username}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><User size={16} /> სახელი</span>
                    <span className="info-value">{profile?.firstName || '—'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><User size={16} /> გვარი</span>
                    <span className="info-value">{profile?.lastName || '—'}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><Mail size={16} /> ელ.ფოსტა</span>
                    <span className="info-value">{profile?.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><AtSign size={16} /> მომხმარებლის სახელი</span>
                    <span className="info-value">{profile?.username}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><Shield size={16} /> როლი</span>
                    <span className="info-value role-badge">{getRoleLabel(profile?.role || '')}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><Building2 size={16} /> კომპანიის დასახელება</span>
                    <span className="info-value">{company?.Name || '—'}</span>
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-item">
                    <span className="info-label"><Calendar size={16} /> რეგისტრაციის თარიღი</span>
                    <span className="info-value">{profile?.createdAt ? formatDate(profile.createdAt) : '—'}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Password Change Section */}
        <section className="profile-section">
          <div className="section-header">
            <div className="section-title">
              <Lock size={20} />
              <h2>პაროლის შეცვლა</h2>
            </div>
          </div>

          {passwordMessage && <div className="success-message"><Check size={16} /> {passwordMessage}</div>}
          {passwordErrors.general && <div className="error-message">{passwordErrors.general}</div>}

          <form className="password-form" onSubmit={handleChangePassword}>
            <Input
              label="ძველი პაროლი"
              type="password"
              name="currentPassword"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="შეიყვანეთ ძველი პაროლი"
              leftIcon={<Lock size={18} />}
              error={passwordErrors.currentPassword}
              required
              autoComplete="current-password"
            />
            <div className="form-row">
              <Input
                label="ახალი პაროლი"
                type="password"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="მინიმუმ 6 სიმბოლო"
                leftIcon={<Lock size={18} />}
                error={passwordErrors.newPassword}
                required
                autoComplete="new-password"
              />
              <Input
                label="გაიმეორეთ ახალი პაროლი"
                type="password"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="გაიმეორეთ პაროლი"
                leftIcon={<Lock size={18} />}
                error={passwordErrors.confirmPassword}
                required
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn-change-password" disabled={changingPassword}>
              {changingPassword ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  იცვლება...
                </>
              ) : (
                <>
                  <Lock size={16} />
                  პაროლის შეცვლა
                </>
              )}
            </button>
          </form>
        </section>

        {/* Logout Section */}
        <section className="profile-section logout-section">
          <button className="btn-logout" onClick={handleLogout}>
            <LogOut size={18} />
            გასვლა
          </button>
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;
