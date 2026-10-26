-- RoundClock.server.luau | ServerScriptService
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
