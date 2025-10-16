// /data/descriptor-map.ts
// Builds a short, human descriptor for EVERY InstrumentItem in your six maps.
// 1) Uses explicit overrides you care about
// 2) Falls back to an auto-shortened version of the instrument text
// Exported helpers: DESCRIPTORS (id -> label), descriptorFor(item)

import { ALL_ITEMS, type InstrumentItem } from './instrument-items';

// === 1) Explicit overrides (edit freely; leave keys you don't care about) ===
const OVERRIDES: Record<string, string> = {
  // ---- Firmographics & Classification ----
  companyName: 'Company Name',
  s3: 'Department',
  s4: 'Primary Job Function',
  s5: 'Current Level',
  s6: 'Areas of Responsibility',
  s7: 'Benefits Influence',
  s8: 'Employee Size',
  s9: 'Headquarters',
  s9a: 'Countries with Employees',
  c1: 'Legal Name',
  c2: 'Industry',
  c3: 'Excluded Employee Groups',
  c4: 'Annual Revenue',
  c5: 'Healthcare Access',
  c6: 'Remote/Hybrid Policy',
  c7: 'Union/Works Council',
  hq: 'Headquarters',

  // ---- General Benefits (examples – extend as you want) ----
  'CB1.1': 'Health Insurance (Medical)',
  'CB1.2': 'Dental',
  'CB1.3': 'Vision',
  'CB1.4': 'EAP',
  'CB2.1': 'STD (Paid)',
  'CB2.2': 'LTD',
  'CB3.1': 'Travel/Lodging for Care',
  'CB3.2': 'Clinical Trials Support',

  // ---- Current Support / Cross-Dimensional / Impact (examples) ----
  CS1: 'Global Policy',
  CS2: 'Regional Variations',
  CS3: 'Documentation',
  CD1a: 'Cross-Dept Coordination',
  CD1b: 'Navigation Ownership',
  CD2: 'Measurement Approach',
  EI1: 'Retention Impact',
  EI2: 'Absence Impact',
  EI3: 'Performance Impact',
  EI5: 'Return-to-Work Quality',
};

// === 2) Auto-shortener (safe, terse) ===
function autoShort(text: string | undefined): string {
  if (!text) return '';
  let s = text
    .replace(/\[[^\]]*\]/g, '')          // [ASK IF], [NOTE], etc.
    .replace(/\([^)]*\)/g, '')           // (clarifiers)
    .split(/[?•:\n]/)[0]                 // first clause only
    .trim();

  s = s
    .replace(/^please (indicate|select)\s+/i, '')
    .replace(/^does your (company|organization)\s+/i, '')
    .replace(/^what is your (company|organization)[’']?s?\s+/i, '')
    .replace(/^to what extent\s+/i, '')
    .replace(/^how (well|much|often)\s+/i, '')
    // compress common phrases
    .replace(/\bshort[-\s]?term disability\b/gi, 'STD')
    .replace(/\blong[-\s]?term disability\b/gi, 'LTD')
    .replace(/\bemployee assistance program\b/gi, 'EAP')
    .replace(/\bclinical trials?\b/gi, 'Clinical Trials');

  const words = s.split(/\s+/);
  if (words.length > 8) s = words.slice(0, 8).join(' ');
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

// === 3) Build a complete map for ALL items ===
export const DESCRIPTORS: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const it of ALL_ITEMS) {
    if (!it?.id) continue;
    map[it.id] = OVERRIDES[it.id] || autoShort(it.text) || it.id;
  }
  return map;
})();

// === 4) Helper ===
export function descriptorFor(it: InstrumentItem): string {
  return DESCRIPTORS[it.id] || autoShort(it.text) || it.id;
}
