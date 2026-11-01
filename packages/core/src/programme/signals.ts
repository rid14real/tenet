// What Tenet's own records say about a control. Signals never set a control's status; they show the
// owner what the records suggest and count as evidence when they are positive.

import { compliance, type JurisdictionResult, type ReqStatus } from '../compliance.js';
import { PACKS } from '../jurisdictions.js';
import { establishedIn } from '../jurisdictions.js';
import type { Dataset, PolicyType } from '../types.js';

export type SignalState = 'met' | 'partial' | 'missing';
export interface Signal { state: SignalState; detail: string; source: string }

type Ctx = { ds: Dataset; results: JurisdictionResult[]; now: Date };
type SignalFn = (c: Ctx) => Signal | null;

/** Combine a compliance requirement across every law in scope. */
function fromRequirement(keys: string[], source: string): SignalFn {
  return ({ results }) => {
    const hits = results.flatMap((r) => r.requirements.filter((q) => keys.includes(q.key) && q.status !== 'na').map((q) => ({ q, law: PACKS[r.code].shortLaw })));
    if (!hits.length) return null;
    const statuses = hits.map((h) => h.q.status as ReqStatus);
    const state: SignalState = statuses.every((s) => s === 'met') ? 'met' : statuses.some((s) => s === 'met' || s === 'partial') ? 'partial' : 'missing';
    const worst = hits.find((h) => h.q.status === 'missing') ?? hits.find((h) => h.q.status === 'partial') ?? hits[0];
    const label = (s: ReqStatus) => (s === 'met' ? 'met' : s === 'partial' ? 'partly met' : 'missing');
    const per = hits.map((h) => `${h.law} ${label(h.q.status)}`).join(' · ');
    return { state, detail: state === 'met' ? per : `${per}. ${worst.q.detail}`, source };
  };
}

const share = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
function coverage(label: string, n: number, d: number, source: string, noneText: string): Signal {
  if (!d) return { state: 'missing', detail: noneText, source };
  const pct = share(n, d);
  return { state: pct === 100 ? 'met' : pct >= 50 ? 'partial' : 'missing', detail: `${n} of ${d} ${label} (${pct}%).`, source };
}

function policy(type: PolicyType, label: string): SignalFn {
  return ({ ds, now }) => {
    const ps = ds.policies.filter((p) => p.type === type);
    if (!ps.length) return { state: 'missing', detail: `No ${label} recorded in Governance.`, source: 'Governance' };
    const current = ps.find((p) => !p.nextReview || new Date(p.nextReview) >= now);
    return current
      ? { state: 'met', detail: `${current.title}${current.version ? ' v' + current.version : ''}${current.approvedOn ? ', approved ' + current.approvedOn : ''}.`, source: 'Governance' }
      : { state: 'partial', detail: `${ps[0].title}: review overdue.`, source: 'Governance' };
  };
}

const live = (ds: Dataset) => ds.systems.filter((s) => s.status === 'live');

