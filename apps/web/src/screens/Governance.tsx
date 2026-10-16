import { PACKS, POLICY_TYPES, addMonths, type Policy } from '@tenet/core';
import { useApp } from '../context';
import { Jx, Pill, SubTabs, fmtDate } from '../ui';
import { RecordList } from './Collections';

type Sub = 'policies' | 'training' | 'people';

export function Governance() {
  const { ds, route, go } = useApp();
  if (!ds || route.screen !== 'ws') return null;
  const w = ds.workspace;
  const sub = (route.sub as Sub) ?? 'policies';
  const now = new Date();
  const needed = POLICY_TYPES.filter((p) => ['privacy-notice', 'information-security', 'breach-response', 'rights-procedure', 'retention-schedule'].includes(p.id) || (p.id === 'paia-manual' && w.jurisdictions.includes('ZA')) || (p.id === 'ai-use' && ds.aiSystems.length > 0));
  return (
    <>
      <SubTabs label="Governance" value={sub} onChange={(s) => go({ screen: 'ws', id: w.id, tab: 'governance', sub: s })}
        tabs={[{ id: 'policies', label: 'Policies and notices', count: ds.policies.length }, { id: 'training', label: 'Training', count: ds.trainings.length }, { id: 'people', label: 'Officers' }]} />
      {sub === 'policies' && (
        <>
          <section className="card">
            <h2>Expected for the laws in scope</h2>
            <div className="chips">{needed.map((p) => { const has = ds.policies.filter((x) => x.type === p.id); const current = has.some((x) => !x.nextReview || new Date(x.nextReview) >= now); return <Pill key={p.id} tone={current ? 'ok' : has.length ? 'warn' : 'bad'}>{p.label}{has.length ? (current ? '' : ' · review due') : ' · missing'}</Pill>; })}</div>
          </section>
          <RecordList col="policies" emptyText="Record notices, policies and procedures with their review dates. The compliance checks read from here."
            extra={[
              { label: 'Covers', cell: (r) => ((r.jurisdictions as string[])?.length ? <Jx codes={r.jurisdictions as Policy['jurisdictions']} /> : <span className="small">All</span>) },
              { label: 'Review', cell: (r) => (r.nextReview && new Date(String(r.nextReview)) < now ? <Pill tone="warn">Overdue</Pill> : <span className="small">{fmtDate(r.nextReview as string)}</span>) },
            ]} />
        </>
      )}
      {sub === 'training' && (
        <RecordList col="trainings" newDefaults={{ heldOn: now.toISOString().slice(0, 10) }} emptyText="Record training sessions and completion. The checks expect training in the last 12 months with at least 80% completion."
          extra={[{ label: 'Status', cell: (r) => { const recent = addMonths(String(r.heldOn), 12) >= now; const ok = recent && Number(r.completionPct) >= 80; return <Pill tone={ok ? 'ok' : 'warn'}>{ok ? 'Current' : recent ? 'Low completion' : 'Over 12 months'}</Pill>; } }]} />
      )}
      {sub === 'people' && (
        <section className="card">
          <h2>Officers by jurisdiction</h2>
          {w.jurisdictions.map((c) => {
            const p = PACKS[c];
            const name = c === 'ZA' ? (w.jx.ZA?.ioName as string | undefined) : w.privacyLeadName;
            return <div key={c} className="req"><div className="grow"><b>{p.officer.title}</b> <Jx codes={[c]} /><div className="small muted">{p.officer.ref}</div></div>{name ? <span>{name}</span> : <Pill tone="bad">Not named</Pill>}</div>;
          })}
          <div><button className="btn" onClick={() => go({ screen: 'ws', id: w.id, tab: 'settings' })}>Edit in settings</button></div>
        </section>
      )}
    </>
  );
}
