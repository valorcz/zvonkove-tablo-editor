<script lang="ts">
  import type { FlatEntry } from '../lib/types';
  import { parseCSV, exportToCSV, createDefaultFlats } from '../lib/csvParser';
  import { generateFullSVG, downloadFile } from '../lib/svgGenerator';
  import { FONT_OPTIONS, DEFAULT_BADGE_FILL } from '../lib/tableauConfig';

  let {
    flats = $bindable(),
    showIds = $bindable(),
    badgeColor = $bindable(),
    selectedFontId = $bindable(),
    isBold = $bindable(),
    showScale = $bindable(),
  }: {
    flats: FlatEntry[];
    showIds: boolean;
    badgeColor: string;
    selectedFontId: string;
    isBold: boolean;
    showScale: boolean;
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
    const svg = generateFullSVG(flats, showIds, badgeColor, currentFontOption, isBold, showScale);
    const date = new Date().toISOString().slice(0, 10);
    downloadFile(svg, `zvonky-tablo-${date}.svg`, 'image/svg+xml;charset=utf-8;');
  }

  function handlePrint() {
    window.print();
  }

  function handleReset() {
    if (confirm('Opravdu chcete obnovit původní výchozí jména z října 2026?')) {
      flats = createDefaultFlats();
      badgeColor = DEFAULT_BADGE_FILL;
      selectedFontId = 'TechnicNT';
      isBold = true;
      showScale = true;
    }
  }

  const colorPresets = [
    { label: 'Broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Šedá', value: '#E2E8F0' },
    { label: 'Modrá', value: '#BAE6FD' },
    { label: 'Žlutá', value: '#FEF08A' },
    { label: 'Bílá', value: '#FFFFFF' },
  ];
</script>

<header class="app-header">
  <div class="brand">
    <div class="logo-icon">🔔</div>
    <div>
      <h1 class="title">Zvonkové tablo Tesla / GUARD prima</h1>
      <span class="subtitle">Bělohorská 95 (A4 na šířku, 28 zvonků)</span>
    </div>
  </div>

  <!-- Settings Controls -->
  <div class="controls-row">
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

    <!-- Badge Color Picker -->
    <div class="setting-item" title="Barva pozadí štítku čísla bytu">
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
    <label class="toggle-label" title="Zobrazit čísla bytů na štítcích (v tisku výchozí skryto)">
      <input type="checkbox" bind:checked={showIds} />
      <span>Čísla bytů</span>
    </label>

    <!-- Calibration Scale toggle -->
    <label class="toggle-label" title="Zobrazit 100mm kontrolní měřítko v dolním okraji pro ověření skutečného rozměru tisku">
      <input type="checkbox" bind:checked={showScale} />
      <span>Měřítko 1:1</span>
    </label>
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

    <button class="btn btn-secondary" onclick={handleExportSVG} title="Stáhnout tiskové SVG pro Affinity / Inkscape">
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

  @media print {
    .app-header {
      display: none !important;
    }
  }
</style>
