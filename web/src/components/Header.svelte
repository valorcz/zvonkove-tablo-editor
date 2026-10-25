<script lang="ts">
  import type { FlatEntry, BadgeStyleId, PrintColumnOption, TableauLayoutConfig } from '../lib/types';
  import { parseCSV, exportToCSV, createDefaultFlats } from '../lib/csvParser';
  import { generateFullSVG, downloadFile } from '../lib/svgGenerator';
  import {
    FONT_OPTIONS,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
    getDefaultLayout,
    getTotalSlots,
  } from '../lib/tableauConfig';

  let {
    flats = $bindable(),
    showIds = $bindable(),
    badgeColor = $bindable(),
    selectedFontId = $bindable(),
    isBold = $bindable(),
    showScale = $bindable(),
    badgeStyle = $bindable('classic'),
    showCropMarks = $bindable(true),
    textPaddingLeft = $bindable(DEFAULT_TEXT_PADDING_LEFT),
    printColumn = $bindable('all'),
    layout = $bindable(getDefaultLayout()),
    onToggleSettings = () => {},
    isSettingsOpen = false,
  }: {
    flats: FlatEntry[];
    showIds: boolean;
    badgeColor: string;
    selectedFontId: string;
    isBold: boolean;
    showScale: boolean;
    badgeStyle?: BadgeStyleId;
    showCropMarks?: boolean;
    textPaddingLeft?: number;
    printColumn?: PrintColumnOption;
    layout?: TableauLayoutConfig;
    onToggleSettings?: () => void;
    isSettingsOpen?: boolean;
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
        flats = parseCSV(text, getTotalSlots(layout));
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
      showCropMarks,
      textPaddingLeft,
      printColumn,
      layout
    );
    const date = new Date().toISOString().slice(0, 10);
    const suffix = printColumn === 'all' ? '' : `-sloupec${printColumn}`;
    downloadFile(svg, `zvonky-tablo${suffix}-${date}.svg`, 'image/svg+xml;charset=utf-8;');
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

    const total = getTotalSlots(layout);
    const updated = [...flats];
    while (updated.length < total) {
      updated.push({ id: updated.length + 1, name1: '', name2: '' });
    }

    for (let i = 0; i < total; i++) {
      const line = lines[i] || '';
      let parts = line.split(/[;/]/).map((p) => p.trim());
      if (parts.length === 1 && parts[0] === '') parts = [];
      updated[i] = {
        ...updated[i],
        id: i + 1,
        name1: parts[0] || '',
        name2: parts[1] || '',
      };
    }

    flats = updated;
    showBatchModal = false;
  }

  function handleReset() {
    if (confirm('Opravdu chcete obnovit výchozí vzorová jména i nastavení?')) {
      flats = createDefaultFlats(getTotalSlots(layout));
      selectedFontId = 'TechnicNT';
      isBold = true;
      badgeStyle = 'classic';
      badgeColor = DEFAULT_BADGE_FILL;
      showIds = false;
      textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT;
      showCropMarks = true;
      showScale = true;
    }
  }
</script>

