import { useState } from 'react';
import { getSession } from './lib/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

export default function App() {
  const [session, setSession] = useState(() => getSession());

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  if (session.role === 'admin') {
    return <DashboardPage session={session} onLogout={() => setSession(null)} />;
  }

  return <ClientDashboardPage session={session} onLogout={() => setSession(null)} />;
}
