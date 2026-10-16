// Assessments: DPIA, AI impact, legitimate interests and transfer impact.
// The description is drawn from the data map, risks are suggested from what the processing involves,
// and the outcome rule says when a regulator must be consulted.

import { activityFacts } from './engine.js';
import { PACKS } from './jurisdictions.js';
import { categoryLabel, countryName } from './taxonomy.js';
import type { Assessment, AssessmentKind, AssessmentRisk, Dataset, JurisdictionCode } from './types.js';

export const ASSESSMENT_KINDS: { id: AssessmentKind; label: string; short: string; about: string }[] = [
  { id: 'dpia', label: 'Data protection impact assessment', short: 'DPIA', about: 'For processing likely to result in high risk to people.' },
  { id: 'aia', label: 'AI impact assessment', short: 'AI impact', about: 'A DPIA extended for AI systems: affected groups, fairness, explainability and oversight.' },
  { id: 'lia', label: 'Legitimate interests assessment', short: 'LIA', about: 'Purpose, necessity and balancing tests before relying on legitimate interests.' },
  { id: 'tia', label: 'Transfer impact assessment', short: 'TIA', about: 'Risks of sending data to a country, and the safeguards that address them.' },
];

export interface Question { id: string; text: string; help?: string; type: 'text' | 'yesno'; step: string }

export const QUESTIONS: Record<AssessmentKind, Question[]> = {
  dpia: [
    { id: 'context', step: 'Describe', type: 'text', text: 'What is the processing for, and what would happen without it?' },
    { id: 'expectations', step: 'Describe', type: 'text', text: 'Would the people affected expect this processing? What were they told?' },
    { id: 'n-basis', step: 'Necessity', type: 'text', text: 'Why is the lawful basis appropriate?' },
    { id: 'n-minimise', step: 'Necessity', type: 'text', text: 'Is every data category needed? What was removed or could be?' },
    { id: 'n-retention', step: 'Necessity', type: 'text', text: 'Why is the retention period justified, and how is data deleted?' },
    { id: 'n-accuracy', step: 'Necessity', type: 'text', text: 'How is the data kept accurate and up to date?' },
    { id: 'n-rights', step: 'Necessity', type: 'text', text: 'How will people exercise their rights for this processing?' },
    { id: 'n-processors', step: 'Necessity', type: 'text', text: 'How are processors and transfers controlled?' },
  ],
  aia: [
    { id: 'context', step: 'Describe', type: 'text', text: 'What does the AI system decide or recommend, and who relies on it?' },
    { id: 'ai-groups', step: 'Describe', type: 'text', text: 'Which groups of people are affected, including vulnerable groups?' },
    { id: 'n-basis', step: 'Necessity', type: 'text', text: 'Why is the lawful basis appropriate for training and use?' },
    { id: 'ai-data', step: 'Necessity', type: 'text', text: 'What data trains and feeds the model? Is it representative and lawfully obtained?' },
    { id: 'ai-fairness', step: 'Necessity', type: 'text', text: 'How is the system tested for bias across groups, and with what results?' },
    { id: 'ai-explain', step: 'Necessity', type: 'text', text: 'How are decisions explained to the people affected?' },
    { id: 'ai-oversight', step: 'Necessity', type: 'text', text: 'Who can override the system, and how do people contest a decision?' },
    { id: 'ai-monitor', step: 'Necessity', type: 'text', text: 'How is performance monitored after deployment, and what triggers a review?' },
  ],
  lia: [
    { id: 'purpose', step: 'Purpose test', type: 'text', text: 'What is the legitimate interest, and who benefits?' },
    { id: 'purpose-lawful', step: 'Purpose test', type: 'yesno', text: 'Is the interest lawful and clearly stated?' },
    { id: 'necessity', step: 'Necessity test', type: 'text', text: 'Is the processing necessary for that interest? Could it be done with less data or another way?' },
    { id: 'necessity-ok', step: 'Necessity test', type: 'yesno', text: 'Is there no less intrusive way to achieve it?' },
    { id: 'balance-expect', step: 'Balancing test', type: 'text', text: 'Would people reasonably expect it? What is the relationship with them?' },
    { id: 'balance-impact', step: 'Balancing test', type: 'text', text: 'What is the impact on them, and are any vulnerable or children?' },
    { id: 'balance-safeguards', step: 'Balancing test', type: 'text', text: 'What safeguards apply (opt-out, minimisation, security)?' },
    { id: 'balance-ok', step: 'Balancing test', type: 'yesno', text: 'Do the interests outweigh the impact on people, with safeguards in place?' },
  ],
  tia: [
    { id: 'destination', step: 'Transfer', type: 'text', text: 'Which country receives the data, and who is the recipient?' },
    { id: 'mechanism', step: 'Transfer', type: 'text', text: 'Which transfer mechanism is used?' },
    { id: 'laws', step: 'Destination law', type: 'text', text: 'Do laws or practices in the destination allow authorities to access the data beyond what is necessary and proportionate?' },
    { id: 'laws-risk', step: 'Destination law', type: 'yesno', text: 'Is there a real risk the data will be accessed in a way that undermines the protection?' },
    { id: 'measures', step: 'Safeguards', type: 'text', text: 'What supplementary measures apply (encryption with keys held at home, pseudonymisation, contractual commitments)?' },
    { id: 'measures-ok', step: 'Safeguards', type: 'yesno', text: 'Do the measures bring protection to an essentially equivalent level?' },
  ],
};

