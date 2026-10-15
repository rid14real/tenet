import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { workspaceSummary, type AuditEntry, type CollectionName, type Dataset, type Workspace } from '@tenet/core';
import { Ctx, type AppCtx, type Route } from './context';
import { Login } from './screens/Login';
import { Portfolio } from './screens/Portfolio';
import { Rules } from './screens/Rules';
import { WorkspaceScreen } from './screens/Workspace';
import type { AnyRecord, Session, Store } from './store/types';
import { Toast } from './ui';

export function App({ store, banner }: { store: Store; banner?: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [route, setRoute] = useState<Route>({ screen: 'portfolio' });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [toastText, setToastText] = useState('');
  const loading = useRef(false);
  const again = useRef(false);

  const refreshSession = useCallback(() => { store.session().then(setSession).catch((e) => { setError(String(e.message ?? e)); setSession(null); }); }, [store]);
  useEffect(refreshSession, [refreshSession]);

  const load = useCallback(async () => {
    if (loading.current) { again.current = true; return; }
    loading.current = true;
    try {
      const ws = await store.listWorkspaces();
      const sets = await Promise.all(ws.map((w) => store.loadDataset(w.id)));
      const map: Record<string, Dataset> = {};
      sets.forEach((d) => { if (d) map[d.workspace.id] = d; });
      setWorkspaces(ws); setDatasets(map); setError('');
    } catch (e) { setError((e as Error).message ?? 'Could not load data'); }
    finally {
      loading.current = false; setLoaded(true);
      if (again.current) { again.current = false; void load(); }
    }
  }, [store]);

  useEffect(() => { if (session) { void load(); return store.onChange(() => void load()); } }, [session, store, load]);

  const go = useCallback((r: Route) => { setRoute(r); window.scrollTo?.(0, 0); }, []);
  const wsId = route.screen === 'workspace' ? route.id : null;
  const ds = wsId ? datasets[wsId] ?? null : null;

  const logEvent = useCallback(async (e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => { if (wsId) { try { await store.audit(wsId, e); } catch { /* audit is best effort client-side */ } } }, [store, wsId]);

  const ctx: AppCtx | null = useMemo(() => !session ? null : ({
    store, session, route, go, workspaces, datasets, ds,
    toast: setToastText,
    reload: () => void load(),
    logEvent,
    async saveRecord(col: CollectionName, rec: AnyRecord, summary?: string) {
      if (!wsId) return;
      try {
        const isNew = !ds || !(ds as unknown as Record<string, AnyRecord[]>)[col].some((r) => r.id === rec.id);
        await store.saveRecord(wsId, col, rec);
        if (store.kind !== 'api') await store.audit(wsId, { action: isNew ? 'create' : 'update', collection: col, recordId: rec.id, summary: summary ?? `Saved ${col}` });
        setToastText('Saved');
      } catch (e) { setToastText(`Not saved: ${(e as Error).message}`); throw e; }
    },
    async deleteRecord(col: CollectionName, rec: AnyRecord) {
      if (!wsId) return;
      await store.deleteRecord(wsId, col, rec.id);
      if (store.kind !== 'api') await store.audit(wsId, { action: 'delete', collection: col, recordId: rec.id, summary: `Deleted ${String(rec.name ?? rec.title ?? rec.requester ?? col)}` });
      setToastText('Deleted');
    },
    async saveWorkspace(w: Workspace, summary?: string, action: AuditEntry['action'] = 'update') {
      await store.saveWorkspace(w);
      if (store.kind !== 'api') await store.audit(w.id, { action, collection: 'workspace', recordId: w.id, summary: summary ?? 'Updated client' });
    },
  }), [session, store, route, go, workspaces, datasets, ds, wsId, load, logEvent]);

  if (session === undefined) return <div className="login"><p className="muted">Loading…</p></div>;
  if (session === null) return store.signIn ? <Login store={store} onDone={refreshSession} /> : <div className="login"><p className="notice bad">{error || 'This view cannot reach its data.'}</p></div>;

  const counts = (w: Workspace) => { const d = datasets[w.id]; return d ? workspaceSummary(d) : null; };

  return (
    <Ctx.Provider value={ctx}>
      <div className="shell">
        <nav className="rail" aria-label="Main">
          <div className="brand">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="25" height="25" rx="7" stroke="#7FD1B9" strokeWidth="2" /><path d="M8 9h12M14 9v11" stroke="#7FD1B9" strokeWidth="2.4" strokeLinecap="round" /></svg>
            <div><b>Tenet</b><span>Privacy and AI governance</span></div>
          </div>
          <div className="org"><div className="k">Signed in as</div><div style={{ fontWeight: 600 }}>{session.userName}</div><div className="small" style={{ color: 'var(--rail-muted)' }}>{session.orgName}{session.canEdit ? '' : ' · view only'}</div></div>
          <div className="nav">
            <button aria-current={route.screen === 'portfolio' ? 'page' : undefined} onClick={() => go({ screen: 'portfolio' })}>Clients <span className="count">{workspaces.length}</span></button>
            <button aria-current={route.screen === 'rules' ? 'page' : undefined} onClick={() => go({ screen: 'rules' })}>Rules and sources</button>
          </div>
          {workspaces.length > 0 && <div className="rail-label">Clients</div>}
          <div className="nav">
            {workspaces.slice().sort((a, b) => a.name.localeCompare(b.name)).map((w) => {
              const s = counts(w);
              return <button key={w.id} aria-current={wsId === w.id ? 'page' : undefined} onClick={() => go({ screen: 'workspace', id: w.id, tab: 'overview' })}><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</span>{s && <span className="count">{s.car.score}%</span>}</button>;
            })}
          </div>
          <div className="rail-foot">
            <span>{session.storageNote}</span>
            {store.signOut && <button onClick={async () => { await store.signOut!(); setSession(null); }}>Sign out</button>}
          </div>
        </nav>
        <main className="main">
          {banner && <p className="notice warn">{banner}</p>}
          {error && <p className="notice bad" role="alert">{error}</p>}
          {!loaded ? <p className="muted">Loading clients…</p>
            : route.screen === 'portfolio' ? <Portfolio />
            : route.screen === 'rules' ? <Rules />
            : ds ? <WorkspaceScreen tab={route.tab} />
            : <div className="empty"><h2>Client not found</h2><p className="muted">It may have been removed.</p><button className="btn" onClick={() => go({ screen: 'portfolio' })}>Back to clients</button></div>}
        </main>
      </div>
      {toastText && <Toast text={toastText} onDone={() => setToastText('')} />}
    </Ctx.Provider>
  );
}
