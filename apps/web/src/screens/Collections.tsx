import { useEffect, useState, type ReactNode } from 'react';
import {
  AI_DOMAINS, COLLECTION_META, COUNTRY_NAMES, DPIA_QUESTIONS, DPIA_TRIGGER_PROVENANCE, JURISDICTIONS, PASSTHROUGH,
  breachClocks, classifyAI, dpiaInherentRisk, dpiaStatusFor, dpiaTriggers, formatDuration, requestClock,
  type AISystem, type CollectionName, type Dataset, type FieldDef, type Incident, type JurisdictionCode, type ProcessingActivity,
} from '@tenet/core';
import { useApp } from '../context';
import { RecordDrawer } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Drawer, Pill, Prov, fmtDate, fmtDateTime, fmtNum, lower, useNow, type Tone } from '../ui';

type Row = AnyRecord;

function display(f: FieldDef, v: unknown, ds: Dataset): ReactNode {
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return <span className="muted">—</span>;
  switch (f.type) {
    case 'boolean': return v ? 'Yes' : 'No';
    case 'number': return <span className="mono">{fmtNum(Number(v))}</span>;
    case 'date': return fmtDate(String(v));
    case 'datetime': return fmtDateTime(String(v));
    case 'select': return f.options?.find((o) => o.value === v)?.label ?? String(v);
    case 'multiselect': return (v as string[]).map((x) => f.options?.find((o) => o.value === x)?.label ?? x).join(', ');
    case 'tags': return (v as string[]).join(', ');
    case 'ref': {
      const rows = (ds as unknown as Record<string, Row[]>)[f.ref!] ?? [];
      const name = (id: string) => { const r = rows.find((x) => x.id === id); return (r?.name ?? r?.title ?? '—') as string; };
      return Array.isArray(v) ? v.map(name).join(', ') : name(String(v));
    }
    default: return String(v);
  }
}

const RISK_TONE: Record<string, Tone> = { high: 'bad', unassessed: 'warn', limited: 'info', minimal: 'ok' };

function extraColumns(col: CollectionName, ds: Dataset, t: Date): { label: string; cell: (r: Row) => ReactNode }[] {
  switch (col) {
    case 'activities': return [{ label: 'DPIA', cell: (r) => {
      const a = r as unknown as ProcessingActivity; const trig = dpiaTriggers(a);
      if (!trig.length) return <Pill tone="none">Not required</Pill>;
      const s = dpiaStatusFor(a, ds.assessments);
      return <Pill tone={s === 'approved' ? 'ok' : s === 'in-progress' ? 'warn' : 'bad'}>{s === 'approved' ? 'Approved' : s === 'in-progress' ? 'In progress' : 'Required'}</Pill>;
    } }];
    case 'vendors': return [{ label: 'Transfer', cell: (r) => {
      if (r.country === 'NG') return <Pill tone="none">In Nigeria</Pill>;
      const m = r.transferMechanism as string;
      return m === 'none' || m === 'not-needed' ? <Pill tone="bad">No basis</Pill> : m === 'pending-approval' ? <Pill tone="warn">Pending NDPC</Pill> : <Pill tone="ok">Recorded</Pill>;
    } }];
    case 'assessments': return [{ label: 'Inherent risk', cell: (r) => {
      const x = dpiaInherentRisk((r.answers as Record<string, boolean>) ?? {});
      return <Pill tone={x.level === 'high' ? 'bad' : x.level === 'medium' ? 'warn' : 'ok'}>{x.level} · {x.score}/{x.max}</Pill>;
    } }];
    case 'aiSystems': return [{ label: 'Risk', cell: (r) => {
      const c = classifyAI(r as unknown as AISystem, { sector: ds.workspace.sector, vendors: ds.vendors, assessments: ds.assessments });
      const open = c.obligations.filter((o) => o.binding && o.status === 'open').length;
      return <div className="row" style={{ gap: 6 }}><Pill tone={RISK_TONE[c.risk]}>{c.risk}</Pill>{open > 0 && <span className="small muted">{open} open</span>}</div>;
    } }];
    case 'incidents': return [{ label: 'Regulator clocks', cell: (r) => {
      const cl = breachClocks(r as unknown as Incident, t);
      return <div className="stack" style={{ gap: 4 }}>{cl.map((c) => <span key={c.jurisdiction}><Pill tone={c.state === 'overdue' ? 'bad' : c.state === 'running' ? 'warn' : c.state === 'notified' ? 'ok' : 'none'}>{c.jurisdiction} · {c.state === 'running' ? formatDuration(c.msRemaining!) : c.state.replace(/-/g, ' ')}</Pill></span>)}</div>;
    } }];
    case 'requests': return [{ label: 'Deadline', cell: (r) => {
      const c = requestClock(r as never, t);
      if (c.state === 'done') return <Pill tone="ok">Closed</Pill>;
      if (c.state === 'no-fixed-window') return <Pill tone="none">Reasonable time</Pill>;
      return <Pill tone={c.state === 'overdue' ? 'bad' : c.state === 'due-soon' ? 'warn' : 'info'}>{c.state === 'overdue' ? `${Math.abs(c.daysLeft!)}d overdue` : `${c.daysLeft}d left`}</Pill>;
    } }];
  }
}

