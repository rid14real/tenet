// A sample client used for demos and onboarding. Every record is marked as sample data.

import type { Dataset } from './types.js';

export function sampleDataset(now: Date = new Date(), ids: () => string = () => crypto.randomUUID()): Dataset {
  const iso = now.toISOString();
  const ago = (hours: number) => new Date(now.getTime() - hours * 3_600_000).toISOString();
  const daysAgo = (d: number) => ago(d * 24);
  const t = { createdAt: iso, updatedAt: iso };
  const v = { core: ids(), sms: ids(), aml: ids(), llm: ids(), cloud: ids() };
  const a = { onboarding: ids(), scoring: ids(), marketing: ids(), cctv: ids(), payroll: ids() };
  const dScoring = ids(); const dOnboarding = ids();
  const ai = { scoring: ids(), aml: ids(), chat: ids(), shadow: ids() };

  return {
    workspace: {
      id: ids(), name: 'Kestrel Microfinance Bank (sample)', sector: 'mfb', dataSubjects6m: 12400, jurisdictions: ['NG', 'KE'],
      dpoName: 'T. Bello', dpoEmail: 'dpo@kestrel.example', dpoCredentialOnFile: true, registrationNumber: 'SAMPLE-0000',
      cycleYear: now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1,
      attestations: { dpoReports: { value: true, by: 'T. Bello', at: daysAgo(40), note: 'H1 report filed' }, privacyNotice: { value: true, by: 'T. Bello', at: daysAgo(60) } },
      sample: true, ...t,
    },
    vendors: [
      { id: v.core, name: 'CoreLedger Systems', service: 'Core banking platform', role: 'processor', country: 'NG', dpaSigned: true, dpaDate: daysAgo(400).slice(0, 10), transferMechanism: 'not-needed', aiProvider: false, securityReviewDone: true, ...t },
      { id: v.sms, name: 'BulkReach Messaging', service: 'SMS and WhatsApp notifications', role: 'processor', country: 'NG', dpaSigned: false, transferMechanism: 'not-needed', aiProvider: false, securityReviewDone: false, ...t },
      { id: v.aml, name: 'Sentra AML', service: 'Transaction monitoring', role: 'processor', country: 'IE', dpaSigned: true, dpaDate: daysAgo(200).slice(0, 10), transferMechanism: 'pending-approval', aiProvider: true, securityReviewDone: true, ...t },
      { id: v.llm, name: 'Generic LLM API', service: 'Language model for support assistant', role: 'processor', country: 'US', dpaSigned: true, dpaDate: daysAgo(90).slice(0, 10), transferMechanism: 'none', aiProvider: true, securityReviewDone: false, ...t },
      { id: v.cloud, name: 'Lagos Colo Hosting', service: 'Data centre hosting', role: 'sub-processor', country: 'NG', dpaSigned: true, dpaDate: daysAgo(500).slice(0, 10), transferMechanism: 'not-needed', aiProvider: false, securityReviewDone: true, ...t },
    ],
    activities: [
      { id: a.onboarding, name: 'Customer onboarding and KYC', purpose: 'Open accounts and verify identity as required by CBN KYC rules', lawfulBasis: 'legal-obligation', dataSubjectTypes: ['customers'], dataCategories: ['name', 'BVN', 'NIN', 'address', 'photo'], sensitive: true, children: false, volume: 12400, vendorIds: [v.core], retention: '5 years after account closure', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, crossBorder: false, owner: 'Head of Operations', status: 'active', ...t },
      { id: a.scoring, name: 'Loan credit scoring', purpose: 'Decide loan applications from the mobile app', lawfulBasis: 'contract', dataSubjectTypes: ['loan applicants'], dataCategories: ['income', 'transaction history', 'device data'], sensitive: false, children: false, volume: 8300, vendorIds: [v.core], retention: '6 years after loan closure', automatedDecisions: true, largeScaleMonitoring: false, newTechnology: true, crossBorder: false, owner: 'Head of Credit', status: 'active', ...t },
      { id: a.marketing, name: 'Marketing messages', purpose: 'Send product offers by SMS and WhatsApp', lawfulBasis: undefined, dataSubjectTypes: ['customers'], dataCategories: ['name', 'phone number'], sensitive: false, children: false, volume: 9000, vendorIds: [v.sms], retention: undefined, automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, crossBorder: false, owner: 'Marketing', status: 'active', ...t },
      { id: a.cctv, name: 'Branch CCTV', purpose: 'Security of branches and staff', lawfulBasis: 'legitimate-interests', dataSubjectTypes: ['customers', 'staff', 'visitors'], dataCategories: ['images'], sensitive: false, children: false, volume: 3000, vendorIds: [], retention: '30 days', automatedDecisions: false, largeScaleMonitoring: true, newTechnology: false, crossBorder: false, owner: 'Facilities', status: 'active', ...t },
      { id: a.payroll, name: 'Payroll and HR', purpose: 'Pay staff and meet employment obligations', lawfulBasis: 'contract', dataSubjectTypes: ['staff'], dataCategories: ['salary', 'bank details', 'health (sick leave)'], sensitive: true, children: false, volume: 140, vendorIds: [], retention: '6 years after employment ends', automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, crossBorder: false, owner: 'HR', status: 'active', ...t },
    ],
    assessments: [
      { id: dOnboarding, activityId: a.onboarding, title: 'DPIA: customer onboarding and KYC', kind: 'dpia', answers: { 'q-sensitive': true, 'q-scale': true }, mitigations: 'Encryption at rest, access logging, BVN masking in reports.', residualRisk: 'low', status: 'approved', approvedBy: 'T. Bello', approvedOn: daysAgo(120).slice(0, 10), nextReview: daysAgo(-245).slice(0, 10), ...t },
      { id: dScoring, activityId: a.scoring, aiSystemId: ai.scoring, title: 'DPIA and AI impact: loan credit scoring', kind: 'dpia', answers: { 'q-automated': true, 'q-profiling': true, 'q-newtech': true, 'q-denial': true }, mitigations: 'Human review route for declined applicants being designed.', residualRisk: 'medium', status: 'in-review', ...t },
    ],
    incidents: [
      { id: ids(), title: 'Statements emailed to the wrong recipients', awareAt: ago(31.25), description: 'A template mapping error sent account statements to the wrong customers.', affectedCount: 1240, dataCategories: ['name', 'account number', 'transactions'], jurisdictions: ['NG'], highRiskToSubjects: true, status: 'contained', notified: {}, notRequired: {}, ...t },
    ],
    requests: [
      { id: ids(), type: 'access', requester: 'A. Customer', receivedAt: daysAgo(12), channel: 'whatsapp', jurisdiction: 'NG', identityVerified: true, status: 'in-progress', ...t },
      { id: ids(), type: 'automated-decision-review', requester: 'B. Applicant', receivedAt: daysAgo(34), channel: 'email', jurisdiction: 'NG', identityVerified: true, status: 'in-progress', notes: 'Loan declined by scoring model; asks for human review.', ...t },
      { id: ids(), type: 'erasure', requester: 'C. Former customer', receivedAt: daysAgo(50), channel: 'web', jurisdiction: 'NG', identityVerified: true, status: 'completed', completedAt: daysAgo(30), ...t },
    ],
    aiSystems: [
      { id: ai.scoring, name: 'Loan credit-scoring model', purpose: 'Scores loan applications; applications under ₦500,000 are decided without manual review.', sourcing: 'in-house', domain: 'credit', decisionRole: 'solely-automated', significantEffect: true, personalData: true, sensitiveData: false, markets: ['NG'], interactsWithPublic: false, generatesContent: false, humanOversight: '', impactAssessmentId: dScoring, status: 'production', discovered: false, owner: 'Head of Credit', ...t },
      { id: ai.aml, name: 'AML transaction monitoring', purpose: 'Flags suspicious transfers for the compliance team.', sourcing: 'vendor', vendorId: v.aml, domain: 'fraud-aml', decisionRole: 'human-in-loop', significantEffect: true, personalData: true, sensitiveData: false, markets: ['NG', 'KE'], interactsWithPublic: false, generatesContent: false, humanOversight: 'Analysts review and clear every alert before action.', status: 'production', discovered: false, owner: 'Chief Compliance Officer', ...t },
      { id: ai.chat, name: 'Customer support assistant', purpose: 'Answers account questions on WhatsApp and web chat.', sourcing: 'genai-api', vendorId: v.llm, domain: 'customer-service', decisionRole: 'none', significantEffect: false, personalData: true, sensitiveData: false, markets: ['NG'], interactsWithPublic: true, generatesContent: true, humanOversight: 'Hands over to an agent on request.', status: 'pilot', discovered: false, owner: 'Head of Customer Experience', ...t },
      { id: ai.shadow, name: 'Public chatbots used by staff', purpose: 'Staff appear to paste customer data into public AI tools.', sourcing: 'genai-api', domain: 'internal-productivity', decisionRole: 'none', significantEffect: false, personalData: true, sensitiveData: false, markets: ['NG'], interactsWithPublic: false, generatesContent: true, humanOversight: '', status: 'production', discovered: true, ...t },
    ],
  };
}