export interface RiskTemplate { id: string; title: string; description: string; triggers: string[]; likelihood: number; severity: number; measures: string }

export const RISK_LIBRARY: RiskTemplate[] = [
  { id: 'r-sensitive-disclosure', triggers: ['sensitive'], likelihood: 2, severity: 5, title: 'Disclosure of sensitive data', description: 'Exposure of sensitive data leads to discrimination, stigma or distress.', measures: 'Encrypt at rest and in transit; restrict access to named roles; log and review access; mask in reports.' },
  { id: 'r-auto-unfair', triggers: ['automated'], likelihood: 3, severity: 4, title: 'Unfair or wrong automated decision', description: 'People are refused a service or treated unfairly by an inaccurate or biased decision.', measures: 'Human review for adverse decisions; accuracy and bias testing before release and quarterly; clear reasons given.' },
  { id: 'r-auto-contest', triggers: ['automated'], likelihood: 3, severity: 3, title: 'No route to contest a decision', description: 'People cannot obtain human intervention or challenge an outcome.', measures: 'Publish an appeal route; train reviewers; track appeals and outcomes.' },
  { id: 'r-children', triggers: ['children'], likelihood: 3, severity: 4, title: 'Children not adequately protected', description: 'Data of children is processed without valid parental consent or age-appropriate safeguards.', measures: 'Age verification; parental consent flow; child-friendly notice; minimise data.' },
  { id: 'r-monitoring', triggers: ['monitoring'], likelihood: 4, severity: 3, title: 'Excessive monitoring', description: 'Systematic monitoring intrudes on private life and chills behaviour.', measures: 'Limit coverage and retention; signage or notice; access controls on footage or logs.' },
  { id: 'r-newtech', triggers: ['newtech'], likelihood: 3, severity: 3, title: 'Opaque processing people do not expect', description: 'New technology processes data in ways people cannot understand or anticipate.', measures: 'Layered notice; explainability statement; pilot with monitoring before full roll-out.' },
  { id: 'r-scale-breach', triggers: ['scale'], likelihood: 2, severity: 4, title: 'Large-scale breach', description: 'A single failure exposes data of many people.', measures: 'Segmentation; encryption; tested incident response; least-privilege access.' },
  { id: 'r-transfer', triggers: ['transfer', 'transfer-sensitive'], likelihood: 2, severity: 4, title: 'Weaker protection abroad', description: 'Data sent to another country is accessed or used without equivalent protection.', measures: 'Transfer instrument in place; transfer impact assessment; encryption with keys held locally.' },
  { id: 'r-vendor', triggers: ['vendor'], likelihood: 3, severity: 3, title: 'Processor misuse or breach', description: 'A vendor uses data for its own purposes or suffers a breach.', measures: 'Processing agreement; due diligence; audit rights; breach notice clause; review annually.' },
  { id: 'r-retention', triggers: ['retention'], likelihood: 4, severity: 2, title: 'Data kept longer than needed', description: 'Data is retained without a clear period, increasing exposure.', measures: 'Set and enforce a retention period; automated deletion; annual review.' },
  { id: 'r-function-creep', triggers: ['always'], likelihood: 2, severity: 3, title: 'Use beyond the stated purpose', description: 'Data collected for one purpose is reused for others without a basis.', measures: 'Purpose limitation in policy; approval for new uses; access tied to purpose.' },
  { id: 'r-ai-bias', triggers: ['ai'], likelihood: 3, severity: 4, title: 'Biased model outcomes', description: 'The model performs worse for some groups, causing unequal treatment.', measures: 'Representative data; fairness metrics by group; thresholds and remediation plan.' },
  { id: 'r-ai-drift', triggers: ['ai'], likelihood: 3, severity: 3, title: 'Model performance drifts', description: 'Accuracy degrades after deployment without anyone noticing.', measures: 'Monitoring with alert thresholds; scheduled revalidation; rollback plan.' },
];

