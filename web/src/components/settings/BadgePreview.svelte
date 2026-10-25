<script lang="ts">
  import type { BadgeStyleId, NumeralFontMode } from '../../lib/types';
  import {
    getSlotCoordinates,
    calculateFontSize,
    getWatermarkStyle,
    type FontOption,
  } from '../../lib/tableauConfig';

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

    const wmStyle = getWatermarkStyle(badgeColor);

    return {
      relTextX,
      relCenterY,
      fs,
      b1,
      b2,
      fontWeight: isBold ? (currentFontOption.id === 'Iosevka' ? 600 : 700) : 400,
      wmFill: wmStyle.fill,
      wmOpacity: wmStyle.opacity,
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

      <!-- Resident Names -->
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

      <!-- Badge layer -->
      {#if showIds && badgeStyle !== 'none'}
        {#if badgeStyle === 'left-block'}
          <rect x="0" y="0" width="76" height={sampleSlotH} fill={badgeColor} />
          <line x1="76" y1="0" x2="76" y2={sampleSlotH} stroke="#cbd5e1" stroke-width="2" />
          <text x="38" y="{sampleMetrics.relCenterY + 14}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 42px; fill: #000000;">
            01
          </text>
        {:else if badgeStyle === 'inline-num'}
          <text x="{sampleSlotW - 39}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 36px; fill: #000000;">
            01
          </text>
        {:else if badgeStyle === 'corner-index'}
          <text x="{sampleSlotW - 24}px" y="34px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 26px; fill: #000000;">
            01
          </text>
        {:else if badgeStyle === 'circle'}
          <circle cx="{sampleSlotW - 24 - 31}px" cy="{sampleMetrics.relCenterY}px" r="27px" fill={badgeColor} />
          <text x="{sampleSlotW - 24 - 31}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 38px; fill: #000000;">
            01
          </text>
        {:else if badgeStyle === 'outline'}
          <rect x="{sampleSlotW - 24 - 62}px" y="{(sampleSlotH - 54) / 2}px" width="62" height="54" rx="8" fill="none" stroke={badgeColor} stroke-width="2.5" />
          <text x="{sampleSlotW - 24 - 31}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 38px; fill: #000000;">
            01
          </text>
        {:else if badgeStyle === 'watermark'}
          <text x="{sampleSlotW - 68}px" y="{sampleMetrics.relCenterY + 28}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 800; font-size: 84px; fill: {sampleMetrics.wmFill}; opacity: {sampleMetrics.wmOpacity};">
            01
          </text>
        {:else}
          <!-- Classic badge -->
          <rect x="{sampleSlotW - 24 - 62}px" y="{(sampleSlotH - 54) / 2}px" width="62" height="54" rx="8" fill={badgeColor} />
          <text x="{sampleSlotW - 24 - 31}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family: {numeralFontFamily}; font-variant-numeric: tabular-nums; font-weight: 700; font-size: 38px; fill: #000000;">
            01
          </text>
        {/if}
      {/if}
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
