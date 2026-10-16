import { useEffect, useMemo, useState } from 'react';
import {
  JURISDICTION_CODES, PACKS, RIGHTS, TIER_LABEL, WORKSPACE_FIELDS, actionPlan, auditReturnDue, categoryLabel, classifyAI, complianceReportMarkdown,
  compliance, countryName, evaluateJurisdiction, isVisible, ngCycleYear, ngTierFor, overallScore, sectorById, upcoming, validateRecord, vendorRisk,
  type AuditEntry, type FixIn, type JurisdictionCode, type Requirement, type Workspace,
} from '@tenet/core';
import { useApp, type Tab } from '../context';
import { FieldInput, FormFields, initialValues } from '../forms';
import { newId, now } from '../store/types';
import { Bar, Empty, Jx, Pill, Prov, Status, SubTabs, TierTag, fmtDate, fmtDateTime, fmtNum, slug, useNow } from '../ui';
import { AISystems } from './AISystems';
import { Assessments } from './Assessments';
import { DataMap } from './DataMap';
import { Governance } from './Governance';
import { Incidents } from './Incidents';
import { Requests } from './Requests';
import { Vendors } from './Vendors';

const FIX_TAB: Record<FixIn, Tab> = { profile: 'settings', activities: 'datamap', systems: 'datamap', vendors: 'vendors', assessments: 'assessments', incidents: 'incidents', requests: 'requests', aiSystems: 'ai', governance: 'governance' };
const FIX_LABEL: Record<FixIn, string> = { profile: 'Open settings', activities: 'Open data map', systems: 'Open systems', vendors: 'Open vendors', assessments: 'Open assessments', incidents: 'Open incidents', requests: 'Open requests', aiSystems: 'Open AI systems', governance: 'Open governance' };

export function WorkspaceScreen() {
  const { ds, route, words } = useApp();
  if (!ds || route.screen !== 'ws') return null;
  const w = ds.workspace;
  return (
    <>
      <div className="head">
        <div>
          <p className="eyebrow">{sectorById(w.sector).label} · established in {countryName(w.establishment)}</p>
          <h1>{w.name}</h1>
        </div>
        <Jx codes={w.jurisdictions} />
      </div>
      {w.sample && <p className="notice">Sample {words.entity}. Its records are examples for trying the platform, not real data.</p>}
      {route.tab === 'overview' && <Overview />}
      {route.tab === 'compliance' && <Compliance />}
      {route.tab === 'actions' && <Actions />}
      {route.tab === 'datamap' && <DataMap />}
      {route.tab === 'vendors' && <Vendors />}
      {route.tab === 'ai' && <AISystems />}
      {route.tab === 'assessments' && <Assessments />}
      {route.tab === 'incidents' && <Incidents />}
      {route.tab === 'requests' && <Requests />}
      {route.tab === 'governance' && <Governance />}
      {route.tab === 'log' && <ActivityLog />}
      {route.tab === 'settings' && <Settings />}
    </>
  );
}

