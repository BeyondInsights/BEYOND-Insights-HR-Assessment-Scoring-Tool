// /data/instrument-items.ts
// Aggregates your six maps into one master dictionary.

export interface InstrumentItem {
  id: string;
  section: string;
  text: string;
  route: string;
  type: 'likert-5' | 'likert-4' | 'text' | 'select' | 'multi-select' | 'matrix';
  weight?: number;
  required?: boolean;
}

import * as COMPANY from './instrument-items-company-profile';
import * as GENERAL_CURRENT from './instrument-items-general-current';
import * as DIMS_1_5 from './instrument-items-dimensions-1-5';
import * as DIMS_6_10 from './instrument-items-dimensions-6-10';
import * as DIMS_11_13 from './instrument-items-dimensions-11-13';
import * as ADVANCED from './instrument-items-advanced-assessments';

function collectItems(mod: Record<string, unknown>): InstrumentItem[] {
  const out: InstrumentItem[] = [];
  const pushItem = (it: any) => {
    if (it && typeof it === 'object' && 'id' in it && 'section' in it && 'text' in it && 'route' in it) {
      out.push(it as InstrumentItem);
    }
  };
  const scan = (val: unknown) => {
    if (!val) return;
    if (Array.isArray(val)) (val as unknown[]).forEach(pushItem);
    else if (typeof val === 'object') Object.values(val as Record<string, unknown>).forEach(scan);
  };
  Object.values(mod).forEach(scan);
  // @ts-ignore
  if ((mod as any).default) scan((mod as any).default);
  return out;
}

export const ALL_ITEMS: InstrumentItem[] = [
  ...collectItems(COMPANY),
  ...collectItems(GENERAL_CURRENT),
  ...collectItems(DIMS_1_5),
  ...collectItems(DIMS_6_10),
  ...collectItems(DIMS_11_13),
  ...collectItems(ADVANCED),
];

export const INSTRUMENT_ITEMS: Record<string, InstrumentItem> = {};
for (const it of ALL_ITEMS) {
  if (!INSTRUMENT_ITEMS[it.id]) INSTRUMENT_ITEMS[it.id] = it; // first write wins
}

export function getItemsBySection(section: string): InstrumentItem[] {
  return ALL_ITEMS.filter(i => i.section === section);
}
export function getItemsByRoute(route: string): InstrumentItem[] {
  return ALL_ITEMS.filter(i => i.route === route);
}
export function getItem(id: string): InstrumentItem | undefined {
  return INSTRUMENT_ITEMS[id];
}
