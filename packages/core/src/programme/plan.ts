// Turns the framework, the scope and the records into one tailored, sequenced plan with progress and maturity.

import { PACKS } from '../jurisdictions.js';
import type { Dataset, JurisdictionCode } from '../types.js';
import { CONTROLS, DOMAINS } from './catalogue.js';
import {
  EFFORT_DAYS, PHASES, RECURRENCE_MONTHS, TRIGGER_LABEL, profileRank,
  type Control, type DomainId, type Phase, type Profile, type Ref, type Trigger,
} from './model.js';
import { defaultScope, recommendProfile, resolveTriggers, type ProfileResult } from './scope.js';
import { signalsFor, type Signal } from './signals.js';
import type { ControlRecord, ControlStatus, ProgrammeScope } from './types.js';

export type Inclusion = 'profile' | 'law';

export interface PlanItem {
  control: Control;
  inclusion: Inclusion;
  /** Laws in scope that impose this control themselves. */
  requiredBy: JurisdictionCode[];
  /** References for the laws in scope only. */
  refs: { code: JurisdictionCode; refs: Ref[] }[];
  record?: ControlRecord;
  status: ControlStatus;
  signal?: Signal;
  maturity: number | null;
  effortDays: number;
  startWeek: number;
  endWeek: number;
  start: Date;
  end: Date;
  /** Dependencies in the plan that are not yet implemented. */
  waitingOn: string[];
  reviewDue?: Date;
  reviewOverdue: boolean;
  overdue: boolean;
}

export interface Excluded { control: Control; why: string }

export interface DomainScore { id: DomainId; name: string; maturity: number; items: number; done: number }
export interface PhaseSummary { id: Phase; name: string; items: number; done: number; endWeek: number; end: Date }

export interface Plan {
  scope: ProgrammeScope;
  scoped: boolean;
  profile: ProfileResult;
  triggers: Record<Trigger, boolean>;
  items: PlanItem[];
  excluded: Excluded[];
  progress: number;
  maturity: number;
  domains: DomainScore[];
  phases: PhaseSummary[];
  weeks: number;
  end: Date;
  capacityDaysPerWeek: number;
}

const PROFILE_SIZE: Record<Profile, number> = { essential: 0.6, standard: 1, advanced: 1.6 };
/** A single control rarely absorbs more than this many person-days a week: it waits on other people. */
const MAX_DAYS_PER_CONTROL_WEEK = 2.5;
const DAY = 86_400_000;
const addWeeks = (d: Date, w: number) => new Date(d.getTime() + w * 7 * DAY);
const addMonths = (iso: string, m: number) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + m); return d; };

export const isDone = (s: ControlStatus) => s === 'implemented' || s === 'operating';

export const MATURITY_LEVELS = [
  { min: 0, label: 'Not started' }, { min: 1, label: 'Initial' }, { min: 2, label: 'Defined' },
  { min: 3, label: 'Implemented' }, { min: 4, label: 'Managed' }, { min: 4.5, label: 'Optimised' },
];
export const maturityLabel = (m: number) => [...MATURITY_LEVELS].reverse().find((l) => m >= l.min)!.label;

function controlMaturity(status: ControlStatus, rec: ControlRecord | undefined, signal: Signal | undefined, reviewOverdue: boolean): number | null {
  if (status === 'not-applicable') return null;
  let m = status === 'not-started' ? 0 : status === 'in-progress' ? 1 : status === 'implemented' ? ((rec?.evidence?.trim() || signal?.state === 'met') ? 3 : 2) : 4;
  if (status === 'operating' && rec?.optimised) m = 5;
  if (reviewOverdue) m = Math.min(m, 2);
  return m;
}

