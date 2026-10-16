import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from 'fastify';
import cookie from '@fastify/cookie';
import fastifyStatic from '@fastify/static';
import { existsSync } from 'node:fs';
import {
  COLLECTIONS, COLLECTION_META, JURISDICTION_CODES, PACKS, WORKSPACE_FIELDS, complianceReportMarkdown, compliance, migrateDataset, validateRecord,
  type AuditEntry, type CollectionName, type Dataset, type JurisdictionCode, type Workspace,
} from '@tenet/core';
import { Limiter, hashPassword, hashToken, newToken, verifyPassword } from './auth.js';
import { withOrg, type Db, type Tx } from './db.js';

export interface Options { db: Db; webDist?: string; secureCookies?: boolean; allowSignup?: () => Promise<boolean>; sessionDays?: number }
interface Me { userId: string; orgId: string; name: string; email: string; role: 'admin' | 'editor' | 'viewer'; orgName: string; orgMode: 'in-house' | 'advisory'; orgCreatedAt: string }
declare module 'fastify' { interface FastifyRequest { me?: Me } }

const COOKIE = 'tenet_session';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isCollection = (c: string): c is CollectionName => (COLLECTIONS as string[]).includes(c);

class HttpError extends Error { constructor(public status: number, message: string, public errors?: Record<string, string>) { super(message); } }

