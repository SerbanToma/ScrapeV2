import React, { useState, useRef, FormEvent, ChangeEvent, MouseEvent } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register, isLoading } = useAuth();
  const hasErrorsRef = useRef(false);
  
  // Update ref when errors change
  hasErrorsRef.current = Object.keys(errors).length > 0;
  
  // Debug: Log when modal state changes
  console.log('AuthModal render:', { isOpen, mode, isSubmitting, authLoading: isLoading, hasErrors: Object.keys(errors).length > 0 });

  if (!isOpen) return null;

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
    setErrors({});
    setIsSubmitting(false);
  };

  const handleModeSwitch = (newMode: 'login' | 'register') => {
    setMode(newMode);
    resetForm();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }

    if (mode === 'register') {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      console.log('Attempting authentication...', mode); // Debug log
      
      if (mode === 'login') {
        await login({
          username: formData.username,
          password: formData.password,
        });
        console.log('Login successful, closing modal'); // Debug log
        // Only close modal on successful login
        onClose();
        resetForm();
      } else {
        await register({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });
        console.log('Registration successful, closing modal'); // Debug log
        // Only close modal on successful registration
        onClose();
        resetForm();
      }
    } catch (error: any) {
      console.log('Auth error caught, keeping modal open:', error); // Debug log
      let errorMessage = 'An error occurred';
      
      // Handle different types of errors with user-friendly messages
      if (error?.response?.status === 401) {
        errorMessage = mode === 'login' 
          ? 'Invalid username or password. Please check your credentials and try again.'
          : 'Authentication failed. Please try again.';
      } else if (error?.response?.status === 400) {
        errorMessage = error?.response?.data?.detail || 'Please check your input and try again.';
      } else if (error?.response?.status === 409) {
        errorMessage = 'This username or email is already taken. Please choose different credentials.';
      } else if (error?.response?.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (error?.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else {
        errorMessage = mode === 'login' 
          ? 'Login failed. Please check your credentials and try again.'
          : 'Registration failed. Please check your information and try again.';
      }
      
      // Set the error message and keep modal open
      setErrors({ submit: errorMessage });
      
      // Clear password field on login error for security
      if (mode === 'login') {
        setFormData((prev: any) => ({ ...prev, password: '' }));
      }
      
      // Force modal to stay open by preventing any potential close calls
      console.log('Error set, modal should stay open');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev: any) => ({ ...prev, [name]: '' }));
    }
    
    // Clear submit error when user starts typing (gives them a fresh start)
    if (errors.submit) {
      setErrors((prev: any) => ({ ...prev, submit: '' }));
    }
  };

  const handleOverlayClick = (e: MouseEvent) => {
    // Don't close modal if there are errors or if submitting
    if (Object.keys(errors).length > 0 || isSubmitting) {
      console.log('Preventing modal close due to errors or submitting state');
      return;
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
          <button 
            className={`modal-close ${Object.keys(errors).length > 0 || isSubmitting ? 'disabled' : ''}`}
            onClick={() => {
              if (Object.keys(errors).length > 0 || isSubmitting) {
                console.log('Preventing close button due to errors or submitting');
                return;
              }
              onClose();
            }}
            title={Object.keys(errors).length > 0 ? 'Please fix errors before closing' : 'Close'}
          >
            ×
          </button>
        </div>

        <div className="auth-tabs">
          <button 
            className={mode === 'login' ? 'active' : ''} 
            onClick={() => handleModeSwitch('login')}
          >
            Sign In
          </button>
          <button 
            className={mode === 'register' ? 'active' : ''} 
            onClick={() => handleModeSwitch('register')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              disabled={isSubmitting}
            />
            {errors.username && <span className="error">{errors.username}</span>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {errors.email && <span className="error">{errors.email}</span>}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              disabled={isSubmitting}
            />
            {errors.password && <span className="error">{errors.password}</span>}
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <span className="error">{errors.confirmPassword}</span>}
            </div>
          )}

          {errors.submit && (
            <div className="submit-error">
              <span className="error-icon">⚠️</span>
              <div className="error-content">
                <strong>{mode === 'login' ? 'Login Failed' : 'Registration Failed'}</strong>
                <p>{errors.submit}</p>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .modal-content {
            background: var(--navy-800);
            border-radius: 16px;
            padding: 0;
            width: 100%;
            max-width: 420px;
            border: 1px solid rgba(230, 209, 163, 0.2);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            animation: modalSlideIn 0.3s ease-out;
          }

          @keyframes modalSlideIn {
            from {
              opacity: 0;
              transform: translateY(-20px) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          .modal-header {
            padding: 24px 24px 16px;
            border-bottom: 1px solid rgba(230, 209, 163, 0.15);
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .modal-header h2 {
            margin: 0;
            color: var(--sand-200);
            font-size: 22px;
            font-weight: 600;
          }

          .modal-close {
            background: none;
            border: none;
            color: var(--sand-300);
            font-size: 24px;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            transition: background 0.2s ease;
          }

          .modal-close:hover {
            background: rgba(230, 209, 163, 0.1);
          }

          .modal-close.disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }

          .modal-close.disabled:hover {
            background: none;
          }

          .auth-tabs {
            display: flex;
            border-bottom: 1px solid rgba(230, 209, 163, 0.15);
          }

          .auth-tabs button {
            flex: 1;
            padding: 16px 24px;
            background: none;
            border: none;
            color: var(--sand-300);
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            border-bottom: 2px solid transparent;
          }

          .auth-tabs button:hover {
            background: rgba(230, 209, 163, 0.05);
            color: var(--sand-200);
          }

          .auth-tabs button.active {
            color: var(--accent);
            border-bottom-color: var(--accent);
            background: rgba(248, 231, 199, 0.05);
          }

          .auth-form {
            padding: 24px;
          }

          .form-group {
            margin-bottom: 20px;
          }

          .form-group label {
            display: block;
            margin-bottom: 6px;
            color: var(--sand-200);
            font-size: 14px;
            font-weight: 500;
          }

          .form-group input {
            width: 100%;
            padding: 12px 16px;
            border: 1.5px solid rgba(230, 209, 163, 0.25);
            border-radius: 10px;
            background: rgba(13, 37, 49, 0.6);
            color: var(--sand-200);
            font-size: 14px;
            transition: all 0.2s ease;
            box-sizing: border-box;
          }

          .form-group input:focus {
            outline: none;
            border-color: var(--accent);
            background: rgba(13, 37, 49, 0.8);
            box-shadow: 0 0 0 3px rgba(248, 231, 199, 0.1);
          }

          .form-group input::placeholder {
            color: rgba(240, 223, 191, 0.5);
          }

          .form-group input:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }

          .error {
            color: #ff7d7d;
            font-size: 12px;
            margin-top: 4px;
            display: block;
          }

          .submit-error {
            background: rgba(255, 125, 125, 0.1);
            border: 1px solid rgba(255, 125, 125, 0.3);
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
            color: #ff7d7d;
            font-size: 14px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: errorSlideIn 0.3s ease-out;
          }

          @keyframes errorSlideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .error-icon {
            font-size: 18px;
            flex-shrink: 0;
            margin-top: 2px;
          }

          .error-content {
            flex: 1;
          }

          .error-content strong {
            display: block;
            margin-bottom: 4px;
            font-weight: 600;
            color: #ff6b6b;
          }

          .error-content p {
            margin: 0;
            line-height: 1.4;
            opacity: 0.9;
          }

          .submit-button {
            width: 100%;
            padding: 14px 24px;
            background: linear-gradient(135deg, var(--sand-300), var(--sand-400));
            border: none;
            border-radius: 10px;
            color: var(--navy-900);
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 8px;
          }

          .submit-button:hover:not(:disabled) {
            background: linear-gradient(135deg, var(--sand-400), var(--accent));
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(230, 209, 163, 0.2);
          }

          .submit-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }

          @media (max-width: 480px) {
            .modal-content {
              margin: 0;
              border-radius: 12px;
            }
            
            .modal-header, .auth-form {
              padding: 20px;
            }
            
            .auth-tabs button {
              padding: 14px 20px;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
