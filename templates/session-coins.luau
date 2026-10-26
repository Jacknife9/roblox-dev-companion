-- SessionCoins.server.luau | ServerScriptService
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
