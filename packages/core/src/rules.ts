// Rule packs: every threshold, window and fee is data with its source and how far it has been checked.
// Change a value here (or override it per deployment) instead of editing logic.

import type { JurisdictionCode, LawfulBasis, Provenance, RequestType, SectorId, Tier } from './types.js';

export interface Sector {
  id: SectorId;
  label: string;
  tier: Tier;
  financial: boolean;
}

export const SECTORS: Sector[] = [
  { id: 'bank', label: 'Commercial, national or regional bank', tier: 'UHL', financial: true },
  { id: 'fintech', label: 'Payments or fintech operator', tier: 'UHL', financial: true },
  { id: 'insurer', label: 'Insurer', tier: 'UHL', financial: true },
  { id: 'telco', label: 'Telecoms operator', tier: 'UHL', financial: false },
  { id: 'multinational', label: 'Multinational company', tier: 'UHL', financial: false },
  { id: 'mfb', label: 'Microfinance bank', tier: 'EHL', financial: true },
  { id: 'mortgage', label: 'Mortgage bank', tier: 'EHL', financial: true },
  { id: 'hospital', label: 'Secondary or tertiary hospital', tier: 'EHL', financial: false },
  { id: 'higher', label: 'Higher institution', tier: 'EHL', financial: false },
  { id: 'mda', label: 'Government ministry, department or agency', tier: 'EHL', financial: false },
  { id: 'other', label: 'Other sector', tier: 'OHL', financial: false },
];

export const TIER_RULES = {
  /** More than this many data subjects in six months puts an entity in UHL. */
  uhlAbove: 5000,
  /** From this many data subjects in six months an entity is at least EHL. */
  ehlFrom: 1000,
  provenance: {
    source: 'GAID 2025, DCPMI classification (as summarised in Templars client alert, Jan 2026)',
    confidence: 'secondary',
    note: 'Other summaries give different volume bands. Check against the GAID schedules and the current NDPC registration guidance before relying on it.',
  } as Provenance,
};

export const TIER_LABEL: Record<Tier, string> = {
  UHL: 'Ultra-High Level',
  EHL: 'Extra-High Level',
  OHL: 'Ordinary-High Level',
};

export const CAR_RULES = {
  /** Month and day the annual Compliance Audit Return falls due (1-based month). */
  dueMonth: 3,
  dueDay: 31,
  feeRangeNgn: [100_000, 1_000_000] as [number, number],
  lateFilingPenalty: 'Up to 2% of prior-year gross revenue or ₦10m, whichever is greater',
  provenance: {
    source: 'GAID 2025; NDPC filing notices',
    confidence: 'secondary',
    note: 'The 2025 return deadline was extended to 30 May 2026. Confirm each cycle against the NDPC notice.',
  } as Provenance,
};

export const LAWFUL_BASES: { id: LawfulBasis; label: string }[] = [
  { id: 'consent', label: 'Consent' },
  { id: 'contract', label: 'Performance of a contract' },
  { id: 'legal-obligation', label: 'Legal obligation' },
  { id: 'vital-interests', label: 'Vital interests' },
  { id: 'public-interest', label: 'Public interest or official authority' },
  { id: 'legitimate-interests', label: 'Legitimate interests' },
];

export interface JurisdictionRules {
  code: JurisdictionCode;
  name: string;
  law: string;
  regulator: string;
  /** Hours to notify the regulator of a breach, or null where the law sets no fixed count. */
  breachHours: number | null;
  breachWindowText: string;
  breach: Provenance;
  /** Days to answer a data subject request, or null where the law sets none. */
  requestDays: number | null;
  request: Provenance;
}

