import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createAccountServer } from './app';

const production = process.env.NODE_ENV === 'production';
const database = process.env.DB_PATH ?? resolve('server/data/accounts.sqlite');
if (database !== ':memory:') mkdirSync(dirname(database), { recursive: true });
const origins: string[] = String(process.env.ALLOWED_ORIGINS ?? 'http://127.0.0.1:4173,http://localhost:4173,http://localhost:8081,http://127.0.0.1:8081').split(',').map((s: string) => s.trim()).filter(Boolean);
if (production && (!process.env.ALLOWED_ORIGINS || origins.some(o => !o.startsWith('https://')))) throw new Error('Production requires explicit HTTPS ALLOWED_ORIGINS. Put this API behind an HTTPS reverse proxy.');
const port = Number(process.env.PORT ?? 4174);
const host = process.env.HOST ?? '127.0.0.1';
const app = createAccountServer({ database, origins, secureCookies: production });
app.server.listen(port, host, () => console.log(`Account service listening on ${host}:${port}. ${production ? 'HTTPS proxy required.' : 'Local development only.'}`));
for (const signal of ['SIGINT', 'SIGTERM'] as const) process.on(signal, () => { void app.close().then(() => process.exit(0)); });
