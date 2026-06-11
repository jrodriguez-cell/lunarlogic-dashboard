const CREDENTIALS = {
  'kaptainclean@demo.com': { password: 'demo2024',   name: 'Kaptain Clean LLC',      clientId: 'kaptain'      },
  'gualapack@demo.com':    { password: 'demo2024',   name: 'Gualapack',               clientId: 'gualapack'    },
  'forvismazars@demo.com': { password: 'demo2024',   name: 'Forvis Mazars',           clientId: 'forvismazars' },
  'demo@lunarlogic.ai':    { password: 'Demo2026!',  name: 'Meridian Advisory Group', clientId: 'meridian'     },
  'forvis@lunarlogic.ai':  { password: 'Forvis2026!',name: 'Forvis Mazars',           clientId: 'forvismazars' },
};

export function login(email, password) {
  const entry = CREDENTIALS[email.toLowerCase().trim()];
  if (entry && entry.password === password) {
    const session = { email, name: entry.name, clientId: entry.clientId };
    localStorage.setItem('ll_session', JSON.stringify(session));
    return session;
  }
  return null;
}

export function getSession() {
  try { return JSON.parse(localStorage.getItem('ll_session')); }
  catch { return null; }
}

export function logout() {
  localStorage.removeItem('ll_session');
}
