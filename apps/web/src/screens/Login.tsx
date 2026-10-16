import { useState } from 'react';
import type { OrgSettings } from '@tenet/core';
import type { Store } from '../store/types';

export function Login({ store, onDone }: { store: Store; onDone: () => void }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [f, setF] = useState({ email: '', password: '', name: '', orgName: '', orgMode: 'in-house' as OrgSettings['mode'] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      if (mode === 'in') await store.signIn!(f.email, f.password);
      else await store.signUp!({ email: f.email, password: f.password, name: f.name, orgName: f.orgName, mode: f.orgMode });
      onDone();
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className="login">
      <form className="card" onSubmit={submit}>
        <div className="brand" style={{ padding: 0 }}><b>Tenet</b></div>
        <h1>{mode === 'in' ? 'Sign in' : 'Create your organisation'}</h1>
        {mode === 'up' && (
          <>
            <div className="field"><label htmlFor="l-mode">How you will use Tenet</label><select id="l-mode" value={f.orgMode} onChange={set('orgMode')}><option value="in-house">For our own organisation</option><option value="advisory">For clients (DPCO, DPO service, law firm)</option></select></div>
            <div className="field"><label htmlFor="l-org">{f.orgMode === 'advisory' ? 'Firm name' : 'Organisation name'}</label><input id="l-org" type="text" value={f.orgName} onChange={set('orgName')} required /></div>
            <div className="field"><label htmlFor="l-name">Your name</label><input id="l-name" type="text" value={f.name} onChange={set('name')} required /></div>
          </>
        )}
        <div className="field"><label htmlFor="l-email">Email</label><input id="l-email" type="email" autoComplete="email" value={f.email} onChange={set('email')} required /></div>
        <div className="field"><label htmlFor="l-pw">Password</label><input id="l-pw" type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} minLength={10} value={f.password} onChange={set('password')} required />{mode === 'up' && <span className="help">At least 10 characters.</span>}</div>
        {err && <p className="notice bad" role="alert">{err}</p>}
        <button className="btn primary" disabled={busy}>{busy ? 'Working…' : mode === 'in' ? 'Sign in' : 'Create organisation'}</button>
        <button type="button" className="linkish" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setErr(''); }}>{mode === 'in' ? 'New here? Create an organisation' : 'Already have an account? Sign in'}</button>
      </form>
    </div>
  );
}
