<script lang="ts">
  import { tick } from 'svelte';
  import type { FlatEntry } from '../lib/types';
  import {
    COL_ORIGINS_X,
    SVG_VIEWBOX,
    SVG_WIDTH,
    PX_PER_MM,
    flatIdToSlot,
    getSlotCoordinates,
    calculateFontSize,
    type FontOption,
    BADGE_WIDTH,
    BADGE_HEIGHT,
    BADGE_RX,
    BADGE_FONT_SIZE,
  } from '../lib/tableauConfig';
  import {
    IOSEVKA_SEMIBOLD_WOFF,
    IOSEVKA_BOLD_WOFF,
    DIN_REGULAR_WOFF,
    DIN_BOLD_WOFF,
    FIRA_REGULAR_WOFF,
    FIRA_BOLD_WOFF,
    TECHNIC_NT_WOFF,
  } from '../assets/embeddedAssets';

  let {
    flats,
    showIds,
    badgeColor,
    fontOption,
    isBold,
    showScale = true,
  }: {
    flats: FlatEntry[];
    showIds: boolean;
    badgeColor: string;
    fontOption: FontOption;
    isBold: boolean;
    showScale?: boolean;
  } = $props();

  const fontWeight = $derived(
    isBold ? (fontOption.id === 'Iosevka' ? 600 : 700) : 400
  );

  interface RenderCard {
    id: number;
    names: string[];
    fs: number;
    textX: number;
    lines: { text: string; y: number }[];
  }

  interface RenderBadge {
    id: number;
    idStr: string;
    rectX: number;
    rectY: number;
    cx: number;
    textY: number;
  }

  const cards = $derived(
    flats.map((entry) => {
      const names = [entry.name1.trim(), entry.name2.trim()].filter((n) => n.length > 0);
      const displayNames = names.length > 0 ? names : [`Byt ${entry.id}`];

      const { col, row } = flatIdToSlot(entry.id);
      const coords = getSlotCoordinates(col, row);
      const fs = calculateFontSize(displayNames, fontOption, isBold);

      const lines: { text: string; y: number }[] = [];
      if (displayNames.length === 1) {
        lines.push({
          text: displayNames[0],
          y: coords.slotCenterY + 0.38 * fs,
        });
      } else {
        const lineHeight = fs * 1.15;
        lines.push({
          text: displayNames[0],
          y: coords.slotCenterY - 0.5 * lineHeight + 0.38 * fs,
        });
        lines.push({
          text: displayNames[1],
          y: coords.slotCenterY + 0.5 * lineHeight + 0.38 * fs,
        });
      }

      return {
        id: entry.id,
        names: displayNames,
        fs,
        textX: coords.textX,
        lines,
      } as RenderCard;
    })
  );

  const badges = $derived(
    flats.map((entry) => {
      const { col, row } = flatIdToSlot(entry.id);
      const coords = getSlotCoordinates(col, row);
      const cx = coords.badgeCx;
      const cy = coords.badgeCy;

      return {
        id: entry.id,
        idStr: String(entry.id).padStart(2, '0'),
        rectX: cx - BADGE_WIDTH / 2.0,
        rectY: cy - BADGE_HEIGHT / 2.0,
        cx,
        textY: cy + 0.36 * BADGE_FONT_SIZE,
      } as RenderBadge;
    })
  );

  // Ruler ticks (0 to 100 mm)
  const rulerLengthMm = 100;
  const rulerLengthPx = rulerLengthMm * PX_PER_MM;
  const startX = (SVG_WIDTH - rulerLengthPx) / 2.0;
  const rulerY = 2270;

  const rulerTicks = Array.from({ length: rulerLengthMm + 1 }, (_, mm) => {
    const x = startX + mm * PX_PER_MM;
    const isMajor = mm % 10 === 0;
    const isMid = mm % 5 === 0 && !isMajor;
    const tickHeight = isMajor ? 26 : (isMid ? 16 : 9);
    return {
      x,
      y1: rulerY,
      y2: rulerY - tickHeight,
      strokeWidth: isMajor ? 2 : 1,
      isMajor,
      cmVal: isMajor ? mm / 10 : null,
    };
  });

  const templateSlotYs = Array.from({ length: 10 }, (_, i) => 15.5 + i * 160.0);

  // --- Zoom & Viewport Controls ---
  let zoomLevel: number = $state(1.0); // 1.0 = fit full page
  let activeFocus: 'all' | 'col1' | 'col2' | 'col3' = $state('all');
  let viewportEl: HTMLDivElement | null = $state(null);

  function resetZoom() {
    zoomLevel = 1.0;
    activeFocus = 'all';
    if (viewportEl) {
      viewportEl.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  }

  function zoomIn() {
    activeFocus = 'all';
    zoomLevel = Math.min(4.0, Math.round((zoomLevel + 0.25) * 100) / 100);
  }

  function zoomOut() {
    activeFocus = 'all';
    zoomLevel = Math.max(0.5, Math.round((zoomLevel - 0.25) * 100) / 100);
  }

  async function focusColumn(colKey: 'all' | 'col1' | 'col2' | 'col3') {
    activeFocus = colKey;
    if (colKey === 'all') {
      resetZoom();
      return;
    }

    // Zoom into column view (260% scale)
    zoomLevel = 2.6;
    await tick();

    requestAnimationFrame(() => {
      if (!viewportEl) return;
      const scrollW = viewportEl.scrollWidth;
      const viewW = viewportEl.clientWidth;

      // Horizontal centers relative to total 3508px width:
      // Col 1 center = 639.5 / 3508 = 0.1823
      // Col 2 center = 1701.5 / 3508 = 0.4850
      // Col 3 center = 2763.5 / 3508 = 0.7878
      let targetRatio = 0.1823;
      if (colKey === 'col2') targetRatio = 0.485;
      if (colKey === 'col3') targetRatio = 0.7878;

      const targetX = targetRatio * scrollW - viewW / 2;
      viewportEl.scrollTo({
        left: Math.max(0, targetX),
        top: 0,
        behavior: 'smooth',
      });
    });
  }

  function handleWheel(e: WheelEvent) {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      if (e.deltaY < 0) {
        zoomIn();
      } else {
        zoomOut();
      }
    }
  }
