import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { compliance, overallScore, type AuditEntry, type CollectionName, type Dataset, type OrgSettings, type Workspace } from '@tenet/core';
import { Ctx, wordsFor, type AppCtx, type Route, type Tab } from './context';
import { Home } from './screens/Home';
import { Login } from './screens/Login';
import { Onboarding } from './screens/Onboarding';
import { Rules } from './screens/Rules';
import { Team } from './screens/Team';
import { WorkspaceScreen } from './screens/Workspace';
import type { AnyRecord, Session, Store } from './store/types';
import { Jx, Toast } from './ui';

const SECTIONS: { id: Tab; label: string; group?: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'actions', label: 'Action plan' },
  { id: 'datamap', label: 'Data map', group: 'Records' },
  { id: 'vendors', label: 'Vendors', group: 'Records' },
  { id: 'ai', label: 'AI systems', group: 'Records' },
  { id: 'assessments', label: 'Assessments', group: 'Workflows' },
  { id: 'incidents', label: 'Incidents', group: 'Workflows' },
  { id: 'requests', label: 'Requests', group: 'Workflows' },
  { id: 'governance', label: 'Governance', group: 'Workflows' },
  { id: 'log', label: 'Activity log', group: 'Settings' },
  { id: 'settings', label: 'Entity settings', group: 'Settings' },
];

