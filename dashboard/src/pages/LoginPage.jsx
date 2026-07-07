import { SignIn } from '@clerk/clerk-react';

// Clerk owns the actual credential handling (password, magic link, reset, MFA,
// lockout). We keep the LunarLogic wordmark + dark shell around it so the sign-in
// still feels like the product, not a generic auth page.
const clerkAppearance = {
  variables: {
    colorPrimary: '#00d4e8',
    colorBackground: 'transparent',
    colorText: '#e6edf3',
    colorTextSecondary: '#8b98a5',
    colorInputBackground: '#0d1117',
    colorInputText: '#e6edf3',
    borderRadius: '8px',
    fontFamily: 'inherit',
  },
  elements: {
    rootBox: { width: '100%' },
    card: { background: 'transparent', boxShadow: 'none', border: 'none', padding: 0 },
    header: { display: 'none' },
    footer: { display: 'none' },
    socialButtonsBlockButton: { borderColor: 'var(--border)' },
    formButtonPrimary: {
      background: 'linear-gradient(135deg, #60A5FA, #818CF8)',
      fontSize: '14px',
      textTransform: 'none',
    },
  },
};

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-wordmark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="url(#moonGradientLogin)">
            <defs>
              <linearGradient id="moonGradientLogin" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
          </svg>
          <span className="sidebar-wordmark-name"><span className="sidebar-wordmark-text">lunarlogic</span><span className="sidebar-wordmark-suffix">.ai</span></span>
        </div>
        <div className="login-subtitle">AR Client Portal</div>

        <SignIn routing="virtual" appearance={clerkAppearance} />
      </div>
    </div>
  );
}
