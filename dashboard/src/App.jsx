import { SignedIn, SignedOut, useUser, useClerk } from '@clerk/clerk-react';
import { ToastProvider } from './lib/toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

// Turns the verified Clerk user into the session shape the dashboard expects.
// clientId + role come from Clerk publicMetadata, set when the user is invited
// (see dashboard/CLERK_SETUP.md) — never from anything the browser controls.
function AuthedApp() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) return null;

  const clientId = user.publicMetadata?.clientId;
  const role = user.publicMetadata?.role || 'client';
  const onLogout = () => signOut();

  // Signed in but not yet linked to a client — authenticated, not authorized.
  if (!clientId) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-subtitle">Account not linked yet</div>
          <p style={{ color: 'var(--muted)', fontSize: 13, margin: '12px 0 20px' }}>
            Your sign-in worked, but this account isn’t connected to a client
            workspace yet. Contact your LunarLogic administrator to finish setup.
          </p>
          <button className="login-btn" onClick={onLogout}>Sign out</button>
        </div>
      </div>
    );
  }

  const session = {
    email: user.primaryEmailAddress?.emailAddress || '',
    name: user.publicMetadata?.clientName || user.fullName || 'Client',
    clientId,
    role,
  };

  if (session.role === 'admin') {
    return <DashboardPage session={session} onLogout={onLogout} />;
  }
  return <ClientDashboardPage session={session} onLogout={onLogout} />;
}

export default function App() {
  return (
    <ToastProvider>
      <SignedOut>
        <LoginPage />
      </SignedOut>
      <SignedIn>
        <AuthedApp />
      </SignedIn>
    </ToastProvider>
  );
}
