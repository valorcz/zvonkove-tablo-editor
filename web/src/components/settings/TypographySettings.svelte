<script lang="ts">
  import { FONT_OPTIONS } from '../../lib/tableauConfig';
  import type { NumeralFontMode } from '../../lib/types';

  let {
    selectedFontId = $bindable('TechnicNT'),
    isBold = $bindable(true),
    textPaddingLeft = $bindable(88.5),
    numeralFontMode = $bindable('iosevka'),
  }: {
    selectedFontId: string;
    isBold: boolean;
    textPaddingLeft: number;
    numeralFontMode?: NumeralFontMode;
  } = $props();
</script>

<div class="settings-card">
  <h4 class="card-title">Písmo a typografie</h4>
  <div class="grid-2">
    <div class="form-field">
      <label for="side-font-select">Výběr písma pro jména:</label>
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

  <div class="form-field" style="margin-top: 0.85rem;">
    <span class="field-label">Písmo čísel bytů:</span>
    <div class="numeral-options-wrap">
      <button
        type="button"
        class="numeral-pill-btn"
        class:active={numeralFontMode === 'iosevka'}
        onclick={() => (numeralFontMode = 'iosevka')}
      >
        <span class="pill-title">Iosevka (technický monospace – výchozí)</span>
        <span class="pill-desc">Rovnoměrná šířka cifer, precizní lícování ve sloupcích</span>
      </button>
      <button
        type="button"
        class="numeral-pill-btn"
        class:active={numeralFontMode === 'inherit'}
        onclick={() => (numeralFontMode = 'inherit')}
      >
        <span class="pill-title">Shodné se zvoleným písmem jmen</span>
        <span class="pill-desc">Tabulární číslice ve fontu vybraném pro příjmení</span>
      </button>
    </div>
  </div>
</div>

<div class="settings-card">
  <h4 class="card-title">Sazba a odsazení jmen</h4>
  <p class="card-desc">
    Nastavte levé odsazení textu pro dokonalou čitelnost i pod okrajem hliníkového profilu tabla.
  </p>

  <div class="slider-box">
    <div class="slider-header">
      <span class="slider-label">Odsazení od okraje:</span>
      <span class="slider-val">{(textPaddingLeft / 11.811).toFixed(1)} mm ({Math.round(textPaddingLeft)} px)</span>
    </div>
    <input
      type="range"
      min="35.4"
      max="177.2"
      step="5.9"
      bind:value={textPaddingLeft}
      class="slider-input"
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

  .card-desc {
    margin: 0 0 0.75rem;
    font-size: 0.78rem;
    color: #64748b;
    line-height: 1.4;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  @media (max-width: 640px) {
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  label,
  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .select-input {
    width: 100%;
    height: 38px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0 0.65rem;
    font-size: 0.85rem;
    background-color: #f8fafc;
    color: #0f172a;
    outline: none;
    transition: all 0.15s ease;
  }

  .select-input:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.2);
  }

  .segmented-control {
    display: flex;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 2px;
    height: 38px;
    box-sizing: border-box;
  }

  .seg-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    border: none;
    background: transparent;
    font-size: 0.78rem;
    color: #64748b;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .slider-box {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
  }

  .slider-label {
    font-weight: 600;
    color: #334155;
  }

  .slider-val {
    font-weight: 700;
    color: #0284c7;
    font-family: monospace;
  }

  .slider-input {
    width: 100%;
    accent-color: #0284c7;
    cursor: pointer;
  }

  .preset-buttons-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-top: 0.4rem;
  }

  .btn-preset-lg {
    padding: 0.45rem 0.2rem;
    font-size: 0.75rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
    text-align: center;
    font-weight: 500;
  }

  .btn-preset-lg:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .btn-preset-lg.active {
    background: #f0f9ff;
    border-color: #0284c7;
    color: #0284c7;
    font-weight: 700;
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
