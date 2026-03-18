import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, AtSign, Loader2, Building2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Input } from '../components/common/Input';
import './RegistrationPage.scss';

const RegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    companyName: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'firstName':
        if (!value) return 'სახელი აუცილებელია';
        if (value.length < 3) return 'მინიმუმ 3 სიმბოლო';
        return '';
      case 'lastName':
        if (!value) return 'გვარი აუცილებელია';
        if (value.length < 3) return 'მინიმუმ 3 სიმბოლო';
        return '';
      case 'username':
        if (!value) return 'მომხმარებლის სახელი აუცილებელია';
        if (value.length < 3) return 'მინიმუმ 3 სიმბოლო';
        return '';
      case 'email':
        if (!value) return 'ელ.ფოსტა აუცილებელია';
        if (!/\S+@\S+\.\S+/.test(value)) return 'არასწორი ელ.ფოსტის ფორმატი';
        return '';
      case 'companyName':
        if (!value) return 'კომპანიის დასახელება აუცილებელია';
        if (value.length < 2) return 'მინიმუმ 2 სიმბოლო';
        return '';
      case 'password':
        if (!value) return 'პაროლი აუცილებელია';
        if (value.length < 6) return 'მინიმუმ 6 სიმბოლო';
        return '';
      case 'confirmPassword':
        if (!value) return 'გაიმეორეთ პაროლი';
        if (value !== formData.password) return 'პაროლები არ ემთხვევა';
        return '';
      case 'phone':
        if (!value) return 'ტელეფონის ნომერი აუცილებელია';
        if (!value.startsWith('5')) return 'ნომერი უნდა იწყებოდეს 5-ით';
        if (value.length !== 9) return 'ნომერი უნდა იყოს 9 ციფრი';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let processedValue = value;

    // Only allow letters (Georgian and Latin) for firstName and lastName
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.replace(/[^a-zA-Zა-ჰ]/g, '');
    }

    // Phone: only allow digits, max 9 characters
    if (name === 'phone') {
      processedValue = value.replace(/[^0-9]/g, '').slice(0, 9);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Real-time validation
    const error = validateField(name, processedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const fields = ['firstName', 'lastName', 'username', 'email', 'companyName', 'password', 'confirmPassword', 'phone'];

    fields.forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

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
        companyName: formData.companyName,
        password: formData.password,
        phone: `+995${formData.phone}`
      });

      if (response.success) {
        // Store email and redirect immediately to verification page
        const userEmail = formData.email;
        navigate('/verify-email', { state: { email: userEmail, companyName: formData.companyName } });
      }
    } catch (error: any) {
      // Translate common backend errors to Georgian
      const backendError = error.response?.data?.error || error.response?.data?.message || '';
      let georgianError = 'რეგისტრაცია ვერ მოხერხდა. სცადეთ თავიდან.';

      if (backendError.toLowerCase().includes('user already exists') ||
          backendError.toLowerCase().includes('already exists')) {
        georgianError = 'მომხმარებელი უკვე არსებობს';
      } else if (backendError.toLowerCase().includes('email already') ||
                 backendError.toLowerCase().includes('email is already')) {
        georgianError = 'ელ.ფოსტა უკვე გამოყენებულია';
      } else if (backendError.toLowerCase().includes('username already') ||
                 backendError.toLowerCase().includes('username is already')) {
        georgianError = 'მომხმარებლის სახელი უკვე გამოყენებულია';
      } else if (backendError.toLowerCase().includes('phone already') ||
                 backendError.toLowerCase().includes('phone is already')) {
        georgianError = 'ტელეფონის ნომერი უკვე გამოყენებულია';
      } else if (backendError.toLowerCase().includes('invalid email')) {
        georgianError = 'არასწორი ელ.ფოსტის ფორმატი';
      } else if (backendError.toLowerCase().includes('password')) {
        georgianError = 'პაროლი არასწორია ან ძალიან სუსტია';
      } else if (backendError.toLowerCase().includes('network') ||
                 backendError.toLowerCase().includes('connection')) {
        georgianError = 'ქსელის შეცდომა. შეამოწმეთ ინტერნეტ კავშირი.';
      }

      setErrors({
        general: georgianError
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

          <form className="registration-form" onSubmit={handleSubmit} autoComplete="off">
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-row">
              <Input
                label="სახელი"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="შეიყვანეთ სახელი"
                leftIcon={<User size={18} />}
                error={errors.firstName}
                required
              />

              <Input
                label="გვარი"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="შეიყვანეთ გვარი"
                leftIcon={<User size={18} />}
                error={errors.lastName}
                required
              />
            </div>

            <div className="form-row">
              <Input
                label="მომხმარებლის სახელი"
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="მომხმარებლის სახელი"
                leftIcon={<AtSign size={18} />}
                error={errors.username}
                required
              />

              <div className="phone-input-wrapper">
                <label className="input-label">
                  ტელეფონი<span className="input-label__required">*</span>
                </label>
                <div className="phone-input-container">
                  <span className="phone-prefix">+995</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="5XX XXX XXX"
                    className={`phone-input ${errors.phone ? 'error' : ''}`}
                    required
                  />
                </div>
                {errors.phone && (
                  <span className="input-error">{errors.phone}</span>
                )}
              </div>
            </div>

            <Input
              label="ელ.ფოსტა"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.ge"
              leftIcon={<Mail size={18} />}
              error={errors.email}
              required
            />

            <Input
              label="კომპანიის დასახელება"
              type="text"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="შეიყვანეთ კომპანიის დასახელება"
              leftIcon={<Building2 size={18} />}
              error={errors.companyName}
              required
            />

            <div className="form-row">
              <Input
                label="პაროლი"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="მინიმუმ 6 სიმბოლო"
                leftIcon={<Lock size={18} />}
                error={errors.password}
                helperText={!errors.password ? "მინიმუმ 6 სიმბოლო" : undefined}
                required
                autoComplete="new-password"
              />

              <Input
                label="გაიმეორეთ პაროლი"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="გაიმეორეთ პაროლი"
                leftIcon={<Lock size={18} />}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />
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
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>რეგისტრაცია...</span>
                </>
              ) : 'რეგისტრაცია'}
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