</script>

<div class="preview-wrapper">
  <!-- Floating Zoom & Column Widget (Hidden in print) -->
  <div class="zoom-toolbar no-print">
    <!-- Quick Column Focus -->
    <div class="column-group">
      <button
        class="focus-btn"
        class:active={activeFocus === 'all' && zoomLevel === 1.0}
        onclick={() => focusColumn('all')}
        title="Zobrazit celé tablo na výšku stránky"
      >
        Celé tablo
      </button>
      <button
        class="focus-btn"
        class:active={activeFocus === 'col1'}
        onclick={() => focusColumn('col1')}
        title="Detailní pohled na Sloupec 1 (Byty 10–01)"
      >
        Sloupec 1
      </button>
      <button
        class="focus-btn"
        class:active={activeFocus === 'col2'}
        onclick={() => focusColumn('col2')}
        title="Detailní pohled na Sloupec 2 (Byty 20–11)"
      >
        Sloupec 2
      </button>
      <button
        class="focus-btn"
        class:active={activeFocus === 'col3'}
        onclick={() => focusColumn('col3')}
        title="Detailní pohled na Sloupec 3 (Byty 28–21)"
      >
        Sloupec 3
      </button>
    </div>

    <!-- Zoom In / Out / Reset Controls -->
    <div class="zoom-stepper">
      <button
        type="button"
        class="step-btn"
        onclick={zoomOut}
        disabled={zoomLevel <= 0.5}
        title="Oddálit (−)"
      >
        −
      </button>
      <button
        type="button"
        class="pct-btn"
        onclick={resetZoom}
        title="Kliknutím obnovíte zobrazení celé stránky (100% / Fit)"
      >
        {Math.round(zoomLevel * 100)}%
      </button>
      <button
        type="button"
        class="step-btn"
        onclick={zoomIn}
        disabled={zoomLevel >= 4.0}
        title="Přiblížit (+)"
      >
        +
      </button>
    </div>
  </div>

  <!-- Scrollable Viewport -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="svg-scroll-viewport"
    bind:this={viewportEl}
    onwheel={handleWheel}
  >
    <div
      class="svg-canvas-box"
      style="width: {zoomLevel === 1.0 ? '100%' : `${zoomLevel * 100}%`};"
    >
      <svg
        viewBox={SVG_VIEWBOX}
        width="100%"
        height="100%"
        version="1.1"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;"
      >
        <defs>
          <style>
            .name-text {
              fill: #000000;
            }
            .badge-text {
              font-family: 'Iosevka-Fixed-Bold', 'Iosevka Fixed', monospace;
              font-weight: 700;
              fill: #000000;
            }
            .scale-text {
              font-family: 'DINish', sans-serif;
              fill: #000000;
            }
          </style>

          <!-- Pure Vector Column Strip Template -->
          <g id="_ColumnTemplate">
            <rect x="0.5" y="0.5" width="621" height="1611" fill="none" stroke="#000000" stroke-width="1.5" />
            {#each templateSlotYs as y}
              <rect x="110.5" y={y} width="490" height="130" fill="none" stroke="#000000" stroke-width="1.5" />
            {/each}
          </g>
        </defs>

        <!-- Column 1 vector background -->
        <g transform="matrix(1.17229,0,0,1.17231,{COL_ORIGINS_X[0]},210.788)">
          <use xlink:href="#_ColumnTemplate" />
        </g>
        <!-- Column 2 vector background -->
        <g transform="matrix(1.17229,0,0,1.17231,{COL_ORIGINS_X[1]},210.788)">
          <use xlink:href="#_ColumnTemplate" />
        </g>
        <!-- Column 3 vector background -->
        <g transform="matrix(1.17229,0,0,1.17231,{COL_ORIGINS_X[2]},210.788)">
          <use xlink:href="#_ColumnTemplate" />
        </g>

        <!-- Names Layer -->
        <g id="Příjmení">
          {#each cards as card (card.id)}
            <g id="card-flat-{String(card.id).padStart(2, '0')}">
              {#each card.lines as line}
                <text
                  x="{card.textX.toFixed(2)}px"
                  y="{line.y.toFixed(2)}px"
                  class="name-text"
                  style="font-family: {fontOption.fontFamily}; font-weight: {fontWeight}; font-size: {card.fs.toFixed(3)}px;"
                >
                  {line.text}
                </text>
              {/each}
            </g>
          {/each}
        </g>

        <!-- Flat IDs Layer -->
        <g id="Čísla-bytů" style={showIds ? '' : 'display: none;'}>
          {#each badges as badge (badge.id)}
            <g id="flat-badge-{badge.idStr}">
              <rect
                x="{badge.rectX.toFixed(2)}px"
                y="{badge.rectY.toFixed(2)}px"
                width="{BADGE_WIDTH.toFixed(2)}px"
                height="{BADGE_HEIGHT.toFixed(2)}px"
                rx="{BADGE_RX.toFixed(2)}px"
                ry="{BADGE_RX.toFixed(2)}px"
                style="fill: {badgeColor};"
              />
              <text
                x="{badge.cx.toFixed(2)}px"
                y="{badge.textY.toFixed(2)}px"
                text-anchor="middle"
                class="badge-text"
                style="font-size: {BADGE_FONT_SIZE.toFixed(2)}px;"
              >
                {badge.idStr}
              </text>
            </g>
          {/each}
        </g>

        <!-- Printable 1:1 Calibration Scale -->
        {#if showScale}
          <g id="Měřítko-tisku">
            <line
              x1="{startX.toFixed(2)}"
              y1="{rulerY}"
              x2="{(startX + rulerLengthPx).toFixed(2)}"
              y2="{rulerY}"
              stroke="#000000"
              stroke-width="2.5"
            />
            {#each rulerTicks as tick}
              <line
                x1="{tick.x.toFixed(2)}"
                y1="{tick.y1}"
                x2="{tick.x.toFixed(2)}"
                y2="{tick.y2}"
                stroke="#000000"
                stroke-width="{tick.strokeWidth}"
              />
              {#if tick.isMajor}
                <text
                  x="{tick.x.toFixed(2)}"
                  y="{rulerY - 32}"
                  text-anchor="middle"
                  class="scale-text"
                  style="font-size: 22px; font-weight: 600;"
                >
                  {tick.cmVal}
                </text>
              {/if}
            {/each}
            <text
              x="{(SVG_WIDTH / 2).toFixed(2)}"
              y="{rulerY + 36}"
              text-anchor="middle"
              class="scale-text"
              style="font-size: 26px; font-weight: 700;"
            >
              KONTROLNÍ MĚŘÍTKO 1:1 (PŘESNĚ 100 mm / 10 cm)
            </text>
            <text
              x="{(SVG_WIDTH / 2).toFixed(2)}"
              y="{rulerY + 68}"
              text-anchor="middle"
              class="scale-text"
              style="font-size: 20px; fill: #475569;"
            >
              Při tisku zkontrolujte pravítkem. Pokud úsečka neměří přesně 100 mm, nastavte měřítko tisku na 100% (Skutečná velikost / Do not fit).
            </text>
            <text
              x="{(SVG_WIDTH / 2).toFixed(2)}"
              y="{rulerY + 96}"
              text-anchor="middle"
              class="scale-text"
              style="font-size: 18px; fill: #64748b;"
            >
              Rozměr jednoho štítku: 48,6 × 12,9 mm
            </text>
          </g>
        {/if}
      </svg>
    </div>
  </div>
</div>

<style>
  .preview-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    background: #e2e8f0;
    overflow: hidden;
  }

  /* Floating Zoom Widget */
  .zoom-toolbar {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 50;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(8px);
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    padding: 0.35rem 0.6rem;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
    user-select: none;
  }

  .column-group {
    display: flex;
    gap: 0.2rem;
    background: #f1f5f9;
    padding: 0.2rem;
    border-radius: 6px;
  }

  .focus-btn {
    border: none;
    background: transparent;
    padding: 0.25rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 500;
    color: #475569;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .focus-btn:hover {
    color: #0f172a;
    background: #e2e8f0;
  }

  .focus-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 600;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
  }

  .zoom-stepper {
    display: flex;
    align-items: center;
    gap: 0.15rem;
    background: #f1f5f9;
    padding: 0.2rem 0.3rem;
    border-radius: 6px;
  }

  .step-btn {
    background: transparent;
    border: none;
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.95rem;
    font-weight: 700;
    color: #334155;
    border-radius: 4px;
    cursor: pointer;
    line-height: 1;
    transition: background 0.15s;
  }

  .step-btn:hover:not(:disabled) {
    background: #e2e8f0;
    color: #0f172a;
  }

  .step-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pct-btn {
    background: transparent;
    border: none;
    padding: 0.15rem 0.45rem;
    font-size: 0.78rem;
    font-weight: 600;
    color: #0284c7;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.15s;
    min-width: 44px;
    text-align: center;
  }

  .pct-btn:hover {
    background: #e0f2fe;
  }

  /* Scrollable SVG Viewport */
  .svg-scroll-viewport {
    flex: 1;
    width: 100%;
    height: 100%;
    overflow: auto;
    display: block;
    padding: 4.5rem 1.5rem 1.5rem 1.5rem;
    box-sizing: border-box;
  }

  .svg-canvas-box {
    display: block;
    margin: 0 auto;
    max-width: none;
  }

  svg {
    width: 100%;
    height: auto;
    aspect-ratio: 3508 / 2481;
    background: #ffffff;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
    border-radius: 4px;
    display: block;
  }

  @media print {
    *, *:before, *:after {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .no-print {
      display: none !important;
    }

    .preview-wrapper,
    .svg-scroll-viewport,
    .svg-canvas-box {
      background: none !important;
      padding: 0 !important;
      margin: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      overflow: hidden !important;
    }

    svg {
      box-shadow: none !important;
      border-radius: 0 !important;
      width: 297mm !important;
      height: 210mm !important;
      min-width: 297mm !important;
      min-height: 210mm !important;
      max-width: 297mm !important;
      max-height: 210mm !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      display: block !important;
    }
  }
</style>
