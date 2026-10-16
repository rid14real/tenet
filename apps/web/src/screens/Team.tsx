import { useEffect, useState } from 'react';
import { useApp } from '../context';
import type { TeamMember } from '../store/types';
import { Pill } from '../ui';

export function Team() {
  const { store, session, toast, org } = useApp();
  const [rows, setRows] = useState<TeamMember[] | null>(null);
  const [f, setF] = useState({ name: '', email: '', role: 'editor' as TeamMember['role'], password: '' });
  const [err, setErr] = useState('');
  const load = () => store.listTeam?.().then(setRows).catch((e) => setErr((e as Error).message));
  useEffect(() => { void load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  if (!store.listTeam) return <p className="muted">Team management is available on a Tenet server.</p>;
  return (
    <>
      <div className="head"><div><p className="eyebrow">{org.name}</p><h1>Team</h1><p className="muted">Admins manage people and can remove {org.mode === 'advisory' ? 'clients' : 'entities'}. Editors change records. Viewers read only.</p></div></div>
      <div className="cols">
        <section className="card flush col-2 tablebox">
          <table><thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
            <tbody>{(rows ?? []).map((m) => <tr key={m.id}><td>{m.name}</td><td>{m.email}</td><td><Pill tone={m.role === 'admin' ? 'info' : 'none'}>{m.role}</Pill></td></tr>)}</tbody></table>
        </section>
        {session.isAdmin && (
          <form className="card col-1" onSubmit={async (e) => { e.preventDefault(); setErr(''); try { await store.addTeamMember!(f); toast(`Added ${f.name}`); setF({ name: '', email: '', role: 'editor', password: '' }); void load(); } catch (x) { setErr((x as Error).message); } }}>
            <h2>Add a person</h2>
            <div className="field"><label htmlFor="t-name">Name</label><input id="t-name" type="text" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
            <div className="field"><label htmlFor="t-email">Email</label><input id="t-email" type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
            <div className="field"><label htmlFor="t-role">Role</label><select id="t-role" value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as TeamMember['role'] })}><option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option></select></div>
            <div className="field"><label htmlFor="t-pw">Temporary password</label><input id="t-pw" type="password" minLength={10} required value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /><span className="help">At least 10 characters. Share it securely.</span></div>
            {err && <p className="notice bad" role="alert">{err}</p>}
            <button className="btn primary">Add person</button>
          </form>
        )}
      </div>
    </>
  );
}
