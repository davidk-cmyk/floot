import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { Shield, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { postRequestPasswordReset } from '../endpoints/auth/request-password-reset_POST.schema';
import styles from './login.module.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await postRequestPasswordReset({ email });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueToReset = () => {
    navigate('/reset-password', { state: { email } });
  };

  if (success) {
    return (
      <>
        <Helmet>
          <title>Check Your Email | MyPolicyPortal</title>
        </Helmet>
        <div className={styles.container}>
          <div className={styles.loginCard}>
            <div className={styles.header}>
              <Mail className={styles.logoIcon} size={32} />
              <h1 className={styles.title}>Check Your Email</h1>
              <p className={styles.subtitle}>
                If an account exists with <strong>{email}</strong>, we've sent a 6-digit code to reset your password.
              </p>
            </div>

            <div className={styles.formContent}>
              <Button onClick={handleContinueToReset} className="w-full">
                Enter Reset Code
              </Button>
              <Button variant="ghost" onClick={() => setSuccess(false)} className="w-full">
                Try a different email
              </Button>
            </div>

            <div className={styles.footer}>
              <p>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className={styles.link}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  try again
                </button>
                .
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Forgot Password | MyPolicyPortal</title>
        <meta name="description" content="Reset your MyPolicyPortal password." />
      </Helmet>
      <div className={styles.container}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <Shield className={styles.logoIcon} size={32} />
            <h1 className={styles.title}>Forgot Password</h1>
            <p className={styles.subtitle}>
              Enter your email address and we'll send you a code to reset your password.
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

            {error && (
              <p style={{ color: 'var(--destructive)', fontSize: '0.875rem', margin: 0 }}>
                {error}
              </p>
            )}

            <Button type="submit" disabled={isSubmitting || !email} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} style={{ marginRight: 8 }} />
                  Sending...
                </>
              ) : (
                'Send Reset Code'
              )}
            </Button>
          </form>

          <div className={styles.footer}>
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

export default ForgotPasswordPage;
