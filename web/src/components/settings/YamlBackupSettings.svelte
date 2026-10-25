<script lang="ts">
  import { downloadFile } from '../../lib/svgGenerator';
  import { parseProjectYAML } from '../../lib/yamlProject';

  let {
    configYamlText = $bindable(''),
    onApplyParsedProject = () => {},
    onResetDefaults = () => {},
  }: {
    configYamlText: string;
    onApplyParsedProject: (parsed: ReturnType<typeof parseProjectYAML>) => void;
    onResetDefaults: () => void;
  } = $props();

  let copyFeedback = $state(false);
  let feedbackMessage = $state('Zkopírováno do schránky!');
  let fileInputEl: HTMLInputElement | null = $state(null);

  async function handleCopyConfigYAML() {
    try {
      await navigator.clipboard.writeText(configYamlText);
      feedbackMessage = 'Zkopírováno do schránky!';
      copyFeedback = true;
      setTimeout(() => (copyFeedback = false), 2500);
    } catch {
      feedbackMessage = 'Zkopírováno do schránky!';
      copyFeedback = true;
      setTimeout(() => (copyFeedback = false), 2500);
    }
  }

  function handleDownloadProjectYAML() {
    downloadFile(configYamlText, 'tablo-projekt.yaml', 'text/yaml;charset=utf-8');
    feedbackMessage = 'Projekt byl úspěšně stažen!';
    copyFeedback = true;
    setTimeout(() => (copyFeedback = false), 2500);
  }

  function handleApplyConfigYAML() {
    const parsed = parseProjectYAML(configYamlText);
    if (!parsed) {
      alert('Vložený text není platný formát projektu (YAML/JSON).');
      return;
    }
    onApplyParsedProject(parsed);
    feedbackMessage = 'Konfigurace byla úspěšně načtena!';
    copyFeedback = true;
    setTimeout(() => (copyFeedback = false), 2500);
  }

  function handleFileSelect(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const parsed = parseProjectYAML(text);
        if (!parsed) {
          alert('Nepodařilo se načíst YAML soubor. Zkontrolujte prosím formát.');
          return;
        }
        onApplyParsedProject(parsed);
        feedbackMessage = 'Soubor byl úspěšně importován!';
        copyFeedback = true;
        setTimeout(() => (copyFeedback = false), 2500);
      }
    };
    reader.readAsText(file);
    target.value = '';
  }
</script>

<div class="settings-card">
  <div class="section-header-flex">
    <h4 class="card-title">Sdílení a záloha projektu (YAML)</h4>
    {#if copyFeedback}
      <span class="copy-success-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        {feedbackMessage}
      </span>
    {/if}
  </div>
  <p class="card-desc">
    Kompletní stav projektu (geometrie tabla, seznam jmen i nastavení vzhledu a sazby) můžete uložit do čitelného souboru YAML s komentáři nebo načíst zpět.
  </p>

  <input
    type="file"
    bind:this={fileInputEl}
    onchange={handleFileSelect}
    accept=".yaml,.yml,.txt"
    style="display: none;"
  />

  <div class="file-action-buttons">
    <button type="button" class="btn btn-primary" onclick={handleDownloadProjectYAML}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      <span>Stáhnout projekt (YAML)</span>
    </button>
    <button type="button" class="btn btn-secondary" onclick={() => fileInputEl?.click()}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="17 8 12 3 7 8"></polyline>
        <line x1="12" y1="3" x2="12" y2="15"></line>
      </svg>
      <span>Nahrát projekt ze souboru</span>
    </button>
  </div>

  <textarea
    class="config-yaml-box"
    rows="8"
    bind:value={configYamlText}
    placeholder="# Zde můžete zkontrolovat nebo ručně upravit YAML..."
  ></textarea>
  <div class="yaml-actions">
    <button type="button" class="btn btn-secondary" onclick={handleCopyConfigYAML}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      <span>Kopírovat text</span>
    </button>
    <button type="button" class="btn btn-secondary" onclick={handleApplyConfigYAML}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>Použít vložený text</span>
    </button>
    <button type="button" class="btn btn-ghost text-muted" onclick={onResetDefaults}>
      Výchozí hodnoty
    </button>
  </div>
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

  .section-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  .card-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #0f172a;
  }

  .card-desc {
    margin: 0 0 0.85rem;
    font-size: 0.8rem;
    color: #64748b;
    line-height: 1.4;
  }

  .copy-success-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.72rem;
    font-weight: 600;
    background: #dcfce7;
    color: #15803d;
    padding: 0.2rem 0.55rem;
    border-radius: 9999px;
  }

  .file-action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.78rem;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
  }

  .btn-primary {
    background: #0284c7;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0369a1;
  }

  .btn-secondary {
    background: #ffffff;
    border-color: #cbd5e1;
    color: #334155;
  }

  .btn-secondary:hover {
    background: #f8fafc;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .btn-ghost {
    background: transparent;
    border: none;
    cursor: pointer;
  }

  .btn-ghost:hover {
    background: #f1f5f9;
  }

  .text-muted {
    color: #94a3b8;
  }

  .text-muted:hover {
    color: #ef4444;
  }

  .config-yaml-box {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 0.72rem;
    line-height: 1.4;
    padding: 0.6rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    color: #334155;
    resize: vertical;
    outline: none;
  }

  .config-yaml-box:focus {
    border-color: #0284c7;
    box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.15);
  }

  .yaml-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.65rem;
    flex-wrap: wrap;
  }
</style>
