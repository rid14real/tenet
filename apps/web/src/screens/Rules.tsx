import { CAR_RULES, CONTROL_MAP_PROVENANCE, DPIA_TRIGGER_PROVENANCE, JURISDICTIONS, JURISDICTION_CODES, SECTORS, TIER_RULES } from '@tenet/core';
import { Prov, TierTag, fmtNum } from '../ui';

export function Rules() {
  return (
    <>
      <div className="head"><div><p className="eyebrow">Rule packs</p><h1>Rules and sources</h1><p className="muted">Every threshold and deadline the platform applies, where it comes from and how far it has been checked.</p></div></div>
      <div className="row small"><span className="prov"><i className="primary">primary</i> read from the law or standard itself</span><span className="prov"><i className="secondary">secondary</i> from practitioner or press summaries</span><span className="prov"><i className="unverified">unverified</i> placeholder pending legal check</span></div>
      <div className="cols">
        <section className="card col-1">
          <h2>NDPC classification</h2>
          <p>More than <b className="mono">{fmtNum(TIER_RULES.uhlAbove)}</b> data subjects in six months: UHL. From <b className="mono">{fmtNum(TIER_RULES.ehlFrom)}</b>: at least EHL. The higher of the sector tier and the volume tier applies.</p>
          <Prov p={TIER_RULES.provenance} />
          <div className="tablebox"><table><tbody>{SECTORS.map((s) => <tr key={s.id}><td>{s.label}</td><td><TierTag tier={s.tier} /></td></tr>)}</tbody></table></div>
        </section>
        <div className="col-2">
          <section className="card">
            <h2>Compliance Audit Return</h2>
            <p>Due {CAR_RULES.dueDay} March each year for the previous cycle. Filing fee ₦{fmtNum(CAR_RULES.feeRangeNgn[0])} to ₦{fmtNum(CAR_RULES.feeRangeNgn[1])}. {CAR_RULES.lateFilingPenalty}.</p>
            <Prov p={CAR_RULES.provenance} />
          </section>
          <section className="card flush">
            <div style={{ padding: '16px 18px 4px' }}><h2>Breach and request windows</h2></div>
            <div className="tablebox">
              <table style={{ minWidth: 720 }}>
                <thead><tr><th>Jurisdiction</th><th>Regulator breach notice</th><th>Request response</th></tr></thead>
                <tbody>{JURISDICTION_CODES.map((c) => { const j = JURISDICTIONS[c]; return (
                  <tr key={c}>
                    <td><b>{j.name}</b><div className="small muted">{j.law}</div></td>
                    <td>{j.breachWindowText}<div><Prov p={j.breach} /></div></td>
                    <td>{j.requestDays ? `${j.requestDays} days` : 'No fixed period'}<div><Prov p={j.request} /></div></td>
                  </tr>
                ); })}</tbody>
              </table>
            </div>
          </section>
          <section className="card"><h2>DPIA triggers</h2><p>Sensitive data, children, automated decisions with significant effect, systematic monitoring, new technology, large scale, sensitive data sent abroad.</p><Prov p={DPIA_TRIGGER_PROVENANCE} /></section>
          <section className="card"><h2>Control map</h2><p>The crosswalk between evidence records and frameworks.</p><Prov p={CONTROL_MAP_PROVENANCE} /></section>
        </div>
      </div>
    </>
  );
}
