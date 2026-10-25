<script lang="ts">
  import type { ColumnConfig } from '../lib/types';

  let {
    columns = [],
    zoomLevel = 1.0,
    activeFocus = 'all',
    onFocusColumn = () => {},
    onZoomIn = () => {},
    onZoomOut = () => {},
    onResetZoom = () => {},
  }: {
    columns: ColumnConfig[];
    zoomLevel: number;
    activeFocus: string;
    onFocusColumn: (colKey: string, cIdx?: number) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetZoom: () => void;
  } = $props();
</script>

<div class="zoom-toolbar no-print">
  <!-- Quick Column Focus -->
  <div class="column-group">
    <button
      type="button"
      class="focus-btn"
      class:active={activeFocus === 'all' && zoomLevel === 1.0}
      onclick={() => onFocusColumn('all')}
      title="Celý náhled tabla (A4)"
    >
      Vše
    </button>
    {#each columns as _, cIdx}
      <button
        type="button"
        class="focus-btn"
        class:active={activeFocus === `col${cIdx + 1}`}
        onclick={() => onFocusColumn(`col${cIdx + 1}`, cIdx)}
        title="Přiblížit a vycentrovat Sloupec {cIdx + 1}"
      >
        Sl. {cIdx + 1}
      </button>
    {/each}
  </div>

  <!-- Zoom In / Out / Reset Controls -->
  <div class="zoom-stepper">
    <button
      type="button"
      class="step-btn"
      onclick={onZoomOut}
      disabled={zoomLevel <= 0.5}
      title="Oddálit (−)"
    >
      −
    </button>
    <button
      type="button"
      class="pct-btn"
      onclick={onResetZoom}
      title="Kliknutím obnovíte zobrazení celé stránky (100% / Fit)"
    >
      {Math.round(zoomLevel * 100)}%
    </button>
    <button
      type="button"
      class="step-btn"
      onclick={onZoomIn}
      disabled={zoomLevel >= 4.0}
      title="Přiblížit (+)"
    >
      +
    </button>
  </div>
</div>

<style>
  .zoom-toolbar {
    position: absolute;
    top: 1rem;
    right: 1.25rem;
    z-index: 40;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: rgba(255, 255, 255, 0.92);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    border: 1px solid rgba(203, 213, 225, 0.85);
    padding: 0.35rem 0.55rem;
    border-radius: 9999px;
    box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
  }

  .column-group {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    border-right: 1px solid #e2e8f0;
    padding-right: 0.4rem;
  }

  .focus-btn {
    background: transparent;
    border: none;
    color: #64748b;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.22rem 0.5rem;
    border-radius: 9999px;
    cursor: pointer;
    transition: all 0.15s ease;
    white-space: nowrap;
  }

  .focus-btn:hover {
    color: #0f172a;
    background: rgba(0, 0, 0, 0.05);
  }

  .focus-btn.active {
    background: #0284c7;
    color: #ffffff;
    box-shadow: 0 1px 3px rgba(2, 132, 199, 0.3);
  }

  .zoom-stepper {
    display: flex;
    align-items: center;
    gap: 0.15rem;
  }

  .step-btn {
    background: transparent;
    border: none;
    color: #475569;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    font-weight: bold;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }

  .step-btn:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.06);
    color: #0f172a;
  }

  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }

  .pct-btn {
    background: transparent;
    border: none;
    color: #0284c7;
    font-size: 0.75rem;
    font-weight: 700;
    min-width: 44px;
    text-align: center;
    padding: 0.2rem 0.3rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .pct-btn:hover {
    background: rgba(2, 132, 199, 0.08);
  }

  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
