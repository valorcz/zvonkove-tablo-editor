import type {
  SlotCoordinates,
  BadgeStyleId,
  BadgeStyleOption,
  PrintColumnOption,
  FlatEntry,
  TableauPresetId,
  NumberingDirection,
  PrintLayoutMode,
  ColumnConfig,
  TableauLayoutConfig,
  SlotMapping,
  PresetDefinition,
} from './types';
import { ALL_TABLEAU_PRESETS, type HardwareSystem } from './hardwareProfiles';
import { decodeBadgeStyle, getBadgeLayoutTextMetrics } from './badgeRegistry';

// A4 Landscape 300 DPI canvas
export const SVG_VIEWBOX = '0 0 3508 2481';
export const SVG_WIDTH = 3508;
export const SVG_HEIGHT = 2481;

// 1 mm in SVG pixels (3508 / 297 mm = 11.811448)
export const PX_PER_MM = 3508.0 / 297.0;

// Tesla frame physical constants (exact 1:1)
export const COL_ORIGINS_X = [275.151, 1337.200, 2399.240];
export const SCALE_Y = 1.17231;
export const OFFSET_Y = 210.788;
export const IMAGE_SLOT_HEIGHT = 130.0;
export const IMAGE_SLOT_STEP = 160.0;
export const IMAGE_SLOT_TOP_0 = 15.5;

export const TEXT_LEFT_PADDING = 218.03;
export const DEFAULT_TEXT_PADDING_LEFT = 88.5; // ~7.5 mm from slot inner left edge
export const MAX_TEXT_WIDTH = 445.0;
export const DEFAULT_FS_SINGLE = 57.9;
export const DEFAULT_FS_DOUBLE = 48.0;
export const MIN_FONT_SIZE = 24.0;
export const WARNING_FONT_SIZE_THRESHOLD = 30.0;

export const BADGE_WIDTH = 62.0;
export const BADGE_HEIGHT = 54.0;
export const BADGE_RX = 8.0;
export const DEFAULT_BADGE_FILL = '#FFE6C7';
export const BADGE_FONT_SIZE = 38.0;
export const BADGE_OFFSET_X = 650.0;
export const BADGE_TOP_OFFSET_Y = 0.0;

export const BADGE_STYLES: BadgeStyleOption[] = [
  {
    id: 'classic',
    label: 'Klasický štítek (kontrastní badge)',
    description: 'Zaoblený barevný obdélníček s číslem bytu vpravo',
  },
  {
    id: 'outline',
    label: 'Obrysový rámeček (jemná linka)',
    description: 'Jemný obrysový rámeček v barvě akcentu bez plné výplně',
  },
  {
    id: 'circle',
    label: 'Kruhový medailon (geometrický kruh)',
    description: 'Geometrický kruh vpravo ve stylu moderní orientační grafiky',
  },
  {
    id: 'left-block',
    label: 'Architektonický blok (plná výška vlevo)',
    description: 'Barevný blok přes celou výšku štítku s výrazným číslem a linkou',
  },
  {
    id: 'corner-index',
    label: 'Decentní horní index (v pravém rohu)',
    description: 'Malé číslo v pravém horním rohu, uvolňuje střed pro dlouhá jména',
  },
  {
    id: 'inline-num',
    label: 'Čistá typografie (číslo vpravo bez rámečku)',
    description: 'Typografické číslo bytu vpravo bez jakéhokoliv rámečku či podkladu',
  },
  {
    id: 'watermark',
    label: 'Jemný vodoznak (v pozadí)',
    description: 'Velké decentní číslo v pozadí (25% krytí), text prochází v popředí',
  },
  {
    id: 'none',
    label: 'Bez čísel bytů (pouze jména)',
    description: 'Čisté jmenovky bez čísel bytů s maximálním prostorem pro text',
  },
];

