<script lang="ts">
  import { tick } from 'svelte';
  import ZoomToolbar from './ZoomToolbar.svelte';
  import type { FlatEntry, BadgeStyleId, PrintColumnOption, TableauLayoutConfig, NumeralFontMode } from '../lib/types';
  import {
    SVG_VIEWBOX,
    SVG_WIDTH,
    PX_PER_MM,
    getSlotCoordinates,
    calculateFontSize,
    type FontOption,
    BADGE_WIDTH,
    BADGE_HEIGHT,
    BADGE_RX,
    BADGE_FONT_SIZE,
    DEFAULT_TEXT_PADDING_LEFT,
    getWatermarkStyle,
    getDefaultLayout,
    computeSlotMapping,
    computeColumnOrigins,
  } from '../lib/tableauConfig';

  let {
    flats,
    showIds,
    badgeColor,
    fontOption,
    isBold,
    showScale = true,
    badgeStyle = 'classic',
    showCropMarks = true,
    textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT,
    printColumn = 'all',
    layout = getDefaultLayout(),
    numeralFontMode = 'iosevka',
  }: {
    flats: FlatEntry[];
    showIds: boolean;
    badgeColor: string;
    fontOption: FontOption;
    isBold: boolean;
    showScale?: boolean;
    badgeStyle?: BadgeStyleId;
    showCropMarks?: boolean;
    textPaddingLeft?: number;
    printColumn?: PrintColumnOption;
    layout?: TableauLayoutConfig;
    numeralFontMode?: NumeralFontMode;
  } = $props();

  const fontWeight = $derived(
    isBold ? (fontOption.id === 'Iosevka' ? 600 : 700) : 400
  );

  const letterSpacing = $derived(
    fontOption.id === 'TechnicNT' || fontOption.id === 'DIN' ? '0.025em' : 'normal'
  );

  const numeralFontFamily = $derived(
    numeralFontMode === 'inherit'
      ? fontOption.fontFamily
      : "'Iosevka-Fixed-Bold', 'Iosevka Fixed', monospace"
  );

  const colOrigins = $derived(computeColumnOrigins(layout));
  const mappings = $derived(computeSlotMapping(layout));

  interface RenderCard {
    id: number;
    names: string[];
    fs: number;
    textX: number;
    lines: { text: string; y: number }[];
  }

  interface RenderBadge {
    id: number;
    idStr: string;
    shapeType: 'classic' | 'outline' | 'circle' | 'left-block' | 'corner-index' | 'inline-num' | 'watermark';
    rectX: number;
    rectY: number;
    rectW: number;
    rectH: number;
    rx: number;
    cx: number;
    cy: number;
    textY: number;
    fontSize: number;
    showDivider: boolean;
    dividerX: number;
    dividerY1: number;
    dividerY2: number;
    opacity: number;
    color: string;
  }

  const cards = $derived(
    mappings
      .filter((slot) => printColumn === 'all' || slot.colIndex + 1 === printColumn)
      .map((slot) => {
        const entry = flats.find((f) => f.id === slot.slotIndex) || { id: slot.slotIndex, name1: '', name2: '' };
        const names = [entry.name1.trim(), entry.name2.trim()].filter((n) => n.length > 0);
        const idStr = entry.customNumber || slot.defaultNumber;
        const displayNames = names.length > 0 ? names : [`Byt ${idStr}`];

        const coords = getSlotCoordinates(slot.colIndex, slot.rowIndex, badgeStyle, textPaddingLeft, colOrigins);
        const fs = calculateFontSize(displayNames, fontOption, isBold, badgeStyle, textPaddingLeft);

        const lines: { text: string; y: number }[] = [];
        if (displayNames.length === 1) {
          lines.push({
            text: displayNames[0],
            y: coords.slotCenterY + 0.38 * fs,
          });
        } else {
          const lineHeight = fs * 1.18;
          lines.push({
            text: displayNames[0],
            y: coords.slotCenterY - 0.5 * lineHeight + 0.38 * fs,
          });
          lines.push({
            text: displayNames[1],
            y: coords.slotCenterY + 0.5 * lineHeight + 0.38 * fs,
          });
        }

        return {
          id: slot.slotIndex,
          names: displayNames,
          fs,
          textX: coords.textX,
          lines,
        } as RenderCard;
      })
  );

  const badges = $derived(
    mappings
      .filter((slot) => printColumn === 'all' || slot.colIndex + 1 === printColumn)
      .map((slot) => {
        const entry = flats.find((f) => f.id === slot.slotIndex) || { id: slot.slotIndex, name1: '', name2: '' };
        const coords = getSlotCoordinates(slot.colIndex, slot.rowIndex, badgeStyle, textPaddingLeft, colOrigins);
        const idStr = entry.customNumber || slot.defaultNumber;

        if (badgeStyle === 'left-block') {
          const blockX = coords.colX + 129.54;
          const blockY = coords.slotTop;
          const blockW = 76.0;
          const blockH = coords.slotBottom - coords.slotTop;
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'left-block',
            rectX: blockX,
            rectY: blockY,
            rectW: blockW,
            rectH: blockH,
            rx: 0,
            cx: blockX + blockW / 2.0,
            cy: coords.slotCenterY,
            textY: coords.slotCenterY + 14.0,
            fontSize: 42,
            showDivider: true,
            dividerX: blockX + blockW,
            dividerY1: blockY,
            dividerY2: coords.slotBottom,
            opacity: 1,
            color: badgeColor,
          } as RenderBadge;
        }

        if (badgeStyle === 'inline-num') {
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'inline-num',
            rectX: 0,
            rectY: 0,
            rectW: 0,
            rectH: 0,
            rx: 0,
            cx: coords.colX + 665.0,
            cy: coords.slotCenterY,
            textY: coords.slotCenterY + 13.0,
            fontSize: 36,
            showDivider: false,
            dividerX: 0,
            dividerY1: 0,
            dividerY2: 0,
            opacity: 1,
            color: '#000000',
          } as RenderBadge;
        }

        if (badgeStyle === 'corner-index') {
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'corner-index',
            rectX: 0,
            rectY: 0,
            rectW: 0,
            rectH: 0,
            rx: 0,
            cx: coords.colX + 675.0,
            cy: coords.slotTop + 34.0,
            textY: coords.slotTop + 34.0,
            fontSize: 26,
            showDivider: false,
            dividerX: 0,
            dividerY1: 0,
            dividerY2: 0,
            opacity: 1,
            color: '#000000',
          } as RenderBadge;
        }

        if (badgeStyle === 'circle') {
          const cx = coords.badgeCx;
          const cy = coords.badgeCy;
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'circle',
            rectX: 0,
            rectY: 0,
            rectW: 0,
            rectH: 0,
            rx: 0,
            cx,
            cy,
            textY: cy + 13.0,
            fontSize: BADGE_FONT_SIZE,
            showDivider: false,
            dividerX: 0,
            dividerY1: 0,
            dividerY2: 0,
            opacity: 1,
            color: badgeColor,
          } as RenderBadge;
        }

        if (badgeStyle === 'outline') {
          const cx = coords.badgeCx;
          const cy = coords.badgeCy;
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'outline',
            rectX: cx - BADGE_WIDTH / 2.0,
            rectY: cy - BADGE_HEIGHT / 2.0,
            rectW: BADGE_WIDTH,
            rectH: BADGE_HEIGHT,
            rx: BADGE_RX,
            cx,
            cy,
            textY: cy + 13.0,
            fontSize: BADGE_FONT_SIZE,
            showDivider: false,
            dividerX: 0,
            dividerY1: 0,
            dividerY2: 0,
            opacity: 1,
            color: badgeColor,
          } as RenderBadge;
        }

        if (badgeStyle === 'watermark') {
          const wm = getWatermarkStyle(badgeColor);
          return {
            id: slot.slotIndex,
            idStr,
            shapeType: 'watermark',
            rectX: 0,
            rectY: 0,
            rectW: 0,
            rectH: 0,
            rx: 0,
            cx: coords.colX + 636.0,
            cy: coords.slotCenterY,
            textY: coords.slotCenterY + 28.0,
            fontSize: 84,
            showDivider: false,
            dividerX: 0,
            dividerY1: 0,
            dividerY2: 0,
            opacity: wm.opacity,
            color: wm.fill,
          } as RenderBadge;
        }

        // Default: 'classic' badge
        const cx = coords.badgeCx;
        const cy = coords.badgeCy;
        return {
          id: slot.slotIndex,
          idStr,
          shapeType: 'classic',
          rectX: cx - BADGE_WIDTH / 2.0,
          rectY: cy - BADGE_HEIGHT / 2.0,
          rectW: BADGE_WIDTH,
          rectH: BADGE_HEIGHT,
          rx: BADGE_RX,
          cx,
          cy,
          textY: cy + 13.0,
          fontSize: BADGE_FONT_SIZE,
          showDivider: false,
          dividerX: 0,
          dividerY1: 0,
          dividerY2: 0,
          opacity: 1,
          color: badgeColor,
        } as RenderBadge;
      })
  );

  // Corner crop marks for columns
  const colCropMarks = $derived.by(() => {
    if (!showCropMarks) return [];
    const colW = 621.0 * 1.17229;
    const topY = 210.788;
    const markLen = 22.0;
    const markGap = 5.0;

    const list: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let cIdx = 0; cIdx < layout.columns.length; cIdx++) {
      if (printColumn !== 'all' && cIdx + 1 !== printColumn) continue;
      const colCfg = layout.columns[cIdx];
      const colH = (colCfg.capacity === 5 ? 811.0 : 1611.0) * 1.17231;
      const botY = topY + colH;
      const colX = colOrigins[cIdx];
      const rightX = colX + colW;

      // Top-left
      list.push({ x1: colX, y1: topY - markGap - markLen, x2: colX, y2: topY - markGap });
      list.push({ x1: colX - markGap - markLen, y1: topY, x2: colX - markGap, y2: topY });
      // Top-right
      list.push({ x1: rightX, y1: topY - markGap - markLen, x2: rightX, y2: topY - markGap });
      list.push({ x1: rightX + markGap, y1: topY, x2: rightX + markGap + markLen, y2: topY });
      // Bottom-left
      list.push({ x1: colX, y1: botY + markGap, x2: colX, y2: botY + markGap + markLen });
      list.push({ x1: colX - markGap - markLen, y1: botY, x2: colX - markGap, y2: botY });
      // Bottom-right
      list.push({ x1: rightX, y1: botY + markGap, x2: rightX, y2: botY + markGap + markLen });
      list.push({ x1: rightX + markGap, y1: botY, x2: rightX + markGap + markLen, y2: botY });
    }
    return list;
  });

  // Ruler ticks (0 to 100 mm)
  const rulerLengthMm = 100;
  const rulerLengthPx = rulerLengthMm * PX_PER_MM;
  const startX = (SVG_WIDTH - rulerLengthPx) / 2.0;
  const rulerY = 2270;

  const rulerTicks = Array.from({ length: rulerLengthMm + 1 }, (_, mm) => {
    const x = startX + mm * PX_PER_MM;
    const isMajor = mm % 10 === 0;
    const isMid = mm % 5 === 0 && !isMajor;
    const tickHeight = isMajor ? 26 : (isMid ? 16 : 9);
    return {
      x,
      y1: rulerY,
      y2: rulerY - tickHeight,
      strokeWidth: isMajor ? 2 : 1,
      isMajor,
      cmVal: isMajor ? mm / 10 : null,
    };
  });

  const templateSlotYs10 = Array.from({ length: 10 }, (_, i) => 15.5 + i * 160.0);
  const templateSlotYs5 = Array.from({ length: 5 }, (_, i) => 15.5 + i * 160.0);

  // --- Zoom & Viewport Controls ---
  let zoomLevel: number = $state(1.0);
  let activeFocus: string = $state('all');
  let viewportEl: HTMLDivElement | null = $state(null);
  let canvasBoxEl: HTMLDivElement | null = $state(null);

  // --- Pan / Drag by Mouse & Touch ---
  let isPanning: boolean = $state(false);
  let panStartX = 0;
  let panStartY = 0;
  let startScrollLeft = 0;
  let startScrollTop = 0;

  function resetZoom() {
    zoomLevel = 1.0;
    activeFocus = 'all';
    if (viewportEl) {
      viewportEl.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  }

  function zoomIn() {
    activeFocus = 'all';
    zoomLevel = Math.min(4.0, Math.round((zoomLevel + 0.25) * 100) / 100);
  }

  function zoomOut() {
    activeFocus = 'all';
    zoomLevel = Math.max(0.5, Math.round((zoomLevel - 0.25) * 100) / 100);
  }

  async function focusColumn(colKey: string, cIdx?: number) {
    activeFocus = colKey;
    if (colKey === 'all' || cIdx === undefined) {
      resetZoom();
      return;
    }

    zoomLevel = 2.6;
    await tick();

    setTimeout(() => {
      if (!viewportEl || !canvasBoxEl) return;
      const canvasW = canvasBoxEl.getBoundingClientRect().width;
      const viewW = viewportEl.clientWidth;

      const colOriginsList = computeColumnOrigins(layout);
      const colOrigin = colOriginsList[cIdx] ?? 275.151;
      const colWidth = 621.0 * 1.17229;
      const colCenterX = colOrigin + colWidth / 2.0;
      const targetRatio = colCenterX / 3508.0;

      const pixelX = targetRatio * canvasW;
      const targetX = Math.max(0, pixelX - viewW / 2.0);

      const canvasH = canvasBoxEl.getBoundingClientRect().height;
      const viewH = viewportEl.clientHeight;
      const pixelY = (1154.0 / 2481.0) * canvasH;
      const targetY = Math.max(0, pixelY - viewH / 2.0);

      viewportEl.scrollTo({
        left: targetX,
        top: targetY,
        behavior: 'smooth',
      });

      // Quick fallback check: if smooth scroll didn't move immediately
      setTimeout(() => {
        if (viewportEl && Math.abs(viewportEl.scrollLeft - targetX) > 5) {
          viewportEl.scrollLeft = targetX;
          viewportEl.scrollTop = targetY;
        }
      }, 150);
    }, 40);
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }

  function handlePointerDown(e: PointerEvent) {
    if (e.button !== 0 || !viewportEl) return;
    if ((e.target as HTMLElement).closest('.no-print')) return;

    isPanning = true;
    panStartX = e.clientX;
    panStartY = e.clientY;
    startScrollLeft = viewportEl.scrollLeft;
    startScrollTop = viewportEl.scrollTop;
    try {
      viewportEl.setPointerCapture(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isPanning || !viewportEl) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    viewportEl.scrollLeft = startScrollLeft - dx;
    viewportEl.scrollTop = startScrollTop - dy;
  }

  function handlePointerUp(e: PointerEvent) {
    if (!isPanning || !viewportEl) return;
    isPanning = false;
    try {
      viewportEl.releasePointerCapture(e.pointerId);
    } catch {}
  }

  function handlePointerCancel(e: PointerEvent) {
    handlePointerUp(e);
  }
</script>

<div class="preview-wrapper">
  <!-- Floating Zoom & Column Widget (Hidden in print) -->
  <ZoomToolbar
    columns={layout.columns}
    {zoomLevel}
    {activeFocus}
    onFocusColumn={focusColumn}
    onZoomIn={zoomIn}
    onZoomOut={zoomOut}
    onResetZoom={resetZoom}
  />

  <!-- Scrollable Viewport with Pan / Drag -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="svg-scroll-viewport"
    class:is-panning={isPanning}
    bind:this={viewportEl}
    onwheel={handleWheel}
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
    onpointerup={handlePointerUp}
    onpointercancel={handlePointerCancel}
  >
    <div
      class="svg-canvas-box"
      bind:this={canvasBoxEl}
      style="width: {zoomLevel === 1.0 ? '100%' : `${zoomLevel * 100}%`};"
    >
      <svg
        viewBox={SVG_VIEWBOX}
        width="100%"
        height="100%"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
      >
        <defs>
          <style>
            .name-text {
              fill: #000000;
            }
            .badge-text {
              font-family: {numeralFontFamily};
              font-variant-numeric: tabular-nums;
              font-weight: 700;
              fill: #000000;
            }
            .scale-text {
              font-family: 'DINish', sans-serif;
              fill: #000000;
            }
          </style>

          <!-- 10-slot Column Template -->
          <g id="_ColumnTemplate10">
            <rect x="0.5" y="0.5" width="621" height="1611" fill="none" stroke="#000000" stroke-width="1.5" />
            {#each templateSlotYs10 as y}
              <rect x="110.5" y={y} width="490" height="130" fill="none" stroke="#000000" stroke-width="1.5" />
            {/each}
          </g>

          <!-- 5-slot Column Template -->
          <g id="_ColumnTemplate5">
            <rect x="0.5" y="0.5" width="621" height="811" fill="none" stroke="#000000" stroke-width="1.5" />
            {#each templateSlotYs5 as y}
              <rect x="110.5" y={y} width="490" height="130" fill="none" stroke="#000000" stroke-width="1.5" />
            {/each}
          </g>
        </defs>

        <!-- Column vector backgrounds -->
        {#each layout.columns as colCfg, cIdx}
          {#if printColumn === 'all' || printColumn === cIdx + 1}
            <g transform="matrix(1.17229,0,0,1.17231,{colOrigins[cIdx]},210.788)">
              <use xlink:href={colCfg.capacity === 5 ? '#_ColumnTemplate5' : '#_ColumnTemplate10'} />
            </g>
          {/if}
        {/each}

        <!-- Names Layer -->
        <g id="Příjmení">
          {#each cards as card (card.id)}
            <g id="card-flat-{String(card.id).padStart(2, '0')}">
              {#each card.lines as line}
                <text
                  x="{card.textX.toFixed(2)}px"
                  y="{line.y.toFixed(2)}px"
                  class="name-text"
                  style="font-family: {fontOption.fontFamily}; font-weight: {fontWeight}; font-size: {card.fs.toFixed(3)}px; letter-spacing: {letterSpacing};"
                >
                  {line.text}
                </text>
              {/each}
            </g>
          {/each}
        </g>

        <!-- Flat IDs Layer -->
        {#if showIds && badgeStyle !== 'none'}
          <g id="Čísla-bytů">
            {#each badges as badge (badge.id)}
              <g id="flat-badge-{badge.idStr}">
                {#if badge.shapeType === 'watermark'}
                  <text
                    x="{badge.cx.toFixed(2)}px"
                    y="{badge.textY.toFixed(2)}px"
                    text-anchor="middle"
                    class="badge-text"
                    style="font-size: {badge.fontSize}px; font-weight: 800; fill: {badge.color}; opacity: {badge.opacity};"
                  >
                    {badge.idStr}
                  </text>
                {:else if badge.shapeType === 'inline-num' || badge.shapeType === 'corner-index'}
                  <text
                    x="{badge.cx.toFixed(2)}px"
                    y="{badge.textY.toFixed(2)}px"
                    text-anchor="middle"
                    class="badge-text"
                    style="font-size: {badge.fontSize}px;"
                  >
                    {badge.idStr}
                  </text>
                {:else if badge.shapeType === 'circle'}
                  <circle
                    cx="{badge.cx.toFixed(2)}px"
                    cy="{badge.cy.toFixed(2)}px"
                    r="27px"
                    style="fill: {badge.color};"
                  />
                  <text
                    x="{badge.cx.toFixed(2)}px"
                    y="{badge.textY.toFixed(2)}px"
                    text-anchor="middle"
                    class="badge-text"
                    style="font-size: {badge.fontSize}px;"
                  >
                    {badge.idStr}
                  </text>
                {:else if badge.shapeType === 'outline'}
                  <rect
                    x="{badge.rectX.toFixed(2)}px"
                    y="{badge.rectY.toFixed(2)}px"
                    width="{badge.rectW}px"
                    height="{badge.rectH}px"
                    rx="{badge.rx}px"
                    ry="{badge.rx}px"
                    style="fill: none; stroke: {badge.color}; stroke-width: 2.5px;"
                  />
                  <text
                    x="{badge.cx.toFixed(2)}px"
                    y="{badge.textY.toFixed(2)}px"
                    text-anchor="middle"
                    class="badge-text"
                    style="font-size: {badge.fontSize}px;"
                  >
                    {badge.idStr}
                  </text>
                {:else}
                  <rect
                    x="{badge.rectX.toFixed(2)}px"
                    y="{badge.rectY.toFixed(2)}px"
                    width="{badge.rectW}px"
                    height="{badge.rectH}px"
                    rx="{badge.rx}px"
                    ry="{badge.rx}px"
                    style="fill: {badge.color};"
                  />
                  {#if badge.showDivider}
                    <line
                      x1="{badge.dividerX.toFixed(2)}"
                      y1="{badge.dividerY1.toFixed(2)}"
                      x2="{badge.dividerX.toFixed(2)}"
                      y2="{badge.dividerY2.toFixed(2)}"
                      stroke="#cbd5e1"
                      stroke-width="2"
                    />
                  {/if}
                  <text
                    x="{badge.cx.toFixed(2)}px"
                    y="{badge.textY.toFixed(2)}px"
                    text-anchor="middle"
                    class="badge-text"
                    style="font-size: {badge.fontSize}px;"
                  >
                    {badge.idStr}
                  </text>
                {/if}
              </g>
            {/each}
          </g>
        {/if}

        <!-- Crop Marks Layer -->
        {#if showCropMarks}
          <g id="Ořezové-značky">
            {#each colCropMarks as mark}
              <line
                x1="{mark.x1.toFixed(2)}"
                y1="{mark.y1.toFixed(2)}"
                x2="{mark.x2.toFixed(2)}"
                y2="{mark.y2.toFixed(2)}"
                stroke="#94a3b8"
                stroke-width="1.2"
              />
            {/each}
          </g>
        {/if}

        <!-- 100 mm Printable Calibration Scale -->
        {#if showScale}
          <g id="Měřítko-tisku">
            <line
              x1={startX}
              y1={rulerY}
              x2={startX + rulerLengthPx}
              y2={rulerY}
              stroke="#000000"
              stroke-width="2.5"
            />
            {#each rulerTicks as tick}
              <line
                x1={tick.x}
                y1={tick.y1}
                x2={tick.x}
                y2={tick.y2}
                stroke="#000000"
                stroke-width={tick.strokeWidth}
              />
              {#if tick.isMajor && tick.cmVal !== null}
                <text
                  x={tick.x}
                  y={rulerY - 32}
                  text-anchor="middle"
                  class="scale-text"
                  style="font-size: 22px; font-weight: 600;"
                >
                  {tick.cmVal}
                </text>
              {/if}
            {/each}
            <text
              x={SVG_WIDTH / 2.0}
              y={rulerY + 36}
              text-anchor="middle"
              class="scale-text"
              style="font-size: 26px; font-weight: 700;"
            >
              KONTROLNÍ MĚŘÍTKO 1:1 (PŘESNĚ 100 mm / 10 cm)
            </text>
            <text
              x={SVG_WIDTH / 2.0}
              y={rulerY + 68}
              text-anchor="middle"
              class="scale-text"
              style="font-size: 20px; fill: #475569;"
            >
              Při tisku zkontrolujte pravítkem. Pokud úsečka neměří přesně 100 mm, nastavte okraje na Žádné a měřítko na 100%.
            </text>
            <text
              x={SVG_WIDTH / 2.0}
              y={rulerY + 96}
              text-anchor="middle"
              class="scale-text"
              style="font-size: 18px; fill: #64748b;"
            >
              Rozměr jednoho štítku: 48,6 × 12,9 mm {layout.printMode === 'compact-strips' ? '• Úsporný tisk modulů (Nesting)' : ''}
            </text>
          </g>
        {/if}
      </svg>
    </div>
  </div>
</div>

<style>
  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: #cbd5e1;
  }

  .svg-scroll-viewport {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: auto;
    display: flex;
    align-items: flex-start;
    padding: 3.5rem 1.5rem 1.5rem 1.5rem;
    box-sizing: border-box;
    cursor: grab;
    user-select: none;
    touch-action: none;
  }

  .svg-scroll-viewport.is-panning {
    cursor: grabbing;
  }

  .svg-canvas-box {
    margin: auto;
    flex-shrink: 0;
    max-width: none;
  }

  svg {
    display: block;
    width: 100%;
    height: auto;
    aspect-ratio: 3508 / 2481;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.16);
    border-radius: 4px;
  }

  @media print {
    .preview-wrapper {
      background: transparent !important;
      position: static !important;
      overflow: visible !important;
      width: 100% !important;
      height: 100% !important;
    }
    .svg-scroll-viewport {
      overflow: visible !important;
      padding: 0 !important;
      display: block !important;
    }
    .svg-canvas-box {
      width: 100% !important;
      max-width: 100% !important;
      box-shadow: none !important;
      border-radius: 0 !important;
      aspect-ratio: auto !important;
    }
  }
</style>
