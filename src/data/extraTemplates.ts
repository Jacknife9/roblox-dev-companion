import type { ScriptTemplate } from './templates';
export const extraTemplates: ScriptTemplate[] = [
  {
    id: 'datastore-retries', title: 'DataStore load/save with retries', category: 'Persistence', kind: 'ModuleScript',
    summary: 'Protected calls, bounded backoff and revision checks for a small prototype coin record.',
    placement: 'ServerScriptService → ModuleScript named CoinStore',
    setup: 'Require from a server Script. load(userId) returns ok, record. Keep record.revision and pass it to save(userId, coins, revision). Only create gameplay state after a successful load. Enable Studio API access only in a separate published test game, never your live store.',
    limits: 'An integration pattern, not a complete player-data system. Connect periodic saves, PlayerRemoving and BindToClose; handle failed saves visibly. Revision conflicts refuse to overwrite. For production profiles, use a reviewed session-locking system. Never save defaults after a failed load. Store only server-owned currency values.',
    code: `-- CoinStore.luau | ModuleScript in ServerScriptService
local DataStoreService = game:GetService("DataStoreService")
local HttpService = game:GetService("HttpService")
local store = DataStoreService:GetDataStore("PrototypeCoins_v1")
local CoinStore = {}

local function valid(record)
    return type(record) == "table" and type(record.coins) == "number"
        and record.coins == record.coins and record.coins >= 0 and record.coins <= 1e12
        and record.coins % 1 == 0 and type(record.revision) == "number"
        and record.revision >= 0 and record.revision % 1 == 0 and record.revision < 9e15
end

local function retry(operation)
    for attempt = 1, 4 do
        local ok, value = pcall(operation)
        if ok then return true, value end
        if attempt < 4 then task.wait(2 ^ (attempt - 1) + math.random()) end
    end
    return false, nil -- Do not expose raw service errors to clients.
end

local function key(userId)
    assert(type(userId) == "number" and userId > 0 and userId % 1 == 0, "Invalid user ID")
    return "player_" .. tostring(userId)
end

function CoinStore.load(userId)
    local recordKey = key(userId)
    local ok, record = retry(function() return store:GetAsync(recordKey) end)
    if not ok then return false, nil end
    if record == nil then return true, { coins = 0, revision = 0 } end
    if not valid(record) then return false, nil end
    return true, record
end

function CoinStore.save(userId, coins, expectedRevision)
    assert(valid({ coins = coins, revision = expectedRevision }), "Invalid save")
    local recordKey = key(userId)
    local writeId = HttpService:GenerateGUID(false)
    local ok, result = retry(function()
        return store:UpdateAsync(recordKey, function(old)
            if old == nil then old = { coins = 0, revision = 0 } end
            if not valid(old) then return nil end
            -- Repeating an acknowledged write after a network error is idempotent.
            if old.writeId == writeId then return old end
            if old.revision ~= expectedRevision then return nil end
            return { coins = coins, revision = expectedRevision + 1, writeId = writeId }
        end)
    end)
    if not ok or not result or result.writeId ~= writeId then return false, nil end
    return true, result
end

return CoinStore
`,
  },
  {
    id: 'proximity-prompt', title: 'Validated ProximityPrompt', category: 'Controls', kind: 'Script',
    summary: 'A server prompt with independent distance, health and cooldown checks.',
    placement: 'Workspace → anchored BasePart → Script',
    setup: 'Place this Script directly under an anchored Part. It creates a ProximityPrompt. Test with two players; approach the part and trigger the prompt.',
    limits: 'The sample records a session interaction count. Add server permission/ownership checks for your specific action. Prompt visibility and hold duration alone are not security checks. Use authoritative server positions for valuable actions.',
    code: `-- Prompt.server.luau | child of an anchored BasePart
local Players = game:GetService("Players")
local part = script.Parent
assert(part:IsA("BasePart"), "Place under a BasePart")
local prompt = Instance.new("ProximityPrompt")
prompt.ActionText = "Interact"
prompt.ObjectText = "Workbench"
prompt.MaxActivationDistance = 10
prompt.HoldDuration = 0.3
prompt.Parent = part
local last = {}
prompt.Triggered:Connect(function(player)
    local now = os.clock()
    if last[player] and now - last[player] < 1 then return end
    local character = player.Character
    local root = character and character:FindFirstChild("HumanoidRootPart")
    local humanoid = character and character:FindFirstChildOfClass("Humanoid")
    if not root or not humanoid or humanoid.Health <= 0 then return end
    if (root.Position - part.Position).Magnitude > 12 then return end
    last[player] = now
    player:SetAttribute("WorkbenchInteractions", (player:GetAttribute("WorkbenchInteractions") or 0) + 1)
end)
Players.PlayerRemoving:Connect(function(player) last[player] = nil end)
`,
  },
  {
    id: 'ui-tween', title: 'Touch-friendly UI tween', category: 'UI', kind: 'LocalScript',
    summary: 'Animate a GuiButton with TweenService and Activated for mouse, touch and gamepad.',
    placement: 'StarterGui → ScreenGui → TextButton → LocalScript',
    setup: 'Add this LocalScript to a TextButton. Activated works on touch and gamepad as well as mouse. Add a UIScale under the button to animate without rewriting its layout size.',
    limits: 'Visual effect only. Never grant currency or a purchase from a client animation. Ensure reduced-motion and navigation behavior meet your audience needs.',
    code: `-- ButtonTween.client.luau | child of a GuiButton
local TweenService = game:GetService("TweenService")
local button = script.Parent
assert(button:IsA("GuiButton"), "Place under a GuiButton")
local scale = button:FindFirstChildOfClass("UIScale") or Instance.new("UIScale")
scale.Parent = button
local busy = false
button.Activated:Connect(function()
    if busy then return end
    busy = true
    local down = TweenService:Create(scale, TweenInfo.new(0.08), { Scale = 0.94 })
    local up = TweenService:Create(scale, TweenInfo.new(0.12, Enum.EasingStyle.Quad), { Scale = 1 })
    down:Play()
    down.Completed:Wait()
    up:Play()
    up.Completed:Wait()
    busy = false
end)
`,
  },
];
