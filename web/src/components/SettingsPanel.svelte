<script lang="ts">
  import type {
    BadgeStyleId,
    PrintColumnOption,
    FlatEntry,
    TableauLayoutConfig,
    TableauPresetId,
    NumberingDirection,
    PrintLayoutMode,
  } from '../lib/types';
  import {
    FONT_OPTIONS,
    BADGE_STYLES,
    TABLEAU_PRESETS,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
    getDefaultLayout,
    getTotalSlots,
    serializeProjectYAML,
    parseProjectYAML,
    getSlotCoordinates,
    calculateFontSize,
    getWatermarkStyle,
    type FontOption,
  } from '../lib/tableauConfig';
  import { downloadFile } from '../lib/svgGenerator';

  let {
    flats = $bindable(),
    selectedFontId = $bindable(),
    isBold = $bindable(),
    badgeStyle = $bindable('classic'),
    badgeColor = $bindable(),
    showIds = $bindable(),
    textPaddingLeft = $bindable(DEFAULT_TEXT_PADDING_LEFT),
    showCropMarks = $bindable(true),
    showScale = $bindable(true),
    printColumn = $bindable('all'),
    layout = $bindable(getDefaultLayout()),
    onClose = () => {},
  }: {
    flats?: FlatEntry[];
    selectedFontId: string;
    isBold: boolean;
    badgeStyle: BadgeStyleId;
    badgeColor: string;
    showIds: boolean;
    textPaddingLeft: number;
    showCropMarks: boolean;
    showScale: boolean;
    printColumn?: PrintColumnOption;
    layout?: TableauLayoutConfig;
    onClose?: () => void;
  } = $props();

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0]
  );

  let configYamlText = $state('');
  let copyFeedback = $state(false);
  let feedbackMessage = $state('Zkopírováno do schránky!');
  let fileInputEl: HTMLInputElement | null = $state(null);

  $effect(() => {
    configYamlText = serializeProjectYAML(
      {
        font: selectedFontId,
        bold: isBold,
        badgeStyle,
        badgeColor,
        showIds,
        textPaddingLeft,
        showCropMarks,
        showScale,
        printColumn,
      },
      flats,
      layout
    );
  });

  function selectPreset(presetId: TableauPresetId) {
    const p = TABLEAU_PRESETS.find((item) => item.id === presetId);
    if (!p) return;
    layout.preset = presetId;
    if (presetId !== 'custom') {
      layout.columns = JSON.parse(JSON.stringify(p.columns));
      layout.numberingDirection = p.numberingDirection;
      layout.startNumber = p.startNumber;
      layout.printMode = p.printMode;
    }
    syncFlatsWithLayout();
  }

  function syncFlatsWithLayout() {
    const neededSlots = getTotalSlots(layout);
    if (flats && flats.length < neededSlots) {
      const expanded = [...flats];
      for (let i = flats.length + 1; i <= neededSlots; i++) {
        expanded.push({ id: i, name1: '', name2: '' });
      }
      flats = expanded;
    }
  }

  function addCustomColumn() {
    if (layout.columns.length >= 6) return;
    layout.preset = 'custom';
    layout.columns = [
      ...layout.columns,
      { id: layout.columns.length + 1, capacity: 10, skipTop: 0, skipBottom: 0 },
    ];
    syncFlatsWithLayout();
  }

  function removeCustomColumn() {
    if (layout.columns.length <= 1) return;
    layout.preset = 'custom';
    layout.columns = layout.columns.slice(0, -1);
  }

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

  function applyParsedProject(parsed: ReturnType<typeof parseProjectYAML>) {
    if (!parsed) {
      alert('Nepodařilo se načíst YAML soubor. Zkontrolujte prosím formát.');
      return;
    }
    const s = parsed.settings;
    if (s) {
      if (s.font && FONT_OPTIONS.some((f) => f.id === s.font)) selectedFontId = s.font;
      if (typeof s.bold === 'boolean') isBold = s.bold;
      if (s.badgeStyle && BADGE_STYLES.some((b) => b.id === s.badgeStyle)) badgeStyle = s.badgeStyle;
      if (s.badgeColor) badgeColor = s.badgeColor;
      if (typeof s.showIds === 'boolean') showIds = s.showIds;
      if (typeof s.textPaddingLeft === 'number') textPaddingLeft = s.textPaddingLeft;
      if (typeof s.showCropMarks === 'boolean') showCropMarks = s.showCropMarks;
      if (typeof s.showScale === 'boolean') showScale = s.showScale;
      if (s.printColumn !== undefined) printColumn = s.printColumn;
    }
    if (parsed.layout) {
      if (parsed.layout.preset) layout.preset = parsed.layout.preset;
      if (parsed.layout.numberingDirection) layout.numberingDirection = parsed.layout.numberingDirection;
      if (parsed.layout.startNumber !== undefined) layout.startNumber = parsed.layout.startNumber;
      if (parsed.layout.printMode) layout.printMode = parsed.layout.printMode;
      if (Array.isArray(parsed.layout.columns) && parsed.layout.columns.length > 0) {
        layout.columns = parsed.layout.columns;
      }
    }
    if (parsed.flats && parsed.flats.length > 0 && flats) {
      const updated = [...flats];
      for (const f of parsed.flats) {
        const idx = updated.findIndex((u) => u.id === f.id);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            customNumber: f.customNumber,
            name1: f.name1,
            name2: f.name2,
          };
        } else {
          updated.push(f);
        }
      }
      flats = updated;
    }
    feedbackMessage = 'Konfigurace, geometrie i jména byla úspěšně načtena!';
    copyFeedback = true;
    setTimeout(() => (copyFeedback = false), 3000);
  }

  function handleApplyConfigYAML() {
    const parsed = parseProjectYAML(configYamlText);
    applyParsedProject(parsed);
  }

  function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) {
        const parsed = parseProjectYAML(text);
        applyParsedProject(parsed);
      }
    };
    reader.readAsText(file);
    target.value = '';
  }

  function handleResetSettingsToDefault() {
    selectedFontId = 'TechnicNT';
    isBold = true;
    badgeStyle = 'classic';
    badgeColor = DEFAULT_BADGE_FILL;
    showIds = false;
    textPaddingLeft = DEFAULT_TEXT_PADDING_LEFT;
    showCropMarks = true;
    showScale = true;
    printColumn = 'all';
    layout = getDefaultLayout();
  }

  const colorPresets = [
    { label: 'Tesla Vintage broskvová (výchozí)', value: '#FFE6C7' },
    { label: 'Břidlicově modrá', value: '#BAE6FD' },
    { label: 'Pískově žlutá', value: '#FEF3C7' },
    { label: 'Neutrální šedá', value: '#E2E8F0' },
    { label: 'Čistá bílá', value: '#FFFFFF' },
  ];

  // --- Sample Card Geometry for live preview (Slot width: 574.42, height: 152.4) ---
  const sampleSlotW = 574.42;
  const sampleSlotH = 152.4;
  const sampleNames = ['Jan Novák', 'Marie Nováková'];

  const sampleMetrics = $derived.by(() => {
    const coords = getSlotCoordinates(0, 0, badgeStyle, textPaddingLeft);
    const relTextX = coords.textX - (coords.colX + 129.54);
    const relCenterY = sampleSlotH / 2.0;
    const fs = calculateFontSize(sampleNames, currentFontOption, isBold, badgeStyle, textPaddingLeft);

    const isTwoLines = sampleNames.length > 1;
    const lineHeight = fs * 1.18;
    const b1 = isTwoLines
      ? relCenterY - 0.5 * lineHeight + 0.38 * fs
      : relCenterY + 0.38 * fs;
    const b2 = isTwoLines ? relCenterY + 0.5 * lineHeight + 0.38 * fs : 0;

    const wmStyle = getWatermarkStyle(badgeColor);

    return {
      relTextX,
      relCenterY,
      fs,
      b1,
      b2,
      fontWeight: isBold ? (currentFontOption.id === 'Iosevka' ? 600 : 700) : 400,
      wmFill: wmStyle.fill,
      wmOpacity: wmStyle.opacity,
    };
  });
