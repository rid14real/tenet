// Integration tests against a real PostgreSQL. Set TEST_DATABASE_URL to a database owned by a
// non-superuser role (superusers bypass row-level security).
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { sampleDataset } from '@tenet/core';
import { buildApp } from '../src/app.js';
import { createPool, migrate, withOrg, type Db } from '../src/db.js';

const URL = process.env.TEST_DATABASE_URL;
const d = URL ? describe : describe.skip;

d('Tenet API', () => {
  let db: Db; let app: FastifyInstance;
  const cookies: Record<string, string> = {};

  const req = async (who: string | null, method: string, url: string, body?: unknown) => {
    const res = await app.inject({ method: method as 'GET', url, payload: body as object, headers: who && cookies[who] ? { cookie: cookies[who] } : {} });
    const set = res.headers['set-cookie'];
    if (who && set) cookies[who] = (Array.isArray(set) ? set[0] : set).split(';')[0];
    return res;
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    db = createPool(URL);
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await migrate(db);
    app = await buildApp({ db, secureCookies: false });
  });
  afterAll(async () => { await app?.close(); await db?.end(); });

  it('rejects unauthenticated access', async () => {
    expect((await req(null, 'GET', '/api/workspaces')).statusCode).toBe(401);
  });

  it('signs up two separate organisations', async () => {
    expect((await req('a', 'POST', '/api/auth/signup', { orgName: 'Alpha DPCO', name: 'Ada', email: 'ada@alpha.test', password: 'correct-horse-1' })).statusCode).toBe(201);
    expect((await req('b', 'POST', '/api/auth/signup', { orgName: 'Beta DPCO', name: 'Ben', email: 'ben@beta.test', password: 'correct-horse-2' })).statusCode).toBe(201);
    const me = await req('a', 'GET', '/api/me');
    expect(me.json().org.name).toBe('Alpha DPCO');
  });

  it('validates sign-up input and duplicate emails', async () => {
    expect((await req(null, 'POST', '/api/auth/signup', { orgName: 'X', name: 'Y', email: 'bad', password: 'short' })).statusCode).toBe(400);
    expect((await req(null, 'POST', '/api/auth/signup', { orgName: 'X', name: 'Y', email: 'ADA@alpha.test', password: 'correct-horse-9' })).statusCode).toBe(409);
  });

  const wsId = crypto.randomUUID();
  const recId = crypto.randomUUID();

  it('creates a client and records, computing readiness', async () => {
    const w = await req('a', 'PUT', `/api/workspaces/${wsId}`, { name: 'Client One', sector: 'bank', dataSubjects6m: 20000, cycleYear: 2026, jurisdictions: ['NG'] });
    expect(w.statusCode).toBe(200);
    const bad = await req('a', 'PUT', `/api/workspaces/${wsId}/vendors/${recId}`, { name: '', service: 'x', country: 'ZZ' });
    expect(bad.statusCode).toBe(400);
    expect(Object.keys(bad.json().errors)).toEqual(expect.arrayContaining(['name', 'country']));
    const ok = await req('a', 'PUT', `/api/workspaces/${wsId}/vendors/${recId}`, { name: 'Cloud Co', service: 'Hosting', country: 'US', dpaSigned: true, transferMechanism: 'none' });
    expect(ok.statusCode).toBe(200);
    const ds = (await req('a', 'GET', `/api/workspaces/${wsId}/dataset`)).json();
    expect(ds.vendors).toHaveLength(1);
    const ready = (await req('a', 'GET', `/api/workspaces/${wsId}/readiness`)).json();
    expect(ready.requirements.find((r: { id: string }) => r.id === 'transfers').status).toBe('missing');
  });

  it('isolates organisations with row-level security', async () => {
    expect((await req('b', 'GET', '/api/workspaces')).json()).toHaveLength(0);
    expect((await req('b', 'GET', `/api/workspaces/${wsId}/dataset`)).statusCode).toBe(404);
    // Beta cannot overwrite Alpha's client even knowing its id.
    const hijack = await req('b', 'PUT', `/api/workspaces/${wsId}`, { name: 'Hijacked', sector: 'other', dataSubjects6m: 1, cycleYear: 2026 });
    expect(hijack.statusCode).toBe(404);
    expect((await req('b', 'PUT', `/api/workspaces/${wsId}/vendors/${recId}`, { name: 'x', service: 'y', country: 'NG' })).statusCode).toBe(404);
    expect((await req('b', 'DELETE', `/api/workspaces/${wsId}`)).statusCode).toBe(404);
    const still = (await req('a', 'GET', `/api/workspaces/${wsId}/dataset`)).json();
    expect(still.workspace.name).toBe('Client One');
  });

  it('enforces isolation in the database itself', async () => {
    const c = await db.connect();
    try {
      await c.query('BEGIN');
      expect((await c.query('SELECT count(*)::int AS n FROM workspaces')).rows[0].n).toBe(0); // no org set: nothing visible
      await c.query('ROLLBACK');
    } finally { c.release(); }
  });

  it('keeps an append-only audit trail', async () => {
    const log = (await req('a', 'GET', `/api/workspaces/${wsId}/audit`)).json();
    expect(log.map((e: { summary: string }) => e.summary)).toEqual(expect.arrayContaining(['Created client Client One', 'Added vendor: Cloud Co']));
    const org = (await db.query("SELECT org_id FROM users WHERE email = 'ada@alpha.test'")).rows[0].org_id;
    // Even inside Alpha's own scope, history cannot be edited or deleted.
    await expect(withOrg(db, org, (tx) => tx.query("UPDATE audit_log SET summary = 'tampered'"))).rejects.toThrow(/append-only/);
    await expect(withOrg(db, org, (tx) => tx.query('DELETE FROM audit_log'))).rejects.toThrow(/append-only/);
  });

  it('restricts viewers to reading', async () => {
    expect((await req('a', 'POST', '/api/users', { email: 'vic@alpha.test', name: 'Vic', role: 'viewer', password: 'viewer-pass-1' })).statusCode).toBe(201);
    expect((await req('v', 'POST', '/api/auth/login', { email: 'vic@alpha.test', password: 'viewer-pass-1' })).statusCode).toBe(200);
    expect((await req('v', 'GET', `/api/workspaces/${wsId}/dataset`)).statusCode).toBe(200);
    expect((await req('v', 'PUT', `/api/workspaces/${wsId}/vendors/${recId}`, { name: 'x', service: 'y', country: 'NG' })).statusCode).toBe(403);
    expect((await req('v', 'POST', '/api/users', { email: 'z@alpha.test', name: 'Z', role: 'admin', password: 'zzzzzzzzzz1' })).statusCode).toBe(403);
  });

  it('imports the sample client and produces a filing pack', async () => {
    const ds = sampleDataset();
    const r = await req('a', 'POST', '/api/workspaces/import', ds);
    expect(r.statusCode).toBe(201);
    const pack = await req('a', 'GET', `/api/workspaces/${r.json().id}/filing-pack`);
    expect(pack.headers['content-type']).toContain('text/markdown');
    expect(pack.body).toContain('Kestrel Microfinance Bank (sample)');
    expect(pack.body).toContain('Ada, Alpha DPCO');
  });

  it('rate-limits repeated failed logins', async () => {
    let last = 0;
    for (let i = 0; i < 10; i++) last = (await req(null, 'POST', '/api/auth/login', { email: 'ada@alpha.test', password: 'wrong-password' })).statusCode;
    expect(last).toBe(429);
  });

  it('signs out', async () => {
    expect((await req('a', 'POST', '/api/auth/logout')).statusCode).toBe(204);
    cookies.a = '';
    expect((await req('a', 'GET', '/api/me')).statusCode).toBe(401);
  });
});
