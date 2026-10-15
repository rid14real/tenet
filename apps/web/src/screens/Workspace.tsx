import { useEffect, useMemo, useState } from 'react';
import {
  CONTROL_MAP, CONTROL_MAP_PROVENANCE, FRAMEWORKS, TIER_LABEL, WORKSPACE_FIELDS, auditReturnDue, breachClocks, carReadiness, classifyAI,
  classifyTier, daysUntil, filingPackMarkdown, formatDuration, requestClock, sectorById, validateRecord,
  type AttestationKey, type AuditEntry, type CarRequirement, type Workspace,
} from '@tenet/core';
import { useApp, type Tab } from '../context';
import { FieldInput, initialValues } from '../forms';
import { now } from '../store/types';
import { Bar, Pill, Prov, TierTag, fmtDate, fmtDateTime, fmtNum, useNow, type Tone } from '../ui';
import { CollectionView } from './Collections';

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' }, { id: 'return', label: 'Audit return' }, { id: 'activities', label: 'Processing' },
  { id: 'vendors', label: 'Vendors' }, { id: 'assessments', label: 'Assessments' }, { id: 'aiSystems', label: 'AI systems' },
  { id: 'incidents', label: 'Incidents' }, { id: 'requests', label: 'Requests' }, { id: 'map', label: 'Control map' },
  { id: 'log', label: 'Activity log' }, { id: 'profile', label: 'Profile' },
];

export function WorkspaceScreen({ tab }: { tab: Tab }) {
  const { ds, route, go } = useApp();
  if (!ds || route.screen !== 'workspace') return <p className="muted">Loading client…</p>;
  const w = ds.workspace;
  const tier = classifyTier(w.sector, w.dataSubjects6m);
  return (
    <>
      <div className="head">
        <div>
          <p className="eyebrow">{sectorById(w.sector).label} · {w.cycleYear} cycle</p>
          <h1>{w.name}</h1>
        </div>
        <div className="row"><TierTag tier={tier.tier} /><span className="muted">{TIER_LABEL[tier.tier]}</span></div>
      </div>
      {w.sample && <p className="notice">Sample client. Its records are examples for trying the platform, not real data.</p>}
      <div className="tabs" role="tablist" aria-label="Client sections">
        {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => go({ screen: 'workspace', id: w.id, tab: t.id })}>{t.label}</button>)}
      </div>
      {tab === 'overview' && <Overview />}
      {tab === 'return' && <AuditReturn />}
      {(['activities', 'vendors', 'assessments', 'aiSystems', 'incidents', 'requests'] as const).includes(tab as never) && <CollectionView col={tab as 'activities'} />}
      {tab === 'map' && <ControlMap />}
      {tab === 'log' && <ActivityLog />}
      {tab === 'profile' && <Profile />}
    </>
  );
}

const STATUS_TONE: Record<CarRequirement['status'], Tone> = { met: 'ok', partial: 'warn', missing: 'bad', na: 'none' };
const STATUS_TEXT: Record<CarRequirement['status'], string> = { met: 'Met', partial: 'Partly met', missing: 'Missing', na: 'Not applicable' };

