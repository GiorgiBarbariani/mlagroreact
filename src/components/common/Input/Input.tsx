import React, { useState, forwardRef } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import './Input.scss';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'outlined' | 'filled';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Label text displayed above the input */
  label?: string;
  /** Error message to display below the input */
  error?: string;
  /** Helper text displayed below the input */
  helperText?: string;
  /** Icon component to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon component to display on the right side */
  rightIcon?: React.ReactNode;
  /** Size variant of the input */
  size?: InputSize;
  /** Visual style variant */
  variant?: InputVariant;
  /** Whether the input takes full width */
  fullWidth?: boolean;
  /** Whether to show password visibility toggle (only for type="password") */
  showPasswordToggle?: boolean;
  /** Additional class name for the container */
  containerClassName?: string;
  /** Whether to show required asterisk */
  required?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'outlined',
  fullWidth = true,
  showPasswordToggle = true,
  containerClassName = '',
  className = '',
  type = 'text',
  disabled = false,
  required = false,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPasswordType = type === 'password';
  const inputType = isPasswordType && showPassword ? 'text' : type;

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  const containerClasses = [
    'input-container',
    `input-container--${size}`,
    `input-container--${variant}`,
    fullWidth ? 'input-container--full-width' : '',
    error ? 'input-container--error' : '',
    disabled ? 'input-container--disabled' : '',
    isFocused ? 'input-container--focused' : '',
    containerClassName
  ].filter(Boolean).join(' ');

  const inputClasses = [
    'input-field',
    leftIcon ? 'input-field--with-left-icon' : '',
    (rightIcon || (isPasswordType && showPasswordToggle)) ? 'input-field--with-right-icon' : '',
    className
  ].filter(Boolean).join(' ');

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-label__required">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {leftIcon && (
          <span className="input-icon input-icon--left">
            {leftIcon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={inputClasses}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />

        {isPasswordType && showPasswordToggle && (
          <button
            type="button"
            className="input-icon input-icon--right input-icon--clickable"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'პაროლის დამალვა' : 'პაროლის ჩვენება'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}

        {rightIcon && !isPasswordType && (
          <span className="input-icon input-icon--right">
            {rightIcon}
          </span>
        )}

        {error && !isPasswordType && !rightIcon && (
          <span className="input-icon input-icon--right input-icon--error">
            <AlertCircle size={18} />
          </span>
        )}
      </div>

      {error && (
        <span id={`${inputId}-error`} className="input-error" role="alert">
          {error}
        </span>
      )}

      {helperText && !error && (
        <span id={`${inputId}-helper`} className="input-helper">
          {helperText}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
