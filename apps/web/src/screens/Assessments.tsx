import { useState } from 'react';
import {
  ASSESSMENT_KINDS, COLLECTION_META, OUTCOME_LABEL, PACKS, QUESTIONS, assessmentDescription, assessmentMarkdown, reviewAssessment,
  riskFromTemplate, riskLevel, riskScore, suggestedRisks, type Assessment, type AssessmentKind, type AssessmentRisk,
} from '@tenet/core';
import { useApp } from '../context';
import { FieldInput } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Empty, Jx, Pill, RiskMatrix, SubTabs, fmtDate, slug, type Tone } from '../ui';

const LEVEL_TONE: Record<string, Tone> = { low: 'ok', medium: 'warn', high: 'bad', critical: 'bad' };
const STATUS_TONE: Record<Assessment['status'], Tone> = { draft: 'none', 'in-review': 'info', approved: 'ok', rejected: 'bad' };

export function Assessments() {
  const { ds, route, go, session } = useApp();
  const initial = route.screen === 'ws' ? route.open : undefined;
  const [openId, setOpenId] = useState<string | null>(initial && !initial.startsWith('new') ? initial : null);
  const [creating, setCreating] = useState<string | null>(initial?.startsWith('new') ? initial.slice(4) : null);
  if (!ds) return null;
  const close = () => { setOpenId(null); setCreating(null); go({ screen: 'ws', id: ds.workspace.id, tab: 'assessments' }); };
  if (creating !== null) return <NewAssessment activityId={creating} onCancel={close} onCreated={(id) => { setCreating(null); setOpenId(id); }} />;
  if (openId) return <AssessmentPage id={openId} onClose={close} />;
  const rows = ds.assessments.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <>
      <div className="row"><p className="muted grow">{rows.length} assessment{rows.length === 1 ? '' : 's'}</p>{session.canEdit && <button className="btn primary" onClick={() => setCreating('')}>Start assessment</button>}</div>
      {rows.length === 0 ? <Empty title="No assessments yet" action={session.canEdit && <button className="btn primary" onClick={() => setCreating('')}>Start assessment</button>}>DPIAs, AI impact assessments, legitimate interests and transfer impact assessments. Each starts from the data map, suggests risks from what the processing involves, and tells you when a regulator must be consulted.</Empty> : (
        <div className="card flush tablebox">
          <table style={{ minWidth: 760 }}>
            <thead><tr><th>Assessment</th><th>Type</th><th>Covers</th><th>Residual risk</th><th>Progress</th><th>Status</th></tr></thead>
            <tbody>{rows.map((a) => {
              const r = reviewAssessment(a, ds);
              const done = r.progress.filter((p) => p.done).length;
              return (
                <tr key={a.id} className="click" onClick={() => setOpenId(a.id)}>
                  <td><button className="linkish" onClick={(e) => { e.stopPropagation(); setOpenId(a.id); }}>{a.title}</button>{a.nextReview && <div className="small muted">Review {fmtDate(a.nextReview)}</div>}</td>
                  <td>{ASSESSMENT_KINDS.find((k) => k.id === a.kind)?.short}</td>
                  <td className="small">{a.activityIds.map((id) => ds.activities.find((x) => x.id === id)?.name).filter(Boolean).join(', ') || '—'}</td>
                  <td>{a.risks.length ? <Pill tone={LEVEL_TONE[r.residualLevel]}>{r.residualLevel}</Pill> : <span className="muted">—</span>}</td>
                  <td className="small mono">{done}/{r.progress.length}</td>
                  <td><Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill></td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </>
  );
}

function NewAssessment({ activityId, onCancel, onCreated }: { activityId: string; onCancel: () => void; onCreated: (id: string) => void }) {
  const { ds, saveRecord } = useApp();
  const [kind, setKind] = useState<AssessmentKind>('dpia');
  const [acts, setActs] = useState<string[]>(activityId ? [activityId] : []);
  const [title, setTitle] = useState('');
  const first = ds!.activities.find((a) => a.id === acts[0]);
  const create = async () => {
    const id = newId();
    const k = ASSESSMENT_KINDS.find((x) => x.id === kind)!;
    const a: Assessment = { id, kind, title: title.trim() || `${k.short}: ${first?.name ?? 'untitled'}`, activityIds: acts, answers: {}, risks: [], status: 'draft', createdAt: now(), updatedAt: now() };
    if (kind === 'dpia' || kind === 'aia') a.risks = suggestedRisks(a, ds!).slice(0, 4).map((t) => riskFromTemplate(t, newId()));
    await saveRecord('assessments', a as unknown as AnyRecord, `Started ${k.short}: ${a.title}`);
    onCreated(id);
  };
  return (
    <section className="card">
      <h2>Start an assessment</h2>
      <div className="choice-grid" role="radiogroup" aria-label="Assessment type">
        {ASSESSMENT_KINDS.map((k) => <button key={k.id} className="choice" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)}><b>{k.label}</b><span>{k.about}</span></button>)}
      </div>
      <FieldInput f={{ ...COLLECTION_META.assessments.fields.find((f) => f.key === 'activityIds')!, label: 'Processing activities it covers' }} value={acts} onChange={(v) => setActs(v as string[])} ds={ds} ctx={{ workspace: ds!.workspace }} idPrefix="na" />
      <div className="field"><label htmlFor="na-title">Title</label><input id="na-title" type="text" value={title} placeholder={first ? `${ASSESSMENT_KINDS.find((x) => x.id === kind)!.short}: ${first.name}` : ''} onChange={(e) => setTitle(e.target.value)} /></div>
      {(kind === 'dpia' || kind === 'aia') && <p className="small muted">The description is drawn from the data map, and risks are suggested from what the processing involves. You can change everything.</p>}
      <div className="row"><button className="btn primary" onClick={create}>Create</button><button className="btn" onClick={onCancel}>Cancel</button></div>
    </section>
  );
}

function AssessmentPage({ id, onClose }: { id: string; onClose: () => void }) {
  const { ds, saveRecord, deleteRecord, session, download, fieldCtx } = useApp();
  const saved = ds!.assessments.find((a) => a.id === id);
  const [a, setA] = useState<Assessment | undefined>(saved && JSON.parse(JSON.stringify(saved)));
  const [dirty, setDirty] = useState(false);
  const qs = a ? QUESTIONS[a.kind] : [];
  const steps = [...new Set(qs.map((q) => q.step))];
  const usesRisks = a?.kind === 'dpia' || a?.kind === 'aia';
  const allSteps = [...steps, ...(usesRisks ? ['Risks'] : []), 'Sign-off'];
  const [step, setStep] = useState(allSteps[0]);
  if (!a) return <Empty title="Assessment not found" action={<button className="btn" onClick={onClose}>Back</button>}>It may have been deleted.</Empty>;
  const upd = (p: Partial<Assessment>) => { setA({ ...a, ...p }); setDirty(true); };
  const rev = reviewAssessment(a, ds!);
  const kind = ASSESSMENT_KINDS.find((k) => k.id === a.kind)!;
  const save = async () => { await saveRecord('assessments', { ...a, updatedAt: now() } as unknown as AnyRecord, `Updated ${kind.short}: ${a.title}`); setDirty(false); };
  const desc = assessmentDescription(a, ds!);
  const ro = !session.canEdit;
  const setRisk = (rid: string, p: Partial<AssessmentRisk>) => upd({ risks: a.risks.map((r) => (r.id === rid ? { ...r, ...p } : r)) });
  const num = (v: number, on: (n: number) => void, label: string) => <select aria-label={label} disabled={ro} value={v} onChange={(e) => on(Number(e.target.value))}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}</select>;

  return (
    <>
      <div className="row">
        <button className="btn ghost" onClick={onClose}>← Assessments</button>
        <div className="grow"><h2>{a.title}</h2><span className="small muted">{kind.label} · <Pill tone={STATUS_TONE[a.status]}>{a.status}</Pill></span></div>
        <button className="btn" onClick={() => download(`${slug(a.title)}.md`, assessmentMarkdown(a, ds!))}>Export (.md)</button>
        {!ro && <button className="btn primary" disabled={!dirty} onClick={save}>{dirty ? 'Save' : 'Saved'}</button>}
      </div>
      <SubTabs label="Assessment steps" value={step} onChange={setStep} tabs={allSteps.map((s) => ({ id: s, label: `${rev.progress.find((p) => p.step === s)?.done ? '✓ ' : ''}${s}` }))} />

      {step === steps[0] && (desc.length > 0 ? (
        <section className="card">
          <h2>From the data map</h2>
          {desc.map((d) => (
            <div key={d.id} className="stack" style={{ gap: 4 }}>
              <b>{d.name}</b>
              <p className="small">{d.purpose}</p>
              <div className="kv small">
                <div><div className="k">People</div><div>{d.people} · about {d.volume.toLocaleString('en-GB')}</div></div>
                <div><div className="k">Data</div><div>{d.data}</div></div>
                <div><div className="k">Systems</div><div>{d.systems}</div></div>
                <div><div className="k">Vendors</div><div>{d.vendors}</div></div>
                <div><div className="k">Retention</div><div>{d.retention}</div></div>
              </div>
              {d.perJx.map((p) => <p key={p.code} className="small"><Jx codes={[p.code]} /> Basis: {p.basis.ok ? p.basis.ref : p.basis.problem}{p.sensitive.length ? ` · ${PACKS[p.code].sensitive.term}: ${p.sensitive.join(', ')}` : ''}{p.triggers.length ? ` · triggers: ${p.triggers.join(', ')}` : ''}</p>)}
            </div>
          ))}
        </section>
      ) : <p className="notice">Link processing activities below to pull their details from the data map.</p>)}

      {steps.includes(step) && (
        <section className="card">
          {step === steps[0] && <FieldInput f={COLLECTION_META.assessments.fields.find((f) => f.key === 'activityIds')!} value={a.activityIds} onChange={(v) => upd({ activityIds: v as string[] })} ds={ds} ctx={fieldCtx} idPrefix="as" />}
          {qs.filter((q) => q.step === step).map((q) => (
            <div key={q.id} className="field">
              <label htmlFor={`q-${q.id}`}>{q.text}</label>
              {q.type === 'text'
                ? <textarea id={`q-${q.id}`} disabled={ro} value={(a.answers[q.id] as string) ?? ''} onChange={(e) => upd({ answers: { ...a.answers, [q.id]: e.target.value } })} />
                : <div className="chips" id={`q-${q.id}`}>{[true, false].map((b) => <button key={String(b)} type="button" className="chip" disabled={ro} aria-pressed={a.answers[q.id] === b} onClick={() => upd({ answers: { ...a.answers, [q.id]: b } })}>{b ? 'Yes' : 'No'}</button>)}</div>}
            </div>
          ))}
        </section>
      )}

      {step === 'Risks' && (
        <div className="cols">
          <section className="card col-2">
            <h2>Risks to people</h2>
            {a.risks.length === 0 && <p className="muted">No risks recorded. Add from the suggestions or write your own.</p>}
            {a.risks.map((r) => {
              const inh = riskScore(r.likelihood, r.severity); const res = riskScore(r.residualLikelihood, r.residualSeverity);
              return (
                <div key={r.id} className="risk">
                  <div className="row">
                    <input type="text" aria-label="Risk title" disabled={ro} value={r.title} onChange={(e) => setRisk(r.id, { title: e.target.value })} style={{ flex: '1 1 240px', fontWeight: 600 }} />
                    {!ro && <button className="btn ghost danger" onClick={() => upd({ risks: a.risks.filter((x) => x.id !== r.id) })}>Remove</button>}
                  </div>
                  {r.description && <p className="small muted">{r.description}</p>}
                  <div className="row small">
                    <span>Inherent: likelihood {num(r.likelihood, (n) => setRisk(r.id, { likelihood: n }), 'Inherent likelihood')} × severity {num(r.severity, (n) => setRisk(r.id, { severity: n }), 'Inherent severity')}</span>
                    <Pill tone={LEVEL_TONE[riskLevel(inh)]}>{riskLevel(inh)} {inh}</Pill>
                  </div>
                  <label className="field"><span className="label">Measures</span><textarea disabled={ro} value={r.measures ?? ''} onChange={(e) => setRisk(r.id, { measures: e.target.value })} /></label>
                  <div className="row small">
                    <span>Residual: likelihood {num(r.residualLikelihood, (n) => setRisk(r.id, { residualLikelihood: n }), 'Residual likelihood')} × severity {num(r.residualSeverity, (n) => setRisk(r.id, { residualSeverity: n }), 'Residual severity')}</span>
                    <Pill tone={LEVEL_TONE[riskLevel(res)]}>{riskLevel(res)} {res}</Pill>
                    <input type="text" aria-label="Owner" placeholder="Owner" disabled={ro} value={r.owner ?? ''} onChange={(e) => setRisk(r.id, { owner: e.target.value })} style={{ maxWidth: 180 }} />
                    <input type="date" aria-label="Due" disabled={ro} value={r.due ?? ''} onChange={(e) => setRisk(r.id, { due: e.target.value })} style={{ maxWidth: 170 }} />
                  </div>
                </div>
              );
            })}
            {!ro && <div><button className="btn" onClick={() => upd({ risks: [...a.risks, { id: newId(), title: 'New risk', likelihood: 3, severity: 3, residualLikelihood: 2, residualSeverity: 3 }] })}>Add a risk</button></div>}
          </section>
          <div className="col-1">
            <section className="card">
              <h2>Risk map</h2>
              <RiskMatrix points={a.risks.flatMap((r) => [{ l: r.likelihood, s: r.severity, label: `${r.title} (inherent)` }, { l: r.residualLikelihood, s: r.residualSeverity, label: `${r.title} (residual)`, residual: true }])} />
              <p className="small muted">I = inherent, R = residual after measures.</p>
            </section>
            <section className="card">
              <h2>Suggested from the data map</h2>
              {suggestedRisks(a, ds!).length === 0 ? <p className="small muted">No further suggestions.</p> : suggestedRisks(a, ds!).map((t) => (
                <div key={t.id} className="req"><div className="grow"><b className="small">{t.title}</b><div className="small muted">{t.description}</div></div>{!ro && <button className="btn ghost" onClick={() => upd({ risks: [...a.risks, riskFromTemplate(t, newId())] })}>Add</button>}</div>
              ))}
            </section>
          </div>
        </div>
      )}

      {step === 'Sign-off' && (
        <div className="cols">
          <section className="card col-2">
            <h2>Decision</h2>
            <p>The rules suggest: <b>{OUTCOME_LABEL[rev.suggestedOutcome]}</b>{usesRisks && a.risks.length ? ` (worst residual risk ${rev.residualLevel}, score ${rev.worstResidual})` : ''}.</p>
            {rev.consult.length > 0 && <p className="notice warn">Residual risk stays high. Consult before processing: {rev.consult.map((c) => `${PACKS[c.code].regulator} (${c.ref})`).join('; ')}.</p>}
            {rev.blockers.length > 0 && <p className="notice">Still to complete: {rev.blockers.join(', ')}.</p>}
            <div className="form-grid">
              {COLLECTION_META.assessments.fields.filter((f) => ['dpoAdvice', 'outcome', 'conditions', 'approver', 'approvedOn', 'status', 'nextReview'].includes(f.key)).map((f) => (
                <div key={f.key} className={f.type === 'textarea' ? 'wide' : ''}><FieldInput f={f} value={(a as unknown as Record<string, unknown>)[f.key]} onChange={(v) => upd({ [f.key]: v } as Partial<Assessment>)} ds={ds} ctx={fieldCtx} idPrefix="so" /></div>
              ))}
            </div>
            {a.status === 'approved' && !a.approver && <p className="notice bad">Record who approved it.</p>}
          </section>
          <section className="card col-1">
            <h2>Progress</h2>
            {rev.progress.map((p) => <div key={p.step} className="row small"><span className="grow">{p.step}</span><Pill tone={p.done ? 'ok' : 'none'}>{p.done ? 'Done' : 'To do'}</Pill></div>)}
            {!ro && <button className="btn ghost danger" onClick={async () => { await deleteRecord('assessments', a as unknown as AnyRecord, a.title); onClose(); }}>Delete assessment</button>}
          </section>
        </div>
      )}
    </>
  );
}