function Overview() {
  const { ds, go } = useApp();
  const t = useNow(30_000);
  if (!ds) return null;
  const w = ds.workspace;
  const res = compliance(ds, t);
  const plan = actionPlan(ds, t);
  const soon = upcoming(ds, t, 60);
  const highVendors = ds.vendors.filter((v) => vendorRisk(v, ds, t).tier === 'high').length;
  const highAI = ds.aiSystems.filter((s) => s.status !== 'retired' && ['high', 'unassessed'].includes(classifyAI(s, { sector: w.sector, jurisdictions: w.jurisdictions, vendors: ds.vendors, assessments: ds.assessments }).risk)).length;
  const W = w.id;
  const tile = (n: number, l: string, tab: Tab, warn?: number) => (
    <button className="tile linkish" style={{ color: 'inherit' }} onClick={() => go({ screen: 'ws', id: W, tab })}><div className="n">{n}</div><div className="l">{l}{warn ? <span style={{ color: 'var(--bad)' }}> · {warn} need attention</span> : ''}</div></button>
  );
  return (
    <>
      <div className="jxgrid">
        {res.map((r) => (
          <button key={r.code} className="card jxcard linkish" onClick={() => go({ screen: 'ws', id: W, tab: 'compliance', sub: r.code })}>
            <div className="row"><b className="grow">{PACKS[r.code].name}</b><span className="mono">{r.score}%</span></div>
            <Bar pct={r.score} />
            <span className="small muted">{PACKS[r.code].shortLaw} · {r.met} met · {r.partial} partly · {r.missing} missing</span>
            {r.code === 'NG' && <span className="small"><TierTag tier={ngTierFor(w).tier} /> {TIER_LABEL[ngTierFor(w).tier]}</span>}
          </button>
        ))}
      </div>
      <div className="cols">
        <section className="card col-2">
          <div className="row"><h2 className="grow">Highest-impact actions</h2><button className="btn ghost" onClick={() => go({ screen: 'ws', id: W, tab: 'actions' })}>Full action plan</button></div>
          {plan.length === 0 ? <p className="muted">No gaps found across {res.length} jurisdiction{res.length > 1 ? 's' : ''}.</p> : plan.slice(0, 6).map((a) => (
            <div key={a.key} className="req">
              <div className="grow" style={{ minWidth: 220 }}><b>{a.title}</b><div className="small muted">{a.details[0].detail}</div></div>
              <div className="row" style={{ gap: 6 }}><Jx codes={a.jurisdictions} /><Pill tone={a.severity === 'high' ? 'bad' : a.severity === 'medium' ? 'warn' : 'none'}>{a.severity}</Pill></div>
            </div>
          ))}
        </section>
        <section className="card col-1">
          <h2>Coming up</h2>
          {soon.length === 0 ? <p className="muted">Nothing due in the next 60 days.</p> : soon.slice(0, 8).map((d, i) => (
            <button key={i} className="req linkish" style={{ width: '100%', color: 'inherit', fontWeight: 400 }} onClick={() => go({ screen: 'ws', id: W, tab: FIX_TAB[d.fixIn], open: d.id })}>
              <div className="grow"><b>{d.label}</b><div className="small muted">{d.detail}</div></div>
              <Pill tone={d.overdue ? 'bad' : 'warn'}>{d.overdue ? 'Overdue' : fmtDate(d.date)}</Pill>
            </button>
          ))}
        </section>
      </div>
      <div className="tiles">
        {tile(ds.activities.filter((a) => a.status !== 'retired').length, 'Processing activities', 'datamap')}
        {tile(ds.systems.length, 'Systems', 'datamap')}
        {tile(ds.vendors.length, 'Vendors', 'vendors', highVendors)}
        {tile(ds.aiSystems.filter((s) => s.status !== 'retired').length, 'AI systems', 'ai', highAI)}
        {tile(ds.incidents.filter((i) => i.stage !== 'closed').length, 'Open incidents', 'incidents')}
        {tile(ds.requests.filter((r) => r.stage !== 'responded' && r.stage !== 'refused').length, 'Open requests', 'requests')}
      </div>
    </>
  );
}

function LawFacts({ code }: { code: JurisdictionCode }) {
  const p = PACKS[code];
  const rights = RIGHTS.filter((r) => p.rights.available[r.id]);
  const missingRights = RIGHTS.filter((r) => !p.rights.available[r.id] && r.id !== 'complaint');
  return (
    <section className="card">
      <h2>How {p.shortLaw} works here</h2>
      <div className="kv">
        <div><div className="k">Regulator</div><div className="v">{p.regulator}</div></div>
        <div><div className="k">Officer</div><div className="v">{p.officer.title}</div></div>
        <div><div className="k">Breach notice</div><div className="v">{p.breach.window}</div></div>
        <div><div className="k">Impact assessment</div><div className="v">{p.dpia.name}{p.dpia.binding ? '' : ' (recommended)'}</div></div>
      </div>
      <p className="small"><b>{p.sensitive.term[0].toUpperCase() + p.sensitive.term.slice(1)}</b> ({p.sensitive.ref}): {p.sensitive.categories.map(categoryLabel).join(', ')}.</p>
      <p className="small"><b>Rights:</b> {rights.map((r) => `${r.label}${p.rights.available[r.id]?.days ? ` (${p.rights.available[r.id]!.days} days)` : ''}`).join(', ')}.{missingRights.length ? ` Not provided: ${missingRights.map((r) => r.label.toLowerCase()).join(', ')}.` : ''}{p.rights.defaultDays ? ` Default response period ${p.rights.defaultDays} days.` : ' No fixed response period.'}</p>
      <p className="small"><b>Transfers:</b> {p.transfers ? `${p.transfers.summary} (${p.transfers.ref})` : 'No specific transfer rule in the law.'}</p>
      <Prov p={p.rights.prov} />
    </section>
  );
}

