-- Progression.luau | ModuleScript in ReplicatedStorage
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