// --- Tableau Presets (Loaded from hardwareProfiles.yaml) ---
export const TABLEAU_PRESETS: PresetDefinition[] = ALL_TABLEAU_PRESETS;

export function getDefaultLayout(): TableauLayoutConfig {
  const p = TABLEAU_PRESETS[0];
  return {
    preset: p.id,
    columns: JSON.parse(JSON.stringify(p.columns)),
    numberingDirection: p.numberingDirection,
    startNumber: p.startNumber,
    printMode: p.printMode,
  };
}

export function getTotalSlots(layout: TableauLayoutConfig): number {
  return layout.columns.reduce(
    (sum, col) => sum + Math.max(0, col.capacity - (col.skipTop || 0) - (col.skipBottom || 0)),
    0
  );
}

export function computeSlotMapping(layout: TableauLayoutConfig): SlotMapping[] {
  const totalSlots = getTotalSlots(layout);
  const padLen = totalSlots >= 100 ? 3 : 2;
  const mappings: SlotMapping[] = [];

  if (layout.numberingDirection === 'row-left-right') {
    const maxCapacity = Math.max(...layout.columns.map((c) => c.capacity), 10);
    let num = layout.startNumber;
    let slotIdx = 1;
    for (let r = 0; r < maxCapacity; r++) {
      for (let c = 0; c < layout.columns.length; c++) {
        const col = layout.columns[c];
        const skipTop = col.skipTop || 0;
        const skipBottom = col.skipBottom || 0;
        if (r >= skipTop && r < col.capacity - skipBottom) {
          mappings.push({
            slotIndex: slotIdx++,
            colIndex: c,
            rowIndex: r,
            defaultNumber: String(num++).padStart(padLen, '0'),
          });
        }
      }
    }
  } else if (layout.numberingDirection === 'top-down') {
    let num = layout.startNumber;
    let slotIdx = 1;
    for (let c = 0; c < layout.columns.length; c++) {
      const col = layout.columns[c];
      const skipTop = col.skipTop || 0;
      const skipBottom = col.skipBottom || 0;
      for (let r = skipTop; r < col.capacity - skipBottom; r++) {
        mappings.push({
          slotIndex: slotIdx++,
          colIndex: c,
          rowIndex: r,
          defaultNumber: String(num++).padStart(padLen, '0'),
        });
      }
    }
  } else {
    // Default: 'bottom-up' (Tesla classic)
    let num = layout.startNumber;
    let slotIdx = 1;
    for (let c = 0; c < layout.columns.length; c++) {
      const col = layout.columns[c];
      const skipTop = col.skipTop || 0;
      const skipBottom = col.skipBottom || 0;
      for (let r = col.capacity - 1 - skipBottom; r >= skipTop; r--) {
        mappings.push({
          slotIndex: slotIdx++,
          colIndex: c,
          rowIndex: r,
          defaultNumber: String(num++).padStart(padLen, '0'),
        });
      }
    }
  }

  mappings.sort((a, b) => a.slotIndex - b.slotIndex);
  return mappings;
}

export function computeColumnOrigins(layout: TableauLayoutConfig): number[] {
  const numCols = layout.columns.length;
  const colWidth = 621.0 * 1.17229; // ~728.0 px

  if (layout.printMode === 'compact-strips') {
    const gap = 60.0;
    const totalW = numCols * colWidth + (numCols - 1) * gap;
    const startX = Math.max(60.0, (SVG_WIDTH - totalW) / 2.0);
    return Array.from({ length: numCols }, (_, i) => startX + i * (colWidth + gap));
  }

  // 'frame-1to1' mode
  if (numCols === 1) {
    return [(SVG_WIDTH - colWidth) / 2.0];
  }
  if (numCols === 2) {
    const gap = 334.0;
    const totalW = 2 * colWidth + gap;
    const startX = (SVG_WIDTH - totalW) / 2.0;
    return [startX, startX + colWidth + gap];
  }
  if (numCols === 3) {
    return [275.151, 1337.200, 2399.240];
  }

  const gap = 60.0;
  const totalW = numCols * colWidth + (numCols - 1) * gap;
  const startX = Math.max(60.0, (SVG_WIDTH - totalW) / 2.0);
  return Array.from({ length: numCols }, (_, i) => startX + i * (colWidth + gap));
}

