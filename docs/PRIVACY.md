# Data and privacy

This describes the supplied source build. Provide the actual publisher, support contact, hosting, retention policy and store disclosures before a public launch.

- Guest projects and theme preferences are stored locally through AsyncStorage. Guest data is not uploaded. Backups contain names, notes, phases, tasks, completion values and timestamps.
- Optional companion accounts send an email and password to the configured API. SQLite stores email, salted scrypt password hashes, hashed session tokens/expiry and synced workspace snapshots. No plaintext passwords are stored. No Roblox password, cookie or API key is requested.
- Browser sessions use HttpOnly cookies; native sessions use SecureStore. Device project caches and the server database are not encrypted secrets vaults. Restrict database access and configure disk encryption/backups when hosting. Do not put secrets in project notes or shared code.
- Signed-in projects sync to your configured server. Separate account caches remain after sign-out. A cold offline launch requires reconnecting to reopen an account. Theme and transient tool inputs do not sync.
- Account deletion removes the server account, sessions and workspace and clears this device's cache. Other devices, operator backups, exported files and clipboard copies may retain data. Signed-in project deletion syncs too. Export before overwriting or deleting.
- Authentication throttling stores short-lived hashed rate-limit keys and counters, cleaned during later requests. No analytics, ads, billing SDK or automatic messages are included.
- Copy actions write selected text to the clipboard. File import/export/share uses destinations chosen by the user, whose handling applies. Native exports create cache files. No clipboard is read automatically.
- Uninstalling or clearing app/site data may remove guest projects and unsynced account changes. The server restores only successfully synced changes. Keep exported backups.
- Expo development tools and downloads have their own networking. Public hosting, email verification/recovery, store publication and payments are not configured.
- Optional DevEx/stat requests go to your configured service, which retrieves official public Roblox information. Public game IDs and timestamped metric snapshots are stored on that server independently of companion accounts. Its retained public history is shared and is not erased by deleting an account. The service does not forward your session or Roblox credentials to Roblox. Hosting providers may collect ordinary access logs; configure their retention before deployment.
- Image previews and pasted script/listing/update drafts stay in app memory and are not uploaded. Choosing an image reads it locally. Public-data helpers do not require Roblox login, cookies or API keys. Server-side public fetches use fixed Roblox URLs and accept numeric IDs only.
