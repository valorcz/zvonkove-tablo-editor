<script lang="ts">
  import type { BadgeStyleId } from '../lib/types';
  import {
    FONT_OPTIONS,
    BADGE_STYLES,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
    serializeSettingsYAML,
    parseSettingsYAML,
    getSlotCoordinates,
    calculateFontSize,
    getWatermarkStyle,
    type FontOption,
  } from '../lib/tableauConfig';

  let {
    selectedFontId = $bindable(),
    isBold = $bindable(),
    badgeStyle = $bindable('classic'),
    badgeColor = $bindable(),
    showIds = $bindable(),
    textPaddingLeft = $bindable(DEFAULT_TEXT_PADDING_LEFT),
    showCropMarks = $bindable(true),
    showScale = $bindable(true),
    onClose = () => {},
  }: {
    selectedFontId: string;
    isBold: boolean;
    badgeStyle: BadgeStyleId;
    badgeColor: string;
    showIds: boolean;
    textPaddingLeft: number;
    showCropMarks: boolean;
    showScale: boolean;
    onClose?: () => void;
  } = $props();

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0]
  );

  let configYamlText = $state('');
  let copyFeedback = $state(false);

  $effect(() => {
    configYamlText = serializeSettingsYAML({
      font: selectedFontId,
      bold: isBold,
      badgeStyle,
      badgeColor,
      showIds,
      textPaddingLeft,
      showCropMarks,
      showScale,
    });
  });

  async function handleCopyConfigYAML() {
    try {
      await navigator.clipboard.writeText(configYamlText);
      copyFeedback = true;
      setTimeout(() => (copyFeedback = false), 2500);
    } catch {
      copyFeedback = true;
      setTimeout(() => (copyFeedback = false), 2500);
    }
  }

  function handleApplyConfigYAML() {
    const parsed = parseSettingsYAML(configYamlText);
    if (!parsed) {
      alert('Nepodařilo se načíst konfiguraci. Zkontrolujte formát.');
      return;
    }
    if (parsed.font && FONT_OPTIONS.some((f) => f.id === parsed.font)) {
      selectedFontId = parsed.font;
    }
    if (typeof parsed.bold === 'boolean') isBold = parsed.bold;
    if (parsed.badgeStyle && BADGE_STYLES.some((s) => s.id === parsed.badgeStyle)) {
      badgeStyle = parsed.badgeStyle;
    }
    if (parsed.badgeColor) badgeColor = parsed.badgeColor;
    if (typeof parsed.showIds === 'boolean') showIds = parsed.showIds;
    if (typeof parsed.textPaddingLeft === 'number') textPaddingLeft = parsed.textPaddingLeft;
    if (typeof parsed.showCropMarks === 'boolean') showCropMarks = parsed.showCropMarks;
    if (typeof parsed.showScale === 'boolean') showScale = parsed.showScale;
    copyFeedback = true;
    setTimeout(() => (copyFeedback = false), 2500);
  }

  function handleResetSettingsToDefault() {
    selectedFontId = 'TechnicNT';
    isBold = true;
    badgeStyle = 'classic';
    badgeColor = DEFAULT_BADGE_FILL;
    showIds = false;
    textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT;
    showCropMarks = true;
    showScale = true;
  }

  const colorPresets = [
    { label: 'Tesla Vintage broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Břidlicově modrá', value: '#BAE6FD' },
    { label: 'Pískově žlutá', value: '#FEF3C7' },
    { label: 'Neutrální šedá', value: '#E2E8F0' },
    { label: 'Čistá bílá', value: '#FFFFFF' },
  ];

  // --- Sample Card Geometry for live preview (Slot width: 574.42, height: 152.4) ---
  const sampleSlotW = 574.42;
  const sampleSlotH = 152.4;
  const sampleNames = ['Jan Novák', 'Marie Nováková'];

  const sampleMetrics = $derived.by(() => {
    const coords = getSlotCoordinates(0, 0, badgeStyle, textPaddingLeft);
    // Relative to slot origin (129.54, slotTop)
    const relTextX = coords.textX - (coords.colX + 129.54);
    const relCenterY = sampleSlotH / 2.0;
    const fs = calculateFontSize(sampleNames, currentFontOption, isBold, badgeStyle, textPaddingLeft);
    const lineHeight = fs * 1.18;
    const b1 = relCenterY - 0.5 * lineHeight + 0.38 * fs;
    const b2 = relCenterY + 0.5 * lineHeight + 0.38 * fs;

    const wm = getWatermarkStyle(badgeColor);

    return {
      relTextX,
      relCenterY,
      fs,
      b1,
      b2,
      fontWeight: isBold ? (currentFontOption.id === 'Iosevka' ? 600 : 700) : 400,
      wmFill: wm.fill,
      wmOpacity: wm.opacity,
    };
  });
