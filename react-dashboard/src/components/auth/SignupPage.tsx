import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Chrome,
  Lock,
  ShieldAlert,
  User,
} from 'lucide-react';

interface SignupPageProps {
  onSignupSuccess: () => void;
  onGoToLogin: () => void;
  onBack: () => void;
}

export const SignupPage: React.FC<SignupPageProps> = ({
  onSignupSuccess,
  onGoToLogin,
  onBack,
}) => {
  const [mounted, setMounted] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Enter a username and password to create a dummy account.');
      return;
    }

    setError('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    setLoading(false);
    onSignupSuccess();
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
      <div className="auth-grid" />
      <button className="auth-back-btn" onClick={onBack}>
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Welcome</span>
      </button>

      <div className="auth-card">
        <div className="auth-card-header">
          <div className="auth-shield-icon">
            <ShieldAlert className="w-6 h-6 text-sky-300" />
          </div>
          <div>
            <h2 className="auth-card-title">Request Access</h2>
            <p className="auth-card-subtitle">Create a temporary demo account</p>
          </div>
        </div>

        <div className="auth-divider" />

        <button disabled className="auth-google-btn" title="Google Auth — coming soon">
          <Chrome className="w-4 h-4" />
          <span>Continue with Google</span>
          <span className="auth-coming-tag">Coming Soon</span>
        </button>

        <div className="auth-or-row">
          <span className="auth-or-line" />
          <span className="auth-or-text">or create a demo account</span>
          <span className="auth-or-line" />
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field-group">
            <label htmlFor="signupUsername" className="auth-label">Username</label>
            <div className="auth-input-wrapper">
              <User className="auth-input-icon" />
              <input
                id="signupUsername"
                type="text"
                autoComplete="username"
                placeholder="Choose a username"
                value={username}
                onChange={(event) => { setUsername(event.target.value); setError(''); }}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-field-group">
            <label htmlFor="signupPassword" className="auth-label">Password</label>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" />
              <input
                id="signupPassword"
                type="password"
                autoComplete="new-password"
                placeholder="Choose a password"
                value={password}
                onChange={(event) => { setPassword(event.target.value); setError(''); }}
                className="auth-input"
                required
              />
            </div>
          </div>

          {error && <div className="auth-error"><span>{error}</span></div>}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? <span>Creating account...</span> : <><span>Create Demo Account</span><ArrowRight className="w-4 h-4 auth-arrow" /></>}
          </button>
        </form>

        <div className="auth-divider" />
        <div className="auth-footer-links">
          <span className="auth-footer-text">Already have access?</span>
          <button className="auth-link-btn" onClick={onGoToLogin}>Sign in</button>
        </div>
      </div>

      <style>{`
        .auth-root { min-height: 100vh; width: 100%; display: flex; align-items: center; justify-content: center; background: radial-gradient(ellipse 70% 50% at 50% -10%, rgba(75,158,218,0.09), transparent), #111d2e; padding: 24px 16px; position: relative; font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif; color: #dde5f2; }
        .auth-grid { position: absolute; inset: 0; background-image: linear-gradient(rgba(75,158,218,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(75,158,218,0.025) 1px, transparent 1px); background-size: 48px 48px; pointer-events: none; }
        .auth-back-btn { position: absolute; top: 20px; left: 24px; display: flex; align-items: center; gap: 6px; font-size: 12px; color: #5a7a9a; cursor: pointer; background: none; border: none; padding: 6px 10px; border-radius: 8px; }
        .auth-card { width: 100%; max-width: 420px; background: rgba(20,32,54,0.90); backdrop-filter: blur(32px) saturate(140%); border: 1px solid rgba(255,255,255,0.09); border-top-color: rgba(255,255,255,0.16); border-radius: 20px; padding: 28px 28px 24px; box-shadow: 0 24px 64px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.10); position: relative; z-index: 5; }
        .auth-card-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; }
        .auth-shield-icon { width: 48px; height: 48px; border-radius: 14px; background: linear-gradient(135deg, rgba(75,158,218,0.18), rgba(90,143,120,0.10)); border: 1px solid rgba(75,158,218,0.28); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .auth-card-title { font-size: 18px; font-weight: 700; color: #f0f4ff; }
        .auth-card-subtitle { font-size: 11.5px; color: #4a6a8a; margin-top: 2px; }
        .auth-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 18px 0; }
        .auth-google-btn, .auth-submit-btn { width: 100%; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 10px 16px; border-radius: 11px; }
        .auth-google-btn { background: rgba(30,44,68,0.50); border: 1px solid rgba(255,255,255,0.06); color: #3a4e66; cursor: not-allowed; }
        .auth-coming-tag { font-size: 10px; padding: 2px 8px; border-radius: 9999px; background: rgba(255,255,255,0.03); color: #2e3e52; margin-left: 4px; }
        .auth-or-row { display: flex; align-items: center; gap: 10px; margin: 14px 0; }
        .auth-or-line { flex: 1; height: 1px; background: rgba(255,255,255,0.06); }
        .auth-or-text { font-size: 11px; color: #3a5070; white-space: nowrap; }
        .auth-form { display: flex; flex-direction: column; gap: 14px; }
        .auth-field-group { display: flex; flex-direction: column; gap: 6px; }
        .auth-label { font-size: 12px; font-weight: 600; color: #7a9ab8; }
        .auth-input-wrapper { position: relative; display: flex; align-items: center; }
        .auth-input-icon { position: absolute; left: 13px; width: 15px; height: 15px; color: #3a5878; pointer-events: none; }
        .auth-input { width: 100%; background: rgba(14,22,40,0.80); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 10px 42px 10px 38px; font-size: 13.5px; color: #dde5f2; outline: none; }
        .auth-input::placeholder { color: #2e4460; }
        .auth-error { padding: 10px 12px; border-radius: 10px; background: rgba(217,95,95,0.10); border: 1px solid rgba(217,95,95,0.24); color: #f08080; font-size: 12px; }
        .auth-submit-btn { background: linear-gradient(135deg, rgba(75,158,218,0.22), rgba(90,143,120,0.16)); border: 1px solid rgba(75,158,218,0.40); color: #bfdbfe; font-size: 14px; font-weight: 600; cursor: pointer; }
        .auth-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; }
        .auth-arrow { margin-left: auto; }
        .auth-footer-links { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 12.5px; }
        .auth-footer-text { color: #3a5070; }
        .auth-link-btn { background: none; border: none; color: #7db6e0; font-size: 12.5px; font-weight: 600; cursor: pointer; padding: 0; text-decoration: underline; }
      `}</style>
    </div>
  );
};
