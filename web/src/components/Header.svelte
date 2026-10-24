<script lang="ts">
  import type { FlatEntry, BadgeStyleId } from '../lib/types';
  import { parseCSV, exportToCSV, createDefaultFlats } from '../lib/csvParser';
  import { generateFullSVG, downloadFile } from '../lib/svgGenerator';
  import { FONT_OPTIONS, BADGE_STYLES, DEFAULT_BADGE_FILL } from '../lib/tableauConfig';

  let {
    flats = $bindable(),
    showIds = $bindable(),
    badgeColor = $bindable(),
    selectedFontId = $bindable(),
    isBold = $bindable(),
    showScale = $bindable(),
    badgeStyle = $bindable('classic'),
    showCropMarks = $bindable(true),
  }: {
    flats: FlatEntry[];
    showIds: boolean;
    badgeColor: string;
    selectedFontId: string;
    isBold: boolean;
    showScale: boolean;
    badgeStyle?: BadgeStyleId;
    showCropMarks?: boolean;
  } = $props();

  let fileInput: HTMLInputElement;

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0]
  );

  function handleFileUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        flats = parseCSV(text);
      }
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleExportCSV() {
    const csv = exportToCSV(flats);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(csv, `zvonky-jmenovky-${date}.csv`, 'text/csv;charset=utf-8;');
  }

  function handleExportSVG() {
    const svg = generateFullSVG(
      flats,
      showIds,
      badgeColor,
      currentFontOption,
      isBold,
      showScale,
      badgeStyle,
      showCropMarks
    );
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(svg, `zvonky-tablo-${date}.svg`, 'image/svg+xml;charset=utf-8;');
  }

  let showPrintModal = $state(false);
  let showBatchModal = $state(false);
  let batchInputText = $state('');

  function handlePrint() {
    showPrintModal = true;
  }

  function handleConfirmPrint() {
    showPrintModal = false;
    window.print();
  }

  function handleOpenBatchModal() {
    batchInputText = flats
      .map((f) => {
        const names = [f.name1.trim(), f.name2.trim()].filter((n) => n.length > 0);
        return names.join(' / ');
      })
      .join('\n');
    showBatchModal = true;
  }

  function handleBatchApply() {
    const lines = batchInputText
      .split(/\r?\n/)
      .map((l) => l.trim());

    const updated = flats.map((f, idx) => {
      const line = lines[idx] || '';
      // Support split by / or ;
      let parts = line.split(/[;/]/).map((p) => p.trim());
      if (parts.length === 1 && parts[0] === '') parts = [];
      return {
        id: f.id,
        name1: parts[0] || '',
        name2: parts[1] || '',
      };
    });

    flats = updated;
    showBatchModal = false;
  }

  function handleReset() {
    if (confirm('Opravdu chcete obnovit výchozí vzorová jména?')) {
      flats = createDefaultFlats();
      badgeColor = DEFAULT_BADGE_FILL;
      selectedFontId = 'TechnicNT';
      badgeStyle = 'classic';
      isBold = true;
      showScale = true;
      showCropMarks = true;
    }
  }

  const colorPresets = [
    { label: 'Tesla Vintage broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Břidlicově modrá', value: '#BAE6FD' },
    { label: 'Pískově žlutá', value: '#FEF3C7' },
    { label: 'Neutrální šedá', value: '#E2E8F0' },
    { label: 'Čistá bílá', value: '#FFFFFF' },
  ];
</script>

