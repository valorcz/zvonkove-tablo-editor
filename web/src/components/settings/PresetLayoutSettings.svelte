<script lang="ts">
  import type { TableauLayoutConfig, TableauPresetId, FlatEntry } from '../../lib/types';
  import { TABLEAU_PRESETS, getTotalSlots } from '../../lib/tableauConfig';

  let {
    layout = $bindable(),
    flats = $bindable(),
  }: {
    layout: TableauLayoutConfig;
    flats?: FlatEntry[];
  } = $props();

  function selectPreset(presetId: TableauPresetId) {
    const p = TABLEAU_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    layout.preset = presetId;
    if (presetId !== 'custom') {
      layout.columns = JSON.parse(JSON.stringify(p.columns));
      layout.numberingDirection = p.numberingDirection;
      layout.startNumber = p.startNumber;
      layout.printMode = p.printMode;
    }
    syncFlatsWithLayout();
  }

  function syncFlatsWithLayout() {
    const neededSlots = getTotalSlots(layout);
    if (flats && flats.length < neededSlots) {
      const expanded = [...flats];
      for (let i = flats.length + 1; i <= neededSlots; i++) {
        expanded.push({ id: i, name1: '', name2: '' });
      }
      flats = expanded;
    }
  }

  function addCustomColumn() {
    if (layout.columns.length >= 6) return;
    layout.preset = 'custom';
    layout.columns = [
      ...layout.columns,
      { id: layout.columns.length + 1, capacity: 10, skipTop: 0, skipBottom: 0 },
    ];
    syncFlatsWithLayout();
  }

  function removeCustomColumn() {
    if (layout.columns.length <= 1) return;
    layout.preset = 'custom';
    layout.columns = layout.columns.slice(0, -1);
  }
</script>

<div class="settings-card">
  <div class="section-header-flex">
    <h4 class="card-title">Typ a rozložení tabla (Presety & Geometrie)</h4>
    <span class="badge-tag">{getTotalSlots(layout)} bytů celkem</span>
  </div>

  <div class="form-field">
    <label for="preset-select">Přednastavený typ tabla (Preset):</label>
    <select
      id="preset-select"
      class="select-input"
      value={layout.preset}
      onchange={(e) => selectPreset((e.target as HTMLSelectElement).value as TableauPresetId)}
    >
      {#each TABLEAU_PRESETS as p}
        <option value={p.id}>{p.label}</option>
      {/each}
    </select>
    <p class="field-hint">
      {TABLEAU_PRESETS.find((p) => p.id === layout.preset)?.description || ''}
    </p>
  </div>

  <div class="grid-2" style="margin-top: 0.75rem;">
    <div class="form-field">
      <label for="num-direction-select">Směr číslování bytů:</label>
      <select
        id="num-direction-select"
        class="select-input"
        bind:value={layout.numberingDirection}
      >
        <option value="bottom-up">Zdola nahoru (Tesla standard: 01 dole)</option>
        <option value="top-down">Shora dolů (01 nahoře)</option>
        <option value="row-left-right">Po řádcích zleva doprava</option>
      </select>
    </div>

    <div class="form-field">
      <label for="start-num-input">Počáteční číslo bytu:</label>
      <input
        id="start-num-input"
        type="number"
        class="number-input"
        min="1"
        max="999"
        bind:value={layout.startNumber}
      />
    </div>
  </div>

  <div class="form-field" style="margin-top: 0.75rem;">
    <span class="field-label">Režim rozložení tisku:</span>
    <div class="segmented-control">
      <button
        type="button"
        class="seg-btn"
        class:active={layout.printMode === 'frame-1to1'}
        onclick={() => (layout.printMode = 'frame-1to1')}
      >
        Fyzický rám (1:1 rozteče rámu)
      </button>
      <button
        type="button"
        class="seg-btn"
        class:active={layout.printMode === 'compact-strips'}
        onclick={() => (layout.printMode = 'compact-strips')}
      >
        Úsporný tisk modulů (Nesting – až 5 modulů na A4)
      </button>
    </div>
    <p class="field-hint">
      {layout.printMode === 'frame-1to1'
        ? 'Sloupce jsou rozmístěny s přesnými roztečemi odpovídajícími fyzickému hliníkovému rámu Tesla.'
        : 'Sloupce jsou seřazeny těsně vedle sebe, což umožňuje vytisknout až 5 modulů (50 jmenovek) na jediný list A4.'}
    </p>
  </div>

  <!-- Custom column controls if custom preset -->
  {#if layout.preset === 'custom'}
    <div class="custom-cols-box">
      <div class="custom-cols-header">
        <span class="field-label">Sloupce tabla ({layout.columns.length}):</span>
        <div class="mini-btn-group">
          <button
            type="button"
            class="btn-mini"
            onclick={addCustomColumn}
            disabled={layout.columns.length >= 6}
            title="Přidat další sloupec"
          >
            + Přidat sloupec
          </button>
          <button
            type="button"
            class="btn-mini"
            onclick={removeCustomColumn}
            disabled={layout.columns.length <= 1}
            title="Odebrat poslední sloupec"
          >
            − Odebrat
          </button>
        </div>
      </div>

      <div class="columns-config-grid">
        {#each layout.columns as col}
          <div class="col-config-item">
            <span class="col-item-title">Sloupec {col.id}</span>
            <div class="col-prop-row">
              <span class="prop-label">Kapacita:</span>
              <select bind:value={col.capacity} class="select-mini" onchange={syncFlatsWithLayout}>
                <option value={10}>10 tlačítek (TT10)</option>
                <option value={5}>5 tlačítek (TT5)</option>
              </select>
            </div>
            <div class="col-prop-row">
              <span class="prop-label">Vynechat nahoře:</span>
              <input type="number" min="0" max={col.capacity - 1} bind:value={col.skipTop} class="num-mini" onchange={syncFlatsWithLayout} />
            </div>
          </div>
        {/each}
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

  .section-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.65rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
  }

  .badge-tag {
    font-size: 0.72rem;
    font-weight: 700;
    background: #e0f2fe;
    color: #0369a1;
    padding: 0.15rem 0.5rem;
    border-radius: 9999px;
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

  .field-hint {
    margin: 0.25rem 0 0;
    font-size: 0.75rem;
    color: #64748b;
    line-height: 1.35;
  }

  .select-input, .number-input {
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

  .select-input:focus, .number-input:focus {
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

  .custom-cols-box {
    margin-top: 0.85rem;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
  }

  .custom-cols-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .mini-btn-group {
    display: flex;
    gap: 0.35rem;
  }

  .btn-mini {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-mini:hover:not(:disabled) {
    border-color: #0284c7;
    color: #0284c7;
  }

  .btn-mini:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .columns-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(135px, 1fr));
    gap: 0.5rem;
  }

  .col-config-item {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .col-item-title {
    font-size: 0.75rem;
    font-weight: 700;
    color: #0284c7;
  }

  .col-prop-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.35rem;
  }

  .prop-label {
    font-size: 0.7rem;
    color: #64748b;
  }

  .select-mini, .num-mini {
    padding: 0.15rem 0.35rem;
    font-size: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    max-width: 75px;
  }

  @media (max-width: 640px) {
    .grid-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
