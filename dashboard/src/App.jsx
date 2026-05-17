import { useState } from 'react';
import { getSession } from './lib/auth';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

export default function App() {
  const [session, setSession] = useState(() => getSession());

  if (!session) {
    return <LoginPage onLogin={setSession} />;
  }

  return <DashboardPage session={session} onLogout={() => setSession(null)} />;
}
