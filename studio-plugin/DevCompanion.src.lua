-- Dev Companion Studio plugin. Source file: studio-plugin/DevCompanion.src.lua.
-- `npm run build:plugin` embeds the app's script templates and writes studio-plugin/DevCompanion.lua.
-- Unofficial. Reads your scripts locally inside Studio; nothing is uploaded.
local ChangeHistoryService = game:GetService("ChangeHistoryService")
local ScriptEditorService = game:GetService("ScriptEditorService")
local Selection = game:GetService("Selection")

type Template = { title: string, category: string, kind: string, placement: string, code: string }
local TEMPLATES: { Template } = --@TEMPLATES

----------------------------------------------------------------------------------------------------
-- Checker: same rules as the app's src/core/scriptCheck.ts. Pattern checks, not a Luau parser.
----------------------------------------------------------------------------------------------------
type Finding = { line: number, rule: string, message: string }

local function blank(s: string): string
	return (string.gsub(s, "[^\n\r]", " "))
end

-- Replace comments and strings with spaces, keeping positions and newlines.
local function mask(src: string): string
	local out, i, n = {}, 1, #src
	while i <= n do
		local start = i
		local isComment = string.sub(src, i, i + 1) == "--"
		local after = if isComment then i + 2 else i
		local eq = string.match(src, "^%[(=*)%[", after)
		if eq then
			local _, e = string.find(src, "]" .. eq .. "]", after + #eq + 2, true)
			i = if e then e + 1 else n + 1
			table.insert(out, blank(string.sub(src, start, i - 1)))
		elseif isComment then
			i = string.find(src, "\n", i, true) or n + 1
			table.insert(out, blank(string.sub(src, start, i - 1)))
		else
			local c = string.sub(src, i, i)
			if c == '"' or c == "'" or c == "`" then
				i += 1
				while i <= n do
					local d = string.sub(src, i, i)
					i += if d == "\\" then 2 else 1
					if d == c then break end
				end
				i = math.min(i, n + 1)
				table.insert(out, blank(string.sub(src, start, i - 1)))
			else
				table.insert(out, c)
				i += 1
			end
		end
	end
	return table.concat(out)
end

local LEGACY = { wait = true, spawn = true, delay = true }
local DATASTORE = { GetAsync = true, SetAsync = true, UpdateAsync = true, IncrementAsync = true, RemoveAsync = true }
local DEPRECATED = { connect = ":Connect()", disconnect = ":Disconnect()", Remove = ":Destroy()" }
local BLOCK = { ["do"] = 1, ["then"] = 1, ["function"] = 1, ["repeat"] = 1, ["end"] = -1, ["until"] = -1 }

local function check(source: string): { Finding }
	local code, findings = mask(source), {}
	local function add(pos: number, rule: string, message: string)
		local _, newlines = string.gsub(string.sub(code, 1, pos), "\n", "")
		table.insert(findings, { line = newlines + 1, rule = rule, message = message })
	end

	for pos, name in string.gmatch(code, "()([%a_][%w_]*)%s*%(") do
		if LEGACY[name] and not string.find(string.sub(code, pos - 1, pos - 1), "[%w_.:]") then
			add(pos, "Legacy scheduler", "Use task.wait(), task.spawn() or task.delay() instead.")
		end
	end

	-- Mark ':' positions that sit inside pcall(...) / xpcall(...).
	local protected, stack, depth = {}, {}, 0
	for i = 1, #code do
		local b = string.byte(code, i)
		if b == 40 then
			local name = string.match(string.sub(code, math.max(1, i - 30), i - 1), "([%w_.]+)%s*$")
			local p = name == "pcall" or name == "xpcall"
			table.insert(stack, p)
			if p then depth += 1 end
		elseif b == 41 then
			if table.remove(stack) then depth -= 1 end
		elseif b == 58 and depth > 0 then
			protected[i] = true
		end
	end
	for pos, name in string.gmatch(code, "():%s*(%a+)%s*%(") do
		if DATASTORE[name] and not protected[pos] then
			add(pos, "DataStore error handling", "Not inside pcall/xpcall. Handle failures and retry; never overwrite saved data after a failed load.")
		end
		if DEPRECATED[name] then
			add(pos, "Deprecated method", ":" .. name .. "() is deprecated. Use " .. DEPRECATED[name] .. " instead.")
		end
	end

	for pos, args, bodyStart in string.gmatch(code, "()OnServerEvent%s*:%s*Connect%s*%(%s*function%s*%(([^)]*)%)()") do
		local body, direct = string.sub(code, bodyStart, bodyStart + 3000), false
		for index, arg in string.split(args, ",") do
			local id = string.match(arg, "^%s*([%a_][%w_]*)")
			if index > 1 and id and string.find(body, "%.Value%s*[%+%-%*/]?=%s*" .. id .. "%f[^%w_]") then direct = true end
		end
		add(pos, if direct then "Client value used directly" else "RemoteEvent review",
			if direct then "A client argument writes a Value directly. Use server-owned prices/rewards and validate everything."
			else "Validate argument types, ranges, ownership, distance and cooldowns. A client request is not proof of anything.")
	end

	for pos, bodyStart in string.gmatch(code, "()%f[%w_]while%s+true%s+do%f[^%w_]()") do
		local depthLeft, finish, skipThen, at = 1, #code, false, bodyStart
		while true do
			local s, e, word = string.find(code, "%f[%w_]([%a_][%w_]*)", at)
			if not s then break end
			at = e + 1
			if word == "elseif" then
				skipThen = true
			elseif word == "then" and skipThen then
				skipThen = false
			elseif BLOCK[word] then
				depthLeft += BLOCK[word]
				if depthLeft == 0 then finish = s break end
			end
		end
		local body = string.sub(code, pos, finish)
		if not (string.find(body, "%f[%w_]wait%s*%(") or string.find(body, ":%s*Wait%s*%(") or string.find(body, "coroutine%.yield")
			or string.find(body, "%f[%w_]break%f[^%w_]") or string.find(body, "%f[%w_]return%f[^%w_]")) then
			add(pos, "Loop never yields", "No task.wait(), :Wait(), break or return in this loop. It will freeze the game.")
		end
	end

	for pos in string.gmatch(code, "()Instance%.new%s*%([^,()]*,") do
		add(pos, "Instance.new parent argument", "Set properties first and Parent last instead of passing the parent to Instance.new.")
	end

	table.sort(findings, function(a, b) return a.line < b.line end)
	return findings
end

----------------------------------------------------------------------------------------------------
-- Studio side
----------------------------------------------------------------------------------------------------
local SCAN_SERVICES = { "Workspace", "ServerScriptService", "ServerStorage", "ReplicatedStorage", "ReplicatedFirst", "StarterGui", "StarterPack", "StarterPlayer" }

local function sourceOf(s: LuaSourceContainer): string
	local ok, text = pcall(ScriptEditorService.GetEditorSource, ScriptEditorService, s)
	return if ok then text else (s :: any).Source
end

local function openAt(s: LuaSourceContainer, line: number)
	local ok = pcall(function()
		ScriptEditorService:OpenScriptDocumentAsync(s)
		local doc = ScriptEditorService:FindScriptDocument(s)
		if doc then doc:ForceSetSelectionAsync(line, 1, line, 1) end
	end)
	if not ok then pcall(function() (plugin :: any):OpenScript(s, line) end) end
end

-- "ServerScriptService → ModuleScript named CoinStore" → parent instance + script name.
local function placeTemplate(t: Template): (Instance?, string)
	local parts = string.split(t.placement, " → ")
	local name = string.match(parts[#parts], "named%s+([%w_]+)") or string.match(t.code, "^%-%-%s*([%w_]+)") or "Script"
	local path = table.move(parts, 1, #parts - 1, 1, {})
	if #path > 1 and (path[1] == "Workspace" or path[1] == "StarterGui") then
		local selected = Selection:Get()[1]
		if not selected then return nil, "Select the " .. path[#path] .. " to put it in, then click again." end
		return selected, name
	end
	local node: Instance = game:GetService(path[1] :: any)
	for i = 2, #path do
		local child = node:FindFirstChild(path[i])
		if not child then return nil, "Could not find " .. path[i] .. " in " .. node:GetFullName() .. "." end
		node = child
	end
	return node, name
end

local function theme(c: Enum.StudioStyleGuideColor, m: Enum.StudioStyleGuideModifier?): Color3
	return settings().Studio.Theme:GetColor(c, m)
end

local toolbar = plugin:CreateToolbar("Dev Companion")
local button = toolbar:CreateButton("Dev Companion", "Scan scripts for common mistakes and insert starter scripts", "rbxasset://textures/StudioToolbox/AssetPreview/Code.png")
button.ClickableWhenViewportHidden = true
local widget = plugin:CreateDockWidgetPluginGui("DevCompanion", DockWidgetPluginGuiInfo.new(Enum.InitialDockState.Right, false, false, 360, 520, 280, 300))
widget.Title = "Dev Companion"
button.Click:Connect(function() widget.Enabled = not widget.Enabled end)
widget:GetPropertyChangedSignal("Enabled"):Connect(function() button:SetActive(widget.Enabled) end)

local function new(class: string, props: { [string]: any }, parent: Instance?): any
	local inst = Instance.new(class)
	for k, v in props do (inst :: any)[k] = v end
	inst.Parent = parent
	return inst
end
local function pad(inst: Instance, n: number)
	new("UIPadding", { PaddingTop = UDim.new(0, n), PaddingBottom = UDim.new(0, n), PaddingLeft = UDim.new(0, n), PaddingRight = UDim.new(0, n) }, inst)
end

local root = new("Frame", { Size = UDim2.fromScale(1, 1), BorderSizePixel = 0 }, widget)
local tabs = new("Frame", { Size = UDim2.new(1, 0, 0, 40), BackgroundTransparency = 1 }, root)
new("UIListLayout", { FillDirection = Enum.FillDirection.Horizontal, Padding = UDim.new(0, 6) }, tabs)
pad(tabs, 6)
local status = new("TextLabel", { Position = UDim2.fromOffset(0, 40), Size = UDim2.new(1, 0, 0, 36), BackgroundTransparency = 1, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.BuilderSans, TextSize = 14, Text = "" }, root)
pad(status, 8)
local list = new("ScrollingFrame", { Position = UDim2.fromOffset(0, 76), Size = UDim2.new(1, 0, 1, -76), BackgroundTransparency = 1, BorderSizePixel = 0, ScrollBarThickness = 6, AutomaticCanvasSize = Enum.AutomaticSize.Y, CanvasSize = UDim2.new() }, root)
new("UIListLayout", { Padding = UDim.new(0, 6), SortOrder = Enum.SortOrder.LayoutOrder }, list)
pad(list, 8)

local function paint()
	root.BackgroundColor3 = theme(Enum.StudioStyleGuideColor.MainBackground)
	status.TextColor3 = theme(Enum.StudioStyleGuideColor.DimmedText)
	for _, d in root:GetDescendants() do
		if d:IsA("TextButton") then
			d.BackgroundColor3 = theme(Enum.StudioStyleGuideColor.Button, if d:GetAttribute("selected") then Enum.StudioStyleGuideModifier.Selected else nil)
			d.TextColor3 = theme(Enum.StudioStyleGuideColor.ButtonText)
		elseif d:IsA("TextLabel") and d ~= status then
			d.TextColor3 = theme(if d:GetAttribute("dim") then Enum.StudioStyleGuideColor.DimmedText else Enum.StudioStyleGuideColor.MainText)
		end
	end
end
settings().Studio.ThemeChanged:Connect(paint)

local function card(title: string, detail: string, onClick: () -> ()): TextButton
	local b = new("TextButton", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, AutoButtonColor = true, Text = "", LayoutOrder = #list:GetChildren() }, list)
	new("UICorner", { CornerRadius = UDim.new(0, 6) }, b)
	new("UIListLayout", { Padding = UDim.new(0, 2) }, b)
	pad(b, 8)
	new("TextLabel", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.BuilderSansBold, TextSize = 15, Text = title }, b)
	new("TextLabel", { Size = UDim2.new(1, 0, 0, 0), AutomaticSize = Enum.AutomaticSize.Y, BackgroundTransparency = 1, TextWrapped = true, TextXAlignment = Enum.TextXAlignment.Left, Font = Enum.Font.BuilderSans, TextSize = 13, Text = detail }, b):SetAttribute("dim", true)
	b.Activated:Connect(onClick)
	return b
end

local function clear()
	for _, c in list:GetChildren() do
		if c:IsA("GuiObject") then c:Destroy() end
	end
end

local function showScan()
	clear()
	local scanned, total = 0, 0
	for _, serviceName in SCAN_SERVICES do
		local ok, service = pcall(game.GetService, game, serviceName :: any)
		if ok and service then
			for _, d in service:GetDescendants() do
				if d:IsA("LuaSourceContainer") then
					scanned += 1
					local okCheck, findings = pcall(check, sourceOf(d))
					for _, f in (if okCheck then findings else {}) :: { Finding } do
						total += 1
						if total <= 300 then
							card(f.rule .. " · " .. d.Name .. ":" .. f.line, d:GetFullName() .. "\n" .. f.message, function() openAt(d, f.line) end)
						end
					end
				end
			end
		end
	end
	status.Text = string.format("Scanned %d scripts · %d things to review%s. Click one to jump to it.", scanned, total, if total > 300 then " (showing 300)" else "")
	if total == 0 then card("Nothing flagged", "These checks found no common mistakes. That does not prove your scripts are bug-free; playtest too.", function() end) end
	paint()
end

local function showTemplates()
	clear()
	status.Text = "Click to insert. Scripts that belong inside a part or button go into your current selection."
	for _, t in TEMPLATES do
		card(t.title, t.category .. " · " .. t.placement, function()
			local parent, nameOrError = placeTemplate(t)
			if not parent then status.Text = nameOrError return end
			local recording = ChangeHistoryService:TryBeginRecording("Insert " .. t.title)
			local s = Instance.new(t.kind :: any)
			s.Name = nameOrError;
			(s :: any).Source = t.code
			s.Parent = parent
			if recording then ChangeHistoryService:FinishRecording(recording, Enum.FinishRecordingOperation.Commit) end
			Selection:Set({ s })
			openAt(s, 1)
			status.Text = "Inserted " .. s:GetFullName() .. ". Read its first comment for setup."
		end)
	end
	paint()
end

local tabButtons = {}
local function tab(label: string, show: () -> ())
	local b = new("TextButton", { Size = UDim2.new(0.5, -3, 1, 0), Font = Enum.Font.BuilderSansBold, TextSize = 15, Text = label }, tabs)
	new("UICorner", { CornerRadius = UDim.new(0, 6) }, b)
	table.insert(tabButtons, b)
	b.Activated:Connect(function()
		for _, other in tabButtons do other:SetAttribute("selected", other == b) end
		show()
	end)
	return b
end
local scanTab = tab("Scan scripts", showScan)
tab("Insert template", showTemplates)
scanTab:SetAttribute("selected", true)
status.Text = "Press Scan scripts to check every script in this place."
paint()
