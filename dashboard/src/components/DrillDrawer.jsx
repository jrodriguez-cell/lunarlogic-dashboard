import { exportXLSX } from '../lib/excel';

export default function DrillDrawer({ drill, onClose }) {
  if (!drill) return null;

  const n = drill.rows?.length ?? 0;
  const subtitleText = [n + ' records', drill.subtitle].filter(Boolean).join(' · ');

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer-panel drill-drawer">
        <div className="drawer-header">
          <div>
            <div className="drawer-title">{drill.title}</div>
            <div className="drawer-sub">{subtitleText}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="drill-export-btn"
              onClick={() => exportXLSX(drill.filename, drill.title.slice(0, 31), drill.columns, drill.rows, { client: drill.client, source: drill.source })}
            >
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5.5 1v7M2.5 5.5l3 3 3-3"/>
                <path d="M1 9.5h9"/>
              </svg>
              Export Excel
            </button>
            <button className="drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {drill.source && (
          <div className="drill-source">
            <span className="drill-source-label">SOURCE</span>
            <span>{drill.source}</span>
          </div>
        )}

        <div className="drill-body">
          <div className="drill-table-wrap">
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
                      const display = c.render
                        ? c.render(val, row)
                        : (val == null ? '—' : val);
                      return <td key={c.key}>{display}</td>;
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