function Overview() {
  const { ds, go } = useApp();
  const t = useNow(1000);
  if (!ds) return null;
  const w = ds.workspace;
  const tier = classifyTier(w.sector, w.dataSubjects6m);
  const car = carReadiness(ds, t);
  const due = auditReturnDue(w.cycleYear);
  const clocks = ds.incidents.filter((i) => i.status !== 'closed').flatMap((i) => breachClocks(i, t).filter((c) => c.state === 'running' || c.state === 'overdue').map((c) => ({ i, c })));
  const reqs = ds.requests.map((r) => ({ r, c: requestClock(r, t) })).filter((x) => x.c.state === 'overdue' || x.c.state === 'due-soon');
  const ai = ds.aiSystems.filter((s) => s.status !== 'retired').map((s) => classifyAI(s, { sector: w.sector, vendors: ds.vendors, assessments: ds.assessments }));
  const highAI = ai.filter((c) => c.risk === 'high' || c.risk === 'unassessed').length;
  const top = car.requirements.filter((r) => r.status === 'missing' || r.status === 'partial').slice(0, 5);
  const W = w.id;

  return (
    <div className="cols">
      <div className="col-1">
        <section className="card">
          <h2>Classification</h2>
          <div className="row"><TierTag tier={tier.tier} /><b>{TIER_LABEL[tier.tier]}</b></div>
          <p>{tier.explanation}</p>
          <p>{tier.filesAuditReturn ? `Files an annual Compliance Audit Return through a licensed DPCO. Due ${fmtDate(due.toISOString())} (${daysUntil(due, t)} days).` : 'Renews registration; no audit return at this tier.'}</p>
          <Prov p={tier.provenance} />
        </section>
        <section className="card">
          <h2>Needs attention now</h2>
          {clocks.length === 0 && reqs.length === 0 && <p className="muted">No regulator clocks running and no requests close to their deadline.</p>}
          {clocks.map(({ i, c }) => (
            <button key={i.id + c.jurisdiction} className="req linkish" style={{ width: '100%', color: 'inherit', fontWeight: 400 }} onClick={() => go({ screen: 'workspace', id: W, tab: 'incidents', open: i.id })}>
              <div className="grow"><b>{i.title}</b><div className="small muted">{c.regulator} · {c.windowText}</div></div>
              <Pill tone={c.state === 'overdue' ? 'bad' : 'warn'}><span className="mono">{c.msRemaining != null ? formatDuration(c.msRemaining) : ''}</span></Pill>
            </button>
          ))}
          {reqs.map(({ r, c }) => (
            <button key={r.id} className="req linkish" style={{ width: '100%', color: 'inherit', fontWeight: 400 }} onClick={() => go({ screen: 'workspace', id: W, tab: 'requests', open: r.id })}>
              <div className="grow"><b>{r.requester}</b><div className="small muted">{r.type.replace(/-/g, ' ')} request</div></div>
              <Pill tone={c.state === 'overdue' ? 'bad' : 'warn'}>{c.state === 'overdue' ? `${Math.abs(c.daysLeft ?? 0)} days overdue` : `${c.daysLeft} days left`}</Pill>
            </button>
          ))}
        </section>
        <div className="tiles">
          <button className="tile linkish" style={{ color: 'inherit' }} onClick={() => go({ screen: 'workspace', id: W, tab: 'activities' })}><div className="n">{ds.activities.length}</div><div className="l">Processing activities</div></button>
          <button className="tile linkish" style={{ color: 'inherit' }} onClick={() => go({ screen: 'workspace', id: W, tab: 'vendors' })}><div className="n">{ds.vendors.length}</div><div className="l">Vendors</div></button>
          <button className="tile linkish" style={{ color: 'inherit' }} onClick={() => go({ screen: 'workspace', id: W, tab: 'aiSystems' })}><div className="n">{ai.length}</div><div className="l">AI systems{highAI ? `, ${highAI} high or unassessed` : ''}</div></button>
        </div>
      </div>
      <section className="card col-2">
        <div className="row"><h2 className="grow">Audit return readiness</h2><span className="mono">{car.score}%</span></div>
        <Bar pct={car.score} large />
        <p className="muted">{car.met} met · {car.partial} partly met · {car.missing} missing, worked out from this client’s records.</p>
        <h3>Biggest gaps</h3>
        {top.length === 0 ? <p>No gaps. Generate the filing pack from the audit return tab.</p> : top.map((r) => (
          <div key={r.id} className="req">
            <div className="grow" style={{ minWidth: 220 }}><b>{r.title}</b><div className="small muted">{r.detail}</div><div className="small mono muted">{r.ref}</div></div>
            <Pill tone={STATUS_TONE[r.status]}>{STATUS_TEXT[r.status]}</Pill>
          </div>
        ))}
        <div><button className="btn primary" onClick={() => go({ screen: 'workspace', id: W, tab: 'return' })}>Open audit return</button></div>
      </section>
    </div>
  );
}

const ATT_FIX: Record<string, string> = { profile: 'Edit profile', activities: 'Open processing', vendors: 'Open vendors', assessments: 'Open assessments', incidents: 'Open incidents', requests: 'Open requests', aiSystems: 'Open AI systems' };

