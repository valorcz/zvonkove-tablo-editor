<script lang="ts">
  import { FONT_OPTIONS } from '../../lib/tableauConfig';

  let {
    selectedFontId = $bindable('TechnicNT'),
    isBold = $bindable(true),
    textPaddingLeft = $bindable(88.5),
  }: {
    selectedFontId: string;
    isBold: boolean;
    textPaddingLeft: number;
  } = $props();
</script>

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
    margin: -0.35rem 0 0.85rem;
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.4;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  label, .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .select-input {
    width: 100%;
    box-sizing: border-box;
    padding: 0.45rem 0.65rem;
    font-size: 0.85rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #ffffff;
    color: #0f172a;
    outline: none;
    transition: border-color 0.15s;
  }

  .select-input:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .segmented-control {
    display: flex;
    background: #f1f5f9;
    padding: 0.2rem;
    border-radius: 6px;
    gap: 0.2rem;
  }

  .seg-btn {
    flex: 1;
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: #475569;
    transition: all 0.15s;
    text-align: center;
  }

  .seg-btn:hover {
    color: #0f172a;
    background: #e2e8f0;
  }

  .seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 700;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .slider-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    padding: 0.85rem;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .slider-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .slider-val {
    font-size: 0.8rem;
    font-weight: 700;
    color: #0284c7;
  }

  .slider-input {
    width: 100%;
    margin: 0.4rem 0 0.8rem;
    cursor: pointer;
  }

  .preset-buttons-row {
    display: flex;
    gap: 0.5rem;
  }

  .btn-preset-lg {
    flex: 1;
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-preset-lg:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .btn-preset-lg.active {
    background: #e0f2fe;
    border-color: #0284c7;
    color: #0284c7;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
