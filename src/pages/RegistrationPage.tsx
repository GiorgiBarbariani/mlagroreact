import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './RegistrationPage.scss';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = 'სახელი აუცილებელია';
    }

    if (!formData.lastName) {
      newErrors.lastName = 'გვარი აუცილებელია';
    }

    if (!formData.username) {
      newErrors.username = 'მომხმარებლის სახელი აუცილებელია';
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
      const response = await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      });

      if (response.success) {
        setSuccessMessage('რეგისტრაცია წარმატებით დასრულდა! გთხოვთ შეამოწმოთ თქვენი ელ.ფოსტა.');
        // Store email for verification page
        const userEmail = formData.email;
        // Clear form
        setFormData({
          firstName: '',
          lastName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          phone: ''
        });
        // Redirect to email verification page after 1 second
        setTimeout(() => {
          navigate('/verify-email', { state: { email: userEmail } });
        }, 1000);
      }
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.error || 'რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან.'
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
            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">სახელი *</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ სახელი"
                  className={errors.firstName ? 'error' : ''}
                />
                {errors.firstName && (
                  <span className="field-error">{errors.firstName}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">გვარი *</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="შეიყვანეთ გვარი"
                  className={errors.lastName ? 'error' : ''}
                />
                {errors.lastName && (
                  <span className="field-error">{errors.lastName}</span>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">მომხმარებლის სახელი *</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="მომხმარებლის სახელი"
                  className={errors.username ? 'error' : ''}
                />
                {errors.username && (
                  <span className="field-error">{errors.username}</span>
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
