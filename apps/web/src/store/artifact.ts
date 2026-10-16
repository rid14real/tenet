// Store backed by the claude.ai artifact database. Used by the published browser version.
// Layout: settings/org · workspaces/{id} · ws/{id}/{collection}/{recordId} · ws/{id}/audit/{entryId}

import { COLLECTIONS, migrateDataset, migrateWorkspace, type AuditEntry, type Dataset, type OrgSettings, type Workspace } from '@tenet/core';
import { clean, newId, now, type AnyRecord, type Session, type Store } from './types';

interface Snap { id: string; exists: boolean; data(): Record<string, unknown> | undefined }
interface QSnap { docs: Snap[] }
interface DocRef { get(): Promise<Snap>; set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void> }
interface ColRef { doc(id?: string): DocRef; get(): Promise<QSnap>; onSnapshot(n: (s: QSnap) => void, e?: (err: unknown) => void): () => void }
interface Db { doc(p: string): DocRef; collection(p: string): ColRef }
interface User { me(): Promise<{ id: string | null; name: string; canEdit: boolean; isOwner: boolean }> }
interface Downloads { save(r: { filename: string; data: string }): Promise<{ status: string }> }
declare global { interface Window { claude?: { use(name: string): Promise<unknown> } } }

export async function createArtifactStore(): Promise<Store | null> {
  const c = window.claude;
  if (!c?.use) return null;
  const db = (await c.use('db')) as Db | null;
  if (!db) return null;
  const user = (await c.use('user')) as User | null;
  const downloads = (await c.use('downloads')) as Downloads | null;
  const me = user ? await user.me() : { id: null, name: '', canEdit: false, isOwner: false };

  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  const subs = new Map<string, () => void>();
  const watch = (path: string) => {
    if (subs.has(path)) return;
    let first = true;
    subs.set(path, db.collection(path).onSnapshot(() => { if (first) { first = false; return; } emit(); }, () => subs.delete(path)));
  };
  watch('workspaces');
  const list = async <T,>(path: string): Promise<T[]> => (await db.collection(path).get()).docs.filter((d) => d.exists).map((d) => ({ ...(d.data() as object), id: d.id }) as T);
  const actor = me.name || 'Editor';

  return {
    kind: 'artifact',
    async session(): Promise<Session> { return { userName: me.name || 'You', canEdit: me.canEdit, isAdmin: me.isOwner || me.canEdit, storageNote: 'Saved to this page’s shared database' }; },
    async getOrg() { const s = await db.doc('settings/org').get(); return s.exists ? (s.data() as unknown as OrgSettings) : null; },
    async saveOrg(o) { await db.doc('settings/org').set(clean(o) as unknown as Record<string, unknown>); emit(); },
    async listWorkspaces() { return (await list<Record<string, unknown>>('workspaces')).map(migrateWorkspace); },
    async saveWorkspace(w) { await db.doc(`workspaces/${w.id}`).set(clean(w) as unknown as Record<string, unknown>); emit(); },
    async deleteWorkspace(id) {
      for (const col of [...COLLECTIONS, 'audit']) {
        const snap = await db.collection(`ws/${id}/${col}`).get();
        await Promise.all(snap.docs.map((d) => db.doc(`ws/${id}/${col}/${d.id}`).delete()));
      }
      await db.doc(`workspaces/${id}`).delete();
      emit();
    },
    async loadDataset(id) {
      const ws = await db.doc(`workspaces/${id}`).get();
      if (!ws.exists) return null;
      COLLECTIONS.forEach((col) => watch(`ws/${id}/${col}`));
      const cols = await Promise.all(COLLECTIONS.map((col) => list<AnyRecord>(`ws/${id}/${col}`)));
      const raw: Record<string, unknown> = { workspace: { ...(ws.data() as object), id } };
      COLLECTIONS.forEach((col, i) => { raw[col] = cols[i]; });
      return migrateDataset(raw) as Dataset;
    },
    async saveRecord(ws, col, rec) { await db.doc(`ws/${ws}/${col}/${rec.id}`).set(clean(rec)); emit(); },
    async deleteRecord(ws, col, id) { await db.doc(`ws/${ws}/${col}/${id}`).delete(); emit(); },
    async listAudit(ws) { return (await list<AuditEntry>(`ws/${ws}/audit`)).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 300); },
    async audit(ws, e) { await db.doc(`ws/${ws}/audit/${newId()}`).set(clean({ ...e, at: now(), actor })); },
    async importDataset(ds) {
      const wsId = ds.workspace.id;
      await db.doc(`workspaces/${wsId}`).set(clean(ds.workspace) as unknown as Record<string, unknown>);
      for (const col of COLLECTIONS) {
        const rows = (ds as unknown as Record<string, AnyRecord[]>)[col] ?? [];
        await Promise.all(rows.map((r) => db.doc(`ws/${wsId}/${col}/${r.id}`).set(clean(r))));
      }
      emit();
    },
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async download(filename, text) {
      if (!downloads) return 'unavailable';
      try { await downloads.save({ filename, data: text }); return 'saved'; }
      catch (e) { return (e as { code?: string })?.code === 'declined' ? 'declined' : 'unavailable'; }
    },
  };
}

export type { Workspace };
