import { useState } from 'react';
import { COLLECTION_META, PACKS, breachDuties, breachNoticeDraft, formatDuration, harmAssessment, type Incident, type JurisdictionCode } from '@tenet/core';
import { useApp } from '../context';
import { FormFields, useRecordForm } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Jx, Pill, Prov, fmtDateTime, fmtNum, useNow } from '../ui';
import { RecordList } from './Collections';

const STATE_TONE = { notified: 'ok', 'decided-not-to-notify': 'none', running: 'warn', overdue: 'bad', 'no-fixed-window': 'warn', 'not-required': 'none' } as const;
const STATE_TEXT = { notified: 'Notified', 'decided-not-to-notify': 'Decided not to notify', running: 'Clock running', overdue: 'Overdue', 'no-fixed-window': 'Notify as soon as possible', 'not-required': 'Not required' } as const;

export function Incidents() {
  const { ds, route, go } = useApp();
  const t = useNow(1000);
  const [openId, setOpenId] = useState<string | null>(route.screen === 'ws' && route.open ? route.open : null);
  if (!ds) return null;
  if (openId !== null) return <IncidentPage id={openId} onClose={() => { setOpenId(null); go({ screen: 'ws', id: ds.workspace.id, tab: 'incidents' }); }} />;
  return (
    <RecordList col="incidents" onOpen={(r) => setOpenId(r.id)} addLabel="Log an incident"
      emptyText="Log a breach as soon as you know of it. Each law’s test decides whether the regulator and the people affected must be told, and the clocks start from the moment of awareness."
      extra={[{ label: 'Regulator duties', cell: (r) => (
        <div className="stack" style={{ gap: 4 }}>{breachDuties(r as unknown as Incident, ds, t).map((d) => <span key={d.code}><Pill tone={STATE_TONE[d.state]}>{PACKS[d.code].regulatorShort} · {d.state === 'running' ? formatDuration(d.msRemaining!) : STATE_TEXT[d.state]}</Pill></span>)}</div>
      ) }]} />
  );
}

