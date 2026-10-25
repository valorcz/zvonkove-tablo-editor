import type {
  BadgeStyleId,
  PrintColumnOption,
  FlatEntry,
  TableauLayoutConfig,
  ColumnConfig,
} from './types';
import { getDefaultLayout } from './tableauConfig';

export interface TableauAppSettings {
  font: string;
  bold: boolean;
  badgeStyle: BadgeStyleId;
  badgeColor: string;
  showIds: boolean;
  textPaddingLeft: number;
  showCropMarks: boolean;
  showScale: boolean;
  printColumn?: PrintColumnOption;
}

export interface ParsedProjectYAML {
  settings?: Partial<TableauAppSettings>;
  layout?: Partial<TableauLayoutConfig>;
  flats?: FlatEntry[];
}

export function serializeProjectYAML(
  settings: TableauAppSettings,
  flats?: FlatEntry[],
  layout?: TableauLayoutConfig
): string {
  const activeLayout = layout || getDefaultLayout();
  const lines: string[] = [
    `# ============================================================`,
    `# Zvonkové tablo Tesla / GUARD prima – Konfigurace projektu`,
    `# ============================================================`,
    `# Tento soubor obsahuje nastavení vzhledu, geometrii tabla`,
    `# i kompletní seznam jmenovek pro všechny byty.`,
    `# Lze jej kdykoliv znovu načíst do aplikace zvonky-editor.html.`,
    ``,
    `version: 2`,
    ``,
    `# --- Typ a geometrie tabla ---`,
    `layout:`,
    `  preset: ${activeLayout.preset}`,
    `  numberingDirection: ${activeLayout.numberingDirection}`,
    `  startNumber: ${activeLayout.startNumber}`,
    `  printMode: ${activeLayout.printMode}`,
    `  columns:`,
  ];

  for (const col of activeLayout.columns) {
    lines.push(`    - id: ${col.id}`);
    lines.push(`      capacity: ${col.capacity}`);
    lines.push(`      skipTop: ${col.skipTop || 0}`);
    lines.push(`      skipBottom: ${col.skipBottom || 0}`);
  }

  lines.push(``);
  lines.push(`# --- Nastavení vzhledu a sazby ---`);
  lines.push(`settings:`);
  lines.push(`  # Písmo: TechnicNT | DIN | FiraSans | Iosevka | Futura | SystemSans`);
  lines.push(`  font: ${settings.font}`);
  lines.push(`  # Tučný řez písma (true / false)`);
  lines.push(`  bold: ${settings.bold}`);
  lines.push(`  # Zobrazit čísla bytů na štítcích (true / false)`);
  lines.push(`  showIds: ${settings.showIds}`);
  lines.push(`  # Typografický styl čísla: classic | left-block | inline-num | watermark | none`);
  lines.push(`  badgeStyle: ${settings.badgeStyle}`);
  lines.push(`  # Barva podkladu čísla (např. "#FFE6C7" broskvová, "#DBEAFE" modrá)`);
  lines.push(`  badgeColor: "${settings.badgeColor}"`);
  lines.push(`  # Odsazení textu od levého okraje v bodech (59.0 = 5mm, 88.5 = 7.5mm, 118.0 = 10mm)`);
  lines.push(`  textPaddingLeft: ${settings.textPaddingLeft}`);
  lines.push(`  # Rohové ořezové značky pro pravítko / řezačku (true / false)`);
  lines.push(`  showCropMarks: ${settings.showCropMarks}`);
  lines.push(`  # Tiskové kalibrační pravítko 100mm v dolním okraji (true / false)`);
  lines.push(`  showScale: ${settings.showScale}`);
  lines.push(`  # Rozsah tisku: all = všechny sloupce, 1 = sloupec 1, 2 = sloupec 2...`);
  lines.push(`  printColumn: ${settings.printColumn ?? 'all'}`);

  if (flats && flats.length > 0) {
    lines.push(``);
    lines.push(`# --- Seznam jmenovek pro byty ---`);
    lines.push(`apartments:`);
    for (const flat of flats) {
      const idStr = String(flat.id).padStart(2, '0');
      lines.push(`  - id: "${idStr}"`);
      if (flat.customNumber) {
        lines.push(`    customNumber: ${JSON.stringify(flat.customNumber)}`);
      }
      lines.push(`    name1: ${JSON.stringify(flat.name1 || '')}`);
      lines.push(`    name2: ${JSON.stringify(flat.name2 || '')}`);
    }
  }

  return lines.join('\n');
}

