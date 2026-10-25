<script lang="ts">
  import type {
    BadgeStyleId,
    PrintColumnOption,
    FlatEntry,
    TableauLayoutConfig,
    NumeralFontMode,
  } from '../lib/types';
  import {
    FONT_OPTIONS,
    DEFAULT_BADGE_FILL,
    DEFAULT_TEXT_PADDING_LEFT,
    getDefaultLayout,
    getTotalSlots,
    serializeProjectYAML,
    parseProjectYAML,
  } from '../lib/tableauConfig';

  import BadgePreview from './settings/BadgePreview.svelte';
  import PresetLayoutSettings from './settings/PresetLayoutSettings.svelte';
  import TypographySettings from './settings/TypographySettings.svelte';
  import BadgeSettings from './settings/BadgeSettings.svelte';
  import PrintSettings from './settings/PrintSettings.svelte';
  import YamlBackupSettings from './settings/YamlBackupSettings.svelte';

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
    numeralFontMode = $bindable('iosevka'),
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
    numeralFontMode?: NumeralFontMode;
    onClose?: () => void;
  } = $props();

  const currentFontOption = $derived(
    FONT_OPTIONS.find((f) => f.id === selectedFontId) || FONT_OPTIONS[0]
  );

  let configYamlText = $state('');

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
        numeralFontMode,
      },
      flats,
      layout
    );
  });

  function applyParsedProject(parsed: ReturnType<typeof parseProjectYAML>) {
    if (!parsed) return;
    const s = parsed.settings;
    if (s) {
      if (s.font && FONT_OPTIONS.some((f) => f.id === s.font)) selectedFontId = s.font;
      if (typeof s.bold === 'boolean') isBold = s.bold;
      if (s.badgeStyle) badgeStyle = s.badgeStyle;
      if (s.badgeColor) badgeColor = s.badgeColor;
      if (typeof s.showIds === 'boolean') showIds = s.showIds;
      if (typeof s.textPaddingLeft === 'number') textPaddingLeft = s.textPaddingLeft;
      if (typeof s.showCropMarks === 'boolean') showCropMarks = s.showCropMarks;
      if (typeof s.showScale === 'boolean') showScale = s.showScale;
      if (s.printColumn !== undefined) printColumn = s.printColumn;
      if (s.numeralFontMode) numeralFontMode = s.numeralFontMode;
    }
    if (parsed.layout) {
      layout = {
        preset: parsed.layout.preset || layout.preset,
        columns: parsed.layout.columns ? JSON.parse(JSON.stringify(parsed.layout.columns)) : layout.columns,
        numberingDirection: parsed.layout.numberingDirection || layout.numberingDirection,
        startNumber: parsed.layout.startNumber || layout.startNumber,
        printMode: parsed.layout.printMode || layout.printMode,
      };
    }
    if (parsed.flats && Array.isArray(parsed.flats) && flats) {
      const needed = getTotalSlots(layout);
      const updated = [...parsed.flats];
      while (updated.length < needed) {
        updated.push({ id: updated.length + 1, name1: '', name2: '' });
      }
      flats = updated;
    }
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
    numeralFontMode = 'iosevka';
  }
</script>

<div class="settings-panel">
  <!-- Live 1:1 Sample Card Preview Header -->
  <BadgePreview
    {badgeStyle}
    {badgeColor}
    {currentFontOption}
    {isBold}
    {showIds}
    {textPaddingLeft}
    {numeralFontMode}
    {onClose}
  />

  <div class="settings-scroll-body">
    <!-- Presets & Geometry Layout -->
    <PresetLayoutSettings bind:layout bind:flats />

    <!-- Typography & Names Alignment -->
    <TypographySettings bind:selectedFontId bind:isBold bind:textPaddingLeft bind:numeralFontMode />

    <!-- Badge Styles & Colors -->
    <BadgeSettings bind:badgeStyle bind:badgeColor bind:showIds />

    <!-- Print Aids & Scope -->
    <PrintSettings bind:showCropMarks bind:showScale bind:printColumn columns={layout.columns} />

    <!-- YAML Sharing & Backup -->
    <YamlBackupSettings
      {configYamlText}
      onApplyParsedProject={applyParsedProject}
      onResetDefaults={handleResetSettingsToDefault}
    />
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

  .settings-scroll-body {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.15rem 2rem;
    display: flex;
    flex-direction: column;
  }
</style>
