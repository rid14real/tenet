// Shared vocabularies. Jurisdiction packs decide what each item means under their law.

import type { CanonicalBasis, PolicyType, RightType, SectorId, SpecialCondition } from './types.js';

export interface DataCategory { id: string; label: string; group: 'Identity' | 'Financial' | 'Digital' | 'Life' | 'Special' }

export const DATA_CATEGORIES: DataCategory[] = [
  { id: 'name', label: 'Name', group: 'Identity' },
  { id: 'contact', label: 'Contact details', group: 'Identity' },
  { id: 'gov-id', label: 'Government ID numbers (NIN, BVN, ID number, passport)', group: 'Identity' },
  { id: 'dob', label: 'Date of birth and age', group: 'Identity' },
  { id: 'images', label: 'Photos and CCTV images', group: 'Identity' },
  { id: 'voice', label: 'Voice recordings', group: 'Identity' },
  { id: 'financial', label: 'Bank and payment details', group: 'Financial' },
  { id: 'transactions', label: 'Transaction history', group: 'Financial' },
  { id: 'credit', label: 'Credit history and scores', group: 'Financial' },
  { id: 'income', label: 'Income and salary', group: 'Financial' },
  { id: 'property', label: 'Property and assets', group: 'Financial' },
  { id: 'location', label: 'Precise location', group: 'Digital' },
  { id: 'device', label: 'Device and online identifiers', group: 'Digital' },
  { id: 'behaviour', label: 'Online behaviour and preferences', group: 'Digital' },
  { id: 'employment', label: 'Employment and HR records', group: 'Life' },
  { id: 'education', label: 'Education records', group: 'Life' },
  { id: 'marital-family', label: 'Marital status and family details', group: 'Life' },
  { id: 'children', label: "Children's data", group: 'Life' },
  { id: 'health', label: 'Health and medical', group: 'Special' },
  { id: 'genetic', label: 'Genetic data', group: 'Special' },
  { id: 'biometric', label: 'Biometric data (fingerprint, face template)', group: 'Special' },
  { id: 'racial-ethnic', label: 'Race or ethnic origin', group: 'Special' },
  { id: 'religious', label: 'Religious or philosophical beliefs', group: 'Special' },
  { id: 'political', label: 'Political opinions', group: 'Special' },
  { id: 'trade-union', label: 'Trade union membership', group: 'Special' },
  { id: 'sex-life', label: 'Sex life or sexual orientation', group: 'Special' },
  { id: 'criminal', label: 'Criminal records and allegations', group: 'Special' },
];

export const categoryLabel = (id: string) => DATA_CATEGORIES.find((c) => c.id === id)?.label ?? id;

export interface Sector { id: SectorId; label: string; financial: boolean }
export const SECTORS: Sector[] = [
  { id: 'bank', label: 'Bank', financial: true },
  { id: 'fintech', label: 'Payments or fintech', financial: true },
  { id: 'insurer', label: 'Insurance', financial: true },
  { id: 'mfb', label: 'Microfinance bank', financial: true },
  { id: 'mortgage', label: 'Mortgage bank', financial: true },
  { id: 'telco', label: 'Telecoms', financial: false },
  { id: 'multinational', label: 'Multinational group', financial: false },
  { id: 'hospital', label: 'Hospital or health provider', financial: false },
  { id: 'higher', label: 'University or higher institution', financial: false },
  { id: 'school', label: 'School', financial: false },
  { id: 'mda', label: 'Government body', financial: false },
  { id: 'ecommerce', label: 'Retail or e-commerce', financial: false },
  { id: 'saas', label: 'Software or SaaS', financial: false },
  { id: 'hospitality', label: 'Hospitality', financial: false },
  { id: 'transport', label: 'Transport or logistics', financial: false },
  { id: 'ngo', label: 'Non-profit', financial: false },
  { id: 'other', label: 'Other', financial: false },
];
export const sectorById = (id: SectorId): Sector => SECTORS.find((s) => s.id === id) ?? SECTORS[SECTORS.length - 1];

export const BASES: { id: CanonicalBasis; label: string }[] = [
  { id: 'consent', label: 'Consent' },
  { id: 'contract', label: 'Contract with the person' },
  { id: 'legal-obligation', label: 'Legal obligation' },
  { id: 'vital-interests', label: 'Vital interests' },
  { id: 'public-task', label: 'Public task or official authority' },
  { id: 'legitimate-interests', label: 'Legitimate interests' },
];

