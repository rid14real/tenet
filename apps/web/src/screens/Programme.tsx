import { useMemo, useState } from 'react';
import {
  ANSWERED_TRIGGERS, COLLECTION_META, DOMAINS, EFFORT_DAYS, FRAMEWORK_META, OWNER_LABEL, PACKS, PHASES, PROFILES, STANDARDS, TRIGGER_LABEL, VOLUME_BANDS,
  buildPlan, capacityForTarget, defaultScope, derivedTriggers, frameworkJson, frameworkMarkdown, maturityLabel, planCsv, planMarkdown,
  recommendProfile, suggestAnswers, validateScope, CONTROL_STATUSES,
  type AnsweredTrigger, type ControlStatus, type DomainId, type Plan, type PlanItem, type Profile, type ProgrammeScope,
} from '@tenet/core';
import { useApp, type Tab } from '../context';
import { RecordDrawer } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Bar, Empty, Jx, Pill, SubTabs, fmtDate, slug, type Tone } from '../ui';

type Sub = 'plan' | 'maturity' | 'scope' | 'excluded';

const STATUS_TONE: Record<ControlStatus, Tone> = { 'not-started': 'none', 'in-progress': 'info', implemented: 'ok', operating: 'ok', 'not-applicable': 'none' };
const statusLabel = (s: ControlStatus) => CONTROL_STATUSES.find((x) => x.id === s)!.label;
const MODULE_TAB: Record<string, Tab> = { datamap: 'datamap', vendors: 'vendors', assessments: 'assessments', incidents: 'incidents', requests: 'requests', governance: 'governance', ai: 'ai', settings: 'settings' };
const MODULE_LABEL: Record<string, string> = { datamap: 'data map', vendors: 'vendors', assessments: 'assessments', incidents: 'incidents', requests: 'requests', governance: 'governance', ai: 'AI systems', settings: 'settings' };
const SIGNAL_TONE = { met: 'ok', partial: 'warn', missing: 'bad' } as const;

export function Programme() {
  const { ds, route, go, words } = useApp();
  const plan = useMemo(() => (ds ? buildPlan(ds) : null), [ds]);
  if (!ds || !plan || route.screen !== 'ws') return null;
  const w = ds.workspace;
  const sub: Sub = (route.sub as Sub) ?? (plan.scoped ? 'plan' : 'scope');
  return (
    <>
      <SubTabs label="Programme" value={sub} onChange={(s) => go({ screen: 'ws', id: w.id, tab: 'programme', sub: s })}
        tabs={[
          { id: 'plan', label: 'Plan', count: plan.items.length },
          { id: 'maturity', label: 'Maturity' },
          { id: 'scope', label: 'Scope' },
          { id: 'excluded', label: 'Not in plan', count: plan.excluded.length },
        ]} />
      {!plan.scoped && sub !== 'scope' && <p className="notice warn">This plan uses default answers. Answer the scoping questions so it fits this {words.entity}.</p>}
      {sub === 'plan' && <PlanView plan={plan} />}
      {sub === 'maturity' && <MaturityView plan={plan} />}
      {sub === 'scope' && <ScopeView plan={plan} />}
      {sub === 'excluded' && <ExcludedView plan={plan} entity={words.entity} />}
    </>
  );
}

function Summary({ plan }: { plan: Plan }) {
  const { ds, download } = useApp();
  if (!ds) return null;
  const w = ds.workspace;
  const legal = plan.items.filter((i) => i.inclusion === 'law').length;
  const overdue = plan.items.filter((i) => i.overdue || i.reviewOverdue).length;
  return (
    <section className="card">
      <div className="row">
        <div className="grow">
          <p className="eyebrow">{FRAMEWORK_META.name} {FRAMEWORK_META.version}</p>
          <h2>{PROFILES.find((p) => p.id === plan.profile.profile)!.label} profile · {plan.items.length} controls{legal ? ` (${legal} added by law)` : ''}</h2>
        </div>
        <div className="row" style={{ gap: 6 }}>
          <button className="btn" onClick={() => download(`${slug(w.name)}-programme-plan.md`, planMarkdown(plan, ds))}>Plan (.md)</button>
          <button className="btn" onClick={() => download(`${slug(w.name)}-programme-plan.csv`, planCsv(plan), 'text/csv')}>Plan (.csv)</button>
        </div>
      </div>
      <div className="kv">
        <div><div className="k">Progress</div><div className="v mono">{plan.progress}%</div><Bar pct={plan.progress} /></div>
        <div><div className="k">Maturity</div><div className="v">{plan.maturity.toFixed(1)} of 5 · {maturityLabel(plan.maturity)}</div></div>
        <div><div className="k">Planned finish</div><div className="v">{fmtDate(plan.end)}</div><div className="small muted">{plan.weeks} weeks at {plan.capacityDaysPerWeek} person-days a week</div></div>
        <div><div className="k">Needs attention</div><div className="v">{overdue ? <span style={{ color: 'var(--bad)' }}>{overdue} overdue</span> : 'Nothing overdue'}</div></div>
      </div>
    </section>
  );
}