function IncidentPage({ id, onClose }: { id: string; onClose: () => void }) {
  const { ds, saveRecord, deleteRecord, session, fieldCtx } = useApp();
  const t = useNow(1000);
  const existing = ds!.incidents.find((i) => i.id === id);
  const meta = COLLECTION_META.incidents;
  const form = useRecordForm(meta.fields, (existing as unknown as Record<string, unknown>) ?? { awareAt: now(), jurisdictions: [...ds!.workspace.jurisdictions] }, fieldCtx, meta.passthrough);
  const [note, setNote] = useState('');
  const [decide, setDecide] = useState<{ code: JurisdictionCode; notify: boolean } | null>(null);
  const [rationale, setRationale] = useState('');
  const [ref, setRef] = useState('');
  const [draftFor, setDraftFor] = useState<JurisdictionCode | null>(null);
  const ro = !session.canEdit;
  const inc = { decisions: {}, notifications: {}, timeline: [], ...(existing ?? {}), ...form.values } as unknown as Incident;
  const ready = !!inc.awareAt && Array.isArray(inc.jurisdictions);
  const harm = ready ? harmAssessment({ ...inc, dataCategoryIds: inc.dataCategoryIds ?? [] }, ds!) : null;
  const duties = ready ? breachDuties({ ...inc, dataCategoryIds: inc.dataCategoryIds ?? [] }, ds!, t) : [];

  const persist = async (patch: Partial<Incident>, summary: string) => {
    const r = form.validate(); if (!r.ok) return;
    const rec = { ...(existing ?? { id: newId(), createdAt: now() }), ...form.values, ...r.value, ...patch, updatedAt: now() } as unknown as AnyRecord;
    await saveRecord('incidents', rec, summary);
    if (!existing) onClose();
    else form.setValues((s) => ({ ...s, ...patch }));
  };
  const addTimeline = (text: string) => [...(inc.timeline ?? []), { at: now(), note: text }];

  return (
    <>
      <div className="row">
        <button className="btn ghost" onClick={onClose}>← Incidents</button>
        <h2 className="grow">{existing ? existing.title : 'Log an incident'}</h2>
        {!ro && <button className="btn primary" onClick={() => persist({}, `${existing ? 'Updated' : 'Logged'} incident: ${String(form.values.title ?? '')}`)}>{existing ? 'Save' : 'Log incident'}</button>}
      </div>
      {duties.filter((d) => d.deadline && (d.state === 'running' || d.state === 'overdue')).length > 0 && (
        <div className="clockrow">
          {duties.filter((d) => d.deadline && (d.state === 'running' || d.state === 'overdue')).map((d) => (
            <section key={d.code} className="card dark">
              <span className="small" style={{ color: 'var(--rail-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{PACKS[d.code].regulatorShort} notification {d.state === 'overdue' ? 'overdue by' : 'due in'}</span>
              <span className="clock">{formatDuration(Math.abs(d.msRemaining!)).replace(' overdue', '')}</span>
              <span className="small" style={{ color: 'var(--rail-muted)' }}>Deadline {fmtDateTime(d.deadline!)} · {d.ref}</span>
            </section>
          ))}
        </div>
      )}
      <div className="cols">
        <section className="card col-2">
          <FormFields fields={meta.fields} values={form.values} set={form.set} errors={form.errors} ds={ds} ctx={fieldCtx} idPrefix="inc" disabled={ro} />
        </section>
        <div className="col-1">
          {harm && (
            <section className="card">
              <h2>Risk to people: {harm.level === 'none' ? 'unlikely' : harm.level === 'risk' ? 'risk' : 'high risk'}</h2>
              <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{harm.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
              <p className="small muted">Each law below applies its own test to this assessment.</p>
            </section>
          )}
          {existing && duties.map((d) => (
            <section key={d.code} className="card">
              <div className="row"><h2 className="grow">{d.regulator}</h2><Jx codes={[d.code]} /></div>
              <p className="small"><b>Regulator:</b> {d.regulatorRequired ? 'must be told' : 'not required on this assessment'} — {d.regulatorTest} {d.window}. <span className="mono muted">{d.ref}</span></p>
              <p className="small"><b>People affected:</b> {d.subjectsRequired ? 'must be told' : 'not required'} — {d.subjectsTest} <span className="mono muted">{d.subjectsRef}</span></p>
              <div className="row"><Pill tone={STATE_TONE[d.state]}>{STATE_TEXT[d.state]}{d.state === 'running' ? ` · ${formatDuration(d.msRemaining!)}` : ''}</Pill>{d.notifiedAt && <span className="small">on {fmtDateTime(d.notifiedAt)}{d.reference ? ` · ref ${d.reference}` : ''}</span>}</div>
              {d.decision && <p className="small muted">Decision: {d.decision.notify ? 'notify' : 'do not notify'} — {d.decision.rationale}</p>}
              <Prov p={d.provenance} />
              {!ro && d.state !== 'notified' && (
                <div className="row">
                  <button className="btn" onClick={() => { setDecide({ code: d.code, notify: true }); setRef(''); }}>Record notification</button>
                  <button className="btn ghost" onClick={() => { setDecide({ code: d.code, notify: false }); setRationale(''); }}>Decide not to notify</button>
                  <button className="btn ghost" onClick={() => setDraftFor(draftFor === d.code ? null : d.code)}>{draftFor === d.code ? 'Hide draft' : 'Draft notice'}</button>
                </div>
              )}
              {draftFor === d.code && <div className="pack" tabIndex={0}>{breachNoticeDraft(existing, d, ds!)}</div>}
              {decide?.code === d.code && (
                <div className="stack">
                  {decide.notify
                    ? <label className="field"><span className="label">Regulator reference (optional)</span><input type="text" value={ref} onChange={(e) => setRef(e.target.value)} /></label>
                    : <label className="field"><span className="label">Why notification is not required</span><textarea value={rationale} onChange={(e) => setRationale(e.target.value)} /></label>}
                  <div className="row">
                    <button className="btn primary" disabled={!decide.notify && !rationale.trim()} onClick={async () => {
                      if (decide.notify) await persist({ notifications: { ...(inc.notifications ?? {}), [d.code]: { at: now(), reference: ref || undefined } }, timeline: addTimeline(`Notified ${d.regulator}${ref ? ` (ref ${ref})` : ''}.`) }, `Recorded notification to ${d.regulator}: ${inc.title}`);
                      else await persist({ decisions: { ...(inc.decisions ?? {}), [d.code]: { notify: false, rationale: rationale.trim(), at: now() } }, timeline: addTimeline(`Decided not to notify ${d.regulator}: ${rationale.trim()}`) }, `Recorded decision not to notify ${d.regulator}: ${inc.title}`);
                      setDecide(null);
                    }}>Save</button>
                    <button className="btn" onClick={() => setDecide(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </section>
          ))}
          {existing && (
            <section className="card">
              <h2>People affected</h2>
              {inc.subjectsNotifiedAt ? <Pill tone="ok">Told on {fmtDateTime(inc.subjectsNotifiedAt)}</Pill>
                : duties.some((d) => d.subjectsRequired) ? <><p className="small">{fmtNum(inc.affectedCount)} people must be told under {duties.filter((d) => d.subjectsRequired).map((d) => d.subjectsRef).join(', ')}.</p>{!ro && <button className="btn" onClick={() => persist({ subjectsNotifiedAt: now(), timeline: addTimeline('People affected were told.') }, `Recorded notice to affected people: ${inc.title}`)}>Mark people told</button>}</>
                : <p className="small muted">Not required on the current assessment.</p>}
            </section>
          )}
          {existing && (
            <section className="card">
              <h2>Timeline</h2>
              {(inc.timeline ?? []).slice().sort((a, b) => a.at.localeCompare(b.at)).map((e, i) => <div key={i} className="small"><span className="mono muted">{fmtDateTime(e.at)}</span> {e.note}</div>)}
              {!ro && <div className="row"><input type="text" aria-label="Add a timeline note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What happened, what was done" style={{ flex: '1 1 200px' }} /><button className="btn" disabled={!note.trim()} onClick={async () => { await persist({ timeline: addTimeline(note.trim()) }, `Timeline note on ${inc.title}`); setNote(''); }}>Add</button></div>}
              {!ro && <button className="btn ghost danger" onClick={async () => { await deleteRecord('incidents', existing as unknown as AnyRecord, existing.title); onClose(); }}>Delete incident</button>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
