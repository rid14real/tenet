// Domain model shared by the API and the web app.

export type JurisdictionCode = 'NG' | 'ZA' | 'KE' | 'GH' | 'EG' | 'ZW' | 'EU' | 'UK';

/** How far a rule has been checked. Every rule the platform applies carries one. */
export type Confidence = 'primary' | 'secondary' | 'unverified';

export interface Provenance {
  source: string;
  confidence: Confidence;
  note?: string;
}

/** In-house: an organisation runs its own programme. Advisory: a DPCO, DPO service or law firm runs clients' programmes. */
export type TenantMode = 'in-house' | 'advisory';

export interface OrgSettings {
  mode: TenantMode;
  name: string;
  createdAt: string;
}

export type SectorId =
  | 'bank' | 'fintech' | 'insurer' | 'telco' | 'multinational' | 'mfb' | 'mortgage'
  | 'hospital' | 'higher' | 'school' | 'mda' | 'ecommerce' | 'saas' | 'hospitality'
  | 'transport' | 'ngo' | 'other';

export type CanonicalBasis = 'consent' | 'contract' | 'legal-obligation' | 'vital-interests' | 'public-task' | 'legitimate-interests';
export type SpecialCondition =
  | 'explicit-consent' | 'employment-law' | 'vital-interests' | 'legal-claims' | 'substantial-public-interest'
  | 'health-care' | 'public-health' | 'research' | 'made-public' | 'not-for-profit';
export type RightType =
  | 'access' | 'rectification' | 'erasure' | 'restriction' | 'portability' | 'objection'
  | 'withdraw-consent' | 'automated-decision' | 'complaint';

