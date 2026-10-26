export type Finding = { line: number; rule: string; message: string };
// Mask comments/strings while preserving positions and newlines. This is a pattern checker, not a Luau parser.
export function maskLuau(source: string) {
  let result = '', i = 0;
  const blank = (s: string) => s.replace(/[^\n\r]/g, ' ');
  while (i < source.length) {
    const start = i, comment = source.slice(i, i + 2) === '--';
    const long = source.slice(i + (comment ? 2 : 0)).match(/^\[(=*)\[/);
    if (long) {
      const close = ']' + long[1] + ']'; const end = source.indexOf(close, i + (comment ? 2 : 0) + long[0].length);
      i = end < 0 ? source.length : end + close.length; result += blank(source.slice(start, i)); continue;
    }
    if (comment) { const end = source.indexOf('\n', i); i = end < 0 ? source.length : end; result += blank(source.slice(start, i)); continue; }
    const quote = source[i];
    if (quote === '"' || quote === "'" || quote === '`') {
      i++; while (i < source.length) { if (source[i] === '\\') { i += 2; continue; } if (source[i++] === quote) break; }
      i = Math.min(i, source.length); result += blank(source.slice(start, i)); continue;
    }
    result += source[i++];
  }
  return result;
}
export function checkScript(source: string): Finding[] {
  if (!source.trim()) throw new Error('Paste a script to check.');
  if (source.length > 100_000) throw new Error('Check scripts up to 100,000 characters.');
  const code = maskLuau(source), findings: Finding[] = [];
  const lineAt = new Uint32Array(code.length + 1); let number = 1;
  for (let i = 0; i < code.length; i++) { lineAt[i] = number; if (code[i] === '\n') number++; }
  const line = (at: number) => lineAt[at]!;
  const add = (at: number, rule: string, message: string) => findings.push({ line: line(at), rule, message });
  for (const m of code.matchAll(/(?<![\w.:])(?:wait|spawn|delay)\s*\(/g)) add(m.index, 'Legacy scheduler', 'Prefer task.wait(), task.spawn() or task.delay() over the legacy global scheduler.');
  const calls = new Map<number, boolean>(); const stack: boolean[] = []; let protectedDepth = 0;
  // pcall(function() ... end) keeps its outer call open around the DataStore operation.
  for (let i = 0; i < code.length; i++) {
    if (code[i] === '(') { const name = code.slice(Math.max(0, i - 30), i).match(/([\w.]+)\s*$/)?.[1] ?? ''; const protectedCall = name === 'pcall' || name === 'xpcall'; stack.push(protectedCall); if (protectedCall) protectedDepth++; }
    if (code[i] === ')' && stack.pop()) protectedDepth--;
    if (code[i] === ':') calls.set(i, protectedDepth > 0);
  }
  for (const m of code.matchAll(/:\s*(GetAsync|SetAsync|UpdateAsync|IncrementAsync|RemoveAsync)\s*\(/g)) {
    if (!calls.get(m.index)) add(m.index, 'DataStore error handling', 'This DataStore-style call is not visibly inside pcall/xpcall. Handle failures and retry with backoff; never replace failed loads with default saved data.');
  }
  for (const m of code.matchAll(/OnServerEvent\s*:\s*Connect\s*\(\s*function\s*\(([^)]*)\)/g)) {
    const clientArguments = m[1]!.split(',').slice(1).map(p => p.trim().split(':')[0]!).filter(p => /^[A-Za-z_]\w*$/.test(p));
    const body = code.slice(m.index + m[0].length, m.index + m[0].length + 3000);
    const direct = clientArguments.some(arg => new RegExp(`\\.Value\\s*(?:[+*/-]?=)\\s*${arg}\\b`).test(body));
    add(m.index, direct ? 'Client value used directly' : 'RemoteEvent review', direct ? 'A client argument appears to write a Value directly. Derive rewards/costs from server-owned data and validate permissions, types, ranges and rate limits.' : 'Review this server callback: validate argument types/ranges, ownership, distance and cooldowns. A client request is never proof of a reward or purchase.');
  }
  for (const m of code.matchAll(/\bwhile\s+true\s+do\b/g)) {
    // Walk block keywords to find this loop's end; `then` after elseif continues the same block.
    const words = /\b(do|then|function|repeat|end|until|elseif)\b/g; words.lastIndex = m.index + m[0].length;
    let depth = 1, end = code.length, skipThen = false;
    for (let w; (w = words.exec(code));) {
      const k = w[1]; if (k === 'elseif') { skipThen = true; continue; }
      if (k === 'then' && skipThen) { skipThen = false; continue; }
      depth += k === 'end' || k === 'until' ? -1 : 1; if (!depth) { end = w.index; break; }
    }
    if (!/\bwait\s*\(|:\s*Wait\s*\(|\bcoroutine\.yield\b|\bbreak\b|\breturn\b/.test(code.slice(m.index, end))) add(m.index, 'Loop never yields', 'This while true loop has no visible task.wait(), :Wait(), break or return. A loop that never yields freezes the server or client.');
  }
  for (const m of code.matchAll(/\bInstance\.new\s*\([^,()]*,/g)) add(m.index, 'Instance.new parent argument', 'Create the instance, set its properties, then set Parent last. Passing the parent to Instance.new makes Roblox replicate every later property change.');
  for (const m of code.matchAll(/:\s*(connect|disconnect|Remove)\s*\(/g)) add(m.index, 'Deprecated method', `:${m[1]}() is deprecated. Use ${m[1] === 'Remove' ? ':Destroy()' : ':' + m[1]![0]!.toUpperCase() + m[1]!.slice(1) + '()'} instead.`);
  return findings.slice(0, 100).sort((a, b) => a.line - b.line);
}
