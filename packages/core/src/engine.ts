// Shared calculations: Nigerian tiering, data map facts, DPIA screening per jurisdiction, clocks.

import { PACKS, sensitiveIn } from './jurisdictions.js';
import { countryName } from './taxonomy.js';
import type {
  Assessment, Dataset, JurisdictionCode, ProcessingActivity, Provenance, SectorId, System, Vendor, Workspace,
} from './types.js';

// ---------------------------------------------------------------- Nigeria: DCPMI tier

export type Tier = 'UHL' | 'EHL' | 'OHL';
const RANK: Record<Tier, number> = { OHL: 0, EHL: 1, UHL: 2 };
const NG_SECTOR_TIER: Partial<Record<SectorId, Tier>> = {
  bank: 'UHL', fintech: 'UHL', insurer: 'UHL', telco: 'UHL', multinational: 'UHL',
  mfb: 'EHL', mortgage: 'EHL', hospital: 'EHL', higher: 'EHL', mda: 'EHL',
};
export const NG_TIER_RULES = {
  uhlAbove: 5000, ehlFrom: 1000,
  provenance: { source: 'GAID 2025, DCPMI classification (as summarised in Templars client alert, Jan 2026)', confidence: 'secondary', note: 'Other summaries give different volume bands. Check against the GAID schedules and current NDPC registration guidance.' } as Provenance,
};
export const TIER_LABEL: Record<Tier, string> = { UHL: 'Ultra-High Level', EHL: 'Extra-High Level', OHL: 'Ordinary-High Level' };
export const NG_RETURN = {
  dueMonth: 3, dueDay: 31, feeRangeNgn: [100_000, 1_000_000] as [number, number],
  penalty: 'Up to 2% of prior-year gross revenue or ₦10m, whichever is greater',
  provenance: { source: 'GAID 2025; NDPC filing notices', confidence: 'secondary', note: 'The 2025 return deadline was extended to 30 May 2026. Confirm each cycle against the NDPC notice.' } as Provenance,
};

export interface TierResult { tier: Tier; bySector: Tier; byVolume: Tier; filesAuditReturn: boolean; explanation: string; provenance: Provenance }

export function ngTier(sector: SectorId, dataSubjects6m: number): TierResult {
  const bySector = NG_SECTOR_TIER[sector] ?? 'OHL';
  const n = Math.max(0, Math.floor(dataSubjects6m || 0));
  const byVolume: Tier = n > NG_TIER_RULES.uhlAbove ? 'UHL' : n >= NG_TIER_RULES.ehlFrom ? 'EHL' : 'OHL';
  const tier = RANK[bySector] >= RANK[byVolume] ? bySector : byVolume;
  const fmt = n.toLocaleString('en-GB');
  const explanation = bySector === byVolume
    ? `Sector and volume (${fmt} data subjects in six months) both point to ${tier}.`
    : `Sector alone gives ${bySector}; ${fmt} data subjects in six months gives ${byVolume}. The higher tier applies.`;
  return { tier, bySector, byVolume, filesAuditReturn: tier !== 'OHL', explanation, provenance: NG_TIER_RULES.provenance };
}

export const ngTierFor = (w: Workspace) => ngTier(w.sector, Number(w.jx.NG?.dataSubjects6m ?? 0));
export const ngCycleYear = (w: Workspace) => Number(w.jx.NG?.cycleYear ?? new Date().getUTCFullYear());

export function auditReturnDue(cycleYear: number): Date {
  return new Date(Date.UTC(cycleYear + 1, NG_RETURN.dueMonth - 1, NG_RETURN.dueDay, 22, 59, 0));
}

export const daysUntil = (target: Date, now: Date = new Date()) => Math.ceil((target.getTime() - now.getTime()) / 86_400_000);
export const addMonths = (iso: string, months: number) => { const d = new Date(iso); d.setUTCMonth(d.getUTCMonth() + months); return d; };

/** Jurisdictions that apply to this entity and to a record (record list ∩ entity list). */
export const inScope = (w: Workspace, list?: JurisdictionCode[]) => (list && list.length ? list.filter((j) => w.jurisdictions.includes(j)) : [...w.jurisdictions]);

// ---------------------------------------------------------------- Data map

export interface TransferFact { country: string; via: string; kind: 'system' | 'vendor'; mechanism?: string; ok: boolean; pending: boolean }
export interface DpiaFact { required: boolean; binding: boolean; reasons: { id: string; label: string }[]; status: 'approved' | 'in-progress' | 'none' }
export interface ActivityJxFacts {
  code: JurisdictionCode;
  basis: { ok: boolean; ref?: string; problem?: string };
  sensitive: string[];
  special: { needed: boolean; ok: boolean; ref: string };
  dpia: DpiaFact;
  transfers: TransferFact[];
  marketing?: { ok: boolean; ref: string; problem?: string };
}
export interface ActivityFacts {
  jurisdictions: JurisdictionCode[];
  systems: System[];
  vendors: Vendor[];
  countries: string[];
  perJx: ActivityJxFacts[];
  completeness: { score: number; missing: string[] };
}

export const DPIA_SCALE_THRESHOLD = 10_000;

