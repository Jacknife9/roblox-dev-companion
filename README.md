# Roblox Dev Companion

A working Expo / React Native MVP for iPhone, Android, and a browser. Version 0.2.0. All features in this source build are free. It is an independent, unofficial tool for people building Roblox experiences.

**Start here on Windows:** install Node.js 24 LTS, extract the ZIP, open PowerShell in the extracted `roblox-dev-companion` folder, then run:

```powershell
npm.cmd ci
npm.cmd test
npm.cmd start
```

Install Expo Go on your phone. Keep the PC and phone on the same Wi-Fi. Scan the terminal QR code with the iPhone Camera or Expo Go on Android. Keep the terminal running. See [Windows and Expo Go setup](docs/WINDOWS_SETUP.md) for exact steps and troubleshooting.

## What works

| Tool | Included behavior |
|---|---|
| Ideas | Six genres, solo/team and build-window filters, curated combinations, a game loop, progression hook, scope advice, save-to-project with starter tasks |
| Balance | XP curves with cumulative rounded requirements, upgrade costs and earning time, coin faucet/sink model, input limits and errors |
| Projects | Create/edit/delete projects, notes, phase, task add/edit/complete/delete, progress, device persistence |
| Backups | Export/share or copy JSON, import file or pasted JSON, validation, explicit replacement confirmation, save errors and recovery |
| Accounts | Optional email/password signup, login/logout, account deletion, per-account project sync, offline device cache and explicit conflict choices |
| Appearance | Light/dark toggle, system default, saved device preference |
| Scripts | Seven searchable Luau templates, placement/setup/limits, clipboard copy, `.luau` download or native share |

Ideas use local curated combinations, not a remote AI model. This app does not execute Roblox scripts or replace Roblox Studio. Coins in the calculator are arbitrary in-game units, not Robux or cash.

## Verification

The delivered code has automated logic/storage tests, browser flows, TypeScript checks and Expo build checks. See [the verification report](docs/VERIFICATION.md) for exact results, limits, and outstanding device checks.

```powershell
npm.cmd run typecheck
npx.cmd expo install --check
npx.cmd expo-doctor
npm.cmd run build:web
npx.cmd playwright install chromium --only-shell
npm.cmd run test:e2e
npm.cmd run build:mobile
```

`build:mobile` creates iOS/Android JavaScript/Hermes bundles. It does **not** create a signed APK/IPA or prove physical-device behavior. No store upload, signed native build, store purchase, or billing entitlement has been performed.

## Build and business documents

- [Accounts and sync setup](docs/ACCOUNT_SETUP.md)
- [Windows + Expo Go instructions](docs/WINDOWS_SETUP.md)
- [Android APK, iPhone testing, and store build instructions](docs/BUILD_AND_RELEASE.md)
- [Monetization proposal and explicit revenue assumptions](docs/MONETIZATION.md)
- [Luau template setup and Studio test checklist](docs/SCRIPT_GUIDE.md)
- [Local data and privacy behavior](docs/PRIVACY.md)
- [Implementation scope](SPEC.md)

## Source layout

```text
App.tsx                 Responsive shell, navigation, load/save status
src/core/               Pure idea, calculator, project/task functions
src/storage/            Validated versioned storage and platform file handling
src/screens/            Four working screens and project editor
src/components/         Shared accessible controls and color/spacing tokens
src/data/templates.ts   Canonical Luau source and template metadata
templates/              Standalone .luau copies
tests/                  Node/TypeScript tests + optional Luau runtime test
e2e/                    Playwright browser flows
docs/                   Setup, verification, release, business, privacy
assets/                 Original terminal icon (no Roblox logo)
```

The app uses Expo SDK 57, React 19.2.3 and React Native 0.86.3. `package-lock.json` pins the dependency tree. SDK 57 follows [Expo's current physical-device Expo Go recommendation during the SDK 58 transition](https://docs.expo.dev/get-started/create-a-project/) as checked October 26, 2026. Expo Go compatibility changes; check the setup guide if your installed version differs.

Guest projects stay on each device/browser. Signed-in projects sync to the configured account service. Run `npm.cmd run server` in another terminal to try local accounts. See the account setup guide for phone access and HTTPS hosting. Closing an unsaved project-details form discards its draft; press **Save project details** for names, notes and phase. Task changes save immediately. Export a backup before uninstalling or clearing app/browser storage. Never put credentials into project notes or scripts you share.

The dependency audit currently reports Expo tooling advisories; their affected packages and release implications are recorded in [VERIFICATION.md](docs/VERIFICATION.md). This is a tested MVP, not a statement of production security approval or a promise of revenue.

Application source is provided under the [MIT license](LICENSE). Roblox and third-party dependencies retain their own rights and licenses.
