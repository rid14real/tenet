// Compliance per jurisdiction, worked out from the records. The same requirement key across
// jurisdictions lets the action plan show one fix that clears gaps in several places.

import { classifyAI } from './ai.js';
import { activityFacts, addMonths, auditReturnDue, daysUntil, inScope, ngCycleYear, ngTierFor } from './engine.js';
import { PACKS, establishedIn, jxName, sensitiveIn } from './jurisdictions.js';
import { breachDuties, requestStatus, systemControlsGap, vendorRisk } from './operations.js';
import type { Dataset, JurisdictionCode, PolicyType, Provenance, SectorId, Workspace } from './types.js';

export type ReqStatus = 'met' | 'partial' | 'missing' | 'na';
export type FixIn = 'profile' | 'activities' | 'systems' | 'vendors' | 'assessments' | 'incidents' | 'requests' | 'aiSystems' | 'governance';

export interface Requirement {
  key: string;
  code: JurisdictionCode;
  section: 'Registration and officers' | 'Records and lawful basis' | 'Assessments' | 'Third parties and transfers' | 'Security and incidents' | 'Rights and transparency' | 'AI' | 'Filings';
  title: string;
  ref: string;
  status: ReqStatus;
  detail: string;
  binding: boolean;
  fixIn: FixIn;
  provenance?: Provenance;
}

export interface JurisdictionResult {
  code: JurisdictionCode;
  name: string;
  requirements: Requirement[];
  score: number;
  met: number; partial: number; missing: number; applicable: number;
}

const plural = (n: number, one: string, many = one + 's') => `${n} ${n === 1 ? one : many}`;
const names = (xs: { name: string }[], max = 4) => xs.slice(0, max).map((x) => x.name).join(', ') + (xs.length > max ? ` and ${xs.length - max} more` : '');
const covers = (jx: JurisdictionCode[], code: JurisdictionCode) => !jx.length || jx.includes(code);
const KE_MANDATORY: SectorId[] = ['bank', 'fintech', 'insurer', 'mfb', 'mortgage', 'telco', 'hospital', 'higher', 'school', 'hospitality', 'transport'];

function policyStatus(ds: Dataset, code: JurisdictionCode, type: PolicyType, now: Date): { status: ReqStatus; detail: string } {
  const ps = ds.policies.filter((p) => p.type === type && covers(p.jurisdictions, code));
  if (!ps.length) return { status: 'missing', detail: 'No document recorded.' };
  const current = ps.find((p) => !p.nextReview || new Date(p.nextReview) >= now);
  if (!current) return { status: 'partial', detail: `${ps[0].title}: review overdue since ${ps[0].nextReview}.` };
  return { status: 'met', detail: `${current.title}${current.version ? ' v' + current.version : ''}${current.approvedOn ? ', approved ' + current.approvedOn : ''}.` };
}

function expiryStatus(num: unknown, expiry: unknown, now: Date, label: string): { status: ReqStatus; detail: string } {
  if (!num) return { status: 'missing', detail: `No ${label} recorded.` };
  if (!expiry) return { status: 'partial', detail: `${label} ${num}; expiry date not recorded.` };
  const d = new Date(String(expiry));
  const left = daysUntil(d, now);
  if (left < 0) return { status: 'missing', detail: `${label} ${num} expired ${String(expiry)}.` };
  if (left <= 60) return { status: 'partial', detail: `${label} ${num} expires in ${left} days. Start renewal.` };
  return { status: 'met', detail: `${label} ${num}, valid to ${String(expiry)}.` };
}

export function keRegistrationRequired(w: Workspace): { required: boolean; why: string } {
  const band = (w.jx.KE?.turnoverBand as string) ?? 'over-5m';
  if (KE_MANDATORY.includes(w.sector)) return { required: true, why: 'The sector is listed in the Third Schedule, so registration applies whatever the size.' };
  if (band === 'under-5m' && (w.employees ?? 0) < 10) return { required: false, why: 'Turnover under KES 5 million and fewer than 10 employees (reg. 13(2)).' };
  return { required: true, why: 'Above the reg. 13(2) exemption thresholds.' };
}

