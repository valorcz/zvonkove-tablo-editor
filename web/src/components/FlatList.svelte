<script lang="ts">
  import type { FlatEntry, BadgeStyleId, TableauLayoutConfig } from '../lib/types';
  import {
    checkFitStatus,
    type FontOption,
    DEFAULT_TEXT_PADDING_LEFT,
    getDefaultLayout,
    computeSlotMapping,
  } from '../lib/tableauConfig';

  let {
    flats,
    fontOption,
    badgeColor,
    isBold,
    badgeStyle = 'classic',
    textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT,
    layout = getDefaultLayout(),
  }: {
    flats: FlatEntry[];
    fontOption: FontOption;
    badgeColor: string;
    isBold: boolean;
    badgeStyle?: BadgeStyleId;
    textPaddingLeft?: number;
    layout?: TableauLayoutConfig;
  } = $props();

  function getFlat(id: number): FlatEntry {
    return flats.find((f) => f.id === id) || { id, name1: '', name2: '' };
  }

  function clearFlat(flat: FlatEntry) {
    flat.name1 = '';
    flat.name2 = '';
  }

  function editCustomNumber(flat: FlatEntry, defaultNum: string) {
    const current = flat.customNumber || defaultNum;
    const res = prompt(
      `Zadejte číslo nebo popisek pro tento zvonek (např. 12B, Správce):\n(Ponechte prázdné pro výchozí: ${defaultNum})`,
      current
    );
    if (res !== null) {
      const trimmed = res.trim();
      flat.customNumber = trimmed && trimmed !== defaultNum ? trimmed : undefined;
    }
  }

  const mappings = $derived(computeSlotMapping(layout));

  const columnsData = $derived(
    layout.columns.map((colCfg, cIdx) => {
      // Slots in this column sorted from top row to bottom row
      const colSlots = mappings
        .filter((m) => m.colIndex === cIdx)
        .sort((a, b) => a.rowIndex - b.rowIndex);

      let headerLabel = `Sloupec ${colCfg.id}`;
      if (colSlots.length > 0) {
        const firstNum = colSlots[0].defaultNumber;
        const lastNum = colSlots[colSlots.length - 1].defaultNumber;
        headerLabel += ` (${firstNum}–${lastNum})`;
      }

      return {
        id: colCfg.id,
        header: headerLabel,
        slots: colSlots,
      };
    })
  );

  function handleKeyDown(e: KeyboardEvent, currentSlotIndex: number, field: 'name1' | 'name2') {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (field === 'name1') {
        const nextEl = document.querySelector<HTMLInputElement>(
          `input[data-flat="${currentSlotIndex}"][data-field="name2"]`
        );
        nextEl?.focus();
        nextEl?.select();
      } else {
        // Move to next slot vertically in column
        let nextSlotIndex = currentSlotIndex;
        for (let c = 0; c < columnsData.length; c++) {
          const sIdx = columnsData[c].slots.findIndex((s) => s.slotIndex === currentSlotIndex);
          if (sIdx !== -1) {
            if (sIdx + 1 < columnsData[c].slots.length) {
              nextSlotIndex = columnsData[c].slots[sIdx + 1].slotIndex;
            } else {
              // Wrap to next column top
              const nextCol = (c + 1) % columnsData.length;
              if (columnsData[nextCol].slots.length > 0) {
                nextSlotIndex = columnsData[nextCol].slots[0].slotIndex;
              }
            }
            break;
          }
        }
        const nextEl = document.querySelector<HTMLInputElement>(
          `input[data-flat="${nextSlotIndex}"][data-field="name1"]`
        );
        nextEl?.focus();
        nextEl?.select();
      }
    }
  }
</script>

<div
  class="flat-list-columns"
  style="--col-count: {columnsData.length};"
