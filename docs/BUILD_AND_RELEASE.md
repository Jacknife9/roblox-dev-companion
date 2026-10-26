# Building installable apps

The ZIP is source code, not an APK or IPA. `npm run build:mobile` verifies native JavaScript/Hermes export without signing. Store distribution and signed-device builds require your accounts and signing credentials. Nothing has been published or charged.

## Run checks first

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

Read [VERIFICATION.md](VERIFICATION.md), including the remaining device checks and known Expo tooling advisories.

## Configure the optional service

For native builds with accounts/public lookups, set `EXPO_PUBLIC_API_URL` to your deployed HTTPS origin before building (locally or as a public EAS environment variable). Host the API with persistent SQLite storage; proxy `/v1` on the same origin as the web build. No public endpoint is configured in the source. See [Account setup](ACCOUNT_SETUP.md). This value is public; never put secrets or Roblox API keys in it. Offline tools work without a service.

## Prepare your identity

1. Decide the final independent app brand. The requested working title has not been approved by Roblox or an app store. Review [Roblox's name/logo rules](https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines) before commercial listing. The included original terminal icon does not use Roblox's logo. “Unofficial” is a disclosure, not permission to use a trademark.
2. Edit `app.json`: replace `com.example.devcompanion` in `ios.bundleIdentifier` and `android.package` with unique identifiers you control. These values are development placeholders. Update `expo.name` and `expo.slug` to your final choice.
3. Create/sign in to your Expo account. EAS `init` will link a project to your account and add its real project ID. No owner or project ID is embedded in this source.
4. If the extracted folder has no Git history, initialize it. EAS may offer to do this. Use your own author details.

```powershell
git init
git add .
git commit -m "Initial Dev Companion MVP"
npx.cmd eas-cli@latest login
npx.cmd eas-cli@latest init
npx.cmd eas-cli@latest build:configure
```

Keep the `preview` and `production` profiles from `eas.json` if configuration offers to regenerate it. [EAS Build](https://docs.expo.dev/build/introduction/) can build Android and iOS in the cloud from Windows. Available quotas and paid build options depend on your Expo plan; check the price shown in your account before requesting a paid service.

## Android APK to install directly

```powershell
npx.cmd eas-cli@latest build --platform android --profile preview
```

The preview profile requests an internal-distribution APK. Follow the keystore prompts using credentials you control. When the cloud build finishes, open its install link on your Android device and allow installation from that trusted source as needed. This does not publish to Google Play.

## iPhone preview

Expo Go is the fastest first test. For an independent signed build, use your Apple Developer account and register the physical device for internal/ad hoc testing:

```powershell
npx.cmd eas-cli@latest device:create
npx.cmd eas-cli@latest build --platform ios --profile preview
```

Follow EAS signing and provisioning prompts. An ad hoc build installs on registered devices; it is not a public App Store link. For wider beta distribution, produce a production-signed build and use TestFlight with App Store Connect. A normal IPA cannot simply be installed on every iPhone.

## Store artifacts and submission

```powershell
npx.cmd eas-cli@latest build --platform android --profile production
npx.cmd eas-cli@latest build --platform ios --profile production
```

The Android production profile requests an AAB. iOS uses store distribution by default. Builds require owner-controlled signing. Do not add `--auto-submit` until the app and listing are ready. When ready, EAS supports `npx.cmd eas-cli@latest submit --platform android` and `--platform ios`; these commands upload to your linked stores and should be run deliberately by the owner.

Before submitting, provide final icons/screenshots, support contact, a hosted privacy policy, content/age rating, store privacy/data-safety answers, review notes and testing evidence. Validate the app on real iPhone and Android devices, particularly keyboard behavior, sharing, persistence and restore. Check the current testing/access requirements in your Play Console account. No store metadata, legal identity or support address is invented here.

## Adding real purchases later

This MVP has no payment SDK or paywall. A future digital unlock needs store product IDs, store billing integration in a native development/production build, purchase verification, restore purchases, cancellation/error/refund handling, and testing with each store's sandbox accounts. Keep billing secrets on a server or a suitable provider, never in an Expo public environment variable. Expo Go does not test a real native payment integration. See [MONETIZATION.md](MONETIZATION.md).
