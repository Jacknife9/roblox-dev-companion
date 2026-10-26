import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { emptyWorkspace, parseBackup, serializeBackup } from '../src/storage/repository';
import { createRobloxData, PublicDataError } from './roblox';

type Options = { database: string; origins: string[]; secureCookies?: boolean; authLimit?: number; sessionMs?: number; now?: () => number };
type UserRow = { id: string; email: string; hash: string; salt: string };
type SnapshotRow = { data: string; revision: number };
class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
const object = (v: unknown): Record<string, unknown> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, 'Expected a JSON object.');
  return v as Record<string, unknown>;
};
async function json(req: IncomingMessage, maxBytes = 4_100_000) {
  if (req.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') throw new HttpError(415, 'Use application/json.');
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > maxBytes) { req.resume(); throw new HttpError(413, 'Request is too large.'); }
    chunks.push(chunk);
  }
  try { return object(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
  catch (e) { if (e instanceof HttpError) throw e; throw new HttpError(400, 'Invalid JSON.'); }
}
function credentials(body: Record<string, unknown>) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Enter a valid email address.');
  if (typeof body.password !== 'string' || body.password.length < 12 || body.password.length > 128) throw new HttpError(400, 'Use a password with 12 to 128 characters.');
  return { email, password: body.password };
}

