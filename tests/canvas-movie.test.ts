// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkMovieScript, extractScript } from "@/lib/canvas/code-check";
import { generateMovie, validateMovieRequest } from "@/lib/canvas/generator";
import { movieTemplates } from "@/lib/canvas/templates";
import { showcaseScript } from "@/lib/canvas/showcase";

beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-private-key"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function reply(...texts: string[]) {
  const fetcher = vi.fn();
  for (const text of texts) fetcher.mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
const request = (extra = {}) => validateMovieRequest({ story: "A dragon is scared of the dark but finds a firefly friend.", template: "journey", drawing: { hasHero: true }, ...extra });

describe("movie script checks", () => {
  it("accepts every template and the showcase", () => {
    for (const template of movieTemplates) expect(checkMovieScript(template.code), template.id).toMatchObject({ ok: true });
    expect(checkMovieScript(showcaseScript)).toMatchObject({ ok: true });
  });

  it.each([
    ["fetch('https://example.com')", "fetch"],
    ["window.parent.postMessage('x', '*')", "window"],
    ["const f = (() => {}).constructor; f('x')()", "constructor"],
    ["const f = [][\"constructor\"]", "constructor"],
    ["eval('1')", "eval"],
    ["import('x')", "import()"],
    ["setTimeout(() => {}, 10)", "setTimeout"],
    ["const x = '</script><script>alert(1)'", "script tags"],
    ["__saiGuard = () => {}", "reserved"],
  ])("rejects %s", (code, expected) => {
    const result = checkMovieScript(code);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain(expected);
  });

  it("allows harmless property names such as options.top", () => {
    expect(checkMovieScript("const o = { top: 1, open: true }; o.top = 2;")).toMatchObject({ ok: true });
  });

  it("reports syntax errors", () => {
    const result = checkMovieScript("movie.scene({ duration: 4 }, () => {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/^Syntax error/);
  });

  it("adds a guard to every loop so runaway loops stop", () => {
    const result = checkMovieScript("let n = 0; while (true) n++; for (;;) { n--; } do n++; while (n < 5);");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.code.match(/__saiGuard\(\)/g)).toHaveLength(3);
    let calls = 0;
    const guard = () => { if (++calls > 1000) throw new Error("stopped"); };
    expect(() => new Function("__saiGuard", result.code)(guard)).toThrow("stopped");
  });

  it("strips markdown fences from model replies", () => {
    expect(extractScript("Here you go:\n```javascript\nmovie.end('Bye');\n```\nEnjoy!")).toBe("movie.end('Bye');");
  });
});

describe("movie generation", () => {
  it("returns the model's checked script", async () => {
    const fetcher = reply("```js\nmovie.scene({ duration: 4 }, () => { hero.hop(); });\n```");
    const movie = await generateMovie(request(), false);
    expect(movie).toMatchObject({ source: "ai", script: "movie.scene({ duration: 4 }, () => { hero.hop(); });" });
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.contents[0].parts[0].text).toContain("A dragon is scared of the dark");
    expect(body.contents[0].parts[0].text).toContain("A Big Adventure");
  });

  it("asks the model to fix a script that fails the checks", async () => {
    const fetcher = reply("fetch('x')", "movie.scene({}, () => {});");
    const movie = await generateMovie(request(), false);
    expect(movie.source).toBe("ai");
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(JSON.parse(fetcher.mock.calls[1][1].body).contents[0].parts[0].text).toContain("YOUR PREVIOUS SCRIPT FAILED");
  });

  it("falls back to the template when both attempts fail", async () => {
    reply("document.body", "window.x");
    const movie = await generateMovie(request(), false);
    expect(movie.source).toBe("template");
    expect(movie.script).toBe(movieTemplates[0].code);
    expect(movie.note).toContain("template is playing");
  });

  it("plays the template without calling Google in demo mode", async () => {
    const fetcher = reply();
    const movie = await generateMovie(request({ template: "new-friend" }), true);
    expect(movie).toMatchObject({ source: "template", script: movieTemplates[2].code });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("validates requests", () => {
    expect(() => validateMovieRequest({ story: "hi" })).toThrow("between 3 and 1,500");
    expect(() => validateMovieRequest({ story: "A long enough story", template: "nope" })).toThrow("templates");
    expect(() => validateMovieRequest({ story: "A long enough story", preview: "data:text/html;base64,AAAA" })).toThrow("preview");
  });
});