<header class="app-header">
  <div class="brand">
    <div class="logo-icon">🔔</div>
    <div>
      <h1 class="title">Zvonkové tablo Tesla / GUARD prima</h1>
      <span class="subtitle">28 zvonků (A4 na šířku, 3 sloupce)</span>
    </div>
  </div>

  <!-- Settings Controls -->
  <div class="controls-row">
    <!-- Group 1: Typography & Style Template -->
    <div class="control-group">
      <!-- Font Selector -->
      <div class="setting-item" title="Výběr písma pro jména na zvoncích">
        <label for="font-select">Písmo:</label>
        <select id="font-select" bind:value={selectedFontId} class="select-input">
          {#each FONT_OPTIONS as opt}
            <option value={opt.id}>{opt.label}</option>
          {/each}
        </select>
      </div>

      <!-- Font Weight Toggle Switch -->
      <button
        type="button"
        class="weight-toggle"
        class:active={isBold}
        onclick={() => (isBold = !isBold)}
        title="Přepnout tučnost písma (Tučné / Obyčejné)"
      >
        <span class="bold-icon">B</span>
        <span>{isBold ? 'Tučné' : 'Obyčejné'}</span>
      </button>

      <!-- Badge Template Style Selector -->
      <div class="setting-item" title="Šablona a umístění čísel bytů na štítku">
        <label for="badge-style-select">Šablona:</label>
        <select id="badge-style-select" bind:value={badgeStyle} class="select-input select-style">
          {#each BADGE_STYLES as s}
            <option value={s.id}>{s.label}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Group 2: Appearance & Print Aids -->
    <div class="control-group">
      <!-- Badge Color Picker (Only if style uses background color) -->
      {#if badgeStyle !== 'none'}
        <div class="setting-item" title="Barva podkladu čísla bytu">
          <label for="badge-color">Barva čísla:</label>
          <div class="color-picker-wrap">
            <input id="badge-color" type="color" bind:value={badgeColor} class="color-input" />
            <div class="presets">
              {#each colorPresets as preset}
                <button
                  type="button"
                  class="preset-dot"
                  style="background-color: {preset.value};"
                  title={preset.label}
                  onclick={() => (badgeColor = preset.value)}
                ></button>
              {/each}
            </div>
          </div>
        </div>

        <!-- Show IDs toggle -->
        <label class="toggle-label" title="Zobrazit čísla bytů (v tisku výchozí zapnuto)">
          <input type="checkbox" bind:checked={showIds} />
          <span>Čísla bytů</span>
        </label>
      {/if}

      <!-- Crop Marks toggle -->
      <label class="toggle-label" title="Zobrazit vnější ořezové značky pro přesné řezání pravítkem">
        <input type="checkbox" bind:checked={showCropMarks} />
        <span>Ořezové značky</span>
      </label>

      <!-- Calibration Scale toggle -->
      <label class="toggle-label" title="Zobrazit 100mm kontrolní měřítko v dolním okraji">
        <input type="checkbox" bind:checked={showScale} />
        <span>Měřítko 1:1</span>
      </label>
    </div>
  </div>

  <!-- Actions -->
  <div class="actions">
    <input
      type="file"
      accept=".csv,text/csv,text/plain"
      bind:this={fileInput}
      onchange={handleFileUpload}
      style="display: none;"
    />

    <!-- Batch text paste button -->
    <button
      class="btn btn-secondary"
      onclick={handleOpenBatchModal}
      title="Rychlé hromadné vložení seznamu 28 jmen ze schránky"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      Vložit text
    </button>

    <button class="btn btn-secondary" onclick={() => fileInput.click()} title="Nahrát seznam jmen z CSV souboru">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      Nahrát CSV
    </button>

    <button class="btn btn-secondary" onclick={handleExportCSV} title="Uložit aktuální jména do CSV">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Stáhnout CSV
    </button>

    <button class="btn btn-secondary" onclick={handleExportSVG} title="Stáhnout tiskové SVG (297 × 210 mm)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
        <polyline points="2 17 12 22 22 17"></polyline>
        <polyline points="2 12 12 17 22 12"></polyline>
      </svg>
      Stáhnout SVG
    </button>

    <button class="btn btn-primary" onclick={handlePrint} title="Vytisknout ve skutečné velikosti (A4 na šířku)">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      Tisk / PDF
    </button>

    <button class="btn btn-ghost" onclick={handleReset} title="Obnovit výchozí hodnoty">
      ↺
    </button>
  </div>
</header>

{#if showBatchModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop no-print" onclick={() => (showBatchModal = false)}>
    <div class="modal-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <span class="modal-icon">📋</span>
        <h3 class="modal-title">Hromadné vložení seznamu jmen</h3>
      </div>
      <div class="modal-body">
        <p class="modal-lead">
          Vložte seznam 28 řádků (od bytu 01 do bytu 28). Pro dvě jména na jednom zvonku použijte lomítko nebo středník (např. <code>Jan Novák / Marie Nováková</code>).
        </p>
        <textarea
          class="batch-textarea"
          rows="12"
          bind:value={batchInputText}
          placeholder="Byt 01&#10;Byt 02&#10;Jan Novák / Marie Nováková&#10;..."
        ></textarea>
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-ghost"
          onclick={() => (showBatchModal = false)}
        >
          Zrušit
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleBatchApply}
        >
          Naplnit jmenovky
        </button>
      </div>
    </div>
  </div>
{/if}

{#if showPrintModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop no-print" onclick={() => (showPrintModal = false)}>
    <div class="modal-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <span class="modal-icon">🖨️</span>
        <h3 class="modal-title">Důležité pro tisk v přesném měřítku 1:1</h3>
      </div>
      <div class="modal-body">
        <p class="modal-lead">V dialogu tisku prohlížeče je nutné zkontrolovat nastavení:</p>
        <ul class="modal-list">
          <li>
            <strong>1. Okraje (Margins):</strong> nastavte na <strong>Žádné (None / 0 mm)</strong>
            <div class="modal-hint">
              ⚠️ Pokud ponecháte „Výchozí“ (Default), prohlížeč zmenší stránku na cca 90 % a kalibrační měřítko bude mít jen necelých 9 cm místo 10 cm!
            </div>
          </li>
          <li>
            <strong>2. Měřítko (Scale):</strong> nastavte na <strong>100 %</strong> nebo <strong>Skutečná velikost (Actual size)</strong>
          </li>
          <li>
            <strong>3. Grafika na pozadí (Background graphics):</strong> zaškrtněte <strong>Povolit</strong>
          </li>
        </ul>
        <div class="modal-alt-box">
          💡 <em>Tip: Můžete si také stáhnout tiskové SVG soubor (má rozměry 297 × 210 mm napevno definované) a vytisknout jej z libovolného vektorového prohlížeče či editoru.</em>
        </div>
      </div>
      <div class="modal-footer">
        <button
          type="button"
          class="btn btn-ghost"
          onclick={() => (showPrintModal = false)}
        >
          Zrušit
        </button>
        <button
          type="button"
          class="btn btn-secondary"
          onclick={() => {
            showPrintModal = false;
            handleExportSVG();
          }}
        >
          Stáhnout tiskové SVG (1:1)
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick={handleConfirmPrint}
        >
          Otevřít tiskový dialog
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .app-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.65rem 1.25rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.85rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .logo-icon {
    font-size: 1.4rem;
  }

  .title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }

  .subtitle {
    font-size: 0.775rem;
    color: #64748b;
  }

  .controls-row {
    display: flex;
    align-items: center;
    gap: 0.85rem;
    flex-wrap: wrap;
  }

  .control-group {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    background: #f8fafc;
    padding: 0.25rem 0.6rem;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }

  .setting-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
    color: #475569;
    font-weight: 500;
  }

  .select-input {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 0.25rem 0.5rem;
    font-size: 0.8rem;
    background: #ffffff;
    color: #1e293b;
    outline: none;
    cursor: pointer;
  }

  .select-style {
    font-weight: 600;
    color: #0369a1;
  }

  .batch-textarea {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 0.85rem;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    resize: vertical;
    outline: none;
    line-height: 1.4;
  }

  .batch-textarea:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
  }

  .weight-toggle {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.55rem;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    background: #f8fafc;
    color: #475569;
    font-size: 0.78rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .weight-toggle.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .bold-icon {
    font-weight: 900;
    font-size: 0.85rem;
    line-height: 1;
  }

  .color-picker-wrap {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .color-input {
    width: 24px;
    height: 24px;
    padding: 0;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    cursor: pointer;
    background: transparent;
  }

  .presets {
    display: flex;
    gap: 0.2rem;
  }

  .preset-dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
    padding: 0;
  }

  .preset-dot:hover {
    transform: scale(1.15);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.8rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
  }

  .btn-primary {
    background: #0284c7;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0369a1;
  }

  .btn-secondary {
    background: #f8fafc;
    border-color: #cbd5e1;
    color: #334155;
  }

  .btn-secondary:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .btn-ghost {
    background: transparent;
    border-color: transparent;
    color: #94a3b8;
    font-size: 1rem;
    padding: 0.3rem 0.5rem;
  }

  .btn-ghost:hover {
    color: #ef4444;
    background: #fee2e2;
  }

  .toggle-label {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #334155;
    cursor: pointer;
    padding: 0.3rem 0.5rem;
    border-radius: 5px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    user-select: none;
    font-weight: 500;
  }

  .toggle-label input {
    cursor: pointer;
    accent-color: #0284c7;
  }

  /* Print guidance modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
    padding: 1rem;
    box-sizing: border-box;
  }

  .modal-card {
    background: #ffffff;
    border-radius: 12px;
    max-width: 540px;
    width: 100%;
    padding: 1.75rem 2rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }

  .modal-icon {
    font-size: 1.75rem;
  }

  .modal-title {
    margin: 0;
    font-size: 1.15rem;
    font-weight: 700;
    color: #0f172a;
  }

  .modal-lead {
    margin: 0 0 0.85rem;
    font-size: 0.925rem;
    color: #334155;
    font-weight: 500;
  }

  .modal-list {
    margin: 0 0 1.25rem;
    padding-left: 1.25rem;
    font-size: 0.875rem;
    color: #1e293b;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .modal-hint {
    margin-top: 0.25rem;
    padding: 0.4rem 0.6rem;
    background: #fef2f2;
    border-left: 3px solid #ef4444;
    border-radius: 4px;
    color: #991b1b;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .modal-alt-box {
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 6px;
    padding: 0.65rem 0.85rem;
    font-size: 0.825rem;
    color: #166534;
    line-height: 1.4;
    margin-bottom: 1.5rem;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    flex-wrap: wrap;
  }

  @media print {
    .app-header {
      display: none !important;
    }
  }
</style>
