// Scoping: which profile fits, and which triggers hold. Answers come from the questionnaire;
// Tenet suggests answers from records already held so the questionnaire is short.

import { PACKS, establishedIn, sensitiveIn } from '../jurisdictions.js';
import { EEA } from '../taxonomy.js';
import type { Dataset, SectorId, Workspace } from '../types.js';
import { profileRank, type Profile, type Trigger } from './model.js';
import type { AnsweredTrigger, ProgrammeScope, VolumeBand } from './types.js';

/** Sectors whose regulators supervise data handling closely or whose data is high-risk by nature. */
export const HIGH_RISK_SECTORS: SectorId[] = ['bank', 'fintech', 'insurer', 'mfb', 'mortgage', 'telco', 'hospital', 'mda', 'multinational'];

export const defaultScope = (w: Workspace, today = new Date()): ProgrammeScope => ({
  volumeBand: '1k-100k',
  answers: {},
  capacityDaysPerWeek: 2,
  startDate: today.toISOString().slice(0, 10),
});

export interface Suggestion { value: boolean; why: string }

/** What the records already say about each scoping question. */
export function suggestAnswers(ds: Dataset): Partial<Record<AnsweredTrigger, Suggestion>> {
  const w = ds.workspace;
  const acts = ds.activities.filter((a) => a.status !== 'retired');
  const out: Partial<Record<AnsweredTrigger, Suggestion>> = {};
  const sens = acts.filter((a) => w.jurisdictions.some((j) => sensitiveIn(j, a.dataCategoryIds).length));
  if (sens.length) out.sensitive = { value: true, why: `${sens.length} processing ${sens.length === 1 ? 'activity uses' : 'activities use'} sensitive data under a law in scope.` };
  const kids = acts.filter((a) => a.dataCategoryIds.includes('children') || a.dataSubjectTypes.some((t) => /child|minor|pupil|student/i.test(t)));
  if (kids.length) out.children = { value: true, why: `${kids.length} processing ${kids.length === 1 ? 'activity involves' : 'activities involve'} children.` };
  const ai = ds.aiSystems.filter((s) => s.status !== 'retired');
  if (ai.length || acts.some((a) => a.automatedDecisions)) out.ai = { value: true, why: ai.length ? `${ai.length} AI ${ai.length === 1 ? 'system' : 'systems'} recorded.` : 'An activity makes automated decisions.' };
  const foreign = [...ds.systems.map((s) => s.hostingCountry), ...ds.vendors.map((v) => v.country)].filter((c) => c && w.jurisdictions.some((j) => PACKS[j].transfers && !establishedIn(j, c)));
  if (foreign.length) out.transfers = { value: true, why: `${new Set(foreign).size} ${new Set(foreign).size === 1 ? 'country' : 'countries'} outside a jurisdiction in scope hold or receive data.` };
  if (acts.some((a) => a.directMarketing)) out.marketing = { value: true, why: 'An activity is used for direct marketing.' };
  if (acts.some((a) => a.lawfulBasis === 'consent')) out.consent = { value: true, why: 'An activity relies on consent.' };
  if (acts.some((a) => a.largeScaleMonitoring || a.dataCategoryIds.some((c) => ['images', 'biometric', 'location'].includes(c)))) out.monitoring = { value: true, why: 'Activities involve monitoring, images, biometric or location data.' };
  if (ds.policies.some((p) => p.type === 'cookie-notice')) out.website = { value: true, why: 'A cookie notice is recorded.' };
  return out;
}

/** Triggers worked out from the entity rather than asked. */
export function derivedTriggers(w: Workspace): Partial<Record<Trigger, boolean>> {
  const needsRep = (w.jurisdictions.includes('EU') && !EEA.includes(w.establishment)) || (w.jurisdictions.includes('UK') && w.establishment !== 'GB');
  return { processor: w.role === 'processor' || w.role === 'both', representative: needsRep };
}

export function resolveTriggers(w: Workspace, scope: ProgrammeScope): Record<Trigger, boolean> {
  const d = derivedTriggers(w);
  const a = scope.answers;
  return {
    processor: !!d.processor, representative: !!d.representative,
    sensitive: !!a.sensitive, children: !!a.children, ai: !!a.ai, transfers: !!a.transfers, marketing: !!a.marketing,
    consent: !!a.consent, website: !!a.website, monitoring: !!a.monitoring, certification: !!a.certification,
  };
}

