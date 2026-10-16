import { useState } from 'react';
import { COLLECTION_META, PACKS, requestStatus, rightLabel, type DataRequest } from '@tenet/core';
import { useApp } from '../context';
import { FormFields, useRecordForm } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Pill, Prov, fmtDate, useNow } from '../ui';
import { RecordList } from './Collections';

export function Requests() {
  const { ds, route, go } = useApp();
  const t = useNow(60_000);
  const [openId, setOpenId] = useState<string | null>(route.screen === 'ws' && route.open ? route.open : null);
  if (!ds) return null;
  if (openId !== null) return <RequestPage id={openId} onClose={() => { setOpenId(null); go({ screen: 'ws', id: ds.workspace.id, tab: 'requests' }); }} />;
  return (
    <RecordList col="requests" onOpen={(r) => setOpenId(r.id)} addLabel="Log a request"
      rows={ds.requests.filter((r) => ds.workspace.jurisdictions.includes(r.jurisdiction)) as unknown as AnyRecord[]}
      emptyText="Log every request and complaint. The deadline and the rights available follow the requester’s jurisdiction, and the systems to search come from the data map."
      extra={[{ label: 'Deadline', cell: (r) => {
        const s = requestStatus(r as unknown as DataRequest, ds, t);
        return <div className="row" style={{ gap: 6 }}>
          {s.state === 'closed' ? <Pill tone="ok">Closed</Pill> : s.state === 'no-fixed-window' ? <Pill tone="none">Reasonable time</Pill> : <Pill tone={s.state === 'overdue' ? 'bad' : s.state === 'due-soon' ? 'warn' : 'info'}>{s.state === 'overdue' ? `${Math.abs(s.daysLeft!)}d overdue` : `${s.daysLeft}d left`}</Pill>}
          {!s.available && <Pill tone="warn" title={s.note}>No statutory right</Pill>}
        </div>;
      } }]} />
  );
}

function RequestPage({ id, onClose }: { id: string; onClose: () => void }) {
  const { ds, saveRecord, deleteRecord, session, fieldCtx } = useApp();
  const t = useNow(60_000);
  const existing = ds!.requests.find((r) => r.id === id);
  const meta = COLLECTION_META.requests;
  const form = useRecordForm(meta.fields, (existing as unknown as Record<string, unknown>) ?? { receivedAt: now(), jurisdiction: ds!.workspace.jurisdictions[0] }, fieldCtx, meta.passthrough);
  const ro = !session.canEdit;
  const r = { systemTasks: {}, ...(existing ?? {}), ...form.values } as unknown as DataRequest;
  const pack = r.jurisdiction ? PACKS[r.jurisdiction] : undefined;
  const s = r.jurisdiction && r.receivedAt ? requestStatus(r, ds!, t) : null;
  const save = async (patch: Partial<DataRequest> = {}, summary?: string) => {
    const v = form.validate(); if (!v.ok) return;
    const rec = { ...(existing ?? { id: newId(), createdAt: now() }), ...form.values, ...v.value, ...patch, updatedAt: now() } as unknown as AnyRecord;
    await saveRecord('requests', rec, summary ?? `${existing ? 'Updated' : 'Logged'} request from ${String(rec.requester)}`);
    if (!existing) onClose(); else form.setValues((x) => ({ ...x, ...patch }));
  };
  const tasks = r.systemTasks ?? {};
  return (
    <>
      <div className="row">
        <button className="btn ghost" onClick={onClose}>← Requests</button>
        <h2 className="grow">{existing ? `${rightLabel(existing.type)} request from ${existing.requester}` : 'Log a request'}</h2>
        {!ro && <button className="btn primary" onClick={() => save()}>{existing ? 'Save' : 'Log request'}</button>}
      </div>
      <div className="cols">
        <section className="card col-2">
          <FormFields fields={meta.fields} values={form.values} set={form.set} errors={form.errors} ds={ds} ctx={fieldCtx} idPrefix="rq" disabled={ro} />
        </section>
        <div className="col-1">
          {s && pack && (
            <section className="card">
              <h2>Under {pack.shortLaw}</h2>
              {s.available ? <p className="small">Right of {rightLabel(r.type).toLowerCase()}: <span className="mono">{pack.shortLaw} {s.ref}</span></p> : <p className="notice warn">{s.note}</p>}
              <p className="small">{s.due ? <>Due <b>{fmtDate(s.due)}</b>{s.state === 'overdue' ? <> · <span className="err">overdue</span></> : ` · ${s.daysLeft} days left`}{r.extended && pack.rights.extension ? ` (extended under ${pack.rights.extension.ref})` : ''}</> : s.state === 'closed' ? 'Closed.' : 'No fixed period: answer within a reasonable time.'}</p>
              {!r.identityVerified && s.state !== 'closed' && <p className="small"><Pill tone="warn">Verify identity</Pill> before disclosing anything.</p>}
              <Prov p={s.provenance} />
            </section>
          )}
          {s && (
            <section className="card">
              <h2>Systems to search</h2>
              <p className="small muted">{r.subjectType ? `Systems holding data about ${r.subjectType}, from the data map.` : 'Set the relationship to narrow this list.'}</p>
              {s.systems.length === 0 ? <p className="small muted">No systems found for this relationship.</p> : s.systems.map((sys) => (
                <label key={sys.id} className="check small"><input type="checkbox" disabled={ro || !existing} checked={!!tasks[sys.id]} onChange={(e) => save({ systemTasks: { ...tasks, [sys.id]: e.target.checked } }, `${e.target.checked ? 'Searched' : 'Reopened'} ${sys.name} for ${r.requester}`)} />{sys.name} <span className="muted">· {sys.owner ?? 'no owner'}</span></label>
              ))}
              {s.systems.length > 0 && <p className="small mono">{s.systems.filter((x) => tasks[x.id]).length}/{s.systems.length} done</p>}
            </section>
          )}
          {existing && !ro && <button className="btn ghost danger" onClick={async () => { await deleteRecord('requests', existing as unknown as AnyRecord, `request from ${existing.requester}`); onClose(); }}>Delete request</button>}
        </div>
      </div>
    </>
  );
}
