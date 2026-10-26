import test from 'node:test';
import assert from 'node:assert/strict';
import { createAccountServer } from '../server/app';
import { createProject } from '../src/core/projects';
import { mkdir, mkdtemp } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('accounts authenticate, isolate projects, reject stale changes and revoke sessions', async () => {
  const app = createAccountServer({ database: ':memory:', origins: ['http://localhost:4173'] });
  await new Promise<void>(r => app.server.listen(0, '127.0.0.1', r));
  const address = app.server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  const request = async (path: string, method = 'GET', data?: unknown, token?: string, extra = {}) => {
    const response = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'native', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...extra }, ...(data === undefined ? {} : { body: JSON.stringify(data) }) });
    return { status: response.status, body: await response.json() as any, headers: response.headers };
  };
  try {
    assert.equal((await request('/v1/workspace')).status, 401);
    assert.equal((await request('/v1/auth/signup', 'POST', { email: 'a@example.test', password: 'short' })).status, 400);
    const a = await request('/v1/auth/signup', 'POST', { email: 'A@example.test', password: 'a-long-test-password' });
    assert.equal(a.status, 201); assert.equal(a.body.user.email, 'a@example.test'); assert.ok(a.body.token);
    assert.equal((await request('/v1/auth/signup', 'POST', { email: 'a@example.test', password: 'another-long-password' })).status, 409);
    const b = await request('/v1/auth/signup', 'POST', { email: 'b@example.test', password: 'another-long-password' });
    const workspace = { version: 1, projects: [createProject('Shared build', 'Obby')] };
    assert.equal((await request('/v1/workspace', 'PUT', { workspace, baseRevision: 0 }, a.body.token)).body.revision, 1);
    assert.equal((await request('/v1/workspace', 'GET', undefined, b.body.token)).body.workspace.projects.length, 0);
    assert.equal((await request('/v1/workspace', 'PUT', { workspace: { version: 1, projects: [] }, baseRevision: 0 }, a.body.token)).status, 409);
    assert.equal((await request('/v1/workspace', 'GET', undefined, a.body.token)).body.workspace.projects[0].title, 'Shared build');
    assert.equal((await request('/v1/workspace', 'PUT', { workspace: { version: 1, projects: [{ bad: true }] }, baseRevision: 1 }, a.body.token)).status, 400);
    assert.equal((await request('/v1/auth/login', 'POST', { email: 'a@example.test', password: 'wrong-test-password' })).status, 401);
    const login = await request('/v1/auth/login', 'POST', { email: 'a@example.test', password: 'a-long-test-password' });
    assert.equal(login.status, 200);
    assert.equal((await request('/v1/auth/logout', 'POST', {}, login.body.token)).status, 200);
    assert.equal((await request('/v1/me', 'GET', undefined, login.body.token)).status, 401);
    assert.equal((await request('/v1/auth/delete', 'POST', { password: 'wrong-test-password' }, a.body.token)).status, 401);
    assert.equal((await request('/v1/auth/delete', 'POST', { password: 'a-long-test-password' }, a.body.token)).status, 200);
    assert.equal((await request('/v1/me', 'GET', undefined, a.body.token)).status, 401);
  } finally { await app.close(); }
});

test('accounts persist across restart, secrets are hashed, and expired sessions cannot sync', async () => {
  await mkdir(resolve('test-results'), { recursive: true });
  const folder = await mkdtemp(join(resolve('test-results'), 'accounts-'));
  const database = join(folder, 'test.sqlite'); let clock = Date.now();
  const options = { database, origins: ['https://app.example.test'], secureCookies: true, sessionMs: 1000, now: () => clock };
  let app = createAccountServer(options);
  async function listen() {
    await new Promise<void>(r => app.server.listen(0, '127.0.0.1', r));
    const address = app.server.address(); assert.ok(address && typeof address !== 'string'); return `http://127.0.0.1:${address.port}`;
  }
  let base = await listen();
  const response = await fetch(base + '/v1/auth/signup', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Client-Type': 'native' }, body: JSON.stringify({ email: 'persist@example.test', password: 'a-long-test-password' }) });
  const result = await response.json() as any; assert.equal(response.status, 201);
  await app.close();
  const inspection = new DatabaseSync(database);
  const row = inspection.prepare('SELECT hash,salt FROM users').get() as { hash: string; salt: string };
  assert.equal(row.hash.length, 128); assert.equal(row.salt.length, 32); assert.notEqual(row.hash, 'a-long-test-password');
  const session = inspection.prepare('SELECT hash FROM sessions').get() as { hash: string }; assert.notEqual(session.hash, result.token);
  inspection.close(); app = createAccountServer(options); base = await listen();
  try {
    assert.equal((await fetch(base + '/v1/me', { headers: { Authorization: `Bearer ${result.token}` } })).status, 200);
    clock += 1001;
    assert.equal((await fetch(base + '/v1/workspace', { headers: { Authorization: `Bearer ${result.token}` } })).status, 401);
    const browser = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://app.example.test' }, body: JSON.stringify({ email: 'persist@example.test', password: 'a-long-test-password' }) });
    assert.match(browser.headers.get('set-cookie')!, /; Secure/);
  } finally { await app.close(); }
});

test('browser cookies are HttpOnly and unsafe cookie requests require a trusted origin', async () => {
  const app = createAccountServer({ database: ':memory:', origins: ['http://localhost:4173'], authLimit: 3 });
  await new Promise<void>(r => app.server.listen(0, '127.0.0.1', r));
  const address = app.server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const signup = await fetch(base + '/v1/auth/signup', { method: 'POST', headers: { Origin: 'http://localhost:4173', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'web@example.test', password: 'a-long-test-password' }) });
    assert.equal(signup.status, 201);
    const body = await signup.json() as any; assert.equal(body.token, undefined);
    const cookie = signup.headers.get('set-cookie')!;
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Strict/);
    for (const origin of [undefined, 'http://evil.example']) {
      const response = await fetch(base + '/v1/auth/logout', { method: 'POST', headers: { Cookie: cookie.split(';')[0]!, 'Content-Type': 'application/json', ...(origin ? { Origin: origin } : {}) }, body: '{}' });
      assert.equal(response.status, 403);
    }
    const noJson = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { Origin: 'http://localhost:4173' }, body: '{}' });
    assert.equal(noJson.status, 415);
    const oversized = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { Origin: 'http://localhost:4173', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'web@example.test', password: 'x'.repeat(5000) }) });
    assert.equal(oversized.status, 413);
    for (let i = 0; i < 4; i++) {
      const response = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { Origin: 'http://localhost:4173', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'web@example.test', password: 'wrong-test-password' }) });
      if (i === 3) assert.equal(response.status, 429);
    }
  } finally { await app.close(); }
});
