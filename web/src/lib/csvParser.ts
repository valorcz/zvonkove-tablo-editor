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
 * Default initial sample flats (fictitious Czech names).
 */
export function createDefaultFlats(): FlatEntry[] {
  const initialData: Record<number, [string, string]> = {
    1: ['Nováková', ''],
    2: ['Svobodovi', ''],
    3: ['Novotný', ''],
    4: ['Dvořákovi', ''],
    5: ['Černý', 'Černá'],
    6: ['Procházkovi', ''],
    7: ['Kučerovi', ''],
    8: ['Veselý', ''],
    9: ['Horákovi', ''],
    10: ['Němcovi', ''],
    11: ['Ing. Marek', ''],
    12: ['Pospíšilovi', ''],
    13: ['Pokorný', ''],
    14: ['J. Král', 'M. Králová'],
    15: ['Růžičkovi', ''],
    16: ['Beneš', ''],
    17: ['Fialovi', ''],
    18: ['Sedláčkovi', ''],
    19: ['Doležalovi', ''],
    20: ['Zemanovi', ''],
    21: ['Kolářová', ''],
    22: ['Navrátil', 'Čermáková'],
    23: ['Vaněk', ''],
    24: ['Urbanová', ''],
    25: ['Blažková', ''],
    26: ['Křížová', ''],
    27: ['Kovářová', ''],
    28: ['Bartošová', ''],
  };

  const flats: FlatEntry[] = [];
  for (let fid = 1; fid <= 28; fid++) {
    const [name1, name2] = initialData[fid] || ['', ''];
    flats.push({ id: fid, name1, name2 });
  }
  return flats;
}
