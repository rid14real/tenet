// Create a demo organisation and user with the sample client. For local development only.
import { COLLECTIONS, sampleDataset } from '@tenet/core';
import { hashPassword } from './auth.js';
import { createPool, migrate, withOrg } from './db.js';

const db = createPool();
await migrate(db);
const email = process.env.SEED_EMAIL ?? 'demo@tenet.local';
const password = process.env.SEED_PASSWORD ?? 'demo-password-123';
const existing = await db.query('SELECT org_id FROM users WHERE lower(email) = lower($1)', [email]);
let orgId: string;
if (existing.rowCount) orgId = existing.rows[0].org_id;
else {
  orgId = (await db.query("INSERT INTO orgs (name) VALUES ('Demo DPCO') RETURNING id")).rows[0].id;
  await db.query('INSERT INTO users (org_id, email, name, password_hash, role) VALUES ($1,$2,$3,$4,$5)', [orgId, email, 'Demo Admin', await hashPassword(password), 'admin']);
}
const ds = sampleDataset();
await withOrg(db, orgId, async (tx) => {
  await tx.query('INSERT INTO workspaces (id, org_id, data) VALUES ($1,$2,$3)', [ds.workspace.id, orgId, ds.workspace]);
  for (const c of COLLECTIONS) for (const r of (ds as unknown as Record<string, { id: string }[]>)[c]) {
    await tx.query('INSERT INTO records (id, workspace_id, org_id, collection, data) VALUES ($1,$2,$3,$4,$5)', [r.id, ds.workspace.id, orgId, c, r]);
  }
});
console.log(`Seeded sample client. Sign in as ${email} / ${password}`);
await db.end();
