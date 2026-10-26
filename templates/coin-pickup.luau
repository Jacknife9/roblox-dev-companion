-- CoinPickup.server.luau | child of an anchored BasePart
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
