# Verification report

Date: October 26, 2026. Host: Windows / PowerShell, Node 24.22.1. Source version: 0.1.0. Commands below use the normal npm/npx entry points; the build environment invoked the same installed CLIs through its local Node runtime.

## Executed checks

| Check | Result | What this proves |
|---|---|---|
| `npm test` | 34 passed, 0 failed, 0 skipped | Idea constraints/variety, calculator formulas/limits, task CRUD/progress, backup validation and serialized storage writes, template search/source consistency |
| `npm run typecheck` | Passed | Strict TypeScript across app, tests and scripts |
| `npx expo install --check` | Dependencies up to date | Direct native modules match SDK 57's expected versions |
| `npx expo-doctor` | 21/21 passed | Expo configuration, peers, package alignment and project checks |
| `npm run build:web` | Passed | Production React Native Web bundle and local icon/font assets |
| `npm run test:e2e` | 14 passed | Seven flows each in desktop and phone-sized Chromium |
| `npm run build:mobile` | iOS and Android Hermes exports passed | Native platform module resolution and JS/Hermes compilation, not a signed app build |
| `expo start --go --offline` | Started successfully | Local development server starts; iOS and Android manifest requests each returned HTTP 200 / SDK 57 / launch asset |
| Official Luau 0.744 `luau-compile --null` | 7/7 templates compiled | Luau syntax/bytecode compilation |
| Luau runtime `tests/luau-xp.test.luau` | 8 assertions passed | Actual XP helper execution including known totals and invalid/overflow inputs |

Browser flows cover: idea filters → project, task completion and notes surviving reload, manual project/task CRUD, invalid names, deletion cancel/confirm, known calculator outputs/errors, script search/download/copy, JSON backup download/file import/paste validation/cancel/replace, page errors/console errors/warnings, and layout widths 320, 390, 768, 1024, 1280, 1440. Browser console checks found no app errors or warnings. Screenshots are included in `docs/screenshots/` and are browser renders, not photos of native apps.

One runtime bug was found and fixed: React Native Web did not map `accessibilityState.checked` onto an ARIA checkbox state. The code now explicitly exposes `aria-checked`, and the persistence flow asserts the checked state both before and after reload. Selected/pressed controls also expose their web states.

The ZIP was also extracted into a separate folder and installed with `npm ci`. That check caught Windows CRLF conversion in the template consistency test. The archive now declares LF source formatting, and the consistency check accepts equivalent Windows line endings while still comparing all script content.

## Exact rerun commands

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run typecheck
npx.cmd expo install --check
npx.cmd expo-doctor
npm.cmd run build:web
npx.cmd playwright install chromium --only-shell
npm.cmd run test:e2e
npm.cmd run build:mobile
```

For an optional Luau runtime rerun, install the official CLI separately and follow [SCRIPT_GUIDE.md](SCRIPT_GUIDE.md). No downloaded compiler binaries or browsers are bundled in the ZIP.

## Known dependency advisories

The npm audit of this SDK 57 lockfile reports **5 high-severity package flags**, propagated through the Expo CLI graph from **two underlying advisories**:

- `node-forge` ≤1.4.0: RSA signature verification issue, [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv). Registry latest was 1.4.0 at verification time.
- The CLI's Zod version is covered by a constrained-collection memory-exhaustion advisory, [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5). A patched Zod 4 exists, but overriding an SDK-managed Zod 3 dependency with a major version was not treated as a safe fix.

The affected graph is Expo development/signing tooling (`expo`, `@expo/cli`, `@expo/code-signing-certificates`, `node-forge`, `zod`); these are not a payment/account backend implemented by this app. No malicious-input exploit or production security audit was performed. `expo-doctor` passing is separate from `npm audit`. Recheck current upstream fixes and update/test an Expo-supported dependency set before production signing or release. Do not use `npm audit fix --force` blindly: at verification time its suggested Expo downgrade was incompatible with this SDK 57 project.

## Checks still needed before release

- Actual Expo Go launch on a physical iPhone and Android phone. No phone was connected for this build.
- Native keyboard/safe area/rotation tests; VoiceOver/TalkBack and enlarged-text checks.
- Native clipboard and OS Files/share-sheet import/export and backup round trip between devices. Their web equivalents and validation logic were tested here.
- Persistence after force-closing a signed native app, low-storage failures on real devices, and an Android/iOS OS upgrade.
- Run the six Studio-dependent templates in Roblox Studio with two players and the attack/edge cases in the script guide. The XP helper was executed standalone.
- Real EAS native compilation/signing and installation. An exported Hermes bundle is not an APK, AAB, IPA or TestFlight build.
- Resolve/reassess upstream tooling advisories, final app identifiers/brand, store listing and privacy metadata, support contact, current store review requirements.
- If monetization is added: real store product configuration, sandbox purchases/restores/refunds, verified entitlements, and review of the actual paid offer.

No signed native binary, public deployment, published listing, live payments or real revenue is claimed. The included business model is a proposal for validating demand.