export function App({ store, banner }: { store: Store; banner?: string }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [org, setOrg] = useState<OrgSettings | null | undefined>(undefined);
  const [route, setRoute] = useState<Route>({ screen: 'home' });
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [datasets, setDatasets] = useState<Record<string, Dataset>>({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [toastText, setToastText] = useState('');
  const loading = useRef(false);
  const again = useRef(false);
  const autoRouted = useRef(false);

  const refreshSession = useCallback(() => {
    store.session().then(async (s) => { setSession(s); if (s) setOrg(await store.getOrg()); }).catch((e) => { setError(String(e.message ?? e)); setSession(null); });
  }, [store]);
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
    finally { loading.current = false; setLoaded(true); if (again.current) { again.current = false; void load(); } }
  }, [store]);

  useEffect(() => { if (session) { void load(); return store.onChange(() => void load()); } }, [session, store, load]);

  // In-house with a single entity: open it straight away.
  useEffect(() => {
    if (!loaded || !org || autoRouted.current) return;
    autoRouted.current = true;
    if (org.mode === 'in-house' && workspaces.length === 1 && route.screen === 'home') setRoute({ screen: 'ws', id: workspaces[0].id, tab: 'overview' });
  }, [loaded, org, workspaces, route.screen]);

  const go = useCallback((r: Route) => { setRoute(r); window.scrollTo?.(0, 0); }, []);
  const wsId = route.screen === 'ws' ? route.id : null;
  const ds = wsId ? datasets[wsId] ?? null : null;

  const audit = useCallback(async (id: string, e: Omit<AuditEntry, 'id' | 'at' | 'actor'>) => { if (store.kind !== 'api' || e.action === 'export' || e.action === 'generate-pack') { try { await store.audit(id, e); } catch { /* best effort */ } } }, [store]);

  const ctx: AppCtx | null = useMemo(() => !session || !org ? null : ({
    store, session, org, words: wordsFor(org.mode), route, go, workspaces, datasets, ds,
    fieldCtx: { workspace: ds?.workspace },
    toast: setToastText,
    reload: () => void load(),
    logEvent: async (e) => { if (wsId) await audit(wsId, e); },
    async download(filename, text, mime) {
      const r = await store.download(filename, text, mime);
      setToastText(r === 'saved' ? `Downloaded ${filename}` : r === 'declined' ? 'Download cancelled' : 'Downloads are not available here');
      if (wsId && r === 'saved') await audit(wsId, { action: 'export', collection: 'export', summary: `Exported ${filename}` });
    },
    async saveRecord(col: CollectionName, rec: AnyRecord, summary?: string) {
      if (!wsId) return;
      try {
        const isNew = !ds || !((ds as unknown as Record<string, AnyRecord[]>)[col] ?? []).some((r) => r.id === rec.id);
        await store.saveRecord(wsId, col, rec);
        await audit(wsId, { action: isNew ? 'create' : 'update', collection: col, recordId: rec.id, summary: summary ?? `Saved ${col}` });
        setToastText('Saved');
      } catch (e) { setToastText(`Not saved: ${(e as Error).message}`); throw e; }
    },
    async deleteRecord(col: CollectionName, rec: AnyRecord, label?: string) {
      if (!wsId) return;
      await store.deleteRecord(wsId, col, rec.id);
      await audit(wsId, { action: 'delete', collection: col, recordId: rec.id, summary: `Deleted ${label ?? String(rec.name ?? rec.title ?? rec.requester ?? col)}` });
      setToastText('Deleted');
    },
    async saveWorkspace(w: Workspace, summary?: string, action: AuditEntry['action'] = 'update') {
      await store.saveWorkspace(w);
      await audit(w.id, { action, collection: 'workspace', recordId: w.id, summary: summary ?? 'Updated entity settings' });
    },
  }), [session, org, store, route, go, workspaces, datasets, ds, wsId, load, audit]);

  if (session === undefined || (session && org === undefined)) return <div className="login"><p className="muted">Loading…</p></div>;
  if (session === null) return store.signIn ? <Login store={store} onDone={refreshSession} /> : <div className="login"><p className="notice bad">{error || 'This view cannot reach its data.'}</p></div>;
  if (!org) return <Onboarding store={store} existing={workspaces.length} onDone={() => { autoRouted.current = false; refreshSession(); void load(); }} />;

  const words = wordsFor(org.mode);
  const scores = (w: Workspace) => { const d = datasets[w.id]; return d ? overallScore(compliance(d)) : null; };
  const showAll = true;

  return (
    <Ctx.Provider value={ctx}>
      <div className="shell">
        <nav className="rail" aria-label="Main">
          <div className="brand">
            <svg width="26" height="26" viewBox="0 0 28 28" fill="none" aria-hidden="true"><rect x="1.5" y="1.5" width="25" height="25" rx="7" stroke="#7FD1B9" strokeWidth="2" /><path d="M8 9h12M14 9v11" stroke="#7FD1B9" strokeWidth="2.4" strokeLinecap="round" /></svg>
            <div><b>Tenet</b><span>Privacy and AI governance</span></div>
          </div>
          <div className="org"><div className="k">{org.mode === 'advisory' ? 'Advisory practice' : 'In-house programme'}</div><div style={{ fontWeight: 600 }}>{org.name}</div><div className="small" style={{ color: 'var(--rail-muted)' }}>{session.userName}{session.canEdit ? '' : ' · view only'}</div></div>
          {showAll && (
            <div className="nav">
              <button aria-current={route.screen === 'home' ? 'page' : undefined} onClick={() => go({ screen: 'home' })}>{org.mode === 'advisory' ? 'All clients' : 'All entities'} <span className="count">{workspaces.length}</span></button>
            </div>
          )}
          {ds && route.screen === 'ws' && (
            <>
              <div className="rail-ws">
                <div className="rail-label">{words.Entity}</div>
                {workspaces.length > 1 ? (
                  <select aria-label={`Switch ${words.entity}`} value={ds.workspace.id} onChange={(e) => go({ screen: 'ws', id: e.target.value, tab: route.tab })}>
                    {workspaces.slice().sort((a, b) => a.name.localeCompare(b.name)).map((w) => <option key={w.id} value={w.id}>{w.name}{scores(w) !== null ? ` · ${scores(w)}%` : ''}</option>)}
                  </select>
                ) : <div className="ws-name">{ds.workspace.name}</div>}
                <Jx codes={ds.workspace.jurisdictions} />
              </div>
              <div className="nav vertical">
                {SECTIONS.map((s, i) => (
                  <div key={s.id} style={{ display: 'contents' }}>
                    {s.group && SECTIONS[i - 1]?.group !== s.group && <div className="rail-label" style={{ marginTop: 8 }}>{s.group}</div>}
                    <button aria-current={route.tab === s.id ? 'page' : undefined} onClick={() => go({ screen: 'ws', id: ds.workspace.id, tab: s.id })}>{s.label}</button>
                  </div>
                ))}
              </div>
            </>
          )}
          <div className="nav" style={{ marginTop: 8 }}>
            <button aria-current={route.screen === 'rules' ? 'page' : undefined} onClick={() => go({ screen: 'rules' })}>Rules and sources</button>
            {store.listTeam && <button aria-current={route.screen === 'team' ? 'page' : undefined} onClick={() => go({ screen: 'team' })}>Team</button>}
          </div>
          <div className="rail-foot">
            <span>{session.storageNote}</span>
            {store.signOut && <button onClick={async () => {
              await store.signOut!();
              // Clear everything the previous user could see before anyone else signs in.
              setWorkspaces([]); setDatasets({}); setLoaded(false); setOrg(undefined); setError('');
              setRoute({ screen: 'home' }); autoRouted.current = false; setSession(null);
            }}>Sign out</button>}
          </div>
        </nav>
        <main className="main">
          {banner && <p className="notice warn">{banner}</p>}
          {error && <p className="notice bad" role="alert">{error}</p>}
          {!loaded ? <p className="muted">Loading…</p>
            : route.screen === 'home' ? <Home />
            : route.screen === 'rules' ? <Rules />
            : route.screen === 'team' ? <Team />
            : ds ? <WorkspaceScreen key={ds.workspace.id} />
            : <div className="empty"><h2>{words.Entity} not found</h2><p className="muted">It may have been removed.</p><button className="btn" onClick={() => go({ screen: 'home' })}>Back to {words.entities}</button></div>}
        </main>
      </div>
      {toastText && <Toast text={toastText} onDone={() => setToastText('')} />}
    </Ctx.Provider>
  );
}
