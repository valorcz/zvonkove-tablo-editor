<script lang="ts">
  import type { FlatEntry, BadgeStyleId } from '../lib/types';
  import {
    checkFitStatus,
    type FontOption,
    DEFAULT_TEXT_PADDING_LEFT,
  } from '../lib/tableauConfig';

  let {
    flats,
    fontOption,
    badgeColor,
    isBold,
    badgeStyle = 'classic',
    textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT,
  }: {
    flats: FlatEntry[];
    fontOption: FontOption;
    badgeColor: string;
    isBold: boolean;
    badgeStyle?: BadgeStyleId;
    textPaddingLeft?: number;
  } = $props();

  function getFlat(id: number): FlatEntry {
    return flats.find((f) => f.id === id) || { id, name1: '', name2: '' };
  }

  function clearFlat(flat: FlatEntry) {
    flat.name1 = '';
    flat.name2 = '';
  }

  function handleKeyDown(e: KeyboardEvent, currentFlatId: number, field: 'name1' | 'name2') {
    if (e.key === 'Enter') {
      e.preventDefault();
      let targetId = currentFlatId;
      let targetField: 'name1' | 'name2' = field;

      if (field === 'name1') {
        targetField = 'name2';
      } else {
        // In physical columns, flats go downwards: 10->9->8... or 20->19...
        targetId = currentFlatId - 1;
        if (targetId === 0) targetId = 20;
        if (targetId === 10) targetId = 28;
        if (targetId === 20) targetId = 10;
        targetField = 'name1';
      }

      const nextEl = document.querySelector<HTMLInputElement>(
        `input[data-flat="${targetId}"][data-field="${targetField}"]`
      );
      if (nextEl) {
        nextEl.focus();
        nextEl.select();
      }
    }
  }

  // Physical column sequences
  const col1Ids = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1];
  const col2Ids = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
  const col3Ids = [28, 27, 26, 25, 24, 23, 22, 21];
</script>

