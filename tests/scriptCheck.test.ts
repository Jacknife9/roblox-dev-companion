import test from 'node:test';
import assert from 'node:assert/strict';
import { checkScript, maskLuau } from '../src/core/scriptCheck';
test('checker ignores comments and strings while reporting real legacy calls with line numbers', () => {
  const script = '-- wait()\nlocal s = "wait()"\n--[=[\nstore:GetAsync("x")\n]=]\nwait(1)\ntask.wait(1)';
  assert.equal(maskLuau(script).length, script.length); const r = checkScript(script); assert.equal(r.length, 1); assert.equal(r[0]?.line, 6);
});
test('DataStore checker recognizes a surrounding protected call rather than unrelated pcall text', () => {
  assert.equal(checkScript('local ok = pcall(function() return store:GetAsync(key) end)').length, 0);
  assert.equal(checkScript('pcall(function() print(1) end)\nstore:SetAsync(key, value)')[0]?.rule, 'DataStore error handling');
});
test('remote checker flags client-controlled values and always prompts a server-side review', () => {
  assert.equal(checkScript('remote.OnServerEvent:Connect(function(player, amount)\n coins.Value = amount\nend)')[0]?.rule, 'Client value used directly');
  assert.equal(checkScript('remote.OnServerEvent:Connect(function(player, action)\n if typeof(action) ~= "string" then return end\nend)')[0]?.rule, 'RemoteEvent review');
  assert.throws(() => checkScript('')); assert.throws(() => checkScript('x'.repeat(100_001)));
});
