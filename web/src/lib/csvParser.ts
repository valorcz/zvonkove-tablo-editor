import type { FlatEntry } from './types';

const SAMPLE_SURNAMES: [string, string][] = [
  ['Nováková', ''],
  ['Svobodovi', ''],
  ['Novotný', ''],
  ['Dvořákovi', ''],
  ['Černý', 'Černá'],
  ['Procházkovi', ''],
  ['Kučerovi', ''],
  ['Veselý', ''],
  ['Horákovi', ''],
  ['Němcovi', ''],
  ['Ing. Marek', ''],
  ['Pospíšilovi', ''],
  ['Pokorný', ''],
  ['J. Král', 'M. Králová'],
  ['Růžičkovi', ''],
  ['Beneš', ''],
  ['Fialovi', ''],
  ['Sedláčkovi', ''],
  ['Doležalovi', ''],
  ['Zemanovi', ''],
  ['Kolářová', ''],
  ['Navrátil', 'Čermáková'],
  ['Vaněk', ''],
  ['Urbanová', ''],
  ['Blažková', ''],
  ['Křížová', ''],
  ['Kovářová', ''],
  ['Bartošová', ''],
  ['Vlčkovi', ''],
  ['Polákovi', ''],
  ['Kopecký', ''],
  ['Konečný', ''],
  ['Malý', ''],
  ['Holubovi', ''],
  ['Staněk', ''],
  ['Štěpánkovi', ''],
  ['Kadlec', ''],
  ['Dostálová', ''],
  ['Soukup', ''],
  ['Marešovi', ''],
];

/**
 * Creates default initial flats with fictitious Czech names up to specified count.
 */
export function createDefaultFlats(count = 28): FlatEntry[] {
  const flats: FlatEntry[] = [];
  for (let fid = 1; fid <= count; fid++) {
    const idx = (fid - 1) % SAMPLE_SURNAMES.length;
    const [name1, name2] = SAMPLE_SURNAMES[idx] || ['', ''];
    flats.push({ id: fid, name1, name2 });
  }
  return flats;
}

/**
 * Parses raw CSV content into FlatEntry items.
 */
export function parseCSV(csvContent: string, expectedCount = 28): FlatEntry[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return createDefaultFlats(expectedCount);
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

  const namesMap = new Map<number, { names: string[]; customNumber?: string }>();
  let maxFoundId = 0;

  for (let rIdx = 0; rIdx < dataRows.length; rIdx++) {
    const row = dataRows[rIdx];
    if (row.length === 0) continue;
    const rawId = row[0];
    const match = rawId.match(/\d+/);
    const flatId = match ? parseInt(match[0], 10) : rIdx + 1;
    if (flatId > maxFoundId) maxFoundId = flatId;

    // Names field (row[1] or joined remaining columns)
    const rawNames = row.slice(1).join(';');
    // Split on ';' or '/'
    const parsedNames = rawNames
      .split(/[;/]/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    const existing = namesMap.get(flatId)?.names || [];
    const customNumber = match ? undefined : (rawId || undefined);
    namesMap.set(flatId, { names: existing.concat(parsedNames), customNumber });
  }

  const finalCount = Math.max(expectedCount, maxFoundId);
  const result: FlatEntry[] = [];
  for (let fid = 1; fid <= finalCount; fid++) {
    const entry = namesMap.get(fid);
    result.push({
      id: fid,
      customNumber: entry?.customNumber,
      name1: entry?.names[0] || '',
      name2: entry?.names[1] || '',
    });
  }

  return result;
}

/**
 * Formats FlatEntry items into a CSV string.
 */
export function exportToCSV(flats: FlatEntry[]): string {
  const lines = ['flat_id,names'];
  for (const f of flats) {
    const names: string[] = [];
    if (f.name1.trim()) names.push(f.name1.trim());
    if (f.name2.trim()) names.push(f.name2.trim());

    const namesStr = names.join('; ');
    const escaped = namesStr.includes(',') || namesStr.includes(';') || namesStr.includes('"')
      ? `"${namesStr.replace(/"/g, '""')}"`
      : namesStr;

    const idLabel = f.customNumber || f.id;
    lines.push(`${idLabel},${escaped}`);
  }
  return lines.join('\n');
}
