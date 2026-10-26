import { extraTemplates } from './extraTemplates';
export type ScriptTemplate = {
  id: string; title: string; category: string; summary: string; kind: 'Script' | 'LocalScript' | 'ModuleScript';
  placement: string; setup: string; limits: string; code: string;
};
export const templates: ScriptTemplate[] = [
  ...extraTemplates,
  {
    id: 'session-coins', title: 'Session leaderstats', category: 'Economy', kind: 'Script',
    summary: 'Give each player a Coins stat for a prototype economy.', placement: 'ServerScriptService → Script',
    setup: 'Create a Script named SessionCoins. Paste this source. Press Play and inspect the leaderboard.',
    limits: 'Session only: resets when a player leaves. This does not save purchases or currency between sessions.',
    code: `-- SessionCoins.server.luau | ServerScriptService
local Players = game:GetService("Players")

local function setup(player)
    if player:FindFirstChild("leaderstats") then return end
    local stats = Instance.new("Folder")
    stats.Name = "leaderstats"
    local coins = Instance.new("IntValue")
    coins.Name = "Coins"
    coins.Value = 0
    coins.Parent = stats
    stats.Parent = player
end

Players.PlayerAdded:Connect(setup)
for _, player in Players:GetPlayers() do setup(player) end
`,
  },
  {
    id: 'coin-pickup', title: 'Coin pickup with cooldown', category: 'Economy', kind: 'Script',
    summary: 'Award Coins as a fixed server-owned reward when a player touches a coin.', placement: 'Workspace → anchored Coin Part → Script',
    setup: 'Add an anchored Part with CanTouch enabled. Insert this Script inside it. Install Session leaderstats first.',
    limits: 'One cooldown per player per coin. Coin stays visible. Server distance checking limits forged touches; a competitive economy needs movement validation too.',
    code: `-- CoinPickup.server.luau | child of an anchored BasePart
local Players = game:GetService("Players")
local coin = script.Parent
assert(coin:IsA("BasePart"), "Put this Script inside a Part")
local REWARD, COOLDOWN = 10, 5
local lastClaim = {}

coin.Touched:Connect(function(hit)
    local character = hit:FindFirstAncestorOfClass("Model")
    local player = character and Players:GetPlayerFromCharacter(character)
    local root = character and character:FindFirstChild("HumanoidRootPart")
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if not player or not root or not humanoid or humanoid.Health <= 0 then return end
    if (root.Position - coin.Position).Magnitude > coin.Size.Magnitude / 2 + 6 then return end
    local now = os.clock()
    if lastClaim[player] and now - lastClaim[player] < COOLDOWN then return end
    local stats = player:FindFirstChild("leaderstats")
    local coins = stats and stats:FindFirstChild("Coins")
    if not coins or not coins:IsA("IntValue") then return end
    lastClaim[player] = now
    coins.Value += REWARD
end)

Players.PlayerRemoving:Connect(function(player) lastClaim[player] = nil end)
`,
  },
  {
    id: 'checkpoint', title: 'Obby checkpoint', category: 'Progression', kind: 'Script',
    summary: 'Set a player’s respawn point when they reach a checkpoint.', placement: 'Workspace → SpawnLocation → Script',
    setup: 'Create a SpawnLocation, set Anchored and Neutral to true, and AllowTeamChangeOnTouch to false. Put this Script inside it. Add more checkpoint spawns by duplicating it.',
    limits: 'Session only. This allows backtracking to any touched checkpoint. Add stage ordering if checkpoints must be sequential.',
    code: `-- Checkpoint.server.luau | child of a SpawnLocation
local Players = game:GetService("Players")
local checkpoint = script.Parent
assert(checkpoint:IsA("SpawnLocation"), "Use a SpawnLocation")
checkpoint.Neutral = true
checkpoint.AllowTeamChangeOnTouch = false

checkpoint.Touched:Connect(function(hit)
    local character = hit:FindFirstAncestorOfClass("Model")
    local player = character and Players:GetPlayerFromCharacter(character)
    local root = character and character:FindFirstChild("HumanoidRootPart")
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if not player or not root or not humanoid or humanoid.Health <= 0 then return end
    if (root.Position - checkpoint.Position).Magnitude > checkpoint.Size.Magnitude / 2 + 8 then return end
    player.RespawnLocation = checkpoint
end)
`,
  },
  {
    id: 'sprint', title: 'Keyboard + touch sprint', category: 'Controls', kind: 'LocalScript',
    summary: 'Hold Shift or the on-screen Sprint button to run.', placement: 'StarterPlayer → StarterPlayerScripts → LocalScript',
    setup: 'Create a LocalScript named Sprint. Test with Shift on desktop and the Sprint touch button in a mobile emulator.',
    limits: 'Client movement prototype. Do not use client WalkSpeed as proof for rewards or race results. Coordinate with other movement scripts.',
    code: `-- Sprint.client.luau | StarterPlayerScripts
local Players = game:GetService("Players")
local ContextActionService = game:GetService("ContextActionService")
local UserInputService = game:GetService("UserInputService")
local player = Players.LocalPlayer
local WALK, RUN = 16, 24
local running = false

local function apply()
    local character = player.Character
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if humanoid then humanoid.WalkSpeed = running and RUN or WALK end
end
local function sprint(_, state)
    if state == Enum.UserInputState.Begin then running = true
    elseif state == Enum.UserInputState.End or state == Enum.UserInputState.Cancel then running = false end
    apply()
    return Enum.ContextActionResult.Sink
end
ContextActionService:BindAction("CompanionSprint", sprint, true, Enum.KeyCode.LeftShift)
ContextActionService:SetTitle("CompanionSprint", "Sprint")
ContextActionService:SetPosition("CompanionSprint", UDim2.new(1, -150, 1, -160))
UserInputService.WindowFocusReleased:Connect(function() running = false; apply() end)
player.CharacterAdded:Connect(function(character)
    running = false
    character:WaitForChild("Humanoid")
    apply()
end)
`,
  },
  {
    id: 'round-timer', title: 'Shared round clock', category: 'Game loop', kind: 'Script',
    summary: 'Publish a server-owned intermission and round countdown.', placement: 'ServerScriptService → Script',
    setup: 'Create one Script named RoundClock. During Play, inspect ReplicatedStorage attributes RoundPhase and RoundSeconds. Read these from a LocalScript to build your UI.',
    limits: 'Timing skeleton only. Add spawn, victory, and cleanup rules for your game. Seconds use elapsed time and may skip a display value during server lag.',
    code: `-- RoundClock.server.luau | ServerScriptService
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local function countdown(phase, duration)
    local deadline = os.clock() + duration
    ReplicatedStorage:SetAttribute("RoundPhase", phase)
    while true do
        local remaining = math.max(0, math.ceil(deadline - os.clock()))
        ReplicatedStorage:SetAttribute("RoundSeconds", remaining)
        if remaining == 0 then break end
        task.wait(0.2)
    end
end
while true do
    countdown("Intermission", 15)
    countdown("Round", 120)
    -- Apply your win conditions and round cleanup here.
end
`,
  },
  {
    id: 'xp-module', title: 'XP curve module', category: 'Progression', kind: 'ModuleScript',
    summary: 'Use the same per-level XP math as the Balance calculator.', placement: 'ReplicatedStorage → ModuleScript named Progression',
    setup: 'Require the ModuleScript from your server: local XP = require(game.ReplicatedStorage.Progression). Then call XP.required(2, 100, 1.25) or XP.total(10, 100, 1.25).',
    limits: 'Math only. Server code must own XP grants and level changes. The module rejects totals over 10^15, like the app calculator.',
    code: `-- Progression.luau | ModuleScript in ReplicatedStorage
local XP = {}
local function validate(level, base, growth)
    assert(type(level) == "number" and level == math.floor(level) and level >= 2 and level <= 200, "Level must be 2..200")
    assert(type(base) == "number" and base == base and base >= 1 and base <= 1e9, "Base must be 1..1e9")
    assert(type(growth) == "number" and growth == growth and growth >= 1 and growth <= 3, "Growth must be 1..3")
end
function XP.required(level, base, growth)
    validate(level, base, growth)
    local result = math.floor(base * growth ^ (level - 2) + 0.5)
    assert(result <= 1e15, "Curve is too large")
    return result
end
function XP.total(level, base, growth)
    validate(level, base, growth)
    local total = 0
    for nextLevel = 2, level do
        total += XP.required(nextLevel, base, growth)
        assert(total <= 1e15, "Curve is too large")
    end
    return total
end
return XP
`,
  },
  {
    id: 'cosmetic-shop', title: 'Validated cosmetic shop', category: 'Economy', kind: 'Script',
    summary: 'Sell a session-only nameplate color for earned in-game Coins.', placement: 'ServerScriptService → Script',
    setup: 'Install Session leaderstats. Create an anchored Part named Shop in Workspace. This Script creates BuyCosmetic in ReplicatedStorage. From a LocalScript call game.ReplicatedStorage.BuyCosmetic:FireServer("Mint"). Read player attribute NameplateColor in your custom UI.',
    limits: 'Earned Coins only, no Robux or real payments. Ownership and balances reset on leave. Setting an attribute does not render a nameplate; connect it to your UI. Add persistence before selling permanent items.',
    code: `-- CosmeticShop.server.luau | ServerScriptService
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local shop = workspace:WaitForChild("Shop")
assert(shop:IsA("BasePart"), "Workspace.Shop must be a Part")
assert(not ReplicatedStorage:FindFirstChild("BuyCosmetic"), "Install the shop script only once")
local remote = Instance.new("RemoteEvent")
remote.Name = "BuyCosmetic"
remote.Parent = ReplicatedStorage
local catalogue = { Mint = { price = 100, color = Color3.fromRGB(120, 220, 170) } }
local lastRequest, owned = {}, {}

remote.OnServerEvent:Connect(function(player, itemId)
    local now = os.clock()
    if lastRequest[player] and now - lastRequest[player] < 0.5 then return end
    lastRequest[player] = now
    if type(itemId) ~= "string" or #itemId > 32 then return end
    local item = catalogue[itemId]
    if not item then return end
    local character = player.Character
    local root = character and character:FindFirstChild("HumanoidRootPart")
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if not root or not humanoid or humanoid.Health <= 0 then return end
    if (root.Position - shop.Position).Magnitude > 12 then return end
    local stats = player:FindFirstChild("leaderstats")
    local coins = stats and stats:FindFirstChild("Coins")
    if not coins or not coins:IsA("IntValue") or coins.Value < item.price then return end
    owned[player] = owned[player] or {}
    if owned[player][itemId] then return end
    -- No yielding between the balance check, debit, and session ownership grant.
    coins.Value -= item.price
    owned[player][itemId] = true
    player:SetAttribute("NameplateColor", item.color)
end)
Players.PlayerRemoving:Connect(function(player)
    lastRequest[player], owned[player] = nil, nil
end)
`,
  },
];
export function searchTemplates(query: string, category = 'All') {
  const q = query.trim().toLowerCase();
  return templates.filter(t => (category === 'All' || t.category === category)
    && `${t.title} ${t.summary} ${t.category} ${t.placement}`.toLowerCase().includes(q));
}
