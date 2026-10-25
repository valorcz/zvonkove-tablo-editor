import type { BadgePosition, BadgeShape, BadgeStyleId } from './types';
import { BADGE_WIDTH, BADGE_HEIGHT, BADGE_RX, BADGE_FONT_SIZE, getWatermarkStyle } from './tableauConfig';

export interface BadgeShapeItem {
  type: 'rect' | 'circle' | 'line';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  cx?: number;
  cy?: number;
  r?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

export interface BadgeTextItem {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontWeight: number | string;
  fill: string;
  opacity?: number;
  textAnchor: 'start' | 'middle' | 'end';
  fontFamily: string;
}

export interface RenderedBadgeData {
  id: number;
  idStr: string;
  shapes: BadgeShapeItem[];
  text: BadgeTextItem | null;
}

export interface BadgePositionOption {
  id: BadgePosition;
  label: string;
  description: string;
  supportedShapes: BadgeShape[];
}

export const BADGE_POSITIONS: BadgePositionOption[] = [
  {
    id: 'right-center',
    label: 'Vpravo na středu (Standard)',
    description: 'Číslo bytu vpravo u zvonkového tlačítka (klasický štítek, kruh nebo čistý text)',
    supportedShapes: ['badge', 'circle', 'none'],
  },
  {
    id: 'corner-index',
    label: 'Decentní horní index (v pravém rohu)',
    description: 'Malé číslo v pravém horním rohu – uvolňuje střed pro dlouhá 2řádková jména',
    supportedShapes: ['none', 'badge'],
  },
  {
    id: 'left-block',
    label: 'Architektonický blok vlevo (plná výška)',
    description: 'Barevný vertikální pás přes celou výšku štítku s výrazným číslem a linkou',
    supportedShapes: ['badge'],
  },
  {
    id: 'watermark',
    label: 'Jemný vodoznak na pozadí',
    description: 'Velké decentní číslo v pozadí pod textem, jména procházejí v popředí',
    supportedShapes: ['none'],
  },
  {
    id: 'none',
    label: 'Bez čísel bytů (pouze jména)',
    description: 'Čisté jmenovky bez čísel s maximálním prostorem pro jména',
    supportedShapes: ['none'],
  },
];

export const BADGE_SHAPES: { id: BadgeShape; label: string; description: string }[] = [
  { id: 'badge', label: 'Zaoblený štítek', description: 'Podbarvený obdélníček s jemně zaoblenými rohy' },
  { id: 'circle', label: 'Kruhový medailon', description: 'Geometrický kruh v orientačním stylu' },
  { id: 'none', label: 'Bez podkladu (Čistý text)', description: 'Typografické číslo přímo na bílém podkladu' },
];

// Helper to convert legacy BadgeStyleId to { position, shape }
export function decodeBadgeStyle(styleId: BadgeStyleId): { position: BadgePosition; shape: BadgeShape } {
  switch (styleId) {
    case 'circle':
      return { position: 'right-center', shape: 'circle' };
    case 'inline-num':
      return { position: 'right-center', shape: 'none' };
    case 'outline':
      return { position: 'right-center', shape: 'badge' };
    case 'corner-index':
      return { position: 'corner-index', shape: 'none' };
    case 'corner-badge':
      return { position: 'corner-index', shape: 'badge' };
    case 'left-block':
      return { position: 'left-block', shape: 'badge' };
    case 'watermark':
      return { position: 'watermark', shape: 'none' };
    case 'none':
      return { position: 'none', shape: 'none' };
    case 'classic':
    default:
      return { position: 'right-center', shape: 'badge' };
  }
}

// Helper to convert { position, shape } back to BadgeStyleId
export function encodeBadgeStyle(position: BadgePosition, shape: BadgeShape): BadgeStyleId {
  if (position === 'none') return 'none';
  if (position === 'watermark') return 'watermark';
  if (position === 'left-block') return 'left-block';
  if (position === 'corner-index') {
    return shape === 'badge' ? 'corner-badge' : 'corner-index';
  }
  if (position === 'right-center') {
    if (shape === 'circle') return 'circle';
    if (shape === 'none') return 'inline-num';
    return 'classic';
  }
  return 'classic';
}

// Compute text placement metrics for resident names based on badge layout
export function getBadgeLayoutTextMetrics(
  position: BadgePosition,
  shape: BadgeShape,
  colX: number,
  slotTop: number,
  slotBottom: number,
  slotRight: number,
  textPaddingLeft: number
): { textX: number; maxTextWidth: number; badgeCx: number; badgeCy: number } {
  const slotLeft = colX + 129.54;
  const badgeCx = colX + 650.0;
  const badgeCy = (slotTop + slotBottom) / 2.0;

  if (position === 'none' || position === 'watermark') {
    const textX = slotLeft + textPaddingLeft;
    return {
      textX,
      maxTextWidth: slotRight - 20.0 - textX,
      badgeCx: 0,
      badgeCy: 0,
    };
  }

  if (position === 'left-block') {
    const blockW = 76.0;
    const textX = slotLeft + blockW + textPaddingLeft;
    return {
      textX,
      maxTextWidth: slotRight - 20.0 - textX,
      badgeCx: slotLeft + blockW / 2.0,
      badgeCy,
    };
  }

  if (position === 'corner-index') {
    const textX = slotLeft + textPaddingLeft;
    const rightMargin = shape === 'badge' ? 65.0 : 45.0;
    return {
      textX,
      maxTextWidth: slotRight - rightMargin - textX,
      badgeCx: colX + 675.0,
      badgeCy: slotTop + 34.0,
    };
  }

  // right-center (classic, circle, inline-num)
  const textX = slotLeft + textPaddingLeft;
  const rightBoundary = shape === 'none' ? 620.0 : 604.0;
  return {
    textX,
    maxTextWidth: rightBoundary - textX,
    badgeCx,
    badgeCy,
  };
}

// Unified Badge Geometry Builder (Zero if/else in SVG layers!)
export function buildBadgeGeometry(params: {
  id: number;
  idStr: string;
  position: BadgePosition;
  shape: BadgeShape;
  colX: number;
  slotTop: number;
  slotBottom: number;
  slotCenterY: number;
  badgeColor: string;
  numeralFontFamily: string;
}): RenderedBadgeData {
  const {
    id,
    idStr,
    position,
    shape,
    colX,
    slotTop,
    slotBottom,
    slotCenterY,
    badgeColor,
    numeralFontFamily,
  } = params;

  if (position === 'none') {
    return { id, idStr, shapes: [], text: null };
  }

  if (position === 'left-block') {
    const blockX = colX + 129.54;
    const blockW = 76.0;
    const blockH = slotBottom - slotTop;
    return {
      id,
      idStr,
      shapes: [
        {
          type: 'rect',
          x: blockX,
          y: slotTop,
          width: blockW,
          height: blockH,
          rx: 0,
          fill: badgeColor,
        },
        {
          type: 'line',
          x1: blockX + blockW,
          y1: slotTop,
          x2: blockX + blockW,
          y2: slotBottom,
          stroke: '#cbd5e1',
          strokeWidth: 2,
        },
      ],
      text: {
        text: idStr,
        x: blockX + blockW / 2.0,
        y: slotCenterY + 14.0,
        fontSize: 42,
        fontWeight: 700,
        fill: '#000000',
        textAnchor: 'middle',
        fontFamily: numeralFontFamily,
      },
    };
  }

  if (position === 'watermark') {
    const wm = getWatermarkStyle(badgeColor);
    return {
      id,
      idStr,
      shapes: [],
      text: {
        text: idStr,
        x: colX + 636.0,
        y: slotCenterY + 28.0,
        fontSize: 84,
        fontWeight: 800,
        fill: wm.fill,
        opacity: wm.opacity,
        textAnchor: 'middle',
        fontFamily: numeralFontFamily,
      },
    };
  }

  if (position === 'corner-index') {
    const shapes: BadgeShapeItem[] = [];
    let textX = colX + 675.0;
    let textY = slotTop + 34.0;
    let fontSize = 26;

    if (shape === 'badge') {
      const bw = 46.0;
      const bh = 32.0;
      const bx = colX + 703.96 - bw - 4.0;
      const by = slotTop + 6.0;
      shapes.push({
        type: 'rect',
        x: bx,
        y: by,
        width: bw,
        height: bh,
        rx: 6,
        fill: badgeColor,
      });
      textX = bx + bw / 2.0;
      textY = by + 23.0;
      fontSize = 24;
    }

    return {
      id,
      idStr,
      shapes,
      text: {
        text: idStr,
        x: textX,
        y: textY,
        fontSize,
        fontWeight: 700,
        fill: '#000000',
        textAnchor: 'middle',
        fontFamily: numeralFontFamily,
      },
    };
  }

  // right-center
  const cx = colX + 650.0;
  const cy = slotCenterY;
  const shapes: BadgeShapeItem[] = [];

  if (shape === 'badge') {
    shapes.push({
      type: 'rect',
      x: cx - BADGE_WIDTH / 2.0,
      y: cy - BADGE_HEIGHT / 2.0,
      width: BADGE_WIDTH,
      height: BADGE_HEIGHT,
      rx: BADGE_RX,
      fill: badgeColor,
    });
  } else if (shape === 'circle') {
    shapes.push({
      type: 'circle',
      cx,
      cy,
      r: 27.0,
      fill: badgeColor,
    });
  }

  const fontSize = shape === 'none' ? 36 : BADGE_FONT_SIZE;
  const textX = shape === 'none' ? colX + 665.0 : cx;

  return {
    id,
    idStr,
    shapes,
    text: {
      text: idStr,
      x: textX,
      y: cy + 13.0,
      fontSize,
      fontWeight: 700,
      fill: '#000000',
      textAnchor: 'middle',
      fontFamily: numeralFontFamily,
    },
  };
}
