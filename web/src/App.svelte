<script lang="ts">
  import Header from './components/Header.svelte';
  import FlatList from './components/FlatList.svelte';
  import SettingsPanel from './components/SettingsPanel.svelte';
  import TableauSvg from './components/TableauSvg.svelte';
  import { createDefaultFlats, parseCSV } from './lib/csvParser';
  import {
    FONT_OPTIONS,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
  } from './lib/tableauConfig';
  import type { FlatEntry, BadgeStyleId, PrintColumnOption } from './lib/types';

  const STORAGE_KEY = 'zvonky_tablo_app_state_v1';
  const LEGACY_STORAGE_KEYS = [
    'zvonky_tablo_state_v3',
    'zvonky_tablo_state_v2',
    'zvonky_tablo_sample_v1',
  ];

  interface StoredState {
    flats: FlatEntry[];
    badgeColor: string;
    selectedFontId: string;
    isBold: boolean;
    showScale: boolean;
    showIds: boolean;
    badgeStyle: BadgeStyleId;
    showCropMarks: boolean;
    textPaddingLeft: number;
    printColumn?: PrintColumnOption;
    leftPaneView?: 'names' | 'settings';
  }

  function loadInitialState(): StoredState {
    try {
      let saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        for (const key of LEGACY_STORAGE_KEYS) {
          saved = localStorage.getItem(key);
          if (saved) break;
        }
      }
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.flats) && parsed.flats.length === 28) {
          return {
            flats: parsed.flats,
            badgeColor: parsed.badgeColor || DEFAULT_BADGE_FILL,
            selectedFontId: parsed.selectedFontId || 'TechnicNT',
            isBold: typeof parsed.isBold === 'boolean' ? parsed.isBold : true,
            showScale: typeof parsed.showScale === 'boolean' ? parsed.showScale : true,
            showIds: typeof parsed.showIds === 'boolean' ? parsed.showIds : false,
            badgeStyle: parsed.badgeStyle || 'classic',
            showCropMarks:
              typeof parsed.showCropMarks === 'boolean' ? parsed.showCropMarks : true,
            textPaddingLeft:
              typeof parsed.textPaddingLeft === 'number'
                ? parsed.textPaddingLeft
                : DEFAULT_TEXT_PADDING_LEFT,
            printColumn: parsed.printColumn || 'all',
            leftPaneView: parsed.leftPaneView === 'settings' ? 'settings' : 'names',
          };
        }
      }
    } catch {
      // Fallback
    }
    return {
      flats: createDefaultFlats(),
      badgeColor: DEFAULT_BADGE_FILL,
      selectedFontId: 'TechnicNT',
      isBold: true,
      showScale: true,
      showIds: false,
      badgeStyle: 'classic',
      showCropMarks: true,
      textPaddingLeft: DEFAULT_TEXT_PADDING_LEFT,
      printColumn: 'all',
      leftPaneView: 'names',
    };
  }

  const initial = loadInitialState();
  let flats: FlatEntry[] = $state(initial.flats);
  let showIds: boolean = $state(initial.showIds);
  let badgeColor: string = $state(initial.badgeColor);
  let selectedFontId: string = $state(initial.selectedFontId);
  let isBold: boolean = $state(initial.isBold);
  let showScale: boolean = $state(initial.showScale);
  let badgeStyle: BadgeStyleId = $state(initial.badgeStyle);
  let showCropMarks: boolean = $state(initial.showCropMarks);
  let textPaddingLeft: number = $state(initial.textPaddingLeft);
  let printColumn: PrintColumnOption = $state(initial.printColumn || 'all');
  let leftPaneView: 'names' | 'settings' = $state(initial.leftPaneView || 'names');
  let mobileTab: 'names' | 'settings' | 'preview' = $state(
    initial.leftPaneView === 'settings' ? 'settings' : 'names'
  );
  let isDraggingFile: boolean = $state(false);

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0]
  );

  // Auto-save to localStorage whenever state changes
  $effect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          flats,
          badgeColor,
          selectedFontId,
          isBold,
          showScale,
          showIds,
          badgeStyle,
          showCropMarks,
          textPaddingLeft,
          printColumn,
          leftPaneView,
        })
      );
    } catch {
      // Ignore quota errors
    }
  });

  // Global Drag & Drop handling for CSV files
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) {
      isDraggingFile = true;
    }
  }

  function handleDragLeave(e: DragEvent) {
    if (!e.relatedTarget) {
      isDraggingFile = false;
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = false;
    const file = e.dataTransfer?.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        flats = parseCSV(text);
      }
    };
    reader.readAsText(file);
  }

  function toggleSettingsFromHeader() {
    if (leftPaneView === 'settings') {
      leftPaneView = 'names';
      mobileTab = 'names';
    } else {
      leftPaneView = 'settings';
      mobileTab = 'settings';
    }
  }
