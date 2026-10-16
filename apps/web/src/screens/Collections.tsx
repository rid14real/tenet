import { useEffect, useState, type ReactNode } from 'react';
import { COLLECTION_META, PACKS, fieldOptions, type CollectionName, type Dataset, type FieldCtx, type FieldDef, type JurisdictionCode } from '@tenet/core';
import { useApp } from '../context';
import { RecordDrawer } from '../forms';
import { newId, now, type AnyRecord } from '../store/types';
import { Empty, Jx, fmtDate, fmtDateTime, fmtNum, lower } from '../ui';

export function display(f: FieldDef, v: unknown, ds: Dataset, ctx: FieldCtx): ReactNode {
  if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) return <span className="muted">—</span>;
  if (f.key === 'jurisdictions' || f.key === 'markets') return <Jx codes={v as JurisdictionCode[]} />;
  if (f.key === 'jurisdiction') return PACKS[v as JurisdictionCode]?.name ?? String(v);
  switch (f.type) {
    case 'boolean': return v ? 'Yes' : 'No';
    case 'number': return <span className="mono">{fmtNum(Number(v))}</span>;
    case 'date': return fmtDate(String(v));
    case 'datetime': return fmtDateTime(String(v));
    case 'select': { const l = fieldOptions(f, ctx).find((o) => o.value === v)?.label ?? String(v); return l.split(' — ')[0]; }
    case 'multiselect': return (v as string[]).map((x) => fieldOptions(f, ctx).find((o) => o.value === x)?.label ?? x).join(', ');
    case 'tags': return (v as string[]).join(', ');
    case 'ref': {
      const rows = (ds as unknown as Record<string, AnyRecord[]>)[f.ref!] ?? [];
      const name = (id: string) => String(rows.find((x) => x.id === id)?.name ?? rows.find((x) => x.id === id)?.title ?? '—');
      return Array.isArray(v) ? v.map(name).join(', ') : name(String(v));
    }
    default: return String(v);
  }
}

export interface Column { label: string; cell: (r: AnyRecord) => ReactNode }

/** A list of records with a drawer for adding and editing. Pass `onOpen` to open a dedicated page instead. */
export function RecordList({ col, extra = [], onOpen, emptyText, rows: rowsIn, newDefaults, aside, addLabel, toolbar }: {
  col: CollectionName; extra?: Column[]; onOpen?: (r: AnyRecord) => void; emptyText: string; rows?: AnyRecord[];
  newDefaults?: Record<string, unknown>; aside?: (values: Record<string, unknown>) => ReactNode; addLabel?: string; toolbar?: ReactNode;
}) {
  const { ds, route, go, saveRecord, deleteRecord, session, fieldCtx } = useApp();
  const meta = COLLECTION_META[col];
  const [editing, setEditing] = useState<AnyRecord | 'new' | null>(null);
  const [q, setQ] = useState('');
  const open = route.screen === 'ws' ? route.open : undefined;
  const all = rowsIn ?? ((ds as unknown as Record<string, AnyRecord[]>)?.[col] ?? []);
  useEffect(() => {
    if (!open || onOpen) return;
    const r = all.find((x) => x.id === open); if (r) setEditing(r);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  if (!ds) return null;
  const rows = all.filter((r) => !q || JSON.stringify(r).toLowerCase().includes(q.toLowerCase())).slice().sort((a, b) => String(b.updatedAt ?? '').localeCompare(String(a.updatedAt ?? '')));
  const cols = meta.fields.filter((f) => !f.listHidden).slice(0, 4);
  const openRow = (r: AnyRecord) => (onOpen ? onOpen(r) : setEditing(r));
  const close = () => { setEditing(null); if (open && route.screen === 'ws') go({ ...route, open: undefined }); };
  const label = addLabel ?? `Add ${meta.singular}`;

  return (
    <>
      <div className="row">
        <p className="muted grow">{all.length} {all.length === 1 ? meta.singular : lower(meta.label)}</p>
        {toolbar}
        {all.length > 5 && <input type="search" aria-label={`Search ${lower(meta.label)}`} placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} style={{ maxWidth: 220 }} />}
        {session.canEdit && <button className="btn primary" onClick={() => (onOpen ? onOpen({ id: '' }) : setEditing('new'))}>{label}</button>}
      </div>
      {all.length === 0 ? <Empty title={`No ${lower(meta.label)} yet`} action={session.canEdit && <button className="btn primary" onClick={() => (onOpen ? onOpen({ id: '' }) : setEditing('new'))}>{label}</button>}>{emptyText}</Empty> : (
        <div className="card flush tablebox">
          <table style={{ minWidth: 760 }}>
            <thead><tr>{cols.map((f) => <th key={f.key}>{f.label}</th>)}{extra.map((x) => <th key={x.label}>{x.label}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="click" onClick={() => openRow(r)}>
                  {cols.map((f, i) => <td key={f.key}>{i === 0 ? <button className="linkish" onClick={(e) => { e.stopPropagation(); openRow(r); }}>{display(f, r[f.key], ds, fieldCtx)}</button> : display(f, r[f.key], ds, fieldCtx)}</td>)}
                  {extra.map((x) => <td key={x.label}>{x.cell(r)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <RecordDrawer
          title={editing === 'new' ? `New ${meta.singular}` : `Edit ${meta.singular}`}
          fields={meta.fields} record={editing === 'new' ? newDefaults : editing} ds={ds} ctx={fieldCtx} readOnly={!session.canEdit}
          passthrough={meta.passthrough} onClose={close} aside={aside}
          onSave={async (v) => {
            const base = editing === 'new' ? { id: newId(), createdAt: now() } : editing;
            const rec = { ...base, ...v, updatedAt: now() } as AnyRecord;
            await saveRecord(col, rec, `${editing === 'new' ? 'Added' : 'Updated'} ${meta.singular}: ${String(rec[meta.titleKey] ?? '')}`);
            close();
          }}
          onDelete={editing === 'new' ? undefined : async () => { await deleteRecord(col, editing); close(); }}
        />
      )}
    </>
  );
}
