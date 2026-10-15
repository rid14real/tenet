// Rule evaluation: tiers, DPIA triggers, clocks. Pure functions, no I/O.

import { CAR_RULES, DPIA_SCALE_THRESHOLD, JURISDICTIONS, TIER_RULES, sectorById } from './rules.js';
import type {
  Assessment, DataRequest, Incident, JurisdictionCode, ProcessingActivity, Provenance, RiskLevel, SectorId, Tier,
} from './types.js';

const RANK: Record<Tier, number> = { OHL: 0, EHL: 1, UHL: 2 };

export interface TierResult {
  tier: Tier;
  bySector: Tier;
  byVolume: Tier;
  filesAuditReturn: boolean;
  explanation: string;
  provenance: Provenance;
}

export function classifyTier(sector: SectorId, dataSubjects6m: number): TierResult {
  const s = sectorById(sector);
  const n = Math.max(0, Math.floor(dataSubjects6m || 0));
  const byVolume: Tier = n > TIER_RULES.uhlAbove ? 'UHL' : n >= TIER_RULES.ehlFrom ? 'EHL' : 'OHL';
  const tier = RANK[s.tier] >= RANK[byVolume] ? s.tier : byVolume;
  const fmt = n.toLocaleString('en-GB');
  const explanation = s.tier === byVolume
    ? `Sector (${s.label.toLowerCase()}) and volume (${fmt} data subjects in six months) both point to ${tier}.`
    : `Sector alone gives ${s.tier}; ${fmt} data subjects in six months gives ${byVolume}. The higher tier applies.`;
  return { tier, bySector: s.tier, byVolume, filesAuditReturn: tier !== 'OHL', explanation, provenance: TIER_RULES.provenance };
}

/** The next audit-return due date on or after `from` for a given cycle year (return for year N is due in year N+1). */
export function auditReturnDue(cycleYear: number): Date {
  return new Date(Date.UTC(cycleYear + 1, CAR_RULES.dueMonth - 1, CAR_RULES.dueDay, 22, 59, 0));
}

export function daysUntil(target: Date, now: Date = new Date()): number {
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
}

// ---------------------------------------------------------------- DPIA

export interface DpiaTrigger { id: string; label: string; ref: string }

export function dpiaTriggers(a: Pick<ProcessingActivity, 'sensitive' | 'children' | 'automatedDecisions' | 'largeScaleMonitoring' | 'newTechnology' | 'volume' | 'crossBorder'>): DpiaTrigger[] {
  const t: DpiaTrigger[] = [];
  if (a.sensitive) t.push({ id: 'sensitive', label: 'Sensitive personal data', ref: 'NDPA s.30; GAID Art. 28' });
  if (a.children) t.push({ id: 'children', label: "Children's data", ref: 'NDPA s.31; GAID Art. 28' });
  if (a.automatedDecisions) t.push({ id: 'automated', label: 'Automated decisions with significant effect', ref: 'NDPA s.37; GAID Art. 28' });
  if (a.largeScaleMonitoring) t.push({ id: 'monitoring', label: 'Systematic or large-scale monitoring', ref: 'GAID Art. 28' });
  if (a.newTechnology) t.push({ id: 'newtech', label: 'New or emerging technology', ref: 'GAID Arts. 28, 43–44' });
  if ((a.volume || 0) >= DPIA_SCALE_THRESHOLD) t.push({ id: 'scale', label: `Large scale (${DPIA_SCALE_THRESHOLD.toLocaleString('en-GB')}+ data subjects)`, ref: 'GAID Art. 28' });
  if (a.crossBorder && a.sensitive) t.push({ id: 'transfer-sensitive', label: 'Sensitive data transferred abroad', ref: 'NDPA ss.41–43' });
  return t;
}

export const DPIA_TRIGGER_PROVENANCE: Provenance = {
  source: 'NDPA 2023 s.28; GAID 2025 Art. 28 trigger list',
  confidence: 'secondary',
  note: 'Trigger list drawn from practitioner summaries of the GAID; check against the GAID text.',
};

export interface DpiaQuestion { id: string; text: string; weight: number }

