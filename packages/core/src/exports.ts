// Exports: Nigerian audit-return pack, compliance report per jurisdiction, record of processing (CSV), assessment report.

import { AI_DOMAINS, classifyAI } from './ai.js';
import { ASSESSMENT_KINDS, OUTCOME_LABEL, QUESTIONS, assessmentDescription, reviewAssessment, riskLevel, riskScore } from './assessments.js';
import { evaluateJurisdiction } from './compliance.js';
import { TIER_LABEL, activityFacts, auditReturnDue, inScope, ngCycleYear, ngTierFor } from './engine.js';
import { PACKS } from './jurisdictions.js';
import { BASES, SPECIAL_CONDITIONS, categoryLabel, countryName, sectorById } from './taxonomy.js';
import type { Assessment, Dataset, JurisdictionCode } from './types.js';

const esc = (s: unknown) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');
const STATUS: Record<string, string> = { met: 'Met', partial: 'Partly met', missing: 'Missing', na: 'Not applicable' };

export function complianceReportMarkdown(ds: Dataset, code: JurisdictionCode, opts: { preparedBy?: string; now?: Date } = {}): string {
  const now = opts.now ?? new Date();
  const w = ds.workspace; const pack = PACKS[code];
  const res = evaluateJurisdiction(code, ds, now);
  const L: string[] = [];
  const isNgPack = code === 'NG';
  L.push(isNgPack ? '# Compliance Audit Return: preparation pack' : `# ${pack.shortLaw} compliance report`);
  L.push('');
  L.push(`**Entity:** ${w.name}  `);
  L.push(`**Sector:** ${sectorById(w.sector).label} · established in ${countryName(w.establishment)}  `);
  L.push(`**Law:** ${pack.law}  `);
  L.push(`**Regulator:** ${pack.regulator}  `);
  L.push(`**${pack.officer.title}:** ${code === 'ZA' ? String(w.jx.ZA?.ioName ?? 'Not named') : w.privacyLeadName ?? 'Not named'}  `);
  if (isNgPack) {
    const t = ngTierFor(w); const cycle = ngCycleYear(w);
    L.push(`**Classification:** ${t.tier} (${TIER_LABEL[t.tier]}). ${t.explanation}  `);
    L.push(`**Audit cycle:** ${cycle}, return due ${auditReturnDue(cycle).toISOString().slice(0, 10)}  `);
    L.push(`**NDPC registration:** ${String(w.jx.NG?.registrationNumber ?? 'Not recorded')}  `);
  }
  L.push(`**Prepared:** ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC${opts.preparedBy ? ' by ' + opts.preparedBy : ''}`);
  L.push('');
  L.push(isNgPack ? '> Preparation pack for review by a licensed DPCO. It is not an NDPC form and is not filed by this platform.' : '> Working report generated from the records. Review before relying on it.');
  L.push('');
  L.push('## 1. Summary');
  L.push('');
  L.push(`Readiness **${res.score}%**: ${res.met} met, ${res.partial} partly met, ${res.missing} missing, of ${res.applicable} binding requirements.`);
  L.push('');
  L.push('| Requirement | Reference | Status | Evidence |');
  L.push('|---|---|---|---|');
  for (const r of res.requirements) L.push(`| ${esc(r.title)}${r.binding ? '' : ' (recommended)'} | ${esc(r.ref)} | ${STATUS[r.status]} | ${esc(r.detail)} |`);
  L.push('');
  const gaps = res.requirements.filter((r) => r.status === 'missing' || r.status === 'partial');
  L.push('## 2. Gaps');
  L.push('');
  if (!gaps.length) L.push('No gaps found.'); else gaps.forEach((g, i) => L.push(`${i + 1}. **${g.title}** (${g.ref}): ${g.detail}`));
  L.push('');
  L.push('## 3. Record of processing');
  L.push('');
  const acts = ds.activities.filter((a) => a.status === 'active' && inScope(w, a.jurisdictions).includes(code));
  if (!acts.length) L.push('No processing activities in scope.');
  else {
    L.push(`| Activity | Purpose | Lawful basis (${pack.bases.ref}) | Data | ${pack.sensitive.term} | Retention | Transfers |`);
    L.push('|---|---|---|---|---|---|---|');
    for (const a of acts) {
      const p = activityFacts(a, ds).perJx.find((x) => x.code === code)!;
      L.push(`| ${esc(a.name)} | ${esc(a.purpose)} | ${p.basis.ok ? esc(p.basis.ref) : esc(p.basis.problem)} | ${esc(a.dataCategoryIds.map(categoryLabel).join(', '))} | ${p.sensitive.length ? esc(p.sensitive.map(categoryLabel).join(', ')) : 'None'} | ${esc(a.retentionPeriod ?? 'Not set')} | ${p.transfers.length ? esc(p.transfers.map((t) => `${t.via} (${t.country})`).join(', ')) : 'None'} |`);
    }
  }
  L.push('');
  const ais = ds.aiSystems.filter((s) => s.status !== 'retired' && s.markets.includes(code));
  if (ais.length) {
    L.push(`## 4. AI systems${isNgPack ? ' (GAID Arts. 43–44)' : ''}`);
    L.push('');
    for (const s of ais) {
      const c = classifyAI(s, { sector: w.sector, jurisdictions: w.jurisdictions, vendors: ds.vendors, assessments: ds.assessments });
      L.push(`- **${s.name}** (${AI_DOMAINS.find((d) => d.id === s.domain)?.label}; ${s.status}): risk ${c.risk}. Oversight: ${s.humanOversight || 'not documented'}.`);
    }
    L.push('');
  }
  return L.join('\n');
}

