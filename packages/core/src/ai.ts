// AI system classification: which obligations apply, under which regime, and why.
// Only regimes the entity has selected, and markets the system is used in, are considered.

import { sectorById } from './taxonomy.js';
import type { AIDomain, AISystem, Assessment, JurisdictionCode, Provenance, SectorId, Vendor } from './types.js';

export type AIRisk = 'high' | 'limited' | 'minimal' | 'unassessed';

export interface AIObligation {
  id: string;
  framework: string;
  ref: string;
  requirement: string;
  why: string;
  binding: boolean;
  provenance: Provenance;
  status: 'met' | 'open' | 'info';
}

export interface AIClassification { risk: AIRisk; reasons: string[]; obligations: AIObligation[] }

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
const hasAppeal = (s?: string) => !!s && /review|appeal|contest|human|override/i.test(s);

export function classifyAI(sys: AISystem, ctx: { sector: SectorId; jurisdictions: JurisdictionCode[]; vendors: Vendor[]; assessments: Assessment[] }): AIClassification {
  const ob: AIObligation[] = [];
  const reasons: string[] = [];
  const markets = sys.markets.filter((m) => ctx.jurisdictions.includes(m));
  const inMk = (j: JurisdictionCode) => markets.includes(j);
  const domain = AI_DOMAINS.find((d) => d.id === sys.domain);
  const vendor = sys.vendorId ? ctx.vendors.find((v) => v.id === sys.vendorId) : undefined;
  const ia = sys.impactAssessmentId ? ctx.assessments.find((a) => a.id === sys.impactAssessmentId) : undefined;
  const iaApproved = ia?.status === 'approved';
  const autoSig = sys.decisionRole === 'solely-automated' && sys.significantEffect;
  const financial = sectorById(ctx.sector).financial;
  if (autoSig) reasons.push('Makes significant decisions about people without human review');

  const autoRule = (code: JurisdictionCode, framework: string, ref: string, req: string, conf: Provenance['confidence'] = 'primary') => {
    if (inMk(code) && sys.personalData && autoSig) ob.push({ id: `auto-${code}`, framework, ref, requirement: req, why: 'Solely automated decision with significant effect.', binding: true, provenance: P(ref, conf), status: hasAppeal(sys.humanOversight) ? 'met' : 'open' });
  };
  autoRule('NG', 'NDPA', 'NDPA s.37', 'Give people a way to obtain human intervention, express their view and contest the decision.');
  autoRule('KE', 'Kenya DPA', 'Kenya DPA s.35', 'Notify the person and allow reconsideration or a new decision not based solely on automated processing.');
  autoRule('ZA', 'POPIA', 'POPIA s.71', 'Allow representations about the decision and give enough information about the underlying logic.');
  autoRule('EU', 'GDPR', 'GDPR Art. 22', 'Provide human intervention, the right to express a view and to contest the decision.');
  autoRule('UK', 'UK GDPR', 'UK GDPR Art. 22', 'Provide safeguards including human intervention and the right to contest.');

  if (inMk('NG') && sys.personalData) {
    ob.push({ id: 'gaid-43', framework: 'NDPA/GAID', ref: 'GAID Arts. 43–44', requirement: 'Document technical and organisational parameters of the system for the audit return.', why: 'Emerging technology processing personal data of people in Nigeria.', binding: true, provenance: P('GAID 2025 Arts. 43–44', 'secondary'), status: sys.humanOversight && sys.purpose ? 'met' : 'open' });
  }
  const needsIA = sys.personalData && (sys.significantEffect || sys.sensitiveData || sys.domain === 'biometric-id');
  if (needsIA) {
    const refs = markets.map((m) => ({ NG: 'NDPA s.28', KE: 'Kenya DPA s.31', ZA: 'POPIA reg. 4(1)(b)', EU: 'GDPR Art. 35', UK: 'UK GDPR Art. 35' } as Partial<Record<JurisdictionCode, string>>)[m]).filter(Boolean);
    if (refs.length) ob.push({ id: 'dpia', framework: 'Data protection', ref: refs.join(' · '), requirement: 'Carry out an impact assessment that covers effects on different groups of people.', why: sys.sensitiveData ? 'Uses sensitive data.' : 'Significant effects on individuals.', binding: true, provenance: P(refs.join('; '), 'primary'), status: iaApproved ? 'met' : 'open' });
  }
  const offshore = sys.sourcing === 'genai-api' || !!vendor;
  if (sys.personalData && offshore && vendor) {
    const abroad = markets.filter((m) => ({ NG: 'NG', KE: 'KE', ZA: 'ZA', GH: 'GH', EG: 'EG', ZW: 'ZW', UK: 'GB' } as Record<string, string>)[m] !== vendor.country && !(m === 'EU' && ['IE', 'DE', 'FR', 'NL', 'BE', 'ES', 'IT', 'SE', 'PL', 'PT', 'LU'].includes(vendor.country)));
    if (abroad.length) ob.push({ id: 'transfer', framework: 'Data protection', ref: 'Transfer rules', requirement: `Record a transfer basis for data sent to the provider in ${vendor.country}.`, why: `Provider processes outside ${abroad.join(', ')}.`, binding: true, provenance: P('NDPA ss.41–43; POPIA s.72; Kenya DPA ss.48–50; GDPR Chapter V', 'primary'), status: vendor.transferMechanism && !['none', 'pending-approval'].includes(vendor.transferMechanism) ? 'met' : 'open' });
  } else if (sys.personalData && sys.sourcing === 'genai-api' && !vendor) {
    ob.push({ id: 'transfer', framework: 'Data protection', ref: 'Transfer rules', requirement: 'Link the model provider as a vendor and record where prompts are processed.', why: 'Prompts go to an external model API.', binding: true, provenance: P('Transfer rules of the selected jurisdictions', 'primary'), status: 'open' });
  }
  if (inMk('NG') && sys.domain === 'fraud-aml' && financial) {
    reasons.push('AML or fraud model at a Nigerian financial institution');
    ob.push({ id: 'cbn-aml', framework: 'CBN', ref: 'CBN circular, March 2026', requirement: 'Validate the model and keep its decisions explainable; 18 months for deposit money banks, 24 for other institutions.', why: 'Automated AML or fraud system at a CBN-regulated institution.', binding: true, provenance: P('CBN circular on automated AML systems, March 2026 (press reports)', 'secondary', 'Confirm the circular reference and the window that applies.'), status: sys.lastValidated ? 'met' : 'open' });
  }
  if (inMk('EU')) {
    if (domain?.euAnnexIII) {
      reasons.push(`EU AI Act high-risk use (${domain.euAnnexIII})`);
      ob.push({ id: 'eu-high', framework: 'EU AI Act', ref: `${domain.euAnnexIII}; Arts. 9, 14, 26`, requirement: 'High-risk duties: risk management, logging, human oversight and deployer obligations. Annex III duties apply from 2 December 2027.', why: 'Used in the EU for an Annex III purpose.', binding: true, provenance: P('EU AI Act as amended by the 2026 omnibus', 'secondary', 'Dates as reported after the 2026 omnibus; confirm against the Official Journal.'), status: iaApproved ? 'met' : 'open' });
    }
    if (sys.interactsWithPublic || sys.generatesContent) ob.push({ id: 'eu-50', framework: 'EU AI Act', ref: 'Art. 50', requirement: 'Tell people they are dealing with AI and mark generated content.', why: 'Interacts with people or generates content in the EU.', binding: true, provenance: P('EU AI Act Art. 50', 'secondary'), status: 'open' });
    ob.push({ id: 'eu-4', framework: 'EU AI Act', ref: 'Art. 4', requirement: 'Ensure staff using the system have sufficient AI literacy.', why: 'Any use in the EU.', binding: true, provenance: P('EU AI Act Art. 4', 'primary'), status: 'open' });
  }
  if (sys.status !== 'retired') {
    ob.push({ id: 'iso-614', framework: 'ISO/IEC 42001', ref: 'Clause 6.1.4', requirement: 'AI system impact assessment kept as certification evidence.', why: 'Voluntary; expected by enterprise buyers.', binding: false, provenance: P('ISO/IEC 42001:2023 clause 6.1.4', 'primary'), status: iaApproved ? 'met' : 'info' });
    if (vendor || sys.sourcing === 'genai-api') ob.push({ id: 'iso-a10', framework: 'ISO/IEC 42001', ref: 'Annex A.10', requirement: 'Assess and manage the AI supplier.', why: 'Third-party model or service.', binding: false, provenance: P('ISO/IEC 42001:2023 Annex A.10', 'primary'), status: vendor?.securityReviewDone ? 'met' : 'info' });
    ob.push({ id: 'nist-measure', framework: 'NIST AI RMF', ref: 'Measure', requirement: 'Test for bias, robustness and performance across affected groups.', why: 'Voluntary framework.', binding: false, provenance: P('NIST AI RMF 1.0', 'primary'), status: sys.lastValidated ? 'met' : 'info' });
  }
  if (sys.discovered) {
    reasons.push('Found by discovery, not declared by a team');
    ob.push({ id: 'iso-a2', framework: 'ISO/IEC 42001', ref: 'Annex A.2', requirement: 'Bring the tool under an approved AI use policy or block it.', why: 'Unapproved use discovered.', binding: false, provenance: P('ISO/IEC 42001:2023 Annex A.2', 'primary'), status: 'open' });
  }
  let risk: AIRisk;
  if (sys.discovered && !sys.humanOversight) risk = 'unassessed';
  else if (autoSig || (inMk('EU') && domain?.euAnnexIII) || (inMk('NG') && sys.domain === 'fraud-aml' && financial) || sys.domain === 'biometric-id') risk = 'high';
  else if (sys.interactsWithPublic || sys.generatesContent || sys.significantEffect) risk = 'limited';
  else risk = 'minimal';
  if (risk === 'limited' && !reasons.length) reasons.push('Interacts with the public or generates content');
  if (risk === 'minimal' && !reasons.length) reasons.push('No significant effect on people found');
  return { risk, reasons, obligations: ob };
}
