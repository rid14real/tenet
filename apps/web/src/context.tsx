import { createContext, useContext } from 'react';
import type { AuditEntry, CollectionName, Dataset, FieldCtx, OrgSettings, Workspace } from '@tenet/core';
import type { AnyRecord, Session, Store } from './store/types';

export type Tab = 'overview' | 'compliance' | 'datamap' | 'vendors' | 'assessments' | 'ai' | 'incidents' | 'requests' | 'governance' | 'actions' | 'log' | 'settings';
export type Route =
  | { screen: 'home' } | { screen: 'rules' } | { screen: 'team' }
  | { screen: 'ws'; id: string; tab: Tab; sub?: string; open?: string };

export interface Words { entity: string; entities: string; Entity: string; Entities: string }
export const wordsFor = (mode: OrgSettings['mode']): Words => mode === 'advisory'
  ? { entity: 'client', entities: 'clients', Entity: 'Client', Entities: 'Clients' }
  : { entity: 'entity', entities: 'entities', Entity: 'Entity', Entities: 'Entities' };

export interface AppCtx {
  store: Store;
  session: Session;
  org: OrgSettings;
  words: Words;
  route: Route;
  go: (r: Route) => void;
  workspaces: Workspace[];
  datasets: Record<string, Dataset>;
  ds: Dataset | null;
  fieldCtx: FieldCtx;
  saveRecord: (col: CollectionName, rec: AnyRecord, summary?: string) => Promise<void>;
  deleteRecord: (col: CollectionName, rec: AnyRecord, label?: string) => Promise<void>;
  saveWorkspace: (w: Workspace, summary?: string, action?: AuditEntry['action']) => Promise<void>;
  logEvent: (e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => Promise<void>;
  download: (filename: string, text: string, mime?: string) => Promise<void>;
  toast: (text: string) => void;
  reload: () => void;
}

export const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('App context missing');
  return c;
};