export function parseProjectYAML(text: string): ParsedProjectYAML | null {
  try {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Support JSON format if supplied
    if (trimmed.startsWith('{')) {
      const parsed = JSON.parse(trimmed);
      const settingsPart: Partial<TableauAppSettings> = {
        font: parsed.font || parsed.selectedFontId || parsed.settings?.font,
        bold: typeof parsed.bold === 'boolean' ? parsed.bold : parsed.settings?.bold,
        badgeStyle: parsed.badgeStyle || parsed.settings?.badgeStyle,
        badgeColor: parsed.badgeColor || parsed.settings?.badgeColor,
        showIds: parsed.showIds ?? parsed.settings?.showIds,
        textPaddingLeft: parsed.textPaddingLeft || parsed.settings?.textPaddingLeft,
        showCropMarks: parsed.showCropMarks ?? parsed.settings?.showCropMarks,
        showScale: parsed.showScale ?? parsed.settings?.showScale,
        printColumn: parsed.printColumn || parsed.settings?.printColumn,
      };

      const rawFlats = parsed.flats || parsed.apartments;
      let flatsPart: FlatEntry[] | undefined;
      if (Array.isArray(rawFlats)) {
        flatsPart = rawFlats.map((item: any, idx: number) => {
          const fid = Number(item.id) || idx + 1;
          let n1 = String(item.name1 || item.name || '').trim();
          let n2 = String(item.name2 || '').trim();
          if (!n2 && (n1.includes('/') || n1.includes(';'))) {
            const parts = n1.split(/[/;]/).map((s) => s.trim());
            n1 = parts[0] || '';
            n2 = parts.slice(1).join(' / ');
          }
          return {
            id: fid,
            customNumber: item.customNumber ? String(item.customNumber) : undefined,
            name1: n1,
            name2: n2,
          };
        });
      }

      return {
        settings: settingsPart,
        layout: parsed.layout,
        flats: flatsPart,
      };
    }

    // YAML line-based parsing
    const lines = trimmed.split(/\r?\n/);
    const settings: Record<string, any> = {};
    const layout: Record<string, any> = { columns: [] };
    const flats: FlatEntry[] = [];
    let currentFlat: Partial<FlatEntry> | null = null;
    let currentCol: Partial<ColumnConfig> | null = null;
    let section: 'root' | 'settings' | 'layout' | 'columns' | 'apartments' = 'root';

    for (const rawLine of lines) {
      const clean = rawLine.replace(/#.*$/, '').trimEnd();
      const trimmedLine = clean.trim();
      if (!trimmedLine) continue;

      if (trimmedLine === 'layout:') {
        section = 'layout';
        continue;
      }
      if (trimmedLine === 'columns:') {
        section = 'columns';
        continue;
      }
      if (trimmedLine === 'settings:') {
        if (currentCol && currentCol.id) {
          layout.columns.push(currentCol);
          currentCol = null;
        }
        section = 'settings';
        continue;
      }
      if (trimmedLine === 'apartments:') {
        if (currentCol && currentCol.id) {
          layout.columns.push(currentCol);
          currentCol = null;
        }
        section = 'apartments';
        continue;
      }

      if (section === 'columns') {
        if (trimmedLine.startsWith('- id:')) {
          if (currentCol && currentCol.id) {
            layout.columns.push(currentCol);
          }
          const idVal = trimmedLine.replace(/^- id:\s*/, '').replace(/["']/g, '').trim();
          currentCol = { id: parseInt(idVal, 10) || layout.columns.length + 1, capacity: 10, skipTop: 0, skipBottom: 0 };
          continue;
        }
        if (currentCol) {
          const colonIdx = trimmedLine.indexOf(':');
          if (colonIdx !== -1) {
            const key = trimmedLine.slice(0, colonIdx).trim();
            const val = parseInt(trimmedLine.slice(colonIdx + 1).trim(), 10) || 0;
            if (key === 'capacity') currentCol.capacity = val;
            else if (key === 'skipTop') currentCol.skipTop = val;
            else if (key === 'skipBottom') currentCol.skipBottom = val;
          }
        }
        continue;
      }

      if (section === 'apartments') {
        if (trimmedLine.startsWith('- id:')) {
          if (currentFlat && currentFlat.id) {
            flats.push({
              id: currentFlat.id,
              customNumber: currentFlat.customNumber,
              name1: currentFlat.name1 || '',
              name2: currentFlat.name2 || '',
            });
          }
          const idVal = trimmedLine.replace(/^- id:\s*/, '').replace(/["']/g, '').trim();
          currentFlat = { id: parseInt(idVal, 10) || flats.length + 1, name1: '', name2: '' };
          continue;
        }

        if (currentFlat) {
          const colonIdx = trimmedLine.indexOf(':');
          if (colonIdx !== -1) {
            const key = trimmedLine.slice(0, colonIdx).trim();
            let val = trimmedLine.slice(colonIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              try {
                val = JSON.parse(val);
              } catch {
                val = val.slice(1, -1);
              }
            }
            if (key === 'name1') currentFlat.name1 = val;
            else if (key === 'name2') currentFlat.name2 = val;
            else if (key === 'customNumber') currentFlat.customNumber = val;
            else if (key === 'name') {
              if (val.includes('/') || val.includes(';')) {
                const parts = val.split(/[/;]/).map((s) => s.trim());
                currentFlat.name1 = parts[0] || '';
                currentFlat.name2 = parts.slice(1).join(' / ');
              } else {
                currentFlat.name1 = val;
              }
            }
          }
        }
        continue;
      }

      if (section === 'layout') {
        const colonIdx = trimmedLine.indexOf(':');
        if (colonIdx !== -1) {
          const key = trimmedLine.slice(0, colonIdx).trim();
          let val = trimmedLine.slice(colonIdx + 1).trim().replace(/["']/g, '');
          if (key === 'startNumber') layout[key] = parseInt(val, 10) || 1;
          else layout[key] = val;
        }
        continue;
      }

      // Root or settings key-value pair
      const colonIdx = trimmedLine.indexOf(':');
      if (colonIdx !== -1) {
        const key = trimmedLine.slice(0, colonIdx).trim();
        let val = trimmedLine.slice(colonIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          try {
            val = JSON.parse(val);
          } catch {
            val = val.slice(1, -1);
          }
        }
        if (val === 'true') settings[key] = true;
        else if (val === 'false') settings[key] = false;
        else if (key === 'printColumn') {
          if (val === 'all') settings[key] = 'all';
          else if (!isNaN(Number(val)) && val !== '') settings[key] = Number(val);
          else settings[key] = 'all';
        } else if (!isNaN(Number(val)) && val !== '') settings[key] = Number(val);
        else settings[key] = val;
      }
    }

    if (currentCol && currentCol.id) {
      layout.columns.push(currentCol);
    }
    if (currentFlat && currentFlat.id) {
      flats.push({
        id: currentFlat.id,
        customNumber: currentFlat.customNumber,
        name1: currentFlat.name1 || '',
        name2: currentFlat.name2 || '',
      });
    }

    return {
      settings: Object.keys(settings).length > 0 ? (settings as Partial<TableauAppSettings>) : undefined,
      layout: layout.columns.length > 0 || layout.preset ? (layout as Partial<TableauLayoutConfig>) : undefined,
      flats: flats.length > 0 ? flats : undefined,
    };
  } catch {
    return null;
  }
}

export function serializeSettingsYAML(settings: TableauAppSettings): string {
  return serializeProjectYAML(settings);
}

export function parseSettingsYAML(text: string): Partial<TableauAppSettings> | null {
  const parsed = parseProjectYAML(text);
  return parsed ? parsed.settings || null : null;
}
