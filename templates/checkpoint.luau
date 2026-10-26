-- Checkpoint.server.luau | child of a SpawnLocation
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
