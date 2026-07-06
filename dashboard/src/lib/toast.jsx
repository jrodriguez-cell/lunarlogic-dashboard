import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((msg, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', gap: 8, zIndex: 9999, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: t.type === 'error' ? '#ef4444' : t.type === 'info' ? 'var(--bg-card)' : '#22c55e',
            color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)', whiteSpace: 'nowrap',
            border: t.type === 'info' ? '1px solid var(--border)' : 'none',
            animation: 'fadeInUp 0.2s ease',
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// Provider + hook intentionally co-located in this context module; the
// fast-refresh "only export components" rule doesn't apply to a hook export.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