export function evaluateJurisdiction(code: JurisdictionCode, ds: Dataset, now = new Date()): JurisdictionResult {
  const pack = PACKS[code];
  const w = ds.workspace;
  const jx = w.jx[code] ?? {};
  const R: Requirement[] = [];
  const add = (r: Omit<Requirement, 'code'>) => R.push({ ...r, code });
  const acts = ds.activities.filter((a) => a.status === 'active' && inScope(w, a.jurisdictions).includes(code));
  const facts = acts.map((a) => ({ a, f: activityFacts(a, ds), p: activityFacts(a, ds).perJx.find((x) => x.code === code)! }));
  const largeSensitive = facts.some(({ a, p }) => p.sensitive.length > 0 && a.volume >= 10_000) || acts.some((a) => a.largeScaleMonitoring);

  // ---- Registration and officers
  if (code === 'NG') {
    add({ key: 'ng-registration', section: 'Registration and officers', title: 'Registered with the NDPC', ref: 'NDPA s.44', binding: true, fixIn: 'profile',
      status: jx.registrationNumber ? 'met' : 'missing', detail: jx.registrationNumber ? `Registration ${String(jx.registrationNumber)}.` : 'No NDPC registration number on the profile.' });
  }
  if (code === 'ZA') {
    add({ key: 'za-io', section: 'Registration and officers', title: 'Information Officer appointed and registered with the Information Regulator', ref: pack.officer.ref, binding: true, fixIn: 'profile', provenance: pack.officer.prov,
      status: jx.ioName && jx.ioRegistrationNumber ? 'met' : jx.ioName ? 'partial' : 'missing',
      detail: jx.ioName ? (jx.ioRegistrationNumber ? `${String(jx.ioName)}, registration ${String(jx.ioRegistrationNumber)}.` : `${String(jx.ioName)} named but not registered.`) : 'No Information Officer named.' });
    const paia = policyStatus(ds, code, 'paia-manual', now);
    add({ key: 'za-paia', section: 'Rights and transparency', title: 'PAIA manual published', ref: 'PAIA s.51; POPIA Regulations reg. 4', binding: true, fixIn: 'governance', ...paia });
  }
  if (code === 'KE') {
    const need = keRegistrationRequired(w);
    const st = need.required ? expiryStatus(jx.certificateNumber, jx.certificateExpiry, now, 'ODPC certificate') : { status: 'na' as ReqStatus, detail: `Not required: ${need.why}` };
    add({ key: 'ke-registration', section: 'Registration and officers', title: 'Registered with the ODPC', ref: 'Registration Regulations 2021 regs. 4, 13', binding: true, fixIn: 'profile', provenance: { source: 'Data Protection (Registration of Data Controllers and Data Processors) Regulations 2021', confidence: 'secondary' },
      status: st.status, detail: need.required ? `${st.detail} ${need.why}` : st.detail });
  }
  if (code === 'GH') {
    const st = expiryStatus(jx.registrationNumber, jx.registrationExpiry, now, 'DPC registration');
    add({ key: 'gh-registration', section: 'Registration and officers', title: 'Registered with the Data Protection Commission', ref: 'Act 843', binding: true, fixIn: 'profile', provenance: { source: 'Act 843; DPC registration requirements', confidence: 'secondary' }, ...st });
  }
  if (code === 'EG' || code === 'ZW') {
    const st = expiryStatus(jx.licenceNumber, jx.licenceExpiry, now, `${pack.regulatorShort} licence`);
    add({ key: `${code.toLowerCase()}-licence`, section: 'Registration and officers', title: `Licensed by the ${pack.regulatorShort}`, ref: pack.shortLaw, binding: true, fixIn: 'profile', provenance: { source: pack.law, confidence: 'secondary' }, ...st });
  }
  if (code === 'EU' || code === 'UK') {
    const outside = !establishedIn(code, w.establishment);
    add({ key: `${code.toLowerCase()}-representative`, section: 'Registration and officers', title: `${code === 'EU' ? 'EU' : 'UK'} representative appointed`, ref: `${pack.shortLaw} Art. 27`, binding: true, fixIn: 'profile',
      status: !outside ? 'na' : jx.representative ? 'met' : 'missing',
      detail: !outside ? `Established in ${code === 'EU' ? 'the EEA' : 'the UK'}; no representative needed.` : jx.representative ? `${String(jx.representative)}.` : `Established outside ${code === 'EU' ? 'the EEA' : 'the UK'} with no representative recorded.` });
  }
  if (code === 'UK') {
    const st = expiryStatus(jx.icoRegistration, jx.icoRenewal, now, 'ICO registration');
    add({ key: 'uk-fee', section: 'Registration and officers', title: 'Data protection fee paid to the ICO', ref: 'Data Protection (Charges and Information) Regulations 2018', binding: true, fixIn: 'profile', ...st });
  }
  // Officer
  const officerRequired = code === 'NG' || code === 'EG' || code === 'ZW' ? true : code === 'ZA' ? null : code === 'GH' ? false : largeSensitive;
  if (officerRequired !== null) {
    const named = !!w.privacyLeadName;
    const ngCred = code === 'NG' && named && !jx.dpoCredentialOnFile;
    add({ key: 'officer', section: 'Registration and officers', title: `${pack.officer.title} appointed`, ref: pack.officer.ref, binding: officerRequired, fixIn: 'profile', provenance: pack.officer.prov,
      status: named ? (ngCred ? 'partial' : 'met') : officerRequired ? 'missing' : 'na',
      detail: named ? `${w.privacyLeadName}${ngCred ? '; credential evidence not on file (GAID Art. 14).' : '.'}` : officerRequired ? `No ${pack.officer.title} named.` : `Not mandatory here${code === 'GH' ? ', though the Commission expects large controllers to have a certified supervisor' : ' at the current scale of processing'}.` });
  }

  // ---- Records and lawful basis
  if (!acts.length) {
    add({ key: 'ropa', section: 'Records and lawful basis', title: 'Record of processing kept', ref: code === 'EU' || code === 'UK' ? `${pack.shortLaw} Art. 30` : pack.bases.ref, binding: true, fixIn: 'activities', status: 'missing', detail: `No processing activities record people in ${pack.name}.` });
  } else {
    const incomplete = facts.filter(({ f }) => f.completeness.missing.length > 0);
    add({ key: 'ropa', section: 'Records and lawful basis', title: 'Record of processing complete', ref: code === 'EU' || code === 'UK' ? `${pack.shortLaw} Art. 30` : code === 'NG' ? 'NDPA s.24; GAID' : pack.bases.ref, binding: true, fixIn: 'activities',
      status: incomplete.length ? 'partial' : 'met', detail: incomplete.length ? `${plural(incomplete.length, 'activity', 'activities')} incomplete: ${incomplete.slice(0, 3).map(({ a, f }) => `${a.name} (${f.completeness.missing.join(', ')})`).join('; ')}.` : `${plural(acts.length, 'activity', 'activities')} fully recorded.` });
    const badBasis = facts.filter(({ p }) => !p.basis.ok);
    add({ key: 'lawful-basis', section: 'Records and lawful basis', title: 'Valid lawful basis for each activity', ref: pack.bases.ref, binding: true, fixIn: 'activities', provenance: pack.bases.prov,
      status: badBasis.length ? 'missing' : 'met', detail: badBasis.length ? badBasis.map(({ a, p }) => `${a.name}: ${p.basis.problem}`).join(' ') : 'Each activity has a basis available under this law.' });
    const sens = facts.filter(({ p }) => p.special.needed);
    const noCond = sens.filter(({ p }) => !p.special.ok);
    add({ key: 'special-condition', section: 'Records and lawful basis', title: `Condition recorded for ${pack.sensitive.term}`, ref: pack.special.ref, binding: true, fixIn: 'activities', provenance: pack.sensitive.prov,
      status: !sens.length ? 'na' : noCond.length ? 'missing' : 'met',
      detail: !sens.length ? `No activity processes ${pack.sensitive.term} as defined in ${pack.sensitive.ref}.` : noCond.length ? `No condition for: ${names(noCond.map(({ a }) => a))}.` : `${plural(sens.length, 'activity', 'activities')} with a recorded condition.` });
    const noRet = acts.filter((a) => !a.retentionPeriod);
    add({ key: 'retention', section: 'Records and lawful basis', title: 'Retention period set for each activity', ref: code === 'NG' ? 'NDPA s.24' : code === 'ZA' ? 'POPIA s.14' : code === 'KE' ? 'Kenya DPA s.39' : code === 'EU' || code === 'UK' ? `${pack.shortLaw} Art. 5(1)(e)` : pack.shortLaw, binding: true, fixIn: 'activities',
      status: noRet.length ? 'partial' : 'met', detail: noRet.length ? `No retention period for: ${names(noRet)}.` : 'Every activity has a retention period.' });
    const mk = facts.filter(({ p }) => p.marketing && !p.marketing.ok);
    if (facts.some(({ p }) => p.marketing)) add({ key: 'marketing', section: 'Rights and transparency', title: 'Direct marketing meets consent rules', ref: facts.find(({ p }) => p.marketing)!.p.marketing!.ref, binding: true, fixIn: 'activities',
      status: mk.length ? 'missing' : 'met', detail: mk.length ? `${names(mk.map(({ a }) => a))}: ${mk[0].p.marketing!.problem}` : 'Marketing activities rest on consent.' });
  }

  // ---- Assessments
  const needDpia = facts.filter(({ p }) => p.dpia.required);
  const notApproved = needDpia.filter(({ p }) => p.dpia.status !== 'approved');
  add({ key: 'dpia', section: 'Assessments', title: `${pack.dpia.name} for high-risk processing`, ref: pack.dpia.ref, binding: pack.dpia.binding, fixIn: 'assessments', provenance: pack.dpia.prov,
    status: !needDpia.length ? 'na' : !notApproved.length ? 'met' : notApproved.every(({ p }) => p.dpia.status === 'in-progress') ? 'partial' : 'missing',
    detail: !needDpia.length ? 'No activity meets a high-risk trigger.' : !notApproved.length ? `${plural(needDpia.length, 'assessment')} approved.` : `${needDpia.length - notApproved.length} of ${needDpia.length} approved. Outstanding: ${notApproved.map(({ a, p }) => `${a.name} (${p.dpia.reasons.map((r) => r.label).join(', ')})`).slice(0, 3).join('; ')}.` });

  // ---- Third parties and transfers
  const vendorIds = new Set(facts.flatMap(({ f }) => f.vendors.map((v) => v.id)));
  const procs = ds.vendors.filter((v) => vendorIds.has(v.id) && (v.role === 'processor' || v.role === 'sub-processor'));
  const noDpa = procs.filter((v) => !v.dpaSigned);
  add({ key: 'processor-contracts', section: 'Third parties and transfers', title: 'Written agreement with every processor', ref: code === 'NG' ? 'NDPA s.29; GAID Art. 34' : code === 'ZA' ? 'POPIA s.21' : code === 'KE' ? 'Kenya DPA s.42' : code === 'EU' || code === 'UK' ? `${pack.shortLaw} Art. 28` : pack.shortLaw, binding: true, fixIn: 'vendors',
    status: !procs.length ? 'na' : noDpa.length ? (noDpa.length < procs.length ? 'partial' : 'missing') : 'met',
    detail: !procs.length ? 'No processors linked to activities here.' : noDpa.length ? `No agreement with: ${names(noDpa)}.` : `${plural(procs.length, 'processor agreement')} in place.` });
  if (pack.transfers) {
    const tf = facts.flatMap(({ a, p }) => p.transfers.map((t) => ({ a, t })));
    const bad = tf.filter(({ t }) => !t.ok && !t.pending);
    const pend = tf.filter(({ t }) => t.pending);
    add({ key: 'transfers', section: 'Third parties and transfers', title: `Basis for each transfer out of ${pack.name}`, ref: pack.transfers.ref, binding: true, fixIn: 'vendors', provenance: pack.transfers.prov,
      status: !tf.length ? 'na' : bad.length ? 'missing' : pend.length ? 'partial' : 'met',
      detail: !tf.length ? 'No data leaves the jurisdiction.' : bad.length ? `No basis: ${[...new Set(bad.map(({ t }) => `${t.via} (${t.country})`))].join(', ')}.` : pend.length ? `Awaiting approval: ${[...new Set(pend.map(({ t }) => t.via))].join(', ')}.` : `${plural(new Set(tf.map(({ t }) => t.via)).size, 'transfer')} with a recorded basis.` });
  }
  const highVendors = ds.vendors.filter((v) => vendorIds.has(v.id) && vendorRisk(v, ds, now).tier === 'high');
  if (vendorIds.size) add({ key: 'vendor-review', section: 'Third parties and transfers', title: 'High-risk vendors reviewed', ref: 'Accountability', binding: false, fixIn: 'vendors',
    status: highVendors.some((v) => vendorRisk(v, ds, now).reviewOverdue) ? 'partial' : 'met', detail: highVendors.length ? `${plural(highVendors.length, 'high-risk vendor')}: ${names(highVendors)}.` : 'No high-risk vendors.' });

  // ---- Security and incidents
  const sysIds = new Set(facts.flatMap(({ f }) => f.systems.map((s) => s.id)));
  const systems = ds.systems.filter((s) => sysIds.has(s.id) && s.status !== 'decommissioned');
  const weak = systems.filter((s) => systemControlsGap(s).length > 0);
  const secPol = policyStatus(ds, code, 'information-security', now);
  add({ key: 'security', section: 'Security and incidents', title: 'Security measures in place', ref: code === 'NG' ? 'NDPA s.39' : code === 'ZA' ? 'POPIA s.19' : code === 'KE' ? 'Kenya DPA s.41' : code === 'EU' || code === 'UK' ? `${pack.shortLaw} Art. 32` : pack.shortLaw, binding: true, fixIn: weak.length ? 'systems' : 'governance',
    status: secPol.status === 'missing' && !systems.length ? 'missing' : weak.length || secPol.status !== 'met' ? 'partial' : 'met',
    detail: [secPol.status === 'met' ? `Policy: ${secPol.detail}` : `Security policy: ${secPol.detail}`, weak.length ? `Control gaps on ${names(weak)}.` : systems.length ? `${plural(systems.length, 'system')} with core controls.` : 'No systems linked.'].join(' ') });
  const incs = ds.incidents.filter((i) => i.jurisdictions.includes(code));
  const duties = incs.flatMap((i) => breachDuties(i, ds, now).filter((d) => d.code === code).map((d) => ({ i, d })));
  const overdue = duties.filter(({ d }) => d.state === 'overdue');
  const running = duties.filter(({ d }) => d.state === 'running' || d.state === 'no-fixed-window');
  const plan = policyStatus(ds, code, 'breach-response', now);
  add({ key: 'breach', section: 'Security and incidents', title: `Breaches notified to the ${pack.regulatorShort} on time`, ref: pack.breach.ref, binding: true, fixIn: 'incidents', provenance: pack.breach.prov,
    status: overdue.length ? 'missing' : running.length || plan.status !== 'met' ? 'partial' : 'met',
    detail: [overdue.length ? `${plural(overdue.length, 'incident')} past the ${pack.breach.window.toLowerCase()} window.` : running.length ? `${plural(running.length, 'notification')} pending.` : incs.length ? `${plural(incs.length, 'incident')} handled.` : 'No incidents logged.', plan.status === 'met' ? '' : `Breach response plan: ${plan.detail}`].filter(Boolean).join(' ') });

  // ---- Rights and transparency
  const notice = policyStatus(ds, code, 'privacy-notice', now);
  add({ key: 'notice', section: 'Rights and transparency', title: 'Privacy notice published and current', ref: code === 'NG' ? 'NDPA s.27' : code === 'ZA' ? 'POPIA s.18' : code === 'KE' ? 'Kenya DPA s.29' : code === 'EU' || code === 'UK' ? `${pack.shortLaw} Arts. 13–14` : pack.shortLaw, binding: true, fixIn: 'governance', ...notice });
  const reqs = ds.requests.filter((r) => r.jurisdiction === code);
  const late = reqs.filter((r) => requestStatus(r, ds, now).state === 'overdue');
  const proc = policyStatus(ds, code, 'rights-procedure', now);
  add({ key: 'requests', section: 'Rights and transparency', title: 'Requests answered on time', ref: Object.values(pack.rights.available).map((x) => x!.ref)[0] ? `${pack.shortLaw} ${Object.values(pack.rights.available)[0]!.ref}` : pack.shortLaw, binding: true, fixIn: 'requests', provenance: pack.rights.prov,
    status: late.length ? 'missing' : proc.status === 'met' ? 'met' : 'partial',
    detail: [late.length ? `${plural(late.length, 'request')} overdue.` : reqs.length ? `${plural(reqs.length, 'request')}, none overdue.` : 'No requests received.', proc.status === 'met' ? '' : `Request procedure: ${proc.detail}`].filter(Boolean).join(' ') });
  const tr = ds.trainings.filter((t) => covers(t.jurisdictions, code)).sort((a, b) => b.heldOn.localeCompare(a.heldOn))[0];
  const trRecent = tr && addMonths(tr.heldOn, 12) >= now;
  add({ key: 'training', section: 'Security and incidents', title: 'Staff trained in the last 12 months', ref: code === 'NG' ? 'NDPA s.39; GAID' : code === 'ZA' ? 'POPIA reg. 4(1)(e)' : 'Accountability', binding: code === 'NG' || code === 'ZA', fixIn: 'governance',
    status: !tr ? 'missing' : trRecent && tr.completionPct >= 80 ? 'met' : 'partial',
    detail: !tr ? 'No training recorded.' : `${tr.title}, ${tr.heldOn}, ${tr.completionPct}% completion${trRecent ? '' : ' (over 12 months ago)'}.` });

  // ---- AI
  const ais = ds.aiSystems.filter((s) => s.status !== 'retired' && s.markets.includes(code));
  if (ais.length) {
    const fw: Record<JurisdictionCode, string[]> = { NG: ['NDPA', 'NDPA/GAID', 'CBN'], KE: ['Kenya DPA'], ZA: ['POPIA'], EU: ['GDPR', 'EU AI Act'], UK: ['UK GDPR'], GH: [], EG: [], ZW: [] };
    const open = ais.filter((s) => classifyAI(s, { sector: w.sector, jurisdictions: w.jurisdictions, vendors: ds.vendors, assessments: ds.assessments }).obligations
      .some((o) => o.binding && o.status === 'open' && (fw[code].includes(o.framework) || o.framework === 'Data protection')));
    add({ key: 'ai', section: 'AI', title: code === 'NG' ? 'AI and emerging technology documented (GAID Arts. 43–44)' : code === 'EU' ? 'AI systems meet GDPR and AI Act duties' : 'AI systems meet automated decision rules', ref: code === 'NG' ? 'GAID Arts. 43–44; NDPA s.37' : code === 'EU' ? 'GDPR Art. 22; EU AI Act' : 'Automated decision rules', binding: true, fixIn: 'aiSystems',
      status: open.length ? (open.length < ais.length ? 'partial' : 'missing') : 'met', detail: open.length ? `Open duties on: ${names(open)}.` : `${plural(ais.length, 'AI system')} with duties met.` });
  }

  // ---- Filings
  if (code === 'NG') {
    const t = ngTierFor(w);
    const cycle = ngCycleYear(w);
    const due = auditReturnDue(cycle);
    const filed = jx.lastReturnFiledOn && new Date(String(jx.lastReturnFiledOn)) >= new Date(Date.UTC(cycle + 1, 0, 1));
    add({ key: 'ng-return', section: 'Filings', title: `Compliance Audit Return for ${cycle} filed`, ref: 'GAID 2025', binding: t.filesAuditReturn, fixIn: 'profile', provenance: { source: 'GAID 2025; NDPC filing notices', confidence: 'secondary' },
      status: !t.filesAuditReturn ? 'na' : filed ? 'met' : now > due ? 'missing' : 'partial',
      detail: !t.filesAuditReturn ? `${t.tier}: registration renewal only, no audit return.` : filed ? `Filed ${String(jx.lastReturnFiledOn)}.` : now > due ? `Overdue since ${due.toISOString().slice(0, 10)}.` : `Due ${due.toISOString().slice(0, 10)} (${daysUntil(due, now)} days). Filed through ${jx.dpcoName ? String(jx.dpcoName) : 'a licensed DPCO'}.` });
    add({ key: 'ng-dpo-reports', section: 'Filings', title: 'DPO semi-annual reports filed', ref: 'GAID Art. 13', binding: true, fixIn: 'profile', provenance: { source: 'GAID 2025 Art. 13', confidence: 'secondary' },
      status: jx.dpoReportsFiled ? 'met' : 'missing', detail: jx.dpoReportsFiled ? 'Confirmed on the profile.' : 'Not confirmed.' });
  }

  const applicable = R.filter((r) => r.status !== 'na' && r.binding);
  const met = applicable.filter((r) => r.status === 'met').length;
  const partial = applicable.filter((r) => r.status === 'partial').length;
  const missing = applicable.filter((r) => r.status === 'missing').length;
  const score = applicable.length ? Math.round(((met + partial * 0.5) / applicable.length) * 100) : 0;
  return { code, name: jxName(code), requirements: R, score, met, partial, missing, applicable: applicable.length };
}

