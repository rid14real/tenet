// A sample entity for demos and onboarding: a Nigerian payments company with customers in Kenya,
// South Africa and the EU. It carries deliberate gaps, several of which differ by jurisdiction.

import type { Dataset } from './types.js';

export function sampleDataset(now: Date = new Date(), ids: () => string = () => crypto.randomUUID()): Dataset {
  const iso = now.toISOString();
  const ago = (h: number) => new Date(now.getTime() - h * 3_600_000).toISOString();
  const day = (d: number) => ago(d * 24).slice(0, 10);
  const t = { createdAt: iso, updatedAt: iso };
  const V = { core: ids(), sms: ids(), aml: ids(), llm: ids(), cloud: ids() };
  const S = { core: ids(), app: ids(), hr: ids(), chat: ids(), cctv: ids() };
  const A = { kyc: ids(), credit: ids(), mkt: ids(), remit: ids(), hr: ids(), cctv: ids(), support: ids() };
  const D = { kyc: ids(), credit: ids() };
  const AI = { credit: ids(), aml: ids(), chat: ids(), shadow: ids() };
  const cycle = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;

  return {
    workspace: {
      id: ids(), name: 'Baobab Pay Ltd (sample)', sector: 'fintech', establishment: 'NG', jurisdictions: ['NG', 'KE', 'ZA', 'EU'], role: 'controller', employees: 180,
      privacyLeadName: 'T. Bello', privacyLeadEmail: 'privacy@baobab.example',
      jx: {
        NG: { registrationNumber: 'SAMPLE-NG-0001', dataSubjects6m: 120000, cycleYear: cycle, dpcoName: 'Sample DPCO Ltd', dpoCredentialOnFile: true, dpoReportsFiled: false },
        KE: { turnoverBand: 'over-5m', certificateNumber: 'SAMPLE-KE-0001', certificateExpiry: day(-45) },
        ZA: { ioName: 'Chief Executive Officer' },
        EU: {},
      },
      sample: true, ...t,
    },
    vendors: [
      { id: V.core, name: 'CoreLedger Systems', service: 'Core banking platform', role: 'processor', country: 'NG', dpaSigned: true, dpaDate: day(400), transferMechanism: 'approved-instrument', certifications: ['ISO 27001'], securityReviewDone: true, lastReviewed: day(200), breachLast24m: false, subprocessorsDisclosed: true, aiProvider: false, ...t },
      { id: V.sms, name: 'BulkReach Messaging', service: 'SMS and WhatsApp messages', role: 'processor', country: 'NG', dpaSigned: false, transferMechanism: 'none', certifications: [], securityReviewDone: false, breachLast24m: true, subprocessorsDisclosed: false, aiProvider: false, ...t },
      { id: V.aml, name: 'Sentra AML', service: 'Transaction monitoring', role: 'processor', country: 'IE', dpaSigned: true, dpaDate: day(200), transferMechanism: 'pending-approval', certifications: ['ISO 27001', 'SOC 2'], securityReviewDone: true, lastReviewed: day(150), breachLast24m: false, subprocessorsDisclosed: true, aiProvider: true, ...t },
      { id: V.llm, name: 'Generic LLM API', service: 'Language model for the support assistant', role: 'processor', country: 'US', dpaSigned: true, dpaDate: day(90), transferMechanism: 'none', certifications: ['SOC 2'], securityReviewDone: false, breachLast24m: false, subprocessorsDisclosed: true, aiProvider: true, ...t },
      { id: V.cloud, name: 'Cloud hosting (Cape Town region)', service: 'Infrastructure hosting', role: 'sub-processor', country: 'ZA', dpaSigned: true, dpaDate: day(500), transferMechanism: 'approved-instrument', certifications: ['ISO 27001', 'SOC 2'], securityReviewDone: true, lastReviewed: day(100), breachLast24m: false, subprocessorsDisclosed: true, aiProvider: false, ...t },
    ],
    systems: [
      { id: S.core, name: 'Core banking', kind: 'application', owner: 'CTO', hostingCountry: 'NG', vendorId: V.core, encryptionAtRest: true, encryptionInTransit: true, mfa: true, accessLogging: true, backups: true, automatedDeletion: false, status: 'live', ...t },
      { id: S.app, name: 'Mobile app backend', kind: 'database', owner: 'CTO', hostingCountry: 'ZA', vendorId: V.cloud, encryptionAtRest: true, encryptionInTransit: true, mfa: true, accessLogging: true, backups: true, automatedDeletion: false, status: 'live', ...t },
      { id: S.hr, name: 'HR and payroll system', kind: 'saas', owner: 'Head of HR', hostingCountry: 'NG', encryptionAtRest: true, encryptionInTransit: true, mfa: false, accessLogging: false, backups: true, automatedDeletion: false, status: 'live', ...t },
      { id: S.chat, name: 'Support assistant', kind: 'saas', owner: 'Head of Customer Experience', hostingCountry: 'US', vendorId: V.llm, encryptionAtRest: true, encryptionInTransit: true, mfa: true, accessLogging: true, backups: false, automatedDeletion: false, status: 'live', ...t },
      { id: S.cctv, name: 'Office CCTV recorder', kind: 'device', owner: 'Facilities', hostingCountry: 'NG', encryptionAtRest: false, encryptionInTransit: false, mfa: false, accessLogging: false, backups: false, automatedDeletion: true, status: 'live', ...t },
    ],
    activities: [
      { id: A.kyc, name: 'Customer onboarding and KYC', purpose: 'Open accounts and verify identity, including a selfie face match, as required by financial regulation.', department: 'Operations', owner: 'Head of Operations', capacity: 'controller', jurisdictions: ['NG', 'KE', 'ZA'], lawfulBasis: 'legal-obligation', basisJustification: 'KYC rules of the CBN, CBK and FIC Act.', specialCondition: 'substantial-public-interest', dataSubjectTypes: ['customers'], dataCategoryIds: ['name', 'contact', 'gov-id', 'dob', 'images', 'biometric'], source: 'data-subject', volume: 120000, systemIds: [S.core, S.app], vendorIds: [], recipients: 'Identity verification bureaus', retentionPeriod: '5 years', retentionTrigger: 'account closure', disposalMethod: 'Secure deletion', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: true, directMarketing: false, status: 'active', lastReviewed: day(60), ...t },
      { id: A.credit, name: 'Loan credit scoring', purpose: 'Decide instant loan applications in the app.', department: 'Credit', owner: 'Head of Credit', capacity: 'controller', jurisdictions: ['NG', 'KE'], lawfulBasis: 'contract', dataSubjectTypes: ['customers', 'loan applicants'], dataCategoryIds: ['income', 'transactions', 'credit', 'device', 'marital-family'], source: 'mixed', volume: 45000, systemIds: [S.core, S.app], vendorIds: [], retentionPeriod: '6 years', retentionTrigger: 'loan closure', automatedDecisions: true, largeScaleMonitoring: false, newTechnology: true, directMarketing: false, status: 'active', ...t },
      { id: A.mkt, name: 'Marketing messages', purpose: 'Send product offers by SMS and WhatsApp.', department: 'Marketing', capacity: 'controller', jurisdictions: ['NG', 'KE', 'ZA'], lawfulBasis: 'legitimate-interests', dataSubjectTypes: ['customers'], dataCategoryIds: ['name', 'contact', 'behaviour'], source: 'data-subject', volume: 90000, systemIds: [S.app], vendorIds: [V.sms], automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, directMarketing: true, status: 'active', ...t },
      { id: A.remit, name: 'Remittances from Europe', purpose: 'Receive transfers sent by customers living in the EU.', department: 'Payments', owner: 'Head of Payments', capacity: 'controller', jurisdictions: ['NG', 'EU'], lawfulBasis: 'contract', dataSubjectTypes: ['customers', 'senders'], dataCategoryIds: ['name', 'contact', 'financial', 'transactions'], source: 'data-subject', volume: 8000, systemIds: [S.core], vendorIds: [V.aml], retentionPeriod: '5 years', retentionTrigger: 'last transaction', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, directMarketing: false, status: 'active', ...t },
      { id: A.support, name: 'Customer support', purpose: 'Answer customer questions by chat, WhatsApp and email.', department: 'Customer Experience', owner: 'Head of Customer Experience', capacity: 'controller', jurisdictions: ['NG', 'ZA', 'EU'], lawfulBasis: 'contract', dataSubjectTypes: ['customers'], dataCategoryIds: ['name', 'contact', 'transactions'], source: 'data-subject', volume: 60000, systemIds: [S.chat, S.core], vendorIds: [], retentionPeriod: '2 years', retentionTrigger: 'case closure', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: true, directMarketing: false, status: 'active', ...t },
      { id: A.hr, name: 'Payroll and HR', purpose: 'Pay staff and meet employment obligations.', department: 'HR', owner: 'Head of HR', capacity: 'controller', jurisdictions: ['NG'], lawfulBasis: 'contract', specialCondition: 'employment-law', dataSubjectTypes: ['staff'], dataCategoryIds: ['name', 'contact', 'gov-id', 'income', 'financial', 'health', 'employment'], source: 'data-subject', volume: 180, systemIds: [S.hr], vendorIds: [], retentionPeriod: '6 years', retentionTrigger: 'end of employment', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, directMarketing: false, status: 'active', ...t },
      { id: A.cctv, name: 'Office CCTV', purpose: 'Security of staff, visitors and premises.', department: 'Facilities', owner: 'Facilities Manager', capacity: 'controller', jurisdictions: ['NG'], lawfulBasis: 'legitimate-interests', dataSubjectTypes: ['staff', 'visitors'], dataCategoryIds: ['images'], source: 'data-subject', volume: 600, systemIds: [S.cctv], vendorIds: [], retentionPeriod: '30 days', disposalMethod: 'Automatic overwrite', automatedDecisions: false, largeScaleMonitoring: true, newTechnology: false, directMarketing: false, status: 'active', ...t },
    ],
    assessments: [
      { id: D.kyc, kind: 'dpia', title: 'DPIA: customer onboarding and face match', activityIds: [A.kyc], answers: { context: 'Identity checks are required by law; the face match reduces impersonation fraud.', expectations: 'Customers are told in the app before the selfie step.', 'n-basis': 'KYC is a legal obligation in each market.', 'n-minimise': 'Face templates are deleted after the match; only the result is kept.', 'n-retention': 'Five years after closure, as financial regulation requires.', 'n-accuracy': 'Customers can update details in the app.', 'n-rights': 'Requests through the in-app help centre.', 'n-processors': 'Hosting under a signed agreement with ISO 27001 controls.' },
        risks: [{ id: ids(), libraryId: 'r-sensitive-disclosure', title: 'Disclosure of sensitive data', description: 'Exposure of biometric templates.', likelihood: 2, severity: 5, measures: 'Templates deleted after match; encryption; restricted access.', owner: 'CTO', residualLikelihood: 1, residualSeverity: 4 }],
        dpoAdvice: 'Proceed; confirm template deletion in quarterly audit.', outcome: 'proceed', approver: 'T. Bello', approvedOn: day(120), status: 'approved', nextReview: day(-245), ...t },
      { id: D.credit, kind: 'aia', title: 'AI impact: loan credit scoring', activityIds: [A.credit], aiSystemId: AI.credit, answers: { context: 'The model decides loans under ₦500,000 without manual review.' },
        risks: [{ id: ids(), libraryId: 'r-auto-unfair', title: 'Unfair or wrong automated decision', description: 'Applicants refused because of inaccurate scoring.', likelihood: 3, severity: 4, measures: '', owner: 'Head of Credit', residualLikelihood: 3, residualSeverity: 4 }],
        status: 'draft', ...t },
    ],
    incidents: [
      { id: ids(), title: 'Statements emailed to the wrong recipients', awareAt: ago(31.25), occurredAt: ago(40), cause: 'misdirected', description: 'A template mapping error sent account statements to the wrong customers.', affectedCount: 1240, dataCategoryIds: ['name', 'financial', 'transactions'], jurisdictions: ['NG', 'KE'], systemIds: [S.core], dataUnintelligible: false, likelihoodOfHarm: 'medium', severityOfHarm: 'medium', containment: 'Sending stopped; recipients asked to delete; mapping fixed.', stage: 'contained', decisions: {}, notifications: {}, timeline: [{ at: ago(31.25), note: 'Customer reported receiving another person’s statement.' }, { at: ago(30), note: 'Sending suspended.' }], ...t },
    ],
    requests: [
      { id: ids(), type: 'access', requester: 'A. Customer', subjectType: 'customers', receivedAt: ago(12 * 24), channel: 'whatsapp', jurisdiction: 'NG', identityVerified: true, verificationMethod: 'Matched BVN and phone number', stage: 'in-progress', extended: false, systemTasks: {}, ...t },
      { id: ids(), type: 'automated-decision', requester: 'B. Applicant', subjectType: 'loan applicants', receivedAt: ago(10 * 24), channel: 'email', jurisdiction: 'KE', identityVerified: true, stage: 'in-progress', extended: false, notes: 'Loan declined by the scoring model; asks for a human review.', systemTasks: {}, ...t },
      { id: ids(), type: 'portability', requester: 'C. Customer', subjectType: 'customers', receivedAt: ago(3 * 24), channel: 'web', jurisdiction: 'ZA', identityVerified: false, stage: 'received', extended: false, systemTasks: {}, ...t },
    ],
    aiSystems: [
      { id: AI.credit, name: 'Loan credit-scoring model', purpose: 'Scores loan applications; loans under ₦500,000 are decided without manual review.', sourcing: 'in-house', domain: 'credit', decisionRole: 'solely-automated', significantEffect: true, personalData: true, sensitiveData: false, markets: ['NG', 'KE'], interactsWithPublic: false, generatesContent: false, humanOversight: '', impactAssessmentId: D.credit, status: 'production', discovered: false, owner: 'Head of Credit', ...t },
      { id: AI.aml, name: 'AML transaction monitoring', purpose: 'Flags suspicious transfers for the compliance team.', sourcing: 'vendor', vendorId: V.aml, domain: 'fraud-aml', decisionRole: 'human-in-loop', significantEffect: true, personalData: true, sensitiveData: false, markets: ['NG', 'EU'], interactsWithPublic: false, generatesContent: false, humanOversight: 'Analysts review and clear every alert before action.', status: 'production', discovered: false, owner: 'Chief Compliance Officer', ...t },
      { id: AI.chat, name: 'Customer support assistant', purpose: 'Answers account questions on WhatsApp and web chat.', sourcing: 'genai-api', vendorId: V.llm, domain: 'customer-service', decisionRole: 'none', significantEffect: false, personalData: true, sensitiveData: false, markets: ['NG', 'ZA', 'EU'], interactsWithPublic: true, generatesContent: true, humanOversight: 'Hands over to an agent on request.', status: 'pilot', discovered: false, owner: 'Head of Customer Experience', ...t },
      { id: AI.shadow, name: 'Public chatbots used by staff', purpose: 'Staff appear to paste customer data into public AI tools.', sourcing: 'genai-api', domain: 'internal-productivity', decisionRole: 'none', significantEffect: false, personalData: true, sensitiveData: false, markets: ['NG'], interactsWithPublic: false, generatesContent: true, humanOversight: '', status: 'production', discovered: true, ...t },
    ],
    policies: [
      { id: ids(), title: 'Customer privacy notice', type: 'privacy-notice', jurisdictions: [], version: '3.1', owner: 'T. Bello', approvedOn: day(90), nextReview: day(-275), location: 'baobab.example/privacy', ...t },
      { id: ids(), title: 'Information security policy', type: 'information-security', jurisdictions: [], version: '2.0', owner: 'CTO', approvedOn: day(420), nextReview: day(55), ...t },
      { id: ids(), title: 'Breach response plan', type: 'breach-response', jurisdictions: ['NG'], version: '1.2', owner: 'T. Bello', approvedOn: day(200), nextReview: day(-165), ...t },
    ],
    trainings: [
      { id: ids(), title: 'Annual data protection training', heldOn: day(240), audience: 'All staff', completionPct: 72, jurisdictions: [], evidence: 'LMS completion report', ...t },
    ],
    tasks: [
      { id: ids(), title: 'Get NDPC approval for the Sentra AML transfer clauses', owner: 'T. Bello', due: day(-30), status: 'in-progress', gapKey: 'transfers', ...t },
    ],
  };
}
