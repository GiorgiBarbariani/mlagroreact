import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Bell, Monitor, Shield, Sun, Moon, Laptop,
  CloudRain, ClipboardList, RefreshCw, Satellite, CreditCard, Building2, Map,
  Loader2, Check, AlertCircle, Clock, Smartphone, KeyRound, ToggleLeft, ToggleRight
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { apiClient } from '../../api/apiClient';
import './SettingsPage.scss';

interface UserSettings {
  id: string;
  userId: string;
  notifyWeatherAlerts: boolean;
  notifyTaskAssigned: boolean;
  notifyTaskUpdated: boolean;
  notifySatelliteUpdate: boolean;
  notifySubscription: boolean;
  notifyCompany: boolean;
  notifyFieldUpdate: boolean;
  dateFormat: string;
  language: string;
  theme: string;
}

const NOTIFICATION_TOGGLES = [
  { key: 'notifyWeatherAlerts', label: 'ამინდის გაფრთხილებები', icon: CloudRain },
  { key: 'notifyTaskAssigned', label: 'დავალებების მინიჭება', icon: ClipboardList },
  { key: 'notifyTaskUpdated', label: 'დავალებების განახლება', icon: RefreshCw },
  { key: 'notifySatelliteUpdate', label: 'სატელიტური განახლებები', icon: Satellite },
  { key: 'notifySubscription', label: 'გამოწერის შეტყობინებები', icon: CreditCard },
  { key: 'notifyCompany', label: 'კომპანიის შეტყობინებები', icon: Building2 },
  { key: 'notifyFieldUpdate', label: 'მინდვრის განახლებები', icon: Map },
] as const;

const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const LANGUAGES = [
  { value: 'ka', label: 'ქართული' },
  { value: 'en', label: 'English' },
];

const THEMES = [
  { value: 'light', label: 'ნათელი', icon: Sun },
  { value: 'dark', label: 'მუქი', icon: Moon },
  { value: 'system', label: 'სისტემური', icon: Laptop },
];

