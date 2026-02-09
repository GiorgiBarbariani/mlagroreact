import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../api/apiClient';
import './VerifyEmailPage.scss';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // Get email from state or query params
    const stateEmail = location.state?.email;
    const queryEmail = new URLSearchParams(location.search).get('email');
    const userEmail = stateEmail || queryEmail || '';
    setEmail(userEmail);

    if (!userEmail) {
      // If no email, redirect to registration
      navigate('/register');
    }
  }, [location, navigate]);

  useEffect(() => {
    // Timer for resend button
    if (resendTimer > 0) {
      const timeout = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timeout);
    }
  }, [resendTimer]);

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace
    if (e.key === 'Backspace' && !verificationCode[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const digits = pastedText.replace(/\D/g, '').slice(0, 6);

    if (digits.length > 0) {
      const newCode = [...verificationCode];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newCode[i] = digits[i];
      }
      setVerificationCode(newCode);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = verificationCode.join('');
    if (code.length !== 6) {
      setError('გთხოვთ შეიყვანოთ 6-ციფრიანი კოდი');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/verify-email', {
        email,
        code
      });

      if (response.data.success) {
        setSuccessMessage('ელ.ფოსტა წარმატებით დადასტურდა!');

        // Store token and login
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);

          // If we have user data, we can update the auth context
          // but since we're navigating away, the app will reload auth state anyway

          // Redirect to main app
          setTimeout(() => {
            window.location.href = '/app/main-menu'; // Use window.location to ensure full reload and auth check
          }, 1500);
        }
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'ვერიფიკაცია ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.post('/auth/resend-verification', { email });

      if (response.data.success) {
        setSuccessMessage('ახალი კოდი გაიგზავნა თქვენს ელ.ფოსტაზე');
        setResendTimer(60); // 60 seconds before can resend again
        setVerificationCode(['', '', '', '', '', '']);
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'კოდის გაგზავნა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-container">
        <div className="verify-card">
          <div className="verify-header">
            <h1>MLAgro</h1>
            <h2>ელ.ფოსტის დადასტურება</h2>
            <p>შეიყვანეთ 6-ციფრიანი კოდი, რომელიც გამოგზავნილია</p>
            <p className="email-display">{email}</p>
          </div>

          <form className="verify-form" onSubmit={handleSubmit}>
            {successMessage && (
              <div className="success-message">{successMessage}</div>
            )}
            {error && (
              <div className="error-message">{error}</div>
            )}

            <div className="code-input-container">
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="code-input"
                  disabled={isLoading}
                  autoComplete="off"
                />
              ))}
            </div>

            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || verificationCode.join('').length !== 6}
            >
              {isLoading ? 'დადასტურება...' : 'დადასტურება'}
            </button>
          </form>

          <div className="verify-footer">
            <p>არ მიგიღიათ კოდი?</p>
            <button
              onClick={handleResendCode}
              disabled={resendTimer > 0 || isLoading}
              className="resend-button"
            >
              {resendTimer > 0
                ? `ხელახლა გაგზავნა (${resendTimer}წ)`
                : 'ხელახლა გაგზავნა'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
