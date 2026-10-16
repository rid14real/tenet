// Store backed by the Tenet API (PostgreSQL). The server enforces tenancy and writes the audit trail.

import { migrateDataset, migrateWorkspace, type AuditEntry, type OrgSettings } from '@tenet/core';
import { browserDownload, type Session, type Store, type TeamMember } from './types';

export class ApiError extends Error { constructor(public status: number, message: string, public fields?: Record<string, string>) { super(message); } }

export function createApiStore(base = '/api'): Store {
  const listeners = new Set<() => void>();
  const emit = () => listeners.forEach((l) => l());
  setInterval(() => { if (document.visibilityState === 'visible') emit(); }, 30_000);

  async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(base + path, { method, credentials: 'same-origin', headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
    if (res.status === 204) return undefined as T;
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new ApiError(res.status, data.message ?? `Request failed (${res.status})`, data.errors);
    return data as T;
  }
  type Me = { user: { name: string; role: string }; org: { name: string; mode: OrgSettings['mode']; createdAt: string } };
  let me: Me | null = null;

  return {
    kind: 'api',
    async session() {
      try {
        me = await call<Me>('GET', '/me');
        return { userName: me.user.name, canEdit: me.user.role !== 'viewer', isAdmin: me.user.role === 'admin', storageNote: 'Saved to your Tenet server' } as Session;
      } catch (e) { if (e instanceof ApiError && e.status === 401) return null; throw e; }
    },
    async signIn(email, password) { await call('POST', '/auth/login', { email, password }); },
    async signUp(input) { await call('POST', '/auth/signup', input); },
    async signOut() { await call('POST', '/auth/logout'); },
    async getOrg() { if (!me) me = await call<Me>('GET', '/me'); return { name: me.org.name, mode: me.org.mode, createdAt: me.org.createdAt }; },
    async saveOrg(o) { await call('PATCH', '/org', { name: o.name, mode: o.mode }); me = null; emit(); },
    listTeam: () => call<TeamMember[]>('GET', '/users'),
    async addTeamMember(m) { await call('POST', '/users', m); },
    async listWorkspaces() { return (await call<Record<string, unknown>[]>('GET', '/workspaces')).map(migrateWorkspace); },
    async saveWorkspace(w) { await call('PUT', `/workspaces/${w.id}`, w); emit(); },
    async deleteWorkspace(id) { await call('DELETE', `/workspaces/${id}`); emit(); },
    async loadDataset(id) { try { return migrateDataset(await call<Record<string, unknown>>('GET', `/workspaces/${id}/dataset`)); } catch (e) { if (e instanceof ApiError && e.status === 404) return null; throw e; } },
    async saveRecord(ws, col, rec) { await call('PUT', `/workspaces/${ws}/${col}/${rec.id}`, rec); emit(); },
    async deleteRecord(ws, col, id) { await call('DELETE', `/workspaces/${ws}/${col}/${id}`); emit(); },
    listAudit: (ws) => call<AuditEntry[]>('GET', `/workspaces/${ws}/audit`),
    async audit(ws, e) { if (e.action === 'generate-pack' || e.action === 'export') await call('POST', `/workspaces/${ws}/audit`, e); },
    async importDataset(ds) { await call('POST', '/workspaces/import', ds); emit(); },
    onChange(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    async download(filename, text, mime) { browserDownload(filename, text, mime); return 'saved'; },
  };
}
