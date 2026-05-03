/**
 * Resolves a dot-notation key path against an object.
 * e.g. getNestedValue({ account: { name: 'Acme' } }, 'account.name') => 'Acme'
 */
function getNestedValue(obj: Record<string, any>, keyPath: string): any {
  return keyPath.split('.').reduce((current, key) => {
    if (current == null) return undefined;
    return current[key];
  }, obj);
}

/**
 * Escapes a single CSV cell value.
 * - Wraps in double-quotes if the value contains a comma, double-quote, or newline.
 * - Doubles any existing double-quotes inside the value.
 */
function escapeCsvCell(value: any): string {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Builds and triggers a browser CSV download.
 *
 * @param filename  The suggested filename (e.g. "contacts.csv")
 * @param rows      Array of plain objects to export
 * @param columns   Column definitions: { key } supports dot-notation, { label } is the header text
 */
export function downloadCsv(
  filename: string,
  rows: Record<string, any>[],
  columns: { key: string; label: string }[],
): void {
  const header = columns.map(col => escapeCsvCell(col.label)).join(',');

  const dataRows = rows.map(row =>
    columns
      .map(col => escapeCsvCell(getNestedValue(row, col.key)))
      .join(','),
  );

  const csvContent = [header, ...dataRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
