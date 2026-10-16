// Operational modules: vendor risk, breach notifiability and clocks, data subject requests.

import { addMonths, daysUntil } from './engine.js';
import { PACKS, establishedIn, sensitiveIn, type BreachTest } from './jurisdictions.js';
import { rightLabel } from './taxonomy.js';
import type { DataRequest, Dataset, Incident, JurisdictionCode, Provenance, System, Vendor } from './types.js';

// ---------------------------------------------------------------- Vendor risk

export interface VendorRisk { tier: 'low' | 'medium' | 'high'; inherent: number; score: number; reasons: string[]; reviewDue?: Date; reviewOverdue: boolean; activities: string[] }

export function vendorRisk(v: Vendor, ds: Dataset, now = new Date()): VendorRisk {
  const w = ds.workspace;
  const systems = ds.systems.filter((s) => s.vendorId === v.id).map((s) => s.id);
  const acts = ds.activities.filter((a) => a.status !== 'retired' && (a.vendorIds.includes(v.id) || a.systemIds.some((id) => systems.includes(id))));
  const cats = new Set(acts.flatMap((a) => a.dataCategoryIds));
  const volume = acts.reduce((m, a) => Math.max(m, a.volume || 0), 0);
  const reasons: string[] = [];
  let inherent = 0;
  const sensitive = w.jurisdictions.some((j) => sensitiveIn(j, [...cats]).length > 0);
  if (sensitive) { inherent += 3; reasons.push('Handles data treated as sensitive'); }
  if (['financial', 'gov-id', 'credit'].some((c) => cats.has(c))) { inherent += 2; reasons.push('Handles financial or ID data'); }
  if (volume >= 10_000) { inherent += 2; reasons.push(`Large volume (${volume.toLocaleString('en-GB')} people)`); }
  if (v.country && !w.jurisdictions.some((j) => establishedIn(j, v.country))) { inherent += 2; reasons.push('Processes outside your jurisdictions'); }
  if (v.aiProvider) { inherent += 1; reasons.push('Provides AI models or services'); }
  let score = inherent;
  if (!v.dpaSigned && (v.role === 'processor' || v.role === 'sub-processor')) { score += 2; reasons.push('No processing agreement'); }
  if (v.certifications.some((c) => /27001|soc ?2/i.test(c))) { score -= 2; } else { reasons.push('No ISO 27001 or SOC 2'); }
  if (!v.securityReviewDone) { score += 1; reasons.push('Security review not done'); }
  if (v.breachLast24m) { score += 2; reasons.push('Breach in the last 24 months'); }
  if (!v.subprocessorsDisclosed) { score += 1; reasons.push('Sub-processors not disclosed'); }
  score = Math.max(0, score);
  const tier = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  const months = tier === 'high' ? 12 : tier === 'medium' ? 24 : 36;
  const reviewDue = v.lastReviewed ? addMonths(v.lastReviewed, months) : undefined;
  return { tier, inherent, score, reasons, reviewDue, reviewOverdue: !v.lastReviewed || (reviewDue ? reviewDue < now : true), activities: acts.map((a) => a.name) };
}

export function systemControlsGap(s: System): string[] {
  const gaps: string[] = [];
  if (!s.encryptionAtRest) gaps.push('encryption at rest');
  if (!s.encryptionInTransit) gaps.push('encryption in transit');
  if (!s.mfa && s.kind !== 'paper') gaps.push('multi-factor sign-in');
  if (!s.accessLogging && s.kind !== 'paper') gaps.push('access logging');
  if (!s.backups && s.kind !== 'paper') gaps.push('backups');
  return gaps;
}

// ---------------------------------------------------------------- Breaches

export type HarmLevel = 'none' | 'risk' | 'high';

export function harmAssessment(inc: Incident, ds: Dataset): { level: HarmLevel; reasons: string[] } {
  const reasons: string[] = [];
  if (inc.dataUnintelligible) return { level: 'none', reasons: ['Data was encrypted or otherwise unintelligible to the recipient'] };
  const L = { low: 1, medium: 2, high: 3 }[inc.likelihoodOfHarm];
  let S = { low: 1, medium: 2, high: 3 }[inc.severityOfHarm];
  const sens = ds.workspace.jurisdictions.some((j) => sensitiveIn(j, inc.dataCategoryIds).length > 0);
  if (sens) { S = Math.min(3, S + 1); reasons.push('Sensitive data involved'); }
  if (['financial', 'gov-id', 'credit'].some((c) => inc.dataCategoryIds.includes(c))) { S = Math.min(3, S + 1); reasons.push('Financial or ID data can enable fraud'); }
  if (inc.affectedCount >= 1000) reasons.push(`${inc.affectedCount.toLocaleString('en-GB')} people affected`);
  const score = L * S;
  const level: HarmLevel = score >= 6 ? 'high' : score >= 2 ? 'risk' : 'none';
  reasons.unshift(`Likelihood ${inc.likelihoodOfHarm}, severity ${inc.severityOfHarm}${sens ? ' (raised for sensitive data)' : ''}`);
  return { level, reasons };
}

const meets = (test: BreachTest, level: HarmLevel) => test === 'any' ? true : test === 'risk' ? level !== 'none' : test === 'real-risk' ? level !== 'none' : level === 'high';
const TEST_TEXT: Record<BreachTest, string> = {
  any: 'Notify whenever personal data may have been accessed or acquired without authority.',
  risk: 'Notify unless the breach is unlikely to result in a risk to people.',
  'real-risk': 'Notify where there is a real risk of harm to people.',
  'high-risk': 'Notify where the breach is likely to result in a high risk to people.',
};