const EMPTY_TEXT: Record<CollectionName, string> = {
  activities: 'List each way this client uses personal data, with its purpose and lawful basis. The audit return and DPIA checks read from here.',
  vendors: 'Record every processor and where it processes data. Agreements and transfer bases feed the audit return.',
  assessments: 'DPIAs, AI impact assessments and other assessments. Link each to the activity or AI system it covers.',
  aiSystems: 'Register every AI system, including tools staff use without approval. Each is classified against NDPA, GAID, CBN, ISO 42001 and the EU AI Act.',
  incidents: 'Log a breach as soon as you know of it. Regulator clocks start from the moment of awareness.',
  requests: 'Log every access, erasure or other request and every complaint. Deadlines follow the requester’s jurisdiction.',
};

export function CollectionView({ col }: { col: CollectionName }) {
  const { ds, route, go, saveRecord, deleteRecord, session } = useApp();
  const meta = COLLECTION_META[col];
  const t = useNow(col === 'incidents' ? 1000 : 30_000);
  const [editing, setEditing] = useState<Row | 'new' | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const open = route.screen === 'workspace' ? route.open : undefined;

  useEffect(() => {
    if (!open) return;
    if (col === 'aiSystems' || col === 'incidents') setViewing(open);
    else { const r = rows.find((x) => x.id === open); if (r) setEditing(r); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, col]);

  if (!ds) return null;
  const rows = ((ds as unknown as Record<string, Row[]>)[col] ?? []).slice().sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
  const cols = meta.fields.filter((f) => !f.listHidden).slice(0, 5);
  const extra = extraColumns(col, ds, t);
  const hasDetail = col === 'aiSystems' || col === 'incidents';
  const close = () => { setEditing(null); setViewing(null); if (open) go({ screen: 'workspace', id: ds.workspace.id, tab: col }); };
  const viewed = viewing ? rows.find((r) => r.id === viewing) : undefined;

  return (
    <>
      <div className="row">
        <p className="muted grow">{rows.length} {rows.length === 1 ? meta.singular : lower(meta.label)}</p>
        {session.canEdit && <button className="btn primary" onClick={() => setEditing('new')}>Add {meta.singular}</button>}
      </div>
      {rows.length === 0 ? (
        <div className="empty"><h2>No {lower(meta.label)} yet</h2><p className="muted">{EMPTY_TEXT[col]}</p>{session.canEdit && <button className="btn primary" onClick={() => setEditing('new')}>Add {meta.singular}</button>}</div>
      ) : (
        <div className="card flush tablebox">
          <table style={{ minWidth: 760 }}>
            <thead><tr>{cols.map((f) => <th key={f.key}>{f.label}</th>)}{extra.map((x) => <th key={x.label}>{x.label}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="click" onClick={() => (hasDetail ? setViewing(r.id) : setEditing(r))}>
                  {cols.map((f, i) => <td key={f.key}>{i === 0 ? <button className="linkish" onClick={(e) => { e.stopPropagation(); hasDetail ? setViewing(r.id) : setEditing(r); }}>{display(f, r[f.key], ds)}</button> : display(f, r[f.key], ds)}</td>)}
                  {extra.map((x) => <td key={x.label}>{x.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewed && col === 'aiSystems' && <AIDetail sys={viewed as unknown as AISystem} onClose={close} onEdit={() => { setEditing(viewed); setViewing(null); }} />}
      {viewed && col === 'incidents' && <IncidentDetail inc={viewed as unknown as Incident} onClose={close} onEdit={() => { setEditing(viewed); setViewing(null); }} />}

      {editing && (
        <RecordDrawer
          title={editing === 'new' ? `New ${meta.singular}` : `Edit ${meta.singular}`}
          fields={meta.fields} record={editing === 'new' ? undefined : editing} ds={ds} readOnly={!session.canEdit}
          passthrough={PASSTHROUGH[col]}
          onClose={close}
          onSave={async (v) => {
            const base = editing === 'new' ? { id: newId(), createdAt: now() } : editing;
            const rec = { ...base, ...v, updatedAt: now() } as Row;
            if (col === 'incidents') { rec.notified ??= {}; rec.notRequired ??= {}; }
            if (col === 'assessments') rec.answers ??= {};
            await saveRecord(col, rec, `${editing === 'new' ? 'Added' : 'Updated'} ${meta.singular}: ${String(rec[meta.titleKey] ?? '')}`);
            close();
          }}
          onDelete={editing === 'new' ? undefined : async () => { await deleteRecord(col, editing); close(); }}
          extra={col === 'assessments' ? (v, set) => <DpiaQuestions values={v} set={set} ds={ds} /> : col === 'activities' ? (v) => <TriggerHint values={v} /> : undefined}
        />
      )}
    </>
  );
}

function TriggerHint({ values }: { values: Record<string, unknown> }) {
  const trig = dpiaTriggers({
    sensitive: !!values.sensitive, children: !!values.children, automatedDecisions: !!values.automatedDecisions,
    largeScaleMonitoring: !!values.largeScaleMonitoring, newTechnology: !!values.newTechnology, volume: Number(values.volume) || 0, crossBorder: !!values.crossBorder,
  });
  return (
    <section className="card">
      <h2>{trig.length ? 'A DPIA is required' : 'No DPIA trigger met'}</h2>
      {trig.length > 0 && <ul style={{ margin: 0, paddingLeft: 18 }}>{trig.map((x) => <li key={x.id}>{x.label} <span className="mono small muted">{x.ref}</span></li>)}</ul>}
      <Prov p={DPIA_TRIGGER_PROVENANCE} />
    </section>
  );
}

function DpiaQuestions({ values, set, ds }: { values: Record<string, unknown>; set: (k: string, v: unknown) => void; ds: Dataset }) {
  const answers = (values.answers as Record<string, boolean>) ?? {};
  const r = dpiaInherentRisk(answers);
  const act = ds.activities.find((a) => a.id === values.activityId);
  const trig = act ? dpiaTriggers(act) : [];
  return (
    <section className="card">
      <div className="row"><h2 className="grow">Screening questions</h2><Pill tone={r.level === 'high' ? 'bad' : r.level === 'medium' ? 'warn' : 'ok'}>Inherent risk {r.level} · {r.score}/{r.max}</Pill></div>
      {act && <p className="small muted">{act.name}: {trig.length ? `triggers ${trig.map((x) => x.label.toLowerCase()).join('; ')}.` : 'no DPIA trigger met.'}</p>}
      {DPIA_QUESTIONS.map((q) => (
        <label key={q.id} className="check"><input type="checkbox" checked={!!answers[q.id]} onChange={(e) => set('answers', { ...answers, [q.id]: e.target.checked })} /><span>{q.text}</span></label>
      ))}
    </section>
  );
}

function AIDetail({ sys, onClose, onEdit }: { sys: AISystem; onClose: () => void; onEdit: () => void }) {
  const { ds, session } = useApp();
  const c = classifyAI(sys, { sector: ds!.workspace.sector, vendors: ds!.vendors, assessments: ds!.assessments });
  const vendor = ds!.vendors.find((v) => v.id === sys.vendorId);
  return (
    <Drawer title={sys.name} onClose={onClose} footer={session.canEdit ? <button className="btn primary" onClick={onEdit}>Edit system</button> : undefined}>
      <div className="row"><Pill tone={RISK_TONE[c.risk]}>{c.risk} risk</Pill>{c.reasons.map((r) => <span key={r} className="small muted">{r}</span>)}</div>
      <p>{sys.purpose}</p>
      <div className="kv">
        <div><div className="k">Use</div><div className="v">{AI_DOMAINS.find((d) => d.id === sys.domain)?.label}</div></div>
        <div><div className="k">Sourcing</div><div className="v">{sys.sourcing}{vendor ? ` · ${vendor.name} (${COUNTRY_NAMES[vendor.country] ?? vendor.country})` : ''}</div></div>
        <div><div className="k">Markets</div><div className="v">{sys.markets.map((m) => JURISDICTIONS[m].name).join(', ')}</div></div>
        <div><div className="k">Human oversight</div><div className="v">{sys.humanOversight || 'Not documented'}</div></div>
      </div>
      <h3>Obligations</h3>
      <div className="stack" style={{ gap: 0 }}>
        {c.obligations.map((o) => (
          <div className="req" key={o.id}>
            <div className="grow" style={{ minWidth: 220 }}>
              <div><b>{o.framework}</b> <span className="mono small">{o.ref}</span>{!o.binding && <span className="small muted"> · voluntary</span>}</div>
              <div>{o.requirement}</div>
              <div className="small muted">{o.why}</div>
              <Prov p={o.provenance} />
            </div>
            <Pill tone={o.status === 'met' ? 'ok' : o.status === 'open' ? (o.binding ? 'bad' : 'warn') : 'none'}>{o.status === 'met' ? 'Met' : o.status === 'open' ? 'Open' : 'Recommended'}</Pill>
          </div>
        ))}
      </div>
    </Drawer>
  );
}

function IncidentDetail({ inc, onClose, onEdit }: { inc: Incident; onClose: () => void; onEdit: () => void }) {
  const { saveRecord, session } = useApp();
  const t = useNow(1000);
  const [reasonFor, setReasonFor] = useState<JurisdictionCode | null>(null);
  const [reason, setReason] = useState('');
  const clocks = breachClocks(inc, t);
  const ng = clocks.find((c) => c.jurisdiction === 'NG') ?? clocks[0];
  const update = (patch: Partial<Incident>, summary: string) => saveRecord('incidents', { ...inc, ...patch, updatedAt: now() } as unknown as AnyRecord, summary);
  return (
    <Drawer title={inc.title} onClose={onClose} footer={session.canEdit ? <button className="btn primary" onClick={onEdit}>Edit incident</button> : undefined}>
      <p className="muted">Became aware {fmtDateTime(inc.awareAt)} · {fmtNum(inc.affectedCount)} people · {inc.status}</p>
      {ng && ng.deadline && (
        <section className="card dark">
          <span className="small" style={{ color: 'var(--rail-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ng.state === 'notified' ? 'Notified' : ng.state === 'not-required' ? 'Not notifiable' : `${ng.regulator.split(' (')[0]} notification ${ng.state === 'overdue' ? 'overdue by' : 'due in'}`}</span>
          <span className="clock">{ng.state === 'notified' ? fmtDateTime(ng.notifiedAt) : ng.state === 'not-required' ? 'Decision recorded' : formatDuration(Math.abs(ng.msRemaining!)).replace(' overdue', '')}</span>
          <span className="small" style={{ color: 'var(--rail-muted)' }}>Deadline {fmtDateTime(ng.deadline)} · {ng.ref}, {ng.windowText}</span>
        </section>
      )}
      {inc.description && <p>{inc.description}</p>}
      <h3>Regulators</h3>
      {clocks.map((c) => (
        <div className="req" key={c.jurisdiction}>
          <div className="grow" style={{ minWidth: 220 }}><b>{c.regulator}</b><div className="small muted">{c.windowText}</div><Prov p={c.provenance} />{inc.notRequired?.[c.jurisdiction] && <div className="small">Reason: {inc.notRequired[c.jurisdiction]}</div>}</div>
          <div className="row" style={{ gap: 8 }}>
            <Pill tone={c.state === 'overdue' ? 'bad' : c.state === 'running' ? 'warn' : c.state === 'notified' ? 'ok' : 'none'}>{c.state === 'running' ? formatDuration(c.msRemaining!) : c.state.replace(/-/g, ' ')}</Pill>
            {session.canEdit && (c.state === 'running' || c.state === 'overdue' || c.state === 'no-fixed-window') && (
              <>
                <button className="btn" onClick={() => update({ notified: { ...(inc.notified ?? {}), [c.jurisdiction]: now() } }, `Recorded notification to ${c.regulator}: ${inc.title}`)}>Mark notified</button>
                <button className="btn ghost" onClick={() => { setReasonFor(c.jurisdiction); setReason(''); }}>Not notifiable</button>
              </>
            )}
          </div>
        </div>
      ))}
      {reasonFor && (
        <section className="card">
          <label className="field"><span className="label">Why notification to {JURISDICTIONS[reasonFor].regulator} is not required</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <div className="row"><button className="btn primary" disabled={!reason.trim()} onClick={async () => { await update({ notRequired: { ...(inc.notRequired ?? {}), [reasonFor]: reason.trim() } }, `Recorded no-notification decision for ${JURISDICTIONS[reasonFor].regulator}: ${inc.title}`); setReasonFor(null); }}>Save decision</button><button className="btn" onClick={() => setReasonFor(null)}>Cancel</button></div>
        </section>
      )}
      <h3>People affected</h3>
      <div className="req">
        <div className="grow"><b>{inc.highRiskToSubjects ? 'High risk: tell the people affected' : 'Not assessed as high risk'}</b><div className="small muted">NDPA s.40 requires notice to data subjects where the breach is likely to result in high risk to them.</div></div>
        {inc.subjectsNotifiedAt ? <Pill tone="ok">Told {fmtDate(inc.subjectsNotifiedAt)}</Pill> : inc.highRiskToSubjects && session.canEdit ? <button className="btn" onClick={() => update({ subjectsNotifiedAt: now() }, `Recorded notice to affected people: ${inc.title}`)}>Mark people told</button> : null}
      </div>
    </Drawer>
  );
}
