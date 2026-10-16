import { useState } from 'react';
import { AI_DOMAINS, PACKS, classifyAI, countryName, type AISystem } from '@tenet/core';
import { useApp } from '../context';
import { Drawer, Jx, Pill, Prov, type Tone } from '../ui';
import { RecordList } from './Collections';

const RISK_TONE: Record<string, Tone> = { high: 'bad', unassessed: 'warn', limited: 'info', minimal: 'ok' };

export function AISystems() {
  const { ds } = useApp();
  const [viewing, setViewing] = useState<string | null>(null);
  if (!ds) return null;
  const w = ds.workspace;
  const ctx = { sector: w.sector, jurisdictions: w.jurisdictions, vendors: ds.vendors, assessments: ds.assessments };
  const sys = viewing ? ds.aiSystems.find((s) => s.id === viewing) : undefined;
  return (
    <>
      <RecordList col="aiSystems" addLabel="Register AI system"
        emptyText="Register every AI system, including tools staff use without approval. Each is classified against the laws you have selected, plus ISO/IEC 42001 and the NIST AI RMF."
        extra={[
          { label: 'Used in', cell: (r) => <Jx codes={(r.markets as AISystem['markets']).filter((m) => w.jurisdictions.includes(m))} /> },
          { label: 'Risk', cell: (r) => { const c = classifyAI(r as unknown as AISystem, ctx); const open = c.obligations.filter((o) => o.binding && o.status === 'open').length; return <div className="row" style={{ gap: 6 }}><Pill tone={RISK_TONE[c.risk]}>{c.risk}</Pill>{open > 0 && <span className="small muted">{open} open</span>}</div>; } },
          { label: 'Duties', cell: (r) => <button className="btn ghost" onClick={(e) => { e.stopPropagation(); setViewing(r.id); }}>View duties</button> },
        ]} />
      {sys && (() => {
        const c = classifyAI(sys, ctx);
        const vendor = ds.vendors.find((v) => v.id === sys.vendorId);
        return (
          <Drawer title={sys.name} onClose={() => setViewing(null)}>
            <div className="row"><Pill tone={RISK_TONE[c.risk]}>{c.risk} risk</Pill>{c.reasons.map((r) => <span key={r} className="small muted">{r}</span>)}</div>
            <p>{sys.purpose}</p>
            <div className="kv">
              <div><div className="k">Use</div><div className="v">{AI_DOMAINS.find((d) => d.id === sys.domain)?.label}</div></div>
              <div><div className="k">Sourcing</div><div className="v">{sys.sourcing}{vendor ? ` · ${vendor.name} (${countryName(vendor.country)})` : ''}</div></div>
              <div><div className="k">Used for people in</div><div className="v">{sys.markets.filter((m) => w.jurisdictions.includes(m)).map((m) => PACKS[m].name).join(', ') || '—'}</div></div>
              <div><div className="k">Human oversight</div><div className="v">{sys.humanOversight || 'Not documented'}</div></div>
            </div>
            <h3>Obligations</h3>
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
          </Drawer>
        );
      })()}
    </>
  );
}
