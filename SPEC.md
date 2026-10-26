# Roblox Dev Companion MVP — 0.1.0

## Objective and assumptions
An offline iPhone/Android workbench for people creating Roblox experiences. Expo/React Native, TypeScript, no account, AI service, analytics, or payments required for the offline tools. The user authorized autonomous implementation and packaging; spec review gates do not block the requested build. All MVP features are free. No claim of Roblox endorsement or store publication.

## Capability map
| Module | Responsibility | Depends on |
|---|---|---|
| ideas | Curated genre/team/scope combinations with concrete loops and starter tasks | — |
| balance | XP curve, upgrade pricing/time, faucet/sink balance | — |
| projects | Local project/task CRUD, progress and notes | ideas |
| scripts | Searchable Luau templates with placement and usage instructions, copy/share | — |
| storage | Versioned device persistence, validation, backup/restore, recoverable failures | project types |
| shell | Accessible mobile UI and navigation | all above |

Build order: pure functions + tests → persistent project flows → four UI screens → runtime validation → docs + ZIP.

## Commands
Install: `npm ci`. Start: `npm start`. Web: `npm run web`. Tests: `npm test`. Types: `npm run typecheck`. Expo packages: `npx expo install --check`. Web build: `npm run build:web`. Native JS bundle check: `npm run build:mobile`. Browser flows: `npm run test:e2e` (install Playwright Chromium first).

## Structure and style
`src/core/` pure logic; `src/data/` curated content; `src/screens/` app sections; `src/components/` shared controls; `src/storage/` persistence; `tests/` unit/integration tests; `e2e/` browser checks; `docs/` setup, verification, business and template guidance; `templates/` standalone Luau sources.

Use explicit TypeScript domain types, named functions, simple React state, semantic color tokens, and validated inputs. Example: `const minutes = price / coinsPerMinute;`. The optional account backend and sync contract are documented in docs/ACCOUNTS_AND_SYNC.md. Guest data remains independent.

## Acceptance criteria / testing
- Ideas honor genre, scope, and team filters; provide a loop, progression hook, differentiator and starter tasks. Save as a project in one action; distinguish curated combinations from AI generation.
- XP shows per-level incremental and cumulative rounded requirements; upgrade cost/time uses explicit assumptions; economy shows sources minus sinks. Invalid or excessive numbers return readable errors, never NaN/Infinity.
- Projects support create/edit/delete, add/edit/toggle/delete tasks, progress, notes, persistence after reload. Initial workspace is empty. Deletion has an in-app confirmation.
- Persistence does not overwrite data before hydration or on corrupted input; failed writes are visible and retryable. Export/import validates schema, sizes, unique identifiers and limits; replace requires confirmation.
- Script library has runnable starter sources, script type, placement and documented limitations. Copy and share/export work through Expo-compatible modules. The phone does not execute Roblox scripts.
- Navigation, labelled inputs, 44px touch targets, safe areas, keyboard avoidance and empty/error states work on narrow screens.
- Verify logic/storage tests, TypeScript, Expo dependency alignment, web and iOS/Android JS exports; browser interaction flows and screenshots where runtime available. Actual iOS/Android device testing is a separate explicit remaining check.
- ZIP contains source, lockfile, tests, instructions and honest business plan. No node_modules, credentials or fake store/payment claims.

## Boundaries
Always validate data, report save failures and run checks. Credentials/public publishing/paid services require the owner's account and intent. Never hardcode secrets, sell Robux, claim revenue, or imply official affiliation. No SDK for payments or advertising is installed.