<header class="app-header">
  <div class="brand">
    <div class="logo-icon-wrap" title="Tesla / GUARD prima zvonkové tablo">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
      </svg>
    </div>
    <div>
      <h1 class="title">Zvonkové tablo Tesla / GUARD prima</h1>
      <span class="subtitle">28 zvonků · A4 na šířku (3 sloupce)</span>
    </div>
  </div>

  <!-- Primary Header Actions -->
  <div class="actions">
    <input
      type="file"
      accept=".csv,text/csv,text/plain"
      bind:this={fileInput}
      onchange={handleFileUpload}
      style="display: none;"
    />

    <!-- Settings Button (Toggles between Editor and Settings Panel in Left Pane) -->
    <button
      type="button"
      class="btn btn-secondary btn-settings"
      class:active={isSettingsOpen}
      onclick={onToggleSettings}
      title="Přepnout zobrazení nastavení a jmenovek"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="4" y1="21" x2="4" y2="14"></line>
        <line x1="4" y1="10" x2="4" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12" y2="3"></line>
        <line x1="20" y1="21" x2="20" y2="16"></line>
        <line x1="20" y1="12" x2="20" y2="3"></line>
        <line x1="1" y1="14" x2="7" y2="14"></line>
        <line x1="9" y1="8" x2="15" y2="8"></line>
        <line x1="17" y1="16" x2="23" y2="16"></line>
      </svg>
      <span>{isSettingsOpen ? 'Zpět na jmenovky' : 'Nastavení vzhledu'}</span>
    </button>

    <!-- Batch text paste button -->
    <button
      type="button"
      class="btn btn-secondary"
      onclick={handleOpenBatchModal}
      title="Rychlé hromadné vložení seznamu 28 jmen ze schránky"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
        <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
      </svg>
      <span>Vložit text</span>
    </button>

    <!-- Upload CSV -->
    <button
      type="button"
      class="btn btn-secondary"
      onclick={() => fileInput.click()}
      title="Nahrát seznam jmen z CSV souboru"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span>Nahrát CSV</span>
    </button>

    <!-- Download CSV -->
    <button
      type="button"
      class="btn btn-secondary"
      onclick={handleExportCSV}
      title="Uložit aktuální jména do CSV souboru"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Stáhnout CSV</span>
    </button>

    <!-- Download SVG -->
    <button
      type="button"
      class="btn btn-secondary"
      onclick={handleExportSVG}
      title="Stáhnout tiskové vektorové SVG (297 × 210 mm)"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="16 16 12 12 8 16"></polyline>
        <line x1="12" y1="12" x2="12" y2="21"></line>
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"></path>
      </svg>
      <span>Stáhnout SVG</span>
    </button>

    <!-- Print / PDF -->
    <button
      type="button"
      class="btn btn-primary"
      onclick={handlePrint}
      title="Vytisknout ve skutečné velikosti (A4 na šířku)"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 6 2 18 2 18 9"></polyline>
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
        <rect x="6" y="14" width="12" height="8"></rect>
      </svg>
      <span>Tisk / PDF</span>
    </button>

    <!-- Reset defaults -->
    <button
      type="button"
      class="btn btn-ghost"
      onclick={handleReset}
      title="Obnovit výchozí hodnoty jmen a nastavení"
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
        <path d="M3 3v5h5"></path>
      </svg>
    </button>
  </div>
</header>

