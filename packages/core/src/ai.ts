// AI system classification: which obligations apply, under which regime, and why.

import { sectorById } from './rules.js';
import type { AIDomain, AISystem, Assessment, Provenance, SectorId, Vendor } from './types.js';

export type AIRisk = 'high' | 'limited' | 'minimal' | 'unassessed';

export interface AIObligation {
  id: string;
  framework: 'NDPA/GAID' | 'CBN' | 'Kenya DPA' | 'POPIA' | 'EU AI Act' | 'ISO/IEC 42001' | 'NIST AI RMF';
  ref: string;
  requirement: string;
  why: string;
  binding: boolean;
  provenance: Provenance;
  /** Whether the record already shows this is handled. */
  status: 'met' | 'open' | 'info';
}

export interface AIClassification {
  risk: AIRisk;
  reasons: string[];
  obligations: AIObligation[];
}

export const AI_DOMAINS: { id: AIDomain; label: string; euAnnexIII?: string }[] = [
  { id: 'credit', label: 'Credit scoring and lending', euAnnexIII: 'Annex III point 5(b)' },
  { id: 'insurance-pricing', label: 'Life or health insurance pricing', euAnnexIII: 'Annex III point 5(c)' },
  { id: 'employment', label: 'Recruitment, HR and worker management', euAnnexIII: 'Annex III point 4' },
  { id: 'education', label: 'Education and exams', euAnnexIII: 'Annex III point 3' },
  { id: 'health', label: 'Health and clinical support' },
  { id: 'biometric-id', label: 'Biometric identification', euAnnexIII: 'Annex III point 1' },
  { id: 'fraud-aml', label: 'Fraud and AML monitoring' },
  { id: 'customer-service', label: 'Customer service and chat' },
  { id: 'marketing', label: 'Marketing and personalisation' },
  { id: 'public-services', label: 'Access to public services or benefits', euAnnexIII: 'Annex III point 5(a)' },
  { id: 'law-enforcement', label: 'Law enforcement', euAnnexIII: 'Annex III point 6' },
  { id: 'internal-productivity', label: 'Internal productivity tools' },
  { id: 'other', label: 'Other' },
];

const P = (source: string, confidence: Provenance['confidence'], note?: string): Provenance => ({ source, confidence, note });

