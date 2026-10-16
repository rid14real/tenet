// Field definitions for every record type. Options and visibility follow the entity's jurisdictions.

import { AI_DOMAINS } from './ai.js';
import { ASSESSMENT_KINDS } from './assessments.js';
import { JURISDICTION_CODES, PACKS, establishedIn, sensitiveIn } from './jurisdictions.js';
import { BASES, COUNTRIES, DATA_CATEGORIES, POLICY_TYPES, RIGHTS, SECTORS, SPECIAL_CONDITIONS, TRANSFER_MECHANISMS } from './taxonomy.js';
import type { FieldCtx, FieldDef } from './fields.js';
import type { CollectionName, JurisdictionCode } from './types.js';

const o = (xs: readonly { id: string; label: string }[]) => xs.map((x) => ({ value: x.id, label: x.label }));
const countryOpts = Object.entries(COUNTRIES).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label));
const wsJx = (ctx: FieldCtx): JurisdictionCode[] => ctx.workspace?.jurisdictions ?? JURISDICTION_CODES;
const jxOpts = (ctx: FieldCtx) => wsJx(ctx).map((c) => ({ value: c, label: PACKS[c].name }));
const yes = (v: unknown) => v === true || v === 'true';

/** Lawful basis options with the citation under each of the entity's laws. */
const basisOpts = (ctx: FieldCtx) => BASES.map((b) => {
  const refs = wsJx(ctx).map((c) => { const r = PACKS[c].bases.available[b.id]; return r ? `${PACKS[c].shortLaw} ${r}` : `not in ${PACKS[c].shortLaw}`; });
  return { value: b.id, label: `${b.label} — ${refs.join(' · ')}` };
});
const foreignToSome = (country: unknown, ctx: FieldCtx) => !!country && wsJx(ctx).some((j) => PACKS[j].transfers && !establishedIn(j, String(country)));

export const WORKSPACE_FIELDS: FieldDef[] = [
  { key: 'name', label: 'Legal name', type: 'text', required: true, section: 'Entity' },
  { key: 'sector', label: 'Sector', type: 'select', required: true, options: o(SECTORS), default: 'other', section: 'Entity' },
  { key: 'establishment', label: 'Country of establishment', type: 'select', required: true, options: countryOpts, default: 'NG', section: 'Entity' },
  { key: 'jurisdictions', label: 'Laws that apply', type: 'multiselect', required: true, options: JURISDICTION_CODES.map((c) => ({ value: c, label: PACKS[c].name })), default: ['NG'], section: 'Entity', help: 'Where you are established or where the people whose data you process are. Each choice switches on that law’s fields, deadlines and checks.' },
  { key: 'role', label: 'Acts mainly as', type: 'select', default: 'controller', options: [{ value: 'controller', label: 'Controller' }, { value: 'processor', label: 'Processor for clients' }, { value: 'both', label: 'Both' }], section: 'Entity' },
  { key: 'employees', label: 'Employees', type: 'number', section: 'Entity' },
  { key: 'privacyLeadName', label: 'Privacy lead (DPO or equivalent)', type: 'text', section: 'People' },
  { key: 'privacyLeadEmail', label: 'Privacy lead email', type: 'text', section: 'People' },
];

