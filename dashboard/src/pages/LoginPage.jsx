import { useState } from 'react';
import { login } from '../lib/auth';

const DEMO = [
  { label: 'Demo Account (Meridian Advisory Group)', email: 'demo@lunarlogic.ai',  pw: 'Demo2026!'   },
  { label: 'Forvis Mazars',                          email: 'forvis@lunarlogic.ai', pw: 'Forvis2026!' },
];

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
        setError('Invalid email or password.');
      }
      setLoading(false);
    }, 400);
  }

  function fillDemo(cred) {
    setEmail(cred.email);
    setPassword(cred.pw);
    setError('');
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-wordmark">lunarlogic</div>
        <div className="login-subtitle">AR Client Portal — sign in to your dashboard</div>

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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="demo-creds">
          <div className="demo-creds-title">Demo accounts — click to fill</div>
          {DEMO.map(c => (
            <div key={c.email} className="demo-cred-row" onClick={() => fillDemo(c)}>
              <span>{c.label}</span>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
                <code>{c.email}</code>
                <code style={{ color: 'var(--teal)', fontSize: 9 }}>{c.pw}</code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
