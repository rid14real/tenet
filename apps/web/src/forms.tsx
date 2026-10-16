import { useState, type ReactNode } from 'react';
import { fieldOptions, isVisible, validateRecord, type Dataset, type FieldCtx, type FieldDef } from '@tenet/core';
import { Drawer } from './ui';

const toLocalInput = (iso?: unknown) => {
  if (!iso || typeof iso !== 'string') return '';
  const d = new Date(iso); if (Number.isNaN(d.getTime())) return '';
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

function refOptions(ds: Dataset | null, f: FieldDef) {
  if (!ds || !f.ref) return [];
  const rows = (ds as unknown as Record<string, { id: string; name?: string; title?: string; requester?: string }[]>)[f.ref] ?? [];
  return rows.map((r) => ({ value: r.id, label: r.name ?? r.title ?? r.requester ?? r.id }));
}

export function FieldInput({ f, value, onChange, error, ds, ctx, idPrefix }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void; error?: string; ds: Dataset | null; ctx: FieldCtx; idPrefix: string }) {
  const id = `${idPrefix}-${f.key}`;
  const help = f.help ? <span className="help">{f.help}</span> : null;
  const err = error ? <span className="err" role="alert">{error}</span> : null;
  if (f.type === 'boolean') {
    return (
      <div className="field">
        <label className="check" htmlFor={id}>
          <input id={id} type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
          <span>{f.label}{f.help && <span className="help" style={{ display: 'block', fontWeight: 400 }}>{f.help}</span>}</span>
        </label>
        {err}
      </div>
    );
  }
  if (f.type === 'multiselect' || (f.type === 'ref' && f.multiple)) {
    const opts = f.type === 'ref' ? refOptions(ds, f) : fieldOptions(f, ctx);
    const cur = Array.isArray(value) ? (value as string[]) : [];
    return (
      <div className="field" role="group" aria-labelledby={`${id}-l`}>
        <span className="label" id={`${id}-l`}>{f.label}{f.required ? ' *' : ''}</span>
        {opts.length === 0 ? <span className="help">{f.type === 'ref' ? `Nothing recorded yet under ${f.ref === 'systems' ? 'Systems' : f.ref === 'vendors' ? 'Vendors' : 'this list'}.` : 'Nothing to choose.'}</span> : (
          <div className="chips">
            {opts.map((o) => { const on = cur.includes(o.value); return <button type="button" key={o.value} className="chip" aria-pressed={on} onClick={() => onChange(on ? cur.filter((x) => x !== o.value) : [...cur, o.value])}>{o.label}</button>; })}
          </div>
        )}
        {help}{err}
      </div>
    );
  }
  let input: ReactNode;
  switch (f.type) {
    case 'textarea': input = <textarea id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />; break;
    case 'number': input = <input id={id} type="number" min={0} value={value === undefined || value === null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />; break;
    case 'date': input = <input id={id} type="date" value={typeof value === 'string' ? value.slice(0, 10) : ''} onChange={(e) => onChange(e.target.value)} />; break;
    case 'datetime': input = <input id={id} type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : '')} />; break;
    case 'tags': input = <input id={id} type="text" value={Array.isArray(value) ? (value as string[]).join(', ') : ((value as string) ?? '')} onChange={(e) => onChange(e.target.value.split(',').map((s) => s.trimStart()))} placeholder="Separate with commas" />; break;
    case 'select': case 'ref': {
      const opts = f.type === 'ref' ? refOptions(ds, f) : fieldOptions(f, ctx);
      input = (
        <select id={id} value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)}>
          {(!f.required || f.type === 'ref') && <option value="">— None —</option>}
          {opts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
      break;
    }
    default: input = <input id={id} type="text" value={(value as string) ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }
  return <div className="field"><label htmlFor={id}>{f.label}{f.required ? ' *' : ''}</label>{input}{help}{err}</div>;
}

