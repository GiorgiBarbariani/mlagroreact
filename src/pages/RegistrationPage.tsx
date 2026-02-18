import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Phone, AtSign } from 'lucide-react';
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
    password: '',
    confirmPassword: '',
    phone: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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
        if (value.length < 9) return 'მინიმუმ 9 ციფრი';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Remove numbers from firstName and lastName
    let processedValue = value;
    if (name === 'firstName' || name === 'lastName') {
      processedValue = value.replace(/[0-9]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Real-time validation
    const error = validateField(name, processedValue);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const fields = ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword', 'phone'];

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

          <form className="registration-form" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}
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

              <Input
                label="ტელეფონი"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+995 5XX XXX XXX"
                leftIcon={<Phone size={18} />}
                error={errors.phone}
                required
              />
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
