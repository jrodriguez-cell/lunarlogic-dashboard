import { useState } from 'react';
import { login } from '../lib/auth';

const DEMO = [
  { label: 'Demo — Meridian Advisory Group', email: 'demo@lunarlogic.ai',   pw: 'Demo2026!'   },
  { label: 'Client — Forvis Mazars',         email: 'forvis@lunarlogic.ai', pw: 'Forvis2026!' },
  { label: 'Admin — LunarLogic',             email: 'admin@lunarlogic.ai',  pw: 'Admin2026!'  },
  { label: 'Sandbox — QB Integration Test',  email: 'sandbox@lunarlogic.ai',pw: 'Sandbox2026!'},
];

export default function LoginPage({ onLogin }) {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [showDemo, setShowDemo]   = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const session = login(email, password);
      if (session) { onLogin(session); }
      else { setError('Invalid email or password.'); setLoading(false); }
    }, 400);
  }

  function fillDemo(cred) {
    setEmail(cred.email);
    setPassword(cred.pw);
    setError('');
    setShowDemo(false);
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-wordmark">lunarlogic</div>
        <div className="login-subtitle">AR Client Portal</div>

        <form onSubmit={handleSubmit}>
          {error && <div className="login-error">{error}</div>}

          <div className="form-field">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@company.com"
              value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>

          <div className="form-field">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)} required />
          </div>

          <button className="login-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        {/* Demo creds — collapsed by default so they don't overshadow the form */}
        <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          <button onClick={() => setShowDemo(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
            <span style={{ fontSize: 10, transition: 'transform 0.15s', display: 'inline-block', transform: showDemo ? 'rotate(90deg)' : 'none' }}>›</span>
            Demo accounts
          </button>
          {showDemo && (
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {DEMO.map(c => (
                <button key={c.email} onClick={() => fillDemo(c)} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 10px', background: 'var(--bg)', border: '1px solid var(--border)',
                  borderRadius: 6, cursor: 'pointer', textAlign: 'left', width: '100%',
                  transition: 'border-color 0.1s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--teal)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.label}</span>
                  <code style={{ fontSize: 10, color: 'var(--teal)' }}>{c.pw}</code>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
