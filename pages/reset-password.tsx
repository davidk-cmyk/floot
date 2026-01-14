import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Shield, ArrowLeft, CheckCircle2, Loader2, Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { postConfirmPasswordReset } from '../endpoints/auth/confirm-password-reset_POST.schema';
import styles from './login.module.css';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const emailFromState = (location.state as { email?: string })?.email || '';

  const [email, setEmail] = useState(emailFromState);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Password validation checks
  const passwordChecks = useMemo(() => ({
    minLength: newPassword.length >= 8,
    hasLowercase: /[a-z]/.test(newPassword),
    hasUppercase: /[A-Z]/.test(newPassword),
    hasNumber: /[0-9]/.test(newPassword),
  }), [newPassword]);

  const passwordsMatch = newPassword === confirmPassword;
  const passwordValid = passwordChecks.minLength && passwordChecks.hasLowercase && passwordChecks.hasUppercase && passwordChecks.hasNumber;
  const isFormValid = email && code.length === 6 && passwordValid && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValid) {
      setError('Password does not meet requirements');
      return;
    }

    setIsSubmitting(true);

    try {
      await postConfirmPasswordReset({ email, code, newPassword });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Password Reset Successful | MyPolicyPortal</title>
        </Helmet>
        <div className={styles.container}>
          <div className={styles.loginCard}>
            <div className={styles.header}>
              <CheckCircle2 className={styles.logoIcon} size={32} style={{ color: 'var(--success, #22c55e)' }} />
              <h1 className={styles.title}>Password Reset</h1>
              <p className={styles.subtitle}>
                Your password has been successfully reset. You can now log in with your new password.
              </p>
            </div>

            <div className={styles.formContent}>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Reset Password | MyPolicyPortal</title>
        <meta name="description" content="Enter your reset code and new password." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Shield className={styles.logoIcon} size={32} />
            <h1 className={styles.title}>Reset Password</h1>
            <p className={styles.subtitle}>
              Enter the 6-digit code from your email and choose a new password.
            </p>
          </div>

          <form onSubmit={handleSubmit} className={styles.formContent}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <label htmlFor="email" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Email Address</label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <label htmlFor="code" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Reset Code</label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="Enter 6-digit code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={isSubmitting}
                style={{ letterSpacing: '0.2em', textAlign: 'center', fontWeight: 600 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <label htmlFor="newPassword" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: 'var(--muted-foreground)',
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {newPassword && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.minLength ? 'var(--success, #22c55e)' : 'var(--muted-foreground)' }}>
                    {passwordChecks.minLength ? <Check size={12} /> : <X size={12} />}
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasLowercase ? 'var(--success, #22c55e)' : 'var(--muted-foreground)' }}>
                    {passwordChecks.hasLowercase ? <Check size={12} /> : <X size={12} />}
                    <span>One lowercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasUppercase ? 'var(--success, #22c55e)' : 'var(--muted-foreground)' }}>
                    {passwordChecks.hasUppercase ? <Check size={12} /> : <X size={12} />}
                    <span>One uppercase letter</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: passwordChecks.hasNumber ? 'var(--success, #22c55e)' : 'var(--muted-foreground)' }}>
                    {passwordChecks.hasNumber ? <Check size={12} /> : <X size={12} />}
                    <span>One number</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2)' }}>
              <label htmlFor="confirmPassword" style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--foreground)' }}>Confirm New Password</label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
              />
              {confirmPassword && !passwordsMatch && (
                <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', margin: 0 }}>
                  Passwords do not match
                </p>
              )}
            </div>

            {error && (
              <p style={{ color: 'var(--destructive)', fontSize: '0.875rem', margin: 0 }}>
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || !isFormValid} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ marginRight: 8 }} />
                  Resetting...
                </>
              ) : (
                'Reset Password'
              )}
            </Button>
          </form>

          <div className={styles.footer}>
            <p style={{ marginBottom: 'var(--spacing-2)' }}>
              <Link to="/forgot-password" className={styles.link}>
                Request a new code
              </Link>
            </p>
            <Link to="/login" className={styles.link} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPasswordPage;