export function getStyleMetrics(
  styleId: BadgeStyleId,
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): {
  textLeftPadding: number;
  maxTextWidth: number;
} {
  const { position, shape } = decodeBadgeStyle(styleId);
  const metrics = getBadgeLayoutTextMetrics(
    position,
    shape,
    0,
    0,
    152.4,
    703.96,
    textPaddingLeft
  );
  return {
    textLeftPadding: metrics.textX,
    maxTextWidth: Math.max(250.0, metrics.maxTextWidth),
  };
}

export interface FontOption {
  id: string;
  label: string;
  fontFamily: string;
  charWidthFactor: number;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'TechnicNT',
    label: 'Technic NT (MUNI FI technické písmo)',
    fontFamily: "'Technic NT', sans-serif",
    charWidthFactor: 0.50,
  },
  {
    id: 'DIN',
    label: 'DIN 1451 / Bahnschrift',
    fontFamily: "'DINish', 'Bahnschrift', 'DIN Alternate', 'DIN 1451 Mittelschrift', sans-serif",
    charWidthFactor: 0.48,
  },
  {
    id: 'FiraSans',
    label: 'Fira Sans Condensed',
    fontFamily: "'Fira Sans Condensed', sans-serif",
    charWidthFactor: 0.49,
  },
  {
    id: 'Iosevka',
    label: 'Iosevka (strojopis / monospace)',
    fontFamily: "'Iosevka-Semibold', 'Iosevka', monospace",
    charWidthFactor: 0.50,
  },
  {
    id: 'Futura',
    label: 'Futura (geometrický sans)',
    fontFamily: "'Futura', 'Futura-Medium', 'Century Gothic', 'Trebuchet MS', sans-serif",
    charWidthFactor: 0.54,
  },
  {
    id: 'SystemSans',
    label: 'Systémový Sans-Serif',
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    charWidthFactor: 0.52,
  },
];

export {
  serializeProjectYAML,
  parseProjectYAML,
  serializeSettingsYAML,
  parseSettingsYAML,
  type TableauAppSettings,
  type ParsedProjectYAML,
} from './yamlProject';

export function flatIdToSlot(
  flatId: number,
  layout?: TableauLayoutConfig
): { col: number; row: number } {
  if (layout) {
    const mappings = computeSlotMapping(layout);
    const m = mappings.find((item) => item.slotIndex === flatId);
    if (m) return { col: m.colIndex, row: m.rowIndex };
  }
  const col = Math.floor((flatId - 1) / 10);
  const row = (col + 1) * 10 - flatId;
  return { col, row };
}

export function getWatermarkStyle(badgeColor: string): { fill: string; opacity: number } {
  if (badgeColor.toUpperCase() === '#FFFFFF') {
    return { fill: '#64748b', opacity: 0.28 };
  }
  let r = 0, g = 0, b = 0;
  const hex = badgeColor.replace('#', '');
  if (hex.length === 6) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  }
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const opacity = Math.min(0.85, Math.max(0.25, Math.round((0.20 + lum * 0.65) * 100) / 100));
  return { fill: badgeColor, opacity };
}

