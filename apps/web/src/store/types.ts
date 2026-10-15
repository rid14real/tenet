import type { AuditEntry, CollectionName, Dataset, Workspace } from '@tenet/core';

export interface Session {
  /** Display name of the signed-in person, if known. */
  userName: string;
  /** Organisation (DPCO or company) the person works for. */
  orgName: string;
  canEdit: boolean;
  /** Short note shown in the footer about where data is kept. */
  storageNote: string;
}

export type AnyRecord = { id: string } & Record<string, unknown>;

export interface Store {
  kind: 'api' | 'artifact' | 'local';
  /** Resolve the session, or null when the person must sign in (API mode). */
  session(): Promise<Session | null>;
  signIn?(email: string, password: string): Promise<void>;
  signUp?(input: { email: string; password: string; name: string; orgName: string }): Promise<void>;
  signOut?(): Promise<void>;

  listWorkspaces(): Promise<Workspace[]>;
  saveWorkspace(w: Workspace): Promise<void>;
  deleteWorkspace(id: string): Promise<void>;
  loadDataset(workspaceId: string): Promise<Dataset | null>;
  saveRecord(workspaceId: string, collection: CollectionName, record: AnyRecord): Promise<void>;
  deleteRecord(workspaceId: string, collection: CollectionName, id: string): Promise<void>;
  listAudit(workspaceId: string): Promise<AuditEntry[]>;
  /** Called by the UI for stores that do not write their own audit trail. Server-backed stores ignore it. */
  audit(workspaceId: string, entry: Omit<AuditEntry, 'id' | 'at' | 'actor'>): Promise<void>;
  importDataset(ds: Dataset): Promise<void>;
  /** Fires whenever data may have changed (own writes, other viewers, polling). */
  onChange(cb: () => void): () => void;
  /** Offer a generated file to the person. */
  download(filename: string, text: string): Promise<'saved' | 'declined' | 'unavailable'>;
}

export const now = () => new Date().toISOString();
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));
/** Drop undefined values so documents are plain JSON. */
export const clean = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
