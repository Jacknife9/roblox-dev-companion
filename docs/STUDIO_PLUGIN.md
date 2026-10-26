# Dev Companion Studio plugin

A companion plugin for Roblox Studio. It runs the app's common-mistake checker on **every script in your place** and inserts the app's starter scripts in the right spot. It reads scripts inside Studio only; nothing is uploaded. Unofficial; not made by Roblox.

## Install (Windows)

1. Build it: `npm.cmd run build:plugin` (writes `studio-plugin/DevCompanion.lua`). A prebuilt copy is included in the release ZIP.
2. In Studio, open the **Plugins** tab → **Plugins Folder**.
3. Copy `DevCompanion.lua` into that folder, then restart Studio.
4. A **Dev Companion** button appears in the Plugins tab. Click it to open the panel.

## Use it

- **Scan scripts** checks Workspace, ServerScriptService, ServerStorage, ReplicatedStorage, ReplicatedFirst, StarterGui, StarterPack and StarterPlayer. Click a finding to open the script at that line.
- **Insert template** adds a starter script. Server/Module scripts go where the template says (for example ServerScriptService). Scripts that belong inside a part or button go into what you have selected, so select the part first. Inserts can be undone with Ctrl+Z.

## Limits

Same rules as the app's Code checker: legacy `wait`/`spawn`/`delay`, DataStore calls outside `pcall`, RemoteEvent trust, `while true do` loops with no visible yield, `Instance.new` with a parent argument, and deprecated `:connect()`/`:disconnect()`/`:Remove()`. It's a pattern checker, not a full Luau parser: it can flag safe code and miss real bugs. Roblox's own older scripts (like a rig's default `Animate`) often show up; those are safe to leave alone. Shows up to 300 findings.

Edit `studio-plugin/DevCompanion.src.lua`, not the generated file. Its checker logic was verified against the same cases as `tests/scriptCheck.test.ts` inside Studio.