export const SPECIAL_CONDITIONS: { id: SpecialCondition; label: string }[] = [
  { id: 'explicit-consent', label: 'Explicit consent' },
  { id: 'employment-law', label: 'Employment or social security law' },
  { id: 'vital-interests', label: 'Vital interests' },
  { id: 'legal-claims', label: 'Legal claims or proceedings' },
  { id: 'substantial-public-interest', label: 'Substantial public interest under law' },
  { id: 'health-care', label: 'Health or social care' },
  { id: 'public-health', label: 'Public health' },
  { id: 'research', label: 'Research, statistics or archiving' },
  { id: 'made-public', label: 'Made public by the person' },
  { id: 'not-for-profit', label: 'Not-for-profit body, members only' },
];

export const RIGHTS: { id: RightType; label: string }[] = [
  { id: 'access', label: 'Access' },
  { id: 'rectification', label: 'Rectification' },
  { id: 'erasure', label: 'Erasure' },
  { id: 'restriction', label: 'Restriction' },
  { id: 'portability', label: 'Portability' },
  { id: 'objection', label: 'Objection' },
  { id: 'withdraw-consent', label: 'Withdraw consent' },
  { id: 'automated-decision', label: 'Human review of automated decision' },
  { id: 'complaint', label: 'Complaint or grievance' },
];
export const rightLabel = (id: RightType) => RIGHTS.find((r) => r.id === id)?.label ?? id;

export const POLICY_TYPES: { id: PolicyType; label: string }[] = [
  { id: 'privacy-notice', label: 'Privacy notice' },
  { id: 'data-protection-policy', label: 'Data protection policy' },
  { id: 'retention-schedule', label: 'Retention schedule' },
  { id: 'breach-response', label: 'Breach response plan' },
  { id: 'rights-procedure', label: 'Data subject request procedure' },
  { id: 'information-security', label: 'Information security policy' },
  { id: 'vendor-management', label: 'Vendor and processor management' },
  { id: 'ai-use', label: 'AI use policy' },
  { id: 'cookie-notice', label: 'Cookie notice' },
  { id: 'cctv-notice', label: 'CCTV notice' },
  { id: 'paia-manual', label: 'PAIA manual (South Africa)' },
];

export const COUNTRIES: Record<string, string> = {
  NG: 'Nigeria', ZA: 'South Africa', KE: 'Kenya', GH: 'Ghana', EG: 'Egypt', ZW: 'Zimbabwe', RW: 'Rwanda', UG: 'Uganda', TZ: 'Tanzania',
  CI: "Côte d'Ivoire", SN: 'Senegal', MA: 'Morocco', MU: 'Mauritius', BW: 'Botswana', ZM: 'Zambia', ET: 'Ethiopia',
  GB: 'United Kingdom', IE: 'Ireland', DE: 'Germany', FR: 'France', NL: 'Netherlands', BE: 'Belgium', ES: 'Spain', IT: 'Italy', SE: 'Sweden', PL: 'Poland', PT: 'Portugal', LU: 'Luxembourg',
  US: 'United States', CA: 'Canada', IN: 'India', AE: 'United Arab Emirates', SA: 'Saudi Arabia', SG: 'Singapore', CN: 'China', JP: 'Japan', AU: 'Australia', BR: 'Brazil',
};
export const countryName = (c: string) => COUNTRIES[c] ?? c;

export const EEA = ['IE', 'DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'SE', 'PL', 'PT', 'LU'];

export const TRANSFER_MECHANISMS = [
  { id: 'adequacy', label: 'Adequacy or equivalent protection' },
  { id: 'approved-instrument', label: 'Approved contract clauses or instrument' },
  { id: 'binding-corporate-rules', label: 'Binding corporate rules' },
  { id: 'pending-approval', label: 'Instrument awaiting regulator approval' },
  { id: 'consent', label: 'Consent of the person' },
  { id: 'contract-necessity', label: 'Necessary for a contract with the person' },
  { id: 'other-derogation', label: 'Other derogation' },
  { id: 'none', label: 'None recorded' },
] as const;
