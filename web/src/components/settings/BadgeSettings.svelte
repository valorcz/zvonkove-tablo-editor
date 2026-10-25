<script lang="ts">
  import type { BadgeStyleId, NumeralFontMode } from '../../lib/types';
  import { BADGE_STYLES } from '../../lib/tableauConfig';

  let {
    badgeStyle = $bindable('classic'),
    badgeColor = $bindable('#FFE6C7'),
    showIds = $bindable(true),
    numeralFontMode = $bindable('iosevka'),
  }: {
    badgeStyle: BadgeStyleId;
    badgeColor: string;
    showIds: boolean;
    numeralFontMode?: NumeralFontMode;
  } = $props();

  const colorPresets = [
    { label: 'Tesla Vintage broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Břidlicově modrá', value: '#BAE6FD' },
    { label: 'Pískově žlutá', value: '#FEF3C7' },
    { label: 'Neutrální šedá', value: '#E2E8F0' },
    { label: 'Čistá bílá', value: '#FFFFFF' },
  ];
</script>

<div class="settings-card">
  <h4 class="card-title">Styl a barva čísla bytu</h4>
  <div class="badge-styles-grid">
    {#each BADGE_STYLES as s}
      <button
        type="button"
        class="badge-style-btn"
        class:active={badgeStyle === s.id}
        onclick={() => {
          badgeStyle = s.id;
          showIds = (s.id !== 'none');
        }}
      >
        <div class="badge-style-header">
          <span class="style-name">{s.label}</span>
          {#if badgeStyle === s.id}
            <span class="check-icon">✓</span>
          {/if}
        </div>
        <p class="style-desc">{s.description}</p>
      </button>
    {/each}
  </div>

  {#if badgeStyle !== 'none' && badgeStyle !== 'inline-num' && badgeStyle !== 'corner-index'}
    <div class="form-field" style="margin-top: 1rem;">
      <span class="field-label">
        {badgeStyle === 'outline'
          ? 'Barva obrysu rámečku:'
          : badgeStyle === 'watermark'
          ? 'Odstín vodoznaku:'
          : 'Barva podkladu čísla:'}
      </span>
      <div class="color-picker-row">
        <div class="color-input-wrap">
          <input
            type="color"
            bind:value={badgeColor}
            class="color-picker-square"
            title="Výběr libovolné barvy"
          />
          <span class="color-hex-text">{badgeColor}</span>
        </div>
        <div class="presets-wrap">
          {#each colorPresets as p}
            <button
              type="button"
              class="preset-chip"
              style="background-color: {p.value};"
              title={p.label}
              onclick={() => (badgeColor = p.value)}
            ></button>
          {/each}
        </div>
      </div>
    </div>
  {/if}

  {#if badgeStyle !== 'none'}
    <div class="form-field" style="margin-top: 1rem;">
      <span class="field-label">Písmo čísel bytů:</span>
      <div class="numeral-options-wrap">
        <button
          type="button"
          class="numeral-pill-btn"
          class:active={numeralFontMode === 'iosevka'}
          onclick={() => (numeralFontMode = 'iosevka')}
        >
          <span class="pill-title">Iosevka (technický monospace)</span>
          <span class="pill-desc">Rovnoměrná šířka cifer, precizní zarovnání</span>
        </button>
        <button
          type="button"
          class="numeral-pill-btn"
          class:active={numeralFontMode === 'inherit'}
          onclick={() => (numeralFontMode = 'inherit')}
        >
          <span class="pill-title">Shodné s písmem jmen</span>
          <span class="pill-desc">Tabulární číslice ve fontu zvoleném pro příjmení</span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .settings-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem 1.15rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
    margin-bottom: 0.85rem;
  }

  .card-title {
    margin: 0 0 0.65rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
  }

  .badge-styles-grid {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .badge-style-btn {
    text-align: left;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .badge-style-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .badge-style-btn.active {
    background: #f0f9ff;
    border-color: #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .badge-style-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.2rem;
  }

  .style-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #0f172a;
  }

  .check-icon {
    font-size: 0.85rem;
    font-weight: bold;
    color: #0284c7;
  }

  .style-desc {
    margin: 0;
    font-size: 0.73rem;
    color: #64748b;
    line-height: 1.35;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .color-picker-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .color-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
  }

  .color-picker-square {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: none;
    padding: 0;
  }

  .color-picker-square::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker-square::-webkit-color-swatch {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }

  .color-hex-text {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .presets-wrap {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .preset-chip {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.18);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    padding: 0;
  }

  .preset-chip:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }

  .numeral-options-wrap {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .numeral-pill-btn {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 0.5rem 0.65rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: left;
  }

  .numeral-pill-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .numeral-pill-btn.active {
    background: #f0f9ff;
    border-color: #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .pill-title {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0f172a;
  }

  .pill-desc {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 0.1rem;
  }
</style>
