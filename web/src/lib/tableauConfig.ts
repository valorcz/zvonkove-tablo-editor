import type { SlotCoordinates, BadgeStyleId, BadgeStyleOption } from './types';

// A4 Landscape 300 DPI canvas
export const SVG_VIEWBOX = '0 0 3508 2481';
export const SVG_WIDTH = 3508;
export const SVG_HEIGHT = 2481;

// 1 mm in SVG pixels (3508 / 297 mm = 11.811448)
export const PX_PER_MM = 3508.0 / 297.0;

// Grid & physical layout constants
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

export const BADGE_WIDTH = 60.0;
export const BADGE_HEIGHT = 54.0;
export const BADGE_RX = 10.0;
export const DEFAULT_BADGE_FILL = '#FFE6C7';
export const BADGE_FONT_SIZE = 40.6;
export const BADGE_OFFSET_X = 671.1;
export const BADGE_TOP_OFFSET_Y = 36.0;

export const BADGE_STYLES: BadgeStyleOption[] = [
  {
    id: 'classic',
    label: 'Klasický štítek (kontrastní badge)',
    description: 'Zaoblený barevný obdélníček s číslem bytu vpravo',
  },
  {
    id: 'left-block',
    label: 'Architektonický blok (plná výška vlevo)',
    description: 'Barevný blok přes celou výšku štítku s výrazným číslem a linkou',
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

export function getStyleMetrics(
  styleId: BadgeStyleId,
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): {
  textLeftPadding: number;
  maxTextWidth: number;
} {
  const slotLeft = 129.54;
  const slotRight = 703.96;

  switch (styleId) {
    case 'left-block': {
      const blockWidth = 76.0;
      const textGap = Math.max(16.0, textPaddingLeft * 0.35);
      const startX = slotLeft + blockWidth + textGap;
      const maxWidth = Math.max(250.0, slotRight - 20.0 - startX);
      return { textLeftPadding: startX, maxTextWidth: maxWidth };
    }
    case 'inline-num': {
      const startX = slotLeft + textPaddingLeft;
      const rightLimit = slotRight - 75.0; // reserve 75px for number and clearance
      const maxWidth = Math.max(250.0, rightLimit - startX);
      return { textLeftPadding: startX, maxTextWidth: maxWidth };
    }
    case 'watermark': {
      const startX = slotLeft + textPaddingLeft;
      const maxWidth = Math.max(250.0, slotRight - 20.0 - startX);
      return { textLeftPadding: startX, maxTextWidth: maxWidth };
    }
    case 'none': {
      const startX = slotLeft + textPaddingLeft;
      const maxWidth = Math.max(250.0, slotRight - 20.0 - startX);
      return { textLeftPadding: startX, maxTextWidth: maxWidth };
    }
    case 'classic':
    default: {
      const startX = slotLeft + textPaddingLeft;
      const rightLimit = slotRight - 92.0; // reserve space for 60px badge + 32px margins
      const maxWidth = Math.max(250.0, rightLimit - startX);
      return { textLeftPadding: startX, maxTextWidth: maxWidth };
    }
  }
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

export function flatIdToSlot(flatId: number): { col: number; row: number } {
  const col = Math.floor((flatId - 1) / 10);
  const row = (col + 1) * 10 - flatId;
  return { col, row };
}

export function getSlotCoordinates(
  col: number,
  row: number,
  styleId: BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): SlotCoordinates {
  const slotTop = (IMAGE_SLOT_TOP_0 + row * IMAGE_SLOT_STEP) * SCALE_Y + OFFSET_Y;
  const slotBottom = slotTop + IMAGE_SLOT_HEIGHT * SCALE_Y;
  const slotCenterY = (slotTop + slotBottom) / 2.0;
  const colX = COL_ORIGINS_X[col];
  const { textLeftPadding } = getStyleMetrics(styleId, textPaddingLeft);
  const textX = colX + textLeftPadding;

  return {
    col,
    row,
    colX,
    textX,
    slotTop,
    slotBottom,
    slotCenterY,
    badgeCx: colX + BADGE_OFFSET_X,
    badgeCy: slotTop + BADGE_TOP_OFFSET_Y,
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
  maxWidthOrStyle: number | BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): number {
  const maxWidth =
    typeof maxWidthOrStyle === 'number'
      ? maxWidthOrStyle
      : getStyleMetrics(maxWidthOrStyle, textPaddingLeft).maxTextWidth;

  const isDouble = names.length > 1;
  const baseFs = isDouble ? DEFAULT_FS_DOUBLE : DEFAULT_FS_SINGLE;

  if (names.length === 0 || names.every((n) => n.length === 0)) {
    return baseFs;
  }

  let fs = baseFs;
  for (let i = 0; i < 5; i++) {
    const widths = names.map((n) => measureTextWidth(n, fs, fontOption, isBold));
    const maxW = Math.max(...widths, 0);
    if (maxW <= maxWidth) break;

    const scale = maxWidth / maxW;
    fs = Math.max(MIN_FONT_SIZE, fs * scale);
  }

  return Math.max(MIN_FONT_SIZE, Math.min(baseFs, fs));
}

export function checkFitStatus(
  names: string[],
  fontOption: FontOption,
  isBold = true,
  maxWidthOrStyle: number | BadgeStyleId = 'classic',
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT
): 'ok' | 'tight' | 'overflow' {
  const validNames = names.map((n) => n.trim()).filter((n) => n.length > 0);
  if (validNames.length === 0) return 'ok';

  const maxWidth =
    typeof maxWidthOrStyle === 'number'
      ? maxWidthOrStyle
      : getStyleMetrics(maxWidthOrStyle, textPaddingLeft).maxTextWidth;

  const fs = calculateFontSize(validNames, fontOption, isBold, maxWidth);
  const widths = validNames.map((n) => measureTextWidth(n, fs, fontOption, isBold));
  const maxW = Math.max(...widths, 0);

  if (fs <= MIN_FONT_SIZE && maxW > maxWidth + 2) {
    return 'overflow';
  }
  if (fs < WARNING_FONT_SIZE_THRESHOLD) {
    return 'tight';
  }
  return 'ok';
}
