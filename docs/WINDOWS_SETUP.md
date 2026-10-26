# Windows and Expo Go

## First run

1. Install [Node.js 24 LTS](https://nodejs.org/en/download). Include npm and the PATH option. Open a **new** PowerShell window afterward.
2. Extract `roblox-dev-companion.zip` with Windows **Extract All**. A short path such as `C:\Dev\roblox-dev-companion` avoids long path problems. Open the folder containing `package.json` and `App.tsx`; do not work inside the ZIP viewer.
3. Click the folder address bar, type `powershell`, and press Enter.
4. Check Node and install the exact locked packages:

```powershell
node --version
npm.cmd --version
npm.cmd ci
```

5. Verify the included tests, then start the development server:

```powershell
npm.cmd test
npm.cmd run typecheck
npm.cmd start
```

6. Install [Expo Go](https://expo.dev/go) on iPhone or Android. The project targets SDK 57. Keep your phone and computer on the same private Wi-Fi. Allow Node through Windows Firewall on private networks if prompted.
7. Scan the terminal QR code: use the Camera app on iPhone and open the Expo Go link; use Expo Go's scan option on Android. Follow any account prompts required by your installed Expo Go version. You do not need Apple or Google developer program membership just to try this in Expo Go.
8. Keep PowerShell and the development server open. Press `Ctrl+C` when done. Next time, run `npm.cmd start` in the same folder; you do not need to reinstall packages.

Expo's [project setup guide](https://docs.expo.dev/get-started/create-a-project/) currently recommends SDK 57 for a physical device during the SDK 58 transition (checked October 26, 2026). Expo Go supports specific SDKs; this recommendation will change. If an App Store version has moved on, follow [Expo's SDK mismatch instructions](https://docs.expo.dev/troubleshooting/sdk-version-mismatch/) and use a compatible Go build where available or make a development/preview build. Do not blindly update just `expo` without aligning React Native and native modules.

## Try the main flows

- **Ideas:** choose Obby → Two weeks → Generate idea → Start a project. A project and four tasks appear.
- **Projects:** complete a task, edit notes, press Save project details. Reload and reopen the project. Create a manual project and add your own tasks.
- **Balance:** base XP 100, growth 1.5, target level 4 → Calculate curve. Total is 475 XP. Upgrade cost 50, growth 2, purchases 3, income 25 gives 350 coins and 14 minutes.
- **Scripts:** open XP curve module or Session leaderstats, read Where it goes, then Copy code. On a computer, paste it into the correct script type in Roblox Studio. Share .luau lets you move a source file from your phone.
- **Backups:** in Projects, export a backup using Files/Drive/another share target of your choice. Import checks a backup before asking to replace your current workspace. Devices do not sync automatically.

## Browser preview on Windows

```powershell
npm.cmd run web
```

Open the localhost URL printed in the terminal. This runs the same React Native UI through React Native Web. Browser data is separate from your phone's saved data. For a production-style local browser preview:

```powershell
npm.cmd run build:web
node scripts/serve-web.mjs
```

Open `http://127.0.0.1:4173`. This local static preview has no service worker; the browser page must first be loaded from the server. The installed native build bundles the code and templates for offline use. Expo Go initially loads the project from Metro; keep the PC available during development.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `npm.ps1 cannot be loaded` | Use `npm.cmd` / `npx.cmd` as shown. No execution policy change is needed. |
| `node` is not recognized | Reopen PowerShell after installing Node, or reinstall with PATH enabled. |
| Phone cannot connect | Use the same Wi-Fi, disable VPN temporarily, check Windows private-network firewall permission, avoid guest Wi-Fi isolation. |
| LAN is blocked | Stop Metro; run `npx.cmd expo start --go --tunnel`. The CLI may request its tunnel helper; tunneling needs internet and may be slow. |
| SDK mismatch | Match Expo Go to SDK 57 where supported or follow the development-build route. See official mismatch guide above. |
| Stale screen after edits | Stop Metro, then run `npx.cmd expo start --go --clear`. |
| Port in use | Stop the other development server or run `npx.cmd expo start --go --port 8082`. |
| App says “Not saved” | Retry save, export/copy a backup before closing, and free device storage. Do not uninstall to fix this before backing up. |
| Recovery screen | Retry loading; export stored data before choosing Start fresh. Reset replaces the stored copy only after confirmation. |
| Sharing target unavailable | Use Copy code / Copy backup and paste into a trusted destination. |

An iOS simulator runs on macOS with Xcode. Windows can run Expo Go on a physical iPhone and use EAS cloud builds for signed iOS binaries. Android emulators require Android Studio; no emulator is needed for the phone instructions above.
