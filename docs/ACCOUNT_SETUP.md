# Accounts and sync setup

This is a real self-hosted API supplied as source, not a public hosted service. It requires Node 24. Companion accounts are separate from Roblox. No Roblox credentials are requested. Email verification and password recovery are not implemented; use test accounts until deployment checks are completed.

## Windows browser

After `npm.cmd ci`, run `npm.cmd run server` in one PowerShell window. In another, run `npm.cmd run build:web`, then `npm.cmd run preview`. Open `http://127.0.0.1:4173`. Tap the person icon, choose Create account, and use an email plus a new 12–128-character password. A private browser window can sign into the same account to test sync.

Each account starts empty. Copy guest projects explicitly from its account screen. Guest originals remain. The server database is `server/data/accounts.sqlite`; it survives restarts and is excluded from archives. Stop the API before backing up the database, retaining any remaining SQLite WAL files. Never share or commit the database.

## Expo Go on a phone

Find the PC's private IPv4 address using `ipconfig`. On the same trusted Wi-Fi, start the API:

```powershell
$env:HOST = '0.0.0.0'
npm.cmd run server
```

In the Expo window, replace the example PC address:

```powershell
$env:EXPO_PUBLIC_API_URL = 'http://192.168.1.20:4174'
npm.cmd start
```

Allow Node on private networks in Windows Firewall if needed, then scan the QR code. Local HTTP is for trusted development networks only. Metro tunnel mode does not tunnel this API; use an HTTPS API for that setup.

## Sync and deletion

Changes upload after a short delay; polling runs every 30 seconds and on returning to the app. Sync projects refreshes immediately. Projects, tasks, notes and phase sync. Device preferences do not. Offline edits persist in account-specific caches. If both devices change a workspace before syncing, Keep device copy / Use cloud copy chooses a whole workspace, including deletions; export a backup first. There is no automatic merge.

Sign-out revokes the session and returns to guest data. Account caches remain for the next sign-in. A cold offline launch requires reconnecting to reopen an account. Expired sessions keep cached changes: sign out and sign in to reconnect. Account deletion requires the password, removes server data and all sessions, and clears this device's account cache. Other device caches, exported files and operator backups may remain.

## Internet hosting

Use an HTTPS reverse proxy and persistent restricted database storage. Set `NODE_ENV=production`, `HOST`, `PORT`, `DB_PATH`, and explicit comma-separated HTTPS `ALLOWED_ORIGINS`. Default binding is loopback. Browser requests reject unknown origins. For another local web port, add its exact origin.

Serve the web app and proxy `/v1` through one HTTPS origin to avoid cross-site cookie restrictions. Set `EXPO_PUBLIC_API_URL` to that origin before native builds. This public variable must never contain secrets. Browsers use HttpOnly/SameSite cookies (Secure in production); native sessions use SecureStore. Sessions expire after 30 days. The service hashes passwords and tokens and limits authentication attempts, body sizes and concurrent password work.

Before public signup, add email verification/recovery, operational monitoring, backups, abuse controls, final publisher/support/privacy details, real-device tests and a security review. There is no distributed rate limiter, email sender or public deployment configured.

Stop any API on port 4174 before `npm.cmd run test:e2e`. Playwright starts an isolated in-memory API and refuses to reuse an existing one, so tests cannot touch your real account database.

The same service supplies `/v1/public/devex` and `/v1/public/stats` for creator tools without signing in. Public stats observations share the SQLite file but are separate from private workspaces; see [Creator tools](CREATOR_TOOLS.md). Proxy all `/v1` routes when hosting.
