export type TableauPresetId =
  | 'tesla-guard-28'
  | 'tesla-guard-10'
  | 'tesla-guard-20'
  | 'tesla-guard-30'
  | 'tesla-guard-40'
  | 'urmet-sinthesi-16'
  | 'custom'
  | string;

export type NumberingDirection = 'bottom-up' | 'top-down' | 'row-left-right';

export type PrintLayoutMode = 'frame-1to1' | 'compact-strips';

export type TemplateRenderMode = 'full' | 'cut-strips';

export interface ColumnConfig {
  id: number;
  capacity: number;   // total button positions of module (typically 10 or 5)
  skipTop: number;    // skipped positions at top (e.g. 2 in 28-flat col 3)
  skipBottom: number; // skipped positions at bottom
}

export interface PresetDefinition {
  id: TableauPresetId;
  label: string;
  description: string;
  columns: ColumnConfig[];
  numberingDirection: NumberingDirection;
  startNumber: number;
  printMode: PrintLayoutMode;
  templateRenderMode?: TemplateRenderMode;
  showDimensions?: boolean;
}

export interface TableauLayoutConfig {
  preset: TableauPresetId;
  columns: ColumnConfig[];
  numberingDirection: NumberingDirection;
  startNumber: number;
  printMode: PrintLayoutMode;
  templateRenderMode?: TemplateRenderMode;
  showDimensions?: boolean;
}

export interface FlatEntry {
  id: number;              // sequential slot index: 1..totalSlots
  customNumber?: string;   // optional custom number/label override (e.g. "01", "12B", "Správce")
  name1: string;
  name2: string;
}

export type BadgePosition = 'right-center' | 'corner-index' | 'left-block' | 'watermark' | 'none';
export type BadgeShape = 'badge' | 'circle' | 'none';

export type BadgeStyleId =
  | 'classic'
  | 'circle'
  | 'left-block'
  | 'corner-index'
  | 'corner-badge'
  | 'inline-num'
  | 'watermark'
  | 'none'
  | 'outline';

export type NumeralFontMode = 'iosevka' | 'inherit';

export type PrintColumnOption = 'all' | number;

export interface BadgeStyleOption {
  id: BadgeStyleId;
  label: string;
  description: string;
}

export interface SlotCoordinates {
  col: number;
  row: number;
  colX: number;
  textX: number;
  slotTop: number;
  slotBottom: number;
  slotCenterY: number;
  badgeCx: number;
  badgeCy: number;
}

export interface SlotMapping {
  slotIndex: number;
  colIndex: number;
  rowIndex: number;
  defaultNumber: string;
}
