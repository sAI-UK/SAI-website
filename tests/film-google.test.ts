// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { google } from "@/lib/film/google";

beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-private-key"));
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

function reject(status: number, message: string, details: unknown[] = []) {
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { message, details } }), { status }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

describe("Google film error diagnostics", () => {
  it("preserves quota and retry details without leaking supplied content or credentials", async () => {
    const prompt = "A private story that must not appear in provider diagnostics";
    const fetcher = reject(429, `Quota exceeded test-private-key ${prompt}`, [
      { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel", quotaValue: "10", quotaDimensions: { model: "veo-3.1-fast-generate-preview", secret: "test-private-key" }, description: prompt }] },
      { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "42s" },
    ]);
    const error = await google("models/veo-3.1-fast-generate-preview:predictLongRunning", { prompt }).catch(error => error as Error);
    expect(error.message).toContain("GenerateRequestsPerDayPerProjectPerModel");
    expect(error.message).toContain("model veo-3.1-fast-generate-preview; limit 10");
    expect(error.message).toContain("after 42s");
    expect(error.message).not.toContain(prompt);
    expect(error.message).not.toContain("test-private-key");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not guess the quota when Google supplies no usable details", async () => {
    reject(429, "Quota exceeded", [null, { "@type": "type.googleapis.com/google.rpc.QuotaFailure", violations: [null, 2] }]);
    await expect(google("models/veo-3.1-fast-generate-preview:predictLongRunning", {})).rejects.toThrow("did not specify which quota");
  });
  it("distinguishes payment failures from rate limits", async () => {
    reject(402, "Payment required");
    await expect(google("models/veo-3.1-fast-generate-preview:predictLongRunning", {})).rejects.toThrow("AI Studio billing and prepaid balance");
  });
});
