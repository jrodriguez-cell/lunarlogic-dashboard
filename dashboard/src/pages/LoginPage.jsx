import { useState } from 'react';
import { login } from '../lib/auth';

const DEMO = [
  { label: 'Forvis Mazars',     email: 'forvismazars@demo.com', pw: 'demo2024' },
  { label: 'Kaptain Clean LLC', email: 'kaptainclean@demo.com', pw: 'demo2024' },
  { label: 'Gualapack',         email: 'gualapack@demo.com',    pw: 'demo2024' },
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
              <code>{c.email}</code>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 6, paddingLeft: 6 }}>
            Password: <code style={{ color: 'var(--teal)', fontFamily: 'ui-monospace, monospace', fontSize: 10 }}>demo2024</code>
          </div>
        </div>
      </div>
    </div>
  );
}