export const COLLECTION_META: Record<CollectionName, { label: string; singular: string; titleKey: string; fields: FieldDef[]; passthrough?: string[] }> = {
  activities: {
    label: 'Processing activities', singular: 'processing activity', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true, section: 'What and why' },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true, section: 'What and why' },
      { key: 'department', label: 'Department', type: 'text', section: 'What and why' },
      { key: 'owner', label: 'Business owner', type: 'text', section: 'What and why', listHidden: true },
      { key: 'capacity', label: 'Our role', type: 'select', default: 'controller', section: 'What and why', listHidden: true, options: [{ value: 'controller', label: 'Controller' }, { value: 'joint-controller', label: 'Joint controller' }, { value: 'processor', label: 'Processor for a client' }] },
      { key: 'status', label: 'Status', type: 'select', default: 'active', section: 'What and why', listHidden: true, options: [{ value: 'active', label: 'Active' }, { value: 'planned', label: 'Planned' }, { value: 'retired', label: 'Retired' }] },
      { key: 'jurisdictions', label: 'Whose data (jurisdictions)', type: 'multiselect', required: true, optionsFn: jxOpts, section: 'People and data', listHidden: true, help: 'Only laws switched on for this entity are offered.' },
      { key: 'dataSubjectTypes', label: 'Data subjects', type: 'tags', default: [], section: 'People and data', help: 'e.g. customers, staff, applicants' },
      { key: 'volume', label: 'Approximate number of people', type: 'number', default: 0, section: 'People and data', listHidden: true },
      { key: 'source', label: 'Where the data comes from', type: 'select', default: 'data-subject', section: 'People and data', listHidden: true, options: [{ value: 'data-subject', label: 'The person' }, { value: 'third-party', label: 'Third parties' }, { value: 'public', label: 'Public sources' }, { value: 'mixed', label: 'Mixed' }] },
      { key: 'dataCategoryIds', label: 'Data categories', type: 'multiselect', default: [], options: o(DATA_CATEGORIES), section: 'People and data', listHidden: true },
      { key: 'lawfulBasis', label: 'Lawful basis', type: 'select', optionsFn: basisOpts, section: 'Lawful basis' },
      { key: 'basisJustification', label: 'Why this basis applies', type: 'textarea', section: 'Lawful basis', listHidden: true, help: 'For legitimate interests, link the assessment.' },
      { key: 'specialCondition', label: 'Condition for sensitive data', type: 'select', options: o(SPECIAL_CONDITIONS), section: 'Lawful basis', listHidden: true,
        visible: (v, ctx) => { const cats = (v.dataCategoryIds as string[]) ?? []; const jx = ((v.jurisdictions as JurisdictionCode[])?.length ? v.jurisdictions as JurisdictionCode[] : wsJx(ctx)); return jx.some((j) => sensitiveIn(j, cats).length > 0); },
        help: 'Shown because a selected category is sensitive under one of the laws in scope.' },
      { key: 'systemIds', label: 'Systems holding the data', type: 'ref', ref: 'systems', multiple: true, default: [], section: 'Where it lives', listHidden: true },
      { key: 'vendorIds', label: 'Vendors involved', type: 'ref', ref: 'vendors', multiple: true, default: [], section: 'Where it lives', listHidden: true },
      { key: 'recipients', label: 'Other recipients', type: 'text', section: 'Where it lives', listHidden: true, help: 'e.g. regulators, credit bureaus, group companies' },
      { key: 'retentionPeriod', label: 'Retention period', type: 'text', section: 'Retention', help: 'e.g. 6 years' },
      { key: 'retentionTrigger', label: 'Counted from', type: 'text', section: 'Retention', listHidden: true, help: 'e.g. account closure' },
      { key: 'disposalMethod', label: 'How it is disposed of', type: 'text', section: 'Retention', listHidden: true },
      { key: 'automatedDecisions', label: 'Automated decisions with significant effect', type: 'boolean', default: false, section: 'Risk flags', listHidden: true },
      { key: 'largeScaleMonitoring', label: 'Systematic or large-scale monitoring', type: 'boolean', default: false, section: 'Risk flags', listHidden: true },
      { key: 'newTechnology', label: 'New technology (AI, biometrics, IoT)', type: 'boolean', default: false, section: 'Risk flags', listHidden: true },
      { key: 'directMarketing', label: 'Used for direct marketing', type: 'boolean', default: false, section: 'Risk flags', listHidden: true },
      { key: 'lastReviewed', label: 'Last reviewed', type: 'date', section: 'Risk flags', listHidden: true },
    ],
  },
  systems: {
    label: 'Systems', singular: 'system', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'kind', label: 'Type', type: 'select', default: 'application', options: [{ value: 'application', label: 'Application' }, { value: 'database', label: 'Database' }, { value: 'saas', label: 'SaaS' }, { value: 'file-store', label: 'File storage' }, { value: 'device', label: 'Devices' }, { value: 'paper', label: 'Paper records' }] },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'hostingCountry', label: 'Where it is hosted', type: 'select', required: true, options: countryOpts, default: 'NG' },
      { key: 'vendorId', label: 'Provided by vendor', type: 'ref', ref: 'vendors', listHidden: true },
      { key: 'transferMechanism', label: 'Transfer basis for hosting abroad', type: 'select', options: o(TRANSFER_MECHANISMS), listHidden: true,
        visible: (v, ctx) => !v.vendorId && foreignToSome(v.hostingCountry, ctx), help: 'Shown because this location is outside one of your jurisdictions and no vendor carries a basis.' },
      { key: 'encryptionAtRest', label: 'Encrypted at rest', type: 'boolean', default: false, listHidden: true },
      { key: 'encryptionInTransit', label: 'Encrypted in transit', type: 'boolean', default: false, listHidden: true },
      { key: 'mfa', label: 'Multi-factor sign-in', type: 'boolean', default: false, listHidden: true },
      { key: 'accessLogging', label: 'Access logged', type: 'boolean', default: false, listHidden: true },
      { key: 'backups', label: 'Backed up', type: 'boolean', default: false, listHidden: true },
      { key: 'automatedDeletion', label: 'Automated deletion at end of retention', type: 'boolean', default: false, listHidden: true },
      { key: 'status', label: 'Status', type: 'select', default: 'live', options: [{ value: 'live', label: 'Live' }, { value: 'planned', label: 'Planned' }, { value: 'decommissioned', label: 'Decommissioned' }] },
    ],
  },
  vendors: {
    label: 'Vendors', singular: 'vendor', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Vendor', type: 'text', required: true },
      { key: 'service', label: 'Service provided', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'select', required: true, default: 'processor', options: [{ value: 'processor', label: 'Processor' }, { value: 'sub-processor', label: 'Sub-processor' }, { value: 'joint-controller', label: 'Joint controller' }, { value: 'independent-controller', label: 'Independent controller' }] },
      { key: 'country', label: 'Where it processes data', type: 'select', options: countryOpts, default: 'NG', required: true },
      { key: 'dpaSigned', label: 'Processing agreement signed', type: 'boolean', default: false, listHidden: true },
      { key: 'dpaDate', label: 'Agreement date', type: 'date', listHidden: true, visible: (v) => yes(v.dpaSigned) },
      { key: 'transferMechanism', label: 'Transfer basis', type: 'select', default: 'none', options: o(TRANSFER_MECHANISMS), listHidden: true,
        visible: (v, ctx) => foreignToSome(v.country, ctx), help: 'Shown because this location is outside at least one of your jurisdictions.' },
      { key: 'certifications', label: 'Certifications', type: 'tags', default: [], listHidden: true, help: 'e.g. ISO 27001, SOC 2' },
      { key: 'securityReviewDone', label: 'Security review done', type: 'boolean', default: false, listHidden: true },
      { key: 'lastReviewed', label: 'Last reviewed', type: 'date', listHidden: true },
      { key: 'breachLast24m', label: 'Breach in the last 24 months', type: 'boolean', default: false, listHidden: true },
      { key: 'subprocessorsDisclosed', label: 'Sub-processors disclosed', type: 'boolean', default: false, listHidden: true },
      { key: 'aiProvider', label: 'Provides AI models or services', type: 'boolean', default: false, listHidden: true },
    ],
  },
  assessments: {
    label: 'Assessments', singular: 'assessment', titleKey: 'title', passthrough: ['answers', 'risks'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'kind', label: 'Type', type: 'select', default: 'dpia', options: ASSESSMENT_KINDS.map((k) => ({ value: k.id, label: k.label })) },
      { key: 'activityIds', label: 'Processing activities covered', type: 'ref', ref: 'activities', multiple: true, default: [], listHidden: true },
      { key: 'aiSystemId', label: 'AI system', type: 'ref', ref: 'aiSystems', listHidden: true, visible: (v) => v.kind === 'aia' },
      { key: 'vendorId', label: 'Vendor receiving the data', type: 'ref', ref: 'vendors', listHidden: true, visible: (v) => v.kind === 'tia' },
      { key: 'status', label: 'Status', type: 'select', default: 'draft', options: [{ value: 'draft', label: 'Draft' }, { value: 'in-review', label: 'In review' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }] },
      { key: 'dpoAdvice', label: 'Privacy lead advice', type: 'textarea', listHidden: true },
      { key: 'outcome', label: 'Outcome', type: 'select', listHidden: true, options: [{ value: 'proceed', label: 'Proceed' }, { value: 'proceed-with-conditions', label: 'Proceed with conditions' }, { value: 'do-not-proceed', label: 'Do not proceed' }, { value: 'consult-regulator', label: 'Consult the regulator first' }] },
      { key: 'conditions', label: 'Conditions', type: 'textarea', listHidden: true },
      { key: 'approver', label: 'Approved by', type: 'text', listHidden: true },
      { key: 'approvedOn', label: 'Approved on', type: 'date', listHidden: true },
      { key: 'nextReview', label: 'Next review', type: 'date' },
    ],
  },
  incidents: {
    label: 'Incidents', singular: 'incident', titleKey: 'title', passthrough: ['decisions', 'notifications', 'subjectsNotifiedAt', 'timeline'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true, section: 'What happened' },
      { key: 'awareAt', label: 'Became aware at', type: 'datetime', required: true, section: 'What happened', help: 'Regulator clocks start here.' },
      { key: 'occurredAt', label: 'Occurred at', type: 'datetime', section: 'What happened', listHidden: true },
      { key: 'cause', label: 'Cause', type: 'select', default: 'other', section: 'What happened', listHidden: true, options: [{ value: 'misdirected', label: 'Sent to the wrong recipient' }, { value: 'lost-device', label: 'Lost or stolen device' }, { value: 'cyber-attack', label: 'Cyber attack' }, { value: 'insider', label: 'Unauthorised access by staff' }, { value: 'system-error', label: 'System error' }, { value: 'vendor', label: 'Vendor incident' }, { value: 'other', label: 'Other' }] },
      { key: 'description', label: 'Description', type: 'textarea', section: 'What happened', listHidden: true },
      { key: 'affectedCount', label: 'People affected', type: 'number', default: 0, section: 'Scope' },
      { key: 'jurisdictions', label: 'Where affected people are', type: 'multiselect', required: true, optionsFn: jxOpts, section: 'Scope' },
      { key: 'dataCategoryIds', label: 'Data involved', type: 'multiselect', default: [], options: o(DATA_CATEGORIES), section: 'Scope', listHidden: true },
      { key: 'systemIds', label: 'Systems involved', type: 'ref', ref: 'systems', multiple: true, default: [], section: 'Scope', listHidden: true },
      { key: 'vendorId', label: 'Vendor involved', type: 'ref', ref: 'vendors', section: 'Scope', listHidden: true },
      { key: 'dataUnintelligible', label: 'Data was encrypted or unintelligible to the recipient', type: 'boolean', default: false, section: 'Harm', listHidden: true },
      { key: 'likelihoodOfHarm', label: 'Likelihood of harm', type: 'select', default: 'medium', section: 'Harm', listHidden: true, options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
      { key: 'severityOfHarm', label: 'Severity of harm', type: 'select', default: 'medium', section: 'Harm', listHidden: true, options: [{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }] },
      { key: 'containment', label: 'Containment and recovery', type: 'textarea', section: 'Response', listHidden: true },
      { key: 'stage', label: 'Stage', type: 'select', default: 'triage', section: 'Response', options: [{ value: 'triage', label: 'Triage' }, { value: 'contained', label: 'Contained' }, { value: 'assessed', label: 'Assessed' }, { value: 'notified', label: 'Notified' }, { value: 'closed', label: 'Closed' }] },
      { key: 'rootCause', label: 'Root cause', type: 'textarea', section: 'Close-out', listHidden: true },
      { key: 'lessons', label: 'Lessons and preventive actions', type: 'textarea', section: 'Close-out', listHidden: true },
    ],
  },
  requests: {
    label: 'Requests', singular: 'request', titleKey: 'requester', passthrough: ['systemTasks'],
    fields: [
      { key: 'requester', label: 'Requester', type: 'text', required: true },
      { key: 'type', label: 'Right exercised', type: 'select', required: true, default: 'access', options: o(RIGHTS) },
      { key: 'jurisdiction', label: 'Jurisdiction', type: 'select', required: true, optionsFn: jxOpts, help: 'Sets the deadline and which rights apply.' },
      { key: 'receivedAt', label: 'Received', type: 'datetime', required: true },
      { key: 'channel', label: 'Channel', type: 'select', default: 'email', listHidden: true, options: [{ value: 'email', label: 'Email' }, { value: 'web', label: 'Web form' }, { value: 'whatsapp', label: 'WhatsApp' }, { value: 'sms', label: 'SMS' }, { value: 'phone', label: 'Phone' }, { value: 'in-person', label: 'In person' }, { value: 'letter', label: 'Letter' }] },
      { key: 'contact', label: 'Contact', type: 'text', listHidden: true },
      { key: 'subjectType', label: 'Relationship', type: 'text', listHidden: true, help: 'e.g. customer, staff. Used to list the systems to search.' },
      { key: 'identityVerified', label: 'Identity verified', type: 'boolean', default: false, listHidden: true },
      { key: 'verificationMethod', label: 'How identity was verified', type: 'text', listHidden: true, visible: (v) => yes(v.identityVerified) },
      { key: 'stage', label: 'Stage', type: 'select', default: 'received', options: [{ value: 'received', label: 'Received' }, { value: 'verifying', label: 'Verifying identity' }, { value: 'in-progress', label: 'In progress' }, { value: 'responded', label: 'Responded' }, { value: 'refused', label: 'Refused' }] },
      { key: 'extended', label: 'Deadline extended', type: 'boolean', default: false, listHidden: true, visible: (v) => !!PACKS[v.jurisdiction as JurisdictionCode]?.rights.extension },
      { key: 'extensionReason', label: 'Reason for extension', type: 'textarea', listHidden: true, visible: (v) => yes(v.extended) },
      { key: 'refusalReason', label: 'Reason for refusal', type: 'textarea', listHidden: true, visible: (v) => v.stage === 'refused' },
      { key: 'respondedAt', label: 'Responded on', type: 'datetime', listHidden: true, visible: (v) => v.stage === 'responded' },
      { key: 'notes', label: 'Notes', type: 'textarea', listHidden: true },
    ],
  },
  aiSystems: {
    label: 'AI systems', singular: 'AI system', titleKey: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'purpose', label: 'Purpose', type: 'textarea', required: true, listHidden: true },
      { key: 'domain', label: 'Use', type: 'select', required: true, default: 'other', options: AI_DOMAINS.map((d) => ({ value: d.id, label: d.label })) },
      { key: 'sourcing', label: 'Sourcing', type: 'select', default: 'in-house', options: [{ value: 'in-house', label: 'Built in-house' }, { value: 'vendor', label: 'Vendor product' }, { value: 'genai-api', label: 'Generative AI API' }, { value: 'open-source', label: 'Open-source model' }] },
      { key: 'vendorId', label: 'Vendor', type: 'ref', ref: 'vendors', listHidden: true, visible: (v) => v.sourcing === 'vendor' || v.sourcing === 'genai-api' },
      { key: 'markets', label: 'Used for people in', type: 'multiselect', required: true, optionsFn: jxOpts, listHidden: true },
      { key: 'decisionRole', label: 'Role in decisions', type: 'select', default: 'advisory', listHidden: true, options: [{ value: 'solely-automated', label: 'Decides without human review' }, { value: 'human-in-loop', label: 'Human approves each decision' }, { value: 'advisory', label: 'Advises a human' }, { value: 'none', label: 'No decisions about people' }] },
      { key: 'significantEffect', label: 'Legal or similarly significant effect on people', type: 'boolean', default: false, listHidden: true, visible: (v) => v.decisionRole !== 'none' },
      { key: 'personalData', label: 'Processes personal data', type: 'boolean', default: true, listHidden: true },
      { key: 'sensitiveData', label: 'Processes sensitive data', type: 'boolean', default: false, listHidden: true, visible: (v) => yes(v.personalData) },
      { key: 'interactsWithPublic', label: 'Interacts directly with the public', type: 'boolean', default: false, listHidden: true },
      { key: 'generatesContent', label: 'Generates text, images or audio', type: 'boolean', default: false, listHidden: true },
      { key: 'humanOversight', label: 'Human oversight and appeal route', type: 'textarea', listHidden: true },
      { key: 'impactAssessmentId', label: 'Impact assessment', type: 'ref', ref: 'assessments', listHidden: true },
      { key: 'lastValidated', label: 'Last validated or bias-tested', type: 'date', listHidden: true },
      { key: 'status', label: 'Status', type: 'select', default: 'production', options: [{ value: 'proposed', label: 'Proposed' }, { value: 'pilot', label: 'Pilot' }, { value: 'production', label: 'In production' }, { value: 'retired', label: 'Retired' }] },
      { key: 'discovered', label: 'Found by discovery (not declared)', type: 'boolean', default: false, listHidden: true },
      { key: 'owner', label: 'Owner', type: 'text' },
    ],
  },
  policies: {
    label: 'Policies and notices', singular: 'policy', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'type', label: 'Type', type: 'select', required: true, default: 'privacy-notice', optionsFn: (ctx) => o(POLICY_TYPES.filter((p) => p.id !== 'paia-manual' || wsJx(ctx).includes('ZA'))) },
      { key: 'jurisdictions', label: 'Covers', type: 'multiselect', default: [], optionsFn: jxOpts, help: 'Leave empty if it covers every jurisdiction.', listHidden: true },
      { key: 'version', label: 'Version', type: 'text' },
      { key: 'owner', label: 'Owner', type: 'text', listHidden: true },
      { key: 'approvedOn', label: 'Approved on', type: 'date' },
      { key: 'nextReview', label: 'Next review', type: 'date' },
      { key: 'location', label: 'Where to find it', type: 'text', listHidden: true, help: 'URL or document reference' },
    ],
  },
  trainings: {
    label: 'Training', singular: 'training record', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'heldOn', label: 'Held on', type: 'date', required: true },
      { key: 'audience', label: 'Audience', type: 'text', required: true },
      { key: 'completionPct', label: 'Completion (%)', type: 'number', default: 0 },
      { key: 'jurisdictions', label: 'Covers', type: 'multiselect', default: [], optionsFn: jxOpts, listHidden: true, help: 'Leave empty if it covers every jurisdiction.' },
      { key: 'evidence', label: 'Evidence', type: 'text', listHidden: true },
    ],
  },
  tasks: {
    label: 'Tasks', singular: 'task', titleKey: 'title',
    fields: [
      { key: 'title', label: 'Task', type: 'text', required: true },
      { key: 'owner', label: 'Owner', type: 'text' },
      { key: 'due', label: 'Due', type: 'date' },
      { key: 'status', label: 'Status', type: 'select', default: 'open', options: [{ value: 'open', label: 'Open' }, { value: 'in-progress', label: 'In progress' }, { value: 'done', label: 'Done' }] },
      { key: 'detail', label: 'Detail', type: 'textarea', listHidden: true },
      { key: 'gapKey', label: 'Linked gap', type: 'text', listHidden: true, visible: () => false },
    ],
  },
};

/** Profile fields for one jurisdiction, stored under workspace.jx[code]. */
export const jurisdictionFields = (code: JurisdictionCode) => PACKS[code].profileFields;
