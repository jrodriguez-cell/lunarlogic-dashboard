import { useState } from 'react';
import { getSession } from './lib/auth';
import { ToastProvider } from './lib/toast';
import LoginPage from './pages/LoginPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

export default function App() {
  const [session, setSession] = useState(() => getSession());

  if (!session) {
    return <ToastProvider><LoginPage onLogin={setSession} /></ToastProvider>;
  }

  // Every signed-in profile — including admin — gets the full consolidated
  // dashboard (suite switcher, action plan, AR/AP/Full Suite).
  return <ToastProvider><ClientDashboardPage session={session} onLogout={() => setSession(null)} /></ToastProvider>;
}
