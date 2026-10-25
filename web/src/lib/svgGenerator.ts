import type {
  FlatEntry,
  BadgeStyleId,
  PrintColumnOption,
  TableauLayoutConfig,
  NumeralFontMode,
  TemplateRenderMode,
  TemplateOutlineStyle,
} from './types';
import { getHardwareProfileForPreset } from './hardwareProfiles';
import { decodeBadgeStyle, buildBadgeGeometry } from './badgeRegistry';
import {
  COL_ORIGINS_X,
  SVG_VIEWBOX,
  SVG_WIDTH,
  PX_PER_MM,
  OFFSET_Y,
  SCALE_Y,
  IMAGE_SLOT_TOP_0,
  getSlotCoordinates,
  calculateFontSize,
  FONT_OPTIONS,
  type FontOption,
  DEFAULT_BADGE_FILL,
  DEFAULT_TEXT_PADDING_LEFT,
  getDefaultLayout,
  computeSlotMapping,
  computeColumnOrigins,
} from './tableauConfig';
import {
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
  showScale = true,
  badgeStyle: BadgeStyleId = 'classic',
  showCropMarks = true,
  textPaddingLeft: number = DEFAULT_TEXT_PADDING_LEFT,
  printColumn: PrintColumnOption = 'all',
  layout?: TableauLayoutConfig,
  numeralFontMode: NumeralFontMode = 'iosevka',
  templateRenderMode: TemplateRenderMode = 'full',
  templateOutlineStyle: TemplateOutlineStyle = 'dashed-subtle',
  showDimensions = false
): string {
  const activeLayout = layout || getDefaultLayout();
  const colOrigins = computeColumnOrigins(activeLayout);
  const mappings = computeSlotMapping(activeLayout);

  const { manufacturer, system } = getHardwareProfileForPreset(activeLayout.preset);
  const slotWidthMm = system.slot.widthMm || 48.63;
  const slotHeightMm = system.slot.heightMm || 12.90;
  const slotStepMm = system.module?.slotStepMm || 15.88;
  const buttonPlacement = system.module?.button?.placement || 'left';
  const buttonWidthMm = system.module?.button?.widthMm || 10.97;
  const moduleWidthMm = system.module?.moduleWidthMm || 61.64;
  const cornerRadiusMm = system.slot.cornerRadiusMm || 1.0;

  const slotWidthPx = slotWidthMm * PX_PER_MM;
  const slotHeightPx = slotHeightMm * PX_PER_MM;
  const slotStepPx = slotStepMm * PX_PER_MM;
  const buttonWidthPx = buttonWidthMm * PX_PER_MM;
  const moduleWidthPx = moduleWidthMm * PX_PER_MM;
  const cornerRadiusPx = cornerRadiusMm * PX_PER_MM;

  let cardsXml = '';
  let badgesXml = '';

  const fontWeight = isBold ? (fontOption.id === 'Iosevka' ? 600 : 700) : 400;
  const numFont = numeralFontMode === 'inherit' ? fontOption.fontFamily : "'Iosevka-Fixed-Bold', 'Iosevka Fixed', monospace";

  for (const slot of mappings) {
    const col = slot.colIndex;
    const row = slot.rowIndex;

    if (printColumn !== 'all' && col + 1 !== printColumn) {
      continue;
    }

    const entry = flats.find((f) => f.id === slot.slotIndex) || { id: slot.slotIndex, name1: '', name2: '' };
    const names = [entry.name1.trim(), entry.name2.trim()].filter((n) => n.length > 0);
    const idStr = entry.customNumber || slot.defaultNumber;
    const displayNames = names.length > 0 ? names : [`Byt ${idStr}`];

    const coords = getSlotCoordinates(col, row, badgeStyle, textPaddingLeft, colOrigins, system);
    const fs = calculateFontSize(displayNames, fontOption, isBold, badgeStyle, textPaddingLeft);

    const letterSpacing = fontOption.id === 'TechnicNT' || fontOption.id === 'DIN' ? '0.025em' : 'normal';

    // Names card
    cardsXml += `        <g id="card-flat-${String(slot.slotIndex).padStart(2, '0')}">\n`;
    if (displayNames.length === 1) {
      const baselineY = coords.slotCenterY + 0.38 * fs;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${baselineY.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;letter-spacing:${letterSpacing};fill:#000000;">${escapeXml(displayNames[0])}</text>\n`;
    } else {
      const lineHeight = fs * 1.18;
      const b1 = coords.slotCenterY - 0.5 * lineHeight + 0.38 * fs;
      const b2 = coords.slotCenterY + 0.5 * lineHeight + 0.38 * fs;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${b1.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;letter-spacing:${letterSpacing};fill:#000000;">${escapeXml(displayNames[0])}</text>\n`;
      cardsXml += `            <text x="${coords.textX.toFixed(2)}px" y="${b2.toFixed(2)}px" style="font-family:${fontOption.fontFamily};font-weight:${fontWeight};font-size:${fs.toFixed(3)}px;letter-spacing:${letterSpacing};fill:#000000;">${escapeXml(displayNames[1])}</text>\n`;
    }
    cardsXml += `        </g>\n`;

    // Render badge according to badgeStyle
    const { position, shape } = decodeBadgeStyle(badgeStyle);
    const slotLeft = buttonPlacement === 'left' ? coords.colX + buttonWidthPx : coords.colX;
    const slotRight = slotLeft + slotWidthPx;

    const badge = buildBadgeGeometry({
      id: slot.slotIndex,
      idStr,
      position,
      shape,
      colX: coords.colX,
      slotTop: coords.slotTop,
      slotBottom: coords.slotBottom,
      slotCenterY: coords.slotCenterY,
      badgeColor,
      numeralFontFamily: numFont,
      slotLeft,
      slotRight,
    });

    if (badge && (badge.shapes.length > 0 || badge.text)) {
      badgesXml += `        <g id="flat-badge-${idStr}">\n`;
      for (const sh of badge.shapes) {
        if (sh.type === 'rect') {
          badgesXml += `            <rect x="${sh.x?.toFixed(2)}px" y="${sh.y?.toFixed(2)}px" width="${sh.width?.toFixed(2)}px" height="${sh.height?.toFixed(2)}px" rx="${sh.rx || 0}px" ry="${sh.rx || 0}px" style="fill:${sh.fill || 'none'};" />\n`;
        } else if (sh.type === 'circle') {
          badgesXml += `            <circle cx="${sh.cx?.toFixed(2)}px" cy="${sh.cy?.toFixed(2)}px" r="${sh.r?.toFixed(2)}px" style="fill:${sh.fill || 'none'};" />\n`;
        } else if (sh.type === 'line') {
          badgesXml += `            <line x1="${sh.x1?.toFixed(2)}" y1="${sh.y1?.toFixed(2)}" x2="${sh.x2?.toFixed(2)}" y2="${sh.y2?.toFixed(2)}" stroke="${sh.stroke}" stroke-width="${sh.strokeWidth || 1}" />\n`;
        }
      }
      if (badge.text) {
        const opacityStyle = badge.text.opacity !== undefined ? `opacity:${badge.text.opacity};` : '';
        badgesXml += `            <text x="${badge.text.x.toFixed(2)}px" y="${badge.text.y.toFixed(2)}px" text-anchor="${badge.text.textAnchor}" style="font-family:${badge.text.fontFamily};font-variant-numeric:tabular-nums;font-weight:${badge.text.fontWeight};font-size:${badge.text.fontSize}px;fill:${badge.text.fill};${opacityStyle}">${escapeXml(badge.text.text)}</text>\n`;
      }
      badgesXml += `        </g>\n`;
    }
  }

  const idsVisible = showIds && badgeStyle !== 'none';
  const idsStyle = idsVisible ? '' : ' style="display:none;"';

  // Dynamic Column Templates XML
  let colTemplatesXml = '';
  for (let cIdx = 0; cIdx < activeLayout.columns.length; cIdx++) {
    if (printColumn !== 'all' && cIdx + 1 !== printColumn) continue;
    const colCfg = activeLayout.columns[cIdx];
    const cOriginX = colOrigins[cIdx];
    const colHeightPx = (IMAGE_SLOT_TOP_0 * 2 * SCALE_Y) + (colCfg.capacity * slotStepPx);

    colTemplatesXml += `    <g id="column-template-${cIdx + 1}">\n`;
    if (templateRenderMode === 'full') {
      const outerW = buttonPlacement === 'none' ? slotWidthPx : moduleWidthPx;
      const strokeColor = templateOutlineStyle === 'solid-dark' ? '#000000' : '#94a3b8';
      const strokeW = templateOutlineStyle === 'solid-dark' ? '1.8' : '1.0';
      const dashAttr = templateOutlineStyle === 'dashed-subtle' ? ' stroke-dasharray="6,4"' : '';
      colTemplatesXml += `        <rect x="${cOriginX.toFixed(2)}" y="${OFFSET_Y.toFixed(2)}" width="${outerW.toFixed(2)}" height="${colHeightPx.toFixed(2)}" fill="none" stroke="${strokeColor}" stroke-width="${strokeW}"${dashAttr} rx="3"/>\n`;
    }

    let slotStroke = '#94a3b8';
    let slotStrokeW = '1.0';
    let slotDash = ' stroke-dasharray="4,3" opacity="0.8"';
    let renderSlotOutline = true;

    if (templateOutlineStyle === 'solid-light') {
      slotStroke = '#cbd5e1';
      slotStrokeW = '1.0';
      slotDash = '';
    } else if (templateOutlineStyle === 'solid-dark') {
      slotStroke = '#000000';
      slotStrokeW = '1.5';
      slotDash = '';
    } else if (templateOutlineStyle === 'none') {
      renderSlotOutline = false;
    }

    for (let r = 0; r < colCfg.capacity; r++) {
      const slotTop = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y) + r * slotStepPx;
      const slotLeft = buttonPlacement === 'left' ? cOriginX + buttonWidthPx : cOriginX;

      if (renderSlotOutline) {
        colTemplatesXml += `        <rect x="${slotLeft.toFixed(2)}" y="${slotTop.toFixed(2)}" width="${slotWidthPx.toFixed(2)}" height="${slotHeightPx.toFixed(2)}" fill="none" stroke="${slotStroke}" stroke-width="${slotStrokeW}"${slotDash} rx="${cornerRadiusPx.toFixed(2)}"/>\n`;
      }

      if (templateRenderMode === 'full' && buttonPlacement !== 'none') {
        const btnX = buttonPlacement === 'left' ? cOriginX + 12 : cOriginX + slotWidthPx + 12;
        const btnW = Math.max(20, buttonWidthPx - 24);
        colTemplatesXml += `        <rect x="${btnX.toFixed(2)}" y="${(slotTop + 10).toFixed(2)}" width="${btnW.toFixed(2)}" height="${(slotHeightPx - 20).toFixed(2)}" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.0"/>\n`;
        colTemplatesXml += `        <circle cx="${(btnX + btnW / 2).toFixed(2)}" cy="${(slotTop + slotHeightPx / 2).toFixed(2)}" r="11" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.0"/>\n`;
      }
    }
    colTemplatesXml += `    </g>\n`;
  }

  // Corner crop marks for the full module strip (to slice whole strip with cutter)
  let cropMarksXml = '';
  if (showCropMarks) {
    const markLen = 24.0;
    const markGap = 5.0;

    let marks = '';
    for (let cIdx = 0; cIdx < activeLayout.columns.length; cIdx++) {
      if (printColumn !== 'all' && cIdx + 1 !== printColumn) continue;
      const colCfg = activeLayout.columns[cIdx];
      const colX = colOrigins[cIdx];
      const stripWidthPx = buttonPlacement === 'none' ? slotWidthPx : moduleWidthPx;
      const stripLeft = colX;
      const stripRight = colX + stripWidthPx;
      const stripTop = OFFSET_Y;
      const stripBottom = OFFSET_Y + (IMAGE_SLOT_TOP_0 * 2 * SCALE_Y) + (colCfg.capacity * slotStepPx);

      // 4 Corner marks defining the entire module paper strip
      // Top-left
      marks += `        <line x1="${stripLeft.toFixed(2)}" y1="${(stripTop - markGap - markLen).toFixed(2)}" x2="${stripLeft.toFixed(2)}" y2="${(stripTop - markGap).toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      marks += `        <line x1="${(stripLeft - markGap - markLen).toFixed(2)}" y1="${stripTop.toFixed(2)}" x2="${(stripLeft - markGap).toFixed(2)}" y2="${stripTop.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      // Top-right
      marks += `        <line x1="${stripRight.toFixed(2)}" y1="${(stripTop - markGap - markLen).toFixed(2)}" x2="${stripRight.toFixed(2)}" y2="${(stripTop - markGap).toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      marks += `        <line x1="${(stripRight + markGap).toFixed(2)}" y1="${stripTop.toFixed(2)}" x2="${(stripRight + markGap + markLen).toFixed(2)}" y2="${stripTop.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      // Bottom-left
      marks += `        <line x1="${stripLeft.toFixed(2)}" y1="${(stripBottom + markGap).toFixed(2)}" x2="${stripLeft.toFixed(2)}" y2="${(stripBottom + markGap + markLen).toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      marks += `        <line x1="${(stripLeft - markGap - markLen).toFixed(2)}" y1="${stripBottom.toFixed(2)}" x2="${(stripLeft - markGap).toFixed(2)}" y2="${stripBottom.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      // Bottom-right
      marks += `        <line x1="${stripRight.toFixed(2)}" y1="${(stripBottom + markGap).toFixed(2)}" x2="${stripRight.toFixed(2)}" y2="${(stripBottom + markGap + markLen).toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      marks += `        <line x1="${(stripRight + markGap).toFixed(2)}" y1="${stripBottom.toFixed(2)}" x2="${(stripRight + markGap + markLen).toFixed(2)}" y2="${stripBottom.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;

      // Intermediate divider ticks between slots on the strip borders
      for (let r = 1; r < colCfg.capacity; r++) {
        const dividerY = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y) + r * slotStepPx - (slotStepPx - slotHeightPx) / 2;
        marks += `        <line x1="${(stripLeft - markGap - 9).toFixed(2)}" y1="${dividerY.toFixed(2)}" x2="${(stripLeft - markGap).toFixed(2)}" y2="${dividerY.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
        marks += `        <line x1="${(stripRight + markGap).toFixed(2)}" y1="${dividerY.toFixed(2)}" x2="${(stripRight + markGap + 9).toFixed(2)}" y2="${dividerY.toFixed(2)}" stroke="#94a3b8" stroke-width="1.2"/>\n`;
      }
    }

    cropMarksXml = `    <g id="Ořezové-značky">\n${marks}    </g>\n`;
  }

  // Dimension lines layer
  let dimensionsXml = '';
  if (showDimensions) {
    const firstColIdx = printColumn === 'all' ? 0 : printColumn - 1;
    const firstColCfg = activeLayout.columns[firstColIdx];
    if (firstColCfg) {
      const cOriginX = colOrigins[firstColIdx];
      const slot0Left = buttonPlacement === 'left' ? cOriginX + buttonWidthPx : cOriginX;
      const slot0Top = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y);
      const slot0Right = slot0Left + slotWidthPx;
      const slot0Bottom = slot0Top + slotHeightPx;
      const dimY = slot0Top - 42;

      let dimContent = '';
      // 1. Width
      dimContent += `        <line x1="${slot0Left.toFixed(2)}" y1="${(slot0Top - 6).toFixed(2)}" x2="${slot0Left.toFixed(2)}" y2="${(slot0Top - 56).toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
      dimContent += `        <line x1="${slot0Right.toFixed(2)}" y1="${(slot0Top - 6).toFixed(2)}" x2="${slot0Right.toFixed(2)}" y2="${(slot0Top - 56).toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
      dimContent += `        <line x1="${(slot0Left + 12).toFixed(2)}" y1="${dimY.toFixed(2)}" x2="${(slot0Right - 12).toFixed(2)}" y2="${dimY.toFixed(2)}" stroke="#0f172a" stroke-width="1.8"/>\n`;
      dimContent += `        <polygon points="${slot0Left.toFixed(2)},${dimY.toFixed(2)} ${(slot0Left + 12).toFixed(2)},${(dimY - 5).toFixed(2)} ${(slot0Left + 12).toFixed(2)},${(dimY + 5).toFixed(2)}" fill="#0f172a"/>\n`;
      dimContent += `        <polygon points="${slot0Right.toFixed(2)},${dimY.toFixed(2)} ${(slot0Right - 12).toFixed(2)},${(dimY - 5).toFixed(2)} ${(slot0Right - 12).toFixed(2)},${(dimY + 5).toFixed(2)}" fill="#0f172a"/>\n`;
      dimContent += `        <rect x="${(slot0Left + slotWidthPx / 2 - 58).toFixed(2)}" y="${(dimY - 14).toFixed(2)}" width="116" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>\n`;
      dimContent += `        <text x="${(slot0Left + slotWidthPx / 2).toFixed(2)}" y="${(dimY + 1).toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-family:'DINish',sans-serif;font-size:20px;font-weight:700;fill:#0f172a;">${slotWidthMm.toFixed(1).replace('.', ',')} mm</text>\n`;

      // 2. Height
      const dimX = slot0Right + 45;
      dimContent += `        <line x1="${(slot0Right + 6).toFixed(2)}" y1="${slot0Top.toFixed(2)}" x2="${(slot0Right + 58).toFixed(2)}" y2="${slot0Top.toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
      dimContent += `        <line x1="${(slot0Right + 6).toFixed(2)}" y1="${slot0Bottom.toFixed(2)}" x2="${(slot0Right + 58).toFixed(2)}" y2="${slot0Bottom.toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
      dimContent += `        <line x1="${dimX.toFixed(2)}" y1="${(slot0Top + 12).toFixed(2)}" x2="${dimX.toFixed(2)}" y2="${(slot0Bottom - 12).toFixed(2)}" stroke="#0f172a" stroke-width="1.8"/>\n`;
      dimContent += `        <polygon points="${dimX.toFixed(2)},${slot0Top.toFixed(2)} ${(dimX - 5).toFixed(2)},${(slot0Top + 12).toFixed(2)} ${(dimX + 5).toFixed(2)},${(slot0Top + 12).toFixed(2)}" fill="#0f172a"/>\n`;
      dimContent += `        <polygon points="${dimX.toFixed(2)},${slot0Bottom.toFixed(2)} ${(dimX - 5).toFixed(2)},${(slot0Bottom - 12).toFixed(2)} ${(dimX + 5).toFixed(2)},${(slot0Bottom - 12).toFixed(2)}" fill="#0f172a"/>\n`;
      dimContent += `        <rect x="${(dimX + 12).toFixed(2)}" y="${(slot0Top + slotHeightPx / 2 - 13).toFixed(2)}" width="96" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>\n`;
      dimContent += `        <text x="${(dimX + 60).toFixed(2)}" y="${(slot0Top + slotHeightPx / 2 + 1).toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-family:'DINish',sans-serif;font-size:20px;font-weight:700;fill:#0f172a;">${slotHeightMm.toFixed(1).replace('.', ',')} mm</text>\n`;

      // 3. Pitch
      if (firstColCfg.capacity >= 2) {
        const slot1Top = slot0Top + slotStepPx;
        const pitchDimX = slot0Left - 45;
        dimContent += `        <line x1="${(slot0Left - 6).toFixed(2)}" y1="${slot0Top.toFixed(2)}" x2="${(slot0Left - 58).toFixed(2)}" y2="${slot0Top.toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
        dimContent += `        <line x1="${(slot0Left - 6).toFixed(2)}" y1="${slot1Top.toFixed(2)}" x2="${(slot0Left - 58).toFixed(2)}" y2="${slot1Top.toFixed(2)}" stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3"/>\n`;
        dimContent += `        <line x1="${pitchDimX.toFixed(2)}" y1="${(slot0Top + 12).toFixed(2)}" x2="${pitchDimX.toFixed(2)}" y2="${(slot1Top - 12).toFixed(2)}" stroke="#0f172a" stroke-width="1.8"/>\n`;
        dimContent += `        <polygon points="${pitchDimX.toFixed(2)},${slot0Top.toFixed(2)} ${(pitchDimX - 5).toFixed(2)},${(slot0Top + 12).toFixed(2)} ${(pitchDimX + 5).toFixed(2)},${(slot0Top + 12).toFixed(2)}" fill="#0f172a"/>\n`;
        dimContent += `        <polygon points="${pitchDimX.toFixed(2)},${slot1Top.toFixed(2)} ${(pitchDimX - 5).toFixed(2)},${(slot1Top - 12).toFixed(2)} ${(pitchDimX + 5).toFixed(2)},${(slot1Top - 12).toFixed(2)}" fill="#0f172a"/>\n`;
        dimContent += `        <rect x="${(pitchDimX - 165).toFixed(2)}" y="${(slot0Top + slotStepPx / 2 - 13).toFixed(2)}" width="155" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>\n`;
        dimContent += `        <text x="${(pitchDimX - 88).toFixed(2)}" y="${(slot0Top + slotStepPx / 2 + 1).toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-family:'DINish',sans-serif;font-size:18px;font-weight:600;fill:#1e293b;">rozteč ${slotStepMm.toFixed(1).replace('.', ',')} mm</text>\n`;
      }

      // 4. Module width
      if (templateRenderMode === 'full' && buttonPlacement !== 'none') {
        const modDimY = slot0Top - 88;
        dimContent += `        <line x1="${cOriginX.toFixed(2)}" y1="${(slot0Top - 6).toFixed(2)}" x2="${cOriginX.toFixed(2)}" y2="${(slot0Top - 100).toFixed(2)}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>\n`;
        dimContent += `        <line x1="${(cOriginX + moduleWidthPx).toFixed(2)}" y1="${(slot0Top - 6).toFixed(2)}" x2="${(cOriginX + moduleWidthPx).toFixed(2)}" y2="${(slot0Top - 100).toFixed(2)}" stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3"/>\n`;
        dimContent += `        <line x1="${(cOriginX + 12).toFixed(2)}" y1="${modDimY.toFixed(2)}" x2="${(cOriginX + moduleWidthPx - 12).toFixed(2)}" y2="${modDimY.toFixed(2)}" stroke="#475569" stroke-width="1.5"/>\n`;
        dimContent += `        <polygon points="${cOriginX.toFixed(2)},${modDimY.toFixed(2)} ${(cOriginX + 12).toFixed(2)},${(modDimY - 4).toFixed(2)} ${(cOriginX + 12).toFixed(2)},${(modDimY + 4).toFixed(2)}" fill="#475569"/>\n`;
        dimContent += `        <polygon points="${(cOriginX + moduleWidthPx).toFixed(2)},${modDimY.toFixed(2)} ${(cOriginX + moduleWidthPx - 12).toFixed(2)},${(modDimY - 4).toFixed(2)} ${(cOriginX + moduleWidthPx - 12).toFixed(2)},${(modDimY + 4).toFixed(2)}" fill="#475569"/>\n`;
        dimContent += `        <rect x="${(cOriginX + moduleWidthPx / 2 - 100).toFixed(2)}" y="${(modDimY - 14).toFixed(2)}" width="200" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>\n`;
        dimContent += `        <text x="${(cOriginX + moduleWidthPx / 2).toFixed(2)}" y="${modDimY.toFixed(2)}" text-anchor="middle" dominant-baseline="central" style="font-family:'DINish',sans-serif;font-size:17px;font-weight:600;fill:#475569;">celý modul ${moduleWidthMm.toFixed(1).replace('.', ',')} mm</text>\n`;
      }

      dimensionsXml = `    <g id="Technické-kóty">\n${dimContent}    </g>\n`;
    }
  }

  // 100 mm printable calibration scale and technical stamp
  let scaleXml = '';
  if (showScale) {
    const rulerLengthMm = 100;
    const rulerLengthPx = rulerLengthMm * PX_PER_MM;
    const startX = (SVG_WIDTH - rulerLengthPx) / 2.0;
    const rulerY = 2215;

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

    const stampW = 2460;
    const stampH = 105;
    const stampX = (SVG_WIDTH - stampW) / 2;
    const stampY = rulerY + 50;

    scaleXml = `    <g id="Měřítko-tisku">
        <line x1="${startX.toFixed(2)}" y1="${rulerY}" x2="${(startX + rulerLengthPx).toFixed(2)}" y2="${rulerY}" stroke="#000000" stroke-width="2.5"/>
${ticks}        <text x="${(SVG_WIDTH / 2).toFixed(2)}" y="${rulerY + 32}" text-anchor="middle" style="font-family:'DINish', sans-serif;font-size:22px;font-weight:700;fill:#0f172a;">KONTROLNÍ MĚŘÍTKO 1:1 (PŘESNĚ 100 mm / 10 cm) • PŘED ŘEZÁNÍM OVĚŘTE PRAVÍTKEM</text>
        <rect x="${stampX.toFixed(2)}" y="${stampY.toFixed(2)}" width="${stampW}" height="${stampH}" rx="6" fill="#f8fafc" stroke="#64748b" stroke-width="1.8"/>
        <line x1="${(stampX + 800).toFixed(2)}" y1="${stampY.toFixed(2)}" x2="${(stampX + 800).toFixed(2)}" y2="${(stampY + stampH).toFixed(2)}" stroke="#cbd5e1" stroke-width="1.2"/>
        <line x1="${(stampX + 1640).toFixed(2)}" y1="${stampY.toFixed(2)}" x2="${(stampX + 1640).toFixed(2)}" y2="${(stampY + stampH).toFixed(2)}" stroke="#cbd5e1" stroke-width="1.2"/>
        <text x="${(stampX + 24).toFixed(2)}" y="${(stampY + 28).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:14px;font-weight:700;fill:#64748b;letter-spacing:0.05em;">HARDWAROVÝ SYSTÉM</text>
        <text x="${(stampX + 24).toFixed(2)}" y="${(stampY + 56).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:19px;font-weight:700;fill:#0f172a;">${escapeXml(manufacturer.name)} — ${escapeXml(system.name)}</text>
        <text x="${(stampX + 24).toFixed(2)}" y="${(stampY + 82).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:15px;fill:#475569;">${escapeXml(system.module?.name || 'Tlačítkový modul')} • Tlačítka: ${buttonPlacement === 'left' ? 'vlevo' : buttonPlacement === 'right' ? 'vpravo' : 'bez tlačítek'}</text>
        <text x="${(stampX + 824).toFixed(2)}" y="${(stampY + 28).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:14px;font-weight:700;fill:#64748b;letter-spacing:0.05em;">PŘESNÉ FYZICKÉ ROZMĚRY PRO STŘIH (1:1)</text>
        <text x="${(stampX + 824).toFixed(2)}" y="${(stampY + 56).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:19px;font-weight:700;fill:#0284c7;">Výřez jmenovky: ${slotWidthMm.toFixed(1).replace('.', ',')} × ${slotHeightMm.toFixed(1).replace('.', ',')} mm</text>
        <text x="${(stampX + 824).toFixed(2)}" y="${(stampY + 82).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:15px;fill:#475569;">Krok slotů (rozteč): ${slotStepMm.toFixed(1).replace('.', ',')} mm • Šířka modulu: ${moduleWidthMm.toFixed(1).replace('.', ',')} mm</text>
        <text x="${(stampX + 1664).toFixed(2)}" y="${(stampY + 28).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:14px;font-weight:700;fill:#64748b;letter-spacing:0.05em;">POKYNY K TISKU A OŘEZU</text>
        <text x="${(stampX + 1664).toFixed(2)}" y="${(stampY + 56).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:17px;font-weight:700;fill:#0f172a;">Měřítko tisku: 100 % (Skutečná velikost / Bez okrajů)</text>
        <text x="${(stampX + 1664).toFixed(2)}" y="${(stampY + 82).toFixed(2)}" style="font-family:'DINish', sans-serif;font-size:15px;fill:#475569;">Šablona: ${templateRenderMode === 'cut-strips' ? 'Čisté pásy (pouze ořez)' : 'Kompletní modul'} • ${printColumn === 'all' ? `Všechny sloupce (1–${activeLayout.columns.length})` : `Sloupec ${printColumn}`}</text>
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
  `;

  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="${SVG_VIEWBOX}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve" xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <defs>
        ${styleTagOpen}
${fontFaces}
        ${styleTagClose}
    </defs>
${colTemplatesXml}    <g id="Čísla-bytů" serif:id="Čísla bytů"${idsStyle}>
${badgesXml}    </g>
    <g id="Příjmení">
${cardsXml}    </g>
${cropMarksXml}${dimensionsXml}${scaleXml}</svg>`;
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