export interface BreachDuty {
  code: JurisdictionCode;
  regulator: string;
  regulatorRequired: boolean;
  subjectsRequired: boolean;
  regulatorTest: string;
  subjectsTest: string;
  window: string;
  ref: string;
  subjectsRef: string;
  deadline: Date | null;
  msRemaining: number | null;
  state: 'notified' | 'decided-not-to-notify' | 'running' | 'overdue' | 'no-fixed-window' | 'not-required';
  notifiedAt?: string;
  reference?: string;
  decision?: { notify: boolean; rationale: string };
  contents: string[];
  provenance: Provenance;
}

export function breachDuties(inc: Incident, ds: Dataset, now = new Date()): BreachDuty[] {
  const { level } = harmAssessment(inc, ds);
  const aware = new Date(inc.awareAt);
  return inc.jurisdictions.filter((j) => ds.workspace.jurisdictions.includes(j)).map((code) => {
    const b = PACKS[code].breach;
    const regulatorRequired = meets(b.regulatorTest, level);
    const subjectsRequired = meets(b.subjectsTest, level);
    const deadline = b.regulatorHours == null ? null : new Date(aware.getTime() + b.regulatorHours * 3_600_000);
    const n = inc.notifications?.[code];
    const d = inc.decisions?.[code];
    let state: BreachDuty['state'];
    if (n) state = 'notified';
    else if (d && !d.notify) state = 'decided-not-to-notify';
    else if (!regulatorRequired && !d) state = 'not-required';
    else if (!deadline) state = 'no-fixed-window';
    else state = now > deadline ? 'overdue' : 'running';
    return {
      code, regulator: PACKS[code].regulator, regulatorRequired, subjectsRequired,
      regulatorTest: TEST_TEXT[b.regulatorTest], subjectsTest: TEST_TEXT[b.subjectsTest], window: b.window, ref: b.ref, subjectsRef: b.subjectsRef,
      deadline, msRemaining: deadline ? deadline.getTime() - now.getTime() : null, state,
      notifiedAt: n?.at, reference: n?.reference, decision: d, contents: b.contents, provenance: b.prov,
    };
  });
}

export function breachNoticeDraft(inc: Incident, duty: BreachDuty, ds: Dataset): string {
  const w = ds.workspace;
  const lead = w.privacyLeadName ? `${w.privacyLeadName}${w.privacyLeadEmail ? ` (${w.privacyLeadEmail})` : ''}` : '[name and contact]';
  return [
    `To: ${duty.regulator}`,
    `Under: ${duty.ref}`,
    `Organisation: ${w.name}`,
    `Contact: ${lead}`,
    '',
    `Nature of the breach: ${inc.description || inc.title}. About ${inc.affectedCount.toLocaleString('en-GB')} people affected.`,
    `Became aware: ${new Date(inc.awareAt).toUTCString()}${inc.occurredAt ? `; occurred ${new Date(inc.occurredAt).toUTCString()}` : ''}.`,
    `Likely consequences: [describe, e.g. fraud risk from exposed account data].`,
    `Measures taken: ${inc.containment || '[containment and recovery steps]'}.`,
    `People affected ${duty.subjectsRequired ? 'will be told' : 'are not being told'} (${duty.subjectsRef}).`,
    '',
    'The notice should cover:',
    ...duty.contents.map((c) => `- ${c}`),
  ].join('\n');
}

// ---------------------------------------------------------------- Data subject requests

export interface RequestStatus {
  available: boolean;
  ref?: string;
  note?: string;
  due: Date | null;
  daysLeft: number | null;
  state: 'closed' | 'on-track' | 'due-soon' | 'overdue' | 'no-fixed-window';
  provenance: Provenance;
  systems: System[];
}

export function requestStatus(r: DataRequest, ds: Dataset, now = new Date()): RequestStatus {
  const pack = PACKS[r.jurisdiction];
  const right = pack.rights.available[r.type];
  const available = !!right;
  const note = available ? undefined : `${pack.shortLaw} has no statutory right of ${rightLabel(r.type).toLowerCase()}. Handle it as a courtesy or explain why it is declined.`;
  const days = right?.days !== undefined ? right.days : pack.rights.defaultDays;
  const ext = r.extended && pack.rights.extension ? pack.rights.extension.days : 0;
  const acts = ds.activities.filter((a) => a.status !== 'retired' && (!r.subjectType || a.dataSubjectTypes.some((t) => t.toLowerCase() === r.subjectType!.toLowerCase())));
  const sysIds = new Set(acts.flatMap((a) => a.systemIds));
  const systems = ds.systems.filter((s) => sysIds.has(s.id) && s.status !== 'decommissioned');
  if (r.stage === 'responded' || r.stage === 'refused') return { available, ref: right?.ref, note, due: null, daysLeft: null, state: 'closed', provenance: pack.rights.prov, systems };
  if (days == null) return { available, ref: right?.ref, note, due: null, daysLeft: null, state: 'no-fixed-window', provenance: pack.rights.prov, systems };
  const due = new Date(new Date(r.receivedAt).getTime() + (days + ext) * 86_400_000);
  const daysLeft = daysUntil(due, now);
  return { available, ref: right?.ref, note, due, daysLeft, state: daysLeft < 0 ? 'overdue' : daysLeft <= 5 ? 'due-soon' : 'on-track', provenance: pack.rights.prov, systems };
}
