import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './RegistrationPage.scss';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    phone: ''
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

    if (!formData.name) {
      newErrors.name = 'სახელი აუცილებელია';
    }

    if (!formData.email) {
      newErrors.email = 'ელ.ფოსტა აუცილებელია';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'არასწორი ელ.ფოსტის ფორმატი';
    }

    if (!formData.password) {
      newErrors.password = 'პაროლი აუცილებელია';
    } else if (formData.password.length < 6) {
      newErrors.password = 'პაროლი უნდა იყოს მინიმუმ 6 სიმბოლო';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'გაიმეორეთ პაროლი';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'პაროლები არ ემთხვევა';
    }

    if (!formData.phone) {
      newErrors.phone = 'ტელეფონის ნომერი აუცილებელია';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        companyName: formData.companyName,
        phone: formData.phone
      });
      navigate('/app/main-menu');
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="registration-page">
      <div className="registration-container">
        <div className="registration-card">
          <div className="registration-header">
            <h1>MLAgro</h1>
            <h2>რეგისტრაცია</h2>
            <p>შექმენით ახალი ანგარიში</p>
          </div>

          <form className="registration-form" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">სახელი და გვარი *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ თქვენი სახელი"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && (
                  <span className="field-error">{errors.name}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phone">ტელეფონი *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+995 5XX XXX XXX"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span className="field-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">ელ.ფოსტა *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.ge"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && (
                <span className="field-error">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="companyName">კომპანიის დასახელება</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="კომპანიის დასახელება (არასავალდებულო)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">პაროლი *</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="მინიმუმ 6 სიმბოლო"
                  className={errors.password ? 'error' : ''}
                />
                {errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">გაიმეორეთ პაროლი *</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="გაიმეორეთ პაროლი"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                {errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" required />
                <span>ვეთანხმები <Link to="/terms">მომსახურების პირობებს</Link></span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading}
            >
              {isLoading ? 'რეგისტრაცია...' : 'რეგისტრაცია'}
            </button>
          </form>

          <div className="registration-footer">
            <p>
              უკვე გაქვთ ანგარიში?
              <Link to="/login"> შესვლა</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
