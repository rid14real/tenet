import type { AuditEntry, CollectionName, Dataset, OrgSettings, Workspace } from '@tenet/core';

export interface Session {
  userName: string;
  canEdit: boolean;
  isAdmin: boolean;
  storageNote: string;
}

export type AnyRecord = { id: string } & Record<string, unknown>;

export interface TeamMember { id: string; name: string; email: string; role: 'admin' | 'editor' | 'viewer' }

export interface Store {
  kind: 'api' | 'artifact' | 'local';
  session(): Promise<Session | null>;
  signIn?(email: string, password: string): Promise<void>;
  signUp?(input: { email: string; password: string; name: string; orgName: string; mode: OrgSettings['mode'] }): Promise<void>;
  signOut?(): Promise<void>;
  /** Organisation settings; null until onboarding is done. */
  getOrg(): Promise<OrgSettings | null>;
  saveOrg(o: OrgSettings): Promise<void>;
  listTeam?(): Promise<TeamMember[]>;
  addTeamMember?(m: { name: string; email: string; role: TeamMember['role']; password: string }): Promise<void>;

  listWorkspaces(): Promise<Workspace[]>;
  saveWorkspace(w: Workspace): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  loadDataset(workspaceId: string): Promise<Dataset | null>;
  saveRecord(workspaceId: string, collection: CollectionName, record: AnyRecord): Promise<void>;
  deleteRecord(workspaceId: string, collection: CollectionName, id: string): Promise<void>;
  listAudit(workspaceId: string): Promise<AuditEntry[]>;
  /** For stores that do not write their own audit trail. Server-backed stores record changes themselves. */
  audit(workspaceId: string, entry: Omit<AuditEntry, 'id' | 'at' | 'actor'>): Promise<void>;
  importDataset(ds: Dataset): Promise<void>;
  onChange(cb: () => void): () => void;
  download(filename: string, text: string, mime?: string): Promise<'saved' | 'declined' | 'unavailable'>;
}

export const now = () => new Date().toISOString();
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
export const clean = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

export function browserDownload(filename: string, text: string, mime = 'text/markdown') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
