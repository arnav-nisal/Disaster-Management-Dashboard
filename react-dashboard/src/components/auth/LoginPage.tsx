import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertTriangle,
  ArrowLeft,
  Chrome,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onGoToSignup: () => void;
  onBack: () => void;
}

/* Dummy credentials */
const VALID_USERNAME = 'Admin';
const VALID_PASSWORD = 'Admin123';

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onGoToSignup,
  onBack,
}) => {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    /* Simulate network latency */
    await new Promise((r) => setTimeout(r, 900));
    setLoading(false);

    if (username === VALID_USERNAME && password === VALID_PASSWORD) {
      onLoginSuccess();
    } else {
      setError('Invalid credentials. Try username "Admin" and password "Admin123".');
      setShake(true);
      setTimeout(() => setShake(false), 600);
    }
  };

  return (
    <div
      className="auth-root"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Grid texture */}
      <div className="auth-grid" />

      {/* Back to welcome */}
      <button className="auth-back-btn" onClick={onBack}>
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Welcome</span>
      </button>

      {/* Card */}
      <div
        className="auth-card"
        style={{
          animation: shake ? 'auth-shake 0.5s ease' : 'none',
        }}
      >
        {/* Card header */}
        <div className="auth-card-header">
          <div className="auth-shield-icon">
            <ShieldAlert className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h2 className="auth-card-title">Secure Sign-In</h2>
            <p className="auth-card-subtitle">
              National Incident Command System · ICS-20
            </p>
          </div>
        </div>

        <div className="auth-divider" />

        {/* Google SSO — disabled / coming soon */}
        <button disabled className="auth-google-btn" title="Google Auth — coming soon">
          <Chrome className="w-4 h-4" />
          <span>Continue with Google</span>
          <span className="auth-coming-tag">Coming Soon</span>
        </button>

        <div className="auth-or-row">
          <span className="auth-or-line" />
          <span className="auth-or-text">or sign in with credentials</span>
          <span className="auth-or-line" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Username */}
          <div className="auth-field-group">
            <label htmlFor="loginUsername" className="auth-label">
              Username / Employee ID
            </label>
            <div className="auth-input-wrapper">
              <User className="auth-input-icon" />
              <input
                id="loginUsername"
                type="text"
                autoComplete="username"
                placeholder="e.g. Admin"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                className="auth-input"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="auth-field-group">
            <label htmlFor="loginPassword" className="auth-label">
              Password
            </label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" />
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="auth-input"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="auth-eye-btn"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="auth-error">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            id="btnLoginSubmit"
            disabled={loading}
            className="auth-submit-btn"
          >
            {loading ? (
              <>
                <span className="auth-spinner" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4 auth-arrow" />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider" />

        {/* Footer links */}
        <div className="auth-footer-links">
          <span className="auth-footer-text">Don't have an account?</span>
          <button className="auth-link-btn" onClick={onGoToSignup}>
            Request Access / Sign Up
          </button>
        </div>

        <p className="auth-disclaimer">
          <Lock className="w-3 h-3 inline mr-1 -mt-0.5" />
          Authorised access only · All sessions are logged · MHA, Govt. of India
        </p>
      </div>

      {/* Inline styles */}
      <style>{`
        .auth-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background:
            radial-gradient(ellipse 70% 50% at 50% -10%,  rgba(75,158,218,0.09),  transparent),
            radial-gradient(ellipse 55% 40% at 88%  5%,   rgba(90,143,120,0.07),  transparent),
            radial-gradient(ellipse 50% 55% at 10%  90%,  rgba(75,158,218,0.06),  transparent),
            #111d2e;
          padding: 24px 16px;
          position: relative;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          color: #dde5f2;
        }
        .auth-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(75,158,218,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(75,158,218,0.025) 1px, transparent 1px);
          background-size: 48px 48px;
          pointer-events: none;
        }
        .auth-back-btn {
          position: absolute;
          top: 20px;
          left: 24px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: #5a7a9a;
          cursor: pointer;
          background: none;
          border: none;
          padding: 6px 10px;
          border-radius: 8px;
          transition: color 0.2s, background 0.2s;
        }
        .auth-back-btn:hover {
          color: #93c5fd;
          background: rgba(75,158,218,0.08);
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: rgba(20,32,54,0.90);
          backdrop-filter: blur(32px) saturate(140%);
          -webkit-backdrop-filter: blur(32px) saturate(140%);
          border: 1px solid rgba(255,255,255,0.09);
          border-top-color: rgba(255,255,255,0.16);
          border-radius: 20px;
          padding: 28px 28px 24px;
          box-shadow:
            0 24px 64px rgba(0,0,0,0.45),
            inset 0 1px 0 rgba(255,255,255,0.10);
          position: relative;
          z-index: 5;
        }
        @keyframes auth-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-7px); }
          40%     { transform: translateX(7px); }
          60%     { transform: translateX(-5px); }
          80%     { transform: translateX(5px); }
        }
        .auth-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 20px;
        }
        .auth-shield-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, rgba(75,158,218,0.18), rgba(90,143,120,0.10));
          border: 1px solid rgba(75,158,218,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px -4px rgba(75,158,218,0.20);
          flex-shrink: 0;
        }
        .auth-card-title {
          font-size: 18px;
          font-weight: 700;
          color: #f0f4ff;
          letter-spacing: -0.01em;
        }
        .auth-card-subtitle {
          font-size: 11.5px;
          color: #4a6a8a;
          margin-top: 2px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .auth-divider {
          height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 18px 0;
        }
        /* Google button — disabled */
        .auth-google-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 11px;
          background: rgba(30,44,68,0.50);
          border: 1px solid rgba(255,255,255,0.06);
          color: #3a4e66;
          font-size: 13px;
          font-weight: 500;
          cursor: not-allowed;
          user-select: none;
        }
        .auth-coming-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          color: #2e3e52;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-left: 4px;
        }
        .auth-or-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 14px 0;
        }
        .auth-or-line {
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.06);
        }
        .auth-or-text {
          font-size: 11px;
          color: #3a5070;
          white-space: nowrap;
          font-weight: 500;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .auth-field-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .auth-label {
          font-size: 12px;
          font-weight: 600;
          color: #7a9ab8;
          letter-spacing: 0.02em;
        }
        .auth-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 13px;
          width: 15px;
          height: 15px;
          color: #3a5878;
          pointer-events: none;
        }
        .auth-input {
          width: 100%;
          background: rgba(14,22,40,0.80);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 10px 42px 10px 38px;
          font-size: 13.5px;
          color: #dde5f2;
          outline: none;
          transition: border-color 0.22s, box-shadow 0.22s;
          font-family: inherit;
        }
        .auth-input::placeholder { color: #2e4460; }
        .auth-input:focus {
          border-color: rgba(75,158,218,0.45);
          box-shadow: 0 0 0 3px rgba(75,158,218,0.10);
        }
        .auth-eye-btn {
          position: absolute;
          right: 11px;
          background: none;
          border: none;
          cursor: pointer;
          color: #3a5878;
          padding: 4px;
          border-radius: 6px;
          transition: color 0.2s;
          display: flex;
          align-items: center;
        }
        .auth-eye-btn:hover { color: #7db6e0; }
        .auth-error {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(217,95,95,0.10);
          border: 1px solid rgba(217,95,95,0.24);
          color: #f08080;
          font-size: 12px;
          line-height: 1.5;
        }
        .auth-submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          padding: 11px 20px;
          border-radius: 11px;
          background: linear-gradient(135deg, rgba(75,158,218,0.22), rgba(90,143,120,0.16));
          border: 1px solid rgba(75,158,218,0.40);
          color: #bfdbfe;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.26s cubic-bezier(0.16,1,0.3,1);
          box-shadow: 0 4px 18px -4px rgba(75,158,218,0.16);
          margin-top: 4px;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(75,158,218,0.34), rgba(90,143,120,0.24));
          border-color: rgba(75,158,218,0.62);
          color: #e0f0ff;
          box-shadow: 0 6px 24px -4px rgba(75,158,218,0.28);
          transform: translateY(-1px);
        }
        .auth-submit-btn:active:not(:disabled) { transform: translateY(0) scale(0.99); }
        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .auth-arrow {
          transition: transform 0.26s cubic-bezier(0.16,1,0.3,1);
          margin-left: auto;
        }
        .auth-submit-btn:hover:not(:disabled) .auth-arrow {
          transform: translateX(3px);
        }
        .auth-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid rgba(191,219,254,0.25);
          border-top-color: #93c5fd;
          border-radius: 50%;
          animation: auth-spin 0.75s linear infinite;
        }
        @keyframes auth-spin {
          to { transform: rotate(360deg); }
        }
        .auth-footer-links {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 12.5px;
        }
        .auth-footer-text { color: #3a5070; }
        .auth-link-btn {
          background: none;
          border: none;
          color: #7db6e0;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          transition: color 0.2s;
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .auth-link-btn:hover { color: #bfdbfe; }
        .auth-disclaimer {
          font-size: 10.5px;
          color: #2a3e54;
          text-align: center;
          margin-top: 14px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
};
