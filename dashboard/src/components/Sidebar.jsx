import { logout } from '../lib/auth';

const Icons = {
  overview: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1"/>
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1"/>
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1"/>
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1"/>
    </svg>
  ),
  invoices: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="2" y="1.5" width="11" height="12" rx="1.5"/>
      <path d="M4.5 5.5h6M4.5 8h6M4.5 10.5h3.5"/>
    </svg>
  ),
  customers: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <circle cx="5.5" cy="4.5" r="2.5"/>
      <path d="M0.5 13c0-2.8 2.2-5 5-5s5 2.2 5 5" opacity="0.9"/>
      <circle cx="11.5" cy="4.5" r="2" opacity="0.55"/>
      <path d="M10 13c.4-1.5 1.8-2.5 3-2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity="0.55"/>
    </svg>
  ),
  reports: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor">
      <rect x="1.5" y="9" width="3" height="4.5" rx="0.5"/>
      <rect x="6" y="5.5" width="3" height="8" rx="0.5"/>
      <rect x="10.5" y="2.5" width="3" height="11" rx="0.5"/>
      <path d="M2 6L5.5 3.5L9 5L13 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  ),
  payments: () => (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3.5" width="13" height="9" rx="1.5"/>
      <path d="M1 6.5h13"/>
      <circle cx="4" cy="9.5" r="1" fill="currentColor" stroke="none"/>
      <path d="M7 9.5h4" strokeWidth="1.5"/>
    </svg>
  ),
  logout: () => (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <path d="M5 2H2.5A1.5 1.5 0 001 3.5v7A1.5 1.5 0 002.5 12H5"/>
      <path d="M9 10l3-3-3-3M12 7H5.5"/>
    </svg>
  ),
};

const NAV_AR = [
  { key: 'overview',   label: 'Overview',   Icon: Icons.overview  },
  { key: 'invoices',   label: 'Invoices',   Icon: Icons.invoices  },
  { key: 'customers',  label: 'Customers',  Icon: Icons.customers },
  { key: 'reports',    label: 'Reports',    Icon: Icons.reports   },
];

const NAV_PAYMENTS = [
  { key: 'payments', label: 'Cash Application', Icon: Icons.payments },
];

export default function Sidebar({ activeView, onNav, session, onLogout, pendingPayments }) {
  function handleLogout() {
    logout();
    onLogout();
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-wordmark">lunarlogic</div>
        <div className="sidebar-tagline">AR Automation Platform</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">AR Dashboard</div>
        {NAV_AR.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-item${activeView === key ? ' active' : ''}`}
            onClick={() => onNav(key)}
          >
            <Icon />
            {label}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 8 }}>Payments</div>
        {NAV_PAYMENTS.map(({ key, label, Icon }) => (
          <button
            key={key}
            className={`nav-item${activeView === key ? ' active' : ''}`}
            onClick={() => onNav(key)}
          >
            <Icon />
            <span style={{ flex: 1 }}>{label}</span>
            {pendingPayments > 0 && activeView !== key && (
              <span className="nav-pending-badge">{pendingPayments}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {session && (
          <div className="client-badge">
            <div className="client-badge-label">Signed in as</div>
            <div className="client-badge-name">{session.name}</div>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          <Icons.logout />
          Sign out
        </button>
      </div>
    </aside>
  );
}
