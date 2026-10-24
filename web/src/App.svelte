<script lang="ts">
  import Header from './components/Header.svelte';
  import FlatList from './components/FlatList.svelte';
  import TableauSvg from './components/TableauSvg.svelte';
  import { createDefaultFlats, parseCSV } from './lib/csvParser';
  import {
    FONT_OPTIONS,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
  } from './lib/tableauConfig';
  import type { FlatEntry, BadgeStyleId } from './lib/types';

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
    activeTab: 'split' | 'editor' | 'preview';
    badgeStyle: BadgeStyleId;
    showCropMarks: boolean;
    textPaddingLeft: number;
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
            activeTab:
              parsed.activeTab === 'editor' || parsed.activeTab === 'preview'
                ? parsed.activeTab
                : 'split',
            badgeStyle: parsed.badgeStyle || 'classic',
            showCropMarks:
              typeof parsed.showCropMarks === 'boolean' ? parsed.showCropMarks : true,
            textPaddingLeft:
              typeof parsed.textPaddingLeft === 'number'
                ? parsed.textPaddingLeft
                : DEFAULT_TEXT_PADDING_LEFT,
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
      activeTab: 'split',
      badgeStyle: 'classic',
      showCropMarks: true,
      textPaddingLeft: DEFAULT_TEXT_PADDING_LEFT,
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
  let activeTab: 'split' | 'editor' | 'preview' = $state(initial.activeTab);
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
          activeTab,
          badgeStyle,
          showCropMarks,
          textPaddingLeft,
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
    />
    <div class="tab-bar">
      <button
        class="tab-btn"
        class:active={activeTab === 'split'}
        onclick={() => (activeTab = 'split')}
      >
        Rozdělené zobrazení
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'editor'}
        onclick={() => (activeTab = 'editor')}
      >
        Pouze editor jmen
      </button>
      <button
        class="tab-btn"
        class:active={activeTab === 'preview'}
        onclick={() => (activeTab = 'preview')}
      >
        Náhled tisku (A4)
      </button>
    </div>
  </div>

  <main class="main-content" class:split={activeTab === 'split'}>
    <!-- Editor Pane -->
    <div
      class="pane editor-pane no-print"
      class:hidden={activeTab === 'preview'}
      class:full-width={activeTab === 'editor'}
    >
      <FlatList
        {flats}
        fontOption={currentFontOption}
        {badgeColor}
        {isBold}
        {badgeStyle}
        {textPaddingLeft}
      />
    </div>

    <!-- Live SVG Preview Pane -->
    <div
      class="pane preview-pane"
      class:hidden={activeTab === 'editor'}
      class:full-width={activeTab === 'preview'}
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
  }

  .tab-bar {
    display: none;
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.25rem 1rem;
    gap: 0.5rem;
  }

  .tab-btn {
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: #64748b;
    font-weight: 500;
  }

  .tab-btn.active {
    background: #ffffff;
    color: #0f172a;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .main-content {
    flex: 1;
    display: flex;
    overflow: hidden;
    position: relative;
  }

  .pane {
    height: 100%;
    overflow: auto;
    box-sizing: border-box;
  }

  .editor-pane {
    flex: 1.15;
    border-right: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .preview-pane {
    flex: 1;
    background: #e2e8f0;
  }

  .pane.hidden {
    display: none;
  }

  .pane.full-width {
    flex: 1;
    border: none;
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

  @media (max-width: 1024px) {
    .tab-bar {
      display: flex;
    }

    .main-content.split .editor-pane {
      display: flex;
      flex: 1;
    }
    .main-content.split .preview-pane {
      display: none;
    }
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

    .preview-pane {
      display: block !important;
      width: 297mm !important;
      height: 210mm !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      background: #ffffff !important;
      padding: 0 !important;
      margin: 0 !important;
    }
  }
</style>
