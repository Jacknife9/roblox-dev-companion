# Using the Luau library in Roblox Studio

The sources are original starter examples bundled both inside the app and in `templates/`. The app never executes them. Open [Roblox Studio](https://create.roblox.com/docs/studio/setup) on your computer and paste into the exact script type/location below. Start in a fresh test place, read the limits, and adapt the examples to your experience.

| File | Type and placement | What to create/test |
|---|---|---|
| `session-coins.luau` | Script in ServerScriptService | Play with two players; each gets Coins = 0. Values reset on leave. |
| `coin-pickup.luau` | Script inside an anchored BasePart | Install Session leaderstats first. Touch with two players; each gets 10 Coins, at most once per five seconds per coin. |
| `checkpoint.luau` | Script inside a SpawnLocation | Touch it, reset your character, and check respawn. Multiple checkpoints allow backtracking; there is no ordered stage system. |
| `sprint.luau` | LocalScript in StarterPlayerScripts | Hold Shift / touch Sprint, release, respawn, and switch window focus. Sprint changes local WalkSpeed only. |
| `round-timer.luau` | Script in ServerScriptService | Inspect ReplicatedStorage RoundPhase/RoundSeconds attributes; intermission lasts 15s, round 120s. Add a UI and game rules yourself. |
| `xp-module.luau` | ModuleScript named Progression in ReplicatedStorage | Require it on the server and compare total(4,100,1.5) to 475. This is a math helper; it does not grant XP. |
| `cosmetic-shop.luau` | Script in ServerScriptService | Create anchored Workspace.Shop, install Session leaderstats; give a test player 100 earned Coins; call BuyCosmetic:FireServer("Mint") from a LocalScript within 12 studs. Observe one 100-Coin debit and NameplateColor attribute. |

For XP:

```lua
local XP = require(game.ReplicatedStorage.Progression)
print(XP.required(4, 100, 1.5)) -- 225 to move from level 3 to level 4
print(XP.total(4, 100, 1.5))    -- 475 from level 1 to level 4
```

For the cosmetic shop, the catalogue, price and grant are owned by the server. The client sends only an item ID. Unknown/oversized IDs, rapid requests, dead characters, insufficient balances, repeat ownership and out-of-range requests are rejected. The script stores session ownership and sets an attribute; a visible nameplate UI is still your responsibility. The scripts have no DataStore persistence or Robux purchase handling.

Test malicious requests in your own Studio test session: an unknown item, a table instead of a string, a long ID, repeat purchases, remote requests far from Shop, and a low balance. Also test the normal purchase. Roblox warns that clients can trigger or forge gameplay interactions; authoritative rewards need validation. These examples check distance/context where applicable but are not a full movement anti-cheat. [Roblox client/server security guidance](https://create.roblox.com/docs/scripting/security/client-server-boundary).

## Verification included

All ten sources were syntax-compiled with the official Luau 0.744 Windows compiler. The XP module also ran eight assertions under the standalone Luau runtime. The other six templates depend on Studio's DataModel/events and still require the real Studio tests above; compilation is not evidence those game flows were played.

If you have the official [Luau CLI release](https://github.com/luau-lang/luau/releases/tag/0.744) installed and on PATH:

```powershell
Get-ChildItem templates -Filter *.luau | ForEach-Object { luau-compile.exe --null $_.FullName }
luau.exe tests/luau-xp.test.luau
```

`src/data/templates.ts` is the canonical source used by the app. After editing it, regenerate the standalone copies and run their consistency tests:

```powershell
node --import tsx scripts/export-templates.ts
npm.cmd test
```

Do not install multiple copies of the shop/round scripts in one place. Keep changes on a test place until the intended behavior is verified. Session-only examples should not be presented as durable purchases.

## Additional templates

DataStore load/save with retries is a server-only module with protected calls, bounded exponential backoff, optimistic revision checks and idempotent retry markers. Integrate successful load gating, autosave, PlayerRemoving and BindToClose in a separate test game. Force service failures and concurrent writes; a failed load must never become a saved default. This starter is not a complete session-locking profile system.

Validated ProximityPrompt checks server-observed distance, health and cooldown; add permissions for your action. UI tween is a LocalScript under a GuiButton and uses Activated for multiple input types. Test both in Studio with two players and a touch emulator/device. The ten templates were syntax-compiled; engine-dependent behavior still needs Studio tests.