export async function buildApp(opts: Options): Promise<FastifyInstance> {
  const { db } = opts;
  const app = Fastify({ logger: process.env.NODE_ENV === 'test' ? false : { level: process.env.LOG_LEVEL ?? 'info', redact: ['req.headers.cookie', 'req.headers.authorization'] }, bodyLimit: 2 * 1024 * 1024 });
  await app.register(cookie);
  const loginLimiter = new Limiter(8, 15 * 60_000);
  const sessionDays = opts.sessionDays ?? 7;

  app.addHook('onSend', async (_req, reply) => {
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('Referrer-Policy', 'same-origin');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'");
  });

  app.setErrorHandler((err, _req, reply) => {
    if (err instanceof HttpError) return reply.status(err.status).send({ message: err.message, errors: err.errors });
    const code = (err as { code?: string }).code;
    // Row-level security refused the write: the row belongs to another organisation.
    if (code === '42501') return reply.status(404).send({ message: 'Not found.' });
    if (code === '23505') return reply.status(409).send({ message: 'That record already exists.' });
    if ((err as { statusCode?: number }).statusCode && (err as { statusCode: number }).statusCode < 500) return reply.status((err as { statusCode: number }).statusCode).send({ message: err.message });
    app.log.error(err);
    return reply.status(500).send({ message: 'Something went wrong on the server.' });
  });

  // ---------------------------------------------------------------- auth helpers
  async function startSession(reply: FastifyReply, userId: string) {
    const token = newToken();
    await db.query('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES ($1, $2, now() + make_interval(days => $3))', [hashToken(token), userId, sessionDays]);
    reply.setCookie(COOKIE, token, { path: '/', httpOnly: true, sameSite: 'lax', secure: opts.secureCookies ?? process.env.NODE_ENV === 'production', maxAge: sessionDays * 86400 });
  }

  async function auth(req: FastifyRequest) {
    const token = req.cookies[COOKIE];
    if (!token) throw new HttpError(401, 'Sign in to continue.');
    const r = await db.query(
      `SELECT u.id, u.org_id, u.name, u.email, u.role, o.name AS org_name, o.kind AS org_mode, o.created_at AS org_created FROM sessions s JOIN users u ON u.id = s.user_id JOIN orgs o ON o.id = u.org_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`, [hashToken(token)]);
    if (!r.rowCount) throw new HttpError(401, 'Your session has ended. Sign in again.');
    const u = r.rows[0];
    req.me = { userId: u.id, orgId: u.org_id, name: u.name, email: u.email, role: u.role, orgName: u.org_name, orgMode: u.org_mode, orgCreatedAt: new Date(u.org_created).toISOString() };
  }
  const canWrite = (req: FastifyRequest) => { if (req.me!.role === 'viewer') throw new HttpError(403, 'Your role can view but not change records.'); };
  const isAdmin = (req: FastifyRequest) => { if (req.me!.role !== 'admin') throw new HttpError(403, 'Only an administrator can do this.'); };

  async function audit(tx: Tx, me: Me, e: Omit<AuditEntry, 'id' | 'at' | 'actor'> & { workspaceId?: string }) {
    await tx.query('INSERT INTO audit_log (org_id, workspace_id, actor_id, actor_name, action, collection, record_id, summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
      [me.orgId, e.workspaceId ?? null, me.userId, me.name, e.action, e.collection, e.recordId ?? null, e.summary.slice(0, 500)]);
  }

  async function loadDataset(tx: Tx, id: string): Promise<Dataset | null> {
    const w = await tx.query('SELECT data FROM workspaces WHERE id = $1', [id]);
    if (!w.rowCount) return null;
    const recs = await tx.query('SELECT collection, data FROM records WHERE workspace_id = $1 ORDER BY updated_at DESC', [id]);
    const ds: Record<string, unknown> = { workspace: w.rows[0].data };
    for (const c of COLLECTIONS) ds[c] = [];
    for (const r of recs.rows) (ds[r.collection] as unknown[]).push(r.data);
    return migrateDataset(ds);
  }

  function cleanWorkspace(id: string, body: Record<string, unknown>, existing?: Workspace): Workspace {
    const v = validateRecord(WORKSPACE_FIELDS, body, ['sample']);
    const errors = { ...v.errors };
    const jxIn = (body.jx && typeof body.jx === 'object' ? body.jx : {}) as Record<string, Record<string, unknown>>;
    const jx: Workspace['jx'] = {};
    for (const code of JURISDICTION_CODES) {
      const raw = jxIn[code];
      if (!raw || typeof raw !== 'object') continue;
      // Validate selected jurisdictions; keep values of deselected ones unchanged so they come back if re-selected.
      if ((v.value.jurisdictions as JurisdictionCode[] | undefined)?.includes(code)) {
        const r = validateRecord(PACKS[code].profileFields, raw);
        Object.entries(r.errors).forEach(([k, e]) => { errors[`jx.${code}.${k}`] = e; });
        jx[code] = { ...raw, ...r.value };
      } else jx[code] = raw;
    }
    if (Object.keys(errors).length) throw new HttpError(400, 'Some fields need fixing.', errors);
    const now = new Date().toISOString();
    return { ...(v.value as unknown as Workspace), jx, id, createdAt: existing?.createdAt ?? now, updatedAt: now };
  }

  function cleanRecord(col: CollectionName, id: string, body: Record<string, unknown>, workspace: Workspace, existing?: Record<string, unknown>) {
    const v = validateRecord(COLLECTION_META[col].fields, body, COLLECTION_META[col].passthrough ?? [], { workspace });
    if (!v.ok) throw new HttpError(400, 'Some fields need fixing.', v.errors);
    const now = new Date().toISOString();
    return { ...v.value, id, createdAt: (existing?.createdAt as string) ?? now, updatedAt: now };
  }

  const param = (req: FastifyRequest, k: string) => {
    const v = (req.params as Record<string, string>)[k];
    if (!UUID.test(v)) throw new HttpError(404, 'Not found.');
    return v;
  };

  // ---------------------------------------------------------------- routes
  app.get('/api/health', async () => ({ ok: true }));

  app.post('/api/auth/signup', async (req, reply) => {
    const allowed = opts.allowSignup ? await opts.allowSignup() : true;
    if (!allowed) throw new HttpError(403, 'Sign-up is closed on this server. Ask an administrator to add you.');
    const b = (req.body ?? {}) as Record<string, string>;
    const errors: Record<string, string> = {};
    if (!b.orgName?.trim()) errors.orgName = 'Organisation name is required.';
    if (!b.name?.trim()) errors.name = 'Your name is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email ?? '')) errors.email = 'Enter a valid email address.';
    if ((b.password ?? '').length < 10) errors.password = 'Use at least 10 characters.';
    if (Object.keys(errors).length) throw new HttpError(400, Object.values(errors)[0], errors);
    const exists = await db.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [b.email]);
    if (exists.rowCount) throw new HttpError(409, 'An account with this email already exists. Sign in instead.');
    const mode = b.mode === 'advisory' ? 'advisory' : 'in-house';
    const org = await db.query('INSERT INTO orgs (name, kind) VALUES ($1, $2) RETURNING id', [b.orgName.trim(), mode]);
    const user = await db.query('INSERT INTO users (org_id, email, name, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [org.rows[0].id, b.email.trim(), b.name.trim(), await hashPassword(b.password), 'admin']);
    await startSession(reply, user.rows[0].id);
    return reply.status(201).send({ ok: true });
  });

  app.post('/api/auth/login', async (req, reply) => {
    const b = (req.body ?? {}) as Record<string, string>;
    const key = `${req.ip}|${(b.email ?? '').toLowerCase()}`;
    if (!loginLimiter.allow(key)) throw new HttpError(429, 'Too many attempts. Wait 15 minutes and try again.');
    const r = await db.query('SELECT id, password_hash FROM users WHERE lower(email) = lower($1)', [b.email ?? '']);
    const ok = r.rowCount ? await verifyPassword(b.password ?? '', r.rows[0].password_hash) : (await hashPassword('timing'), false);
    if (!ok) throw new HttpError(401, 'Email or password is incorrect.');
    loginLimiter.reset(key);
    await startSession(reply, r.rows[0].id);
    return { ok: true };
  });

  app.post('/api/auth/logout', async (req, reply) => {
    const t = req.cookies[COOKIE];
    if (t) await db.query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(t)]);
    reply.clearCookie(COOKIE, { path: '/' });
    return reply.status(204).send();
  });

  app.get('/api/me', async (req) => {
    await auth(req);
    const m = req.me!;
    return { user: { id: m.userId, name: m.name, email: m.email, role: m.role }, org: { id: m.orgId, name: m.orgName, mode: m.orgMode, createdAt: m.orgCreatedAt } };
  });

  app.patch('/api/org', async (req) => {
    await auth(req); isAdmin(req);
    const b = (req.body ?? {}) as { name?: string; mode?: string };
    if (b.mode !== undefined && b.mode !== 'in-house' && b.mode !== 'advisory') throw new HttpError(400, 'Mode must be in-house or advisory.');
    if (b.name !== undefined && !String(b.name).trim()) throw new HttpError(400, 'Name cannot be empty.');
    await db.query('UPDATE orgs SET name = coalesce($2, name), kind = coalesce($3, kind) WHERE id = $1', [req.me!.orgId, b.name?.trim() ?? null, b.mode ?? null]);
    return { ok: true };
  });

  // Users in my organisation
  app.get('/api/users', async (req) => {
    await auth(req);
    const r = await db.query('SELECT id, email, name, role, created_at FROM users WHERE org_id = $1 ORDER BY name', [req.me!.orgId]);
    return r.rows;
  });
  app.post('/api/users', async (req, reply) => {
    await auth(req); isAdmin(req);
    const b = (req.body ?? {}) as Record<string, string>;
    if (!['admin', 'editor', 'viewer'].includes(b.role)) throw new HttpError(400, 'Role must be admin, editor or viewer.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email ?? '') || !b.name?.trim() || (b.password ?? '').length < 10) throw new HttpError(400, 'Name, valid email and a password of at least 10 characters are required.');
    const exists = await db.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [b.email]);
    if (exists.rowCount) throw new HttpError(409, 'An account with this email already exists.');
    const r = await db.query('INSERT INTO users (org_id, email, name, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [req.me!.orgId, b.email.trim(), b.name.trim(), await hashPassword(b.password), b.role]);
    return reply.status(201).send({ id: r.rows[0].id });
  });

  // Workspaces (clients)
  app.get('/api/workspaces', async (req) => {
    await auth(req);
    return withOrg(db, req.me!.orgId, async (tx) => (await tx.query('SELECT data FROM workspaces ORDER BY data->>\'name\'')).rows.map((r) => r.data));
  });

  app.put('/api/workspaces/:id', async (req) => {
    await auth(req); canWrite(req);
    const id = param(req, 'id');
    return withOrg(db, req.me!.orgId, async (tx) => {
      const cur = await tx.query('SELECT data FROM workspaces WHERE id = $1', [id]);
      const w = cleanWorkspace(id, req.body as Record<string, unknown>, cur.rows[0]?.data);
      await tx.query(`INSERT INTO workspaces (id, org_id, data) VALUES ($1,$2,$3) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [id, req.me!.orgId, w]);
      const before = cur.rows[0]?.data as Workspace | undefined;
      const jxChanged = before && JSON.stringify(before.jurisdictions ?? []) !== JSON.stringify(w.jurisdictions);
      await audit(tx, req.me!, { workspaceId: id, action: before ? 'update' : 'create', collection: 'workspace', recordId: id, summary: !before ? `Created ${w.name}` : jxChanged ? `Changed laws in scope to ${w.jurisdictions.join(', ')}` : 'Updated entity settings' });
      return w;
    });
  });

  app.delete('/api/workspaces/:id', async (req, reply) => {
    await auth(req); isAdmin(req);
    const id = param(req, 'id');
    await withOrg(db, req.me!.orgId, async (tx) => {
      const r = await tx.query('DELETE FROM workspaces WHERE id = $1 RETURNING data->>\'name\' AS name', [id]);
      if (!r.rowCount) throw new HttpError(404, 'Not found.');
      await audit(tx, req.me!, { action: 'delete', collection: 'workspace', recordId: id, summary: `Removed ${r.rows[0].name}` });
    });
    return reply.status(204).send();
  });

  app.post('/api/workspaces/import', async (req, reply) => {
    await auth(req); canWrite(req);
    const ds = req.body as Dataset;
    if (!ds?.workspace) throw new HttpError(400, 'Expected a dataset with a workspace.');
    const id = ds.workspace.id && UUID.test(ds.workspace.id) ? ds.workspace.id : crypto.randomUUID();
    await withOrg(db, req.me!.orgId, async (tx) => {
      const w = cleanWorkspace(id, ds.workspace as unknown as Record<string, unknown>);
      await tx.query('INSERT INTO workspaces (id, org_id, data) VALUES ($1,$2,$3)', [id, req.me!.orgId, w]);
      for (const col of COLLECTIONS) {
        for (const r of ((ds as unknown as Record<string, Record<string, unknown>[]>)[col] ?? [])) {
          const rid = typeof r.id === 'string' && UUID.test(r.id) ? r.id : crypto.randomUUID();
          await tx.query('INSERT INTO records (id, workspace_id, org_id, collection, data) VALUES ($1,$2,$3,$4,$5)', [rid, id, req.me!.orgId, col, cleanRecord(col, rid, r, w)]);
        }
      }
      await audit(tx, req.me!, { workspaceId: id, action: 'create', collection: 'workspace', recordId: id, summary: `Imported ${w.name}` });
    });
    return reply.status(201).send({ id });
  });

  app.get('/api/workspaces/:id/dataset', async (req) => {
    await auth(req);
    const id = param(req, 'id');
    const ds = await withOrg(db, req.me!.orgId, (tx) => loadDataset(tx, id));
    if (!ds) throw new HttpError(404, 'Not found.');
    return ds;
  });

  /** Compliance per selected jurisdiction, for integrations and dashboards. */
  app.get('/api/workspaces/:id/compliance', async (req) => {
    await auth(req);
    const id = param(req, 'id');
    const ds = await withOrg(db, req.me!.orgId, (tx) => loadDataset(tx, id));
    if (!ds) throw new HttpError(404, 'Not found.');
    return compliance(ds);
  });

  /** Report for one jurisdiction (for Nigeria, the NDPC audit-return preparation pack). */
  app.get('/api/workspaces/:id/report/:code', async (req, reply) => {
    await auth(req);
    const id = param(req, 'id');
    const code = String((req.params as Record<string, string>).code).toUpperCase() as JurisdictionCode;
    if (!JURISDICTION_CODES.includes(code)) throw new HttpError(404, 'Unknown jurisdiction.');
    const md = await withOrg(db, req.me!.orgId, async (tx) => {
      const ds = await loadDataset(tx, id);
      if (!ds) throw new HttpError(404, 'Not found.');
      if (!ds.workspace.jurisdictions.includes(code)) throw new HttpError(400, `${PACKS[code].name} is not selected for this entity.`);
      await audit(tx, req.me!, { workspaceId: id, action: 'generate-pack', collection: 'workspace', summary: `Generated ${PACKS[code].shortLaw} report` });
      return complianceReportMarkdown(ds, code, { preparedBy: `${req.me!.name}, ${req.me!.orgName}` });
    });
    return reply.type('text/markdown; charset=utf-8').send(md);
  });

  app.get('/api/workspaces/:id/audit', async (req) => {
    await auth(req);
    const id = param(req, 'id');
    return withOrg(db, req.me!.orgId, async (tx) =>
      (await tx.query('SELECT id, at, actor_name AS actor, action, collection, record_id AS "recordId", summary FROM audit_log WHERE workspace_id = $1 ORDER BY at DESC LIMIT 500', [id]))
        .rows.map((r) => ({ ...r, at: new Date(r.at).toISOString() })));
  });

  app.post('/api/workspaces/:id/audit', async (req, reply) => {
    await auth(req);
    const id = param(req, 'id');
    const b = (req.body ?? {}) as { action?: string; summary?: string };
    if ((b.action !== 'generate-pack' && b.action !== 'export') || !b.summary) throw new HttpError(400, 'Only export events can be logged by the client.');
    await withOrg(db, req.me!.orgId, async (tx) => {
      if (!(await tx.query('SELECT 1 FROM workspaces WHERE id = $1', [id])).rowCount) throw new HttpError(404, 'Not found.');
      await audit(tx, req.me!, { workspaceId: id, action: b.action as 'export', collection: 'export', summary: String(b.summary).slice(0, 300) });
    });
    return reply.status(204).send();
  });

  app.put('/api/workspaces/:id/:collection/:rid', async (req) => {
    await auth(req); canWrite(req);
    const id = param(req, 'id'); const rid = param(req, 'rid');
    const col = (req.params as Record<string, string>).collection;
    if (!isCollection(col)) throw new HttpError(404, 'Not found.');
    return withOrg(db, req.me!.orgId, async (tx) => {
      const ws = await tx.query('SELECT data FROM workspaces WHERE id = $1', [id]);
      if (!ws.rowCount) throw new HttpError(404, 'Not found.');
      const cur = await tx.query('SELECT data FROM records WHERE workspace_id = $1 AND collection = $2 AND id = $3', [id, col, rid]);
      const rec = cleanRecord(col, rid, req.body as Record<string, unknown>, migrateDataset({ workspace: ws.rows[0].data }).workspace, cur.rows[0]?.data);
      await tx.query(`INSERT INTO records (id, workspace_id, org_id, collection, data) VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (workspace_id, collection, id) DO UPDATE SET data = EXCLUDED.data, updated_at = now()`, [rid, id, req.me!.orgId, col, rec]);
      const title = String((rec as Record<string, unknown>)[COLLECTION_META[col].titleKey] ?? '');
      await audit(tx, req.me!, { workspaceId: id, action: cur.rowCount ? 'update' : 'create', collection: col, recordId: rid, summary: `${cur.rowCount ? 'Updated' : 'Added'} ${COLLECTION_META[col].singular}: ${title}` });
      return rec;
    });
  });

  app.delete('/api/workspaces/:id/:collection/:rid', async (req, reply) => {
    await auth(req); canWrite(req);
    const id = param(req, 'id'); const rid = param(req, 'rid');
    const col = (req.params as Record<string, string>).collection;
    if (!isCollection(col)) throw new HttpError(404, 'Not found.');
    await withOrg(db, req.me!.orgId, async (tx) => {
      const r = await tx.query('DELETE FROM records WHERE workspace_id = $1 AND collection = $2 AND id = $3 RETURNING data', [id, col, rid]);
      if (!r.rowCount) throw new HttpError(404, 'Not found.');
      await audit(tx, req.me!, { workspaceId: id, action: 'delete', collection: col, recordId: rid, summary: `Deleted ${COLLECTION_META[col].singular}: ${String(r.rows[0].data[COLLECTION_META[col].titleKey] ?? '')}` });
    });
    return reply.status(204).send();
  });

  app.setNotFoundHandler((req, reply) => {
    if (req.url.startsWith('/api/')) return reply.status(404).send({ message: 'Not found.' });
    if (opts.webDist && existsSync(opts.webDist)) return reply.sendFile('index.html');
    return reply.status(404).send({ message: 'Not found.' });
  });

  if (opts.webDist && existsSync(opts.webDist)) await app.register(fastifyStatic, { root: opts.webDist, prefix: '/' });
  return app;
}
