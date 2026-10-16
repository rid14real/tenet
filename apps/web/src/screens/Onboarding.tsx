import { useState } from 'react';
import { JURISDICTION_CODES, PACKS, WORKSPACE_FIELDS, sampleDataset, type JurisdictionCode, type OrgSettings, type Workspace } from '@tenet/core';
import { FormFields, useRecordForm } from '../forms';
import { newId, now, type Store } from '../store/types';

/** First run: how the organisation uses Tenet, and (in-house) the first entity. */
export function Onboarding({ store, existing, onDone }: { store: Store; existing: number; onDone: () => void }) {
  const [mode, setMode] = useState<OrgSettings['mode'] | null>(null);
  const [name, setName] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [busy, setBusy] = useState(false);
  const entity = useRecordForm(WORKSPACE_FIELDS, { jurisdictions: ['NG'] }, {});
  const jx = (entity.values.jurisdictions as JurisdictionCode[]) ?? [];

  const finish = async (withSample: boolean) => {
    setBusy(true);
    try {
      await store.saveOrg({ mode: mode!, name: name.trim(), createdAt: now() });
      if (withSample) await store.importDataset(sampleDataset());
      if (mode === 'in-house' && !withSample && existing === 0) {
        const r = entity.validate();
        if (!r.ok) { setBusy(false); return; }
        const w = { ...(r.value as unknown as Workspace), id: newId(), jx: {}, createdAt: now(), updatedAt: now() };
        await store.saveWorkspace(w);
      }
      onDone();
    } finally { setBusy(false); }
  };

  return (
    <div className="login">
      <div className="card" style={{ width: 'min(760px, 100%)' }}>
        <div className="brand" style={{ padding: 0 }}><b>Tenet</b></div>
        {step === 1 && (
          <>
            <h1>How will you use Tenet?</h1>
            <div className="choice-grid" role="radiogroup" aria-label="How you will use Tenet">
              <button className="choice" role="radio" aria-checked={mode === 'in-house'} onClick={() => setMode('in-house')}>
                <b>For our own organisation</b>
                <span>Your privacy or compliance team runs the programme in-house. Add group companies or subsidiaries as separate entities.</span>
              </button>
              <button className="choice" role="radio" aria-checked={mode === 'advisory'} onClick={() => setMode('advisory')}>
                <b>For clients</b>
                <span>You are a DPCO, an outsourced DPO, a law firm or a consultancy managing several clients, each in its own workspace.</span>
              </button>
            </div>
            <div className="field"><label htmlFor="ob-name">{mode === 'advisory' ? 'Your firm’s name' : 'Organisation name'}</label><input id="ob-name" type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div className="row">
              <button className="btn primary" disabled={!mode || !name.trim()} onClick={() => (mode === 'in-house' && existing === 0 ? (entity.set('name', entity.values.name || name), setStep(2)) : finish(false))}>Continue</button>
              {existing === 0 && <button className="btn" disabled={!mode || !name.trim() || busy} onClick={() => finish(true)}>Start with a sample entity</button>}
            </div>
            {existing > 0 && <p className="small muted">{existing} existing {existing === 1 ? 'record set is' : 'record sets are'} kept.</p>}
          </>
        )}
        {step === 2 && (
          <>
            <h1>Your first entity</h1>
            <p className="muted">Choose the laws that apply. Tenet shows only those laws’ fields, terms, deadlines and checks, and you can change them later.</p>
            <FormFields fields={WORKSPACE_FIELDS.filter((f) => f.section === 'Entity')} values={entity.values} set={entity.set} errors={entity.errors} ds={null} ctx={{}} idPrefix="ob" />
            {jx.length > 0 && (
              <div className="stack" style={{ gap: 6 }}>
                {jx.map((c) => <p key={c} className="small"><b>{PACKS[c].shortLaw}</b> · {PACKS[c].blurb}</p>)}
              </div>
            )}
            <div className="row"><button className="btn primary" disabled={busy} onClick={() => finish(false)}>Create entity</button><button className="btn" onClick={() => setStep(1)}>Back</button></div>
            <p className="small muted">Supported now: {JURISDICTION_CODES.map((c) => PACKS[c].name).join(', ')}.</p>
          </>
        )}
      </div>
    </div>
  );
}