export const riskScore = (l: number, s: number) => l * s;
export const riskLevel = (score: number): 'low' | 'medium' | 'high' | 'critical' => (score <= 4 ? 'low' : score <= 9 ? 'medium' : score <= 16 ? 'high' : 'critical');

/** Triggers present in the activities an assessment covers. */
export function assessmentTriggers(a: Pick<Assessment, 'activityIds' | 'kind' | 'aiSystemId'>, ds: Dataset): string[] {
  const t = new Set<string>(['always']);
  for (const id of a.activityIds) {
    const act = ds.activities.find((x) => x.id === id);
    if (!act) continue;
    const f = activityFacts(act, ds);
    f.perJx.forEach((p) => { p.dpia.reasons.forEach((r) => t.add(r.id)); if (p.transfers.length) t.add('transfer'); });
    if (f.vendors.length) t.add('vendor');
    if (!act.retentionPeriod) t.add('retention');
  }
  if (a.kind === 'aia' || a.aiSystemId) t.add('ai');
  return [...t];
}

export function suggestedRisks(a: Pick<Assessment, 'activityIds' | 'kind' | 'aiSystemId' | 'risks'>, ds: Dataset): RiskTemplate[] {
  const triggers = new Set(assessmentTriggers(a, ds));
  const have = new Set(a.risks.map((r) => r.libraryId));
  return RISK_LIBRARY.filter((r) => !have.has(r.id) && r.triggers.some((x) => triggers.has(x)));
}

export function riskFromTemplate(t: RiskTemplate, id: string): AssessmentRisk {
  return { id, libraryId: t.id, title: t.title, description: t.description, likelihood: t.likelihood, severity: t.severity, measures: t.measures, residualLikelihood: Math.max(1, t.likelihood - 1), residualSeverity: t.severity };
}

export interface ProcessingDescription {
  id: string; name: string; purpose: string; people: string; data: string; volume: number; systems: string; vendors: string; retention: string;
  perJx: { code: JurisdictionCode; basis: { ok: boolean; ref?: string; problem?: string }; sensitive: string[]; triggers: string[]; transfers: { country: string; via: string; ok: boolean; pending: boolean }[] }[];
}

