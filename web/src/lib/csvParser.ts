import type { FlatEntry } from './types';

/**
 * Parses raw CSV content into 28 FlatEntry items.
 */
export function parseCSV(csvContent: string): FlatEntry[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return createDefaultFlats();
  }

  // Detect delimiter: comma, semicolon, tab, pipe
  const firstLine = lines[0];
  let delimiter = ',';
  const counts = {
    ',': (firstLine.match(/,/g) || []).length,
    ';': (firstLine.match(/;/g) || []).length,
    '\t': (firstLine.match(/\t/g) || []).length,
  };
  if (counts[';'] > counts[','] && counts[';'] >= counts['\t']) {
    delimiter = ';';
  } else if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) {
    delimiter = '\t';
  }

  const parseRow = (line: string): string[] => {
    // Simple CSV parser supporting double quotes
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const rows = lines.map(parseRow);

  // Check if first row is a header
  const header = rows[0].map((c) => c.toLowerCase());
  const hasHeader = header.some(
    (c) => c.includes('id') || c.includes('byt') || c.includes('flat') || c.includes('cislo')
  );
  const dataRows = hasHeader ? rows.slice(1) : rows;

  const namesMap = new Map<number, string[]>();

  for (const row of dataRows) {
    if (row.length === 0) continue;
    const rawId = row[0];
    const match = rawId.match(/\d+/);
    if (!match) continue;
    const flatId = parseInt(match[0], 10);
    if (flatId < 1 || flatId > 28) continue;

    // Names field (row[1] or joined remaining columns)
    const rawNames = row.slice(1).join(';');
    // Split on ';' or '/'
    const parsedNames = rawNames
      .split(/[;/]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const existing = namesMap.get(flatId) || [];
    namesMap.set(flatId, existing.concat(parsedNames));
  }

  const result: FlatEntry[] = [];
  for (let fid = 1; fid <= 28; fid++) {
    const list = namesMap.get(fid) || [];
    result.push({
      id: fid,
      name1: list[0] || '',
      name2: list[1] || '',
    });
  }

  return result;
}

/**
 * Formats 28 FlatEntry items into a CSV string.
 */
export function exportToCSV(flats: FlatEntry[]): string {
  const lines = ['flat_id,names'];
  for (const f of flats) {
    const names: string[] = [];
    if (f.name1.trim()) names.push(f.name1.trim());
    if (f.name2.trim()) names.push(f.name2.trim());

    const namesStr = names.join('; ');
    // Quote if contains comma, quote, or semicolon
    const escaped = namesStr.includes(',') || namesStr.includes(';') || namesStr.includes('"')
      ? `"${namesStr.replace(/"/g, '""')}"`
      : namesStr;

    lines.push(`${f.id},${escaped}`);
  }
  return lines.join('\n');
}

/**
 * Default initial flats (based on existing October 2026 data).
 */
export function createDefaultFlats(): FlatEntry[] {
  const initialData: Record<number, [string, string]> = {
    1: ['Handlarová', ''],
    2: ['Poláškovi', ''],
    3: ['Pham', ''],
    4: ['Šlahařovi', ''],
    5: ['Fullerovi', ''],
    6: ['Dvořáčkovi', ''],
    7: ['Melicharovi', ''],
    8: ['Bílkovi', ''],
    9: ['Kvasnicovi', ''],
    10: ['Ratiborští', ''],
    11: ['Ing. Drochytka', ''],
    12: ['Lorencovi', ''],
    13: ['Kemsovi', ''],
    14: ['L. Novák', 'I. Nováková'],
    15: ['Novákovi', ''],
    16: ['Goold', ''],
    17: ['Velebovi', ''],
    18: ['Trávníčkovi', ''],
    19: ['Kočárovi', ''],
    20: ['Juránkovi', ''],
    21: ['Viktorinová', ''],
    22: ['Kostková', 'Rybecký'],
    23: ['Sperát', ''],
    24: ['Dlabajová', ''],
    25: ['Hrnčířová', ''],
    26: ['Finstrlová', ''],
    27: ['Vaculíková', ''],
    28: ['Pechová', ''],
  };

  const flats: FlatEntry[] = [];
  for (let fid = 1; fid <= 28; fid++) {
    const [name1, name2] = initialData[fid] || ['', ''];
    flats.push({ id: fid, name1, name2 });
  }
  return flats;
}
