// Domain model shared by the API and the web app.

export type JurisdictionCode = 'NG' | 'KE' | 'ZA' | 'GH' | 'EG' | 'ZW' | 'EU' | 'UK';
export type Tier = 'UHL' | 'EHL' | 'OHL';

/** How far a rule has been checked. Every rule the platform applies carries one. */
export type Confidence = 'primary' | 'secondary' | 'unverified';

export interface Provenance {
  /** Where the rule comes from, e.g. "NDPA 2023 s.40(1)". */
  source: string;
  confidence: Confidence;
  note?: string;
}

export type SectorId =
  | 'bank' | 'fintech' | 'insurer' | 'telco' | 'multinational'
  | 'mfb' | 'mortgage' | 'hospital' | 'higher' | 'mda'
  | 'other';

export interface Attestation {
  value: boolean;
  note?: string;
  by?: string;
  at?: string;
}

export type AttestationKey = 'dpoReports' | 'privacyNotice' | 'securityMeasures' | 'training';

export interface Workspace {
  id: string;
  name: string;
  sector: SectorId;
  /** Data subjects processed in the last six months. */
  dataSubjects6m: number;
  jurisdictions: JurisdictionCode[];
  dpoName?: string;
  dpoEmail?: string;
  dpoCredentialOnFile?: boolean;
  registrationNumber?: string;
  cycleYear: number;
  attestations?: Partial<Record<AttestationKey, Attestation>>;
  sample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LawfulBasis =
  | 'consent' | 'contract' | 'legal-obligation' | 'vital-interests'
  | 'public-interest' | 'legitimate-interests';

export interface ProcessingActivity {
  id: string;
  name: string;
  purpose: string;
  lawfulBasis?: LawfulBasis;
  lawfulBasisNote?: string;
  dataSubjectTypes: string[];
  dataCategories: string[];
  sensitive: boolean;
  children: boolean;
  volume: number;
  systems?: string;
  vendorIds: string[];
  retention?: string;
  automatedDecisions: boolean;
  largeScaleMonitoring: boolean;
  newTechnology: boolean;
  crossBorder: boolean;
  owner?: string;
  status: 'active' | 'retired';
  createdAt: string;
  updatedAt: string;
}

export type VendorRole = 'processor' | 'sub-processor' | 'joint-controller' | 'independent-controller';
export type TransferMechanism =
  | 'not-needed' | 'adequacy' | 'approved-instrument' | 'pending-approval'
  | 'consent' | 'contract-necessity' | 'other' | 'none';

export interface Vendor {
  id: string;
  name: string;
  service: string;
  role: VendorRole;
  /** ISO 3166 alpha-2 country where the vendor processes the data. */
  country: string;
  dpaSigned: boolean;
  dpaDate?: string;
  transferMechanism: TransferMechanism;
  aiProvider: boolean;
  securityReviewDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export type RiskLevel = 'low' | 'medium' | 'high';

export interface Assessment {
  id: string;
  activityId?: string;
  aiSystemId?: string;
  title: string;
  kind: 'dpia' | 'ai-impact' | 'lia' | 'tia';
  answers: Record<string, boolean>;
  mitigations?: string;
  residualRisk?: RiskLevel;
  status: 'draft' | 'in-review' | 'approved';
  approvedBy?: string;
  approvedOn?: string;
  nextReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Incident {
  id: string;
  title: string;
  /** When the organisation became aware. Regulator clocks start here. */
  awareAt: string;
  description?: string;
  affectedCount: number;
  dataCategories: string[];
  jurisdictions: JurisdictionCode[];
  highRiskToSubjects: boolean;
  status: 'open' | 'contained' | 'closed';
  /** Regulator notifications made, by jurisdiction, as ISO timestamps. */
  notified?: Partial<Record<JurisdictionCode, string>>;
  /** Jurisdictions where the team decided notification is not required, with reason. */
  notRequired?: Partial<Record<JurisdictionCode, string>>;
  subjectsNotifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type RequestType =
  | 'access' | 'rectification' | 'erasure' | 'portability' | 'objection'
  | 'withdraw-consent' | 'automated-decision-review' | 'complaint';

export interface DataRequest {
  id: string;
  type: RequestType;
  requester: string;
  receivedAt: string;
  channel: 'email' | 'web' | 'whatsapp' | 'sms' | 'in-person' | 'letter';
  jurisdiction: JurisdictionCode;
  identityVerified: boolean;
  status: 'received' | 'verifying' | 'in-progress' | 'completed' | 'refused';
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AIDomain =
  | 'credit' | 'insurance-pricing' | 'employment' | 'education' | 'health'
  | 'biometric-id' | 'fraud-aml' | 'customer-service' | 'marketing'
  | 'public-services' | 'law-enforcement' | 'internal-productivity' | 'other';

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

export interface AuditEntry {
  id: string;
  at: string;
  actor?: string;
  action: 'create' | 'update' | 'delete' | 'generate-pack' | 'attest' | 'notify';
  collection: string;
  recordId?: string;
  summary: string;
}

/** Everything about one client the rules need to evaluate. */
export interface Dataset {
  workspace: Workspace;
  activities: ProcessingActivity[];
  vendors: Vendor[];
  assessments: Assessment[];
  incidents: Incident[];
  requests: DataRequest[];
  aiSystems: AISystem[];
}

export type CollectionName = 'activities' | 'vendors' | 'assessments' | 'incidents' | 'requests' | 'aiSystems';

export const COLLECTIONS: CollectionName[] = ['activities', 'vendors', 'assessments', 'incidents', 'requests', 'aiSystems'];