/** A client (advisory mode) or an entity of the organisation (in-house mode). */
export interface Workspace {
  id: string;
  name: string;
  sector: SectorId;
  /** Where the entity is established. Drives representative and transfer rules. */
  establishment: string;
  /** Jurisdictions whose law applies (where data subjects are or where it is established). */
  jurisdictions: JurisdictionCode[];
  role: 'controller' | 'processor' | 'both';
  employees?: number;
  privacyLeadName?: string;
  privacyLeadEmail?: string;
  /** Jurisdiction-specific profile values, keyed by jurisdiction then field. Kept when a jurisdiction is deselected, but ignored. */
  jx: Partial<Record<JurisdictionCode, Record<string, unknown>>>;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  department?: string;
  owner?: string;
  /** Whether the organisation acts as controller or processor for this activity. */
  capacity: 'controller' | 'processor' | 'joint-controller';
  /** Jurisdictions whose data subjects are involved. */
  jurisdictions: JurisdictionCode[];
  lawfulBasis?: CanonicalBasis;
  basisJustification?: string;
  specialCondition?: SpecialCondition;
  dataSubjectTypes: string[];
  dataCategoryIds: string[];
  source: 'data-subject' | 'third-party' | 'public' | 'mixed';
  volume: number;
  systemIds: string[];
  vendorIds: string[];
  recipients?: string;
  retentionPeriod?: string;
  retentionTrigger?: string;
  disposalMethod?: string;
  automatedDecisions: boolean;
  largeScaleMonitoring: boolean;
  newTechnology: boolean;
  directMarketing: boolean;
  status: 'active' | 'planned' | 'retired';
  lastReviewed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface System {
  id: string;
  name: string;
  kind: 'application' | 'database' | 'saas' | 'file-store' | 'device' | 'paper';
  owner?: string;
  hostingCountry: string;
  vendorId?: string;
  /** Basis for holding data here when it is outside a jurisdiction and no vendor carries one. */
  transferMechanism?: TransferMechanism;
  encryptionAtRest: boolean;
  encryptionInTransit: boolean;
  mfa: boolean;
  accessLogging: boolean;
  backups: boolean;
  automatedDeletion: boolean;
  status: 'live' | 'planned' | 'decommissioned';
  createdAt: string;
  updatedAt: string;
}

export type TransferMechanism =
  | 'adequacy' | 'approved-instrument' | 'pending-approval' | 'binding-corporate-rules'
  | 'consent' | 'contract-necessity' | 'other-derogation' | 'none';

export interface Vendor {
  id: string;
  name: string;
  service: string;
  role: 'processor' | 'sub-processor' | 'joint-controller' | 'independent-controller';
  country: string;
  dpaSigned: boolean;
  dpaDate?: string;
  transferMechanism: TransferMechanism;
  certifications: string[];
  securityReviewDone: boolean;
  lastReviewed?: string;
  breachLast24m: boolean;
  subprocessorsDisclosed: boolean;
  aiProvider: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AssessmentKind = 'dpia' | 'lia' | 'tia' | 'aia';

export interface AssessmentRisk {
  id: string;
  title: string;
  description?: string;
  libraryId?: string;
  likelihood: number; // 1-5
  severity: number; // 1-5
  measures?: string;
  owner?: string;
  due?: string;
  residualLikelihood: number;
  residualSeverity: number;
}

export interface Assessment {
  id: string;
  kind: AssessmentKind;
  title: string;
  activityIds: string[];
  aiSystemId?: string;
  vendorId?: string;
  /** Free answers keyed by question id (screening booleans and narrative text). */
  answers: Record<string, string | boolean>;
  risks: AssessmentRisk[];
  dpoAdvice?: string;
  outcome?: 'proceed' | 'proceed-with-conditions' | 'do-not-proceed' | 'consult-regulator';
  conditions?: string;
  approver?: string;
  approvedOn?: string;
  status: 'draft' | 'in-review' | 'approved' | 'rejected';
  nextReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  awareAt: string;
  occurredAt?: string;
  description?: string;
  cause: 'misdirected' | 'lost-device' | 'cyber-attack' | 'insider' | 'system-error' | 'vendor' | 'other';
  affectedCount: number;
  dataCategoryIds: string[];
  jurisdictions: JurisdictionCode[];
  systemIds: string[];
  vendorId?: string;
  dataUnintelligible: boolean;
  likelihoodOfHarm: 'low' | 'medium' | 'high';
  severityOfHarm: 'low' | 'medium' | 'high';
  containment?: string;
  stage: 'triage' | 'contained' | 'assessed' | 'notified' | 'closed';
  /** Per jurisdiction: decision whether the regulator must be told, and the record of notification. */
  decisions?: Partial<Record<JurisdictionCode, { notify: boolean; rationale: string; at: string }>>;
  notifications?: Partial<Record<JurisdictionCode, { at: string; reference?: string }>>;
  subjectsNotifiedAt?: string;
  timeline?: { at: string; note: string }[];
  rootCause?: string;
  lessons?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataRequest {
  id: string;
  type: RightType;
  requester: string;
  contact?: string;
  subjectType?: string;
  receivedAt: string;
  channel: 'email' | 'web' | 'whatsapp' | 'sms' | 'in-person' | 'letter' | 'phone';
  jurisdiction: JurisdictionCode;
  identityVerified: boolean;
  verificationMethod?: string;
  stage: 'received' | 'verifying' | 'in-progress' | 'responded' | 'refused';
  extended: boolean;
  extensionReason?: string;
  refusalReason?: string;
  systemTasks?: Record<string, boolean>;
  respondedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AIDomain =
  | 'credit' | 'insurance-pricing' | 'employment' | 'education' | 'health' | 'biometric-id' | 'fraud-aml'
  | 'customer-service' | 'marketing' | 'public-services' | 'law-enforcement' | 'internal-productivity' | 'other';

export interface AISystem {
  id: string;
  name: string;
  purpose: string;
  sourcing: 'in-house' | 'vendor' | 'genai-api' | 'open-source';
  vendorId?: string;
  domain: AIDomain;
  decisionRole: 'solely-automated' | 'human-in-loop' | 'advisory' | 'none';
  significantEffect: boolean;
  personalData: boolean;
  sensitiveData: boolean;
  markets: JurisdictionCode[];
  interactsWithPublic: boolean;
  generatesContent: boolean;
  humanOversight?: string;
  impactAssessmentId?: string;
  lastValidated?: string;
  status: 'proposed' | 'pilot' | 'production' | 'retired';
  discovered: boolean;
  owner?: string;
  createdAt: string;
  updatedAt: string;
}

export type PolicyType =
  | 'privacy-notice' | 'data-protection-policy' | 'retention-schedule' | 'breach-response' | 'rights-procedure'
  | 'information-security' | 'ai-use' | 'paia-manual' | 'cookie-notice' | 'vendor-management' | 'cctv-notice';

export interface Policy {
  id: string;
  title: string;
  type: PolicyType;
  jurisdictions: JurisdictionCode[];
  version?: string;
  owner?: string;
  approvedOn?: string;
  nextReview?: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Training {
  id: string;
  title: string;
  heldOn: string;
  audience: string;
  completionPct: number;
  jurisdictions: JurisdictionCode[];
  evidence?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  detail?: string;
  gapKey?: string;
  owner?: string;
  due?: string;
  status: 'open' | 'in-progress' | 'done';
  createdAt: string;
  updatedAt: string;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor?: string;
  action: 'create' | 'update' | 'delete' | 'generate-pack' | 'attest' | 'notify' | 'export';
  collection: string;
  recordId?: string;
  summary: string;
}

export type CollectionName =
  | 'activities' | 'systems' | 'vendors' | 'assessments' | 'incidents' | 'requests'
  | 'aiSystems' | 'policies' | 'trainings' | 'tasks';

export const COLLECTIONS: CollectionName[] = ['activities', 'systems', 'vendors', 'assessments', 'incidents', 'requests', 'aiSystems', 'policies', 'trainings', 'tasks'];

/** Everything about one entity the rules need to evaluate. */
export interface Dataset {
  workspace: Workspace;
  activities: ProcessingActivity[];
  systems: System[];
  vendors: Vendor[];
  assessments: Assessment[];
  incidents: Incident[];
  requests: DataRequest[];
  aiSystems: AISystem[];
  policies: Policy[];
  trainings: Training[];
  tasks: Task[];
}