export function compliance(ds: Dataset, now = new Date()): JurisdictionResult[] {
  return ds.workspace.jurisdictions.map((c) => evaluateJurisdiction(c, ds, now));
}

export function overallScore(results: JurisdictionResult[]) {
  return results.length ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
}

export interface Action {
  key: string;
  title: string;
  severity: 'high' | 'medium' | 'low';
  jurisdictions: JurisdictionCode[];
  refs: string[];
  details: { code: JurisdictionCode; detail: string }[];
  fixIn: FixIn;
}

const NEUTRAL: Record<string, string> = {
  dpia: 'Impact assessment for high-risk processing', officer: 'Privacy officer appointed', 'special-condition': 'Condition recorded for sensitive data',
  transfers: 'Basis for each transfer abroad', breach: 'Breaches notified to the regulator on time', ai: 'AI systems meet their legal duties',
  ropa: 'Record of processing complete', 'lawful-basis': 'Valid lawful basis for each activity', requests: 'Requests answered on time',
};

/** Gaps across all jurisdictions, merged where one fix clears several. */
export function actionPlan(ds: Dataset, now = new Date()): Action[] {
  const map = new Map<string, Action>();
  for (const res of compliance(ds, now)) {
    for (const r of res.requirements) {
      if (r.status === 'met' || r.status === 'na') continue;
      const sev: Action['severity'] = !r.binding ? 'low' : r.status === 'missing' ? 'high' : 'medium';
      const cur = map.get(r.key);
      if (cur) {
        cur.jurisdictions.push(r.code); cur.refs.push(`${PACKS[r.code].shortLaw}: ${r.ref}`); cur.details.push({ code: r.code, detail: r.detail });
        if (NEUTRAL[r.key]) cur.title = NEUTRAL[r.key];
        if (sev === 'high' || (sev === 'medium' && cur.severity === 'low')) cur.severity = sev;
      } else {
        map.set(r.key, { key: r.key, title: r.title.replace(new RegExp(` (to|by|with|out of) (the )?(${PACKS[r.code].regulatorShort}|${PACKS[r.code].name})`), ''), severity: sev, jurisdictions: [r.code], refs: [`${PACKS[r.code].shortLaw}: ${r.ref}`], details: [{ code: r.code, detail: r.detail }], fixIn: r.fixIn });
      }
    }
  }
  const rank = { high: 0, medium: 1, low: 2 };
  return [...map.values()].sort((a, b) => rank[a.severity] - rank[b.severity] || b.jurisdictions.length - a.jurisdictions.length);
}

