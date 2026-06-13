import { useState } from 'react';
import { getSession } from './lib/auth';
import { ToastProvider } from './lib/toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

export default function App() {
  const [session, setSession] = useState(() => getSession());

  if (!session) {
    return <ToastProvider><LoginPage onLogin={setSession} /></ToastProvider>;
  }

  if (session.role === 'admin') {
    return <ToastProvider><DashboardPage session={session} onLogout={() => setSession(null)} /></ToastProvider>;
  }

  return <ToastProvider><ClientDashboardPage session={session} onLogout={() => setSession(null)} /></ToastProvider>;
}
