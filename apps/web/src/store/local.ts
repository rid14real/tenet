// Browser-only store for development and for views where no shared database is available.

import { COLLECTIONS, migrateDataset, migrateWorkspace, type AuditEntry, type CollectionName, type OrgSettings, type Workspace } from '@tenet/core';
import { browserDownload, clean, newId, now, type AnyRecord, type Session, type Store } from './types';

interface Db { org: OrgSettings | null; workspaces: Workspace[]; records: Record<string, Partial<Record<CollectionName, AnyRecord[]>>>; audit: Record<string, AuditEntry[]> }
const KEY = 'tenet.local.v1';

function load(): Db {
  try { const raw = localStorage.getItem(KEY); if (raw) return { org: null, ...JSON.parse(raw) }; } catch { /* storage blocked */ }
  return { org: null, workspaces: [], records: {}, audit: {} };
}

export function createLocalStore(note = 'Saved in this browser only'): Store {
  const db = load();
  const listeners = new Set<() => void>();
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch { /* ignore */ } listeners.forEach((l) => l()); };
  const bucket = (ws: string) => (db.records[ws] ??= {});

  return {
    kind: 'local',
    async session(): Promise<Session> { return { userName: 'You', canEdit: true, isAdmin: true, storageNote: note }; },
    async getOrg() { return db.org; },
    async saveOrg(o) { db.org = clean(o); persist(); },
    async listWorkspaces() { return db.workspaces.map((w) => migrateWorkspace(w as unknown as Record<string, unknown>)); },
    async saveWorkspace(w) {
      const i = db.workspaces.findIndex((x) => x.id === w.id);
      if (i >= 0) db.workspaces[i] = clean(w); else db.workspaces.push(clean(w));
      persist();
    },
    async deleteWorkspace(id) { db.workspaces = db.workspaces.filter((w) => w.id !== id); delete db.records[id]; delete db.audit[id]; persist(); },
    async loadDataset(id) {
      const w = db.workspaces.find((x) => x.id === id); if (!w) return null;
      const b = bucket(id);
      return migrateDataset({ workspace: w, ...Object.fromEntries(COLLECTIONS.map((c) => [c, b[c] ?? []])) });
    },
    async saveRecord(ws, col, rec) {
      const list = (bucket(ws)[col] ??= []); const i = list.findIndex((x) => x.id === rec.id);
      if (i >= 0) list[i] = clean(rec); else list.push(clean(rec));
      persist();
    },
    async deleteRecord(ws, col, id) { const b = bucket(ws); b[col] = (b[col] ?? []).filter((x) => x.id !== id); persist(); },
    async listAudit(ws) { return [...(db.audit[ws] ?? [])].sort((a, b) => b.at.localeCompare(a.at)); },
    async audit(ws, e) { (db.audit[ws] ??= []).push({ ...e, id: newId(), at: now(), actor: 'You' }); persist(); },
    async importDataset(ds) {
      db.workspaces.push(clean(ds.workspace));
      const b = bucket(ds.workspace.id);
      for (const c of COLLECTIONS) b[c] = clean((ds as unknown as Record<string, AnyRecord[]>)[c] ?? []);
      persist();
    },
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async download(filename, text, mime) { browserDownload(filename, text, mime); return 'saved'; },
  };
}
