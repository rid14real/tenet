// Field definitions drive both the forms in the web app and validation in the API.

import { AI_DOMAINS } from './ai.js';
import { COUNTRY_NAMES, JURISDICTIONS, JURISDICTION_CODES, LAWFUL_BASES, REQUEST_TYPES, SECTORS } from './rules.js';
import type { CollectionName } from './types.js';

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'tags' | 'date' | 'datetime' | 'ref';

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** For `ref`: which collection the value points at. */
  ref?: CollectionName;
  /** For `ref` with multiple values. */
  multiple?: boolean;
  help?: string;
  default?: unknown;
  /** Hide from the list table. */
  listHidden?: boolean;
}

const opts = (xs: { id: string; label: string }[]) => xs.map((x) => ({ value: x.id, label: x.label }));
const jurOpts = JURISDICTION_CODES.map((c) => ({ value: c, label: JURISDICTIONS[c].name }));
const countryOpts = Object.entries(COUNTRY_NAMES).map(([value, label]) => ({ value, label }));

export const WORKSPACE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Organisation name', type: 'text', required: true },
  { key: 'sector', label: 'Sector', type: 'select', required: true, options: opts(SECTORS), default: 'other' },
  { key: 'dataSubjects6m', label: 'Data subjects processed in the last six months', type: 'number', required: true, default: 0 },
  { key: 'jurisdictions', label: 'Jurisdictions with data subjects', type: 'multiselect', options: jurOpts, default: ['NG'] },
  { key: 'cycleYear', label: 'Audit cycle year', type: 'number', required: true, default: 2026 },
  { key: 'registrationNumber', label: 'NDPC registration number', type: 'text' },
  { key: 'dpoName', label: 'DPO name', type: 'text' },
  { key: 'dpoEmail', label: 'DPO email', type: 'text' },
  { key: 'dpoCredentialOnFile', label: 'DPO credential evidence on file', type: 'boolean', default: false },
];