function CapacityCard({ plan }: { plan: Plan }) {
  const { ds } = useApp();
  const [months, setMonths] = useState(12);
  const answer = useMemo(() => (ds ? capacityForTarget(ds, Math.round(months * 4.35)) : null), [ds, months]);
  if (!ds || !answer) return null;
  return (
    <section className="card">
      <h2>What it takes</h2>
      <div className="field">
        <label htmlFor="cap-target">Finish everything within</label>
        <select id="cap-target" value={months} onChange={(e) => setMonths(Number(e.target.value))}>
          {[6, 9, 12, 18, 24, 36].map((m) => <option key={m} value={m}>{m} months</option>)}
        </select>
      </div>
      {answer.daysPerWeek === null
        ? <p className="small">Not possible: the dependency chain alone takes about {answer.criticalPathWeeks} weeks, because controls wait on each other and on the business. Choose a longer target or narrow the scope.</p>
        : <p className="small">About <b>{answer.daysPerWeek} person-days a week</b> of privacy team time ({(answer.daysPerWeek / 5).toFixed(1)} full-time people), plus business owners’ time. You have {plan.capacityDaysPerWeek} today.</p>}
      <p className="small muted">Estimates use the framework’s effort sizes (S {EFFORT_DAYS.S}, M {EFFORT_DAYS.M}, L {EFFORT_DAYS.L} days) scaled to the {plan.profile.profile} profile.</p>
    </section>
  );
}

