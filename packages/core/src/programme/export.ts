// Publishing the framework (JSON and Markdown, CC BY 4.0) and exporting an organisation's plan.

import { PACKS, JURISDICTION_CODES } from '../jurisdictions.js';
import type { Dataset } from '../types.js';
import { CONTROLS, DOMAINS } from './catalogue.js';
import { FRAMEWORK_META, OWNER_LABEL, PHASES, PROFILES, STANDARDS, TRIGGER_LABEL, type Control } from './model.js';
import { maturityLabel, type Plan } from './plan.js';
import { CONTROL_STATUSES } from './types.js';

export function frameworkJson() {
  return {
    ...FRAMEWORK_META,
    profiles: PROFILES, phases: PHASES, domains: DOMAINS, triggers: TRIGGER_LABEL, owners: OWNER_LABEL,
    effortDays: { S: 2, M: 6, L: 15 }, standards: STANDARDS,
    jurisdictions: Object.fromEntries(JURISDICTION_CODES.map((c) => [c, { name: PACKS[c].name, law: PACKS[c].law, regulator: PACKS[c].regulator }])),
    controls: CONTROLS,
  };
}

const refsLine = (c: Control) => JURISDICTION_CODES.filter((j) => c.laws[j]?.length)
  .map((j) => `${PACKS[j].shortLaw}: ${c.laws[j]!.map((r) => `${r.ref}${r.kind === 'supports' ? ' (supports)' : ''} [${r.conf}]`).join('; ')}`);

export function frameworkMarkdown(): string {
  const m = FRAMEWORK_META;
  const L: string[] = [];
  L.push(`# ${m.name} (${m.shortName})`, '', `Version ${m.version} · ${m.status} · as at ${m.asOf} · published by ${m.publisher} under ${m.licence} (${m.licenceUrl})`, '', m.summary, '');
  L.push('## How the framework works', '');
  L.push('Laws say what is owed. Standards list what controls to have. Neither says in what order to build a programme, or how much is enough for an organisation of a given size. OPPF does that, in four parts:', '');
  L.push('1. **One control catalogue.** ' + `${CONTROLS.length} controls in ${DOMAINS.length} domains. Each states its objective, steps, deliverables, the evidence an auditor would ask for, an owner, an effort estimate and how often it recurs.`);
  L.push('2. **Three scaling profiles.** ' + PROFILES.map((p) => `${p.label}: ${p.who}`).join(' '));
  L.push('3. **Four phases with dependencies.** ' + PHASES.map((p) => `${p.name}: ${p.goal}`).join(' '));
  L.push('4. **A maturity model** from 0 (not started) to 5 (optimised), scored per control and averaged per domain.', '');
  L.push('A control enters a plan when the organisation’s profile reaches it, or when a law in scope imposes it, whichever comes first. Triggers (sensitive data, AI, transfers and so on) switch on controls that only some organisations need.', '');
  L.push('## Confidence tags', '', 'Every legal reference carries a tag. **primary**: read against the statute or standard. **secondary**: from regulator guidance summaries or practitioner analysis. **unverified**: a placeholder until counsel checks it. Mapping a control to a provision is the framework’s own judgement and is open to review.', '');
  L.push('## Standards', '');
  for (const s of Object.values(STANDARDS)) L.push(`- **${s.name} ${s.version}.** ${s.note}`);
  L.push('');
  for (const d of DOMAINS) {
    L.push(`## ${d.id} · ${d.name}`, '', d.purpose, '');
    for (const c of CONTROLS.filter((x) => x.domain === d.id)) {
      L.push(`### ${c.id} ${c.title}`, '', c.objective, '');
      L.push(`- **Profile:** ${c.profile} · **Phase:** ${PHASES.find((p) => p.id === c.phase)!.name} · **Owner:** ${OWNER_LABEL[c.owner]} · **Effort:** ${c.effort} · **Recurs:** ${c.recurrence}`);
      if (c.triggers?.length) L.push(`- **Applies if:** ${c.triggers.map((t) => TRIGGER_LABEL[t]).join('; ')}`);
      if (c.onlyFor?.length) L.push(`- **Only for:** ${c.onlyFor.map((j) => PACKS[j].name).join(', ')}`);
      if (c.dependsOn.length) L.push(`- **Depends on:** ${c.dependsOn.join(', ')}`);
      L.push(`- **Steps:** ${c.steps.map((s, i) => `(${i + 1}) ${s}`).join(' ')}`);
      L.push(`- **Deliverables:** ${c.deliverables.join('; ')}`);
      L.push(`- **Evidence:** ${c.evidence.join('; ')}`);
      const lr = refsLine(c);
      if (lr.length) L.push(`- **Laws:** ${lr.join(' · ')}`);
      const st = Object.entries(c.standards).filter(([, v]) => v?.length);
      if (st.length) L.push(`- **Standards:** ${st.map(([k, v]) => `${STANDARDS[k as keyof typeof STANDARDS].name}: ${v!.join('; ')}`).join(' · ')}`);
      if (c.notes) L.push(`- **Notes:** ${c.notes}`);
      L.push('');
    }
  }
  return L.join('\n');
}