/** Decide whether a control belongs in this organisation's plan, and why. */
export function includeControl(c: Control, jx: JurisdictionCode[], profile: Profile, triggers: Record<Trigger, boolean>): { include: true; inclusion: Inclusion; requiredBy: JurisdictionCode[] } | { include: false; why: string } {
  if (c.onlyFor && !c.onlyFor.some((j) => jx.includes(j))) return { include: false, why: `Only for ${c.onlyFor.map((j) => PACKS[j].name).join(' or ')}.` };
  const missing = (c.triggers ?? []).filter((t) => !triggers[t]);
  if (missing.length) return { include: false, why: `Applies only if: ${missing.map((t) => TRIGGER_LABEL[t].toLowerCase()).join('; ')}.` };
  const requiredBy = jx.filter((j) => (c.laws[j] ?? []).some((r) => r.kind === 'requires'));
  if (profileRank(c.profile) <= profileRank(profile)) return { include: true, inclusion: 'profile', requiredBy };
  if (requiredBy.length) return { include: true, inclusion: 'law', requiredBy };
  return { include: false, why: `Part of the ${c.profile} profile.` };
}

export function buildPlan(ds: Dataset, now = new Date()): Plan {
  const w = ds.workspace;
  const scope = w.programme ?? defaultScope(w, now);
  const profile = recommendProfile(w, scope);
  const triggers = resolveTriggers(w, scope);
  const signals = signalsFor(ds, now);
  const records = new Map(ds.controls.map((r) => [r.controlId, r]));

  const chosen: { c: Control; inclusion: Inclusion; requiredBy: JurisdictionCode[] }[] = [];
  const excluded: Excluded[] = [];
  for (const c of CONTROLS) {
    const r = includeControl(c, w.jurisdictions, profile.profile, triggers);
    if (r.include) chosen.push({ c, inclusion: r.inclusion, requiredBy: r.requiredBy });
    else excluded.push({ control: c, why: r.why });
  }
  const inPlan = new Set(chosen.map((x) => x.c.id));

  // Priority: phase, then legal requirements, then domain order, then id. Dependencies come first regardless.
  const domainOrder = (d: DomainId) => DOMAINS.findIndex((x) => x.id === d);
  const prio = (x: (typeof chosen)[number]) => [x.c.phase, x.requiredBy.length ? 0 : 1, domainOrder(x.c.domain), x.c.id] as const;
  const cmp = (a: (typeof chosen)[number], b: (typeof chosen)[number]) => {
    const pa = prio(a), pb = prio(b);
    for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
    return 0;
  };
  const byId = new Map(chosen.map((x) => [x.c.id, x]));
  const ordered: (typeof chosen)[number][] = [];
  const seen = new Set<string>();
  const visit = (x: (typeof chosen)[number]) => {
    if (seen.has(x.c.id)) return;
    seen.add(x.c.id);
    x.c.dependsOn.filter((d) => inPlan.has(d)).map((d) => byId.get(d)!).sort(cmp).forEach(visit);
    ordered.push(x);
  };
  [...chosen].sort(cmp).forEach(visit);

  // Schedule against weekly capacity. Finished and not-applicable controls take no capacity.
  const capacity = Math.max(0.5, scope.capacityDaysPerWeek || 2);
  const load: number[] = [];
  const endWeek = new Map<string, number>();
  const start0 = new Date(scope.startDate || now.toISOString().slice(0, 10));
  const items: PlanItem[] = [];

  for (const x of ordered) {
    const rec = records.get(x.c.id);
    const status: ControlStatus = rec?.status ?? 'not-started';
    const effortDays = Math.round(EFFORT_DAYS[x.c.effort] * PROFILE_SIZE[profile.profile] * 10) / 10;
    const deps = x.c.dependsOn.filter((d) => inPlan.has(d));
    const earliest = deps.reduce((m, d) => Math.max(m, endWeek.get(d) ?? 0), 0);
    let s = earliest, e = earliest;
    if (!isDone(status) && status !== 'not-applicable') {
      let left = effortDays * (status === 'in-progress' ? 0.5 : 1);
      let wk = earliest;
      let first = -1;
      while (left > 0.001) {
        const free = capacity - (load[wk] ?? 0);
        const take = Math.min(free, MAX_DAYS_PER_CONTROL_WEEK, left);
        if (take > 0.001) { load[wk] = (load[wk] ?? 0) + take; left -= take; if (first < 0) first = wk; }
        wk++;
      }
      s = first; e = wk;
    }
    endWeek.set(x.c.id, e);

    const months = RECURRENCE_MONTHS[x.c.recurrence];
    const base = rec?.lastReviewed ?? rec?.implementedOn;
    const reviewDue = isDone(status) && months && base ? addMonths(base, months) : undefined;
    const reviewOverdue = !!reviewDue && reviewDue < now;
    const signal = signals[x.c.id];
    const end = rec?.due ? new Date(rec.due) : addWeeks(start0, e);
    items.push({
      control: x.c, inclusion: x.inclusion, requiredBy: x.requiredBy,
      refs: w.jurisdictions.filter((j) => x.c.laws[j]?.length).map((j) => ({ code: j, refs: x.c.laws[j]! })),
      record: rec, status, signal, maturity: controlMaturity(status, rec, signal, reviewOverdue), effortDays,
      startWeek: s, endWeek: e, start: addWeeks(start0, s), end,
      waitingOn: deps.filter((d) => !isDone(records.get(d)?.status ?? 'not-started') && records.get(d)?.status !== 'not-applicable'),
      reviewDue, reviewOverdue,
      overdue: !isDone(status) && status !== 'not-applicable' && end < now,
    });
  }

  const scored = items.filter((i) => i.maturity !== null);
  const totalEffort = scored.reduce((n, i) => n + i.effortDays, 0);
  const doneEffort = scored.filter((i) => isDone(i.status)).reduce((n, i) => n + i.effortDays, 0);
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : 0);
  const domains: DomainScore[] = DOMAINS.map((d) => {
    const its = scored.filter((i) => i.control.domain === d.id);
    return { id: d.id, name: d.name, maturity: avg(its.map((i) => i.maturity!)), items: its.length, done: its.filter((i) => isDone(i.status)).length };
  }).filter((d) => d.items > 0);
  const weeks = items.reduce((m, i) => Math.max(m, i.endWeek), 0);
  const phases: PhaseSummary[] = PHASES.map((p) => {
    const its = items.filter((i) => i.control.phase === p.id && i.status !== 'not-applicable');
    const ew = its.reduce((m, i) => Math.max(m, i.endWeek), 0);
    return { id: p.id, name: p.name, items: its.length, done: its.filter((i) => isDone(i.status)).length, endWeek: ew, end: addWeeks(start0, ew) };
  });

  return {
    scope, scoped: !!w.programme, profile, triggers, items, excluded,
    progress: totalEffort ? Math.round((doneEffort / totalEffort) * 100) : 0,
    maturity: avg(scored.map((i) => i.maturity!)),
    domains, phases, weeks, end: addWeeks(start0, weeks), capacityDaysPerWeek: capacity,
  };
}

export interface CapacityAnswer { targetWeeks: number; daysPerWeek: number | null; criticalPathWeeks: number }

/**
 * The least weekly capacity that finishes the plan within the target, in half-day steps.
 * Returns null when the dependency chain alone takes longer than the target.
 */
export function capacityForTarget(ds: Dataset, targetWeeks: number, now = new Date()): CapacityAnswer {
  const scope = ds.workspace.programme ?? defaultScope(ds.workspace, now);
  const at = (c: number) => buildPlan({ ...ds, workspace: { ...ds.workspace, programme: { ...scope, capacityDaysPerWeek: c } } }, now).weeks;
  const criticalPathWeeks = at(1000);
  if (criticalPathWeeks > targetWeeks) return { targetWeeks, daysPerWeek: null, criticalPathWeeks };
  let lo = 0.5, hi = 100;
  while (hi - lo > 0.5) { const mid = Math.round(((lo + hi) / 2) * 2) / 2; if (at(mid) <= targetWeeks) hi = mid; else lo = mid; }
  return { targetWeeks, daysPerWeek: at(lo) <= targetWeeks ? lo : hi, criticalPathWeeks };
}
