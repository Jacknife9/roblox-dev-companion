-- ButtonTween.client.luau | child of a GuiButton
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