function Compliance() {
  const { ds, route, go, download, session } = useApp();
  const t = useNow(30_000);
  if (!ds || route.screen !== 'ws') return null;
  const w = ds.workspace;
  const code = (route.sub && w.jurisdictions.includes(route.sub as JurisdictionCode) ? route.sub : w.jurisdictions[0]) as JurisdictionCode;
  if (!code) return <Empty title="No laws selected">Choose the laws that apply in entity settings.</Empty>;
  const res = evaluateJurisdiction(code, ds, t);
  const sections = [...new Set(res.requirements.map((r) => r.section))];
  const pack = PACKS[code];
  const isNg = code === 'NG';
  const exportReport = () => download(`${slug(w.name)}-${isNg ? 'ndpc-audit-return-pack' : slug(pack.shortLaw) + '-report'}.md`, complianceReportMarkdown(ds, code, { preparedBy: session.userName }));
  return (
    <>
      <SubTabs label="Jurisdiction" value={code} onChange={(c) => go({ screen: 'ws', id: w.id, tab: 'compliance', sub: c })} tabs={w.jurisdictions.map((c) => ({ id: c, label: PACKS[c].name }))} />
      <div className="cols">
        <section className="card col-2">
          <div className="row"><div className="grow"><h2>{pack.law}</h2><p className="small muted">{pack.blurb}</p></div><span className="mono">{res.score}%</span></div>
          <Bar pct={res.score} large />
          <p className="small muted">{res.met} met · {res.partial} partly met · {res.missing} missing, of {res.applicable} binding requirements. Worked out from this entity’s records.</p>
          {sections.map((s) => (
            <div key={s} className="stack" style={{ gap: 0 }}>
              <h3 style={{ marginTop: 10 }}>{s}</h3>
              {res.requirements.filter((r) => r.section === s).map((r) => <RequirementRow key={r.key} r={r} onFix={() => go({ screen: 'ws', id: w.id, tab: FIX_TAB[r.fixIn] })} />)}
            </div>
          ))}
        </section>
        <div className="col-1">
          {isNg && (() => { const tier = ngTierFor(w); const cyc = ngCycleYear(w); return (
            <section className="card">
              <h2>NDPC classification</h2>
              <div className="row"><TierTag tier={tier.tier} /><b>{TIER_LABEL[tier.tier]}</b></div>
              <p>{tier.explanation}</p>
              <p className="small">{tier.filesAuditReturn ? `Annual Compliance Audit Return for ${cyc} due ${fmtDate(auditReturnDue(cyc))}.` : 'Registration renewal only; no audit return at this tier.'}</p>
              <Prov p={tier.provenance} />
            </section>
          ); })()}
          <section className="card">
            <h2>{isNg ? 'Audit return pack' : 'Report'}</h2>
            <p className="small muted">{isNg ? 'Readiness, gaps, record of processing and AI parameters, for the DPCO to review before filing through the NDPC portal.' : `A ${pack.shortLaw} report of requirements, gaps and the record of processing in scope.`}</p>
            <div><button className="btn primary" onClick={exportReport}>{isNg ? 'Download filing pack (.md)' : 'Download report (.md)'}</button></div>
          </section>
          <LawFacts code={code} />
        </div>
      </div>
    </>
  );
}

function RequirementRow({ r, onFix }: { r: Requirement; onFix: () => void }) {
  return (
    <div className="req">
      <div className="grow" style={{ minWidth: 220, flexBasis: 280 }}>
        <b>{r.title}</b>{!r.binding && <span className="small muted"> · recommended</span>}
        <div className="small muted">{r.detail}</div>
        <div className="small mono muted">{r.ref}</div>
        {r.provenance && r.provenance.confidence !== 'primary' && <Prov p={r.provenance} />}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <Status s={r.status} />
        {(r.status === 'missing' || r.status === 'partial') && <button className="btn ghost" onClick={onFix}>{FIX_LABEL[r.fixIn]}</button>}
      </div>
    </div>
  );
}

