import { resolve } from 'node:path';
import { buildApp } from './app.js';
import { createPool, migrate } from './db.js';

const db = createPool();

// Tenant isolation relies on row-level security, which superusers and BYPASSRLS roles skip.
const role = (await db.query('SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user')).rows[0];
if (role?.rolsuper || role?.rolbypassrls) {
  const msg = 'The database role bypasses row-level security, so organisations would not be isolated. Connect as a role created with NOSUPERUSER NOBYPASSRLS (see deploy/init-db.sh).';
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_RLS_BYPASS !== 'true') { console.error(msg); process.exit(1); }
  console.warn(`WARNING: ${msg}`);
}

const applied = await migrate(db);
if (applied.length) console.log('Applied migrations:', applied.join(', '));

const signup = (process.env.ALLOW_SIGNUP ?? 'first-run').toLowerCase();
const app = await buildApp({
  db,
  webDist: process.env.WEB_DIST ? resolve(process.env.WEB_DIST) : undefined,
  // 'true': anyone can create an organisation; 'first-run' (default): only until the first one exists; 'false': closed.
  allowSignup: async () => signup === 'true' || (signup === 'first-run' && !(await db.query('SELECT 1 FROM orgs LIMIT 1')).rowCount),
});

const port = Number(process.env.PORT ?? 4000);
await app.listen({ port, host: process.env.HOST ?? '0.0.0.0' });

for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, async () => { await app.close(); await db.end(); process.exit(0); });