</script>

<svelte:window
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
/>

<div class="app-layout">
  <div class="no-print">
    <Header
      bind:flats
      bind:showIds
      bind:badgeColor
      bind:selectedFontId
      bind:isBold
      bind:showScale
      bind:badgeStyle
      bind:showCropMarks
      bind:textPaddingLeft
      bind:printColumn
      onToggleSettings={toggleSettingsFromHeader}
      isSettingsOpen={leftPaneView === 'settings' || mobileTab === 'settings'}
    />

    <!-- Mobile View Switcher (Only visible on screens <= 1024px) -->
    <div class="mobile-tab-bar">
      <button
        type="button"
        class="mobile-tab-btn"
        class:active={mobileTab === 'names'}
        onclick={() => {
          mobileTab = 'names';
          leftPaneView = 'names';
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        <span>Jmenovky (28)</span>
      </button>

      <button
        type="button"
        class="mobile-tab-btn"
        class:active={mobileTab === 'settings'}
        onclick={() => {
          mobileTab = 'settings';
          leftPaneView = 'settings';
        }}
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
        <span>Nastavení & Sazba</span>
      </button>

      <button
        type="button"
        class="mobile-tab-btn"
        class:active={mobileTab === 'preview'}
        onclick={() => (mobileTab = 'preview')}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
          <line x1="8" y1="21" x2="16" y2="21"></line>
          <line x1="12" y1="17" x2="12" y2="21"></line>
        </svg>
        <span>Náhled tabla (A4)</span>
      </button>
    </div>
  </div>

  <main class="main-content">
    <!-- Left Pane (Editor or Settings Panel) -->
    <div
      class="pane left-pane no-print"
      class:mobile-hidden={mobileTab === 'preview'}
    >
      <!-- Desktop Subnav Header for Left Pane -->
      <div class="left-pane-header">
        <div class="view-pill-group">
          <button
            type="button"
            class="view-pill-btn"
            class:active={leftPaneView === 'names'}
            onclick={() => {
              leftPaneView = 'names';
              mobileTab = 'names';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span>Jmenovky (28 bytů)</span>
          </button>
          <button
            type="button"
            class="view-pill-btn"
            class:active={leftPaneView === 'settings'}
            onclick={() => {
              leftPaneView = 'settings';
              mobileTab = 'settings';
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
            <span>Nastavení vzhledu & sazby</span>
          </button>
        </div>
      </div>

      <!-- Left Pane Body -->
      <div class="left-pane-body">
        {#if leftPaneView === 'names'}
          <FlatList
            {flats}
            fontOption={currentFontOption}
            {badgeColor}
            {isBold}
            {badgeStyle}
            {textPaddingLeft}
          />
        {:else}
          <SettingsPanel
            bind:flats
            bind:selectedFontId
            bind:isBold
            bind:badgeStyle
            bind:badgeColor
            bind:showIds
            bind:textPaddingLeft
            bind:showCropMarks
            bind:showScale
            bind:printColumn
            onClose={() => {
              leftPaneView = 'names';
              mobileTab = 'names';
            }}
          />
        {/if}
      </div>
    </div>

    <!-- Right Pane: Live SVG Preview (ALWAYS visible on desktop!) -->
    <div
      class="pane preview-pane"
      class:mobile-hidden={mobileTab !== 'preview'}
    >
      <TableauSvg
        {flats}
        {showIds}
        {badgeColor}
        fontOption={currentFontOption}
        {isBold}
        {showScale}
        {badgeStyle}
        {showCropMarks}
        {textPaddingLeft}
        {printColumn}
      />
    </div>
  </main>

  <!-- Drag and drop overlay -->
  {#if isDraggingFile}
    <div class="dropzone-overlay">
      <div class="dropzone-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <h3>Přetáhněte sem CSV soubor</h3>
        <p>Jména se automaticky načtou do všech 28 zvonků</p>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background: #f8fafc;
    overflow: hidden;
  }

  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    position: relative;
    overflow: hidden;
  }

  /* Mobile Tab Bar (Hidden on desktop) */
  .mobile-tab-bar {
    display: none;
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.35rem 0.5rem;
    gap: 0.35rem;
  }

  .mobile-tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.45rem 0.4rem;
    font-size: 0.8rem;
    font-weight: 600;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    cursor: pointer;
    color: #64748b;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .mobile-tab-btn.active {
    background: #e0f2fe;
    border-color: #bae6fd;
    color: #0369a1;
  }

  /* Main 2-Pane Content */
  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .pane {
    height: 100%;
    overflow: hidden;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
  }

  /* Left Pane (Editor / Settings) */
  .left-pane {
    flex: 1.15;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
    min-width: 0;
  }

  .left-pane-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .view-pill-group {
    display: inline-flex;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
    border-radius: 7px;
    padding: 2px;
    gap: 2px;
  }

  .view-pill-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.35rem 0.75rem;
    border: none;
    background: transparent;
    border-radius: 5px;
    font-size: 0.8rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.12s ease-in-out;
  }

  .view-pill-btn:hover {
    color: #0f172a;
  }

  .view-pill-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  }

  .left-pane-body {
    flex: 1;
    overflow-y: auto;
    position: relative;
  }

  /* Right Pane (Live Preview) */
  .preview-pane {
    flex: 1;
    background: #cbd5e1;
    min-width: 0;
    position: relative;
  }

  /* Responsive Rules: Mobile vs Desktop */
  @media (max-width: 1024px) {
    .mobile-tab-bar {
      display: flex;
    }

    .left-pane-header {
      display: none;
    }

    .pane.mobile-hidden {
      display: none !important;
    }

    .pane {
      flex: 1 !important;
      width: 100% !important;
      border: none !important;
    }
  }

  @media (min-width: 1025px) {
    /* Enforce split view ALWAYS on desktop! */
    .left-pane {
      display: flex !important;
      flex: 1.15 !important;
    }

    .preview-pane {
      display: flex !important;
      flex: 1 !important;
    }
  }

  .dropzone-overlay {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    pointer-events: none;
  }

  .dropzone-card {
    background: #ffffff;
    border: 3px dashed #0284c7;
    border-radius: 12px;
    padding: 3rem 4rem;
    text-align: center;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
  }

  .dropzone-card h3 {
    margin: 1rem 0 0.5rem;
    font-size: 1.25rem;
    color: #0f172a;
  }

  .dropzone-card p {
    margin: 0;
    font-size: 0.9rem;
    color: #64748b;
  }

  /* True 1:1 scale A4 Landscape print rules */
  @page {
    size: 297mm 210mm;
    margin: 0;
  }

  @media print {
    :global(body), :global(html) {
      margin: 0 !important;
      padding: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      background: #ffffff !important;
      overflow: hidden !important;
    }

    .no-print {
      display: none !important;
    }

    .app-layout {
      width: 297mm !important;
      height: 210mm !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }

    .main-content {
      width: 297mm !important;
      height: 210mm !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
    }

    .left-pane {
      display: none !important;
    }

    .preview-pane {
      width: 297mm !important;
      height: 210mm !important;
      display: block !important;
      background: transparent !important;
    }
  }
</style>