export function getSlotCoordinates(
  col: number,
  row: number,
  styleId: BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT,
  colOrigins: number[] = COL_ORIGINS_X,
  system?: HardwareSystem
): SlotCoordinates {
  const btnPlacement = system?.module?.button?.placement || 'left';
  const btnWidthPx = (system?.module?.button?.widthMm || 10.97) * PX_PER_MM;
  const slotWidthPx = (system?.slot?.widthMm || 48.63) * PX_PER_MM;
  const slotStepPx = (system?.module?.slotStepMm || 15.88) * PX_PER_MM;
  const slotHeightPx = (system?.slot?.heightMm || 12.90) * PX_PER_MM;

  const slotTop = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y) + row * slotStepPx;
  const slotBottom = slotTop + slotHeightPx;
  const slotCenterY = (slotTop + slotBottom) / 2.0;
  const colX = colOrigins[col] !== undefined ? colOrigins[col] : (COL_ORIGINS_X[col] || 275.151);

  const slotLeft = btnPlacement === 'left' ? colX + btnWidthPx : colX;
  const slotRight = slotLeft + slotWidthPx;

  const { position, shape } = decodeBadgeStyle(styleId);
  const metrics = getBadgeLayoutTextMetrics(
    position,
    shape,
    colX,
    slotTop,
    slotBottom,
    slotRight,
    textPaddingLeft,
    slotLeft
  );

  return {
    col,
    row,
    colX,
    textX: metrics.textX,
    slotTop,
    slotBottom,
    slotCenterY,
    badgeCx: metrics.badgeCx,
    badgeCy: metrics.badgeCy,
  };
}

let canvasCtx: CanvasRenderingContext2D | null = null;
function getCanvasContext(): CanvasRenderingContext2D | null {
  if (canvasCtx) return canvasCtx;
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvasCtx = canvas.getContext('2d');
  }
  return canvasCtx;
}

export function measureTextWidth(
  text: string,
  fontSize: number,
  fontOption: FontOption,
  isBold = true
): number {
  const weight = isBold ? (fontOption.id === 'Iosevka' ? 600 : 700) : 400;
  const ctx = getCanvasContext();
  if (ctx) {
    ctx.font = `${weight} ${fontSize}px ${fontOption.fontFamily}`;
    const measured = ctx.measureText(text).width;
    if (measured > 0) return measured;
  }
  const factor = isBold ? fontOption.charWidthFactor : fontOption.charWidthFactor * 0.96;
  return text.length * (fontSize * factor);
}

export function calculateFontSize(
  names: string[],
  fontOption: FontOption,
  isBold = true,
  styleId: BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): number {
  const isTwoLines = names.length > 1;
  const defaultSize = isTwoLines ? DEFAULT_FS_DOUBLE : DEFAULT_FS_SINGLE;
  const { maxTextWidth } = getStyleMetrics(styleId, textPaddingLeft);

  let longestName = '';
  for (const n of names) {
    if (n.length > longestName.length) {
      longestName = n;
    }
  }

  if (!longestName) return defaultSize;

  const currentWidth = measureTextWidth(longestName, defaultSize, fontOption, isBold);
  if (currentWidth <= maxTextWidth) {
    return defaultSize;
  }

  const scaled = defaultSize * (maxTextWidth / currentWidth);
  return Math.max(MIN_FONT_SIZE, Math.round(scaled * 10) / 10);
}

export function checkFitStatus(
  names: string[],
  fontOption: FontOption,
  isBold = true,
  styleId: BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): 'ok' | 'tight' | 'overflow' {
  const filtered = names.filter((n) => n.trim().length > 0);
  if (filtered.length === 0) return 'ok';

  const isTwoLines = filtered.length > 1;
  const defaultSize = isTwoLines ? DEFAULT_FS_DOUBLE : DEFAULT_FS_SINGLE;
  const fs = calculateFontSize(filtered, fontOption, isBold, styleId, textPaddingLeft);

  const { maxTextWidth } = getStyleMetrics(styleId, textPaddingLeft);
  let maxW = 0;
  for (const n of filtered) {
    const w = measureTextWidth(n, fs, fontOption, isBold);
    if (w > maxW) maxW = w;
  }

  if (maxW > maxTextWidth + 1.0) {
    return 'overflow';
  }
  if (fs < defaultSize - 2.0) {
    return 'tight';
  }
  return 'ok';
}