const esc = (v: unknown) => { const s = v === undefined || v === null ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const day = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '');
const statusLabel = (s: string) => CONTROL_STATUSES.find((x) => x.id === s)?.label ?? s;

export function planCsv(plan: Plan): string {
  const head = ['Control', 'Title', 'Domain', 'Phase', 'Included because', 'Required by', 'Owner role', 'Owner', 'Status', 'Maturity', 'Effort (days)', 'Planned start', 'Planned finish', 'Next review', 'Tenet records', 'Evidence'];
  const rows = plan.items.map((i) => [
    i.control.id, i.control.title, i.control.domain, PHASES.find((p) => p.id === i.control.phase)!.name,
    i.inclusion === 'law' ? 'Required by law' : `${plan.profile.profile} profile`, i.requiredBy.map((j) => PACKS[j].shortLaw).join('; '),
    OWNER_LABEL[i.control.owner], i.record?.owner, statusLabel(i.status), i.maturity ?? 'n/a', i.effortDays, day(i.start), day(i.end), day(i.reviewDue),
    i.signal ? `${i.signal.state}: ${i.signal.detail}` : '', i.record?.evidence,
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\n');
}

export function planMarkdown(plan: Plan, ds: Dataset): string {
  const w = ds.workspace;
  const L: string[] = [];
  L.push(`# Privacy programme plan: ${w.name}`, '', `Built on the ${FRAMEWORK_META.name} ${FRAMEWORK_META.version}. Generated ${new Date().toISOString().slice(0, 10)}.`, '');
  L.push(`**Laws in scope:** ${w.jurisdictions.map((j) => PACKS[j].law).join('; ')}`, '');
  L.push(`**Profile:** ${plan.profile.profile}${plan.profile.overridden ? ` (recommended: ${plan.profile.recommended})` : ''}. ${plan.profile.reasons.join('; ')}.`, '');
  L.push(`**Progress:** ${plan.progress}% of planned effort complete. **Maturity:** ${plan.maturity} of 5 (${maturityLabel(plan.maturity)}).`, '');
  L.push(`**Timeline:** ${plan.items.length} controls over about ${plan.weeks} weeks at ${plan.capacityDaysPerWeek} person-days a week, finishing around ${day(plan.end)}.`, '');
  L.push('## Phases', '', '| Phase | Controls | Done | Planned finish |', '|---|---|---|---|');
  plan.phases.forEach((p) => L.push(`| ${p.name} | ${p.items} | ${p.done} | ${day(p.end)} |`));
  L.push('', '## Maturity by domain', '', '| Domain | Maturity | Done |', '|---|---|---|');
  plan.domains.forEach((d) => L.push(`| ${d.name} | ${d.maturity} (${maturityLabel(d.maturity)}) | ${d.done} of ${d.items} |`));
  for (const p of PHASES) {
    const its = plan.items.filter((i) => i.control.phase === p.id);
    if (!its.length) continue;
    L.push('', `## ${p.name}`, '', p.goal, '');
    for (const i of its) {
      L.push(`### ${i.control.id} ${i.control.title} — ${statusLabel(i.status)}`, '', i.control.objective, '');
      L.push(`- Owner: ${i.record?.owner ?? OWNER_LABEL[i.control.owner]}. Planned ${day(i.start)} to ${day(i.end)}.${i.requiredBy.length ? ` Required by ${i.requiredBy.map((j) => PACKS[j].shortLaw).join(', ')}.` : ''}`);
      i.refs.forEach((r) => L.push(`- ${PACKS[r.code].shortLaw}: ${r.refs.map((x) => `${x.ref} [${x.conf}]`).join('; ')}`));
      if (i.signal) L.push(`- Tenet records (${i.signal.source}): ${i.signal.detail}`);
      if (i.record?.evidence) L.push(`- Evidence: ${i.record.evidence}`);
      L.push('');
    }
  }
  return L.join('\n');
}
