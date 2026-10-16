// Bring records saved by version 0.1 up to the current shape. Safe to run on current records.

import { COLLECTION_META } from './schemas.js';
import type { CollectionName, Dataset, JurisdictionCode, Workspace } from './types.js';

type Any = Record<string, unknown>;
const arr = (v: unknown) => (Array.isArray(v) ? v : []);
const CAT_GUESS: [RegExp, string][] = [[/bvn|nin|passport|id/i, 'gov-id'], [/name/i, 'name'], [/phone|email|address|contact/i, 'contact'], [/health|sick|medical/i, 'health'], [/salary|income/i, 'income'], [/bank|account|payment/i, 'financial'], [/transaction/i, 'transactions'], [/image|photo|cctv/i, 'images'], [/device/i, 'device'], [/biometric|finger/i, 'biometric']];

export function migrateWorkspace(raw: Any): Workspace {
  if (raw.jx && typeof raw.jx === 'object') return { establishment: 'NG', role: 'controller', ...raw } as unknown as Workspace;
  const jx: Partial<Record<JurisdictionCode, Any>> = {};
  const jurisdictions = (arr(raw.jurisdictions) as JurisdictionCode[]).filter((j) => ['NG', 'ZA', 'KE', 'GH', 'EG', 'ZW', 'EU', 'UK'].includes(j));
  const att = (raw.attestations ?? {}) as Record<string, { value?: boolean }>;
  jx.NG = { registrationNumber: raw.registrationNumber, dataSubjects6m: raw.dataSubjects6m, cycleYear: raw.cycleYear, dpoCredentialOnFile: raw.dpoCredentialOnFile, dpoReportsFiled: !!att.dpoReports?.value };
  return {
    id: String(raw.id), name: String(raw.name ?? 'Untitled'), sector: (raw.sector as Workspace['sector']) ?? 'other', establishment: 'NG',
    jurisdictions: jurisdictions.length ? jurisdictions : ['NG'], role: 'controller', privacyLeadName: raw.dpoName as string | undefined, privacyLeadEmail: raw.dpoEmail as string | undefined,
    jx, sample: !!raw.sample, createdAt: String(raw.createdAt ?? new Date().toISOString()), updatedAt: String(raw.updatedAt ?? new Date().toISOString()),
  };
}

export function migrateRecord(col: CollectionName, raw: Any, ws: Workspace): Any {
  const r = { ...raw };
  if (col === 'activities') {
    if (!r.dataCategoryIds) {
      const cats = new Set<string>();
      for (const s of arr(r.dataCategories) as string[]) { const hit = CAT_GUESS.find(([re]) => re.test(s)); if (hit) cats.add(hit[1]); }
      r.dataCategoryIds = [...cats];
    }
    r.jurisdictions ??= [...ws.jurisdictions];
    r.capacity ??= 'controller'; r.source ??= 'data-subject'; r.systemIds ??= []; r.vendorIds ??= []; r.directMarketing ??= false;
    if (r.retention && !r.retentionPeriod) r.retentionPeriod = r.retention;
    if (r.lawfulBasis === 'public-interest') r.lawfulBasis = 'public-task';
  }
  if (col === 'vendors') { r.certifications ??= []; r.breachLast24m ??= false; r.subprocessorsDisclosed ??= false; if (r.transferMechanism === 'not-needed') r.transferMechanism = 'none'; }
  if (col === 'assessments') {
    r.activityIds ??= r.activityId ? [r.activityId] : [];
    r.risks ??= []; r.answers ??= {};
    if (r.kind === 'ai-impact') r.kind = 'aia';
  }
  if (col === 'incidents') {
    r.cause ??= 'other'; r.dataCategoryIds ??= []; r.systemIds ??= []; r.dataUnintelligible ??= false;
    r.likelihoodOfHarm ??= r.highRiskToSubjects ? 'high' : 'medium'; r.severityOfHarm ??= r.highRiskToSubjects ? 'high' : 'medium';
    r.stage ??= r.status === 'closed' ? 'closed' : r.status === 'contained' ? 'contained' : 'triage';
    if (r.notified && !r.notifications) r.notifications = Object.fromEntries(Object.entries(r.notified as Any).map(([k, v]) => [k, { at: v }]));
  }
  if (col === 'requests') {
    if (r.type === 'automated-decision-review') r.type = 'automated-decision';
    r.stage ??= r.status === 'completed' ? 'responded' : r.status === 'refused' ? 'refused' : r.status === 'in-progress' ? 'in-progress' : 'received';
    r.extended ??= false;
  }
  // Fill any field the current version expects with its default.
  for (const f of COLLECTION_META[col].fields) if (r[f.key] === undefined && f.default !== undefined) r[f.key] = Array.isArray(f.default) ? [...f.default] : f.default;
  if (col === 'activities' && !(r.jurisdictions as unknown[]).length) r.jurisdictions = [...ws.jurisdictions];
  return r;
}

export function migrateDataset(raw: Any): Dataset {
  const workspace = migrateWorkspace(raw.workspace as Any);
  const out: Any = { workspace };
  for (const c of ['activities', 'systems', 'vendors', 'assessments', 'incidents', 'requests', 'aiSystems', 'policies', 'trainings', 'tasks'] as CollectionName[]) {
    out[c] = (arr(raw[c]) as Any[]).map((r) => migrateRecord(c, r, workspace));
  }
  return out as unknown as Dataset;
}
