<script lang="ts">
  import type { PrintColumnOption, ColumnConfig } from '../../lib/types';

  let {
    showCropMarks = $bindable(true),
    showScale = $bindable(true),
    printColumn = $bindable('all'),
    columns = [],
  }: {
    showCropMarks: boolean;
    showScale: boolean;
    printColumn?: PrintColumnOption;
    columns: ColumnConfig[];
  } = $props();
</script>

<div class="settings-card">
  <h4 class="card-title">Tiskové pomůcky a rozsah tisku</h4>
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

  <div class="form-field" style="margin-top: 14px;">
    <span class="field-label">Výběr sloupce pro tisk:</span>
    <div class="segmented-control print-cols-segmented">
      <button
        type="button"
        class="seg-btn"
        class:active={printColumn === 'all'}
        onclick={() => (printColumn = 'all')}
      >
        Všechny sloupce
      </button>
      {#each columns as _, cIdx}
        <button
          type="button"
          class="seg-btn"
          class:active={printColumn === cIdx + 1}
          onclick={() => (printColumn = cIdx + 1)}
        >
          Sloupec {cIdx + 1}
        </button>
      {/each}
    </div>
    <p class="field-hint">
      Při volbě jednoho sloupce se na formát A4 vytiskne pouze daný modul na své přesné pozici. Šetří toner a inkoust při výměně jmenovek jen v jednom sloupci.
    </p>
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

  .checkbox-stack {
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .custom-checkbox {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.8rem;
    font-weight: 500;
    color: #334155;
    cursor: pointer;
  }

  .custom-checkbox input[type='checkbox'] {
    width: 16px;
    height: 16px;
    cursor: pointer;
    accent-color: #0284c7;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .field-hint {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.35;
  }

  .segmented-control {
    display: flex;
    background: #f1f5f9;
    padding: 0.2rem;
    border-radius: 6px;
    gap: 0.2rem;
    flex-wrap: wrap;
  }

  .seg-btn {
    flex: 1;
    min-width: 80px;
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
</style>