export function initialValues(fields: FieldDef[], rec?: Record<string, unknown>) {
  const v: Record<string, unknown> = { ...(rec ?? {}) };
  for (const f of fields) if (v[f.key] === undefined && f.default !== undefined) v[f.key] = Array.isArray(f.default) ? [...f.default] : f.default;
  return v;
}

const wide = (f: FieldDef) => f.type === 'textarea' || f.type === 'multiselect' || !!f.multiple;

/** A form body: fields grouped by section, hidden fields left out. */
export function FormFields({ fields, values, set, errors, ds, ctx, idPrefix = 'f', disabled }: {
  fields: FieldDef[]; values: Record<string, unknown>; set: (k: string, v: unknown) => void; errors: Record<string, string>; ds: Dataset | null; ctx: FieldCtx; idPrefix?: string; disabled?: boolean;
}) {
  const visible = fields.filter((f) => isVisible(f, values, ctx));
  const sections = [...new Set(visible.map((f) => f.section ?? ''))];
  return (
    <fieldset disabled={disabled} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="stack">
      {sections.map((s) => (
        <div key={s || 'main'} className="stack" style={{ gap: 10 }}>
          {s && <h3>{s}</h3>}
          <div className="form-grid">
            {visible.filter((f) => (f.section ?? '') === s).map((f) => (
              <div key={f.key} className={wide(f) ? 'wide' : ''}><FieldInput f={f} value={values[f.key]} onChange={(v) => set(f.key, v)} error={errors[f.key]} ds={ds} ctx={ctx} idPrefix={idPrefix} /></div>
            ))}
          </div>
        </div>
      ))}
    </fieldset>
  );
}

export function useRecordForm(fields: FieldDef[], record: Record<string, unknown> | undefined, ctx: FieldCtx, passthrough: string[] = []) {
  const [values, setValues] = useState(() => initialValues(fields, record));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: unknown) => setValues((s) => ({ ...s, [k]: v }));
  const validate = () => { const r = validateRecord(fields, values, passthrough, ctx); setErrors(r.errors); return r; };
  return { values, setValues, set, errors, validate };
}

export function RecordDrawer({
  title, fields, record, ds, ctx, onSave, onDelete, onClose, extra, aside, passthrough = [], readOnly,
}: {
  title: string; fields: FieldDef[]; record?: Record<string, unknown>; ds: Dataset | null; ctx: FieldCtx;
  onSave: (value: Record<string, unknown>) => Promise<void>; onDelete?: () => Promise<void>; onClose: () => void;
  extra?: (values: Record<string, unknown>, set: (k: string, v: unknown) => void) => ReactNode;
  aside?: (values: Record<string, unknown>) => ReactNode; passthrough?: string[]; readOnly?: boolean;
}) {
  const form = useRecordForm(fields, record, ctx, passthrough);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const submit = async () => {
    const r = form.validate();
    if (!r.ok) return;
    setBusy(true);
    try { await onSave({ ...form.values, ...r.value }); } finally { setBusy(false); }
  };
  return (
    <Drawer title={title} onClose={onClose} footer={readOnly ? undefined : (
      <>
        <div className="row"><button className="btn primary" onClick={submit} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button><button className="btn" onClick={onClose}>Cancel</button></div>
        {onDelete && (confirmDelete
          ? <div className="row"><span className="small muted">Delete for good?</span><button className="btn danger" onClick={async () => { setBusy(true); await onDelete(); }}>Delete</button><button className="btn" onClick={() => setConfirmDelete(false)}>Keep</button></div>
          : <button className="btn ghost danger" onClick={() => setConfirmDelete(true)}>Delete</button>)}
      </>
    )}>
      {aside?.(form.values)}
      <form onSubmit={(e) => { e.preventDefault(); void submit(); }} className="stack">
        <FormFields fields={fields} values={form.values} set={form.set} errors={form.errors} ds={ds} ctx={ctx} idPrefix="rec" disabled={readOnly} />
        {extra?.(form.values, form.set)}
        {Object.keys(form.errors).length > 0 && <p className="notice bad">Fix the highlighted fields, then save.</p>}
        <button type="submit" hidden />
      </form>
    </Drawer>
  );
}
