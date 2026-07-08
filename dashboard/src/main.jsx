import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const root = createRoot(document.getElementById('root'))

if (!PUBLISHABLE_KEY) {
  // Without a Clerk key the login can't render. Show a clear message instead of
  // a blank white screen so it's obvious what's missing (see CLERK_SETUP.md).
  root.render(
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0d1117', color: '#e6edf3', fontFamily: 'system-ui, sans-serif', padding: 24,
    }}>
      <div style={{
        maxWidth: 460, textAlign: 'center', background: '#161b22',
        border: '1px solid #30363d', borderRadius: 12, padding: '32px 28px',
      }}>
        <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Login isn’t configured yet</div>
        <p style={{ color: '#8b98a5', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
          The dashboard needs a Clerk publishable key to show the sign-in page.
          Set <code style={{ color: '#00d4e8' }}>VITE_CLERK_PUBLISHABLE_KEY</code> in your
          environment (Vercel → Settings → Environment Variables, or a local
          <code style={{ color: '#00d4e8' }}> dashboard/.env</code>), then reload.
        </p>
        <p style={{ color: '#6e7681', fontSize: 12, marginTop: 16, marginBottom: 0 }}>
          Full steps: dashboard/CLERK_SETUP.md
        </p>
      </div>
    </div>
  )
} else {
  root.render(
    <StrictMode>
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <App />
      </ClerkProvider>
    </StrictMode>,
  )
}