</script>

<div class="settings-panel">
  <!-- Live 1:1 Sample Card Preview Header -->
  <div class="sample-preview-card">
    <div class="sample-preview-header">
      <div class="sample-title-wrap">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span class="sample-label">Živý vzorový štítek (1:1 náhled změn)</span>
      </div>
      <button type="button" class="btn-done" onclick={onClose} title="Zavřít a přejít na jmenovky">
        Hotovo ✕
      </button>
    </div>

    <!-- Live SVG Card of 1 Slot -->
    <div class="sample-canvas-box">
      <svg
        viewBox="0 0 {sampleSlotW} {sampleSlotH}"
        width="100%"
        height="100%"
        class="sample-svg"
      >
        <!-- Background white slot plate -->
        <rect x="0" y="0" width={sampleSlotW} height={sampleSlotH} fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />

        <!-- Resident Names -->
        <g id="sample-text">
          <text
            x="{sampleMetrics.relTextX}px"
            y="{sampleMetrics.b1}px"
            style="font-family: {currentFontOption.fontFamily}; font-weight: {sampleMetrics.fontWeight}; font-size: {sampleMetrics.fs}px; fill: #000000;"
          >
            {sampleNames[0]}
          </text>
          <text
            x="{sampleMetrics.relTextX}px"
            y="{sampleMetrics.b2}px"
            style="font-family: {currentFontOption.fontFamily}; font-weight: {sampleMetrics.fontWeight}; font-size: {sampleMetrics.fs}px; fill: #000000;"
          >
            {sampleNames[1]}
          </text>
        </g>

        <!-- Badge layer -->
        {#if showIds && badgeStyle !== 'none'}
          {#if badgeStyle === 'left-block'}
            <rect x="0" y="0" width="76" height={sampleSlotH} fill={badgeColor} />
            <line x1="76" y1="0" x2="76" y2={sampleSlotH} stroke="#cbd5e1" stroke-width="2" />
            <text x="38" y="{sampleMetrics.relCenterY + 14}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:42px;fill:#000000;">
              01
            </text>
          {:else if badgeStyle === 'inline-num'}
            <text x="{sampleSlotW - 39}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:36px;fill:#000000;">
              01
            </text>
          {:else if badgeStyle === 'watermark'}
            <text x="{sampleSlotW - 68}px" y="{sampleMetrics.relCenterY + 28}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:800;font-size:84px;fill:{sampleMetrics.wmFill};opacity:{sampleMetrics.wmOpacity};">
              01
            </text>
          {:else}
            <!-- Classic badge -->
            <rect x="{sampleSlotW - 24 - 62}px" y="{(sampleSlotH - 54) / 2}px" width="62" height="54" rx="8" fill={badgeColor} />
            <text x="{sampleSlotW - 24 - 31}px" y="{sampleMetrics.relCenterY + 13}px" text-anchor="middle" style="font-family:'Iosevka-Fixed-Bold', monospace;font-weight:700;font-size:38px;fill:#000000;">
              01
            </text>
          {/if}
        {/if}
      </svg>
    </div>
  </div>

  <div class="settings-scroll-body">
    <!-- Section 0: Tableau Type & Presets -->
    <div class="settings-card">
      <div class="section-header-flex">
        <h4 class="card-title">Typ a rozložení tabla (Presety & Geometrie)</h4>
        <span class="badge-tag">{getTotalSlots(layout)} bytů celkem</span>
      </div>

      <div class="form-field">
        <label for="preset-select">Přednastavený typ tabla (Preset):</label>
        <select
          id="preset-select"
          class="select-input"
          value={layout.preset}
          onchange={(e) => selectPreset((e.target as HTMLSelectElement).value as TableauPresetId)}
        >
          {#each TABLEAU_PRESETS as p}
            <option value={p.id}>{p.label}</option>
          {/each}
        </select>
        <p class="field-hint">
          {TABLEAU_PRESETS.find((p) => p.id === layout.preset)?.description || ''}
        </p>
      </div>

      <div class="grid-2" style="margin-top: 0.75rem;">
        <div class="form-field">
          <label for="num-direction-select">Směr číslování bytů:</label>
          <select
            id="num-direction-select"
            class="select-input"
            bind:value={layout.numberingDirection}
          >
            <option value="bottom-up">Zdola nahoru (Tesla standard: 01 dole)</option>
            <option value="top-down">Shora dolů (01 nahoře)</option>
            <option value="row-left-right">Po řádcích zleva doprava</option>
          </select>
        </div>

        <div class="form-field">
          <label for="start-num-input">Počáteční číslo bytu:</label>
          <input
            id="start-num-input"
            type="number"
            class="number-input"
            min="1"
            max="999"
            bind:value={layout.startNumber}
          />
        </div>
      </div>

      <div class="form-field" style="margin-top: 0.75rem;">
        <span class="field-label">Režim rozložení tisku:</span>
        <div class="segmented-control">
          <button
            type="button"
            class="seg-btn"
            class:active={layout.printMode === 'frame-1to1'}
            onclick={() => (layout.printMode = 'frame-1to1')}
          >
            Fyzický rám (1:1 rozteče rámu)
          </button>
          <button
            type="button"
            class="seg-btn"
            class:active={layout.printMode === 'compact-strips'}
            onclick={() => (layout.printMode = 'compact-strips')}
          >
            Úsporný tisk modulů (Nesting – až 5 modulů na A4)
          </button>
        </div>
        <p class="field-hint">
          {layout.printMode === 'frame-1to1'
            ? 'Sloupce jsou rozmístěny s přesnými roztečemi odpovídajícími fyzickému hliníkovému rámu Tesla.'
            : 'Sloupce jsou seřazeny těsně vedle sebe, což umožňuje vytisknout až 5 modulů (50 jmenovek) na jediný list A4.'}
        </p>
      </div>

      <!-- Custom column controls if custom preset -->
      {#if layout.preset === 'custom'}
        <div class="custom-cols-box">
          <div class="custom-cols-header">
            <span class="field-label">Sloupce tabla ({layout.columns.length}):</span>
            <div class="mini-btn-group">
              <button
                type="button"
                class="btn-mini"
                onclick={addCustomColumn}
                disabled={layout.columns.length >= 6}
                title="Přidat další sloupec"
              >
                + Přidat sloupec
              </button>
              <button
                type="button"
                class="btn-mini"
                onclick={removeCustomColumn}
                disabled={layout.columns.length <= 1}
                title="Odebrat poslední sloupec"
              >
                − Odebrat
              </button>
            </div>
          </div>

          <div class="columns-config-grid">
            {#each layout.columns as col, idx}
              <div class="col-config-item">
                <span class="col-item-title">Sloupec {col.id}</span>
                <div class="col-prop-row">
                  <span class="prop-label">Kapacita:</span>
                  <select bind:value={col.capacity} class="select-mini" onchange={syncFlatsWithLayout}>
                    <option value={10}>10 tlačítek (TT10)</option>
                    <option value={5}>5 tlačítek (TT5)</option>
                  </select>
                </div>
                <div class="col-prop-row">
                  <span class="prop-label">Vynechat nahoře:</span>
                  <input type="number" min="0" max={col.capacity - 1} bind:value={col.skipTop} class="num-mini" onchange={syncFlatsWithLayout} />
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>

    <!-- Section 1: Typography -->
    <div class="settings-card">
      <h4 class="card-title">Písmo a typografie</h4>
      <div class="grid-2">
        <div class="form-field">
          <label for="side-font-select">Výběr písma:</label>
          <select id="side-font-select" bind:value={selectedFontId} class="select-input">
            {#each FONT_OPTIONS as opt}
              <option value={opt.id}>{opt.label}</option>
            {/each}
          </select>
        </div>
        <div class="form-field">
          <span class="field-label">Řez písma:</span>
          <div class="segmented-control">
            <button
              type="button"
              class="seg-btn"
              class:active={isBold}
              onclick={() => (isBold = true)}
            >
              <strong>B</strong> Tučné (Bold)
            </button>
            <button
              type="button"
              class="seg-btn"
              class:active={!isBold}
              onclick={() => (isBold = false)}
            >
              <span>R</span> Obyčejné (Regular)
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Section 2: Badge Style & Colors -->
    <div class="settings-card">
      <h4 class="card-title">Styl a barva čísla bytu</h4>
      <div class="badge-styles-grid">
        {#each BADGE_STYLES as s}
          <button
            type="button"
            class="badge-style-btn"
            class:active={badgeStyle === s.id}
            onclick={() => {
              badgeStyle = s.id;
              if (s.id !== 'none') showIds = true;
            }}
          >
            <div class="badge-style-header">
              <span class="style-name">{s.label}</span>
              {#if badgeStyle === s.id}
                <span class="check-icon">✓</span>
              {/if}
            </div>
            <p class="style-desc">{s.description}</p>
          </button>
        {/each}
      </div>

      {#if badgeStyle !== 'none' && badgeStyle !== 'inline-num'}
        <div class="form-field" style="margin-top: 1rem;">
          <span class="field-label">Barva podkladu čísla:</span>
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

      <div class="checkbox-row">
        <label class="custom-checkbox" class:disabled={badgeStyle === 'none'}>
          <input
            type="checkbox"
            bind:checked={showIds}
            disabled={badgeStyle === 'none'}
          />
          <span>Zobrazit čísla bytů na štítcích (Flat IDs)</span>
        </label>
      </div>
    </div>

    <!-- Section 3: Sazba & Odsazení textu -->
    <div class="settings-card">
      <h4 class="card-title">Sazba a odsazení jmen</h4>
      <p class="card-desc">
        Nastavte levé odsazení textu pro dokonalou čitelnost i pod okrajem hliníkového profilu tabla.
      </p>

      <div class="slider-box">
        <div class="slider-header">
          <span class="slider-label">Odsazení od okraje:</span>
          <span class="slider-val">{(textPaddingLeft / 11.811).toFixed(1)} mm ({Math.round(textPaddingLeft)} px)</span>
        </div>
        <input
          type="range"
          min="35.4"
          max="177.2"
          step="5.9"
          bind:value={textPaddingLeft}
          class="slider-input"
        />
        <div class="preset-buttons-row">
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 59.0) < 1}
            onclick={() => (textPaddingLeft = 59.0)}
          >
            Úzké (5 mm)
          </button>
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 88.5) < 1}
            onclick={() => (textPaddingLeft = 88.5)}
          >
            Standard (7.5 mm)
          </button>
          <button
            type="button"
            class="btn-preset-lg"
            class:active={Math.abs(textPaddingLeft - 118.0) < 1}
            onclick={() => (textPaddingLeft = 118.0)}
          >
            Široké (10 mm)
          </button>
        </div>
      </div>
    </div>

    <!-- Section 4: Print Aids & Column Scope -->
    <div class="settings-card">
      <h4 class="card-title">Tiskové pomůcky a rozsah tisku</h4>
      <div class="checkbox-stack">
        <label class="custom-checkbox">
          <input type="checkbox" bind:checked={showCropMarks} />
          <span>Ořezové značky (rohové linky pro přesné řezání pravítkem)</span>
        </label>
        <label class="custom-checkbox">
          <input type="checkbox" bind:checked={showScale} />
          <span>Kontrolní měřítko 1:1 (100mm pravítko v dolním okraji)</span>
        </label>
      </div>

      <div class="form-field" style="margin-top: 14px;">
        <span class="field-label">Výběr sloupce pro tisk:</span>
        <div class="segmented-control print-cols-segmented">
          <button
            type="button"
            class="seg-btn"
            class:active={printColumn === 'all'}
            onclick={() => (printColumn = 'all')}
          >
            Všechny sloupce
          </button>
          {#each layout.columns as colCfg, cIdx}
            <button
              type="button"
              class="seg-btn"
              class:active={printColumn === cIdx + 1}
              onclick={() => (printColumn = cIdx + 1)}
            >
              Sloupec {cIdx + 1}
            </button>
          {/each}
        </div>
        <p class="field-hint">
          Při volbě jednoho sloupce se na formát A4 vytiskne pouze daný modul na své přesné pozici. Šetří toner a inkoust při výměně jmenovek jen v jednom sloupci.
        </p>
      </div>
    </div>

    <!-- Section 5: YAML Sharing & Backup -->
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
        <button type="button" class="btn btn-ghost text-muted" onclick={handleResetSettingsToDefault}>
          Výchozí hodnoty
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .settings-panel {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
    background: #f8fafc;
  }

  .sample-preview-card {
    background: #ffffff;
    border-bottom: 2px solid #e2e8f0;
    padding: 0.75rem 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    flex-shrink: 0;
  }

  .sample-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .sample-title-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .sample-label {
    font-size: 0.78rem;
    font-weight: 700;
    color: #0369a1;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .badge-tag {
    font-size: 0.75rem;
    font-weight: 700;
    color: #0369a1;
    background: #e0f2fe;
    padding: 0.2rem 0.5rem;
    border-radius: 9999px;
  }

  .btn-done {
    background: #f1f5f9;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 0.25rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #334155;
    cursor: pointer;
    transition: all 0.15s;
  }

  .btn-done:hover {
    background: #e2e8f0;
    color: #0f172a;
  }

  .sample-canvas-box {
    max-width: 480px;
    margin: 0 auto;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  }

  .sample-svg {
    display: block;
    width: 100%;
    height: auto;
  }

  .settings-scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .settings-card {
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .card-title {
    font-size: 0.88rem;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 0.75rem 0;
  }

  .card-desc {
    font-size: 0.78rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
    line-height: 1.45;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .form-field label,
  .field-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .field-hint {
    font-size: 0.74rem;
    color: #64748b;
    margin: 0.25rem 0 0 0;
    line-height: 1.4;
  }

  .select-input,
  .number-input {
    width: 100%;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0.45rem 0.65rem;
    font-size: 0.82rem;
    background: #ffffff;
    color: #1e293b;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .select-input:focus,
  .number-input:focus {
    border-color: #0284c7;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.85rem;
  }

  .segmented-control {
    display: flex;
    background: #f1f5f9;
    padding: 0.2rem;
    border-radius: 6px;
    border: 1px solid #e2e8f0;
    gap: 0.2rem;
  }

  .seg-btn {
    flex: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.35rem 0.5rem;
    border: none;
    border-radius: 4px;
    background: transparent;
    font-size: 0.78rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .seg-btn:hover {
    color: #0f172a;
  }

  .seg-btn.active {
    background: #ffffff;
    color: #0284c7;
    font-weight: 700;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  }

  .custom-cols-box {
    margin-top: 0.85rem;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
  }

  .custom-cols-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .mini-btn-group {
    display: flex;
    gap: 0.35rem;
  }

  .btn-mini {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.45rem;
    cursor: pointer;
    color: #334155;
  }

  .btn-mini:hover:not(:disabled) {
    background: #e2e8f0;
  }

  .btn-mini:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .columns-config-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 0.5rem;
    margin-top: 0.35rem;
  }

  .col-config-item {
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 4px;
    padding: 0.45rem;
    font-size: 0.75rem;
  }

  .col-item-title {
    font-weight: 700;
    color: #0f172a;
    display: block;
    margin-bottom: 0.35rem;
  }

  .col-prop-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.25rem;
  }

  .select-mini,
  .num-mini {
    padding: 0.15rem 0.3rem;
    font-size: 0.72rem;
    border: 1px solid #cbd5e1;
    border-radius: 3px;
    max-width: 85px;
  }

  .badge-styles-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.45rem;
  }

  .badge-style-btn {
    display: flex;
    flex-direction: column;
    text-align: left;
    padding: 0.65rem 0.75rem;
    border: 1.5px solid #e2e8f0;
    border-radius: 6px;
    background: #ffffff;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .badge-style-btn:hover {
    border-color: #94a3b8;
    background: #f8fafc;
  }

  .badge-style-btn.active {
    border-color: #0284c7;
    background: #f0f9ff;
    box-shadow: 0 1px 4px rgba(2, 132, 199, 0.12);
  }

  .badge-style-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .style-name {
    font-size: 0.82rem;
    font-weight: 700;
    color: #1e293b;
  }

  .check-icon {
    font-size: 0.82rem;
    font-weight: 900;
    color: #0284c7;
  }

  .style-desc {
    font-size: 0.74rem;
    color: #64748b;
    margin: 0.2rem 0 0 0;
    line-height: 1.35;
  }

  .color-picker-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .color-input-wrap {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .color-picker-square {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    width: 26px;
    height: 26px;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    padding: 0;
    cursor: pointer;
    background: transparent;
  }

  .color-hex-text {
    font-family: monospace;
    font-size: 0.78rem;
    color: #475569;
  }

  .presets-wrap {
    display: flex;
    gap: 0.35rem;
  }

  .preset-chip {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.2);
    cursor: pointer;
    padding: 0;
    transition: transform 0.1s;
  }

  .preset-chip:hover {
    transform: scale(1.2);
  }

  .checkbox-row {
    margin-top: 0.75rem;
  }

  .checkbox-stack {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .custom-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    font-size: 0.82rem;
    color: #334155;
    cursor: pointer;
    user-select: none;
    font-weight: 500;
  }

  .custom-checkbox input {
    cursor: pointer;
    accent-color: #0284c7;
    width: 16px;
    height: 16px;
  }

  .custom-checkbox.disabled {
    opacity: 0.45;
    pointer-events: none;
  }

  .slider-box {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    box-sizing: border-box;
  }

  .slider-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.4rem;
  }

  .slider-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #334155;
  }

  .slider-val {
    font-family: monospace;
    font-size: 0.8rem;
    font-weight: 700;
    color: #0284c7;
  }

  .slider-input {
    width: 100%;
    cursor: pointer;
    accent-color: #0284c7;
  }

  .preset-buttons-row {
    display: flex;
    gap: 0.4rem;
    margin-top: 0.6rem;
  }

  .btn-preset-lg {
    flex: 1;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 5px;
    padding: 0.35rem 0.5rem;
    font-size: 0.74rem;
    font-weight: 500;
    color: #475569;
    cursor: pointer;
    transition: all 0.15s ease-in-out;
  }

  .btn-preset-lg:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
    color: #0f172a;
  }

  .btn-preset-lg.active {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
    font-weight: 600;
  }

  .file-action-buttons {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.65rem;
    flex-wrap: wrap;
  }

  .print-cols-segmented {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
    gap: 0.25rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 6px;
  }

  .btn-primary {
    background: #0284c7;
    border-color: #0284c7;
    color: #ffffff;
  }

  .btn-primary:hover {
    background: #0369a1;
    border-color: #0369a1;
  }

  .config-yaml-box {
    width: 100%;
    box-sizing: border-box;
    font-family: monospace;
    font-size: 0.8rem;
    padding: 0.65rem;
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    background: #f8fafc;
    color: #1e293b;
    resize: vertical;
    outline: none;
    line-height: 1.45;
  }

  .config-yaml-box:focus {
    border-color: #0284c7;
    background: #ffffff;
  }

  .yaml-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.42rem 0.75rem;
    border-radius: 6px;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid transparent;
    transition: all 0.15s ease-in-out;
    white-space: nowrap;
    text-decoration: none;
    box-sizing: border-box;
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
    border-color: transparent;
    color: #64748b;
    padding: 0.42rem 0.55rem;
  }

  .text-muted {
    color: #94a3b8;
  }

  .text-muted:hover {
    color: #dc2626 !important;
    background: #fee2e2 !important;
  }

  .section-header-flex {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.4rem;
  }

  .copy-success-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: #15803d;
    background: #dcfce7;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }

  @media (max-width: 768px) {
    .grid-2 {
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }
    .preset-buttons-row {
      flex-direction: column;
      gap: 0.35rem;
    }
    .yaml-actions {
      flex-direction: column;
    }
  }
</style>
