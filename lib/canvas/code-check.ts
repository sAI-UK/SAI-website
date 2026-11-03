import { parse, type Node } from "acorn";

// Checks a movie script before it runs in the sandboxed player.
// The sandbox (no network, no access to the page) is the real safety boundary;
// these checks catch broken or unsuitable code early and add loop guards so a
// runaway loop cannot freeze the browser tab.

export const maxScriptLength = 20_000;

const blockedNames = new Set([
  "eval", "Function", "fetch", "XMLHttpRequest", "WebSocket", "EventSource", "Worker", "SharedWorker",
  "importScripts", "navigator", "document", "window", "globalThis", "self", "parent", "top", "opener",
  "frames", "localStorage", "sessionStorage", "indexedDB", "caches", "location", "postMessage",
  "setTimeout", "setInterval", "requestAnimationFrame", "Reflect", "Proxy", "WebAssembly", "Image",
  "Audio", "alert", "confirm", "prompt", "open", "close", "arguments",
]);
const blockedProperties = new Set(["constructor", "__proto__", "prototype", "__defineGetter__", "__defineSetter__", "__lookupGetter__", "__lookupSetter__"]);
const blockedNodes: Record<string, string> = {
  ImportExpression: "import()",
  ImportDeclaration: "import",
  ExportNamedDeclaration: "export",
  ExportDefaultDeclaration: "export",
  ExportAllDeclaration: "export",
  MetaProperty: "import.meta / new.target",
  WithStatement: "with",
  DebuggerStatement: "debugger",
};
const loopTypes = new Set(["ForStatement", "ForInStatement", "ForOfStatement", "WhileStatement", "DoWhileStatement"]);

export type CheckResult = { ok: true; code: string } | { ok: false; error: string };

type AnyNode = Node & Record<string, unknown>;

function children(node: AnyNode): AnyNode[] {
  const found: AnyNode[] = [];
  for (const [key, value] of Object.entries(node)) {
    if (key === "loc" || key === "range") continue;
    if (Array.isArray(value)) value.forEach((item) => { if (item && typeof item.type === "string") found.push(item); });
    else if (value && typeof value === "object" && typeof (value as AnyNode).type === "string") found.push(value as AnyNode);
  }
  return found;
}

/** Returns the script with loop guards added, or a short, readable error. */
export function checkMovieScript(source: string): CheckResult {
  if (typeof source !== "string" || !source.trim()) return { ok: false, error: "The script is empty." };
  if (source.length > maxScriptLength) return { ok: false, error: `The script is longer than ${maxScriptLength} characters.` };
  if (/<\/script|<!--|-->/i.test(source)) return { ok: false, error: "The script contains HTML comment or script tags." };

  let program: AnyNode;
  try {
    program = parse(source, { ecmaVersion: 2022, sourceType: "script" }) as unknown as AnyNode;
  } catch (error) {
    return { ok: false, error: `Syntax error: ${error instanceof Error ? error.message : "could not read the script"}.` };
  }

  const inserts: { at: number; text: string }[] = [];
  const stack: { node: AnyNode; parent: AnyNode | null }[] = [{ node: program, parent: null }];
  while (stack.length) {
    const { node, parent } = stack.pop()!;
    if (blockedNodes[node.type]) return { ok: false, error: `"${blockedNodes[node.type]}" is not allowed in movie scripts.` };

    if (node.type === "Identifier") {
      const name = node.name as string;
      const isPropertyName = parent && ((parent.type === "MemberExpression" && parent.property === node && !parent.computed) || (parent.type === "Property" && parent.key === node && !parent.computed && !parent.shorthand) || (parent.type === "MethodDefinition" && parent.key === node) || (parent.type === "PropertyDefinition" && parent.key === node));
      if (name.startsWith("__sai")) return { ok: false, error: `"${name}" is reserved.` };
      if (blockedProperties.has(name)) return { ok: false, error: `"${name}" is not allowed in movie scripts.` };
      if (!isPropertyName && blockedNames.has(name)) return { ok: false, error: `"${name}" is not available in movie scripts.` };
    }
    if (node.type === "Literal" && typeof node.value === "string" && parent?.type === "MemberExpression" && parent.computed && parent.property === node) {
      const name = node.value;
      if (blockedProperties.has(name) || blockedNames.has(name) || name.startsWith("__sai")) return { ok: false, error: `"${name}" is not allowed in movie scripts.` };
    }

    if (loopTypes.has(node.type)) {
      const body = node.body as AnyNode;
      if (body.type === "BlockStatement") inserts.push({ at: body.start + 1, text: "__saiGuard();" });
      else { inserts.push({ at: body.start, text: "{__saiGuard();" }); inserts.push({ at: body.end, text: "}" }); }
    }

    for (const child of children(node)) stack.push({ node: child, parent: node });
  }

  let code = source;
  for (const insert of inserts.sort((a, b) => b.at - a.at)) code = code.slice(0, insert.at) + insert.text + code.slice(insert.at);
  return { ok: true, code };
}

/** Removes markdown fences and chatter the model sometimes wraps around code. */
export function extractScript(reply: string) {
  const fenced = reply.match(/```(?:javascript|js)?\s*\n([\s\S]*?)```/i);
  return (fenced ? fenced[1] : reply).trim();
}
