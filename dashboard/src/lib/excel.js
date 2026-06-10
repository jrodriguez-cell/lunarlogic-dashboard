import * as XLSX from 'xlsx';

export function exportXLSX(filename, sheetName, columns, rows, meta = {}) {
  const wb = XLSX.utils.book_new();

  // metadata rows at top
  const metaRows = [
    ['Report', sheetName],
    ['Client', meta.client || ''],
    ['Generated', new Date().toLocaleString('en-US')],
    ['Source', meta.source || ''],
    [],
  ];

  const header = columns.map(c => c.label);
  const dataRows = rows.map(row =>
    columns.map(c => {
      if (c.xlsxVal) return c.xlsxVal(row);
      const v = row[c.key];
      return v ?? '';
    })
  );

  const wsData = [...metaRows, header, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // column widths
  ws['!cols'] = columns.map(c => ({ wch: Math.max(c.label.length, 14) }));

  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename.endsWith('.xlsx') ? filename : filename + '.xlsx');
}
