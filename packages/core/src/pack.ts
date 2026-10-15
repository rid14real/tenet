// Filing pack: a Markdown preparation pack for the DPCO to review before filing through the NDPC portal.

import { AI_DOMAINS, classifyAI } from './ai.js';
import { carReadiness } from './car.js';
import { auditReturnDue, breachClocks, classifyTier, dpiaStatusFor, dpiaTriggers } from './engine.js';
import { COUNTRY_NAMES, LAWFUL_BASES, REQUEST_TYPES, TIER_LABEL, sectorById } from './rules.js';
import type { Dataset } from './types.js';

const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const date = (iso?: string) => (iso ? iso.slice(0, 10) : '—');
const STATUS: Record<string, string> = { met: 'Met', partial: 'Partly met', missing: 'Missing', na: 'Not applicable' };

export function filingPackMarkdown(ds: Dataset, opts: { preparedBy?: string; now?: Date } = {}): string {
  const now = opts.now ?? new Date();
  const w = ds.workspace;
  const tier = classifyTier(w.sector, w.dataSubjects6m);
  const car = carReadiness(ds, now);
  const due = auditReturnDue(w.cycleYear);
  const L: string[] = [];
  const active = ds.activities.filter((a) => a.status === 'active');

  L.push(`# Compliance Audit Return: preparation pack`);
  L.push('');
  L.push(`**Controller:** ${w.name}  `);
  L.push(`**Sector:** ${sectorById(w.sector).label}  `);
  L.push(`**Classification:** ${tier.tier} (${TIER_LABEL[tier.tier]}). ${tier.explanation}  `);
  L.push(`**Audit cycle:** ${w.cycleYear}, return due ${due.toISOString().slice(0, 10)}  `);
  L.push(`**DPO:** ${w.dpoName ?? 'Not appointed'}${w.dpoEmail ? ' (' + w.dpoEmail + ')' : ''}  `);
  L.push(`**NDPC registration:** ${w.registrationNumber ?? 'Not recorded'}  `);
  L.push(`**Prepared:** ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC${opts.preparedBy ? ' by ' + opts.preparedBy : ''}`);
  L.push('');
  L.push(`> Preparation pack for review by a licensed DPCO. It is not an NDPC form and is not filed by this platform. Classification thresholds follow ${tier.provenance.source} (${tier.provenance.confidence} source).`);
  L.push('');
  if (!tier.filesAuditReturn) {
    L.push(`At ${tier.tier} the controller renews registration but does not file an audit return. This pack documents readiness for inspection.`);
    L.push('');
  }

  L.push(`## 1. Readiness summary`);
  L.push('');
  L.push(`Readiness **${car.score}%**: ${car.met} met, ${car.partial} partly met, ${car.missing} missing, of ${car.applicable} applicable requirements.`);
  L.push('');
  L.push(`| Requirement | Reference | Status | Evidence |`);
  L.push(`|---|---|---|---|`);
  for (const r of car.requirements) L.push(`| ${esc(r.title)} | ${esc(r.ref)} | ${STATUS[r.status]} | ${esc(r.detail)} |`);
  L.push('');

  const gaps = car.requirements.filter((r) => r.status === 'missing' || r.status === 'partial');
  L.push(`## 2. Gaps for DPCO review`);
  L.push('');
  if (gaps.length === 0) L.push('No gaps found against the requirements above.');
  else gaps.forEach((g, i) => L.push(`${i + 1}. **${g.title}** (${g.ref}): ${g.detail}`));
  L.push('');

  L.push(`## 3. Record of processing`);
  L.push('');
  if (!active.length) L.push('No processing activities recorded.');
  else {
    L.push(`| Activity | Purpose | Lawful basis | Data categories | Volume | Retention | DPIA |`);
    L.push(`|---|---|---|---|---|---|---|`);
    for (const a of active) {
      const basis = LAWFUL_BASES.find((b) => b.id === a.lawfulBasis)?.label ?? 'Not set';
      const trig = dpiaTriggers(a);
      const dpia = trig.length ? ({ approved: 'Approved', 'in-progress': 'In progress', none: 'Required, not started' }[dpiaStatusFor(a, ds.assessments)]) : 'Not required';
      L.push(`| ${esc(a.name)} | ${esc(a.purpose)} | ${esc(basis)} | ${esc(a.dataCategories.join(', '))}${a.sensitive ? ' (sensitive)' : ''} | ${a.volume.toLocaleString('en-GB')} | ${esc(a.retention ?? 'Not set')} | ${dpia} |`);
    }
  }
  L.push('');

  L.push(`## 4. Processors and transfers`);
  L.push('');
  if (!ds.vendors.length) L.push('No vendors recorded.');
  else {
    L.push(`| Vendor | Service | Role | Location | Agreement | Transfer basis |`);
    L.push(`|---|---|---|---|---|---|`);
    for (const v of ds.vendors) L.push(`| ${esc(v.name)} | ${esc(v.service)} | ${v.role} | ${esc(COUNTRY_NAMES[v.country] ?? v.country)} | ${v.dpaSigned ? 'Signed ' + date(v.dpaDate) : 'None'} | ${v.country === 'NG' ? 'Not needed' : v.transferMechanism} |`);
  }
  L.push('');

  L.push(`## 5. Assessments`);
  L.push('');
  if (!ds.assessments.length) L.push('No assessments recorded.');
  else for (const a of ds.assessments) L.push(`- **${esc(a.title)}** (${a.kind.toUpperCase()}): ${a.status}${a.residualRisk ? ', residual risk ' + a.residualRisk : ''}${a.approvedBy ? ', approved by ' + a.approvedBy + ' on ' + date(a.approvedOn) : ''}.`);
  L.push('');

  L.push(`## 6. AI and emerging technology (GAID Arts. 43–44)`);
  L.push('');
  const ais = ds.aiSystems.filter((s) => s.status !== 'retired');
  if (!ais.length) L.push('No AI systems registered.');
  for (const s of ais) {
    const c = classifyAI(s, { sector: w.sector, vendors: ds.vendors, assessments: ds.assessments });
    L.push(`### ${s.name}`);
    L.push(`- Purpose: ${s.purpose}`);
    L.push(`- Domain: ${AI_DOMAINS.find((d) => d.id === s.domain)?.label}; sourcing: ${s.sourcing}; status: ${s.status}`);
    L.push(`- Decision role: ${s.decisionRole}${s.significantEffect ? ', significant effect on individuals' : ''}`);
    L.push(`- Human oversight: ${s.humanOversight || 'Not documented'}`);
    L.push(`- Risk: ${c.risk}${c.reasons.length ? ' (' + c.reasons.join('; ') + ')' : ''}`);
    const open = c.obligations.filter((o) => o.binding && o.status === 'open');
    if (open.length) L.push(`- Open binding duties: ${open.map((o) => `${o.ref}: ${o.requirement}`).join(' ')}`);
    L.push('');
  }

  L.push(`## 7. Incidents`);
  L.push('');
  if (!ds.incidents.length) L.push('No incidents logged this cycle.');
  for (const i of ds.incidents) {
    const ng = breachClocks(i, now).find((c) => c.jurisdiction === 'NG');
    L.push(`- **${esc(i.title)}**: aware ${i.awareAt.slice(0, 16).replace('T', ' ')} UTC, ${i.affectedCount.toLocaleString('en-GB')} people, status ${i.status}. NDPC: ${ng ? ({ notified: 'notified ' + date(ng.notifiedAt), 'not-required': 'not notifiable (decision recorded)', running: 'clock running', overdue: 'overdue', 'no-fixed-window': '—' }[ng.state]) : 'not a Nigerian incident'}.`);
  }
  L.push('');

  L.push(`## 8. Data subject requests`);
  L.push('');
  if (!ds.requests.length) L.push('No requests received this cycle.');
  else {
    const byType = REQUEST_TYPES.map((t) => ({ t, n: ds.requests.filter((r) => r.type === t.id).length })).filter((x) => x.n);
    L.push(byType.map((x) => `${x.t.label}: ${x.n}`).join(' · '));
    const done = ds.requests.filter((r) => r.status === 'completed').length;
    L.push('');
    L.push(`${done} of ${ds.requests.length} completed.`);
  }
  L.push('');
  return L.join('\n');
}
