<script lang="ts">
  import type { PrintColumnOption, ColumnConfig, TemplateRenderMode } from '../../lib/types';

  let {
    showCropMarks = $bindable(true),
    showScale = $bindable(true),
    showDimensions = $bindable(false),
    templateRenderMode = $bindable('full'),
    printColumn = $bindable('all'),
    columns = [],
  }: {
    showCropMarks: boolean;
    showScale: boolean;
    showDimensions?: boolean;
    templateRenderMode?: TemplateRenderMode;
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
      <span>Kontrolní měřítko 1:1 a technické razítko výkresu</span>
    </label>
    <label class="custom-checkbox">
      <input type="checkbox" bind:checked={showDimensions} />
      <span>Kótované rozměry (architektonické kóty se šipkami a mm u 1. sloupce)</span>
    </label>
  </div>

  <div class="form-field" style="margin-top: 14px;">
    <span class="field-label">Vzhled šablony pro tisk:</span>
    <div class="segmented-control mode-segmented">
      <button
        type="button"
        class="seg-btn"
        class:active={templateRenderMode === 'full'}
        onclick={() => (templateRenderMode = 'full')}
      >
        Kompletní modul (s tlačítky)
      </button>
      <button
        type="button"
        class="seg-btn"
        class:active={templateRenderMode === 'cut-strips'}
        onclick={() => (templateRenderMode = 'cut-strips')}
      >
        Čisté pásy štítků (pouze ořez)
      </button>
    </div>
    <p class="field-hint">
      Režim čistých pásů netiskne tělo panelu ani tlačítka, což šetří toner a zanechává pouze čisté rámečky pro přesné vyřezání papírových pásků.
    </p>
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
    gap: 0.4rem;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .field-hint {
    margin: 0.25rem 0 0;
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.35;
  }

  .segmented-control {
    display: flex;
    background: #f1f5f9;
    padding: 3px;
    border-radius: 6px;
    gap: 2px;
  }

  .mode-segmented .seg-btn {
    flex: 1;
    padding: 0.4rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .mode-segmented .seg-btn:hover {
    color: #0f172a;
  }

  .mode-segmented .seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .print-cols-segmented {
    flex-wrap: wrap;
  }

  .print-cols-segmented .seg-btn {
    flex: 1 1 auto;
    min-width: 65px;
    padding: 0.35rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .print-cols-segmented .seg-btn:hover {
    color: #0f172a;
  }

  .print-cols-segmented .seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }
</style>
