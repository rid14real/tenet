import { useState } from 'react';
import { BASES, JURISDICTION_CODES, NG_RETURN, NG_TIER_RULES, PACKS, RIGHTS, TIER_LABEL, categoryLabel, type JurisdictionCode } from '@tenet/core';
import { Prov, SubTabs, fmtNum } from '../ui';

export function Rules() {
  const [code, setCode] = useState<JurisdictionCode>('NG');
  const p = PACKS[code];
  return (
    <>
      <div className="head"><div><p className="eyebrow">Rule packs</p><h1>Rules and sources</h1><p className="muted">What each law means inside Tenet, where it comes from and how far it has been checked.</p></div></div>
      <div className="row small"><span className="prov"><i className="primary">primary</i> read from the law or standard itself</span><span className="prov"><i className="secondary">secondary</i> from practitioner or press summaries</span><span className="prov"><i className="unverified">unverified</i> placeholder pending legal check</span></div>
      <SubTabs label="Jurisdiction" value={code} onChange={setCode} tabs={JURISDICTION_CODES.map((c) => ({ id: c, label: PACKS[c].name }))} />
      <div className="cols">
        <div className="col-2">
          <section className="card">
            <h2>{p.law}</h2>
            <p className="small">{p.blurb}</p>
            <div className="kv"><div><div className="k">Regulator</div><div className="v">{p.regulator}</div></div><div><div className="k">Officer</div><div className="v">{p.officer.title}</div></div></div>
            <Prov p={p.officer.prov} />
          </section>
          <section className="card">
            <h2>Lawful bases ({p.bases.ref})</h2>
            <div className="tablebox"><table><tbody>{BASES.map((b) => <tr key={b.id}><td>{b.label}</td><td className="mono small">{p.bases.available[b.id] ?? <span className="err">not available</span>}</td></tr>)}</tbody></table></div>
            <Prov p={p.bases.prov} />
          </section>
          <section className="card">
            <h2>Rights</h2>
            <div className="tablebox"><table><tbody>{RIGHTS.map((r) => { const x = p.rights.available[r.id]; return <tr key={r.id}><td>{r.label}</td><td className="mono small">{x ? x.ref : <span className="err">not provided</span>}</td><td className="small">{x ? (x.days ?? p.rights.defaultDays ?? 'reasonable time') + (x.days ?? p.rights.defaultDays ? ' days' : '') : ''}</td></tr>; })}</tbody></table></div>
            <Prov p={p.rights.prov} />
          </section>
        </div>
        <div className="col-1">
          <section className="card"><h2>{p.sensitive.term[0].toUpperCase() + p.sensitive.term.slice(1)}</h2><p className="small">{p.sensitive.categories.map(categoryLabel).join(', ')}.</p><p className="small muted">Children: {p.children.ref}. Conditions: {p.special.ref}.</p><Prov p={p.sensitive.prov} /></section>
          <section className="card"><h2>Breaches</h2><p className="small">Regulator: {p.breach.window} ({p.breach.ref}). People affected: {p.breach.subjectsRef}.</p><ul className="small" style={{ margin: 0, paddingLeft: 18 }}>{p.breach.contents.map((c) => <li key={c}>{c}</li>)}</ul><Prov p={p.breach.prov} /></section>
          <section className="card"><h2>{p.dpia.name}</h2><p className="small">{p.dpia.ref}{p.dpia.binding ? '' : ' (recommended, not in the statute)'}.{p.dpia.priorConsultation ? ` Prior consultation: ${p.dpia.priorConsultation}.` : ''}</p><Prov p={p.dpia.prov} /></section>
          <section className="card"><h2>Transfers</h2><p className="small">{p.transfers ? `${p.transfers.summary} (${p.transfers.ref})` : 'No specific transfer rule.'}</p>{p.transfers && <Prov p={p.transfers.prov} />}</section>
          {code === 'NG' && (
            <section className="card">
              <h2>NDPC classification</h2>
              <p className="small">More than {fmtNum(NG_TIER_RULES.uhlAbove)} data subjects in six months: {TIER_LABEL.UHL}. From {fmtNum(NG_TIER_RULES.ehlFrom)}: at least {TIER_LABEL.EHL}. The higher of sector and volume applies. Audit return due {NG_RETURN.dueDay} March; fee ₦{fmtNum(NG_RETURN.feeRangeNgn[0])}–₦{fmtNum(NG_RETURN.feeRangeNgn[1])}; {NG_RETURN.penalty.toLowerCase()} for late filing.</p>
              <Prov p={NG_TIER_RULES.provenance} />
            </section>
          )}
        </div>
      </div>
    </>
  );
}
