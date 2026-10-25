<script lang="ts">
  import type { BadgeStyleId, NumeralFontMode } from '../../lib/types';
  import {
    getSlotCoordinates,
    calculateFontSize,
    type FontOption,
  } from '../../lib/tableauConfig';
  import { decodeBadgeStyle, buildBadgeGeometry } from '../../lib/badgeRegistry';

  let {
    badgeStyle = 'classic',
    badgeColor = '#FFE6C7',
    currentFontOption,
    isBold = true,
    showIds = false,
    textPaddingLeft = 88.5,
    numeralFontMode = 'iosevka',
    onClose = () => {},
  }: {
    badgeStyle: BadgeStyleId;
    badgeColor: string;
    currentFontOption: FontOption;
    isBold: boolean;
    showIds: boolean;
    textPaddingLeft: number;
    numeralFontMode?: NumeralFontMode;
    onClose?: () => void;
  } = $props();

  const sampleSlotW = 574.42;
  const sampleSlotH = 152.4;
  const sampleNames = ['Jan Novák', 'Marie Nováková'];

  const numeralFontFamily = $derived(
    numeralFontMode === 'inherit'
      ? currentFontOption.fontFamily
      : "'Iosevka-Fixed-Bold', monospace"
  );

  const sampleBadge = $derived.by(() => {
    const { position, shape } = decodeBadgeStyle(badgeStyle);
    return buildBadgeGeometry({
      id: 1,
      idStr: '01',
      position,
      shape,
      colX: 0,
      slotTop: 0,
      slotBottom: sampleSlotH,
      slotCenterY: sampleSlotH / 2.0,
      badgeColor,
      numeralFontFamily,
      slotLeft: 0,
      slotRight: sampleSlotW,
    });
  });

  const sampleMetrics = $derived.by(() => {
    const coords = getSlotCoordinates(0, 0, badgeStyle, textPaddingLeft);
    const relTextX = coords.textX - (coords.colX + 129.54);
    const relCenterY = sampleSlotH / 2.0;
    const fs = calculateFontSize(sampleNames, currentFontOption, isBold, badgeStyle, textPaddingLeft);

    const isTwoLines = sampleNames.length > 1;
    const lineHeight = fs * 1.18;
    const b1 = isTwoLines
      ? relCenterY - 0.5 * lineHeight + 0.38 * fs
      : relCenterY + 0.38 * fs;
    const b2 = isTwoLines ? relCenterY + 0.5 * lineHeight + 0.38 * fs : 0;

    return {
      relTextX,
      relCenterY,
      fs,
      b1,
      b2,
      fontWeight: isBold ? (currentFontOption.id === 'Iosevka' ? 600 : 700) : 400,
    };
  });
</script>

<div class="sample-preview-card">
  <div class="sample-preview-header">
    <div class="sample-title-wrap">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span class="sample-label">Živý vzorový štítek (1:1 náhled změn)</span>
    </div>
    <button type="button" class="btn-done" onclick={onClose} title="Zavřít a přejít na jmenovky">
      Hotovo ✕
    </button>
  </div>

  <div class="sample-canvas-box">
    <svg
      viewBox="0 0 {sampleSlotW} {sampleSlotH}"
      width="100%"
      height="100%"
      class="sample-svg"
    >
      <!-- Background white slot plate -->
      <rect x="0" y="0" width={sampleSlotW} height={sampleSlotH} fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />

      <!-- Badge layer (Background / Watermark) -->
      {#if showIds && badgeStyle !== 'none'}
        {#each sampleBadge.shapes as shape}
          {#if shape.type === 'rect'}
            <rect
              x="{shape.x}px"
              y="{shape.y}px"
              width="{shape.width}px"
              height="{shape.height}px"
              rx="{shape.rx || 0}px"
              ry="{shape.rx || 0}px"
              fill={shape.fill || 'none'}
              stroke={shape.stroke || 'none'}
              stroke-width={shape.strokeWidth || 0}
            />
          {:else if shape.type === 'circle'}
            <circle
              cx="{shape.cx}px"
              cy="{shape.cy}px"
              r="{shape.r}px"
              fill={shape.fill || 'none'}
            />
          {:else if shape.type === 'line'}
            <line
              x1="{shape.x1}"
              y1="{shape.y1}"
              x2="{shape.x2}"
              y2="{shape.y2}"
              stroke={shape.stroke}
              stroke-width={shape.strokeWidth || 1}
            />
          {/if}
        {/each}
        {#if sampleBadge.text}
          <text
            x="{sampleBadge.text.x}px"
            y="{sampleBadge.text.y}px"
            text-anchor={sampleBadge.text.textAnchor}
            style="font-family: {sampleBadge.text.fontFamily}; font-variant-numeric: tabular-nums; font-weight: {sampleBadge.text.fontWeight}; font-size: {sampleBadge.text.fontSize}px; fill: {sampleBadge.text.fill}; {sampleBadge.text.opacity !== undefined ? `opacity: ${sampleBadge.text.opacity};` : ''}"
          >
            {sampleBadge.text.text}
          </text>
        {/if}
      {/if}

      <!-- Resident Names (Foreground) -->
      <g id="sample-text">
        <text
          x="{sampleMetrics.relTextX}px"
          y="{sampleMetrics.b1}px"
          style="font-family: {currentFontOption.fontFamily}; font-weight: {sampleMetrics.fontWeight}; font-size: {sampleMetrics.fs}px; fill: #000000;"
        >
          {sampleNames[0]}
        </text>
        <text
          x="{sampleMetrics.relTextX}px"
          y="{sampleMetrics.b2}px"
          style="font-family: {currentFontOption.fontFamily}; font-weight: {sampleMetrics.fontWeight}; font-size: {sampleMetrics.fs}px; fill: #000000;"
        >
          {sampleNames[1]}
        </text>
      </g>
    </svg>
  </div>
</div>

<style>
  .sample-preview-card {
    background: #ffffff;
    border-bottom: 2px solid #e2e8f0;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
  }

  .sample-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .sample-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .sample-label {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .btn-done {
    background: #0284c7;
    color: #ffffff;
    border: none;
    border-radius: 6px;
    padding: 0.25rem 0.65rem;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.15s;
  }

  .btn-done:hover {
    background: #0369a1;
  }

  .sample-canvas-box {
    max-width: 520px;
    width: 100%;
    margin: 0 auto;
    border-radius: 6px;
    overflow: hidden;
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.08);
  }

  .sample-svg {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
