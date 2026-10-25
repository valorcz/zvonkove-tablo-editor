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
    getDefaultLayout,
    getTotalSlots,
  } from './lib/tableauConfig';
  import type {
    FlatEntry,
    BadgeStyleId,
    PrintColumnOption,
    TableauLayoutConfig,
    NumeralFontMode,
    TemplateRenderMode,
    TemplateOutlineStyle,
  } from './lib/types';

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
    layout?: TableauLayoutConfig;
    leftPaneView?: 'names' | 'settings';
    numeralFontMode?: NumeralFontMode;
    templateRenderMode?: TemplateRenderMode;
    templateOutlineStyle?: TemplateOutlineStyle;
    showDimensions?: boolean;
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
        const parsedLayout: TableauLayoutConfig = parsed.layout || getDefaultLayout();
        const needed = getTotalSlots(parsedLayout);
        let loadedFlats = Array.isArray(parsed.flats) ? parsed.flats : [];
        if (loadedFlats.length < needed) {
          const sample = createDefaultFlats(needed);
          for (let i = loadedFlats.length; i < needed; i++) {
            loadedFlats.push(sample[i]);
          }
        }

        return {
          flats: loadedFlats,
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
          layout: parsedLayout,
          leftPaneView: parsed.leftPaneView === 'settings' ? 'settings' : 'names',
          numeralFontMode: parsed.numeralFontMode === 'inherit' ? 'inherit' : 'iosevka',
          templateRenderMode: parsed.templateRenderMode === 'cut-strips' ? 'cut-strips' : 'full',
          templateOutlineStyle: parsed.templateOutlineStyle || 'dashed-subtle',
          showDimensions: typeof parsed.showDimensions === 'boolean' ? parsed.showDimensions : false,
        };
      }
    } catch {
      // Fallback
    }

    const defaultLayout = getDefaultLayout();
    return {
      flats: createDefaultFlats(getTotalSlots(defaultLayout)),
      badgeColor: DEFAULT_BADGE_FILL,
      selectedFontId: 'TechnicNT',
      isBold: true,
      showScale: true,
      showIds: false,
      badgeStyle: 'classic',
      showCropMarks: true,
      textPaddingLeft: DEFAULT_TEXT_PADDING_LEFT,
      printColumn: 'all',
      layout: defaultLayout,
      leftPaneView: 'names',
      numeralFontMode: 'iosevka',
      templateRenderMode: 'full',
      templateOutlineStyle: 'dashed-subtle',
      showDimensions: false,
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
  let layout: TableauLayoutConfig = $state(initial.layout || getDefaultLayout());
  let numeralFontMode: NumeralFontMode = $state(initial.numeralFontMode || 'iosevka');
  let templateRenderMode: TemplateRenderMode = $state(initial.templateRenderMode || 'full');
  let templateOutlineStyle: TemplateOutlineStyle = $state(initial.templateOutlineStyle || 'dashed-subtle');
  let showDimensions: boolean = $state(initial.showDimensions || false);
  let leftPaneView: 'names' | 'settings' = $state(initial.leftPaneView || 'names');
  let mobileTab: 'names' | 'settings' | 'preview' = $state(
    initial.leftPaneView === 'settings' ? 'settings' : 'names'
  );
  let isDraggingFile: boolean = $state(false);

  const totalSlots = $derived(getTotalSlots(layout));

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
          layout,
          leftPaneView,
          numeralFontMode,
          templateRenderMode,
          templateOutlineStyle,
          showDimensions,
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
    e.preventDefault();
    isDraggingFile = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDraggingFile = false;

    const files = e.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.name.endsWith('.csv') && !file.type.includes('csv') && !file.type.includes('text')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        flats = parseCSV(text, totalSlots);
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
      bind:showDimensions
      bind:templateRenderMode
      bind:templateOutlineStyle
      bind:badgeStyle
      bind:showCropMarks
      textPaddingLeft={textPaddingLeft}
      bind:printColumn
      bind:layout
      {numeralFontMode}
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
        <span>Jmenovky ({totalSlots})</span>
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
            <span>Jmenovky ({totalSlots} bytů)</span>
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
            {layout}
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
            bind:showDimensions
            bind:templateRenderMode
            bind:templateOutlineStyle
            bind:printColumn
            bind:layout
            bind:numeralFontMode
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
        {showDimensions}
        {templateRenderMode}
        {templateOutlineStyle}
        {badgeStyle}
        {showCropMarks}
        {textPaddingLeft}
        {printColumn}
        {layout}
        {numeralFontMode}
      />
    </div>
  </main>

  <!-- Drag and drop overlay -->
  {#if isDraggingFile}
    <div class="dropzone-overlay">
      <div class="dropzone-card">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <div class="dropzone-text">Pusťte soubor CSV sem</div>
        <div class="dropzone-sub">Automaticky načte jmenovky pro tablo</div>
      </div>
    </div>
  {/if}
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    background-color: #0f172a;
    color: #0f172a;
    overflow: hidden;
    height: 100vh;
  }

  .app-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
  }

  .main-content {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
    background: #0f172a;
  }

  .pane {
    height: 100%;
    overflow: hidden;
    position: relative;
    box-sizing: border-box;
  }

  /* Desktop layout: Left pane for editor/settings, right pane for SVG preview */
  .left-pane {
    flex: 1.15;
    min-width: 380px;
    background: #f8fafc;
    border-right: 1px solid #334155;
    display: flex;
    flex-direction: column;
    z-index: 10;
  }

  .preview-pane {
    flex: 1;
    min-width: 400px;
    display: flex;
    flex-direction: column;
    background: #0f172a;
  }

  /* Left pane header with segmented tabs */
  .left-pane-header {
    background: #ffffff;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.5rem 0.85rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  .view-pill-group {
    display: flex;
    background: #f1f5f9;
    padding: 0.2rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    gap: 0.25rem;
    width: 100%;
  }

  .view-pill-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.4rem 0.65rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    font-size: 0.82rem;
    font-weight: 600;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .view-pill-btn:hover {
    color: #0f172a;
  }

  .view-pill-btn.active {
    background: #ffffff;
    color: #0284c7;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .left-pane-body {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  }

  /* Mobile bottom tab bar */
  .mobile-tab-bar {
    display: none;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    padding: 0.35rem 0.75rem;
    gap: 0.4rem;
  }

  .mobile-tab-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: none;
    border-radius: 6px;
    background: transparent;
    font-size: 0.78rem;
    font-weight: 600;
    color: #94a3b8;
    cursor: pointer;
    transition: all 0.15s;
  }

  .mobile-tab-btn.active {
    background: #0284c7;
    color: #ffffff;
  }

  /* Drag & Drop overlay */
  .dropzone-overlay {
    position: fixed;
    inset: 0;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(4px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  .dropzone-card {
    background: #ffffff;
    padding: 2.5rem 3.5rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.85rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    border: 2px dashed #0284c7;
  }

  .dropzone-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: #0f172a;
  }

  .dropzone-sub {
    font-size: 0.9rem;
    color: #64748b;
  }

  /* Responsive Rules */
  @media (max-width: 1024px) {
    .mobile-tab-bar {
      display: flex;
    }

    .main-content {
      flex-direction: column;
    }

    .left-pane {
      border-right: none;
      flex: 1;
      width: 100%;
    }

    .preview-pane {
      flex: 1;
      width: 100%;
    }

    .mobile-hidden {
      display: none !important;
    }
  }

  /* Desktop restoration rule */
  @media (min-width: 1025px) {
    .mobile-tab-bar {
      display: none !important;
    }

    .left-pane {
      display: flex !important;
      flex: 1.15;
    }

    .preview-pane {
      display: flex !important;
      flex: 1;
    }
  }

  @media print {
    :global(body) {
      background: white !important;
      color: black !important;
      overflow: hidden !important;
      height: 210mm !important;
      max-height: 210mm !important;
      width: 297mm !important;
      max-width: 297mm !important;
      margin: 0 !important;
      padding: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .app-layout {
      display: block !important;
      height: 210mm !important;
      width: 297mm !important;
      max-height: 210mm !important;
      max-width: 297mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
    }

    .main-content {
      display: block !important;
      height: 210mm !important;
      width: 297mm !important;
      max-height: 210mm !important;
      max-width: 297mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
    }

    .preview-pane {
      display: block !important;
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      overflow: hidden !important;
      margin: 0 !important;
      padding: 0 !important;
      border: none !important;
      background: transparent !important;
    }

    .left-pane,
    .no-print,
    .mobile-tab-bar,
    .dropzone-overlay {
      display: none !important;
    }
  }
</style>