export function classifyAI(sys: AISystem, ctx: { sector: SectorId; vendors: Vendor[]; assessments: Assessment[] }): AIClassification {
  const ob: AIObligation[] = [];
  const reasons: string[] = [];
  const domain = AI_DOMAINS.find((d) => d.id === sys.domain);
  const vendor = sys.vendorId ? ctx.vendors.find((v) => v.id === sys.vendorId) : undefined;
  const ia = sys.impactAssessmentId ? ctx.assessments.find((a) => a.id === sys.impactAssessmentId) : undefined;
  const iaApproved = ia?.status === 'approved';
  const solelyAutomatedSignificant = sys.decisionRole === 'solely-automated' && sys.significantEffect;
  const financial = sectorById(ctx.sector).financial;

  if (sys.personalData && solelyAutomatedSignificant) {
    reasons.push('Makes significant decisions about people without human review');
    ob.push({
      id: 'ndpa-37', framework: 'NDPA/GAID', ref: 'NDPA s.37',
      requirement: 'Give people a way to obtain human intervention, express their view and contest the decision.',
      why: 'Solely automated decision with significant effect on individuals.', binding: true,
      provenance: P('NDPA 2023 s.37', 'primary'),
      status: sys.humanOversight && /review|appeal|contest|human/i.test(sys.humanOversight) ? 'met' : 'open',
    });
  }
  if (sys.personalData) {
    ob.push({
      id: 'gaid-43', framework: 'NDPA/GAID', ref: 'GAID Arts. 43–44',
      requirement: 'Document the technical and organisational parameters of the system for the audit return.',
      why: 'Emerging technology processing personal data.', binding: true,
      provenance: P('GAID 2025 Arts. 43–44', 'secondary'),
      status: sys.humanOversight && sys.purpose ? 'met' : 'open',
    });
  }
  if (sys.personalData && (sys.significantEffect || sys.sensitiveData || sys.domain === 'biometric-id')) {
    ob.push({
      id: 'ndpa-28', framework: 'NDPA/GAID', ref: 'NDPA s.28 · GAID Art. 28',
      requirement: 'Carry out an impact assessment that covers disparate impact on groups of people.',
      why: sys.sensitiveData ? 'Uses sensitive personal data.' : 'Significant effects on individuals.', binding: true,
      provenance: P('NDPA 2023 s.28; GAID 2025 Arts. 28, 44', 'secondary'),
      status: iaApproved ? 'met' : 'open',
    });
  }
  const offshore = sys.sourcing === 'genai-api' || (vendor && vendor.country !== 'NG');
  if (sys.personalData && offshore) {
    const mech = vendor?.transferMechanism;
    ob.push({
      id: 'ndpa-41', framework: 'NDPA/GAID', ref: 'NDPA ss.41–43',
      requirement: 'Record a lawful transfer basis for personal data sent to the provider outside Nigeria.',
      why: vendor ? `Provider processes in ${vendor.country}.` : 'Prompts go to an offshore model API.', binding: true,
      provenance: P('NDPA 2023 ss.41–43', 'primary'),
      status: mech && !['none', 'pending-approval'].includes(mech) ? 'met' : 'open',
    });
  }
  if (sys.domain === 'fraud-aml' && financial) {
    reasons.push('AML or fraud model at a financial institution');
    ob.push({
      id: 'cbn-aml', framework: 'CBN', ref: 'CBN circular, March 2026',
      requirement: 'Validate the model and keep its decisions explainable; 18 months for deposit money banks, 24 for other institutions.',
      why: 'Automated AML or fraud system at a CBN-regulated institution.', binding: true,
      provenance: P('CBN circular on automated AML systems, March 2026 (press reports)', 'secondary', 'Confirm the circular reference and the window that applies to this institution.'),
      status: sys.lastValidated ? 'met' : 'open',
    });
  }
  if (sys.markets.includes('KE') && sys.personalData && solelyAutomatedSignificant) {
    ob.push({
      id: 'ke-35', framework: 'Kenya DPA', ref: 'Kenya DPA s.35',
      requirement: 'Respect the right not to be subject to solely automated decisions; notify and allow reconsideration.',
      why: 'Deployed to Kenyan data subjects.', binding: true, provenance: P('Kenya DPA 2019 s.35', 'primary'),
      status: sys.humanOversight ? 'met' : 'open',
    });
  }
  if (sys.markets.includes('ZA') && sys.personalData && solelyAutomatedSignificant) {
    ob.push({
      id: 'za-71', framework: 'POPIA', ref: 'POPIA s.71',
      requirement: 'Allow representations about automated decisions and give enough information about the logic.',
      why: 'Deployed to South African data subjects.', binding: true, provenance: P('POPIA s.71', 'primary'),
      status: sys.humanOversight ? 'met' : 'open',
    });
  }
  if (sys.markets.includes('EU')) {
    if (domain?.euAnnexIII) {
      reasons.push(`EU AI Act high-risk use (${domain.euAnnexIII})`);
      ob.push({
        id: 'eu-high', framework: 'EU AI Act', ref: `${domain.euAnnexIII}; Arts. 9, 14, 26`,
        requirement: 'High-risk duties: risk management, logging, human oversight and deployer obligations. Annex III duties apply from 2 December 2027.',
        why: 'Placed on the EU market in an Annex III use.', binding: true,
        provenance: P('EU AI Act as amended by the 2026 omnibus', 'secondary', 'Dates as reported after the 2026 omnibus; confirm against the Official Journal.'),
        status: iaApproved ? 'met' : 'open',
      });
    }
    if (sys.interactsWithPublic || sys.generatesContent) {
      ob.push({
        id: 'eu-50', framework: 'EU AI Act', ref: 'Art. 50',
        requirement: 'Tell people they are dealing with AI and mark generated content.',
        why: 'Interacts with people or generates content in the EU.', binding: true,
        provenance: P('EU AI Act Art. 50', 'secondary'), status: 'open',
      });
    }
    ob.push({
      id: 'eu-4', framework: 'EU AI Act', ref: 'Art. 4',
      requirement: 'Ensure staff using the system have sufficient AI literacy.', why: 'Any deployment in the EU.', binding: true,
      provenance: P('EU AI Act Art. 4', 'primary'), status: 'open',
    });
  }
  if (sys.status !== 'retired') {
    ob.push({
      id: 'iso-614', framework: 'ISO/IEC 42001', ref: 'Clause 6.1.4',
      requirement: 'AI system impact assessment kept as evidence for certification.', why: 'Voluntary; expected by enterprise buyers.', binding: false,
      provenance: P('ISO/IEC 42001:2023 clause 6.1.4', 'primary'), status: iaApproved ? 'met' : 'info',
    });
    if (vendor || sys.sourcing === 'genai-api') {
      ob.push({
        id: 'iso-a10', framework: 'ISO/IEC 42001', ref: 'Annex A.10',
        requirement: 'Assess and manage the AI supplier.', why: 'Third-party model or service.', binding: false,
        provenance: P('ISO/IEC 42001:2023 Annex A.10', 'primary'), status: vendor?.securityReviewDone ? 'met' : 'info',
      });
    }
    ob.push({
      id: 'nist-measure', framework: 'NIST AI RMF', ref: 'Measure',
      requirement: 'Test for bias, robustness and performance across the groups the system affects.', why: 'Voluntary framework.', binding: false,
      provenance: P('NIST AI RMF 1.0', 'primary'), status: sys.lastValidated ? 'met' : 'info',
    });
  }
  if (sys.discovered) {
    reasons.push('Found by discovery, not declared by a team');
    ob.push({
      id: 'iso-a2', framework: 'ISO/IEC 42001', ref: 'Annex A.2',
      requirement: 'Bring the tool under an approved AI use policy or block it.', why: 'Unapproved use discovered.', binding: false,
      provenance: P('ISO/IEC 42001:2023 Annex A.2', 'primary'), status: 'open',
    });
  }

  let risk: AIRisk;
  if (sys.discovered && !sys.humanOversight) risk = 'unassessed';
  else if (solelyAutomatedSignificant || (sys.markets.includes('EU') && domain?.euAnnexIII) || (sys.domain === 'fraud-aml' && financial) || sys.domain === 'biometric-id') risk = 'high';
  else if (sys.interactsWithPublic || sys.generatesContent || sys.significantEffect) risk = 'limited';
  else risk = 'minimal';
  if (risk === 'limited' && reasons.length === 0) reasons.push('Interacts with the public or generates content');
  if (risk === 'minimal' && reasons.length === 0) reasons.push('No significant effect on people found');

  return { risk, reasons, obligations: ob };
}
