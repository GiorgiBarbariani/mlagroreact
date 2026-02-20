import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import './LoginPage.scss';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'ელ.ფოსტა აუცილებელია';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'არასწორი ელ.ფოსტის ფორმატი';
    }

    if (!formData.password) {
      newErrors.password = 'პაროლი აუცილებელია';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await login(formData.email, formData.password);
      navigate('/app/main-menu');
    } catch (error: any) {
      // Translate backend errors to Georgian
      const backendError = error.response?.data?.error || error.response?.data?.message || '';
      let georgianError = 'შესვლა ვერ მოხერხდა. სცადეთ თავიდან.';

      if (backendError.toLowerCase().includes('invalid credentials') ||
          backendError.toLowerCase().includes('wrong password') ||
          backendError.toLowerCase().includes('incorrect password')) {
        georgianError = 'არასწორი ელ.ფოსტა ან პაროლი';
      } else if (backendError.toLowerCase().includes('user not found') ||
                 backendError.toLowerCase().includes('no user')) {
        georgianError = 'მომხმარებელი ვერ მოიძებნა';
      } else if (backendError.toLowerCase().includes('email not verified') ||
                 backendError.toLowerCase().includes('verify your email')) {
        georgianError = 'გთხოვთ დაადასტუროთ თქვენი ელ.ფოსტა';
      } else if (backendError.toLowerCase().includes('account locked') ||
                 backendError.toLowerCase().includes('too many attempts')) {
        georgianError = 'ანგარიში დაბლოკილია. სცადეთ მოგვიანებით.';
      } else if (backendError.toLowerCase().includes('network') ||
                 backendError.toLowerCase().includes('connection')) {
        georgianError = 'ქსელის შეცდომა. შეამოწმეთ ინტერნეტ კავშირი.';
      }

      setErrors({ general: georgianError });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>MLAgro</h1>
            <h2>კეთილი იყოს თქვენი დაბრუნება</h2>
            <p>შედით თქვენს ანგარიშზე გასაგრძელებლად</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} autoComplete="off">
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <Input
              label="ელ.ფოსტა"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="შეიყვანეთ ელ.ფოსტა"
              leftIcon={<Mail size={18} />}
              error={errors.email}
              required
            />

            <Input
              label="პაროლი"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="შეიყვანეთ პაროლი"
              leftIcon={<Lock size={18} />}
              error={errors.password}
              required
              autoComplete="off"
            />

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>დამახსოვრება</span>
              </label>
              <Link to="/forgot-password">დაგავიწყდათ პაროლი?</Link>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>შესვლა...</span>
                </>
              ) : 'შესვლა'}
            </button>
          </form>

          <div className="login-footer">
            <p>
              არ გაქვთ ანგარიში?
              <Link to="/register"> რეგისტრაცია</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
