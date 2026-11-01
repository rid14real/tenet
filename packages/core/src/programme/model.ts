// Open Privacy Programme Framework (OPPF): the data model.
// The framework answers what to implement, in what order and how much is enough for an organisation
// of a given size and risk. Laws and standards are mapped onto it; they do not drive its structure.

import type { Confidence, JurisdictionCode } from '../types.js';

export const FRAMEWORK_META = {
  id: 'oppf',
  name: 'Open Privacy Programme Framework',
  shortName: 'OPPF',
  version: '1.0.0-draft.1',
  status: 'draft' as const,
  publisher: 'FR Data Protection',
  licence: 'CC BY 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
  asOf: '2026-11-01',
  summary:
    'A sequenced, scalable implementation framework for data protection programmes. One control catalogue, three scaling profiles, four phases and a maturity model, mapped to eight data protection laws, ISO/IEC 27701 and the NIST Privacy Framework, with ISO/IEC 42001 and the EU AI Act for AI controls.',
};

/** Minimum scaling profile at which a control applies. Legal requirements can pull a control in below its profile. */
export type Profile = 'essential' | 'standard' | 'advanced';
export const PROFILES: { id: Profile; label: string; rank: number; who: string }[] = [
  { id: 'essential', label: 'Essential', rank: 1, who: 'Small organisations with low-risk processing: the legal floor plus the habits that keep it true.' },
  { id: 'standard', label: 'Standard', rank: 2, who: 'Mid-sized organisations, or any organisation with sensitive data or a regulator that audits: a managed, evidenced programme.' },
  { id: 'advanced', label: 'Advanced', rank: 3, who: 'Regulated sectors, very large volumes, groups and certification candidates: an assured, measured programme.' },
];
export const profileRank = (p: Profile) => PROFILES.find((x) => x.id === p)!.rank;

export type Phase = 1 | 2 | 3 | 4;
export const PHASES: { id: Phase; name: string; goal: string }[] = [
  { id: 1, name: 'Foundation', goal: 'Mandate, ownership, knowing your data, and the legal must-haves that carry penalties on their own.' },
  { id: 2, name: 'Operate', goal: 'Repeatable processes for assessments, rights, vendors, transfers, retention and incidents.' },
  { id: 3, name: 'Assure', goal: 'Monitoring, testing, training in depth and internal audit, so the programme can prove it works.' },
  { id: 4, name: 'Optimise', goal: 'Measurement, automation, certification and continual improvement.' },
];

export type DomainId = 'GOV' | 'REG' | 'INV' | 'LAW' | 'TRN' | 'RTS' | 'RSK' | 'TPR' | 'SEC' | 'LIF' | 'INC' | 'PPL' | 'AIG' | 'ASR';

export interface Domain { id: DomainId; name: string; purpose: string }

export type OwnerRole = 'board' | 'privacy-lead' | 'legal' | 'security' | 'it' | 'hr' | 'procurement' | 'product' | 'marketing' | 'business-owners' | 'customer-service' | 'internal-audit' | 'data-science';
export const OWNER_LABEL: Record<OwnerRole, string> = {
  board: 'Board or executive', 'privacy-lead': 'Privacy lead (DPO)', legal: 'Legal', security: 'Information security', it: 'IT',
  hr: 'HR', procurement: 'Procurement', product: 'Product and engineering', marketing: 'Marketing', 'business-owners': 'Business process owners',
  'customer-service': 'Customer service', 'internal-audit': 'Internal audit', 'data-science': 'Data science',
};

/** S ≈ 2, M ≈ 6, L ≈ 15 person-days for a standard-profile organisation. */
export type Effort = 'S' | 'M' | 'L';
export const EFFORT_DAYS: Record<Effort, number> = { S: 2, M: 6, L: 15 };

export type Recurrence = 'once' | 'continuous' | 'per-event' | 'quarterly' | 'semi-annual' | 'annual' | 'biennial';
export const RECURRENCE_MONTHS: Partial<Record<Recurrence, number>> = { quarterly: 3, 'semi-annual': 6, annual: 12, biennial: 24 };

/**
 * Facts about the organisation that switch controls on. Answered in the scoping questionnaire;
 * several can be suggested from records already in Tenet.
 */
export type Trigger =
  | 'processor' | 'website' | 'children' | 'sensitive' | 'ai' | 'transfers' | 'marketing'
  | 'monitoring' | 'representative' | 'certification' | 'consent';

export const TRIGGER_LABEL: Record<Trigger, string> = {
  processor: 'Processes personal data for clients (acts as processor)',
  website: 'Runs public websites or apps that use cookies or similar technologies',
  children: 'Processes children’s data',
  sensitive: 'Processes sensitive or special category data',
  ai: 'Uses AI or makes automated decisions about people',
  transfers: 'Transfers personal data across borders, including to cloud services abroad',
  marketing: 'Sends direct marketing',
  monitoring: 'Monitors people (CCTV, employee monitoring, location or biometric tracking)',
  representative: 'Needs a local representative (subject to GDPR or UK GDPR without an establishment there)',
  certification: 'Aims to certify the programme (ISO/IEC 27701)',
  consent: 'Relies on consent for some processing',
};

/** A mapped reference. `requires` means the law itself imposes the control; `supports` means the control helps meet it. */
export interface Ref { ref: string; kind: 'requires' | 'supports'; conf: Confidence; note?: string }

export type StandardId = 'ISO27701' | 'NISTPF' | 'ISO42001' | 'EUAIA';
export const STANDARDS: Record<StandardId, { name: string; version: string; note: string }> = {
  ISO27701: { name: 'ISO/IEC 27701', version: '2025', note: 'Second edition, October 2025. Standalone privacy information management system; clauses 4–10 plus Annex A (A.1 controller, A.2 processor, A.3 shared controls). Clause numbers follow the harmonised structure; Annex A control numbers are not reproduced here.' },
  NISTPF: { name: 'NIST Privacy Framework', version: '1.0', note: 'Version 1.0 (January 2020) is the only final version. Version 1.1 was an initial public draft in April 2025. Categories cited are from 1.0.' },
  ISO42001: { name: 'ISO/IEC 42001', version: '2023', note: 'AI management system. Cited by clause or Annex A topic.' },
  EUAIA: { name: 'EU AI Act', version: 'Regulation (EU) 2024/1689', note: 'Cited for organisations placing or using AI systems in the EU market.' },
};

export interface Control {
  id: string;
  domain: DomainId;
  title: string;
  /** What good looks like once the control is in place. */
  objective: string;
  phase: Phase;
  profile: Profile;
  /** All listed triggers must hold. Omit for controls every organisation needs. */
  triggers?: Trigger[];
  /** Only relevant where one of these laws is in scope. */
  onlyFor?: JurisdictionCode[];
  dependsOn: string[];
  owner: OwnerRole;
  effort: Effort;
  recurrence: Recurrence;
  /** Implementation steps, in order. */
  steps: string[];
  deliverables: string[];
  /** What an auditor or regulator would ask to see. */
  evidence: string[];
  /** Tenet module that holds the records this control produces. */
  module?: 'datamap' | 'vendors' | 'assessments' | 'incidents' | 'requests' | 'governance' | 'ai' | 'settings';
  laws: Partial<Record<JurisdictionCode, Ref[]>>;
  standards: Partial<Record<StandardId, string[]>>;
  /** Practitioner notes: pitfalls, scaling advice, pending law changes. */
  notes?: string;
}
