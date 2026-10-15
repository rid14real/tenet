import { createContext, useContext } from 'react';
import type { AuditEntry, CollectionName, Dataset, Workspace } from '@tenet/core';
import type { AnyRecord, Session, Store } from './store/types';

export type Tab = 'overview' | 'return' | 'activities' | 'vendors' | 'assessments' | 'aiSystems' | 'incidents' | 'requests' | 'map' | 'log' | 'profile';
export type Route = { screen: 'portfolio' } | { screen: 'rules' } | { screen: 'workspace'; id: string; tab: Tab; open?: string };

export interface AppCtx {
  store: Store;
  session: Session;
  route: Route;
  go: (r: Route) => void;
  workspaces: Workspace[];
  datasets: Record<string, Dataset>;
  ds: Dataset | null;
  saveRecord: (col: CollectionName, rec: AnyRecord, summary?: string) => Promise<void>;
  deleteRecord: (col: CollectionName, rec: AnyRecord) => Promise<void>;
  saveWorkspace: (w: Workspace, summary?: string, action?: AuditEntry['action']) => Promise<void>;
  logEvent: (e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => Promise<void>;
  toast: (text: string) => void;
  reload: () => void;
}

export const Ctx = createContext<AppCtx | null>(null);
export const useApp = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('App context missing');
  return c;
};
