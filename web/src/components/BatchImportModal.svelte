<script lang="ts">
  import type { FlatEntry } from '../lib/types';

  let {
    isOpen = false,
    flats = [],
    totalSlots = 28,
    onApply = () => {},
    onClose = () => {},
  }: {
    isOpen: boolean;
    flats: FlatEntry[];
    totalSlots: number;
    onApply: (updated: FlatEntry[]) => void;
    onClose: () => void;
  } = $props();

  let batchInputText = $state('');

  $effect(() => {
    if (isOpen) {
      batchInputText = flats
        .slice(0, totalSlots)
        .map((f) => {
          const names = [f.name1.trim(), f.name2.trim()].filter((n) => n.length > 0);
          return names.join(' / ');
        })
        .join('\n');
    }
  });

  function handleBatchApply() {
    const lines = batchInputText
      .split(/\r?\n/)
      .map((l) => l.trim());

    const updated = [...flats];
    while (updated.length < totalSlots) {
      updated.push({ id: updated.length + 1, name1: '', name2: '' });
    }

    for (let i = 0; i < totalSlots; i++) {
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

    onApply(updated);
  }
</script>

{#if isOpen}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="modal-backdrop no-print" onclick={onClose}>
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
          onclick={onClose}
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
          Vložte seznam {totalSlots} řádků (od bytu 01 do {String(totalSlots).padStart(2, '0')}). Pro dvě jména na jednom zvonku použijte lomítko nebo středník (např. <code>Jan Novák / Marie Nováková</code>).
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
          onclick={onClose}
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

<style>
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
    max-width: 560px;
    width: 100%;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    animation: modalPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  @keyframes modalPop {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(8px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1.1rem 1.4rem;
    border-bottom: 1px solid #f1f5f9;
  }

  .modal-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.65rem;
  }

  .modal-title {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    color: #0f172a;
  }

  .modal-close-btn {
    background: transparent;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    padding: 0.3rem;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
  }

  .modal-close-btn:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .modal-body {
    padding: 1.25rem 1.4rem;
  }

  .modal-lead {
    margin: 0 0 0.85rem;
    font-size: 0.875rem;
    color: #475569;
    line-height: 1.45;
  }

  .batch-textarea {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 0.85rem;
    padding: 0.75rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    outline: none;
    resize: vertical;
    line-height: 1.4;
    transition: border-color 0.15s;
  }

  .batch-textarea:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
  }

  .modal-footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    padding: 0.9rem 1.4rem;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.45rem 0.9rem;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
  }

  .btn-ghost {
    background: transparent;
    color: #64748b;
  }

  .btn-ghost:hover {
    color: #0f172a;
    background: #e2e8f0;
  }

  .btn-primary {
    background: #0284c7;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0369a1;
  }

  @media print {
    .no-print {
      display: none !important;
    }
  }
</style>