export function dpiaTriggersFor(a: ProcessingActivity, code: JurisdictionCode, hasForeignTransfer: boolean) {
  const sens = sensitiveIn(code, a.dataCategoryIds);
  const r: { id: string; label: string }[] = [];
  if (sens.length) r.push({ id: 'sensitive', label: `${PACKS[code].sensitive.term} (${sens.length} categor${sens.length === 1 ? 'y' : 'ies'})` });
  if (a.dataCategoryIds.includes('children')) r.push({ id: 'children', label: "children's data" });
  if (a.automatedDecisions) r.push({ id: 'automated', label: 'automated decisions with significant effect' });
  if (a.largeScaleMonitoring) r.push({ id: 'monitoring', label: 'systematic or large-scale monitoring' });
  if (a.newTechnology) r.push({ id: 'newtech', label: 'new technology such as AI or biometrics' });
  if ((a.volume || 0) >= DPIA_SCALE_THRESHOLD) r.push({ id: 'scale', label: `large scale (${(a.volume || 0).toLocaleString('en-GB')} people)` });
  if (hasForeignTransfer && sens.length) r.push({ id: 'transfer-sensitive', label: 'sensitive data sent abroad' });
  return r;
}

export function dpiaStatusFor(activityId: string, assessments: Assessment[]): DpiaFact['status'] {
  const mine = assessments.filter((x) => (x.kind === 'dpia' || x.kind === 'aia') && x.activityIds.includes(activityId));
  if (mine.some((x) => x.status === 'approved')) return 'approved';
  return mine.length ? 'in-progress' : 'none';
}

export function activityFacts(a: ProcessingActivity, ds: Dataset): ActivityFacts {
  const w = ds.workspace;
  const jurisdictions = inScope(w, a.jurisdictions);
  const systems = ds.systems.filter((s) => a.systemIds.includes(s.id));
  const vendorIds = new Set([...a.vendorIds, ...systems.map((s) => s.vendorId).filter(Boolean) as string[]]);
  const vendors = ds.vendors.filter((v) => vendorIds.has(v.id));
  const locs: { country: string; via: string; kind: 'system' | 'vendor'; vendor?: Vendor; system?: System }[] = [
    ...systems.map((s) => ({ country: s.hostingCountry, via: s.name, kind: 'system' as const, system: s, vendor: s.vendorId ? ds.vendors.find((v) => v.id === s.vendorId) : undefined })),
    ...vendors.filter((v) => !systems.some((s) => s.vendorId === v.id)).map((v) => ({ country: v.country, via: v.name, kind: 'vendor' as const, vendor: v })),
  ];
  const countries = [...new Set(locs.map((l) => l.country).filter(Boolean))];

  const perJx = jurisdictions.map((code): ActivityJxFacts => {
    const pack = PACKS[code];
    const basisRef = a.lawfulBasis ? pack.bases.available[a.lawfulBasis] : undefined;
    const basis = !a.lawfulBasis
      ? { ok: false, problem: 'No lawful basis recorded.' }
      : basisRef ? { ok: true, ref: `${pack.shortLaw} ${basisRef}` } : { ok: false, problem: `${pack.shortLaw} has no equivalent of this basis.` };
    const sensitive = sensitiveIn(code, a.dataCategoryIds);
    const transfers: TransferFact[] = pack.transfers
      ? locs.filter((l) => l.country && !pack.transfers!.isDomestic(l.country)).map((l) => {
          const mech = l.vendor?.transferMechanism ?? (l.system as System & { transferMechanism?: string })?.transferMechanism;
          return { country: l.country, via: l.via, kind: l.kind, mechanism: mech, ok: !!mech && mech !== 'none' && mech !== 'pending-approval', pending: mech === 'pending-approval' };
        })
      : [];
    const reasons = dpiaTriggersFor(a, code, transfers.length > 0);
    const dpia: DpiaFact = { required: reasons.length > 0, binding: pack.dpia.binding, reasons, status: dpiaStatusFor(a.id, ds.assessments) };
    const marketingRule = code === 'ZA' ? { ref: 'POPIA s.69', text: 'Electronic direct marketing needs consent unless the person is an existing customer.' }
      : code === 'KE' ? { ref: 'Kenya DPA s.37', text: 'Commercial use of personal data needs consent or an opt-out offered at each contact.' }
      : code === 'EU' || code === 'UK' ? { ref: code === 'EU' ? 'ePrivacy Directive Art. 13' : 'PECR reg. 22', text: 'Electronic marketing needs consent, or the soft opt-in for existing customers.' }
      : code === 'NG' ? { ref: 'NDPA s.25; GAID', text: 'Direct marketing should rest on consent with an easy opt-out.' } : null;
    const marketing = a.directMarketing && marketingRule
      ? { ok: a.lawfulBasis === 'consent', ref: marketingRule.ref, problem: a.lawfulBasis === 'consent' ? undefined : marketingRule.text }
      : undefined;
    return {
      code, basis, sensitive,
      special: { needed: sensitive.length > 0, ok: sensitive.length === 0 || !!a.specialCondition, ref: pack.special.ref },
      dpia, transfers, marketing,
    };
  });

  const missing: string[] = [];
  if (!a.purpose) missing.push('purpose');
  if (!a.lawfulBasis) missing.push('lawful basis');
  if (!a.dataSubjectTypes.length) missing.push('data subjects');
  if (!a.dataCategoryIds.length) missing.push('data categories');
  if (!a.retentionPeriod) missing.push('retention period');
  if (!a.systemIds.length && !a.vendorIds.length) missing.push('where the data is held');
  if (!a.owner && !a.department) missing.push('owner');
  if (perJx.some((p) => p.special.needed) && !a.specialCondition) missing.push('condition for sensitive data');
  const total = 8;
  return { jurisdictions, systems, vendors, countries, perJx, completeness: { score: Math.round(((total - missing.length) / total) * 100), missing } };
}

export const describeCountries = (cs: string[]) => cs.map(countryName).join(', ');

// ---------------------------------------------------------------- Clocks

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