>
  {#each columnsData as col (col.id)}
    <div class="column">
      <div class="column-header">{col.header}</div>
      <div class="cards-stack">
        {#each col.slots as slot (slot.slotIndex)}
          {@const flat = getFlat(slot.slotIndex)}
          {@const displayNum = flat.customNumber || slot.defaultNumber}
          {@const status = checkFitStatus([flat.name1, flat.name2], fontOption, isBold, badgeStyle, textPaddingLeft)}
          <div class="flat-row" class:status-overflow={status === 'overflow'} class:status-tight={status === 'tight'}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <span
              class="flat-badge style-{badgeStyle}"
              class:has-custom-num={Boolean(flat.customNumber)}
              style="background-color: {badgeStyle === 'none' || badgeStyle === 'inline-num' || badgeStyle === 'corner-index' || badgeStyle === 'outline' ? 'transparent' : badgeColor}; {badgeStyle === 'outline' ? `border: 2px solid ${badgeColor};` : ''} {badgeStyle === 'circle' ? 'border-radius: 9999px;' : ''} {badgeStyle === 'watermark' ? 'opacity: 0.7;' : ''}"
              title="Kliknutím upravíte číslo bytu (aktuálně: {displayNum})"
              onclick={() => editCustomNumber(flat, slot.defaultNumber)}
            >
              {displayNum}
            </span>
            <div class="inputs-group">
              <div class="input-line">
                <input
                  type="text"
                  data-flat={slot.slotIndex}
                  data-field="name1"
                  bind:value={flat.name1}
                  placeholder="Jméno 1 (výchozí: Byt {displayNum})"
                  class="name-input"
                  onkeydown={(e) => handleKeyDown(e, slot.slotIndex, 'name1')}
                />
                {#if status === 'overflow'}
                  <span class="warning-tag overflow" title="Text je příliš dlouhý a přetéká štítek!">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Nevejde se
                  </span>
                {:else if status === 'tight'}
                  <span class="warning-tag tight" title="Písmo muselo být výrazně zmenšeno">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    Zmenšeno
                  </span>
                {/if}
                {#if flat.name1 || flat.name2}
                  <button type="button" class="clear-btn" title="Vymazat jména" onclick={() => clearFlat(flat)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                {/if}
              </div>
              <input
                type="text"
                data-flat={slot.slotIndex}
                data-field="name2"
                bind:value={flat.name2}
                placeholder="Jméno 2 (volitelné)"
                class="name-input secondary"
                onkeydown={(e) => handleKeyDown(e, slot.slotIndex, 'name2')}
              />
            </div>
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .flat-list-columns {
    display: grid;
    grid-template-columns: repeat(var(--col-count, 3), minmax(280px, 1fr));
    gap: 1rem;
    padding: 1rem;
    box-sizing: border-box;
    overflow-x: auto;
  }

  .column {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .column-header {
    background: #f8fafc;
    padding: 0.65rem 0.85rem;
    font-size: 0.82rem;
    font-weight: 700;
    color: #334155;
    border-bottom: 1px solid #e2e8f0;
    text-transform: uppercase;
    letter-spacing: 0.025em;
  }

  .cards-stack {
    display: flex;
    flex-direction: column;
    padding: 0.5rem;
    gap: 0.5rem;
  }

  .flat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem;
    border-radius: 6px;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    transition: all 0.15s ease;
  }

  .flat-row:hover {
    background: #ffffff;
    border-color: #cbd5e1;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);
  }

  .flat-row.status-tight {
    border-color: #fde68a;
    background: #fffbeb;
  }

  .flat-row.status-overflow {
    border-color: #fecaca;
    background: #fef2f2;
  }

  .flat-badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.1rem;
    height: 1.8rem;
    border-radius: 4px;
    font-family: 'Iosevka-Fixed-Bold', monospace;
    font-size: 0.85rem;
    font-weight: 700;
    color: #0f172a;
    flex-shrink: 0;
    user-select: none;
    border: 1px solid rgba(0, 0, 0, 0.12);
    cursor: pointer;
    transition: transform 0.1s ease;
  }

  .flat-badge:hover {
    transform: scale(1.08);
  }

  .flat-badge.has-custom-num {
    border: 1.5px solid #0284c7;
    box-shadow: 0 0 0 1px #0284c7;
  }

  .flat-badge.style-inline-num {
    border: 1px dashed #cbd5e1;
    color: #334155;
  }

  .flat-badge.style-none {
    border: 1px dashed #e2e8f0;
    color: #94a3b8;
  }

  .inputs-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 0;
  }

  .input-line {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    width: 100%;
  }

  .name-input {
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 0.3rem 0.5rem;
    font-size: 0.85rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    background: #ffffff;
    flex: 1;
    min-width: 0;
  }

  .name-input:focus {
    border-color: #2563eb;
  }

  .name-input.secondary {
    font-size: 0.775rem;
    color: #475569;
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.2rem;
    border-radius: 3px;
    line-height: 1;
    transition: all 0.15s;
  }

  .clear-btn:hover {
    color: #ef4444;
    background: #fee2e2;
  }

  .warning-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.15rem 0.35rem;
    border-radius: 3px;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .warning-tag.tight {
    background: #fef3c7;
    color: #92400e;
    border: 1px solid #fde68a;
  }

  .warning-tag.overflow {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  @media (max-width: 900px) {
    .flat-list-columns {
      grid-template-columns: 1fr;
      gap: 1.25rem;
      padding: 0.75rem;
    }

    .flat-row {
      padding: 0.65rem;
      gap: 0.65rem;
    }

    .flat-badge {
      width: 2.3rem;
      height: 2rem;
      font-size: 0.95rem;
    }

    .name-input {
      padding: 0.45rem 0.65rem;
      font-size: 0.95rem;
    }

    .name-input.secondary {
      font-size: 0.85rem;
    }

    .clear-btn {
      padding: 0.35rem;
    }
  }
</style>
