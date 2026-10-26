-- Prompt.server.luau | child of an anchored BasePart
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