export interface Deadline { date: Date; label: string; detail: string; code?: JurisdictionCode; fixIn: FixIn; id?: string; overdue: boolean }

export function upcoming(ds: Dataset, now = new Date(), horizonDays = 120): Deadline[] {
  const w = ds.workspace; const out: Deadline[] = [];
  const push = (d: Omit<Deadline, 'overdue'>) => { if (daysUntil(d.date, now) <= horizonDays) out.push({ ...d, overdue: d.date < now }); };
  if (w.jurisdictions.includes('NG')) {
    const t = ngTierFor(w);
    if (t.filesAuditReturn) push({ date: auditReturnDue(ngCycleYear(w)), label: 'NDPC audit return due', detail: `${ngCycleYear(w)} cycle, filed through a licensed DPCO`, code: 'NG', fixIn: 'profile' });
  }
  const exp: [JurisdictionCode, string, string][] = [['KE', 'certificateExpiry', 'ODPC certificate expires'], ['GH', 'registrationExpiry', 'DPC registration expires'], ['EG', 'licenceExpiry', 'PDPC licence expires'], ['ZW', 'licenceExpiry', 'POTRAZ licence expires'], ['UK', 'icoRenewal', 'ICO fee renewal']];
  for (const [c, k, label] of exp) { const v = w.jx[c]?.[k]; if (w.jurisdictions.includes(c) && v) push({ date: new Date(String(v)), label, detail: PACKS[c].name, code: c, fixIn: 'profile' }); }
  for (const p of ds.policies) if (p.nextReview) push({ date: new Date(p.nextReview), label: `Review ${p.title}`, detail: 'Policy review', fixIn: 'governance', id: p.id });
  for (const a of ds.assessments) if (a.nextReview && a.status === 'approved') push({ date: new Date(a.nextReview), label: `Review ${a.title}`, detail: 'Assessment review', fixIn: 'assessments', id: a.id });
  for (const v of ds.vendors) { const r = vendorRisk(v, ds, now); if (r.reviewDue && r.tier !== 'low') push({ date: r.reviewDue, label: `Review vendor ${v.name}`, detail: `${r.tier} risk`, fixIn: 'vendors', id: v.id }); }
  for (const i of ds.incidents) for (const d of breachDuties(i, ds, now)) if (d.deadline && (d.state === 'running' || d.state === 'overdue')) push({ date: d.deadline, label: `Notify ${PACKS[d.code].regulatorShort}: ${i.title}`, detail: d.ref, code: d.code, fixIn: 'incidents', id: i.id });
  for (const r of ds.requests.filter((x) => w.jurisdictions.includes(x.jurisdiction))) { const s = requestStatus(r, ds, now); if (s.due) push({ date: s.due, label: `Answer ${r.requester}`, detail: `${r.type.replace(/-/g, ' ')} request`, code: r.jurisdiction, fixIn: 'requests', id: r.id }); }
  return out.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export { sensitiveIn };
