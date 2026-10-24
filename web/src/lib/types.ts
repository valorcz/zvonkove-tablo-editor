export interface FlatEntry {
  id: number;
  name1: string;
  name2: string;
}

export type BadgeStyleId = 'classic' | 'left-block' | 'inline-num' | 'watermark' | 'none';

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