<!-- Batch Modal Dialog -->
{#if showBatchModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop no-print" onclick={() => (showBatchModal = false)}>
    <div class="modal-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div class="modal-title-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
          </svg>
          <h3 class="modal-title">Hromadné vložení seznamu jmen</h3>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          onclick={() => (showBatchModal = false)}
          title="Zavřít"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
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

<!-- Print Guidance Modal Dialog -->
{#if showPrintModal}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop no-print" onclick={() => (showPrintModal = false)}>
    <div class="modal-card" onclick={(e) => e.stopPropagation()}>
      <div class="modal-header">
        <div class="modal-title-wrap">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"></polyline>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
            <rect x="6" y="14" width="12" height="8"></rect>
          </svg>
          <h3 class="modal-title">Důležité pro tisk v přesném měřítku 1:1</h3>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          onclick={() => (showPrintModal = false)}
          title="Zavřít"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="modal-body">
        <p class="modal-lead">V dialogu tisku prohlížeče je nutné zkontrolovat nastavení:</p>
        <ul class="modal-list">
          <li>
            <strong>1. Okraje (Margins):</strong> nastavte na <strong>Žádné (None / 0 mm)</strong>
            <div class="modal-hint">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#b45309" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Pokud ponecháte „Výchozí“ (Default), prohlížeč zmenší stránku na cca 90 % a kalibrační měřítko bude mít jen necelých 9 cm místo 10 cm!</span>
            </div>
          </li>
          <li>
            <strong>2. Měřítko (Scale):</strong> nastavte na <strong>100 %</strong> nebo <strong>Skutečná velikost (Actual size)</strong>
          </li>
          <li>
            <strong>3. Grafika na pozadí (Background graphics):</strong> zaškrtněte <strong>Povolit</strong>
          </li>
        </ul>

        <div class="print-scope-box">
          <span class="field-label">Vybrat rozsah pro tisk:</span>
          <div class="segmented-control print-cols-choice">
            <button
              type="button"
              class="seg-btn"
              class:active={printColumn === 'all'}
              onclick={() => (printColumn = 'all')}
            >
              Všechny ({layout.columns.length})
            </button>
            {#each layout.columns as colCfg, cIdx}
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
        </div>

        <div class="modal-alt-box">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>Tip: Můžete si také stáhnout tiskové SVG (má rozměry 297 × 210 mm napevno definované) a vytisknout jej z libovolného vektorového prohlížeče či editoru.</span>
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

  .logo-icon-wrap {
    width: 34px;
    height: 34px;
    border-radius: 8px;
    background: #f1f5f9;
    color: #0284c7;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .title {
    font-size: 1.05rem;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
    letter-spacing: -0.01em;
  }

  .subtitle {
    font-size: 0.775rem;
    color: #64748b;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.45rem;
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

  .btn-primary {
    background: #0284c7;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0369a1;
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

  .btn-settings {
    background: #f0f9ff;
    border-color: #bae6fd;
    color: #0369a1;
    font-weight: 600;
  }

  .btn-settings:hover,
  .btn-settings.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .btn-ghost {
    background: transparent;
    border-color: transparent;
    color: #64748b;
    padding: 0.42rem 0.55rem;
  }

  .btn-ghost:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  /* Modals */
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
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.25);
    box-sizing: border-box;
    overflow: hidden;
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.55rem;
  }

  .modal-title {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 700;
    color: #0f172a;
  }

  .modal-close-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.1s;
  }

  .modal-close-btn:hover {
    color: #0f172a;
    background: #e2e8f0;
  }

  .modal-body {
    padding: 1.25rem 1.4rem;
    box-sizing: border-box;
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.85rem 1.4rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  /* Batch & Print specifics */
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

  .modal-lead {
    margin: 0 0 1rem 0;
    font-size: 0.875rem;
    color: #334155;
    line-height: 1.5;
  }

  .modal-lead code {
    background: #f1f5f9;
    padding: 0.15rem 0.35rem;
    border-radius: 4px;
    font-size: 0.82rem;
    color: #0284c7;
  }

  .modal-list {
    margin: 0 0 1.25rem 0;
    padding-left: 1.25rem;
    font-size: 0.85rem;
    color: #334155;
    line-height: 1.5;
  }

  .modal-list li {
    margin-bottom: 0.65rem;
  }

  .modal-hint {
    display: flex;
    align-items: flex-start;
    gap: 0.4rem;
    margin-top: 0.35rem;
    font-size: 0.8rem;
    color: #b45309;
    background: #fef3c7;
    padding: 0.45rem 0.65rem;
    border-radius: 6px;
    border: 1px solid #fde68a;
  }

  .modal-alt-box {
    display: flex;
    align-items: flex-start;
    gap: 0.45rem;
    background: #f0f9ff;
    border: 1px solid #bae6fd;
    border-radius: 6px;
    padding: 0.65rem 0.85rem;
    font-size: 0.8rem;
    color: #0369a1;
    line-height: 1.45;
  }

  .print-scope-box {
    margin-bottom: 1.1rem;
    padding: 0.75rem 0.85rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }

  .print-cols-choice {
    margin-top: 0.4rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(105px, 1fr));
    gap: 0.25rem;
    background: #e2e8f0;
    padding: 0.25rem;
    border-radius: 6px;
  }

  /* Responsive styling for Mobile */
  @media (max-width: 768px) {
    .app-header {
      padding: 0.5rem 0.75rem;
      gap: 0.5rem;
    }

    .brand {
      width: 100%;
    }

    .title {
      font-size: 0.95rem;
    }

    .subtitle {
      font-size: 0.72rem;
    }

    .actions {
      width: 100%;
      justify-content: flex-start;
      gap: 0.35rem;
    }

    .btn {
      padding: 0.38rem 0.6rem;
      font-size: 0.78rem;
    }

    .modal-card {
      max-height: 94vh;
      border-radius: 8px;
    }

    .modal-body {
      padding: 1rem;
    }
  }
</style>
