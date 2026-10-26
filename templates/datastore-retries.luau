-- CoinStore.luau | ModuleScript in ServerScriptService
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