export const COLLECTION_META: Record<CollectionName, { label: string; singular: string; titleKey: string; fields: FieldDef[] }> = {
  activities: {
    label: 'Processing activities', singular: 'processing activity', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
      { key: 'lawfulBasis', label: 'Lawful basis', type: 'select', options: opts(LAWFUL_BASES), help: 'NDPA s.25' },
      { key: 'lawfulBasisNote', label: 'Lawful basis justification', type: 'textarea', listHidden: true, help: 'GAID Art. 16(3) expects the basis to be documented.' },
      { key: 'dataSubjectTypes', label: 'Data subjects', type: 'tags', default: [], help: 'e.g. customers, staff, applicants' },
      { key: 'dataCategories', label: 'Data categories', type: 'tags', default: [], listHidden: true },
      { key: 'volume', label: 'Approximate number of people', type: 'number', default: 0 },
      { key: 'sensitive', label: 'Sensitive personal data', type: 'boolean', default: false, help: 'NDPA s.30' },
      { key: 'children', label: "Children's data", type: 'boolean', default: false, listHidden: true },
      { key: 'automatedDecisions', label: 'Automated decisions with significant effect', type: 'boolean', default: false, listHidden: true },
      { key: 'largeScaleMonitoring', label: 'Systematic or large-scale monitoring', type: 'boolean', default: false, listHidden: true },
      { key: 'newTechnology', label: 'New technology (AI, biometrics, IoT)', type: 'boolean', default: false, listHidden: true },
      { key: 'crossBorder', label: 'Data leaves Nigeria', type: 'boolean', default: false, listHidden: true },
      { key: 'vendorIds', label: 'Vendors involved', type: 'ref', ref: 'vendors', multiple: true, default: [], listHidden: true },
      { key: 'systems', label: 'Systems', type: 'text', listHidden: true },
      { key: 'retention', label: 'Retention period', type: 'text', help: 'e.g. 6 years after account closure' },
      { key: 'owner', label: 'Business owner', type: 'text', listHidden: true },
      { key: 'status', label: 'Status', type: 'select', options: [{ value: 'active', label: 'Active' }, { value: 'retired', label: 'Retired' }], default: 'active' },
    ],
  },
  vendors: {
    label: 'Vendors and transfers', singular: 'vendor', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Vendor', type: 'text', required: true },
      { key: 'service', label: 'Service provided', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, default: 'processor', options: [
        { value: 'processor', label: 'Processor' }, { value: 'sub-processor', label: 'Sub-processor' },
        { value: 'joint-controller', label: 'Joint controller' }, { value: 'independent-controller', label: 'Independent controller' }] },
      { key: 'country', label: 'Where data is processed', type: 'select', options: countryOpts, default: 'NG', required: true },
      { key: 'dpaSigned', label: 'Processing agreement signed', type: 'boolean', default: false, help: 'NDPA s.29; GAID Art. 34' },
      { key: 'dpaDate', label: 'Agreement date', type: 'date', listHidden: true },
      { key: 'transferMechanism', label: 'Transfer basis', type: 'select', default: 'not-needed', help: 'NDPA ss.41–43', options: [
        { value: 'not-needed', label: 'Not needed (data stays in Nigeria)' }, { value: 'adequacy', label: 'Adequacy' },
        { value: 'approved-instrument', label: 'NDPC-approved instrument (SCCs, BCRs)' }, { value: 'pending-approval', label: 'Instrument pending NDPC approval' },
        { value: 'consent', label: 'Consent' }, { value: 'contract-necessity', label: 'Necessary for a contract' }, { value: 'other', label: 'Other derogation' }, { value: 'none', label: 'None recorded' }] },
      { key: 'aiProvider', label: 'Provides AI models or services', type: 'boolean', default: false, listHidden: true },
      { key: 'securityReviewDone', label: 'Security review done', type: 'boolean', default: false },
    ],
  },
  assessments: {
    label: 'Assessments', singular: 'assessment', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'kind', label: 'Type', type: 'select', default: 'dpia', options: [
        { value: 'dpia', label: 'DPIA' }, { value: 'ai-impact', label: 'AI impact assessment' }, { value: 'lia', label: 'Legitimate interests assessment' }, { value: 'tia', label: 'Transfer impact assessment' }] },
      { key: 'activityId', label: 'Processing activity', type: 'ref', ref: 'activities' },
      { key: 'aiSystemId', label: 'AI system', type: 'ref', ref: 'aiSystems', listHidden: true },
      { key: 'mitigations', label: 'Mitigations', type: 'textarea', listHidden: true },
      { key: 'residualRisk', label: 'Residual risk', type: 'select', options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
      { key: 'status', label: 'Status', type: 'select', default: 'draft', options: [{ value: 'draft', label: 'Draft' }, { value: 'in-review', label: 'In review' }, { value: 'approved', label: 'Approved' }] },
      { key: 'approvedBy', label: 'Approved by', type: 'text', listHidden: true },
      { key: 'approvedOn', label: 'Approved on', type: 'date', listHidden: true },
      { key: 'nextReview', label: 'Next review', type: 'date' },
    ],
  },
  incidents: {
    label: 'Incidents', singular: 'incident', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'awareAt', label: 'Became aware at', type: 'datetime', required: true, help: 'Regulator clocks start here.' },
      { key: 'description', label: 'What happened', type: 'textarea', listHidden: true },
      { key: 'affectedCount', label: 'People affected', type: 'number', default: 0 },
      { key: 'dataCategories', label: 'Data involved', type: 'tags', default: [], listHidden: true },
      { key: 'jurisdictions', label: 'Where affected people are', type: 'multiselect', options: jurOpts, default: ['NG'] },
      { key: 'highRiskToSubjects', label: 'High risk to the people affected', type: 'boolean', default: false, listHidden: true, help: 'Decides whether they must be told.' },
      { key: 'status', label: 'Status', type: 'select', default: 'open', options: [{ value: 'open', label: 'Open' }, { value: 'contained', label: 'Contained' }, { value: 'closed', label: 'Closed' }] },
    ],
  },
  requests: {
    label: 'Requests and complaints', singular: 'request', titleKey: 'requester',
    fields: [
      { key: 'requester', label: 'Requester', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', required: true, default: 'access', options: REQUEST_TYPES.map((t) => ({ value: t.id, label: t.label })) },
      { key: 'receivedAt', label: 'Received', type: 'datetime', required: true },
      { key: 'channel', label: 'Channel', type: 'select', default: 'email', options: ['email', 'web', 'whatsapp', 'sms', 'in-person', 'letter'].map((c) => ({ value: c, label: c === 'whatsapp' ? 'WhatsApp' : c === 'sms' ? 'SMS' : c[0].toUpperCase() + c.slice(1).replace('-', ' ') })) },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', options: jurOpts, default: 'NG' },
      { key: 'identityVerified', label: 'Identity verified', type: 'boolean', default: false },
      { key: 'status', label: 'Status', type: 'select', default: 'received', options: [
        { value: 'received', label: 'Received' }, { value: 'verifying', label: 'Verifying identity' }, { value: 'in-progress', label: 'In progress' },
        { value: 'completed', label: 'Completed' }, { value: 'refused', label: 'Refused' }] },
      { key: 'completedAt', label: 'Completed', type: 'datetime', listHidden: true },
      { key: 'notes', label: 'Notes', type: 'textarea', listHidden: true },
    ],
  },
  aiSystems: {
    label: 'AI systems', singular: 'AI system', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true, listHidden: true },
      { key: 'domain', label: 'Use', type: 'select', required: true, default: 'other', options: AI_DOMAINS.map((d) => ({ value: d.id, label: d.label })) },
      { key: 'sourcing', label: 'Sourcing', type: 'select', default: 'in-house', options: [
        { value: 'in-house', label: 'Built in-house' }, { value: 'vendor', label: 'Vendor product' }, { value: 'genai-api', label: 'Generative AI API' }, { value: 'open-source', label: 'Open-source model' }] },
      { key: 'vendorId', label: 'Vendor', type: 'ref', ref: 'vendors', listHidden: true },
      { key: 'decisionRole', label: 'Role in decisions', type: 'select', default: 'advisory', listHidden: true, options: [
        { value: 'solely-automated', label: 'Decides without human review' }, { value: 'human-in-loop', label: 'Human approves each decision' },
        { value: 'advisory', label: 'Advises a human' }, { value: 'none', label: 'No decisions about people' }] },
      { key: 'significantEffect', label: 'Legal or similarly significant effect on people', type: 'boolean', default: false, listHidden: true },
      { key: 'personalData', label: 'Processes personal data', type: 'boolean', default: true, listHidden: true },
      { key: 'sensitiveData', label: 'Processes sensitive personal data', type: 'boolean', default: false, listHidden: true },
      { key: 'markets', label: 'Markets where it is used', type: 'multiselect', options: jurOpts, default: ['NG'], listHidden: true },
      { key: 'interactsWithPublic', label: 'Interacts directly with the public', type: 'boolean', default: false, listHidden: true },
      { key: 'generatesContent', label: 'Generates text, images or audio', type: 'boolean', default: false, listHidden: true },
      { key: 'humanOversight', label: 'Human oversight and appeal route', type: 'textarea', listHidden: true },
      { key: 'impactAssessmentId', label: 'Impact assessment', type: 'ref', ref: 'assessments', listHidden: true },
      { key: 'lastValidated', label: 'Last validated or bias-tested', type: 'date', listHidden: true },
      { key: 'status', label: 'Status', type: 'select', default: 'production', options: [
        { value: 'proposed', label: 'Proposed' }, { value: 'pilot', label: 'Pilot' }, { value: 'production', label: 'In production' }, { value: 'retired', label: 'Retired' }] },
      { key: 'discovered', label: 'Found by discovery (not declared)', type: 'boolean', default: false, listHidden: true },
      { key: 'owner', label: 'Owner', type: 'text' },
    ],
  },
};