export const JURISDICTIONS: Record<JurisdictionCode, JurisdictionRules> = {
  NG: {
    code: 'NG', name: 'Nigeria', law: 'Nigeria Data Protection Act 2023 and GAID 2025', regulator: 'Nigeria Data Protection Commission (NDPC)',
    breachHours: 72, breachWindowText: '72 hours from awareness',
    breach: { source: 'NDPA 2023 s.40', confidence: 'primary' },
    requestDays: 30,
    request: { source: 'NDPA 2023 ss.34–38; GAID 2025', confidence: 'unverified', note: 'Response period set at 30 days pending confirmation of the GAID timeline.' },
  },
  KE: {
    code: 'KE', name: 'Kenya', law: 'Data Protection Act 2019', regulator: 'Office of the Data Protection Commissioner (ODPC)',
    breachHours: 72, breachWindowText: '72 hours from awareness',
    breach: { source: 'Kenya DPA 2019 s.43', confidence: 'primary' },
    requestDays: 7,
    request: { source: 'Data Protection (General) Regulations 2021', confidence: 'unverified', note: 'Seven days applies to access requests; other request types may differ.' },
  },
  ZA: {
    code: 'ZA', name: 'South Africa', law: 'Protection of Personal Information Act 2013 (POPIA)', regulator: 'Information Regulator',
    breachHours: null, breachWindowText: 'As soon as reasonably possible',
    breach: { source: 'POPIA s.22', confidence: 'primary' },
    requestDays: null,
    request: { source: 'POPIA s.23; PAIA', confidence: 'secondary', note: 'POPIA requires a reasonable time; PAIA timelines apply to formal access requests.' },
  },
  GH: {
    code: 'GH', name: 'Ghana', law: 'Data Protection Act 2012 (Act 843)', regulator: 'Data Protection Commission',
    breachHours: null, breachWindowText: 'As soon as reasonably practicable',
    breach: { source: 'Data Protection Act 2012', confidence: 'unverified' },
    requestDays: 40,
    request: { source: 'Data Protection Act 2012', confidence: 'unverified' },
  },
  EG: {
    code: 'EG', name: 'Egypt', law: 'Personal Data Protection Law 151/2020 and Executive Regulations', regulator: 'Personal Data Protection Center',
    breachHours: 72, breachWindowText: '72 hours',
    breach: { source: 'PDPL Executive Regulations (secondary summaries)', confidence: 'secondary' },
    requestDays: null,
    request: { source: 'PDPL 151/2020', confidence: 'unverified' },
  },
  ZW: {
    code: 'ZW', name: 'Zimbabwe', law: 'Cyber and Data Protection Act', regulator: 'POTRAZ',
    breachHours: 24, breachWindowText: '24 hours',
    breach: { source: 'Cyber and Data Protection Act (secondary summaries)', confidence: 'secondary' },
    requestDays: null,
    request: { source: 'Cyber and Data Protection Act', confidence: 'unverified' },
  },
  EU: {
    code: 'EU', name: 'European Union', law: 'GDPR and EU AI Act', regulator: 'Lead supervisory authority',
    breachHours: 72, breachWindowText: '72 hours from awareness',
    breach: { source: 'GDPR Art. 33', confidence: 'primary' },
    requestDays: 30,
    request: { source: 'GDPR Art. 12(3): one month', confidence: 'primary', note: 'Modelled as 30 days.' },
  },
  UK: {
    code: 'UK', name: 'United Kingdom', law: 'UK GDPR and Data Protection Act 2018', regulator: "Information Commissioner's Office",
    breachHours: 72, breachWindowText: '72 hours from awareness',
    breach: { source: 'UK GDPR Art. 33', confidence: 'primary' },
    requestDays: 30,
    request: { source: 'UK GDPR Art. 12(3): one month', confidence: 'primary', note: 'Modelled as 30 days.' },
  },
};

export const JURISDICTION_CODES = Object.keys(JURISDICTIONS) as JurisdictionCode[];

export const REQUEST_TYPES: { id: RequestType; label: string; ref: string }[] = [
  { id: 'access', label: 'Access', ref: 'NDPA s.34' },
  { id: 'rectification', label: 'Rectification', ref: 'NDPA s.34' },
  { id: 'erasure', label: 'Erasure', ref: 'NDPA s.34' },
  { id: 'portability', label: 'Portability', ref: 'NDPA s.38' },
  { id: 'objection', label: 'Objection', ref: 'NDPA s.36' },
  { id: 'withdraw-consent', label: 'Withdraw consent', ref: 'NDPA s.35' },
  { id: 'automated-decision-review', label: 'Review of automated decision', ref: 'NDPA s.37' },
  { id: 'complaint', label: 'Complaint or grievance', ref: 'GAID Art. 40' },
];

/** Volume of data subjects in one activity above which a DPIA is suggested on scale alone. */
export const DPIA_SCALE_THRESHOLD = 10_000;

export const COUNTRY_NAMES: Record<string, string> = {
  NG: 'Nigeria', KE: 'Kenya', ZA: 'South Africa', GH: 'Ghana', EG: 'Egypt', ZW: 'Zimbabwe',
  US: 'United States', GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France', NL: 'Netherlands',
  IN: 'India', AE: 'United Arab Emirates', SG: 'Singapore', CA: 'Canada', RW: 'Rwanda', CI: "Côte d'Ivoire", SN: 'Senegal',
};

export function sectorById(id: SectorId): Sector {
  return SECTORS.find((s) => s.id === id) ?? SECTORS[SECTORS.length - 1];
}