export const SIGNALS: Record<string, SignalFn> = {
  'GOV-02': fromRequirement(['officer', 'za-io'], 'Compliance'),
  'GOV-04': policy('data-protection-policy', 'data protection policy'),
  'GOV-05': fromRequirement(['ng-dpo-reports'], 'Compliance'),
  'REG-02': fromRequirement(['ng-registration', 'ke-registration', 'gh-registration', 'uk-fee', 'za-io'], 'Compliance'),
  'REG-03': fromRequirement(['ng-return'], 'Compliance'),
  'INV-01': ({ ds }) => {
    const s = live(ds);
    if (!s.length) return { state: 'missing', detail: 'No live systems recorded in the data map.', source: 'Data map' };
    const owned = s.filter((x) => x.owner && x.hostingCountry).length;
    return coverage('live systems have an owner and hosting country', owned, s.length, 'Data map', '');
  },
  'INV-02': fromRequirement(['ropa'], 'Compliance'),
  'INV-04': ({ ds }) => {
    const acts = ds.activities.filter((a) => a.status === 'active');
    return coverage('active processing activities are linked to systems', acts.filter((a) => a.systemIds.length > 0).length, acts.length, 'Data map', 'No active processing activities recorded.');
  },
  'LAW-01': fromRequirement(['lawful-basis'], 'Compliance'),
  'LAW-04': fromRequirement(['special-condition'], 'Compliance'),
  'LAW-07': fromRequirement(['marketing'], 'Compliance'),
  'TRN-01': fromRequirement(['notice'], 'Compliance'),
  'TRN-03': policy('cookie-notice', 'cookie notice'),
  'TRN-04': fromRequirement(['za-paia'], 'Compliance'),
  'TRN-05': policy('cctv-notice', 'monitoring or CCTV notice'),
  'RTS-01': policy('rights-procedure', 'rights request procedure'),
  'RTS-03': fromRequirement(['requests'], 'Compliance'),
  'RSK-03': fromRequirement(['dpia'], 'Compliance'),
  'LAW-02': ({ ds }) => {
    const li = ds.activities.filter((a) => a.status === 'active' && a.lawfulBasis === 'legitimate-interests');
    if (!li.length) return null;
    const done = li.filter((a) => ds.assessments.some((x) => x.kind === 'lia' && x.status === 'approved' && x.activityIds.includes(a.id))).length;
    return coverage('activities relying on legitimate interests have an approved assessment', done, li.length, 'Assessments', '');
  },
  'TPR-01': ({ ds }) => (ds.vendors.length ? { state: 'met', detail: `${ds.vendors.length} vendors recorded with role and country.`, source: 'Vendors' } : { state: 'missing', detail: 'No vendors recorded.', source: 'Vendors' }),
  'TPR-02': ({ ds }) => coverage('vendors have a completed security review', ds.vendors.filter((v) => v.securityReviewDone).length, ds.vendors.length, 'Vendors', 'No vendors recorded.'),
  'TPR-03': fromRequirement(['processor-contracts'], 'Compliance'),
  'TPR-04': fromRequirement(['transfers'], 'Compliance'),
  'TPR-05': ({ ds }) => {
    const abroad = ds.vendors.filter((v) => ds.workspace.jurisdictions.some((j) => PACKS[j].transfers && !establishedIn(j, v.country)) && ['approved-instrument', 'binding-corporate-rules'].includes(v.transferMechanism));
    if (!abroad.length) return null;
    const done = abroad.filter((v) => ds.assessments.some((x) => x.kind === 'tia' && x.vendorId === v.id && x.status === 'approved')).length;
    return coverage('vendors relying on contractual transfer safeguards have an approved transfer impact assessment', done, abroad.length, 'Assessments', '');
  },
  'TPR-06': ({ ds }) => {
    const p = ds.vendors.filter((v) => v.role === 'processor' || v.role === 'sub-processor');
    return p.length ? coverage('processors have disclosed their sub-processors', p.filter((v) => v.subprocessorsDisclosed).length, p.length, 'Vendors', '') : null;
  },
  'TPR-07': fromRequirement(['vendor-review'], 'Compliance'),
  'SEC-01': fromRequirement(['security'], 'Compliance'),
  'SEC-02': ({ ds }) => { const s = live(ds).filter((x) => x.kind !== 'paper'); return s.length ? coverage('live systems enforce MFA', s.filter((x) => x.mfa).length, s.length, 'Data map', '') : null; },
  'SEC-03': ({ ds }) => {
    const s = live(ds).filter((x) => x.kind !== 'paper');
    return s.length ? coverage('live systems are encrypted at rest and in transit', s.filter((x) => x.encryptionAtRest && x.encryptionInTransit).length, s.length, 'Data map', '') : null;
  },
  'SEC-04': ({ ds }) => { const s = live(ds).filter((x) => x.kind !== 'paper'); return s.length ? coverage('live systems log access', s.filter((x) => x.accessLogging).length, s.length, 'Data map', '') : null; },
  'SEC-05': ({ ds }) => { const s = live(ds).filter((x) => x.kind !== 'paper'); return s.length ? coverage('live systems are backed up', s.filter((x) => x.backups).length, s.length, 'Data map', '') : null; },
  'LIF-01': fromRequirement(['retention'], 'Compliance'),
  'LIF-02': ({ ds }) => { const s = live(ds).filter((x) => x.kind !== 'paper'); return s.length ? coverage('live systems delete data automatically at the end of retention', s.filter((x) => x.automatedDeletion).length, s.length, 'Data map', '') : null; },
  'INC-01': policy('breach-response', 'breach response plan'),
  'INC-03': fromRequirement(['breach'], 'Compliance'),
  'INC-05': ({ ds }) => (ds.incidents.length ? { state: 'met', detail: `${ds.incidents.length} incidents in the register.`, source: 'Incidents' } : null),
  'PPL-01': fromRequirement(['training'], 'Compliance'),
  'AIG-01': ({ ds }) => (ds.aiSystems.length ? { state: 'met', detail: `${ds.aiSystems.filter((s) => s.status !== 'retired').length} AI systems in the register.`, source: 'AI systems' } : { state: 'missing', detail: 'No AI systems recorded.', source: 'AI systems' }),
  'AIG-02': policy('ai-use', 'AI use policy'),
  'AIG-03': fromRequirement(['ai'], 'Compliance'),
};

export function signalsFor(ds: Dataset, now = new Date()): Record<string, Signal> {
  const ctx: Ctx = { ds, results: compliance(ds, now), now };
  const out: Record<string, Signal> = {};
  for (const [id, fn] of Object.entries(SIGNALS)) { const s = fn(ctx); if (s) out[id] = s; }
  return out;
}
