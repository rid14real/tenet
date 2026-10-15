// Compliance Audit Return readiness, computed from the records rather than ticked by hand.

import { classifyAI } from './ai.js';
import { breachClocks, classifyTier, dpiaStatusFor, dpiaTriggers, requestClock } from './engine.js';
import type { AttestationKey, Dataset } from './types.js';

export type ReqStatus = 'met' | 'partial' | 'missing' | 'na';

export interface CarRequirement {
  id: string;
  section: string;
  title: string;
  ref: string;
  status: ReqStatus;
  detail: string;
  /** Where in the app to fix it. */
  fixIn: 'profile' | 'activities' | 'vendors' | 'assessments' | 'incidents' | 'requests' | 'aiSystems' | 'attestations';
  attestation?: AttestationKey;
}

export interface CarReadiness {
  requirements: CarRequirement[];
  score: number; // 0-100
  met: number;
  partial: number;
  missing: number;
  applicable: number;
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;

export function carReadiness(ds: Dataset, now: Date = new Date()): CarReadiness {
  const { workspace: w } = ds;
  const active = ds.activities.filter((a) => a.status === 'active');
  const req: CarRequirement[] = [];

  const att = (key: AttestationKey, id: string, section: string, title: string, ref: string, missingText: string) => {
    const a = w.attestations?.[key];
    req.push({
      id, section, title, ref, fixIn: 'attestations', attestation: key,
      status: a?.value ? 'met' : 'missing',
      detail: a?.value ? `Confirmed${a.by ? ' by ' + a.by : ''}${a.at ? ' on ' + a.at.slice(0, 10) : ''}${a.note ? ': ' + a.note : ''}` : missingText,
    });
  };

  // Governance
  req.push({
    id: 'registration', section: 'Governance', title: 'Registered with the NDPC as a data controller or processor of major importance', ref: 'NDPA s.44',
    fixIn: 'profile', status: w.registrationNumber ? 'met' : 'missing',
    detail: w.registrationNumber ? `Registration ${w.registrationNumber}` : 'No NDPC registration number on the profile.',
  });
  req.push({
    id: 'dpo', section: 'Governance', title: 'DPO appointed, with credential evidence on file', ref: 'NDPA s.32 · GAID Art. 14', fixIn: 'profile',
    status: w.dpoName ? (w.dpoCredentialOnFile ? 'met' : 'partial') : 'missing',
    detail: w.dpoName ? (w.dpoCredentialOnFile ? `${w.dpoName}; credential on file` : `${w.dpoName}; credential evidence not on file`) : 'No DPO named on the profile.',
  });
  att('dpoReports', 'dpo-reports', 'Governance', 'DPO semi-annual reports filed', 'GAID Art. 13', 'Not confirmed.');
  att('privacyNotice', 'notice', 'Governance', 'Privacy notice published and current', 'NDPA s.27', 'Not confirmed.');

  // Records
  const noBasis = active.filter((a) => !a.lawfulBasis || !a.purpose);
  req.push({
    id: 'ropa', section: 'Records', title: 'Record of processing with a documented lawful basis', ref: 'NDPA s.25 · GAID Art. 16(3)', fixIn: 'activities',
    status: active.length === 0 ? 'missing' : noBasis.length === 0 ? 'met' : 'partial',
    detail: active.length === 0 ? 'No processing activities recorded.'
      : noBasis.length === 0 ? `${plural(active.length, 'activity', 'activities')} recorded, each with purpose and lawful basis.`
      : `${plural(noBasis.length, 'activity', 'activities')} missing purpose or lawful basis: ${noBasis.map((a) => a.name).join(', ')}.`,
  });
  const noRetention = active.filter((a) => !a.retention);
  req.push({
    id: 'retention', section: 'Records', title: 'Retention period set for each activity', ref: 'NDPA s.24', fixIn: 'activities',
    status: active.length === 0 ? 'missing' : noRetention.length === 0 ? 'met' : 'partial',
    detail: noRetention.length === 0 && active.length ? 'Every activity has a retention period.' : active.length === 0 ? 'No processing activities recorded.' : `No retention period for: ${noRetention.map((a) => a.name).join(', ')}.`,
  });

  // Assessments
  const needDpia = active.filter((a) => dpiaTriggers(a).length > 0);
  const dpiaGaps = needDpia.filter((a) => dpiaStatusFor(a, ds.assessments) !== 'approved');
  const dpiaInProgress = dpiaGaps.filter((a) => dpiaStatusFor(a, ds.assessments) === 'in-progress');
  req.push({
    id: 'dpia', section: 'Assessments', title: 'DPIAs approved for high-risk processing', ref: 'NDPA s.28 · GAID Art. 28', fixIn: 'assessments',
    status: needDpia.length === 0 ? 'na' : dpiaGaps.length === 0 ? 'met' : dpiaGaps.length === dpiaInProgress.length ? 'partial' : 'missing',
    detail: needDpia.length === 0 ? 'No activity meets a DPIA trigger.'
      : dpiaGaps.length === 0 ? `${plural(needDpia.length, 'DPIA')} approved.`
      : `${needDpia.length - dpiaGaps.length} of ${needDpia.length} required DPIAs approved. Outstanding: ${dpiaGaps.map((a) => a.name).join(', ')}.`,
  });
  const liveAI = ds.aiSystems.filter((s) => s.status !== 'retired' && s.personalData);
  const aiOpen = liveAI.filter((s) => classifyAI(s, { sector: w.sector, vendors: ds.vendors, assessments: ds.assessments }).obligations.some((o) => o.binding && o.status === 'open' && o.framework === 'NDPA/GAID'));
  req.push({
    id: 'emerging-tech', section: 'Assessments', title: 'AI and emerging-technology parameters documented', ref: 'GAID Arts. 43–44', fixIn: 'aiSystems',
    status: liveAI.length === 0 ? 'na' : aiOpen.length === 0 ? 'met' : aiOpen.length < liveAI.length ? 'partial' : 'missing',
    detail: liveAI.length === 0 ? 'No AI systems processing personal data are registered.'
      : aiOpen.length === 0 ? `${plural(liveAI.length, 'AI system')} documented.`
      : `Open NDPA/GAID duties on: ${aiOpen.map((s) => s.name).join(', ')}.`,
  });

  // Third parties and transfers
  const processors = ds.vendors.filter((v) => v.role === 'processor' || v.role === 'sub-processor');
  const noDpa = processors.filter((v) => !v.dpaSigned);
  req.push({
    id: 'processor-agreements', section: 'Third parties and transfers', title: 'Written agreements with every processor', ref: 'NDPA s.29 · GAID Art. 34', fixIn: 'vendors',
    status: processors.length === 0 ? 'na' : noDpa.length === 0 ? 'met' : noDpa.length < processors.length ? 'partial' : 'missing',
    detail: processors.length === 0 ? 'No processors recorded.' : noDpa.length === 0 ? `${plural(processors.length, 'processor agreement')} in place.` : `No agreement with: ${noDpa.map((v) => v.name).join(', ')}.`,
  });
  const foreign = ds.vendors.filter((v) => v.country && v.country !== 'NG');
  const noMech = foreign.filter((v) => v.transferMechanism === 'none' || v.transferMechanism === 'not-needed');
  const pending = foreign.filter((v) => v.transferMechanism === 'pending-approval');
  const xbActivities = active.filter((a) => a.crossBorder);
  req.push({
    id: 'transfers', section: 'Third parties and transfers', title: 'Lawful basis recorded for each transfer out of Nigeria', ref: 'NDPA ss.41–43', fixIn: 'vendors',
    status: foreign.length === 0 && xbActivities.length === 0 ? 'na' : noMech.length > 0 ? 'missing' : pending.length > 0 ? 'partial' : 'met',
    detail: foreign.length === 0 && xbActivities.length === 0 ? 'No transfers out of Nigeria recorded.'
      : noMech.length > 0 ? `No transfer basis for: ${noMech.map((v) => `${v.name} (${v.country})`).join(', ')}.`
      : pending.length > 0 ? `Awaiting NDPC approval for: ${pending.map((v) => v.name).join(', ')}.`
      : `${plural(foreign.length, 'foreign recipient')} with a recorded basis.`,
  });

  // Security and incidents
  att('securityMeasures', 'security', 'Security and incidents', 'Technical and organisational security measures evidenced', 'NDPA s.39', 'Not confirmed.');
  let overdue = 0; let running = 0;
  for (const inc of ds.incidents) {
    if (!inc.jurisdictions.includes('NG')) continue;
    const ng = breachClocks(inc, now).find((c) => c.jurisdiction === 'NG');
    if (ng?.state === 'overdue') overdue++;
    if (ng?.state === 'running') running++;
  }
  req.push({
    id: 'breach-register', section: 'Security and incidents', title: 'Breach register kept and NDPC notified within 72 hours', ref: 'NDPA s.40', fixIn: 'incidents',
    status: overdue > 0 ? 'missing' : running > 0 ? 'partial' : 'met',
    detail: overdue > 0 ? `${plural(overdue, 'incident')} past the 72-hour NDPC window without notification or a recorded decision.`
      : running > 0 ? `${plural(running, 'incident')} with the NDPC clock still running.`
      : ds.incidents.length ? `${plural(ds.incidents.length, 'incident')} logged, none outstanding.` : 'Register kept; no incidents logged this cycle.',
  });

  // Rights and training
  const overdueReq = ds.requests.filter((r) => requestClock(r, now).state === 'overdue');
  req.push({
    id: 'requests', section: 'Rights and training', title: 'Data subject requests and complaints answered on time', ref: 'NDPA ss.34–38 · GAID Art. 40', fixIn: 'requests',
    status: overdueReq.length ? 'missing' : 'met',
    detail: overdueReq.length ? `${plural(overdueReq.length, 'request')} overdue.` : ds.requests.length ? `${plural(ds.requests.length, 'request')} logged, none overdue.` : 'Log kept; no requests received this cycle.',
  });
  att('training', 'training', 'Rights and training', 'Staff data protection training recorded', 'NDPA s.39', 'Not confirmed.');

  const applicable = req.filter((r) => r.status !== 'na');
  const met = applicable.filter((r) => r.status === 'met').length;
  const partial = applicable.filter((r) => r.status === 'partial').length;
  const missing = applicable.filter((r) => r.status === 'missing').length;
  const score = applicable.length ? Math.round(((met + partial * 0.5) / applicable.length) * 100) : 0;
  return { requirements: req, score, met, partial, missing, applicable: applicable.length };
}

export function workspaceSummary(ds: Dataset, now: Date = new Date()) {
  const tier = classifyTier(ds.workspace.sector, ds.workspace.dataSubjects6m);
  const car = carReadiness(ds, now);
  const openIncidents = ds.incidents.filter((i) => i.status !== 'closed').length;
  const openRequests = ds.requests.filter((r) => r.status !== 'completed' && r.status !== 'refused').length;
  return { tier, car, openIncidents, openRequests, aiSystems: ds.aiSystems.filter((s) => s.status !== 'retired').length };
}