function AuditReturn() {
  const { ds, go, session, saveWorkspace, store, logEvent, toast } = useApp();
  const [pack, setPack] = useState<string | null>(null);
  const t = useNow(15_000);
  if (!ds) return null;
  const w = ds.workspace;
  const car = carReadiness(ds, t);
  const tier = classifyTier(w.sector, w.dataSubjects6m);
  const sections = [...new Set(car.requirements.map((r) => r.section))];

  const attest = async (key: AttestationKey, value: boolean) => {
    const next: Workspace = { ...w, attestations: { ...(w.attestations ?? {}), [key]: { value, by: session.userName, at: now() } }, updatedAt: now() };
    await saveWorkspace(next, `${value ? 'Confirmed' : 'Withdrew'}: ${car.requirements.find((r) => r.attestation === key)?.title}`, 'attest');
  };
  const generate = async () => {
    const md = filingPackMarkdown(ds, { preparedBy: session.userName });
    setPack(md);
    await logEvent({ action: 'generate-pack', collection: 'workspace', summary: `Generated filing pack at ${car.score}% readiness` });
  };
  const download = async () => {
    if (!pack) return;
    const name = `${w.name.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}-audit-return-${w.cycleYear}.md`;
    const r = await store.download(name, pack);
    toast(r === 'saved' ? 'Filing pack downloaded' : r === 'declined' ? 'Download cancelled' : 'Downloads are not available here; copy the text instead');
  };

  return (
    <div className="cols">
      <section className="card col-2">
        <div className="row"><h2 className="grow">Requirements</h2><span className="mono">{car.score}% · {car.met}/{car.applicable} met</span></div>
        <Bar pct={car.score} large />
        {!tier.filesAuditReturn && <p className="notice">At {tier.tier} this client renews registration and does not file an audit return. Keep the records ready for inspection.</p>}
        {sections.map((s) => (
          <div key={s} className="stack" style={{ gap: 0 }}>
            <h3 style={{ marginTop: 8 }}>{s}</h3>
            {car.requirements.filter((r) => r.section === s).map((r) => (
              <div className="req" key={r.id}>
                <div className="grow" style={{ minWidth: 220, flexBasis: 260 }}>
                  <b>{r.title}</b>
                  <div className="small muted">{r.detail}</div>
                  <div className="small mono muted">{r.ref}</div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <Pill tone={STATUS_TONE[r.status]}>{STATUS_TEXT[r.status]}</Pill>
                  {r.attestation && session.canEdit ? (
                    <label className="check small"><input type="checkbox" checked={r.status === 'met'} onChange={(e) => attest(r.attestation!, e.target.checked)} />Confirmed</label>
                  ) : r.status !== 'met' && r.status !== 'na' && r.fixIn !== 'attestations' ? (
                    <button className="btn ghost" onClick={() => go({ screen: 'workspace', id: w.id, tab: r.fixIn as Tab })}>{ATT_FIX[r.fixIn]}</button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
      <div className="col-1">
        <section className="card">
          <h2>Filing pack</h2>
          <p className="muted">A preparation pack for the DPCO to review and file through the NDPC portal: readiness summary, gaps, registers, assessments, AI systems, incidents and requests.</p>
          <div className="row"><button className="btn primary" onClick={generate}>Generate filing pack</button>{pack && <button className="btn" onClick={download}>Download (.md)</button>}</div>
          {pack && <div className="pack" tabIndex={0} aria-label="Filing pack preview">{pack}</div>}
        </section>
        <section className="card">
          <h2>Filing details</h2>
          <div className="kv">
            <div><div className="k">Due</div><div className="v">{fmtDate(auditReturnDue(w.cycleYear).toISOString())}</div></div>
            <div><div className="k">Days left</div><div className="v mono">{daysUntil(auditReturnDue(w.cycleYear), t)}</div></div>
            <div><div className="k">Filing fee range</div><div className="v">₦100,000 – ₦1,000,000</div></div>
          </div>
          <p className="small muted">Late or non-filing: up to 2% of prior-year gross revenue or ₦10m, whichever is greater.</p>
          <Prov p={{ source: 'GAID 2025; NDPC filing notices', confidence: 'secondary', note: 'Confirm the due date each cycle against the NDPC notice.' }} />
        </section>
      </div>
    </div>
  );
}

function ControlMap() {
  const { ds, go } = useApp();
  const [sel, setSel] = useState(CONTROL_MAP[1].id);
  if (!ds) return null;
  const count = (src: string) => src === 'profile' ? 1 : ((ds as unknown as Record<string, unknown[]>)[src]?.length ?? 0);
  const row = CONTROL_MAP.find((r) => r.id === sel)!;
  const hits = FRAMEWORKS.filter((f) => row.refs[f]).length;
  return (
    <>
      <p className="muted">Collect a record once and see every obligation it answers. Choose a record to trace it.</p>
      <div className="card flush tablebox">
        <table style={{ minWidth: 980 }}>
          <thead><tr><th>Evidence</th><th>Records</th>{FRAMEWORKS.map((f) => <th key={f}>{f}</th>)}</tr></thead>
          <tbody>
            {CONTROL_MAP.map((r) => (
              <tr key={r.id} style={r.id === sel ? { background: 'var(--accent-soft)' } : undefined}>
                <td><button className="linkish" aria-pressed={r.id === sel} onClick={() => setSel(r.id)}>{r.evidence}</button></td>
                <td className="mono">{count(r.source) ? count(r.source) : <Pill tone="bad">0</Pill>}</td>
                {FRAMEWORKS.map((f) => <td key={f} className="mono small" style={{ color: r.refs[f] ? undefined : 'var(--faint)' }}>{r.refs[f] ?? '—'}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <section className="card">
        <h2>{row.evidence}</h2>
        <p>One record answers requirements in {hits} of {FRAMEWORKS.length} frameworks. {row.description}</p>
        {row.source !== 'profile' && <div><button className="btn" onClick={() => go({ screen: 'workspace', id: ds.workspace.id, tab: row.source as Tab })}>Open the records</button></div>}
        <Prov p={CONTROL_MAP_PROVENANCE} />
      </section>
    </>
  );
}

function ActivityLog() {
  const { store, ds } = useApp();
  const [rows, setRows] = useState<AuditEntry[] | null>(null);
  useEffect(() => {
    let live = true;
    if (ds) store.listAudit(ds.workspace.id).then((r) => { if (live) setRows(r); }).catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [store, ds]);
  if (!rows) return <p className="muted">Loading activity…</p>;
  if (!rows.length) return <div className="empty"><h2>No activity yet</h2><p className="muted">Every change to this client’s records is listed here with who made it and when.</p></div>;
  return (
    <div className="card flush tablebox">
      <table style={{ minWidth: 640 }}>
        <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="mono small" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.at)}</td><td>{r.actor ?? '—'}</td><td>{r.summary}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Profile() {
  const { ds, saveWorkspace, store, session, go, toast, reload } = useApp();
  const w = ds!.workspace;
  const [values, setValues] = useState(() => initialValues(WORKSPACE_FIELDS, w as unknown as Record<string, unknown>));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const tier = useMemo(() => classifyTier(String(values.sector) as Workspace['sector'], Number(values.dataSubjects6m) || 0), [values.sector, values.dataSubjects6m]);
  const save = async () => {
    const r = validateRecord(WORKSPACE_FIELDS, values);
    setErrors(r.errors);
    if (!r.ok) return;
    await saveWorkspace({ ...w, ...(r.value as Partial<Workspace>), updatedAt: now() }, 'Updated client profile');
    toast('Profile saved');
  };
  return (
    <div className="cols">
      <section className="card col-2">
        <h2>Client profile</h2>
        <fieldset disabled={!session.canEdit} style={{ border: 0, padding: 0, margin: 0 }}>
          <div className="form-grid">
            {WORKSPACE_FIELDS.map((f) => <div key={f.key} className={f.type === 'multiselect' ? 'wide' : ''}><FieldInput f={f} value={values[f.key]} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} error={errors[f.key]} ds={ds} idPrefix="ws" /></div>)}
          </div>
        </fieldset>
        {session.canEdit && <div className="row"><button className="btn primary" onClick={save}>Save profile</button></div>}
      </section>
      <div className="col-1">
        <section className="card">
          <h2>Tier with these details</h2>
          <div className="row"><TierTag tier={tier.tier} /><b>{TIER_LABEL[tier.tier]}</b></div>
          <p>{tier.explanation}</p>
          <p className="small muted">{fmtNum(Number(values.dataSubjects6m) || 0)} data subjects in six months.</p>
          <Prov p={tier.provenance} />
        </section>
        {session.canEdit && (
          <section className="card">
            <h2>Remove client</h2>
            <p className="muted">Deletes the client and every record under it. This cannot be undone.</p>
            {confirm ? (
              <div className="row"><button className="btn danger" onClick={async () => { await store.deleteWorkspace(w.id); toast('Client removed'); go({ screen: 'portfolio' }); reload(); }}>Delete {w.name}</button><button className="btn" onClick={() => setConfirm(false)}>Keep</button></div>
            ) : <div><button className="btn danger" onClick={() => setConfirm(true)}>Remove client</button></div>}
          </section>
        )}
      </div>
    </div>
  );
}
