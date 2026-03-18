import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, CheckCircle } from 'lucide-react';
import { apiClient } from '../api/apiClient';
import './VerifyEmailPage.scss';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    // Get email from state or query params
    const stateEmail = location.state?.email;
    const stateCompanyName = location.state?.companyName;
    const queryEmail = new URLSearchParams(location.search).get('email');
    const userEmail = stateEmail || queryEmail || '';
    setEmail(userEmail);
    if (stateCompanyName) setCompanyName(stateCompanyName);

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
        code,
        companyName
      });

      if (response.data.success) {
        setIsVerified(true);

        // Store token and companyId
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);

          // Also store companyId if available
          if (response.data.companyId) {
            localStorage.setItem('companyId', response.data.companyId);
            console.log('Company ID stored:', response.data.companyId);
          }

          // Redirect to main app after showing success
          setTimeout(() => {
            window.location.href = '/app/main-menu';
          }, 2000);
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
        setError(''); // Clear any errors
        setResendTimer(60); // 60 seconds before can resend again
        setVerificationCode(['', '', '', '', '', '']);
        // Show temporary message by using error field (we'll style it differently)
        alert('ახალი კოდი გაიგზავნა თქვენს ელ.ფოსტაზე');
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'კოდის გაგზავნა ვერ მოხერხდა');
    } finally {
      setIsLoading(false);
    }
  };

  // Show success screen after verification
  if (isVerified) {
    return (
      <div className="verify-email-page">
        <div className="verify-container">
          <div className="verify-card success-card">
            <div className="success-screen">
              <CheckCircle size={64} className="success-icon" />
              <h2>რეგისტრაცია წარმატებით დასრულდა!</h2>
              <p>თქვენ წარმატებით დარეგისტრირდით MLAgro-ზე</p>
              <div className="redirect-message">
                <Loader2 size={20} className="spinner" />
                <span>გადამისამართება...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinner" />
                  <span>მოწმდება...</span>
                </>
              ) : 'დადასტურება'}
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
