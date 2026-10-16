import { useState } from 'react';
import {
  BASES, COLLECTION_META, PACKS, SPECIAL_CONDITIONS, activityFacts, categoryLabel, countryName, ropaCsv, systemControlsGap,
  type ActivityFacts, type ProcessingActivity, type System,
} from '@tenet/core';
import { useApp } from '../context';
import { FormFields, useRecordForm } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Bar, Jx, Pill, Prov, SubTabs, slug } from '../ui';
import { RecordList } from './Collections';

type Sub = 'activities' | 'systems' | 'flows';

export function DataMap() {
  const { ds, route, go, download } = useApp();
  const [editing, setEditing] = useState<string | null>(route.screen === 'ws' && route.open && ds?.activities.some((a) => a.id === route.open) ? route.open : null);
  if (!ds || route.screen !== 'ws') return null;
  const sub = (route.sub as Sub) ?? 'activities';
  if (editing !== null) return <ActivityPage id={editing} onClose={() => { setEditing(null); go({ screen: 'ws', id: ds.workspace.id, tab: 'datamap' }); }} />;
  return (
    <>
      <SubTabs label="Data map" value={sub} onChange={(s) => go({ screen: 'ws', id: ds.workspace.id, tab: 'datamap', sub: s })}
        tabs={[{ id: 'activities', label: 'Processing activities', count: ds.activities.length }, { id: 'systems', label: 'Systems', count: ds.systems.length }, { id: 'flows', label: 'Data flows' }]} />
      {sub === 'activities' && (
        <RecordList col="activities" onOpen={(r) => setEditing(r.id || '')} addLabel="Add activity"
          toolbar={ds.activities.length > 0 && <button className="btn" onClick={() => download(`${slug(ds.workspace.name)}-record-of-processing.csv`, ropaCsv(ds), 'text/csv')}>Export record (.csv)</button>}
          emptyText="List each way the entity uses personal data. Each activity is checked against every law in scope: lawful basis, sensitive data, impact assessment and transfers."
          extra={[
            { label: 'Laws', cell: (r) => <Jx codes={activityFacts(r as unknown as ProcessingActivity, ds).jurisdictions} /> },
            { label: 'Complete', cell: (r) => { const f = activityFacts(r as unknown as ProcessingActivity, ds); return <div className="row" style={{ gap: 8 }}><div style={{ width: 70 }}><Bar pct={f.completeness.score} /></div><span className="small mono">{f.completeness.score}%</span></div>; } },
            { label: 'Flags', cell: (r) => <ActivityFlags f={activityFacts(r as unknown as ProcessingActivity, ds)} /> },
          ]} />
      )}
      {sub === 'systems' && (
        <RecordList col="systems" emptyText="Record the applications, databases and stores that hold personal data, with where they are hosted. Activities link to them, and transfers are worked out from their location."
          extra={[
            { label: 'Hosted in', cell: (r) => countryName(String(r.hostingCountry)) },
            { label: 'Control gaps', cell: (r) => { const g = systemControlsGap(r as unknown as System); return g.length ? <Pill tone="warn">{g.length} gap{g.length > 1 ? 's' : ''}</Pill> : <Pill tone="ok">None</Pill>; } },
            { label: 'Used by', cell: (r) => <span className="small">{ds.activities.filter((a) => a.systemIds.includes(r.id)).length} activities</span> },
          ]} />
      )}
      {sub === 'flows' && <Flows onOpen={(id) => setEditing(id)} />}
    </>
  );
}

function ActivityFlags({ f }: { f: ActivityFacts }) {
  const bad = f.perJx.filter((p) => !p.basis.ok).map((p) => p.code);
  const dpia = f.perJx.filter((p) => p.dpia.required && p.dpia.status !== 'approved').map((p) => p.code);
  const sens = f.perJx.filter((p) => p.sensitive.length).map((p) => p.code);
  const tx = f.perJx.filter((p) => p.transfers.some((t) => !t.ok)).map((p) => p.code);
  return (
    <div className="chips">
      {bad.length > 0 && <Pill tone="bad" title={`No valid basis under ${bad.join(', ')}`}>Basis</Pill>}
      {dpia.length > 0 && <Pill tone="warn" title={`Assessment outstanding under ${dpia.join(', ')}`}>DPIA</Pill>}
      {sens.length > 0 && <Pill tone="info" title={`Sensitive under ${sens.join(', ')}`}>Sensitive</Pill>}
      {tx.length > 0 && <Pill tone="warn" title={`Transfer basis missing under ${tx.join(', ')}`}>Transfer</Pill>}
      {!bad.length && !dpia.length && !sens.length && !tx.length && <span className="muted small">—</span>}
    </div>
  );
}

