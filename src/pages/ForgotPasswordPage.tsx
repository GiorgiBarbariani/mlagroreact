import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import './ForgotPasswordPage.scss';

type Step = 'email' | 'code' | 'password';

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const validateEmail = () => {
    const newErrors: Record<string, string> = {};
    if (!email) {
      newErrors.email = 'ელ.ფოსტა აუცილებელია';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'არასწორი ელ.ფოსტის ფორმატი';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCode = () => {
    const fullCode = code.join('');
    const newErrors: Record<string, string> = {};
    if (fullCode.length !== 6) {
      newErrors.code = 'შეიყვანეთ 6-ნიშნა კოდი';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!password) {
      newErrors.password = 'პაროლი აუცილებელია';
    } else if (password.length < 6) {
      newErrors.password = 'პაროლი უნდა შეიცავდეს მინიმუმ 6 სიმბოლოს';
    }
    if (!confirmPassword) {
      newErrors.confirmPassword = 'გაიმეორეთ პაროლი';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'პაროლები არ ემთხვევა';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateEmail()) return;

    setIsLoading(true);
    setErrors({});
    try {
      await authService.forgotPassword(email);
      setSuccessMessage('კოდი გამოგზავნილია თქვენს ელ.ფოსტაზე');
      setResendTimer(60);
      setStep('code');
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'მოთხოვნის გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (errors.code) {
      setErrors(prev => ({ ...prev, code: '' }));
    }

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newCode = [...code];
      for (let i = 0; i < pastedData.length; i++) {
        newCode[i] = pastedData[i];
      }
      setCode(newCode);
      // Focus last filled input or last input
      const focusIndex = Math.min(pastedData.length, 5);
      codeInputRefs.current[focusIndex]?.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCode()) return;
    setSuccessMessage('');
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validatePassword()) return;

    setIsLoading(true);
    setErrors({});
    try {
      const token = code.join('');
      await authService.resetPassword(token, password);
      setSuccessMessage('პაროლი წარმატებით შეიცვალა!');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'პაროლის შეცვლა ვერ მოხერხდა. სცადეთ თავიდან.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendTimer > 0) return;

    setIsLoading(true);
    setErrors({});
    try {
      await authService.forgotPassword(email);
      setSuccessMessage('კოდი ხელახლა გამოგზავნილია');
      setResendTimer(60);
      setCode(['', '', '', '', '', '']);
    } catch (error: any) {
      setErrors({
        general: error.response?.data?.message || 'კოდის გაგზავნა ვერ მოხერხდა'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderEmailStep = () => (
    <form className="forgot-password-form" onSubmit={handleEmailSubmit}>
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="email">ელ.ფოსტა</label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors(prev => ({ ...prev, email: '' }));
          }}
          placeholder="შეიყვანეთ ელ.ფოსტა"
          className={errors.email ? 'error' : ''}
        />
        {errors.email && (
          <span className="field-error">{errors.email}</span>
        )}
      </div>

      <button
        type="submit"
        className="btn-submit"
        disabled={isLoading}
      >
        {isLoading ? 'იგზავნება...' : 'კოდის გაგზავნა'}
      </button>
    </form>
  );

  const renderCodeStep = () => (
    <form className="forgot-password-form" onSubmit={handleCodeSubmit}>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <p className="code-instruction">
        შეიყვანეთ 6-ნიშნა კოდი, რომელიც გამოგზავნილია მისამართზე: <strong>{email}</strong>
      </p>

      <div className="code-inputs">
        {code.map((digit, index) => (
          <input
            key={index}
            ref={(el) => { codeInputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleCodeChange(index, e.target.value)}
            onKeyDown={(e) => handleCodeKeyDown(index, e)}
            onPaste={index === 0 ? handleCodePaste : undefined}
            className={errors.code ? 'error' : ''}
          />
        ))}
      </div>
      {errors.code && (
        <span className="field-error center">{errors.code}</span>
      )}

      <button
        type="submit"
        className="btn-submit"
        disabled={isLoading || code.join('').length !== 6}
      >
        გაგრძელება
      </button>

      <div className="resend-section">
        <p>არ მიიღეთ კოდი?</p>
        <button
          type="button"
          className="btn-resend"
          onClick={handleResendCode}
          disabled={resendTimer > 0 || isLoading}
        >
          {resendTimer > 0 ? `ხელახლა გაგზავნა (${resendTimer}წ)` : 'ხელახლა გაგზავნა'}
        </button>
      </div>
    </form>
  );

  const renderPasswordStep = () => (
    <form className="forgot-password-form" onSubmit={handlePasswordSubmit}>
      {successMessage && (
        <div className="success-message">{successMessage}</div>
      )}
      {errors.general && (
        <div className="error-message">{errors.general}</div>
      )}

      <div className="form-group">
        <label htmlFor="password">ახალი პაროლი</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors(prev => ({ ...prev, password: '' }));
          }}
          placeholder="შეიყვანეთ ახალი პაროლი"
          className={errors.password ? 'error' : ''}
        />
        {errors.password && (
          <span className="field-error">{errors.password}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">გაიმეორეთ პაროლი</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors(prev => ({ ...prev, confirmPassword: '' }));
          }}
          placeholder="გაიმეორეთ ახალი პაროლი"
          className={errors.confirmPassword ? 'error' : ''}
        />
        {errors.confirmPassword && (
          <span className="field-error">{errors.confirmPassword}</span>
        )}
      </div>

      <button
        type="submit"
        className="btn-submit"
        disabled={isLoading}
      >
        {isLoading ? 'მიმდინარეობს...' : 'პაროლის შეცვლა'}
      </button>
    </form>
  );

  const getStepTitle = () => {
    switch (step) {
      case 'email':
        return 'პაროლის აღდგენა';
      case 'code':
        return 'კოდის დადასტურება';
      case 'password':
        return 'ახალი პაროლი';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'email':
        return 'შეიყვანეთ თქვენი ელ.ფოსტა პაროლის აღსადგენად';
      case 'code':
        return 'შეიყვანეთ დადასტურების კოდი';
      case 'password':
        return 'შეიყვანეთ თქვენი ახალი პაროლი';
    }
  };

  return (
    <div className="forgot-password-page">
      <div className="forgot-password-container">
        <div className="forgot-password-card">
          <div className="forgot-password-header">
            <h1>MLAgro</h1>
            <h2>{getStepTitle()}</h2>
            <p>{getStepDescription()}</p>

            <div className="step-indicator">
              <div className={`step ${step === 'email' ? 'active' : ''} ${['code', 'password'].includes(step) ? 'completed' : ''}`}>1</div>
              <div className="step-line"></div>
              <div className={`step ${step === 'code' ? 'active' : ''} ${step === 'password' ? 'completed' : ''}`}>2</div>
              <div className="step-line"></div>
              <div className={`step ${step === 'password' ? 'active' : ''}`}>3</div>
            </div>
          </div>

          {step === 'email' && renderEmailStep()}
          {step === 'code' && renderCodeStep()}
          {step === 'password' && renderPasswordStep()}

          <div className="forgot-password-footer">
            <p>
              გახსოვთ პაროლი?
              <Link to="/login"> შესვლა</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
