import { exportXLSX } from '../lib/excel';
import { exportCSV } from '../lib/csv';
import { useMobile } from '../lib/useMobile';

export default function DrillDrawer({ drill, onClose }) {
  const isMobile = useMobile();
  if (!drill) return null;

  const n = drill.rows?.length ?? 0;
  const subtitleText = [n + ' records', drill.subtitle].filter(Boolean).join(' · ');

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel drill-drawer">
        <div className="drawer-header" style={{ padding: isMobile ? '14px 16px' : '20px 24px' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="drawer-title" style={{ fontSize: isMobile ? 14 : 16 }}>{drill.title}</div>
            <div className="drawer-sub" style={{ fontSize: isMobile ? 11 : 12 }}>{subtitleText}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
            {isMobile ? (
              <button
                className="drill-export-btn"
                onClick={() => exportCSV(`${drill.filename}.csv`, drill.columns, drill.rows)}
                style={{ padding: '8px 12px', fontSize: 11 }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
                </svg>
                Export CSV
              </button>
            ) : (
              <>
                <button className="drill-export-btn" onClick={() => exportCSV(`${drill.filename}.csv`, drill.columns, drill.rows)}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
                  </svg>
                  Export CSV
                </button>
                <button className="drill-export-btn" onClick={() => exportXLSX(drill.filename, drill.title.slice(0, 31), drill.columns, drill.rows, { client: drill.client, source: drill.source })}>
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/><path d="M1 9.5h9"/>
                  </svg>
                  Export Excel
                </button>
              </>
            )}
            <button
              className="drawer-close"
              onClick={onClose}
              style={{ width: isMobile ? 40 : 28, height: isMobile ? 40 : 28, fontSize: isMobile ? 16 : 14 }}
            >
              ✕
            </button>
          </div>
        </div>

        {drill.source && (
          <div className="drill-source" style={{ margin: isMobile ? '0 16px 14px' : '0 24px 16px', fontSize: 11 }}>
            <span className="drill-source-label">SOURCE</span>
            <span>{drill.source}</span>
          </div>
        )}

        <div className="drill-body">
          <div className="drill-table-wrap" style={{ padding: isMobile ? '0 16px' : '0 24px' }}>
            <table className="drill-table">
              <thead>
                <tr>
                  {drill.columns.map(c => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drill.rows.map((row, i) => (
                  <tr key={i}>
                    {drill.columns.map(c => {
                      const val = row[c.key];
                      const display = c.render ? c.render(val, row) : (val == null ? '—' : val);
                      return (
                        <td key={c.key} style={isMobile ? { whiteSpace: 'normal', wordBreak: 'break-word', fontSize: 11 } : {}}>
                          {display}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