function Flows({ onOpen }: { onOpen: (id: string) => void }) {
  const { ds } = useApp();
  if (!ds) return null;
  const acts = ds.activities.filter((a) => a.status !== 'retired');
  return (
    <div className="card flush tablebox">
      <table style={{ minWidth: 880 }}>
        <thead><tr><th>Activity</th><th>People and data</th><th>Systems</th><th>Vendors</th><th>Countries</th></tr></thead>
        <tbody>
          {acts.map((a) => {
            const f = activityFacts(a, ds);
            const abroad = new Set(f.perJx.flatMap((p) => p.transfers.map((t) => t.country)));
            return (
              <tr key={a.id} className="click" onClick={() => onOpen(a.id)}>
                <td><button className="linkish" onClick={(e) => { e.stopPropagation(); onOpen(a.id); }}>{a.name}</button><div><Jx codes={f.jurisdictions} /></div></td>
                <td className="small">{a.dataSubjectTypes.join(', ') || '—'}<div className="muted">{a.dataCategoryIds.map(categoryLabel).join(', ')}</div></td>
                <td className="small">{f.systems.map((s) => <div key={s.id}>{s.name} <span className="muted">· {s.hostingCountry}</span></div>)}{!f.systems.length && <span className="muted">—</span>}</td>
                <td className="small">{f.vendors.map((v) => <div key={v.id}>{v.name} <span className="muted">· {v.country}</span></div>)}{!f.vendors.length && <span className="muted">—</span>}</td>
                <td>{f.countries.map((c) => <span key={c} className={`flag${abroad.has(c) ? ' abroad' : ''}`} title={abroad.has(c) ? 'Transfer under at least one law in scope' : 'Domestic'}>{c}</span>)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActivityPage({ id, onClose }: { id: string; onClose: () => void }) {
  const { ds, saveRecord, deleteRecord, session, fieldCtx, go } = useApp();
  const existing = ds!.activities.find((a) => a.id === id);
  const meta = COLLECTION_META.activities;
  const form = useRecordForm(meta.fields, (existing as unknown as Record<string, unknown>) ?? { jurisdictions: [...ds!.workspace.jurisdictions] }, fieldCtx);
  const [busy, setBusy] = useState(false);
  const draft = { ...(existing ?? { id: 'draft', createdAt: '', updatedAt: '' }), ...form.values } as unknown as ProcessingActivity;
  const f = activityFacts({ ...draft, dataSubjectTypes: draft.dataSubjectTypes ?? [], dataCategoryIds: draft.dataCategoryIds ?? [], systemIds: draft.systemIds ?? [], vendorIds: draft.vendorIds ?? [] }, ds!);
  const save = async () => {
    const r = form.validate(); if (!r.ok) return;
    setBusy(true);
    try {
      const rec = { ...(existing ?? { id: newId(), createdAt: now() }), ...form.values, ...r.value, updatedAt: now() } as AnyRecord;
      await saveRecord('activities', rec, `${existing ? 'Updated' : 'Added'} processing activity: ${String(rec.name)}`);
      onClose();
    } finally { setBusy(false); }
  };
  return (
    <>
      <div className="row"><button className="btn ghost" onClick={onClose}>← Data map</button><h2 className="grow">{existing ? existing.name : 'New processing activity'}</h2>
        {session.canEdit && <><button className="btn primary" disabled={busy} onClick={save}>Save</button>{existing && <button className="btn ghost danger" onClick={async () => { await deleteRecord('activities', existing as unknown as AnyRecord); onClose(); }}>Delete</button>}</>}
      </div>
      <div className="cols">
        <section className="card col-2">
          <FormFields fields={meta.fields} values={form.values} set={form.set} errors={form.errors} ds={ds} ctx={fieldCtx} idPrefix="act" disabled={!session.canEdit} />
          {Object.keys(form.errors).length > 0 && <p className="notice bad">Fix the highlighted fields, then save.</p>}
        </section>
        <div className="col-1">
          <section className="card">
            <div className="row"><h2 className="grow">Record completeness</h2><span className="mono">{f.completeness.score}%</span></div>
            <Bar pct={f.completeness.score} />
            {f.completeness.missing.length > 0 && <p className="small muted">Missing: {f.completeness.missing.join(', ')}.</p>}
          </section>
          {f.perJx.map((p) => {
            const pack = PACKS[p.code];
            return (
              <section key={p.code} className="card">
                <div className="row"><h2 className="grow">{pack.name}</h2><Jx codes={[p.code]} /></div>
                <p className="small"><b>Lawful basis:</b> {p.basis.ok ? p.basis.ref : <span className="err">{p.basis.problem}</span>}</p>
                {p.sensitive.length > 0 && <p className="small"><b>{pack.sensitive.term[0].toUpperCase() + pack.sensitive.term.slice(1)}</b> ({pack.sensitive.ref}): {p.sensitive.map(categoryLabel).join(', ')}. {p.special.ok ? `Condition: ${SPECIAL_CONDITIONS.find((s) => s.id === draft.specialCondition)?.label} (${pack.special.ref}).` : <span className="err">Needs a condition under {pack.special.ref}.</span>}</p>}
                <p className="small"><b>{pack.dpia.name}:</b> {p.dpia.required ? `${p.dpia.binding ? 'required' : 'recommended'} (${p.dpia.reasons.map((r) => r.label).join('; ')}). ` : 'not triggered. '}{p.dpia.required && (p.dpia.status === 'approved' ? 'Approved.' : p.dpia.status === 'in-progress' ? 'In progress.' : <button className="linkish" onClick={() => go({ screen: 'ws', id: ds!.workspace.id, tab: 'assessments', open: `new:${existing?.id ?? ''}` })}>Start one</button>)}</p>
                {p.transfers.length > 0 && <p className="small"><b>Transfers ({pack.transfers?.ref}):</b> {p.transfers.map((t) => `${t.via} in ${countryName(t.country)} — ${t.ok ? 'basis recorded' : t.pending ? 'awaiting approval' : 'no basis'}`).join('; ')}.</p>}
                {p.marketing && <p className="small"><b>Marketing ({p.marketing.ref}):</b> {p.marketing.ok ? 'consent recorded.' : <span className="err">{p.marketing.problem}</span>}</p>}
              </section>
            );
          })}
          {!f.perJx.length && <p className="notice warn">Choose whose data this is (jurisdictions) to see what each law requires.</p>}
          <Prov p={PACKS[f.perJx[0]?.code ?? ds!.workspace.jurisdictions[0]]?.bases.prov ?? { source: '', confidence: 'primary' }} />
          <p className="small muted">Basis options show the citation under each law in scope: {BASES.length} bases mapped.</p>
        </div>
      </div>
    </>
  );
}
