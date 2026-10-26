-- Sprint.client.luau | StarterPlayerScripts
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