<div class="flat-list-columns">
  <!-- Column 1 -->
  <div class="column">
    <div class="column-header">Sloupec 1 (Byty 10–01)</div>
    <div class="cards-stack">
      {#each col1Ids as fid (fid)}
        {@const flat = getFlat(fid)}
        {@const status = checkFitStatus([flat.name1, flat.name2], fontOption, isBold, badgeStyle, textPaddingLeft)}
        <div class="flat-row" class:status-overflow={status === 'overflow'} class:status-tight={status === 'tight'}>
          <span
            class="flat-badge style-{badgeStyle}"
            style="background-color: {badgeStyle === 'none' || badgeStyle === 'inline-num' ? 'transparent' : badgeColor}; {badgeStyle === 'watermark' ? 'opacity: 0.7;' : ''}"
            title="Byt {fid} ({badgeStyle === 'none' ? 'číslo skryto' : 'styl: ' + badgeStyle})"
          >
            {String(fid).padStart(2, '0')}
          </span>
          <div class="inputs-group">
            <div class="input-line">
              <input
                type="text"
                data-flat={fid}
                data-field="name1"
                bind:value={flat.name1}
                placeholder="Jméno 1 (výchozí: Byt {fid})"
                class="name-input"
                onkeydown={(e) => handleKeyDown(e, fid, 'name1')}
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
              data-flat={fid}
              data-field="name2"
              bind:value={flat.name2}
              placeholder="Jméno 2 (volitelné)"
              class="name-input secondary"
              onkeydown={(e) => handleKeyDown(e, fid, 'name2')}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Column 2 -->
  <div class="column">
    <div class="column-header">Sloupec 2 (Byty 20–11)</div>
    <div class="cards-stack">
      {#each col2Ids as fid (fid)}
        {@const flat = getFlat(fid)}
        {@const status = checkFitStatus([flat.name1, flat.name2], fontOption, isBold, badgeStyle, textPaddingLeft)}
        <div class="flat-row" class:status-overflow={status === 'overflow'} class:status-tight={status === 'tight'}>
          <span
            class="flat-badge style-{badgeStyle}"
            style="background-color: {badgeStyle === 'none' || badgeStyle === 'inline-num' ? 'transparent' : badgeColor}; {badgeStyle === 'watermark' ? 'opacity: 0.7;' : ''}"
            title="Byt {fid} ({badgeStyle === 'none' ? 'číslo skryto' : 'styl: ' + badgeStyle})"
          >
            {String(fid).padStart(2, '0')}
          </span>
          <div class="inputs-group">
            <div class="input-line">
              <input
                type="text"
                data-flat={fid}
                data-field="name1"
                bind:value={flat.name1}
                placeholder="Jméno 1 (výchozí: Byt {fid})"
                class="name-input"
                onkeydown={(e) => handleKeyDown(e, fid, 'name1')}
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
              data-flat={fid}
              data-field="name2"
              bind:value={flat.name2}
              placeholder="Jméno 2 (volitelné)"
              class="name-input secondary"
              onkeydown={(e) => handleKeyDown(e, fid, 'name2')}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>

  <!-- Column 3 -->
  <div class="column">
    <div class="column-header">Sloupec 3 (Byty 28–21)</div>
    <div class="cards-stack">
      {#each col3Ids as fid (fid)}
        {@const flat = getFlat(fid)}
        {@const status = checkFitStatus([flat.name1, flat.name2], fontOption, isBold, badgeStyle, textPaddingLeft)}
        <div class="flat-row" class:status-overflow={status === 'overflow'} class:status-tight={status === 'tight'}>
          <span
            class="flat-badge style-{badgeStyle}"
            style="background-color: {badgeStyle === 'none' || badgeStyle === 'inline-num' ? 'transparent' : badgeColor}; {badgeStyle === 'watermark' ? 'opacity: 0.7;' : ''}"
            title="Byt {fid} ({badgeStyle === 'none' ? 'číslo skryto' : 'styl: ' + badgeStyle})"
          >
            {String(fid).padStart(2, '0')}
          </span>
          <div class="inputs-group">
            <div class="input-line">
              <input
                type="text"
                data-flat={fid}
                data-field="name1"
                bind:value={flat.name1}
                placeholder="Jméno 1 (výchozí: Byt {fid})"
                class="name-input"
                onkeydown={(e) => handleKeyDown(e, fid, 'name1')}
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
              data-flat={fid}
              data-field="name2"
              bind:value={flat.name2}
              placeholder="Jméno 2 (volitelné)"
              class="name-input secondary"
              onkeydown={(e) => handleKeyDown(e, fid, 'name2')}
            />
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<style>
  .flat-list-columns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    padding: 1rem;
    box-sizing: border-box;
    overflow-y: auto;
  }

  .column {
    background: #ffffff;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .column-header {
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    padding: 0.75rem 1rem;
    font-weight: 600;
    font-size: 0.875rem;
    color: #334155;
    text-align: center;
  }

  .cards-stack {
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .flat-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.5rem;
    border: 1px solid #f1f5f9;
    border-radius: 6px;
    background: #fafafa;
    transition: background 0.15s, border-color 0.15s;
  }

  .flat-row:focus-within {
    background: #f0fdf4;
    border-color: #86efac;
  }

  .flat-row.status-tight {
    border-color: #fcd34d;
    background: #fffbeb;
  }

  .flat-row.status-overflow {
    border-color: #fca5a5;
    background: #fef2f2;
  }

  .flat-badge {
    color: #333333;
    font-family: 'Iosevka-Fixed-Bold', monospace;
    font-weight: 700;
    font-size: 0.875rem;
    width: 2.2rem;
    height: 1.8rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    flex-shrink: 0;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .flat-badge.style-left-block {
    border-radius: 2px;
    border-right: 2px solid #cbd5e1;
  }

  .flat-badge.style-inline-num {
    border: none;
    background: transparent;
    color: #0f172a;
    font-weight: 800;
  }

  .flat-badge.style-none {
    border: 1px dashed #cbd5e1;
    color: #94a3b8;
    background: #f8fafc;
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
