import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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
      setErrors({
        general: error.response?.data?.message || 'შესვლა ვერ მოხერხდა. სცადეთ თავიდან.'
      });
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

          <form className="login-form" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-group">
              <label htmlFor="email">ელ.ფოსტა</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="შეიყვანეთ ელ.ფოსტა"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">პაროლი</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="შეიყვანეთ პაროლი"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && (
                <span className="field-error">{errors.password}</span>
              )}
            </div>

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
              {isLoading ? 'შესვლა...' : 'შესვლა'}
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