// Create a demo organisation and user with the sample client. For local development only.
import { COLLECTIONS, sampleDataset } from '@tenet/core';
import { hashPassword } from './auth.js';
import { createPool, migrate, withOrg } from './db.js';

const db = createPool();
await migrate(db);
const email = process.env.SEED_EMAIL ?? 'demo@tenet.local';
const password = process.env.SEED_PASSWORD ?? 'demo-password-123';
const existing = await db.query('SELECT org_id FROM users WHERE lower(email) = lower($1)', [email]);
let orgId: string; let userId: string;
if (existing.rowCount) { orgId = existing.rows[0].org_id; userId = (await db.query('SELECT id FROM users WHERE lower(email) = lower($1)', [email])).rows[0].id; }
else {
  orgId = (await db.query("INSERT INTO orgs (name, kind) VALUES ('Demo DPCO', 'advisory') RETURNING id")).rows[0].id;
  userId = (await db.query('INSERT INTO users (org_id, email, name, password_hash, role) VALUES ($1,$2,$3,$4,$5) RETURNING id', [orgId, email, 'Demo Admin', await hashPassword(password), 'admin'])).rows[0].id;
}
const ds = sampleDataset();
await withOrg(db, orgId, async (tx) => {
  await tx.query('INSERT INTO workspaces (id, org_id, data) VALUES ($1,$2,$3)', [ds.workspace.id, orgId, ds.workspace]);
  await tx.query('INSERT INTO audit_log (org_id, workspace_id, actor_id, actor_name, action, collection, record_id, summary) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)',
    [orgId, ds.workspace.id, userId, 'Demo Admin', 'create', 'workspace', ds.workspace.id, `Imported ${ds.workspace.name}`]);
  for (const c of COLLECTIONS) for (const r of (ds as unknown as Record<string, { id: string }[]>)[c]) {
    await tx.query('INSERT INTO records (id, workspace_id, org_id, collection, data) VALUES ($1,$2,$3,$4,$5)', [r.id, ds.workspace.id, orgId, c, r]);
  }
});
console.log(`Seeded sample client. Sign in as ${email} / ${password}`);
await db.end();