function Actions() {
  const { ds, go, saveRecord, session } = useApp();
  const t = useNow(60_000);
  if (!ds) return null;
  const plan = actionPlan(ds, t);
  const tasks = ds.tasks;
  const multi = plan.filter((a) => a.jurisdictions.length > 1).length;
  return (
    <>
      <p className="muted">Every gap across {ds.workspace.jurisdictions.length} jurisdiction{ds.workspace.jurisdictions.length > 1 ? 's' : ''}, merged where one fix clears several.{multi ? ` ${multi} of ${plan.length} actions satisfy more than one law.` : ''}</p>
      {plan.length === 0 ? <Empty title="No open actions">Every requirement for the selected laws is met.</Empty> : (
        <div className="card flush">
          {plan.map((a) => {
            const task = tasks.find((x) => x.gapKey === a.key && x.status !== 'done');
            return (
              <div key={a.key} className="req" style={{ padding: '14px 18px' }}>
                <div className="grow" style={{ minWidth: 240, flexBasis: 320 }}>
                  <div className="row" style={{ gap: 8 }}><Pill tone={a.severity === 'high' ? 'bad' : a.severity === 'medium' ? 'warn' : 'none'}>{a.severity}</Pill><b>{a.title}</b></div>
                  {a.details.map((d) => <div key={d.code} className="small"><Jx codes={[d.code]} /> <span className="muted">{d.detail}</span></div>)}
                  <div className="small mono muted">{a.refs.join(' · ')}</div>
                </div>
                <div className="stack" style={{ gap: 6, alignItems: 'flex-end' }}>
                  <button className="btn" onClick={() => go({ screen: 'ws', id: ds.workspace.id, tab: FIX_TAB[a.fixIn] })}>{FIX_LABEL[a.fixIn]}</button>
                  {task ? <span className="small muted">Task: {task.owner ?? 'unassigned'}{task.due ? `, due ${task.due}` : ''}</span>
                    : session.canEdit && <button className="btn ghost" onClick={() => saveRecord('tasks', { id: newId(), title: a.title, detail: a.details.map((d) => `${PACKS[d.code].shortLaw}: ${d.detail}`).join('\n'), gapKey: a.key, status: 'open', createdAt: now(), updatedAt: now() }, `Created task: ${a.title}`)}>Make it a task</button>}
                </div>
              </div>
            );
          })}
        </div>
      )}
      <TaskList />
    </>
  );
}

