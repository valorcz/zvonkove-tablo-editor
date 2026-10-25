<script lang="ts">
  import { tick } from 'svelte';
  import ZoomToolbar from './ZoomToolbar.svelte';
  import type {
    FlatEntry,
    BadgeStyleId,
    PrintColumnOption,
    TableauLayoutConfig,
    NumeralFontMode,
    TemplateRenderMode,
    TemplateOutlineStyle,
  } from '../lib/types';
  import { getHardwareProfileForPreset } from '../lib/hardwareProfiles';
  import { decodeBadgeStyle, buildBadgeGeometry } from '../lib/badgeRegistry';
  import {
    SVG_VIEWBOX,
    SVG_WIDTH,
    PX_PER_MM,
    OFFSET_Y,
    SCALE_Y,
    IMAGE_SLOT_TOP_0,
    getSlotCoordinates,
    calculateFontSize,
    type FontOption,
    DEFAULT_TEXT_PADDING_LEFT,
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
    showDimensions = false,
    templateRenderMode = 'full',
    templateOutlineStyle = 'dashed-subtle',
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
    showDimensions?: boolean;
    templateRenderMode?: TemplateRenderMode;
    templateOutlineStyle?: TemplateOutlineStyle;
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

  const hardwareInfo = $derived(getHardwareProfileForPreset(layout.preset));
  const system = $derived(hardwareInfo.system);
  const manufacturer = $derived(hardwareInfo.manufacturer);

  const slotWidthMm = $derived(system.slot.widthMm || 48.63);
  const slotHeightMm = $derived(system.slot.heightMm || 12.90);
  const slotStepMm = $derived(system.module?.slotStepMm || 15.88);
  const buttonPlacement = $derived(system.module?.button?.placement || 'left');
  const buttonWidthMm = $derived(system.module?.button?.widthMm || 10.97);
  const moduleWidthMm = $derived(system.module?.moduleWidthMm || 61.64);
  const cornerRadiusMm = $derived(system.slot.cornerRadiusMm || 1.0);

  const slotWidthPx = $derived(slotWidthMm * PX_PER_MM);
  const slotHeightPx = $derived(slotHeightMm * PX_PER_MM);
  const slotStepPx = $derived(slotStepMm * PX_PER_MM);
  const buttonWidthPx = $derived(buttonWidthMm * PX_PER_MM);
  const moduleWidthPx = $derived(moduleWidthMm * PX_PER_MM);
  const cornerRadiusPx = $derived(cornerRadiusMm * PX_PER_MM);

  interface RenderCard {
    id: number;
    names: string[];
    fs: number;
    textX: number;
    lines: { text: string; y: number }[];
  }

  const cards = $derived(
    mappings
      .filter((slot) => printColumn === 'all' || slot.colIndex + 1 === printColumn)
      .map((slot) => {
        const entry = flats.find((f) => f.id === slot.slotIndex) || { id: slot.slotIndex, name1: '', name2: '' };
        const names = [entry.name1.trim(), entry.name2.trim()].filter((n) => n.length > 0);
        const idStr = entry.customNumber || slot.defaultNumber;
        const displayNames = names.length > 0 ? names : [`Byt ${idStr}`];

        const coords = getSlotCoordinates(slot.colIndex, slot.rowIndex, badgeStyle, textPaddingLeft, colOrigins, system);
        const fs = calculateFontSize(displayNames, fontOption, isBold, badgeStyle, textPaddingLeft, system);

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
        const coords = getSlotCoordinates(slot.colIndex, slot.rowIndex, badgeStyle, textPaddingLeft, colOrigins, system);
        const idStr = entry.customNumber || slot.defaultNumber;
        const { position, shape } = decodeBadgeStyle(badgeStyle);

        const slotLeft = buttonPlacement === 'left' ? coords.colX + buttonWidthPx : coords.colX;
        const slotRight = slotLeft + slotWidthPx;

        return buildBadgeGeometry({
          id: slot.slotIndex,
          idStr,
          position,
          shape,
          colX: coords.colX,
          slotTop: coords.slotTop,
          slotBottom: coords.slotBottom,
          slotCenterY: coords.slotCenterY,
          badgeColor,
          numeralFontFamily,
          slotLeft,
          slotRight,
        });
      })
  );

  const outlineAttrs = $derived.by(() => {
    switch (templateOutlineStyle) {
      case 'dashed-subtle':
        return { stroke: '#94a3b8', strokeWidth: 1.0, strokeDasharray: '4,3', opacity: 0.8 };
      case 'solid-light':
        return { stroke: '#cbd5e1', strokeWidth: 1.0, strokeDasharray: 'none', opacity: 1.0 };
      case 'solid-dark':
        return { stroke: '#000000', strokeWidth: 1.5, strokeDasharray: 'none', opacity: 1.0 };
      case 'none':
        return null;
    }
  });

  // Corner crop marks for the full module strip (to slice whole strip with cutter)
  const colCropMarks = $derived.by(() => {
    if (!showCropMarks) return [];
    const markLen = 24.0;
    const markGap = 5.0;

    const list: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let cIdx = 0; cIdx < layout.columns.length; cIdx++) {
      if (printColumn !== 'all' && cIdx + 1 !== printColumn) continue;
      const colCfg = layout.columns[cIdx];
      const colX = colOrigins[cIdx];
      const stripWidthPx = buttonPlacement === 'none' ? slotWidthPx : moduleWidthPx;
      const stripLeft = colX;
      const stripRight = colX + stripWidthPx;
      const stripTop = OFFSET_Y;
      const stripBottom = OFFSET_Y + (IMAGE_SLOT_TOP_0 * 2 * SCALE_Y) + (colCfg.capacity * slotStepPx);

      // 4 Corner marks defining the entire module paper strip
      // Top-left
      list.push({ x1: stripLeft, y1: stripTop - markGap - markLen, x2: stripLeft, y2: stripTop - markGap });
      list.push({ x1: stripLeft - markGap - markLen, y1: stripTop, x2: stripLeft - markGap, y2: stripTop });
      // Top-right
      list.push({ x1: stripRight, y1: stripTop - markGap - markLen, x2: stripRight, y2: stripTop - markGap });
      list.push({ x1: stripRight + markGap, y1: stripTop, x2: stripRight + markGap + markLen, y2: stripTop });
      // Bottom-left
      list.push({ x1: stripLeft, y1: stripBottom + markGap, x2: stripLeft, y2: stripBottom + markGap + markLen });
      list.push({ x1: stripLeft - markGap - markLen, y1: stripBottom, x2: stripLeft - markGap, y2: stripBottom });
      // Bottom-right
      list.push({ x1: stripRight, y1: stripBottom + markGap, x2: stripRight, y2: stripBottom + markGap + markLen });
      list.push({ x1: stripRight + markGap, y1: stripBottom, x2: stripRight + markGap + markLen, y2: stripBottom });

      // Intermediate divider ticks between slots on the strip borders
      for (let r = 1; r < colCfg.capacity; r++) {
        const dividerY = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y) + r * slotStepPx - (slotStepPx - slotHeightPx) / 2;
        list.push({ x1: stripLeft - markGap - 9, y1: dividerY, x2: stripLeft - markGap, y2: dividerY });
        list.push({ x1: stripRight + markGap, y1: dividerY, x2: stripRight + markGap + 9, y2: dividerY });
      }
    }
    return list;
  });

  // Ruler ticks (0 to 100 mm)
  const rulerLengthMm = 100;
  const rulerLengthPx = rulerLengthMm * PX_PER_MM;
  const startX = (SVG_WIDTH - rulerLengthPx) / 2.0;
  const rulerY = 2215;

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

        </defs>

        <!-- Column vector backgrounds -->
        {#each layout.columns as colCfg, cIdx}
          {#if printColumn === 'all' || printColumn === cIdx + 1}
            {@const cOriginX = colOrigins[cIdx]}
            {@const colHeightPx = (IMAGE_SLOT_TOP_0 * 2 * SCALE_Y) + (colCfg.capacity * slotStepPx)}
            <g id="column-template-{cIdx + 1}">
              {#if templateRenderMode === 'full'}
                <!-- Module outer border -->
                <rect
                  x={cOriginX}
                  y={OFFSET_Y}
                  width={buttonPlacement === 'none' ? slotWidthPx : moduleWidthPx}
                  height={colHeightPx}
                  fill="none"
                  stroke={templateOutlineStyle === 'solid-dark' ? '#000000' : '#94a3b8'}
                  stroke-width={templateOutlineStyle === 'solid-dark' ? 1.8 : 1.0}
                  stroke-dasharray={templateOutlineStyle === 'dashed-subtle' ? '6,4' : 'none'}
                  rx="3"
                />
              {/if}

              <!-- Slots & Buttons for column -->
              {#each Array.from({ length: colCfg.capacity }, (_, r) => r) as r}
                {@const slotTop = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y) + r * slotStepPx}
                {@const slotLeft = buttonPlacement === 'left' ? cOriginX + buttonWidthPx : cOriginX}

                <!-- Slot cutout rectangle -->
                {#if outlineAttrs}
                  <rect
                    x={slotLeft}
                    y={slotTop}
                    width={slotWidthPx}
                    height={slotHeightPx}
                    fill="none"
                    stroke={outlineAttrs.stroke}
                    stroke-width={outlineAttrs.strokeWidth}
                    stroke-dasharray={outlineAttrs.strokeDasharray}
                    opacity={outlineAttrs.opacity}
                    rx={cornerRadiusPx}
                  />
                {/if}

                {#if templateRenderMode === 'full' && buttonPlacement !== 'none'}
                  {@const btnX = buttonPlacement === 'left' ? cOriginX + 12 : cOriginX + slotWidthPx + 12}
                  {@const btnW = Math.max(20, buttonWidthPx - 24)}
                  <!-- Tactile button cutout -->
                  <rect
                    x={btnX}
                    y={slotTop + 10}
                    width={btnW}
                    height={slotHeightPx - 20}
                    rx="5"
                    fill="#f8fafc"
                    stroke="#cbd5e1"
                    stroke-width="1.0"
                  />
                  <circle
                    cx={btnX + btnW / 2}
                    cy={slotTop + slotHeightPx / 2}
                    r="11"
                    fill="#f1f5f9"
                    stroke="#94a3b8"
                    stroke-width="1.0"
                  />
                {/if}
              {/each}
            </g>
          {/if}
        {/each}

        <!-- Flat IDs Layer (Background / Badges / Watermark) -->
        {#if showIds && badgeStyle !== 'none'}
          <g id="Čísla-bytů">
            {#each badges as badge (badge.id)}
              <g id="flat-badge-{badge.idStr}">
                {#each badge.shapes as shape}
                  {#if shape.type === 'rect'}
                    <rect
                      x="{shape.x?.toFixed(2)}px"
                      y="{shape.y?.toFixed(2)}px"
                      width="{shape.width?.toFixed(2)}px"
                      height="{shape.height?.toFixed(2)}px"
                      rx="{shape.rx || 0}px"
                      ry="{shape.rx || 0}px"
                      fill={shape.fill || 'none'}
                      stroke={shape.stroke || 'none'}
                      stroke-width={shape.strokeWidth || 0}
                    />
                  {:else if shape.type === 'circle'}
                    <circle
                      cx="{shape.cx?.toFixed(2)}px"
                      cy="{shape.cy?.toFixed(2)}px"
                      r="{shape.r?.toFixed(2)}px"
                      fill={shape.fill || 'none'}
                    />
                  {:else if shape.type === 'line'}
                    <line
                      x1="{shape.x1?.toFixed(2)}"
                      y1="{shape.y1?.toFixed(2)}"
                      x2="{shape.x2?.toFixed(2)}"
                      y2="{shape.y2?.toFixed(2)}"
                      stroke={shape.stroke}
                      stroke-width={shape.strokeWidth || 1}
                    />
                  {/if}
                {/each}
                {#if badge.text}
                  <text
                    x="{badge.text.x.toFixed(2)}px"
                    y="{badge.text.y.toFixed(2)}px"
                    text-anchor={badge.text.textAnchor}
                    class="badge-text"
                    style="font-family: {badge.text.fontFamily}; font-size: {badge.text.fontSize}px; font-weight: {badge.text.fontWeight}; fill: {badge.text.fill}; {badge.text.opacity !== undefined ? `opacity: ${badge.text.opacity};` : ''}"
                  >
                    {badge.text.text}
                  </text>
                {/if}
              </g>
            {/each}
          </g>
        {/if}

        <!-- Names Layer (Foreground) -->
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

        <!-- Technical Dimension Lines Layer -->
        {#if showDimensions}
          {@const firstColIdx = printColumn === 'all' ? 0 : printColumn - 1}
          {@const firstColCfg = layout.columns[firstColIdx]}
          {#if firstColCfg}
            {@const cOriginX = colOrigins[firstColIdx]}
            {@const slot0Left = buttonPlacement === 'left' ? cOriginX + buttonWidthPx : cOriginX}
            {@const slot0Top = OFFSET_Y + (IMAGE_SLOT_TOP_0 * SCALE_Y)}
            {@const slot0Right = slot0Left + slotWidthPx}
            {@const slot0Bottom = slot0Top + slotHeightPx}
            {@const dimY = slot0Top - 42}
            {@const dimX = slot0Right + 45}
            {@const modDimY = slot0Top - 88}

            <g id="Technické-kóty">
              <!-- 1. Horizontal dimension: Slot Width -->
              <line x1={slot0Left} y1={slot0Top - 6} x2={slot0Left} y2={slot0Top - 56} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
              <line x1={slot0Right} y1={slot0Top - 6} x2={slot0Right} y2={slot0Top - 56} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
              <line x1={slot0Left + 12} y1={dimY} x2={slot0Right - 12} y2={dimY} stroke="#0f172a" stroke-width="1.8" />
              <polygon points="{slot0Left},{dimY} {slot0Left + 12},{dimY - 5} {slot0Left + 12},{dimY + 5}" fill="#0f172a" />
              <polygon points="{slot0Right},{dimY} {slot0Right - 12},{dimY - 5} {slot0Right - 12},{dimY + 5}" fill="#0f172a" />
              <rect x={slot0Left + slotWidthPx / 2 - 58} y={dimY - 14} width="116" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
              <text
                x={slot0Left + slotWidthPx / 2}
                y={dimY + 1}
                text-anchor="middle"
                dominant-baseline="central"
                style="font-family:'DINish', sans-serif; font-size: 20px; font-weight: 700; fill: #0f172a;"
              >
                {slotWidthMm.toFixed(1).replace('.', ',')} mm
              </text>

              <!-- 2. Vertical dimension: Slot Height -->
              <line x1={slot0Right + 6} y1={slot0Top} x2={slot0Right + 58} y2={slot0Top} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
              <line x1={slot0Right + 6} y1={slot0Bottom} x2={slot0Right + 58} y2={slot0Bottom} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
              <line x1={dimX} y1={slot0Top + 12} x2={dimX} y2={slot0Bottom - 12} stroke="#0f172a" stroke-width="1.8" />
              <polygon points="{dimX},{slot0Top} {dimX - 5},{slot0Top + 12} {dimX + 5},{slot0Top + 12}" fill="#0f172a" />
              <polygon points="{dimX},{slot0Bottom} {dimX - 5},{slot0Bottom - 12} {dimX + 5},{slot0Bottom - 12}" fill="#0f172a" />
              <rect x={dimX + 12} y={slot0Top + slotHeightPx / 2 - 13} width="96" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
              <text
                x={dimX + 60}
                y={slot0Top + slotHeightPx / 2 + 1}
                text-anchor="middle"
                dominant-baseline="central"
                style="font-family:'DINish', sans-serif; font-size: 20px; font-weight: 700; fill: #0f172a;"
              >
                {slotHeightMm.toFixed(1).replace('.', ',')} mm
              </text>

              <!-- 3. Pitch dimension between row 0 and row 1 -->
              {#if firstColCfg.capacity >= 2}
                {@const slot1Top = slot0Top + slotStepPx}
                {@const pitchDimX = slot0Left - 45}
                <line x1={slot0Left - 6} y1={slot0Top} x2={slot0Left - 58} y2={slot0Top} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
                <line x1={slot0Left - 6} y1={slot1Top} x2={slot0Left - 58} y2={slot1Top} stroke="#475569" stroke-width="1.2" stroke-dasharray="3,3" />
                <line x1={pitchDimX} y1={slot0Top + 12} x2={pitchDimX} y2={slot1Top - 12} stroke="#0f172a" stroke-width="1.8" />
                <polygon points="{pitchDimX},{slot0Top} {pitchDimX - 5},{slot0Top + 12} {pitchDimX + 5},{slot0Top + 12}" fill="#0f172a" />
                <polygon points="{pitchDimX},{slot1Top} {pitchDimX - 5},{slot1Top - 12} {pitchDimX + 5},{slot1Top - 12}" fill="#0f172a" />
                <rect x={pitchDimX - 165} y={slot0Top + slotStepPx / 2 - 13} width="155" height="26" rx="4" fill="#ffffff" stroke="#94a3b8" stroke-width="1" />
                <text
                  x={pitchDimX - 88}
                  y={slot0Top + slotStepPx / 2 + 1}
                  text-anchor="middle"
                  dominant-baseline="central"
                  style="font-family:'DINish', sans-serif; font-size: 18px; font-weight: 600; fill: #1e293b;"
                >
                  rozteč {slotStepMm.toFixed(1).replace('.', ',')} mm
                </text>
              {/if}

              <!-- 4. Module width dimension -->
              {#if templateRenderMode === 'full' && buttonPlacement !== 'none'}
                <line x1={cOriginX} y1={slot0Top - 6} x2={cOriginX} y2={slot0Top - 100} stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
                <line x1={cOriginX + moduleWidthPx} y1={slot0Top - 6} x2={cOriginX + moduleWidthPx} y2={slot0Top - 100} stroke="#94a3b8" stroke-width="1" stroke-dasharray="3,3" />
                <line x1={cOriginX + 12} y1={modDimY} x2={cOriginX + moduleWidthPx - 12} y2={modDimY} stroke="#475569" stroke-width="1.5" />
                <polygon points="{cOriginX},{modDimY} {cOriginX + 12},{modDimY - 4} {cOriginX + 12},{modDimY + 4}" fill="#475569" />
                <polygon points="{cOriginX + moduleWidthPx},{modDimY} {cOriginX + moduleWidthPx - 12},{modDimY - 4} {cOriginX + moduleWidthPx - 12},{modDimY + 4}" fill="#475569" />
                <rect x={cOriginX + moduleWidthPx / 2 - 100} y={modDimY - 14} width="200" height="24" rx="4" fill="#ffffff" stroke="#cbd5e1" stroke-width="1" />
                <text
                  x={cOriginX + moduleWidthPx / 2}
                  y={modDimY}
                  text-anchor="middle"
                  dominant-baseline="central"
                  style="font-family:'DINish', sans-serif; font-size: 17px; font-weight: 600; fill: #475569;"
                >
                  celý modul {moduleWidthMm.toFixed(1).replace('.', ',')} mm
                </text>
              {/if}
            </g>
          {/if}
        {/if}

        <!-- 100 mm Printable Calibration Scale & Engineering Stamp -->
        {#if showScale}
          {@const stampW = 2460}
          {@const stampH = 105}
          {@const stampX = (SVG_WIDTH - stampW) / 2}
          {@const stampY = rulerY + 50}
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

            <!-- Scale title -->
            <text
              x={SVG_WIDTH / 2.0}
              y={rulerY + 32}
              text-anchor="middle"
              class="scale-text"
              style="font-size: 22px; font-weight: 700; fill: #0f172a;"
            >
              KONTROLNÍ MĚŘÍTKO 1:1 (PŘESNĚ 100 mm / 10 cm) • PŘED ŘEZÁNÍM OVĚŘTE PRAVÍTKEM
            </text>

            <!-- Engineering technical stamp -->
            <rect
              x={stampX}
              y={stampY}
              width={stampW}
              height={stampH}
              rx="6"
              fill="#f8fafc"
              stroke="#64748b"
              stroke-width="1.8"
            />
            <!-- Vertical dividers -->
            <line x1={stampX + 800} y1={stampY} x2={stampX + 800} y2={stampY + stampH} stroke="#cbd5e1" stroke-width="1.2" />
            <line x1={stampX + 1640} y1={stampY} x2={stampX + 1640} y2={stampY + stampH} stroke="#cbd5e1" stroke-width="1.2" />

            <!-- Col 1: Hardware system -->
            <text x={stampX + 24} y={stampY + 28} style="font-family:'DINish', sans-serif; font-size: 14px; font-weight: 700; fill: #64748b; letter-spacing: 0.05em;">
              HARDWAROVÝ SYSTÉM
            </text>
            <text x={stampX + 24} y={stampY + 56} style="font-family:'DINish', sans-serif; font-size: 19px; font-weight: 700; fill: #0f172a;">
              {manufacturer.name} — {system.name}
            </text>
            <text x={stampX + 24} y={stampY + 82} style="font-family:'DINish', sans-serif; font-size: 15px; fill: #475569;">
              {system.module?.name || 'Tlačítkový modul'} • Tlačítka: {buttonPlacement === 'left' ? 'vlevo' : buttonPlacement === 'right' ? 'vpravo' : 'bez tlačítek'}
            </text>

            <!-- Col 2: Dimensions -->
            <text x={stampX + 824} y={stampY + 28} style="font-family:'DINish', sans-serif; font-size: 14px; font-weight: 700; fill: #64748b; letter-spacing: 0.05em;">
              PŘESNÉ FYZICKÉ ROZMĚRY PRO STŘIH (1:1)
            </text>
            <text x={stampX + 824} y={stampY + 56} style="font-family:'DINish', sans-serif; font-size: 19px; font-weight: 700; fill: #0284c7;">
              Výřez jmenovky: {slotWidthMm.toFixed(1).replace('.', ',')} × {slotHeightMm.toFixed(1).replace('.', ',')} mm
            </text>
            <text x={stampX + 824} y={stampY + 82} style="font-family:'DINish', sans-serif; font-size: 15px; fill: #475569;">
              Krok slotů (rozteč): {slotStepMm.toFixed(1).replace('.', ',')} mm • Šířka modulu: {moduleWidthMm.toFixed(1).replace('.', ',')} mm
            </text>

            <!-- Col 3: Print instructions -->
            <text x={stampX + 1664} y={stampY + 28} style="font-family:'DINish', sans-serif; font-size: 14px; font-weight: 700; fill: #64748b; letter-spacing: 0.05em;">
              POKYNY K TISKU A OŘEZU
            </text>
            <text x={stampX + 1664} y={stampY + 56} style="font-family:'DINish', sans-serif; font-size: 17px; font-weight: 700; fill: #0f172a;">
              Měřítko tisku: 100 % (Skutečná velikost / Bez okrajů)
            </text>
            <text x={stampX + 1664} y={stampY + 82} style="font-family:'DINish', sans-serif; font-size: 15px; fill: #475569;">
              Šablona: {templateRenderMode === 'cut-strips' ? 'Čisté pásy (pouze ořez)' : 'Kompletní modul'} • {printColumn === 'all' ? `Všechny sloupce (1–${layout.columns.length})` : `Sloupec ${printColumn}`}
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
      overflow: hidden !important;
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
    }
    .svg-scroll-viewport {
      overflow: hidden !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      display: block !important;
      border: none !important;
    }
    .svg-canvas-box {
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      margin: 0 !important;
      padding: 0 !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      transform: none !important;
      aspect-ratio: auto !important;
    }
    svg {
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      box-shadow: none !important;
      border: none !important;
      border-radius: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      display: block !important;
      background: #ffffff !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
  }
</style>