const csv = (rows: unknown[][]) => rows.map((r) => r.map((c) => { const s = String(c ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');

/** Record of processing as CSV, with lawful-basis and sensitivity columns for each jurisdiction in scope. */
export function ropaCsv(ds: Dataset): string {
  const w = ds.workspace;
  const head = ['Activity', 'Purpose', 'Department', 'Our role', 'Data subjects', 'Data categories', 'Approx. people', 'Lawful basis', 'Special condition', 'Systems', 'Vendors', 'Recipients', 'Retention', 'Countries',
    ...w.jurisdictions.flatMap((c) => [`${PACKS[c].shortLaw} basis`, `${PACKS[c].shortLaw} ${PACKS[c].sensitive.term}`, `${PACKS[c].shortLaw} DPIA`])];
  const rows = ds.activities.filter((a) => a.status !== 'retired').map((a) => {
    const f = activityFacts(a, ds);
    return [a.name, a.purpose, a.department, a.capacity, a.dataSubjectTypes.join('; '), a.dataCategoryIds.map(categoryLabel).join('; '), a.volume,
      BASES.find((b) => b.id === a.lawfulBasis)?.label ?? '', SPECIAL_CONDITIONS.find((s) => s.id === a.specialCondition)?.label ?? '',
      f.systems.map((s) => s.name).join('; '), f.vendors.map((v) => v.name).join('; '), a.recipients, `${a.retentionPeriod ?? ''}${a.retentionTrigger ? ' from ' + a.retentionTrigger : ''}`, f.countries.map(countryName).join('; '),
      ...w.jurisdictions.flatMap((c) => { const p = f.perJx.find((x) => x.code === c); return p ? [p.basis.ok ? p.basis.ref : p.basis.problem, p.sensitive.map(categoryLabel).join('; '), p.dpia.required ? p.dpia.status : 'not required'] : ['out of scope', '', '']; })];
  });
  return csv([head, ...rows]);
}

export function assessmentMarkdown(a: Assessment, ds: Dataset): string {
  const k = ASSESSMENT_KINDS.find((x) => x.id === a.kind)!;
  const rev = reviewAssessment(a, ds);
  const L: string[] = [`# ${k.label}: ${a.title}`, '', `**Entity:** ${ds.workspace.name}  `, `**Status:** ${a.status}${a.approver ? ` · approved by ${a.approver}${a.approvedOn ? ' on ' + a.approvedOn : ''}` : ''}  `, ''];
  const desc = assessmentDescription(a, ds);
  if (desc.length) {
    L.push('## Processing covered', '');
    for (const d of desc) {
      L.push(`### ${d.name}`, `- Purpose: ${d.purpose}`, `- People: ${d.people} (about ${d.volume.toLocaleString('en-GB')})`, `- Data: ${d.data}`, `- Systems: ${d.systems}`, `- Vendors: ${d.vendors}`, `- Retention: ${d.retention}`);
      for (const p of d.perJx) L.push(`- ${PACKS[p.code].shortLaw}: basis ${p.basis.ok ? p.basis.ref : p.basis.problem}${p.sensitive.length ? `; ${PACKS[p.code].sensitive.term}: ${p.sensitive.join(', ')}` : ''}${p.triggers.length ? `; triggers: ${p.triggers.join(', ')}` : ''}`);
      L.push('');
    }
  }
  for (const step of [...new Set(QUESTIONS[a.kind].map((q) => q.step))]) {
    L.push(`## ${step}`, '');
    for (const q of QUESTIONS[a.kind].filter((x) => x.step === step)) {
      const v = a.answers[q.id];
      L.push(`**${q.text}**`, '', v === true ? 'Yes' : v === false ? 'No' : v ? String(v) : '_Not answered_', '');
    }
  }
  if (a.risks.length) {
    L.push('## Risks and measures', '', '| Risk | Inherent | Measures | Residual | Owner |', '|---|---|---|---|---|');
    for (const r of a.risks) L.push(`| ${esc(r.title)} | ${riskLevel(riskScore(r.likelihood, r.severity))} (${r.likelihood}×${r.severity}) | ${esc(r.measures)} | ${riskLevel(riskScore(r.residualLikelihood, r.residualSeverity))} (${r.residualLikelihood}×${r.residualSeverity}) | ${esc(r.owner)} |`);
    L.push('');
  }
  L.push('## Outcome', '', `Suggested by the rules: **${OUTCOME_LABEL[rev.suggestedOutcome]}**${rev.consult.length ? ` (${rev.consult.map((c) => `${PACKS[c.code].regulatorShort}, ${c.ref}`).join('; ')})` : ''}.`);
  if (a.outcome) L.push('', `Decision: **${OUTCOME_LABEL[a.outcome]}**${a.conditions ? `. Conditions: ${a.conditions}` : ''}`);
  if (a.dpoAdvice) L.push('', `Privacy lead advice: ${a.dpoAdvice}`);
  return L.join('\n');
}