const VOLUME_SCORE: Record<VolumeBand, number> = { lt1k: 0, '1k-100k': 1, '100k-1m': 2, gt1m: 3 };

export interface ProfileResult { profile: Profile; recommended: Profile; score: number; reasons: string[]; overridden: boolean }

/**
 * Recommend a scaling profile. The score is deliberately simple and explained, so an organisation
 * can see why and override it.
 */
export function recommendProfile(w: Workspace, scope: ProgrammeScope): ProfileResult {
  const t = resolveTriggers(w, scope);
  const reasons: string[] = [];
  let score = 0;
  const add = (n: number, why: string) => { if (n) { score += n; reasons.push(`${why} (+${n})`); } };
  add(VOLUME_SCORE[scope.volumeBand], 'Number of people whose data you hold');
  const emp = w.employees ?? 0;
  add(emp >= 1000 ? 3 : emp >= 250 ? 2 : emp >= 50 ? 1 : 0, `${emp ? emp.toLocaleString('en-GB') : 'Unknown'} employees`);
  if (HIGH_RISK_SECTORS.includes(w.sector)) add(2, 'Closely regulated or high-risk sector');
  if (t.sensitive) add(1, 'Sensitive data');
  if (t.children) add(1, 'Children’s data');
  if (t.ai) add(1, 'AI or automated decisions');
  if (w.jurisdictions.length >= 3) add(1, `${w.jurisdictions.length} laws in scope`);
  let recommended: Profile = score <= 2 ? 'essential' : score <= 5 ? 'standard' : 'advanced';
  if (HIGH_RISK_SECTORS.includes(w.sector) && VOLUME_SCORE[scope.volumeBand] >= 2 && recommended !== 'advanced') {
    recommended = 'advanced'; reasons.push('High-risk sector with more than 100,000 people: advanced');
  }
  if (t.certification && profileRank(recommended) < 2) { recommended = 'standard'; reasons.push('Certification needs at least the standard profile'); }
  if (!reasons.length) reasons.push('Small, low-risk processing');
  const profile = scope.profileOverride ?? recommended;
  return { profile, recommended, score, reasons, overridden: !!scope.profileOverride && scope.profileOverride !== recommended };
}

/** Shared validation for the scoping answers, used by the API and the web app. */
export function validateScope(raw: unknown): { ok: boolean; value?: ProgrammeScope; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return { ok: false, errors: { programme: 'Programme scope must be an object.' } };
  const r = raw as Record<string, unknown>;
  const bands: VolumeBand[] = ['lt1k', '1k-100k', '100k-1m', 'gt1m'];
  if (!bands.includes(r.volumeBand as VolumeBand)) errors.volumeBand = 'Choose how many people’s data you hold.';
  const answers: Partial<Record<AnsweredTrigger, boolean>> = {};
  const allowed: AnsweredTrigger[] = ['sensitive', 'children', 'ai', 'transfers', 'marketing', 'consent', 'website', 'monitoring', 'certification'];
  for (const [k, v] of Object.entries((r.answers ?? {}) as Record<string, unknown>)) {
    if (!allowed.includes(k as AnsweredTrigger)) { errors[`answers.${k}`] = 'Unknown question.'; continue; }
    if (typeof v !== 'boolean') { errors[`answers.${k}`] = 'Answer yes or no.'; continue; }
    answers[k as AnsweredTrigger] = v;
  }
  const cap = Number(r.capacityDaysPerWeek);
  if (!Number.isFinite(cap) || cap < 0.5 || cap > 100) errors.capacityDaysPerWeek = 'Capacity must be between 0.5 and 100 person-days a week.';
  const start = String(r.startDate ?? '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || Number.isNaN(Date.parse(start))) errors.startDate = 'Start date must be a valid date.';
  const po = r.profileOverride;
  if (po !== undefined && po !== null && po !== '' && !['essential', 'standard', 'advanced'].includes(String(po))) errors.profileOverride = 'Unknown profile.';
  if (Object.keys(errors).length) return { ok: false, errors };
  return {
    ok: true, errors,
    value: {
      volumeBand: r.volumeBand as VolumeBand, answers, capacityDaysPerWeek: cap, startDate: start,
      ...(po ? { profileOverride: po as Profile } : {}),
      ...(typeof r.answeredAt === 'string' ? { answeredAt: r.answeredAt } : {}),
    },
  };
}
