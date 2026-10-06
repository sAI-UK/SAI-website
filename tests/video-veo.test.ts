import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { veoVideoProvider, validVideoUri } from "@/lib/video/providers/veo";
import { buildProviderPrompt } from "@/lib/video/prompt-builder";
import { validateVideoSettings, estimatedVideoCost } from "@/lib/video/settings";
import { createDirectJob } from "@/lib/video/job-service";
import { toPublicJob, videoJobRepository } from "@/lib/video/repository";
import { POST } from "@/app/api/video/jobs/route";
import { GET as media } from "@/app/api/video/jobs/[jobId]/media/route";
import { resetRateLimitsForTests } from "@/lib/video/rate-limit";
import type { StructuredStory, VideoSettings } from "@/lib/video/types";
const story: StructuredStory = { title: "The lantern", mainCharacter: "a paper fox", setting: "a garden", action: "The fox returns a lantern to a dragon.", value: "Kindness", style: "Paper cut-out", mood: "Hopeful", dialogue: "Here you go!", duration: 8 };
const settings: VideoSettings = { model: "veo-3.1-fast-generate-preview", resolution: "720p", aspectRatio: "9:16" };
const operation = "models/veo-3.1-fast-generate-preview/operations/test123";
const uri = "https://generativelanguage.googleapis.com/v1beta/files/video123:download?alt=media";
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
beforeEach(() => { videoJobRepository.clear(); resetRateLimitsForTests(); vi.stubEnv("GEMINI_API_KEY", "test-secret"); vi.stubEnv("VIDEO_PROVIDER", "veo"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });
describe("Veo integration", () => {
  it("explains a people-setting rejection without leaking raw provider text", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ error: { message: "allow_adult for personGeneration is currently not supported. test-secret" } }, 400)));
    const input = { story, providerPrompt: "test", duration: 8 as const, aspectRatio: "16:9" as const, resolutionTier: "standard" as const, safetyLevel: "strict" as const };
    try { await veoVideoProvider.createJob(input); throw new Error("Expected rejection"); }
    catch (error) { expect((error as Error).message).toContain("people-generation setting"); expect((error as Error).message).not.toContain("test-secret"); }
  });
  it("translates fields and uses supported API parameters", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ name: operation })); vi.stubGlobal("fetch", fetcher);
    const prompt = buildProviderPrompt(story, settings);
    for (const value of [story.title, story.mainCharacter, story.setting, story.action, story.dialogue!, "9:16", "8-second"]) expect(prompt).toContain(value);
    await veoVideoProvider.createJob({ story, providerPrompt: prompt, duration: 8, aspectRatio: "9:16", settings, resolutionTier: "standard", safetyLevel: "strict" });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain("veo-3.1-fast-generate-preview:predictLongRunning");
    expect(JSON.parse(init.body).parameters).toEqual({ sampleCount: 1, durationSeconds: 8, aspectRatio: "9:16", resolution: "720p" });
    expect(init.headers["x-goog-api-key"]).toBe("test-secret");
  });
  it("handles generating, completed and content-filtered operations", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ done: false })).mockResolvedValueOnce(json({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri } }] } } })).mockResolvedValueOnce(json({ done: true, response: { generateVideoResponse: { raiMediaFilteredCount: 1 } } })));
    expect(await veoVideoProvider.getJobStatus(operation)).toEqual({ status: "generating" });
    expect(await veoVideoProvider.getJobStatus(operation)).toMatchObject({ status: "completed", assetReference: uri });
    expect(await veoVideoProvider.getJobStatus(operation)).toMatchObject({ status: "failed", errorCode: "GOOGLE_CONTENT_FILTERED" });
  });
  it("rejects incompatible resolution and duration and calculates costs", () => {
    expect(validateVideoSettings({ ...settings, resolution: "1080p" }, 4)).toBeUndefined();
    expect(validateVideoSettings({ ...settings, model: "arbitrary" }, 8)).toBeUndefined();
    expect(estimatedVideoCost(settings, 8)).toBe(0.8);
    expect(estimatedVideoCost({ ...settings, model: "veo-3.1-generate-preview" }, 8)).toBe(3.2);
  });
  it("deduplicates concurrent billable submissions", async () => {
    const fetcher = vi.fn().mockResolvedValue(json({ name: operation })); vi.stubGlobal("fetch", fetcher);
    const input = { story, settings, sessionId: "session_test12345", idempotencyKey: "request_test12345" };
    const results = await Promise.all([createDirectJob(input), createDirectJob(input)]);
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(results[0].job.id).toBe(results[1].job.id);
    expect(results[1].duplicate).toBe(true);
  });
  it("starts through the route without acknowledgements or teacher approval", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ name: operation })));
    const response = await POST(new Request("http://localhost/api/video/jobs", { method: "POST", body: JSON.stringify({ story, settings, sessionId: "session_route12345", idempotencyKey: "request_route12345" }) }));
    const data = await response.json();
    expect(response.status).toBe(201); expect(data.job.status).toBe("generating");
    expect(JSON.stringify(data)).not.toContain("test-secret");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
  it("gives useful access and quota errors without exposing provider responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ error: { message: "test-secret" } }, 403)).mockResolvedValueOnce(json({}, 429)));
    const input = { story, providerPrompt: "test", duration: 8 as const, aspectRatio: "16:9" as const, resolutionTier: "standard" as const, safetyLevel: "strict" as const };
    await expect(veoVideoProvider.createJob(input)).rejects.toThrow(/access/);
    await expect(veoVideoProvider.createJob(input)).rejects.toThrow(/quota/);
  });
  it("protects media ownership and streams downloads without leaking the key on redirects", async () => {
    vi.stubEnv("VIDEO_PROVIDER", "mock");
    const { job } = await createDirectJob({ story, settings, sessionId: "session_media12345", idempotencyKey: "request_media12345" });
    const complete = (await videoJobRepository.update(job.id, { providerName: "veo", status: "completed", resultAssetReference: uri }))!;
    expect(toPublicJob(complete).resultAssetReference).toBe(`/api/video/jobs/${job.id}/media`);
    const context = { params: Promise.resolve({ jobId: job.id }) };
    expect((await media(new Request("http://localhost/media"), context)).status).toBe(401);
    expect((await media(new Request("http://localhost/media", { headers: { cookie: "sai-video-session=session_wrong12345" } }), context)).status).toBe(404);
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "https://storage.googleapis.com/generated/video.mp4" } })).mockResolvedValueOnce(new Response("video-bytes", { headers: { "content-type": "video/mp4" } })); vi.stubGlobal("fetch", fetcher);
    const response = await media(new Request("http://localhost/media?download=1", { headers: { cookie: "sai-video-session=session_media12345" } }), context);
    expect(response.status).toBe(200); expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(await response.text()).toBe("video-bytes");
    expect(fetcher.mock.calls[1][1].headers).not.toHaveProperty("x-goog-api-key");
    expect(validVideoUri("https://attacker.example/video.mp4")).toBe(false);
  });
});
