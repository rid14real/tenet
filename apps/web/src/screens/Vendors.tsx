import { countryName, establishedIn, vendorRisk, type Vendor } from '@tenet/core';
import { useApp } from '../context';
import { Pill, fmtDate } from '../ui';
import { RecordList } from './Collections';

export function Vendors() {
  const { ds } = useApp();
  if (!ds) return null;
  const w = ds.workspace;
  const transferCell = (v: Vendor) => {
    const foreignTo = w.jurisdictions.filter((j) => !establishedIn(j, v.country));
    if (!foreignTo.length) return <Pill tone="none">Domestic</Pill>;
    return v.transferMechanism === 'none' || !v.transferMechanism ? <Pill tone="bad">No basis</Pill> : v.transferMechanism === 'pending-approval' ? <Pill tone="warn">Pending approval</Pill> : <Pill tone="ok">Basis recorded</Pill>;
  };
  return (
    <RecordList col="vendors" emptyText="Record every processor and partner that receives personal data. Risk is worked out from the data they touch, where they are, and their controls."
      extra={[
        { label: 'Risk', cell: (r) => { const k = vendorRisk(r as unknown as Vendor, ds); return <Pill tone={k.tier === 'high' ? 'bad' : k.tier === 'medium' ? 'warn' : 'ok'} title={k.reasons.join('; ')}>{k.tier}</Pill>; } },
        { label: 'Agreement', cell: (r) => (r.dpaSigned ? <Pill tone="ok">Signed</Pill> : r.role === 'processor' || r.role === 'sub-processor' ? <Pill tone="bad">Missing</Pill> : <Pill tone="none">n/a</Pill>) },
        { label: 'Transfer', cell: (r) => transferCell(r as unknown as Vendor) },
        { label: 'Review', cell: (r) => { const k = vendorRisk(r as unknown as Vendor, ds); return k.reviewOverdue ? <Pill tone="warn">{k.reviewDue ? `Overdue ${fmtDate(k.reviewDue)}` : 'Never reviewed'}</Pill> : <span className="small">{fmtDate(k.reviewDue)}</span>; } },
      ]}
      aside={(v) => {
        if (!v.name) return null;
        const k = vendorRisk({ certifications: [], ...v } as unknown as Vendor, ds);
        return (
          <section className="card">
            <div className="row"><h2 className="grow">Risk: {k.tier}</h2><span className="mono small">score {k.score}</span></div>
            <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{k.reasons.map((x) => <li key={x}>{x}</li>)}</ul>
            {k.activities.length > 0 && <p className="small muted">Used for: {k.activities.join(', ')}.</p>}
            <p className="small muted">{countryName(String(v.country ?? ''))} · review every {k.tier === 'high' ? 12 : k.tier === 'medium' ? 24 : 36} months.</p>
          </section>
        );
      }} />
  );
}