</script>

<div class="settings-panel">
  <!-- Live Sample Card Preview -->
  <div class="sample-preview-card">
    <div class="sample-preview-header">
      <div class="sample-title-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="12 8 8 12 12 16 12 8"></polygon>
        </svg>
        <span class="sample-label">Živý vzorový štítek (1:1 náhled)</span>
      </div>
      <button type="button" class="btn-done" onclick={onClose} title="Zavřít nastavení a přejít na jména">
        Zpět na jmenovky ✕
      </button>
    </div>

    <div class="sample-canvas-box">
      <svg
        viewBox="0 0 {sampleSlotW} {sampleSlotH}"
        width="100%"
        height="100%"
        class="sample-svg"
      >
        <!-- Slot background boundary -->
        <rect x="1" y="1" width={sampleSlotW - 2} height={sampleSlotH - 2} fill="#ffffff" stroke="#94a3b8" stroke-width="1.5" />

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
            <text x="38" y="{sampleMetrics.relCenterY + 14}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:42px;fill:#000000;">
              01
            </text>
          {:else if badgeStyle === 'inline-num'}
            <text x="{sampleSlotW - 39}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:36px;fill:#000000;">
              01
            </text>
          {:else if badgeStyle === 'watermark'}
            <text x="{sampleSlotW - 68}px" y="{sampleMetrics.relCenterY + 28}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:800;font-size:84px;fill:{sampleMetrics.wmFill};opacity:{sampleMetrics.wmOpacity};">
              01
            </text>
          {:else}
            <!-- Classic badge -->
            <rect x="{sampleSlotW - 24 - 62}px" y="{(sampleSlotH - 54) / 2}px" width="62" height="54" rx="8" fill={badgeColor} />
            <text x="{sampleSlotW - 24 - 31}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:38px;fill:#000000;">
              01
            </text>
          {/if}
        {/if}
      </svg>
    </div>
  </div>

  <div class="settings-scroll-body">
    <!-- Section 1: Typography -->
    <div class="settings-card">
      <h4 class="card-title">Písmo a typografie</h4>
      <div class="grid-2">
        <div class="form-field">
          <label for="side-font-select">Výběr písma:</label>
          <select id="side-font-select" bind:value={selectedFontId} class="select-input">
            {#each FONT_OPTIONS as opt}
              <option value={opt.id}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div class="form-field">
          <span class="field-label">Řez písma:</span>
          <div class="segmented-control">
            <button
              type="button"
              class="seg-btn"
              class:active={isBold}
              onclick={() => (isBold = true)}
            >
              <strong>B</strong> Tučné (Bold)
            </button>
            <button
              type="button"
              class="seg-btn"
              class:active={!isBold}
              onclick={() => (isBold = false)}
            >
              <span>R</span> Obyčejné (Regular)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Badge Style & Colors -->
    <div class="settings-card">
      <h4 class="card-title">Čísla bytů a šablona štítku</h4>
      <div class="grid-2">
        <div class="form-field">
          <label for="side-style-select">Šablona štítku:</label>
          <select id="side-style-select" bind:value={badgeStyle} class="select-input">
            {#each BADGE_STYLES as s}
              <option value={s.id}>{s.label}</option>
            {/each}
          </select>
          <p class="field-help">
            {BADGE_STYLES.find((s) => s.id === badgeStyle)?.description}
          </p>
        </div>

        <div class="form-field" class:disabled={badgeStyle === 'none' || badgeStyle === 'inline-num'}>
          <label for="side-color-input">Barva čísla bytu:</label>
          <div class="color-picker-row">
            <input
              id="side-color-input"
              type="color"
              bind:value={badgeColor}
              class="color-input-lg"
              disabled={badgeStyle === 'none' || badgeStyle === 'inline-num'}
            />
            <div class="presets-wrap">
              {#each colorPresets as preset}
                <button
                  type="button"
                  class="preset-chip"
                  style="background-color: {preset.value};"
                  title={preset.label}
                  disabled={badgeStyle === 'none' || badgeStyle === 'inline-num'}
                  onclick={() => (badgeColor = preset.value)}
                ></button>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div class="checkbox-row">
        <label class="custom-checkbox" class:disabled={badgeStyle === 'none'}>
          <input type="checkbox" bind:checked={showIds} disabled={badgeStyle === 'none'} />
          <span>Zobrazit čísla bytů v tablu</span>
        </label>
      </div>
    </div>

    <!-- Section 3: Sazba / Odsazení -->
    <div class="settings-card">
      <h4 class="card-title">Sazba & odsazení jmenovek</h4>
      <p class="card-desc">
        Odsazení textu od levého okraje štítku chrání jména před překrytím a stínem plastového rámečku tabla při bočním pohledu.
      </p>
      <div class="slider-box">
        <div class="slider-header">
          <span>Levé odsazení textu:</span>
          <span class="slider-display">
            {(textPaddingLeft / (3508 / 297)).toFixed(1)} mm ({Math.round(textPaddingLeft)} px)
          </span>
        </div>
        <input
          type="range"
          min="45"
          max="130"
          step="1"
          bind:value={textPaddingLeft}
          class="full-range"
        />
        <div class="preset-buttons-row">
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 59.0) < 1}
            onclick={() => (textPaddingLeft = 59.0)}
          >
            Úzké (5 mm)
          </button>
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 88.5) < 1}
            onclick={() => (textPaddingLeft = 88.5)}
          >
            Standard (7.5 mm)
          </button>
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 118.0) < 1}
            onclick={() => (textPaddingLeft = 118.0)}
          >
            Široké (10 mm)
          </button>
        </div>
      </div>
    </div>

    <!-- Section 4: Print Aids -->
    <div class="settings-card">
      <h4 class="card-title">Tiskové pomůcky</h4>
      <div class="checkbox-stack">
        <label class="custom-checkbox">
          <input type="checkbox" bind:checked={showCropMarks} />
          <span>Ořezové značky (rohové linky pro přesné řezání pravítkem)</span>
        </label>
        <label class="custom-checkbox">
          <input type="checkbox" bind:checked={showScale} />
          <span>Kontrolní měřítko 1:1 (100mm pravítko v dolním okraji)</span>
        </label>
      </div>
    </div>

    <!-- Section 5: YAML Sharing -->
    <div class="settings-card">
      <div class="section-header-flex">
        <h4 class="card-title">Sdílení konfigurace (YAML / Text)</h4>
        {#if copyFeedback}
          <span class="copy-success-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            Zkopírováno do schránky!
          </span>
        {/if}
      </div>
      <p class="card-desc">
        Kompletní nastavení můžete zkopírovat jako text a předat dál, nebo sem vložit konfiguraci od někoho jiného.
      </p>
      <textarea
        class="config-yaml-box"
        rows="6"
        bind:value={configYamlText}
        placeholder="# Zde můžete vložit nebo upravit konfiguraci..."
      ></textarea>
      <div class="yaml-actions">
        <button type="button" class="btn btn-secondary" onclick={handleCopyConfigYAML}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Kopírovat nastavení</span>
        </button>
        <button type="button" class="btn btn-secondary" onclick={handleApplyConfigYAML}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>Použít vložené nastavení</span>
        </button>
        <button type="button" class="btn btn-ghost text-muted" onclick={handleResetSettingsToDefault}>
          Výchozí hodnoty
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f8fafc;
    box-sizing: border-box;
    overflow: hidden;
  }

  .sample-preview-card {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.85rem 1.25rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
    font-size: 0.78rem;
    font-weight: 700;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .btn-done {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 0.25rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-done:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .sample-canvas-box {
    max-width: 480px;
    margin: 0 auto;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .sample-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .settings-scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    box-sizing: border-box;
  }

  .settings-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem 1.15rem;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  }

  .card-title {
    margin: 0 0 0.65rem 0;
    font-size: 0.85rem;
    font-weight: 700;
    color: #334155;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .card-desc {
    font-size: 0.78rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #475569;
    font-weight: 500;
  }

  .form-field.disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  .field-label {
    font-size: 0.8rem;
    color: #475569;
    font-weight: 500;
  }

  .field-help {
    font-size: 0.72rem;
    color: #64748b;
    margin: 0.2rem 0 0 0;
    line-height: 1.3;
  }

  .select-input {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.42rem 0.6rem;
    font-size: 0.82rem;
    background: #ffffff;
    color: #1e293b;
    outline: none;
    cursor: pointer;
    width: 100%;
    box-sizing: border-box;
  }

  .segmented-control {
    display: flex;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
  }

  .seg-btn {
    flex: 1;
    border: none;
    background: transparent;
    padding: 0.42rem 0.5rem;
    font-size: 0.78rem;
    cursor: pointer;
    color: #475569;
    font-weight: 500;
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
  }

  .seg-btn.active {
    background: #0284c7;
    color: #ffffff;
  }

  .color-picker-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .color-input-lg {
    width: 32px;
    height: 32px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    background: transparent;
  }

  .presets-wrap {
    display: flex;
    gap: 0.35rem;
  }

  .preset-chip {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s;
  }

  .preset-chip:hover {
    transform: scale(1.2);
  }

  .checkbox-row {
    margin-top: 0.75rem;
  }

  .checkbox-stack {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .custom-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: #334155;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
  }

  .custom-checkbox input {
    cursor: pointer;
    accent-color: #0284c7;
    width: 16px;
    height: 16px;
  }

  .custom-checkbox.disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  /* Slider box */
  .slider-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    box-sizing: border-box;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
    margin-bottom: 0.5rem;
  }

  .slider-display {
    font-family: monospace;
    font-weight: 700;
    color: #0284c7;
    background: #e0f2fe;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    font-size: 0.8rem;
  }

  .full-range {
    width: 100%;
    accent-color: #0284c7;
    cursor: pointer;
    margin-bottom: 0.65rem;
  }

  .preset-buttons-row {
    display: flex;
    gap: 0.5rem;
  }

  .btn-preset-lg {
    flex: 1;
    padding: 0.35rem 0.4rem;
    font-size: 0.76rem;
    font-weight: 500;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #475569;
    cursor: pointer;
    text-align: center;
    transition: all 0.12s;
  }

  .btn-preset-lg:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .btn-preset-lg.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
  }

  /* YAML sharing box */
  .config-yaml-box {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 0.8rem;
    padding: 0.65rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    color: #1e293b;
    resize: vertical;
    outline: none;
    line-height: 1.45;
  }

  .config-yaml-box:focus {
    border-color: #0284c7;
    background: #ffffff;
  }

  .yaml-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.42rem 0.75rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
    text-decoration: none;
    box-sizing: border-box;
  }

  .btn-secondary {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #334155;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .btn-ghost {
    background: transparent;
    border-color: transparent;
    color: #64748b;
    padding: 0.42rem 0.55rem;
  }

  .text-muted {
    color: #94a3b8;
  }

  .text-muted:hover {
    color: #dc2626 !important;
    background: #fee2e2 !important;
  }

  .section-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  .copy-success-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #15803d;
    background: #dcfce7;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .grid-2 {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .preset-buttons-row {
      flex-direction: column;
      gap: 0.35rem;
    }
    .yaml-actions {
      flex-direction: column;
    }
  }
</style>