export const DPIA_QUESTIONS: DpiaQuestion[] = [
  { id: 'q-sensitive', text: 'Does the processing involve sensitive personal data (health, biometrics, religion, ethnicity, financial details)?', weight: 3 },
  { id: 'q-children', text: 'Does it involve children or other vulnerable people?', weight: 3 },
  { id: 'q-automated', text: 'Are decisions with legal or similarly significant effects made without human review?', weight: 3 },
  { id: 'q-profiling', text: 'Does it evaluate or score people (profiling, credit scoring, behaviour analysis)?', weight: 2 },
  { id: 'q-scale', text: 'Is it large scale for the organisation (thousands of people or a whole customer base)?', weight: 2 },
  { id: 'q-matching', text: 'Are datasets combined or matched from different sources?', weight: 1 },
  { id: 'q-transfer', text: 'Does personal data leave Nigeria?', weight: 2 },
  { id: 'q-newtech', text: 'Does it use new technology, including AI, biometrics or IoT?', weight: 2 },
  { id: 'q-denial', text: 'Could it prevent people from using a service or entering a contract?', weight: 2 },
  { id: 'q-surprise', text: 'Would people be surprised by the processing given what they were told?', weight: 2 },
];

export function dpiaInherentRisk(answers: Record<string, boolean>): { score: number; max: number; level: RiskLevel } {
  const max = DPIA_QUESTIONS.reduce((s, q) => s + q.weight, 0);
  const score = DPIA_QUESTIONS.reduce((s, q) => s + (answers[q.id] ? q.weight : 0), 0);
  const level: RiskLevel = score >= 9 ? 'high' : score >= 4 ? 'medium' : 'low';
  return { score, max, level };
}

/** Is there an approved DPIA covering this activity? */
export function dpiaStatusFor(activity: ProcessingActivity, assessments: Assessment[]): 'approved' | 'in-progress' | 'none' {
  const mine = assessments.filter((x) => x.activityId === activity.id && x.kind === 'dpia');
  if (mine.some((x) => x.status === 'approved')) return 'approved';
  if (mine.length) return 'in-progress';
  return 'none';
}

// ---------------------------------------------------------------- Clocks

export interface BreachClock {
  jurisdiction: JurisdictionCode;
  regulator: string;
  windowText: string;
  ref: string;
  provenance: Provenance;
  deadline: Date | null;
  msRemaining: number | null;
  state: 'notified' | 'not-required' | 'running' | 'overdue' | 'no-fixed-window';
  notifiedAt?: string;
}

export function breachClocks(incident: Incident, now: Date = new Date()): BreachClock[] {
  const aware = new Date(incident.awareAt);
  return incident.jurisdictions.map((code) => {
    const j = JURISDICTIONS[code];
    const deadline = j.breachHours == null ? null : new Date(aware.getTime() + j.breachHours * 3_600_000);
    const notifiedAt = incident.notified?.[code];
    const notRequired = incident.notRequired?.[code];
    let state: BreachClock['state'];
    if (notifiedAt) state = 'notified';
    else if (notRequired) state = 'not-required';
    else if (!deadline) state = 'no-fixed-window';
    else state = now.getTime() > deadline.getTime() ? 'overdue' : 'running';
    return {
      jurisdiction: code,
      regulator: j.regulator,
      windowText: j.breachWindowText,
      ref: j.breach.source,
      provenance: j.breach,
      deadline,
      msRemaining: deadline ? deadline.getTime() - now.getTime() : null,
      state,
      notifiedAt,
    };
  });
}

export function formatDuration(ms: number): string {
  const neg = ms < 0;
  let s = Math.floor(Math.abs(ms) / 1000);
  // Hours read best for regulator windows (24h, 72h); switch to days only past 99 hours.
  const d = s >= 100 * 3600 ? Math.floor(s / 86400) : 0; s -= d * 86400;
  const h = Math.floor(s / 3600); s -= h * 3600;
  const m = Math.floor(s / 60); s -= m * 60;
  const p = (x: number) => String(x).padStart(2, '0');
  const body = d > 0 ? `${d}d ${h}h ${p(m)}m` : `${h}h ${p(m)}m ${p(s)}s`;
  return neg ? `${body} overdue` : body;
}

export interface RequestClock { due: Date | null; daysLeft: number | null; state: 'done' | 'on-track' | 'due-soon' | 'overdue' | 'no-fixed-window'; provenance: Provenance }

export function requestClock(r: DataRequest, now: Date = new Date()): RequestClock {
  const j = JURISDICTIONS[r.jurisdiction];
  if (r.status === 'completed' || r.status === 'refused') return { due: null, daysLeft: null, state: 'done', provenance: j.request };
  if (j.requestDays == null) return { due: null, daysLeft: null, state: 'no-fixed-window', provenance: j.request };
  const due = new Date(new Date(r.receivedAt).getTime() + j.requestDays * 86_400_000);
  const daysLeft = daysUntil(due, now);
  const state = daysLeft < 0 ? 'overdue' : daysLeft <= 5 ? 'due-soon' : 'on-track';
  return { due, daysLeft, state, provenance: j.request };
}
