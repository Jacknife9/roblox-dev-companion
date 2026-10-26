# Changelog

## 0.5.0 — 2026-10-26

- New look: electric indigo + lime theme in light and dark, bolder headings, rounded cards with depth, pill chips, accent-marked navigation.
- Roblox Studio plugin (`studio-plugin/`): scans every script in a place with the app's checker, jumps to the flagged line, and inserts the ten starter templates with undo. Build with `npm run build:plugin`; see docs/STUDIO_PLUGIN.md.
- Tools → Money: gamepass & developer product revenue planner.
- Tools → Tycoon: steal-game unit roster with payback times and weaker-unit flags.

## 0.4.0 — 2026-10-26

- Script checker now also flags `while true do` loops with no visible yield/break/return, `Instance.new` with a parent argument, and deprecated `:connect()`, `:disconnect()` and `:Remove()`.

## 0.3.0 — 2026-10-26

- Added Tools: Robux proceeds and fetched official DevEx categories, spaced offer ladders, tycoon/rebirth/loss progression graphs.
- Added Offset-to-Scale conversion and local Luau common-mistake review prompts.
- Added image framing/size previews, listing checks, update-log formatting and a launch checklist saved as project tasks.
- Added public Roblox stats with place resolution, observed server history, graphs and CSV export. No Roblox login or cookies.
- Expanded the library to ten templates with DataStore retries/revision checks, server ProximityPrompt and UI TweenService examples.
- Public data requires the self-hosted service; no historical backfill, automatic Roblox publishing or active payments.

## 0.2.0 — 2026-10-26

- Saved light/dark theme with system default and readable semantic colors.
- Optional companion accounts with scrypt passwords, revocable sessions and isolated SQLite workspaces.
- Project sync with offline device caches, stale-revision protection and explicit conflict resolution.
- Guest-project copying, logout to guest workspace and password-confirmed account deletion.
- Account/backend/sync tests and desktop/phone-sized browser checks.
- Self-hosted service only; no public deployment, email recovery or active payments.

## 0.1.0 — 2026-10-26

### Added
- Offline curated game ideas with scope constraints and project starter tasks.
- XP, upgrade-time, and coin faucet/sink calculators with bounded inputs.
- Local project notes, phases, task tracking and progress.
- Validated workspace backup/export/restore with explicit replace confirmation.
- Seven copyable/shareable Luau starters with setup and limits.
- Responsive Expo interface, source tests, browser flows, Windows and release instructions.

### Availability
- Source MVP only. No signed native binary, public store listing, active payments or revenue.