function TaskList() {
  const { ds, saveRecord, session } = useApp();
  if (!ds || !ds.tasks.length) return null;
  const rows = ds.tasks.slice().sort((a, b) => (a.status === 'done' ? 1 : 0) - (b.status === 'done' ? 1 : 0) || String(a.due ?? '9').localeCompare(String(b.due ?? '9')));
  return (
    <section className="card flush tablebox">
      <div style={{ padding: '14px 18px 4px' }}><h2>Tasks</h2></div>
      <table style={{ minWidth: 640 }}>
        <thead><tr><th>Task</th><th>Owner</th><th>Due</th><th>Status</th></tr></thead>
        <tbody>{rows.map((x) => (
          <tr key={x.id}>
            <td>{x.title}</td>
            <td><input type="text" aria-label={`Owner of ${x.title}`} disabled={!session.canEdit} defaultValue={x.owner ?? ''} onBlur={(e) => e.target.value !== (x.owner ?? '') && saveRecord('tasks', { ...x, owner: e.target.value, updatedAt: now() } as never, `Assigned task: ${x.title}`)} /></td>
            <td><input type="date" aria-label={`Due date of ${x.title}`} disabled={!session.canEdit} defaultValue={x.due ?? ''} onBlur={(e) => e.target.value !== (x.due ?? '') && saveRecord('tasks', { ...x, due: e.target.value, updatedAt: now() } as never, `Set due date: ${x.title}`)} /></td>
            <td><select aria-label={`Status of ${x.title}`} disabled={!session.canEdit} value={x.status} onChange={(e) => saveRecord('tasks', { ...x, status: e.target.value, updatedAt: now() } as never, `Task ${e.target.value}: ${x.title}`)}><option value="open">Open</option><option value="in-progress">In progress</option><option value="done">Done</option></select></td>
          </tr>
        ))}</tbody>
      </table>
    </section>
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
  if (!rows.length) return <Empty title="No activity yet">Every change to this entity’s records is listed here with who made it and when.</Empty>;
  return (
    <div className="card flush tablebox">
      <table style={{ minWidth: 640 }}>
        <thead><tr><th>When</th><th>Who</th><th>What</th></tr></thead>
        <tbody>{rows.map((r) => <tr key={r.id}><td className="mono small" style={{ whiteSpace: 'nowrap' }}>{fmtDateTime(r.at)}</td><td>{r.actor ?? '—'}</td><td>{r.summary}</td></tr>)}</tbody>
      </table>
    </div>
  );
}

function Settings() {
  const { ds, saveWorkspace, store, session, go, toast, reload, words, workspaces, org } = useApp();
  const w = ds!.workspace;
  const [values, setValues] = useState(() => initialValues(WORKSPACE_FIELDS, w as unknown as Record<string, unknown>));
  const [jx, setJx] = useState<Workspace['jx']>(() => JSON.parse(JSON.stringify(w.jx ?? {})));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirm, setConfirm] = useState(false);
  const selected = (values.jurisdictions as JurisdictionCode[]) ?? [];
  const hidden = JURISDICTION_CODES.filter((c) => !selected.includes(c) && jx[c] && Object.values(jx[c]!).some((v) => v !== undefined && v !== '' && v !== false));
  const draft = useMemo(() => ({ ...w, ...(values as Partial<Workspace>), jx }) as Workspace, [w, values, jx]);
  const tier = selected.includes('NG') ? ngTierFor(draft) : null;
  const setJ = (c: JurisdictionCode, k: string, v: unknown) => setJx((s) => ({ ...s, [c]: { ...(s[c] ?? {}), [k]: v } }));

  const save = async () => {
    const r = validateRecord(WORKSPACE_FIELDS, values);
    const jErr: Record<string, string> = {};
    const cleanJx: Workspace['jx'] = { ...jx };
    for (const c of selected) {
      const jr = validateRecord(PACKS[c].profileFields, (jx[c] ?? {}) as Record<string, unknown>);
      Object.entries(jr.errors).forEach(([k, e]) => { jErr[`${c}.${k}`] = e; });
      cleanJx[c] = { ...(jx[c] ?? {}), ...jr.value };
    }
    setErrors({ ...r.errors, ...jErr });
    if (!r.ok || Object.keys(jErr).length) return;
    await saveWorkspace({ ...w, ...(r.value as Partial<Workspace>), jx: cleanJx, updatedAt: now() }, 'Updated entity settings');
    toast('Settings saved');
  };

  return (
    <div className="cols">
      <div className="col-2">
        <section className="card">
          <h2>{words.Entity}</h2>
          <FormFields fields={WORKSPACE_FIELDS} values={values} set={(k, v) => setValues((s) => ({ ...s, [k]: v }))} errors={errors} ds={ds} ctx={{}} idPrefix="ws" disabled={!session.canEdit} />
        </section>
        {selected.map((c) => (
          <section key={c} className="card">
            <div className="row"><h2 className="grow">{PACKS[c].name}</h2><Jx codes={[c]} /></div>
            <p className="small muted">{PACKS[c].blurb}</p>
            <fieldset disabled={!session.canEdit} style={{ border: 0, padding: 0, margin: 0 }}>
              <div className="form-grid">
                {PACKS[c].profileFields.filter((f) => isVisible(f, (jx[c] ?? {}) as Record<string, unknown>, { workspace: draft })).map((f) => {
                  const shown = f.key === 'representative' && ((c === 'EU' && PACKS.EU.transfers!.isDomestic(String(values.establishment))) || (c === 'UK' && values.establishment === 'GB')) ? null : f;
                  return shown && <div key={f.key}><FieldInput f={f} value={(jx[c] ?? {})[f.key] ?? f.default} onChange={(v) => setJ(c, f.key, v)} error={errors[`${c}.${f.key}`]} ds={ds} ctx={{ workspace: draft }} idPrefix={`jx-${c}`} /></div>;
                })}
              </div>
            </fieldset>
            {c === 'NG' && tier && <p className="small"><TierTag tier={tier.tier} /> {tier.explanation}</p>}
            {c === 'ZA' && <p className="small muted">The Information Officer is recorded here; the privacy lead above is used as the deputy where different.</p>}
          </section>
        ))}
        {hidden.length > 0 && <p className="small muted">Values kept for laws no longer selected ({hidden.map((c) => PACKS[c].name).join(', ')}). They are not shown or checked unless you select the law again.</p>}
        {session.canEdit && <div className="row"><button className="btn primary" onClick={save}>Save settings</button></div>}
      </div>
      <div className="col-1">
        <section className="card">
          <h2>Laws switched on</h2>
          {selected.map((c) => <p key={c} className="small"><Jx codes={[c]} /> {PACKS[c].law}. Regulator: {PACKS[c].regulator}.</p>)}
          <p className="small muted">Records only offer these jurisdictions. Removing one hides its fields, deadlines and checks everywhere.</p>
        </section>
        {session.canEdit && (org.mode === 'advisory' || workspaces.length > 1 || session.isAdmin) && (
          <section className="card">
            <h2>Remove {words.entity}</h2>
            <p className="muted">Deletes {w.name} and every record under it. This cannot be undone.</p>
            {confirm
              ? <div className="row"><button className="btn danger" onClick={async () => { await store.deleteWorkspace(w.id); toast(`${words.Entity} removed`); go({ screen: 'home' }); reload(); }}>Delete {w.name}</button><button className="btn" onClick={() => setConfirm(false)}>Keep</button></div>
              : <div><button className="btn danger" onClick={() => setConfirm(true)}>Remove {words.entity}</button></div>}
          </section>
        )}
        <p className="small muted">{fmtNum(ds!.activities.length)} activities, {fmtNum(ds!.systems.length)} systems, {fmtNum(ds!.vendors.length)} vendors on record.</p>
      </div>
    </div>
  );
}

export { overallScore };
