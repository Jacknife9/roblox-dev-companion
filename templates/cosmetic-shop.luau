-- CosmeticShop.server.luau | ServerScriptService
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
