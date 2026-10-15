import { useState } from 'react';
import { WORKSPACE_FIELDS, auditReturnDue, daysUntil, sampleDataset, sectorById, workspaceSummary, type Workspace } from '@tenet/core';
import { useApp } from '../context';
import { RecordDrawer } from '../forms';
import { newId, now } from '../store/types';
import { Bar, Pill, TierTag, fmtNum } from '../ui';

export function Portfolio() {
  const { workspaces, datasets, go, saveWorkspace, store, session, toast, reload } = useApp();
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const rows = workspaces
    .map((w) => ({ w, ds: datasets[w.id] }))
    .filter((x) => x.ds)
    .map(({ w, ds }) => ({ w, s: workspaceSummary(ds) }))
    .sort((a, b) => a.w.name.localeCompare(b.w.name));
  const filers = rows.filter((r) => r.s.tier.filesAuditReturn);
  const avg = filers.length ? Math.round(filers.reduce((a, r) => a + r.s.car.score, 0) / filers.length) : 0;
  const openInc = rows.reduce((a, r) => a + r.s.openIncidents, 0);
  const cycle = workspaces[0]?.cycleYear ?? new Date().getUTCFullYear();
  const due = auditReturnDue(cycle);

  const loadSample = async () => {
    setBusy(true);
    try { await store.importDataset(sampleDataset()); toast('Sample client added'); reload(); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="head">
        <div>
          <p className="eyebrow">{session.orgName}</p>
          <h1>Clients</h1>
          <p className="muted">Every client’s NDPC cycle, AI systems and open incidents in one place.</p>
        </div>
        {session.canEdit && (
          <div className="row">
            <button className="btn" onClick={loadSample} disabled={busy}>Add sample client</button>
            <button className="btn primary" onClick={() => setCreating(true)}>New client</button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="empty">
          <h2>No clients yet</h2>
          <p className="muted">Add a client to start their records of processing, assessments, AI register and audit return. Or add the sample microfinance bank to see a client with gaps to work through.</p>
          {session.canEdit && <div className="row"><button className="btn primary" onClick={() => setCreating(true)}>New client</button><button className="btn" onClick={loadSample} disabled={busy}>Add sample client</button></div>}
        </div>
      ) : (
        <>
          <div className="tiles">
            <div className="tile"><div className="n">{rows.length}</div><div className="l">Clients</div></div>
            <div className="tile"><div className="n">{filers.length}</div><div className="l">Audit returns due {due.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div></div>
            <div className="tile"><div className="n">{avg}%</div><div className="l">Average return readiness</div></div>
            <div className="tile"><div className="n" style={{ color: openInc ? 'var(--bad)' : undefined }}>{openInc}</div><div className="l">Open incidents</div></div>
          </div>
          <div className="card flush tablebox">
            <table style={{ minWidth: 820 }}>
              <thead><tr><th>Client</th><th>Tier</th><th>Return readiness</th><th>Next obligation</th><th>DPO</th><th>AI systems</th><th>Open</th></tr></thead>
              <tbody>
                {rows.map(({ w, s }) => (
                  <tr key={w.id} className="click" onClick={() => go({ screen: 'workspace', id: w.id, tab: 'overview' })}>
                    <td>
                      <button className="linkish" onClick={(e) => { e.stopPropagation(); go({ screen: 'workspace', id: w.id, tab: 'overview' }); }}>{w.name}</button>
                      <div className="small muted">{sectorById(w.sector).label}</div>
                    </td>
                    <td><TierTag tier={s.tier.tier} /></td>
                    <td style={{ minWidth: 170 }}><div className="row" style={{ gap: 10 }}><div style={{ width: 110 }}><Bar pct={s.car.score} /></div><span className="mono small">{s.car.score}%</span></div></td>
                    <td>{s.tier.filesAuditReturn ? `Audit return · ${daysUntil(auditReturnDue(w.cycleYear))} days` : 'Registration renewal'}</td>
                    <td>{w.dpoName ? w.dpoName : <Pill tone="bad">Not appointed</Pill>}</td>
                    <td className="mono">{s.aiSystems}</td>
                    <td>{s.openIncidents ? <Pill tone="bad">{s.openIncidents} incident{s.openIncidents > 1 ? 's' : ''}</Pill> : s.openRequests ? <Pill tone="info">{s.openRequests} request{s.openRequests > 1 ? 's' : ''}</Pill> : <span className="muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {creating && (
        <RecordDrawer
          title="New client" fields={WORKSPACE_FIELDS} ds={null} onClose={() => setCreating(false)}
          onSave={async (v) => {
            const w = { ...(v as unknown as Workspace), id: newId(), attestations: {}, createdAt: now(), updatedAt: now() };
            await saveWorkspace(w, `Created client ${w.name}`, 'create');
            setCreating(false);
            go({ screen: 'workspace', id: w.id, tab: 'overview' });
          }}
        />
      )}
      <p className="small muted">{fmtNum(rows.reduce((a, r) => a + (datasets[r.w.id]?.activities.length ?? 0), 0))} processing activities across all clients.</p>
    </>
  );
}