export function createAccountServer(options: Options) {
  const db = new DatabaseSync(options.database);
  db.exec(`PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, hash TEXT NOT NULL, salt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS workspaces(user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, data TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS throttle(key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, until_ms INTEGER NOT NULL);`);
  const now = options.now ?? Date.now;
  const publicData = createRobloxData(db);
  let hashing = 0;
  async function hash(password: string, salt: string) {
    if (hashing >= 4) throw new HttpError(429, 'Server is busy. Try again shortly.');
    hashing++;
    try { return (await new Promise<Buffer>((resolve, reject) => scrypt(password, salt, 64, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)))).toString('hex'); }
    finally { hashing--; }
  }
  function throttle(key: string, limit: number) {
    const time = now();
    db.prepare('DELETE FROM throttle WHERE until_ms < ?').run(time);
    const id = digest(key);
    const row = db.prepare('SELECT attempts FROM throttle WHERE key=?').get(id) as { attempts: number } | undefined;
    if (row && row.attempts >= limit) throw new HttpError(429, 'Too many attempts. Try again in 15 minutes.');
    db.prepare('INSERT INTO throttle(key,attempts,until_ms) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1').run(id, time + 15 * 60_000);
  }
  function sessionToken(req: IncomingMessage) {
    const bearer = req.headers.authorization?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
    const cookie = req.headers.cookie?.match(/(?:^|;\s*)dc_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    return bearer ?? cookie;
  }
  function authenticate(req: IncomingMessage): UserRow {
    const token = sessionToken(req);
    const row = token ? db.prepare('SELECT users.* FROM users JOIN sessions ON sessions.user_id=users.id WHERE sessions.hash=? AND sessions.expires>?').get(digest(token), now()) as UserRow | undefined : undefined;
    if (!row) throw new HttpError(401, 'Sign in again to sync your projects. Your device copy is kept.');
    return row;
  }
  function cookie(res: ServerResponse, token: string, maxAge: number) {
    res.setHeader('Set-Cookie', `dc_session=${token}; HttpOnly; SameSite=Strict; Path=/v1; Max-Age=${maxAge}${options.secureCookies ? '; Secure' : ''}`);
  }
  function login(req: IncomingMessage, res: ServerResponse, user: UserRow) {
    db.prepare('DELETE FROM sessions WHERE expires<=?').run(now());
    const token = randomBytes(32).toString('hex');
    const ms = options.sessionMs ?? 30 * 86400_000;
    db.prepare('INSERT INTO sessions(hash,user_id,expires) VALUES(?,?,?)').run(digest(token), user.id, now() + ms);
    const result = { user: { id: user.id, email: user.email } };
    if (req.headers['x-client-type'] === 'native' && !req.headers.origin) return { ...result, token };
    cookie(res, token, Math.floor(ms / 1000)); return result;
  }
  function snapshot(userId: string) {
    const row = db.prepare('SELECT data,revision FROM workspaces WHERE user_id=?').get(userId) as SnapshotRow;
    return { workspace: parseBackup(row.data), revision: row.revision };
  }
  const server = createServer(async (req, res) => {
    function send(status: number, data: unknown) { res.writeHead(status); res.end(JSON.stringify(data)); }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (options.secureCookies) res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const origin = req.headers.origin;
      if (origin) {
        if (!options.origins.includes(origin)) throw new HttpError(403, 'This browser origin is not allowed.');
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Client-Type');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      }
      if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
      const path = req.url?.split('?')[0];
      if (req.method === 'GET' && path === '/health') { send(200, { ok: true }); return; }
      if (req.method === 'GET' && path?.startsWith('/v1/public/')) {
        throttle(`public:${req.socket.remoteAddress}`, 120);
        if (path === '/v1/public/devex') { send(200, await publicData.devex()); return; }
        if (path === '/v1/public/stats') { send(200, await publicData.getStats(new URL(req.url!, 'http://localhost').searchParams)); return; }
        throw new HttpError(404, 'Public tool not found.');
      }
      if (req.method === 'GET' && path === '/v1/session') {
        try { const user = authenticate(req); send(200, { user: { id: user.id, email: user.email } }); }
        catch (e) { if (e instanceof HttpError && e.status === 401) send(200, { user: null }); else throw e; }
        return;
      }
      const unsafe = req.method !== 'GET' && req.method !== 'HEAD';
      if (unsafe && !origin && !req.headers.authorization && (req.headers.cookie || req.headers['x-client-type'] !== 'native')) throw new HttpError(403, 'A trusted browser origin or native client is required.');
      if (req.method === 'POST' && (path === '/v1/auth/signup' || path === '/v1/auth/login')) {
        throttle(`ip:${req.socket.remoteAddress}`, options.authLimit ?? 60);
        const body = await json(req, 4096), { email, password } = credentials(body);
        throttle(`email:${email}`, options.authLimit ?? 15);
        let user = db.prepare('SELECT * FROM users WHERE email=?').get(email) as UserRow | undefined;
        if (path.endsWith('/signup')) {
          if (user) throw new HttpError(409, 'An account already uses this email. Try signing in.');
          const salt = randomBytes(16).toString('hex');
          const passwordHash = await hash(password, salt);
          user = { id: randomUUID(), email, hash: passwordHash, salt };
          try {
            db.exec('BEGIN');
            db.prepare('INSERT INTO users(id,email,hash,salt) VALUES(?,?,?,?)').run(user.id, user.email, user.hash, user.salt);
            db.prepare('INSERT INTO workspaces(user_id,data,revision) VALUES(?,?,0)').run(user.id, serializeBackup(emptyWorkspace()));
            db.exec('COMMIT');
          } catch { db.exec('ROLLBACK'); throw new HttpError(409, 'An account already uses this email. Try signing in.'); }
          send(201, login(req, res, user)); return;
        }
        // Unknown users also incur scrypt work so failed login timing is comparable.
        const candidate = await hash(password, user?.salt ?? '00000000000000000000000000000000');
        if (!user || !timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.hash, 'hex'))) throw new HttpError(401, 'Email or password is incorrect.');
        send(200, login(req, res, user)); return;
      }
      const user = authenticate(req);
      if (unsafe) throttle(`write:${user.id}`, 600);
      if (req.method === 'GET' && path === '/v1/me') { send(200, { user: { id: user.id, email: user.email } }); return; }
      if (req.method === 'POST' && path === '/v1/auth/logout') {
        await json(req, 2048);
        db.prepare('DELETE FROM sessions WHERE hash=?').run(digest(sessionToken(req)!));
        cookie(res, '', 0); send(200, { ok: true }); return;
      }
      if (req.method === 'POST' && path === '/v1/auth/delete') {
        throttle(`delete:${user.id}`, options.authLimit ?? 10);
        const body = await json(req, 4096);
        if (typeof body.password !== 'string' || body.password.length > 128) throw new HttpError(400, 'Enter your password.');
        const candidate = await hash(body.password, user.salt);
        if (!timingSafeEqual(Buffer.from(candidate, 'hex'), Buffer.from(user.hash, 'hex'))) throw new HttpError(401, 'Password is incorrect.');
        db.prepare('DELETE FROM users WHERE id=?').run(user.id);
        cookie(res, '', 0); send(200, { ok: true }); return;
      }
      if (req.method === 'GET' && path === '/v1/workspace') { send(200, snapshot(user.id)); return; }
      if (req.method === 'PUT' && path === '/v1/workspace') {
        const body = await json(req);
        if (!Number.isSafeInteger(body.baseRevision) || (body.baseRevision as number) < 0) throw new HttpError(400, 'Invalid workspace revision.');
        let data: string;
        try { data = serializeBackup(parseBackup(JSON.stringify(body.workspace))); }
        catch { throw new HttpError(400, 'Invalid workspace. Check your project backup.'); }
        const result = db.prepare('UPDATE workspaces SET data=?,revision=revision+1 WHERE user_id=? AND revision=?').run(data, user.id, body.baseRevision as number);
        if (result.changes === 0) { send(409, { error: 'Another device changed these projects. Choose which copy to keep.', ...snapshot(user.id) }); return; }
        send(200, snapshot(user.id)); return;
      }
      throw new HttpError(404, 'Route not found.');
    } catch (e) {
      if (!res.headersSent) send(e instanceof HttpError || e instanceof PublicDataError ? e.status : 500, { error: e instanceof HttpError || e instanceof PublicDataError ? e.message : 'The account service could not complete this request.' });
      else res.end();
    }
  });
  server.requestTimeout = 15_000; server.headersTimeout = 10_000; server.maxHeadersCount = 40;
  return { server, close: () => new Promise<void>((resolve, reject) => server.close(e => { db.close(); e ? reject(e) : resolve(); })) };
}
