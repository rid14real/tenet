// One evidence record, many obligations. A working crosswalk that needs counsel sign-off before release.

import type { CollectionName, Provenance } from './types.js';

export const FRAMEWORKS = ['NDPA and GAID', 'POPIA', 'Kenya DPA', 'ISO/IEC 27701', 'ISO/IEC 42001', 'EU AI Act'] as const;
export type Framework = (typeof FRAMEWORKS)[number];

export interface ControlRow {
  id: string;
  evidence: string;
  description: string;
  source: CollectionName | 'profile';
  refs: Partial<Record<Framework, string>>;
}

export const CONTROL_MAP_PROVENANCE: Provenance = {
  source: 'Tenet working crosswalk v0.1',
  confidence: 'unverified',
  note: 'References are a starting map for counsel review, not settled positions.',
};

export const CONTROL_MAP: ControlRow[] = [
  { id: 'ropa', evidence: 'Record of processing', source: 'activities',
    description: 'Each processing activity with purpose, lawful basis, categories, recipients and retention.',
    refs: { 'NDPA and GAID': 's.25 · GAID Art. 16(3)', POPIA: 's.17', 'Kenya DPA': 'General Regs 2021', 'ISO/IEC 27701': 'Records of PII processing' } },
  { id: 'dpia', evidence: 'DPIA', source: 'assessments',
    description: 'One assessment engine; answers carry across formats.',
    refs: { 'NDPA and GAID': 's.28 · GAID Art. 28', POPIA: 'Regs 2018 reg. 4(1)(b)', 'Kenya DPA': 's.31', 'ISO/IEC 27701': 'PII impact assessment', 'ISO/IEC 42001': 'cl. 6.1.4 (partial)', 'EU AI Act': 'Art. 27 (partial)' } },
  { id: 'ai-impact', evidence: 'AI impact assessment', source: 'aiSystems',
    description: 'Built on the DPIA, adding model purpose, affected groups, bias tests and oversight design.',
    refs: { 'NDPA and GAID': 's.37 · GAID Arts. 43–44', POPIA: 's.71', 'Kenya DPA': 's.35', 'ISO/IEC 42001': 'cl. 6.1.4', 'EU AI Act': 'Arts. 9, 27' } },
  { id: 'oversight', evidence: 'Human oversight record', source: 'aiSystems',
    description: 'Who can override the system, how appeals are handled.',
    refs: { 'NDPA and GAID': 's.37', POPIA: 's.71', 'Kenya DPA': 's.35', 'ISO/IEC 42001': 'Annex A (use of AI systems)', 'EU AI Act': 'Arts. 14, 26' } },
  { id: 'processors', evidence: 'Processor agreement register', source: 'vendors',
    description: 'Contracts with every processor and AI vendor.',
    refs: { 'NDPA and GAID': 's.29 · GAID Art. 34', POPIA: 's.21', 'Kenya DPA': 's.42', 'ISO/IEC 27701': 'Contracts with PII processors', 'ISO/IEC 42001': 'Annex A.10', 'EU AI Act': 'Art. 25 (partial)' } },
  { id: 'transfers', evidence: 'Transfer register', source: 'vendors',
    description: 'Where each dataset goes and on what basis.',
    refs: { 'NDPA and GAID': 'ss.41–43', POPIA: 's.72', 'Kenya DPA': 'ss.48–50', 'ISO/IEC 27701': 'PII transfer controls' } },
  { id: 'breach', evidence: 'Breach register', source: 'incidents',
    description: 'Every incident with regulator clocks, decisions and notices.',
    refs: { 'NDPA and GAID': 's.40', POPIA: 's.22', 'Kenya DPA': 's.43', 'ISO/IEC 27701': 'Incident management', 'EU AI Act': 'Art. 73 (providers)' } },
  { id: 'rights', evidence: 'Request and complaint log', source: 'requests',
    description: 'Every request, its deadline and outcome.',
    refs: { 'NDPA and GAID': 'ss.34–38 · GAID Art. 40', POPIA: 'ss.23–25', 'Kenya DPA': 's.26', 'ISO/IEC 27701': 'PII principal obligations' } },
];