export interface ValidationResult { ok: boolean; errors: Record<string, string>; value: Record<string, unknown> }

/** Coerce and check a record against its field definitions. Unknown keys are kept only if listed in `passthrough`. */
export function validateRecord(fields: FieldDef[], input: Record<string, unknown>, passthrough: string[] = []): ValidationResult {
  const errors: Record<string, string> = {};
  const value: Record<string, unknown> = {};
  for (const f of fields) {
    let v = input[f.key];
    if (v === undefined || v === null || v === '') v = f.default ?? (f.type === 'boolean' ? false : undefined);
    if (v === undefined) {
      if (f.required) errors[f.key] = `${f.label} is required.`;
      continue;
    }
    switch (f.type) {
      case 'number': {
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(n) || n < 0) errors[f.key] = `${f.label} must be a number of zero or more.`; else value[f.key] = n;
        break;
      }
      case 'boolean': value[f.key] = v === true || v === 'true' || v === 'on'; break;
      case 'multiselect': case 'tags': {
        const arr = Array.isArray(v) ? v : String(v).split(',');
        const clean = arr.map((x) => String(x).trim()).filter(Boolean);
        if (f.type === 'multiselect' && f.options) {
          const bad = clean.filter((x) => !f.options!.some((o) => o.value === x));
          if (bad.length) { errors[f.key] = `${f.label} has unknown values: ${bad.join(', ')}.`; break; }
        }
        if (f.required && clean.length === 0) errors[f.key] = `${f.label} is required.`;
        value[f.key] = clean;
        break;
      }
      case 'select': {
        const s = String(v);
        if (f.options && !f.options.some((o) => o.value === s)) errors[f.key] = `${f.label} must be one of the listed options.`; else value[f.key] = s;
        break;
      }
      case 'ref': {
        if (f.multiple) value[f.key] = (Array.isArray(v) ? v : [v]).map(String).filter(Boolean);
        else value[f.key] = String(v);
        break;
      }
      case 'date': case 'datetime': {
        const s = String(v);
        if (Number.isNaN(Date.parse(s))) errors[f.key] = `${f.label} must be a valid date.`;
        else value[f.key] = f.type === 'date' ? s.slice(0, 10) : new Date(s).toISOString();
        break;
      }
      default: {
        const s = String(v).trim();
        if (s.length > 5000) errors[f.key] = `${f.label} is too long.`;
        else if (f.required && !s) errors[f.key] = `${f.label} is required.`;
        else value[f.key] = s;
      }
    }
  }
  for (const k of passthrough) if (input[k] !== undefined) value[k] = input[k];
  return { ok: Object.keys(errors).length === 0, errors, value };
}

/** Keys a record may carry outside its form fields. */
export const PASSTHROUGH: Partial<Record<CollectionName, string[]>> = {
  assessments: ['answers'],
  incidents: ['notified', 'notRequired', 'subjectsNotifiedAt'],
};