const SettingsPage: React.FC = () => {
  useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingChangesRef = useRef<Partial<UserSettings>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiClient.get<UserSettings>('/settings');
      setSettings(response.data);
    } catch (err: any) {
      setError('პარამეტრების ჩატვირთვა ვერ მოხერხდა');
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const flushPendingChanges = useCallback(async () => {
    const changes = { ...pendingChangesRef.current };
    pendingChangesRef.current = {};
    if (Object.keys(changes).length === 0) return;

    try {
      setSaving(true);
      setError('');
      const response = await apiClient.put<UserSettings>('/settings', changes);
      // Merge server response while preserving any newer local changes made during save
      setSettings(prev => {
        if (!prev) return response.data;
        const merged = { ...response.data };
        // If new pending changes accumulated during the request, keep local values
        for (const key of Object.keys(pendingChangesRef.current)) {
          (merged as any)[key] = (pendingChangesRef.current as any)[key];
        }
        return merged as UserSettings;
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError('პარამეტრების შენახვა ვერ მოხერხდა');
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  }, []);

  const scheduleSave = useCallback((changes: Partial<UserSettings>) => {
    // Accumulate all changes
    pendingChangesRef.current = { ...pendingChangesRef.current, ...changes };
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      flushPendingChanges();
    }, 500);
  }, [flushPendingChanges]);

  const handleToggle = (key: string) => {
    if (!settings) return;
    const newValue = !settings[key as keyof UserSettings];
    setSettings(prev => prev ? { ...prev, [key]: newValue } : prev);
    scheduleSave({ [key]: newValue } as Partial<UserSettings>);
  };

  const allNotificationsEnabled = settings
    ? NOTIFICATION_TOGGLES.every(({ key }) => settings[key as keyof UserSettings] === true)
    : false;

  const handleToggleAll = () => {
    if (!settings) return;
    const newValue = !allNotificationsEnabled;
    const changes: Partial<UserSettings> = {};
    const updated = { ...settings };
    for (const { key } of NOTIFICATION_TOGGLES) {
      (updated as any)[key] = newValue;
      (changes as any)[key] = newValue;
    }
    setSettings(updated as UserSettings);
    scheduleSave(changes);
  };

  const handleSelectChange = (key: string, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
    // For selects, flush immediately (no debounce needed)
    pendingChangesRef.current = { ...pendingChangesRef.current, [key]: value } as Partial<UserSettings>;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    flushPendingChanges();
  };

  if (loading) {
    return (
      <div className="settings-page">
        <div className="settings-loading">
          <Loader2 className="spinner" size={32} />
          <span>იტვირთება...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>პარამეტრები</h1>
        <p>მართეთ თქვენი აკაუნტის პარამეტრები და პრეფერენციები</p>
      </div>

      {error && (
        <div className="settings-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-content">
        {/* შეტყობინებების პარამეტრები */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-title">
              <Bell size={20} />
              <h2>შეტყობინებების პარამეტრები</h2>
            </div>
            {saving && (
              <div className="save-indicator">
                <Loader2 className="spinner" size={14} />
                <span>ინახება...</span>
              </div>
            )}
            {saveSuccess && (
              <div className="save-indicator success">
                <Check size={14} />
                <span>შენახულია</span>
              </div>
            )}
          </div>

          <div className="toggles-list">
            <div className="toggle-row toggle-all-row">
              <div className="toggle-info">
                {allNotificationsEnabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                <span>{allNotificationsEnabled ? 'ყველას გაუქმება' : 'ყველას მონიშვნა'}</span>
              </div>
              <button
                className={`toggle-switch ${allNotificationsEnabled ? 'active' : ''}`}
                onClick={handleToggleAll}
                type="button"
                aria-label="ყველას მონიშვნა / გაუქმება"
              >
                <span className="toggle-knob" />
              </button>
            </div>
            {NOTIFICATION_TOGGLES.map(({ key, label, icon: Icon }) => (
              <div className="toggle-row" key={key}>
                <div className="toggle-info">
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
                <button
                  className={`toggle-switch ${settings?.[key as keyof UserSettings] ? 'active' : ''}`}
                  onClick={() => handleToggle(key)}
                  type="button"
                  aria-label={label}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* ჩვენების პარამეტრები */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-title">
              <Monitor size={20} />
              <h2>ჩვენების პარამეტრები</h2>
            </div>
          </div>

          <div className="display-settings">
            <div className="setting-row">
              <label className="setting-label">თარიღის ფორმატი</label>
              <select
                className="setting-select"
                value={settings?.dateFormat || 'DD/MM/YYYY'}
                onChange={(e) => handleSelectChange('dateFormat', e.target.value)}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <label className="setting-label">ენა</label>
              <select
                className="setting-select"
                value={settings?.language || 'ka'}
                onChange={(e) => handleSelectChange('language', e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </select>
            </div>

            <div className="setting-row">
              <label className="setting-label">თემა</label>
              <div className="theme-buttons">
                {THEMES.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    className={`theme-btn ${settings?.theme === value ? 'active' : ''}`}
                    onClick={() => handleSelectChange('theme', value)}
                    type="button"
                  >
                    <Icon size={16} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* უსაფრთხოება */}
        <section className="settings-section">
          <div className="section-header">
            <div className="section-title">
              <Shield size={20} />
              <h2>უსაფრთხოება</h2>
            </div>
          </div>

          <div className="security-settings">
            <div className="security-item">
              <div className="security-info">
                <Clock size={18} />
                <div>
                  <span className="security-label">ბოლო შესვლა</span>
                  <span className="security-value">დღეს, {new Date().toLocaleTimeString('ka-GE', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="security-item">
              <div className="security-info">
                <KeyRound size={18} />
                <div>
                  <span className="security-label">ორფაქტორიანი ავტორიზაცია</span>
                  <span className="security-value">დამატებითი დაცვის ფენა თქვენი ანგარიშისთვის</span>
                </div>
              </div>
              <span className="badge-soon">მალე</span>
            </div>

            <div className="security-item">
              <div className="security-info">
                <Smartphone size={18} />
                <div>
                  <span className="security-label">აქტიური სესიები</span>
                  <span className="security-value">მართეთ თქვენი აქტიური მოწყობილობები</span>
                </div>
              </div>
              <span className="badge-soon">მალე</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
