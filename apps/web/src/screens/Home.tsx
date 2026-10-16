import { useState } from 'react';
import { PACKS, WORKSPACE_FIELDS, actionPlan, compliance, ngTierFor, overallScore, sampleDataset, sectorById, upcoming, type Workspace } from '@tenet/core';
import { useApp } from '../context';
import { RecordDrawer } from '../forms';
import { newId, now } from '../store/types';
import { Bar, Empty, Jx, Pill, TierTag, fmtDate } from '../ui';

/** Portfolio of clients (advisory) or the group's entities (in-house). */
export function Home() {
  const { workspaces, datasets, go, saveWorkspace, store, session, toast, reload, org, words } = useApp();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const rows = workspaces.filter((w) => datasets[w.id]).map((w) => {
    const ds = datasets[w.id];
    const res = compliance(ds);
    return { w, res, score: overallScore(res), actions: actionPlan(ds).filter((a) => a.severity === 'high').length, next: upcoming(ds)[0], incidents: ds.incidents.filter((i) => i.stage !== 'closed').length };
  }).sort((a, b) => a.w.name.localeCompare(b.w.name));
  const loadSample = async () => { setBusy(true); try { await store.importDataset(sampleDataset()); toast(`Sample ${words.entity} added`); reload(); } finally { setBusy(false); } };

  return (
    <>
      <div className="head">
        <div>
          <p className="eyebrow">{org.name}</p>
          <h1>{org.mode === 'advisory' ? 'Clients' : 'Entities'}</h1>
          <p className="muted">{org.mode === 'advisory' ? 'Every client’s programme across the laws that apply to it.' : 'Each company in the group, with the laws that apply to it.'}</p>
        </div>
        {session.canEdit && <div className="row"><button className="btn" onClick={loadSample} disabled={busy}>Add sample {words.entity}</button><button className="btn primary" onClick={() => setCreating(true)}>New {words.entity}</button></div>}
      </div>
      {rows.length === 0 ? (
        <Empty title={`No ${words.entities} yet`} action={session.canEdit && <div className="row"><button className="btn primary" onClick={() => setCreating(true)}>New {words.entity}</button><button className="btn" onClick={loadSample} disabled={busy}>Add sample {words.entity}</button></div>}>
          Add {org.mode === 'advisory' ? 'a client' : 'your first entity'} and choose the laws that apply. Tenet then asks only for what those laws require.
        </Empty>
      ) : (
        <div className="card flush tablebox">
          <table style={{ minWidth: 860 }}>
            <thead><tr><th>{words.Entity}</th><th>Laws and readiness</th><th>Overall</th><th>Urgent actions</th><th>Next deadline</th></tr></thead>
            <tbody>
              {rows.map(({ w, res, score, actions, next, incidents }) => (
                <tr key={w.id} className="click" onClick={() => go({ screen: 'ws', id: w.id, tab: 'overview' })}>
                  <td>
                    <button className="linkish" onClick={(e) => { e.stopPropagation(); go({ screen: 'ws', id: w.id, tab: 'overview' }); }}>{w.name}</button>
                    <div className="small muted">{sectorById(w.sector).label}{w.jurisdictions.includes('NG') && <> · <TierTag tier={ngTierFor(w).tier} /></>}</div>
                  </td>
                  <td><div className="jxscores">{res.map((r) => <span key={r.code} className="jxscore"><b>{PACKS[r.code].shortLaw}</b> <span className="mono">{r.score}%</span></span>)}</div></td>
                  <td style={{ minWidth: 150 }}><div className="row" style={{ gap: 8 }}><div style={{ width: 90 }}><Bar pct={score} /></div><span className="mono small">{score}%</span></div></td>
                  <td>{actions ? <Pill tone="bad">{actions} high</Pill> : <span className="muted">—</span>}{incidents ? <> <Pill tone="warn">{incidents} incident{incidents > 1 ? 's' : ''}</Pill></> : null}</td>
                  <td className="small">{next ? <><b>{next.label}</b><div className="muted">{fmtDate(next.date)}{next.overdue ? ' · overdue' : ''}</div></> : <span className="muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {creating && (
        <RecordDrawer
          title={`New ${words.entity}`} fields={WORKSPACE_FIELDS} ds={null} ctx={{}} onClose={() => setCreating(false)}
          aside={(v) => { const jx = (v.jurisdictions as Workspace['jurisdictions']) ?? []; return jx.length ? <section className="card"><h2>What these laws switch on</h2>{jx.map((c) => <p key={c} className="small"><Jx codes={[c]} /> {PACKS[c].blurb}</p>)}</section> : null; }}
          onSave={async (v) => {
            const w = { ...(v as unknown as Workspace), id: newId(), jx: {}, createdAt: now(), updatedAt: now() };
            await saveWorkspace(w, `Created ${words.entity} ${w.name}`, 'create');
            setCreating(false);
            go({ screen: 'ws', id: w.id, tab: 'settings' });
          }}
        />
      )}
    </>
  );
}