function PlanView({ plan }: { plan: Plan }) {
  const { ds, route, go } = useApp();
  const [group, setGroup] = useState<'phase' | 'domain'>('phase');
  const [filter, setFilter] = useState<'open' | 'all' | 'done' | 'law'>('open');
  const [domain, setDomain] = useState<DomainId | ''>('');
  const openId = route.screen === 'ws' ? route.open : undefined;
  if (!ds || route.screen !== 'ws') return null;
  const w = ds.workspace;
  const shown = plan.items.filter((i) => (!domain || i.control.domain === domain) && (
    filter === 'all' ? true : filter === 'done' ? i.status === 'implemented' || i.status === 'operating' : filter === 'law' ? i.requiredBy.length > 0 : !['implemented', 'operating', 'not-applicable'].includes(i.status) || i.reviewOverdue));
  const groups = group === 'phase'
    ? PHASES.map((p) => ({ key: String(p.id), title: `${p.id}. ${p.name}`, sub: p.goal, items: shown.filter((i) => i.control.phase === p.id), meta: plan.phases.find((x) => x.id === p.id)! }))
    : DOMAINS.map((d) => ({ key: d.id, title: d.name, sub: d.purpose, items: shown.filter((i) => i.control.domain === d.id), meta: null }));
  const open = plan.items.find((i) => i.control.id === openId);
  const setOpen = (id?: string) => go({ screen: 'ws', id: w.id, tab: 'programme', sub: 'plan', open: id });
  return (
    <>
      <Summary plan={plan} />
      <div className="cols">
        <div className="col-2">
          <div className="row">
            <div className="chips grow" role="group" aria-label="Show">
              {([['open', 'To do'], ['done', 'Done'], ['law', 'Required by law'], ['all', 'All']] as const).map(([k, l]) => <button key={k} type="button" className="chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>)}
            </div>
            <select aria-label="Domain" value={domain} onChange={(e) => setDomain(e.target.value as DomainId | '')} style={{ maxWidth: 220 }}>
              <option value="">All domains</option>
              {DOMAINS.filter((d) => plan.items.some((i) => i.control.domain === d.id)).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select aria-label="Group by" value={group} onChange={(e) => setGroup(e.target.value as 'phase' | 'domain')} style={{ maxWidth: 160 }}>
              <option value="phase">By phase</option>
              <option value="domain">By domain</option>
            </select>
          </div>
          {shown.length === 0 && <Empty title="Nothing to show">No controls match this filter.</Empty>}
          {groups.filter((g) => g.items.length).map((g) => (
            <section key={g.key} className="card">
              <div className="row">
                <div className="grow"><h2>{g.title}</h2><p className="small muted">{g.sub}</p></div>
                {g.meta && <span className="small muted">{g.meta.done} of {g.meta.items} done · planned by {fmtDate(g.meta.end)}</span>}
              </div>
              <div>{g.items.map((i) => <ControlRow key={i.control.id} i={i} weeks={plan.weeks} onOpen={() => setOpen(i.control.id)} />)}</div>
            </section>
          ))}
        </div>
        <div className="col-1">
          <CapacityCard plan={plan} />
          <section className="card">
            <h2>Why this profile</h2>
            <p className="small">{plan.profile.overridden ? `Set to ${plan.profile.profile}; the recommendation was ${plan.profile.recommended}.` : `Recommended: ${plan.profile.recommended}.`}</p>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{plan.profile.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
            <div><button className="btn ghost" onClick={() => go({ screen: 'ws', id: w.id, tab: 'programme', sub: 'scope' })}>Change scope</button></div>
          </section>
          <section className="card">
            <h2>The framework</h2>
            <p className="small muted">{FRAMEWORK_META.summary} Published by {FRAMEWORK_META.publisher} under {FRAMEWORK_META.licence}.</p>
            <FrameworkDownloads />
          </section>
        </div>
      </div>
      {open && <ControlDrawer i={open} onClose={() => setOpen(undefined)} />}
    </>
  );
}

function FrameworkDownloads() {
  const { download } = useApp();
  return (
    <div className="row" style={{ gap: 6 }}>
      <button className="btn" onClick={() => download('oppf.json', JSON.stringify(frameworkJson(), null, 2), 'application/json')}>Framework (.json)</button>
      <button className="btn" onClick={() => download('OPPF.md', frameworkMarkdown())}>Framework (.md)</button>
    </div>
  );
}

function ControlRow({ i, weeks, onOpen }: { i: PlanItem; weeks: number; onOpen: () => void }) {
  const done = i.status === 'implemented' || i.status === 'operating';
  const span = Math.max(1, weeks);
  return (
    <div className="req ctl">
      <div className="grow" style={{ minWidth: 220, flexBasis: 300 }}>
        <button className="linkish" onClick={onOpen}><span className="mono muted" style={{ fontWeight: 500 }}>{i.control.id}</span> {i.control.title}</button>
        <div className="small muted">
          {i.record?.owner ?? OWNER_LABEL[i.control.owner]}
          {!done && i.status !== 'not-applicable' && <> · {fmtDate(i.start)} to {fmtDate(i.end)}</>}
          {i.reviewDue && <> · review {fmtDate(i.reviewDue)}</>}
          {i.waitingOn.length > 0 && !done && <> · after {i.waitingOn.join(', ')}</>}
        </div>
        {!done && i.status !== 'not-applicable' && (
          <div className="gantt" aria-hidden="true"><div style={{ left: `${(i.startWeek / span) * 100}%`, width: `${Math.max(1.5, ((i.endWeek - i.startWeek) / span) * 100)}%` }} /></div>
        )}
      </div>
      <div className="row" style={{ gap: 6 }}>
        {i.requiredBy.length > 0 && <span title="Required by these laws"><Jx codes={i.requiredBy} /></span>}
        {i.signal && <span className={`sig ${SIGNAL_TONE[i.signal.state]}`} title={`Tenet records: ${i.signal.detail}`}>records {i.signal.state === 'met' ? 'agree' : i.signal.state === 'partial' ? 'partly' : 'show a gap'}</span>}
        {i.reviewOverdue && <Pill tone="warn">Review due</Pill>}
        {i.overdue && <Pill tone="bad">Overdue</Pill>}
        <Pill tone={STATUS_TONE[i.status]}>{statusLabel(i.status)}</Pill>
      </div>
    </div>
  );
}

function ControlDrawer({ i, onClose }: { i: PlanItem; onClose: () => void }) {
  const { ds, saveRecord, session, fieldCtx, go } = useApp();
  if (!ds) return null;
  const c = i.control;
  const phase = PHASES.find((p) => p.id === c.phase)!;
  const record: AnyRecord = (i.record as unknown as AnyRecord) ?? { status: 'not-started' };
  return (
    <RecordDrawer
      title={`${c.id} ${c.title}`}
      fields={COLLECTION_META.controls.fields}
      record={record}
      ds={ds} ctx={fieldCtx} readOnly={!session.canEdit} onClose={onClose}
      onSave={async (v) => {
        const base = i.record ? (i.record as unknown as AnyRecord) : { id: newId(), createdAt: now() };
        const status = v.status as ControlStatus;
        const done = status === 'implemented' || status === 'operating';
        const rec = { ...base, ...v, controlId: c.id, ...(done && !v.implementedOn ? { implementedOn: now().slice(0, 10) } : {}), updatedAt: now() } as AnyRecord;
        await saveRecord('controls', rec, `Updated programme control ${c.id}: ${statusLabel(status)}`);
        onClose();
      }}
      aside={() => (
        <div className="stack">
          <p>{c.objective}</p>
          <div className="kv">
            <div><div className="k">Domain</div><div className="v">{DOMAINS.find((d) => d.id === c.domain)!.name}</div></div>
            <div><div className="k">Phase</div><div className="v">{phase.name}</div></div>
            <div><div className="k">Owner role</div><div className="v">{OWNER_LABEL[c.owner]}</div></div>
            <div><div className="k">Effort</div><div className="v">{c.effort} · about {i.effortDays} days</div></div>
            <div><div className="k">Recurs</div><div className="v">{c.recurrence}</div></div>
            <div><div className="k">Maturity</div><div className="v">{i.maturity === null ? 'n/a' : `${i.maturity} · ${maturityLabel(i.maturity)}`}</div></div>
          </div>
          <p className="small">
            <b>Why it is in your plan:</b> {i.inclusion === 'law' ? `required by ${i.requiredBy.map((j) => PACKS[j].law).join('; ')}, although it sits in the ${c.profile} profile.` : `part of the ${c.profile} profile${i.requiredBy.length ? `, and required by ${i.requiredBy.map((j) => PACKS[j].shortLaw).join(', ')}` : ''}.`}
            {i.waitingOn.length > 0 && <> Best started after {i.waitingOn.join(', ')}.</>}
          </p>
          {i.signal && (
            <div className={`notice ${i.signal.state === 'met' ? '' : i.signal.state === 'partial' ? 'warn' : 'bad'}`}>
              <b>What Tenet’s records show ({i.signal.source}):</b> {i.signal.detail}
              {c.module && <> <button className="btn ghost" style={{ minHeight: 0 }} onClick={() => go({ screen: 'ws', id: ds.workspace.id, tab: MODULE_TAB[c.module!] })}>Open {MODULE_LABEL[c.module]}</button></>}
            </div>
          )}
          <div><h3>Steps</h3><ol className="small" style={{ margin: '6px 0 0', paddingLeft: 18 }}>{c.steps.map((s) => <li key={s}>{s}</li>)}</ol></div>
          <div className="cols" style={{ gap: 12 }}>
            <div className="col-1" style={{ gap: 4 }}><h3>Deliverables</h3><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{c.deliverables.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div className="col-1" style={{ gap: 4 }}><h3>Evidence</h3><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{c.evidence.map((s) => <li key={s}>{s}</li>)}</ul></div>
          </div>
          {i.refs.length > 0 && (
            <div className="stack" style={{ gap: 6 }}>
              <h3>Laws in scope</h3>
              {i.refs.map((r) => (
                <div key={r.code} className="small">
                  <Jx codes={[r.code]} />{' '}
                  {r.refs.map((x, k) => <span key={k}>{k > 0 && '; '}{x.ref}{x.kind === 'supports' ? ' (supports)' : ''} <span className="prov"><i className={x.conf}>{x.conf}</i></span>{x.note && <span className="muted"> {x.note}</span>}</span>)}
                </div>
              ))}
            </div>
          )}
          {Object.keys(c.standards).length > 0 && (
            <div className="stack" style={{ gap: 4 }}>
              <h3>Standards</h3>
              {Object.entries(c.standards).map(([k, v]) => <div key={k} className="small"><b>{STANDARDS[k as keyof typeof STANDARDS].name} {STANDARDS[k as keyof typeof STANDARDS].version}:</b> {v!.join('; ')}</div>)}
            </div>
          )}
          {c.notes && <p className="small muted">{c.notes}</p>}
          <h3>Your status</h3>
        </div>
      )}
    />
  );
}

function MaturityView({ plan }: { plan: Plan }) {
  return (
    <>
      <Summary plan={plan} />
      <div className="cols">
        <section className="card col-2">
          <h2>Maturity by domain</h2>
          {plan.domains.map((d) => (
            <div key={d.id} className="req" style={{ alignItems: 'center' }}>
              <div style={{ flex: '1 1 220px' }}><b>{d.name}</b><div className="small muted">{d.done} of {d.items} controls done</div></div>
              <div style={{ flex: '2 1 200px' }}><Bar pct={(d.maturity / 5) * 100} /></div>
              <span className="mono" style={{ width: 120, textAlign: 'right' }}>{d.maturity.toFixed(1)} · {maturityLabel(d.maturity)}</span>
            </div>
          ))}
        </section>
        <section className="card col-1">
          <h2>How maturity is scored</h2>
          <ol start={0} className="small" style={{ margin: 0, paddingLeft: 22 }}>
            <li><b>Not started.</b></li>
            <li><b>Initial:</b> work in progress.</li>
            <li><b>Defined:</b> implemented, but no evidence recorded yet.</li>
            <li><b>Implemented:</b> in use, with evidence or matching Tenet records.</li>
            <li><b>Managed:</b> has run through a full cycle with evidence.</li>
            <li><b>Optimised:</b> measured and improved routinely.</li>
          </ol>
          <p className="small muted">A control whose periodic review is overdue drops to Defined until it is reviewed. Controls marked not applicable are left out.</p>
        </section>
      </div>
    </>
  );
}

function ScopeView({ plan }: { plan: Plan }) {
  const { ds, saveWorkspace, session, toast, go, words } = useApp();
  const w = ds?.workspace;
  const [s, setS] = useState<ProgrammeScope>(() => (w?.programme ?? (w ? defaultScope(w) : ({} as ProgrammeScope))));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const suggestions = useMemo(() => (ds ? suggestAnswers(ds) : {}), [ds]);
  if (!ds || !w) return null;
  const derived = derivedTriggers(w);
  const rec = recommendProfile(w, s);
  const answer = (k: AnsweredTrigger, v: boolean) => setS((x) => ({ ...x, answers: { ...x.answers, [k]: v } }));
  const applySuggestions = () => setS((x) => ({ ...x, answers: { ...x.answers, ...Object.fromEntries(Object.entries(suggestions).map(([k, v]) => [k, v!.value])) } }));
  const pending = Object.entries(suggestions).filter(([k, v]) => s.answers[k as AnsweredTrigger] !== v!.value).length;
  const save = async () => {
    const r = validateScope({ ...s, answeredAt: now() });
    setErrors(r.errors);
    if (!r.ok) return;
    setBusy(true);
    try {
      await saveWorkspace({ ...w, programme: r.value, updatedAt: now() }, 'Updated programme scope');
      toast('Scope saved; plan rebuilt');
      go({ screen: 'ws', id: w.id, tab: 'programme', sub: 'plan' });
    } catch (e) { toast(`Not saved: ${(e as Error).message}`); } finally { setBusy(false); }
  };
  return (
    <div className="cols">
      <section className="card col-2">
        <div><h2>Scope the programme</h2><p className="small muted">A few questions decide which of the framework’s controls you need and in what order. Laws in scope come from settings: <Jx codes={w.jurisdictions} />.</p></div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="sc-vol">People whose data you hold</label>
            <select id="sc-vol" value={s.volumeBand} onChange={(e) => setS({ ...s, volumeBand: e.target.value as ProgrammeScope['volumeBand'] })}>{VOLUME_BANDS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}</select>
            <span className="help">Customers, staff and others, across all activities.</span>
            {errors.volumeBand && <span className="err">{errors.volumeBand}</span>}
          </div>
          <div className="field">
            <label htmlFor="sc-cap">Privacy team time (person-days a week)</label>
            <input id="sc-cap" type="number" min={0.5} step={0.5} value={s.capacityDaysPerWeek} onChange={(e) => setS({ ...s, capacityDaysPerWeek: Number(e.target.value) })} />
            <span className="help">One full-time person is about 5. Leave out business owners’ time.</span>
            {errors.capacityDaysPerWeek && <span className="err">{errors.capacityDaysPerWeek}</span>}
          </div>
          <div className="field">
            <label htmlFor="sc-start">Programme start</label>
            <input id="sc-start" type="date" value={s.startDate} onChange={(e) => setS({ ...s, startDate: e.target.value })} />
            {errors.startDate && <span className="err">{errors.startDate}</span>}
          </div>
        </div>
        <div className="row"><h3 className="grow">Does this {words.entity}…</h3>{pending > 0 && session.canEdit && <button className="btn ghost" onClick={applySuggestions}>Use {pending} answer{pending > 1 ? 's' : ''} from records</button>}</div>
        <div className="stack" style={{ gap: 4 }}>
          {ANSWERED_TRIGGERS.map((k) => (
            <div key={k} className="req" style={{ padding: '8px 0' }}>
              <label className="check grow" htmlFor={`sc-${k}`}>
                <input id={`sc-${k}`} type="checkbox" checked={!!s.answers[k]} onChange={(e) => answer(k, e.target.checked)} disabled={!session.canEdit} />
                <span>{k === 'certification' ? TRIGGER_LABEL[k] : TRIGGER_LABEL[k].replace(/^./, (c) => c.toUpperCase())}
                  {suggestions[k] && <span className="help" style={{ display: 'block' }}>Records suggest yes: {suggestions[k]!.why}</span>}
                </span>
              </label>
            </div>
          ))}
          <div className="req small muted" style={{ padding: '8px 0' }}>From settings: {derived.processor ? 'acts as a processor for clients' : 'acts as a controller'}; {derived.representative ? 'needs an EU or UK representative' : 'no representative needed'}.</div>
        </div>
        {session.canEdit && <div className="row"><button className="btn primary" onClick={save} disabled={busy}>{busy ? 'Saving…' : plan.scoped ? 'Save and rebuild plan' : 'Build my plan'}</button></div>}
      </section>
      <section className="card col-1">
        <h2>Profile</h2>
        <p><b>Recommended: {PROFILES.find((p) => p.id === rec.recommended)!.label}</b> (score {rec.score})</p>
        <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{rec.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        <div className="field">
          <label htmlFor="sc-prof">Use</label>
          <select id="sc-prof" value={s.profileOverride ?? ''} onChange={(e) => setS({ ...s, profileOverride: (e.target.value || undefined) as Profile | undefined })} disabled={!session.canEdit}>
            <option value="">The recommendation</option>
            {PROFILES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        {PROFILES.map((p) => <p key={p.id} className="small"><b>{p.label}.</b> {p.who}</p>)}
        <p className="small muted">Whatever the profile, a control a law in scope requires is always in the plan.</p>
      </section>
    </div>
  );
}

function ExcludedView({ plan, entity }: { plan: Plan; entity: string }) {
  if (!plan.excluded.length) return <Empty title="Every control applies">Nothing in the framework is left out for this {entity}.</Empty>;
  return (
    <section className="card">
      <div><h2>Controls not in this plan</h2><p className="small muted">They come back if the scope or laws change. Nothing here is required by a law in scope.</p></div>
      {DOMAINS.map((d) => {
        const xs = plan.excluded.filter((e) => e.control.domain === d.id);
        if (!xs.length) return null;
        return (
          <div key={d.id} className="stack" style={{ gap: 0 }}>
            <h3 style={{ marginTop: 8 }}>{d.name}</h3>
            {xs.map((e) => <div key={e.control.id} className="req"><div className="grow"><span className="mono muted">{e.control.id}</span> <b>{e.control.title}</b><div className="small muted">{e.why}</div></div></div>)}
          </div>
        );
      })}
    </section>
  );
}