/** A plain-language description of what the assessed processing involves, drawn from the data map. */
export function assessmentDescription(a: Pick<Assessment, 'activityIds'>, ds: Dataset): ProcessingDescription[] {
  return a.activityIds.map((id): ProcessingDescription | null => {
    const act = ds.activities.find((x) => x.id === id);
    if (!act) return null;
    const f = activityFacts(act, ds);
    return {
      id, name: act.name, purpose: act.purpose,
      people: act.dataSubjectTypes.join(', ') || 'not recorded',
      data: act.dataCategoryIds.map(categoryLabel).join(', ') || 'not recorded',
      volume: act.volume,
      systems: f.systems.map((s) => `${s.name} (${countryName(s.hostingCountry)})`).join(', ') || 'none linked',
      vendors: f.vendors.map((v) => `${v.name} (${countryName(v.country)})`).join(', ') || 'none',
      retention: act.retentionPeriod ?? 'not set',
      perJx: f.perJx.map((p) => ({ code: p.code, basis: p.basis, sensitive: p.sensitive.map(categoryLabel), triggers: p.dpia.reasons.map((r) => r.label), transfers: p.transfers })),
    };
  }).filter((x): x is ProcessingDescription => !!x);
}

export interface AssessmentReview {
  progress: { step: string; done: boolean }[];
  worstInherent: number;
  worstResidual: number;
  residualLevel: ReturnType<typeof riskLevel>;
  suggestedOutcome: NonNullable<Assessment['outcome']>;
  consult: { code: JurisdictionCode; ref: string }[];
  ready: boolean;
  blockers: string[];
}

export function reviewAssessment(a: Assessment, ds: Dataset): AssessmentReview {
  const qs = QUESTIONS[a.kind];
  const steps = [...new Set(qs.map((q) => q.step))];
  const progress = steps.map((step) => ({ step, done: qs.filter((q) => q.step === step).every((q) => a.answers[q.id] !== undefined && a.answers[q.id] !== '') }));
  const usesRisks = a.kind === 'dpia' || a.kind === 'aia';
  if (usesRisks) progress.push({ step: 'Risks', done: a.risks.length > 0 && a.risks.every((r) => !!r.measures) });
  progress.push({ step: 'Sign-off', done: !!a.outcome && !!a.approver });

  const worstInherent = Math.max(0, ...a.risks.map((r) => riskScore(r.likelihood, r.severity)));
  const worstResidual = Math.max(0, ...a.risks.map((r) => riskScore(r.residualLikelihood, r.residualSeverity)));
  const residualLevel = riskLevel(worstResidual);

  let suggestedOutcome: NonNullable<Assessment['outcome']> = 'proceed';
  const consult: { code: JurisdictionCode; ref: string }[] = [];
  if (usesRisks) {
    if (residualLevel === 'critical' || residualLevel === 'high') {
      const codes = new Set<JurisdictionCode>();
      a.activityIds.forEach((id) => { const act = ds.activities.find((x) => x.id === id); act?.jurisdictions.forEach((j) => { if (ds.workspace.jurisdictions.includes(j)) codes.add(j); }); });
      if (!a.activityIds.length) ds.workspace.jurisdictions.forEach((j) => codes.add(j));
      codes.forEach((code) => { const pc = PACKS[code].dpia.priorConsultation; if (pc) consult.push({ code, ref: pc }); });
      suggestedOutcome = consult.length ? 'consult-regulator' : residualLevel === 'critical' ? 'do-not-proceed' : 'proceed-with-conditions';
    } else if (residualLevel === 'medium') suggestedOutcome = 'proceed-with-conditions';
  } else if (a.kind === 'lia') {
    const pass = a.answers['purpose-lawful'] === true && a.answers['necessity-ok'] === true && a.answers['balance-ok'] === true;
    suggestedOutcome = pass ? 'proceed' : 'do-not-proceed';
  } else if (a.kind === 'tia') {
    const ok = a.answers['laws-risk'] === false || a.answers['measures-ok'] === true;
    suggestedOutcome = ok ? 'proceed' : 'do-not-proceed';
  }
  const blockers = progress.filter((p) => !p.done && p.step !== 'Sign-off').map((p) => `${p.step} incomplete`);
  return { progress, worstInherent, worstResidual, residualLevel, suggestedOutcome, consult, ready: blockers.length === 0, blockers };
}

export const OUTCOME_LABEL: Record<NonNullable<Assessment['outcome']>, string> = {
  proceed: 'Proceed', 'proceed-with-conditions': 'Proceed with conditions', 'do-not-proceed': 'Do not proceed', 'consult-regulator': 'Consult the regulator before processing',
};
