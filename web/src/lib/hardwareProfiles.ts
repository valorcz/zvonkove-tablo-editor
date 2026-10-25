import hardwareProfilesYaml from '../config/hardwareProfiles.yaml?raw';
import type { PresetDefinition, TableauPresetId, NumberingDirection, PrintLayoutMode } from './types';

export interface HardwareSlotConfig {
  widthMm: number;
  heightMm: number;
  cornerRadiusMm?: number;
}

export interface HardwareButtonConfig {
  placement: 'left' | 'right' | 'none';
  widthMm: number;
}

export interface HardwareModuleConfig {
  name: string;
  capacities: number[];
  slotStepMm: number;
  moduleWidthMm?: number;
  headerMarginMm?: number;
  footerMarginMm?: number;
  button?: HardwareButtonConfig;
}

export interface HardwareFrameConfig {
  columnSpacingMm: number;
  pageFitCapacityA4: number;
}

export interface HardwareSystem {
  id: string;
  name: string;
  slot: HardwareSlotConfig;
  module?: HardwareModuleConfig;
  frame?: HardwareFrameConfig;
  presets: PresetDefinition[];
}

export interface HardwareManufacturer {
  id: string;
  name: string;
  systems: HardwareSystem[];
}

// Lightweight YAML parser for hardware profiles
export function parseHardwareProfiles(yamlText: string): HardwareManufacturer[] {
  const manufacturers: HardwareManufacturer[] = [];
  const lines = yamlText.split('\n');

  let curMfr: HardwareManufacturer | null = null;
  let curSys: HardwareSystem | null = null;
  let curPreset: PresetDefinition | null = null;
  let inColumns = false;
  let inModule = false;
  let inButton = false;
  let inSlot = false;

  for (let rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = rawLine.search(/\S/);

    // Manufacturer level: - id: ...
    if (trimmed.startsWith('- id:') && indent <= 4) {
      inColumns = false;
      inModule = false;
      inButton = false;
      inSlot = false;
      const mId = trimmed.replace('- id:', '').trim().replace(/['"]/g, '');
      curMfr = { id: mId, name: mId, systems: [] };
      manufacturers.push(curMfr);
      curSys = null;
      curPreset = null;
      continue;
    }

    if (curMfr && trimmed.startsWith('name:') && indent === 4) {
      curMfr.name = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
      continue;
    }

    // System level: - id: ... inside systems
    if (curMfr && trimmed.startsWith('- id:') && indent >= 6 && indent <= 8) {
      inColumns = false;
      inModule = false;
      inButton = false;
      inSlot = false;
      const sId = trimmed.replace('- id:', '').trim().replace(/['"]/g, '');
      curSys = {
        id: sId,
        name: sId,
        slot: { widthMm: 48.6, heightMm: 12.9, cornerRadiusMm: 1.0 },
        module: {
          name: '',
          capacities: [10],
          slotStepMm: 15.88,
          moduleWidthMm: 61.6,
          button: { placement: 'left', widthMm: 11.0 },
        },
        presets: [],
      };
      curMfr.systems.push(curSys);
      curPreset = null;
      continue;
    }

    if (curSys && trimmed.startsWith('name:') && indent === 8) {
      curSys.name = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
      continue;
    }

    if (curSys && trimmed === 'slot:') {
      inSlot = true;
      inModule = false;
      inButton = false;
      continue;
    }
    if (curSys && trimmed === 'module:') {
      inModule = true;
      inSlot = false;
      inButton = false;
      continue;
    }
    if (inModule && trimmed === 'button:') {
      inButton = true;
      continue;
    }

    if (inSlot && curSys) {
      if (trimmed.startsWith('widthMm:')) {
        curSys.slot.widthMm = parseFloat(trimmed.replace('widthMm:', '').trim());
      } else if (trimmed.startsWith('heightMm:')) {
        curSys.slot.heightMm = parseFloat(trimmed.replace('heightMm:', '').trim());
      } else if (trimmed.startsWith('cornerRadiusMm:')) {
        curSys.slot.cornerRadiusMm = parseFloat(trimmed.replace('cornerRadiusMm:', '').trim());
      }
    }

    if (inModule && curSys?.module) {
      if (inButton && curSys.module.button) {
        if (trimmed.startsWith('placement:')) {
          curSys.module.button.placement = trimmed.replace('placement:', '').trim().replace(/['"]/g, '') as any;
        } else if (trimmed.startsWith('widthMm:')) {
          curSys.module.button.widthMm = parseFloat(trimmed.replace('widthMm:', '').trim());
        }
      } else {
        if (trimmed.startsWith('name:')) {
          curSys.module.name = trimmed.replace('name:', '').trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('slotStepMm:')) {
          curSys.module.slotStepMm = parseFloat(trimmed.replace('slotStepMm:', '').trim());
        } else if (trimmed.startsWith('moduleWidthMm:')) {
          curSys.module.moduleWidthMm = parseFloat(trimmed.replace('moduleWidthMm:', '').trim());
        } else if (trimmed.startsWith('capacities:')) {
          const match = trimmed.match(/\[(.*?)\]/);
          if (match) {
            curSys.module.capacities = match[1].split(',').map((x) => parseInt(x.trim(), 10)).filter(Boolean);
          }
        }
      }
    }

    // Preset level: - id: ... inside presets
    if (curSys && trimmed.startsWith('- id:') && indent >= 10) {
      inColumns = false;
      inModule = false;
      inButton = false;
      inSlot = false;
      const pId = trimmed.replace('- id:', '').trim().replace(/['"]/g, '') as TableauPresetId;
      curPreset = {
        id: pId,
        label: pId,
        description: '',
        columns: [],
        numberingDirection: 'bottom-up',
        startNumber: 1,
        printMode: 'frame-1to1',
      };
      curSys.presets.push(curPreset);
      continue;
    }

    if (curPreset) {
      if (trimmed.startsWith('label:')) {
        curPreset.label = trimmed.replace('label:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('description:')) {
        curPreset.description = trimmed.replace('description:', '').trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('numberingDirection:')) {
        curPreset.numberingDirection = trimmed.replace('numberingDirection:', '').trim().replace(/['"]/g, '') as NumberingDirection;
      } else if (trimmed.startsWith('startNumber:')) {
        curPreset.startNumber = parseInt(trimmed.replace('startNumber:', '').trim(), 10) || 1;
      } else if (trimmed.startsWith('printMode:')) {
        curPreset.printMode = trimmed.replace('printMode:', '').trim().replace(/['"]/g, '') as PrintLayoutMode;
      } else if (trimmed.startsWith('columns:')) {
        inColumns = true;
      } else if (inColumns && trimmed.startsWith('- {') && trimmed.endsWith('}')) {
        // Parse inline column dict e.g. { id: 1, capacity: 10, skipTop: 0, skipBottom: 0 }
        const inner = trimmed.slice(3, -1);
        const colObj: any = {};
        for (const part of inner.split(',')) {
          const [k, v] = part.split(':').map((s) => s.trim());
          if (k && v !== undefined) {
            colObj[k] = parseInt(v, 10);
          }
        }
        curPreset.columns.push({
          id: colObj.id || curPreset.columns.length + 1,
          capacity: colObj.capacity || 10,
          skipTop: colObj.skipTop || 0,
          skipBottom: colObj.skipBottom || 0,
        });
      }
    }
  }

  return manufacturers;
}

export const HARDWARE_MANUFACTURERS = parseHardwareProfiles(hardwareProfilesYaml);

// Flatten all presets for easy selection in the UI
export const ALL_TABLEAU_PRESETS: PresetDefinition[] = HARDWARE_MANUFACTURERS.flatMap((m) =>
  m.systems.flatMap((s) => s.presets)
);

// Retrieve manufacturer and system for a specific preset ID
export function getHardwareProfileForPreset(presetId: TableauPresetId): {
  manufacturer: HardwareManufacturer;
  system: HardwareSystem;
} {
  for (const m of HARDWARE_MANUFACTURERS) {
    for (const s of m.systems) {
      if (s.presets.some((p) => p.id === presetId)) {
        return { manufacturer: m, system: s };
      }
    }
  }
  // Default fallback: Tesla GUARD prima
  return {
    manufacturer: HARDWARE_MANUFACTURERS[0],
    system: HARDWARE_MANUFACTURERS[0].systems[0],
  };
}
