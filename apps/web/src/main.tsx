import { createRoot } from 'react-dom/client';
import { App } from './App';
import { createApiStore } from './store/api';
import { createArtifactStore } from './store/artifact';
import { createLocalStore } from './store/local';
import type { Store } from './store/types';
import './styles.css';

const MODE = import.meta.env.VITE_STORE as 'api' | 'artifact' | 'local' | undefined;
const root = createRoot(document.getElementById('root')!);

async function boot() {
  let store: Store;
  let banner: string | undefined;
  if (MODE === 'artifact') {
    const s = await createArtifactStore().catch(() => null);
    if (s) store = s;
    else { store = createLocalStore('Saved in this browser only'); banner = 'The shared database is not available in this view, so changes are kept in this browser only.'; }
  } else if (MODE === 'local') {
    store = createLocalStore();
  } else {
    store = createApiStore(import.meta.env.VITE_API_BASE ?? '/api');
  }
  root.render(<App store={store} banner={banner} />);
}

root.render(<div className="login"><p className="muted">Loading…</p></div>);
void boot();
