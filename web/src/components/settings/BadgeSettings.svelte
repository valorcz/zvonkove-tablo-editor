<script lang="ts">
  import type { BadgePosition, BadgeShape, BadgeStyleId } from '../../lib/types';
  import {
    BADGE_POSITIONS,
    BADGE_SHAPES,
    decodeBadgeStyle,
    encodeBadgeStyle,
  } from '../../lib/badgeRegistry';

  let {
    badgeStyle = $bindable('classic'),
    badgeColor = $bindable('#FFE6C7'),
    showIds = $bindable(true),
  }: {
    badgeStyle: BadgeStyleId;
    badgeColor: string;
    showIds: boolean;
  } = $props();

  const colorPresets = [
    { label: 'Tesla Vintage broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Břidlicově modrá', value: '#BAE6FD' },
    { label: 'Pískově žlutá', value: '#FEF3C7' },
    { label: 'Neutrální šedá', value: '#E2E8F0' },
    { label: 'Čistá bílá', value: '#FFFFFF' },
  ];

  let currentPos: BadgePosition = $state(decodeBadgeStyle(badgeStyle).position);
  let currentShape: BadgeShape = $state(decodeBadgeStyle(badgeStyle).shape);

  $effect(() => {
    const decoded = decodeBadgeStyle(badgeStyle);
    currentPos = decoded.position;
    currentShape = decoded.shape;
  });

  function selectPosition(pos: BadgePosition) {
    currentPos = pos;
    // Ensure shape is valid for position
    if (pos === 'left-block') {
      currentShape = 'badge';
    } else if (pos === 'watermark' || pos === 'none') {
      currentShape = 'none';
    } else if (pos === 'corner-index' && currentShape === 'circle') {
      currentShape = 'none';
    }
    badgeStyle = encodeBadgeStyle(currentPos, currentShape);
    showIds = currentPos !== 'none';
  }

  function selectShape(shp: BadgeShape) {
    currentShape = shp;
    badgeStyle = encodeBadgeStyle(currentPos, currentShape);
    showIds = currentPos !== 'none';
  }

  const isColorVisible = $derived(
    currentPos !== 'none' &&
      ((currentPos === 'right-center' && currentShape !== 'none') ||
        (currentPos === 'corner-index' && currentShape !== 'none') ||
        currentPos === 'left-block' ||
        currentPos === 'watermark')
  );

  const activePositionObj = $derived(
    BADGE_POSITIONS.find((p) => p.id === currentPos) || BADGE_POSITIONS[0]
  );
</script>

<div class="settings-card">
  <h4 class="card-title">Čísla bytů a orientační prvky</h4>
  <p class="card-desc">
    Zvolte prostorové umístění a grafickou podobu čísel bytů na zvonkových štítcích.
  </p>

  <!-- 1. Position Selector -->
  <div class="form-field">
    <span class="field-label">Pozice čísla na štítku:</span>
    <div class="badge-styles-grid">
      {#each BADGE_POSITIONS as p}
        <button
          type="button"
          class="badge-style-btn"
          class:active={currentPos === p.id}
          onclick={() => selectPosition(p.id)}
        >
          <div class="badge-style-header">
            <span class="style-name">{p.label}</span>
            {#if currentPos === p.id}
              <span class="check-icon">✓</span>
            {/if}
          </div>
          <p class="style-desc">{p.description}</p>
        </button>
      {/each}
    </div>
  </div>

  <!-- 2. Shape / Container Selector (only for positions with shape choices) -->
  {#if activePositionObj.supportedShapes.length > 1}
    <div class="form-field" style="margin-top: 1rem;">
      <span class="field-label">Styl podkladu čísla:</span>
      <div class="shapes-segmented-control">
        {#each activePositionObj.supportedShapes as shpId}
          {@const shp = BADGE_SHAPES.find((s) => s.id === shpId)}
          {#if shp}
            <button
              type="button"
              class="shape-seg-btn"
              class:active={currentShape === shpId}
              onclick={() => selectShape(shpId)}
            >
              {shp.label}
            </button>
          {/if}
        {/each}
      </div>
    </div>
  {/if}

  <!-- 3. Accent Color Picker -->
  {#if isColorVisible}
    <div class="form-field" style="margin-top: 1rem;">
      <span class="field-label">
        {currentPos === 'watermark' ? 'Odstín vodoznaku:' : 'Barva podkladu čísla:'}
      </span>
      <div class="color-picker-row">
        <div class="color-input-wrap">
          <input
            type="color"
            bind:value={badgeColor}
            class="color-picker-square"
            title="Výběr libovolné barvy"
          />
          <span class="color-hex-text">{badgeColor}</span>
        </div>
        <div class="presets-wrap">
          {#each colorPresets as p}
            <button
              type="button"
              class="preset-chip"
              style="background-color: {p.value};"
              title={p.label}
              onclick={() => (badgeColor = p.value)}
            ></button>
          {/each}
        </div>
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

  .card-title {
    margin: 0 0 0.35rem;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
  }

  .card-desc {
    margin: 0 0 0.75rem;
    font-size: 0.78rem;
    color: #64748b;
    line-height: 1.4;
  }

  .badge-styles-grid {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .badge-style-btn {
    text-align: left;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.55rem 0.75rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .badge-style-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  .badge-style-btn.active {
    background: #f0f9ff;
    border-color: #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .badge-style-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.15rem;
  }

  .style-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #0f172a;
  }

  .check-icon {
    font-size: 0.85rem;
    font-weight: bold;
    color: #0284c7;
  }

  .style-desc {
    margin: 0;
    font-size: 0.73rem;
    color: #64748b;
    line-height: 1.35;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .shapes-segmented-control {
    display: flex;
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 3px;
    gap: 3px;
  }

  .shape-seg-btn {
    flex: 1;
    padding: 0.45rem 0.5rem;
    font-size: 0.78rem;
    font-weight: 500;
    color: #475569;
    background: transparent;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.15s ease;
    text-align: center;
  }

  .shape-seg-btn:hover {
    color: #0f172a;
    background: rgba(255, 255, 255, 0.5);
  }

  .shape-seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .color-picker-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .color-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
  }

  .color-picker-square {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: none;
    padding: 0;
  }

  .color-picker-square::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  .color-picker-square::-webkit-color-swatch {
    border: 1px solid rgba(0, 0, 0, 0.15);
    border-radius: 4px;
  }

  .color-hex-text {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .presets-wrap {
    display: flex;
    gap: 0.4rem;
    align-items: center;
  }

  .preset-chip {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.18);
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    padding: 0;
  }

  .preset-chip:hover {
    transform: scale(1.15);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
  }
</style>
