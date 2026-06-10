export function exportCSV(filename, columns, rows) {
  const header = columns.map(c => JSON.stringify(c.label)).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const raw = c.csvVal ? c.csvVal(row) : (row[c.key] ?? '');
      return JSON.stringify(String(raw));
    }).join(',')
  );
  const blob = new Blob([[header, ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
