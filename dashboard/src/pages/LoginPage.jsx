import { useState } from 'react';
import { login } from '../lib/auth';

export default function LoginPage({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const session = login(email, password);
      if (session) {
        onLogin(session);
      } else {
        setError('Invalid email or password. Contact your LunarLogic representative for access.');
      }
      setLoading(false);
    }, 400);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo-row">
          <svg className="login-logo-icon" width="28" height="28" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="13" stroke="var(--teal)" strokeWidth="1.5" opacity="0.4"/>
            <path d="M14 4 A10 10 0 0 1 24 14" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="14" cy="14" r="3.5" fill="var(--teal)" opacity="0.9"/>
            <circle cx="14" cy="14" r="1.5" fill="var(--bg)"/>
          </svg>
          <div className="login-wordmark">lunarlogic</div>
        </div>

        <div className="login-portal-badge">Client Portal</div>
        <div className="login-subtitle">Sign in to access your AR dashboard</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="login-help">
          Need access? Email&nbsp;
          <a href="mailto:jrodriguez@lunarlogic.ai" className="login-help-link">
            jrodriguez@lunarlogic.ai
          </a>
        </div>
      </div>
    </div>
  );
}
