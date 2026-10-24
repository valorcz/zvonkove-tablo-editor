import type { FlatEntry } from './types';
import {
  COL_ORIGINS_X,
  SVG_VIEWBOX,
  SVG_WIDTH,
  PX_PER_MM,
  flatIdToSlot,
  getSlotCoordinates,
  calculateFontSize,
  FONT_OPTIONS,
  type FontOption,
  BADGE_WIDTH,
  BADGE_HEIGHT,
  BADGE_RX,
  DEFAULT_BADGE_FILL,
  BADGE_FONT_SIZE,
} from './tableauConfig';
import {
  IOSEVKA_SEMIBOLD_WOFF,
  IOSEVKA_BOLD_WOFF,
  DIN_REGULAR_WOFF,
  DIN_BOLD_WOFF,
  FIRA_REGULAR_WOFF,
  FIRA_BOLD_WOFF,
  TECHNIC_NT_WOFF,
} from '../assets/embeddedAssets';

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateFullSVG(
  flats: FlatEntry[],
  showIds = false,
  badgeColor = DEFAULT_BADGE_FILL,
  fontOption: FontOption = FONT_OPTIONS[0],
  isBold = true,
  showScale = true
): string {
  let cardsXml = '';
  let badgesXml = '';

  const fontWeight = isBold ? (fontOption.id === 'Iosevka' ? 600 : 700) : 400;

  for (let fid = 1; fid <= 28; fid++) {
    const entry = flats.find((f) => f.id === fid) || { id: fid, name1: '', name2: '' };
    const names = [entry.name1.trim(), entry.name2.trim()].filter((n) => n.length > 0);
    const displayNames = names.length > 0 ? names : [`Byt ${fid}`];

    const { col, row } = flatIdToSlot(fid);
    const coords = getSlotCoordinates(col, row);
    const fs = calculateFontSize(displayNames, fontOption, isBold);

    // Names card
    cardsXml += `        <g id="card-flat-${String(fid).padStart(2, '0')}">\n`;
    if (displayNames.length === 1) {
      const baselineY = coords.slotCenterY + 0.38 * fs;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${baselineY.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;fill:#000000;">${escapeXml(displayNames[0])}</text>\n`;
    } else {
      const lineHeight = fs * 1.15;
      const b1 = coords.slotCenterY - 0.5 * lineHeight + 0.38 * fs;
      const b2 = coords.slotCenterY + 0.5 * lineHeight + 0.38 * fs;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${b1.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;fill:#000000;">${escapeXml(displayNames[0])}</text>\n`;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${b2.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;fill:#000000;">${escapeXml(displayNames[1])}</text>\n`;
    }
    cardsXml += `        </g>\n`;

    // Flat ID badge
    const cx = coords.badgeCx;
    const cy = coords.badgeCy;
    const rectX = cx - BADGE_WIDTH / 2.0;
    const rectY = cy - BADGE_HEIGHT / 2.0;
    const badgeTextY = cy + 0.36 * BADGE_FONT_SIZE;

    badgesXml += `        <g id="flat-badge-${String(fid).padStart(2, '0')}">\n`;
    badgesXml += `            <rect x="${rectX.toFixed(2)}px" y="${rectY.toFixed(2)}px" width="${BADGE_WIDTH.toFixed(2)}px" height="${BADGE_HEIGHT.toFixed(2)}px" rx="${BADGE_RX.toFixed(2)}px" ry="${BADGE_RX.toFixed(2)}px" style="fill:${badgeColor};"/>\n`;
    badgesXml += `            <text x="${cx.toFixed(2)}px" y="${badgeTextY.toFixed(2)}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', 'Iosevka Fixed', monospace;font-weight:700;font-size:${BADGE_FONT_SIZE.toFixed(2)}px;fill:#000000;">${String(fid).padStart(2, '0')}</text>\n`;
    badgesXml += `        </g>\n`;
  }

  const idsStyle = showIds ? '' : ' style="display:none;"';

  // Vector 10-slot column template
  let templateSlots = '';
  for (let i = 0; i < 10; i++) {
    const y = 15.5 + i * 160.0;
    templateSlots += `        <rect x="110.5" y="${y.toFixed(1)}" width="490" height="130" fill="none" stroke="#000000" stroke-width="1.5"/>\n`;
  }

  // 100 mm printable calibration scale
  let scaleXml = '';
  if (showScale) {
    const rulerLengthMm = 100;
    const rulerLengthPx = rulerLengthMm * PX_PER_MM;
    const startX = (SVG_WIDTH - rulerLengthPx) / 2.0;
    const rulerY = 2270;

    let ticks = '';
    for (let mm = 0; mm <= rulerLengthMm; mm++) {
      const x = startX + mm * PX_PER_MM;
      const isMajor = mm % 10 === 0;
      const isMid = mm % 5 === 0 && !isMajor;
      const tickHeight = isMajor ? 26 : (isMid ? 16 : 9);
      ticks += `        <line x1="${x.toFixed(2)}" y1="${rulerY}" x2="${x.toFixed(2)}" y2="${rulerY - tickHeight}" stroke="#000000" stroke-width="${isMajor ? 2 : 1}"/>\n`;

      if (isMajor) {
        const cmVal = mm / 10;
        ticks += `        <text x="${x.toFixed(2)}" y="${rulerY - 32}" text-anchor="middle" style="font-family:'DINish', sans-serif;font-size:22px;font-weight:600;fill:#000000;">${cmVal}</text>\n`;
      }
    }

    scaleXml = `    <g id="Měřítko-tisku">
        <line x1="${startX.toFixed(2)}" y1="${rulerY}" x2="${(startX + rulerLengthPx).toFixed(2)}" y2="${rulerY}" stroke="#000000" stroke-width="2.5"/>
${ticks}        <text x="${(SVG_WIDTH / 2).toFixed(2)}" y="${rulerY + 36}" text-anchor="middle" style="font-family:'DINish', sans-serif;font-size:26px;font-weight:700;fill:#000000;">KONTROLNÍ MĚŘÍTKO 1:1 (PŘESNĚ 100 mm / 10 cm)</text>
        <text x="${(SVG_WIDTH / 2).toFixed(2)}" y="${rulerY + 68}" text-anchor="middle" style="font-family:'DINish', sans-serif;font-size:20px;fill:#475569;">Při tisku zkontrolujte pravítkem. Pokud úsečka neměří přesně 100 mm, nastavte měřítko tisku na 100% (Skutečná velikost / Do not fit).</text>
        <text x="${(SVG_WIDTH / 2).toFixed(2)}" y="${rulerY + 96}" text-anchor="middle" style="font-family:'DINish', sans-serif;font-size:18px;fill:#64748b;">Rozměr jednoho štítku: 48,6 × 12,9 mm</text>
    </g>\n`;
  }

  const styleTagOpen = '<' + 'style type="text/css">';
  const styleTagClose = '</' + 'style>';

  const fontFaces = `
            @font-face {
                font-family: 'Technic NT';
                src: url('${TECHNIC_NT_WOFF}') format('woff');
                font-weight: 400;
                font-style: normal;
            }
            @font-face {
                font-family: 'DINish';
                src: url('${DIN_REGULAR_WOFF}') format('woff');
                font-weight: 400;
                font-style: normal;
            }
            @font-face {
                font-family: 'DINish';
                src: url('${DIN_BOLD_WOFF}') format('woff');
                font-weight: 700;
                font-style: normal;
            }
            @font-face {
                font-family: 'Fira Sans Condensed';
                src: url('${FIRA_REGULAR_WOFF}') format('woff');
                font-weight: 400;
                font-style: normal;
            }
            @font-face {
                font-family: 'Fira Sans Condensed';
                src: url('${FIRA_BOLD_WOFF}') format('woff');
                font-weight: 700;
                font-style: normal;
            }
            @font-face {
                font-family: 'Iosevka-Semibold';
                src: url('${IOSEVKA_SEMIBOLD_WOFF}') format('woff');
                font-weight: 600;
                font-style: normal;
            }
            @font-face {
                font-family: 'Iosevka-Fixed-Bold';
                src: url('${IOSEVKA_BOLD_WOFF}') format('woff');
                font-weight: 700;
                font-style: normal;
            }`;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="297mm" height="210mm" viewBox="${SVG_VIEWBOX}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <defs>
        ${styleTagOpen}
${fontFaces}
        ${styleTagClose}
        <!-- Pure vector column strip template -->
        <g id="_ColumnTemplate">
            <rect x="0.5" y="0.5" width="621" height="1611" fill="none" stroke="#000000" stroke-width="1.5"/>
${templateSlots}        </g>
    </defs>
    <!-- Vector Column 1 -->
    <g transform="matrix(1.17229,0,0,1.17231,${COL_ORIGINS_X[0]},210.788)">
        <use xlink:href="#_ColumnTemplate"/>
    </g>
    <!-- Vector Column 2 -->
    <g transform="matrix(1.17229,0,0,1.17231,${COL_ORIGINS_X[1]},210.788)">
        <use xlink:href="#_ColumnTemplate"/>
    </g>
    <!-- Vector Column 3 -->
    <g transform="matrix(1.17229,0,0,1.17231,${COL_ORIGINS_X[2]},210.788)">
        <use xlink:href="#_ColumnTemplate"/>
    </g>
    <g id="Příjmení">
${cardsXml}    </g>
    <g id="Čísla-bytů" serif:id="Čísla bytů"${idsStyle}>
${badgesXml}    </g>
${scaleXml}</svg>`;
}

export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
