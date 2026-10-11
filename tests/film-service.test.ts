// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import sharp from "sharp";
import { advanceFilm, retryScene, startFilm } from "@/lib/film/service";
import { filmPath, locked, publicFilm, readFilm, saveFilm } from "@/lib/film/store";
import { validateBrief } from "@/lib/film/planner";
import { ffmpegPath, saveNarration, assembleFilm } from "@/lib/film/media";
import { POST as plan } from "@/app/api/films/route";
import { POST as action, GET as status } from "@/app/api/films/[id]/route";
import { GET as media } from "@/app/api/films/[id]/media/route";
import type { Film } from "@/lib/film/types";

const operation = "models/veo-3.1-fast-generate-preview/operations/film123";
const uri = "https://generativelanguage.googleapis.com/v1beta/files/film123:download";
const json = (data: unknown) => new Response(JSON.stringify(data));
function fixture(): Film { return { id: "a".repeat(32), session: "session_film_test123", brief: { title: "Fern's bridge", character: "An orange fox in a red coat", story: "A fox helps a rabbit cross a stream.", style: "Watercolour", aspectRatio: "16:9" }, scenes: ["Meet the fox beside the stream", "The rabbit cannot cross the stream", "The fox makes a bridge from a branch", "The rabbit crosses and thanks the fox"].map(description => ({ description, status: "waiting", attempts: 0 })), narration: "A little kindness can make a big difference.", narrate: false, status: "draft", mode: "live", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600000).toISOString(), revision: 1, actions: [], attempts: 0 }; }
beforeEach(async () => { await mkdir(".data/test-runs", { recursive: true }); vi.stubEnv("FILM_DATA_DIR", await mkdtemp(path.resolve(".data/test-runs/film-"))); vi.stubEnv("GEMINI_API_KEY", "test-secret"); });
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("film job lifecycle", () => {
  it("submits a shared reference and resumes saved operations without duplicating generation", async () => {
    const film = fixture(); film.status = "generating"; film.brief.image = "data:image/png;base64,aW1hZ2U=";
    const fetcher = vi.fn().mockResolvedValueOnce(json({ name: operation })).mockResolvedValueOnce(json({ done: false })); vi.stubGlobal("fetch", fetcher);
    await saveFilm(film); await advanceFilm(film);
    const body = JSON.parse(fetcher.mock.calls[0][1].body);
    expect(body.instances[0].referenceImages[0].referenceType).toBe("asset");
    expect(body.instances[0].referenceImages[0].image).toEqual({ mimeType: "image/png", bytesBase64Encoded: "aW1hZ2U=" });
    expect(body.parameters).toMatchObject({ durationSeconds: 8, resolution: "720p", personGeneration: "allow_adult" });
    const recovered = (await readFilm(film.id))!; await advanceFilm(recovered);
    expect(fetcher.mock.calls.filter(call => call[1].method === "POST")).toHaveLength(1);
    expect(recovered.scenes[0].operation).toBe(operation);
    expect(JSON.stringify(publicFilm(recovered))).not.toContain("test-secret");
    expect(JSON.stringify(publicFilm(recovered))).not.toContain("base64");
    expect(JSON.stringify(publicFilm(recovered))).not.toContain(operation);
  });
  it("does not regenerate when polling or downloading fails", async () => {
    const film = fixture(); film.status = "generating"; film.scenes[0].status = "generating"; film.scenes[0].operation = operation;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await advanceFilm(film);
    expect(film.scenes[0].status).toBe("generating"); expect(film.attempts).toBe(0);
    expect(film.error).toContain("could not be reached");
  });
  it("reports Google's 400 reason safely and treats the scene as rejected", async () => {
    const film = fixture(); film.status = "generating";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { status: "INVALID_ARGUMENT", message: 'Unknown name "inlineData". API key test-secret' } }), { status: 400 })));
    await advanceFilm(film);
    expect(film.scenes[0].status).toBe("failed");
    expect(film.scenes[0].error).toContain('scene generation (400 INVALID_ARGUMENT): Unknown name "inlineData"');
    expect(film.scenes[0].error).not.toContain("test-secret");
    await retryScene(film, 0, "A revised opening scene", false);
    expect(film.scenes[0].status).toBe("waiting");
  });
  it("recovers older explicit 400 rejections without marking a charge uncertain", async () => {
    const film = fixture(); film.status = "failed"; film.scenes[0].status = "uncertain";
    film.scenes[0].error = "Google rejected this request (400). Check model access, billing and supported content.";
    await saveFilm(film);
    const recovered = (await readFilm(film.id))!;
    expect(recovered.scenes[0].status).toBe("failed");
    expect(recovered.scenes[0].error).toContain("updated request format");
  });
  it("marks interrupted submission uncertain and requires explicit acknowledgement", async () => {
    const film = fixture(); film.status = "generating"; film.scenes[0].status = "submitting";
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher);
    await advanceFilm(film);
    expect(fetcher).not.toHaveBeenCalled(); expect(film.scenes[0].status).toBe("uncertain");
    await expect(retryScene(film, 0, "A revised opening scene", false)).rejects.toThrow(/acknowledge/);
    await retryScene(film, 0, "A revised opening scene", true);
    expect(film.scenes[0].status).toBe("waiting");
  });
  it("retries just one scene and reuses completed clips and narration", async () => {
    const film = fixture(); film.status = "completed"; film.audio = "narration.wav"; film.output = "film-1.mp4";
    film.scenes.forEach((scene, i) => { scene.status = "ready"; scene.file = `scene-${i}.mp4`; scene.attempts = 1; });
    const preserved = JSON.stringify(film.scenes[0]);
    await retryScene(film, 2, "The fox gently places a branch across the stream", false);
    expect(JSON.stringify(film.scenes[0])).toBe(preserved); expect(film.scenes[2].file).toBeUndefined(); expect(film.audio).toBe("narration.wav"); expect(film.output).toBeUndefined();
  });
  it("enforces the clip budget before making a paid request", async () => {
    const film = fixture(); film.status = "generating"; film.attempts = 12;
    const fetcher = vi.fn(); vi.stubGlobal("fetch", fetcher); await advanceFilm(film);
    expect(fetcher).not.toHaveBeenCalled(); expect(film.status).toBe("failed");
  });
  it("serialises concurrent requests for a film", async () => {
    const order: number[] = [];
    await Promise.all([locked("same", async () => { order.push(1); await new Promise(resolve => setTimeout(resolve, 10)); order.push(2); }), locked("same", async () => { order.push(3); })]);
    expect(order).toEqual([1, 2, 3]);
  });
  it("validates and strips image metadata, rejects corrupt images and unsupported formats", async () => {
    const image = await sharp({ create: { width: 20, height: 20, channels: 3, background: "red" } }).png().toBuffer();
    const result = await validateBrief({ ...fixture().brief, image: `data:image/png;base64,${image.toString("base64")}` });
    expect(result.image).toMatch(/^data:image\/png;base64,/);
    await expect(validateBrief({ ...fixture().brief, image: "data:image/svg+xml;base64,AAAA" })).rejects.toThrow(/PNG/);
    await expect(validateBrief({ ...fixture().brief, image: "data:image/png;base64,AAAA" })).rejects.toThrow(/could not be read/);
  });
  it("enforces session ownership and keeps action retries idempotent", async () => {
    const film = fixture(); film.status = "completed"; film.scenes.forEach(scene => { scene.status = "ready"; }); await saveFilm(film);
    const context = { params: Promise.resolve({ id: film.id }) };
    expect((await status(new Request("http://localhost/api/films/id", { headers: { "x-film-session": "session_someone_else" } }), context)).status).toBe(404);
    const request = () => new Request("http://localhost/api/films/id", { method: "POST", headers: { "x-film-session": film.session }, body: JSON.stringify({ action: "retry-scene", key: "request_retry_test123", index: 1, description: "The rabbit pauses at the bank of the stream" }) });
    await action(request(), context); await action(request(), context);
    expect((await readFilm(film.id))?.revision).toBe(2);
  });
  it("saves a provider result locally and never exposes its remote URL", async () => {
    const film = fixture(); film.status = "generating"; film.scenes[0].status = "generating"; film.scenes[0].operation = operation; await saveFilm(film);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(json({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri } }] } } })).mockResolvedValueOnce(new Response("video bytes")));
    await advanceFilm(film); expect(film.scenes[0].status).toBe("ready");
    expect(await readFile(filmPath(film.id, film.scenes[0].file!), "utf8")).toBe("video bytes");
    expect(publicFilm(film).scenes[0].media).toContain("/api/films/");
  });
});

describe("real local video assembly", () => {
  it("exports exactly 30 seconds, replaces audio with one fitted narration, and serves ranges", async () => {
    vi.stubEnv("VIDEO_PROVIDER", "mock");
    const req = () => new Request("http://localhost/api/films", { method: "POST", body: JSON.stringify({ session: "session_export_test123", key: "request_export_test123", brief: fixture().brief }) });
    const response = await plan(req()); expect(response.status).toBe(200);
    const data = await response.json(); const film = (await readFilm(data.film.id))!;
    const duplicate = await (await plan(req())).json(); expect(duplicate.film.id).toBe(film.id);
    await startFilm(film, film.scenes.map(scene => scene.description), film.narration, false);
    for (let i = 0; i < 5; i++) await advanceFilm(film);
    expect(film.status).toBe("completed");
    const pcm = Buffer.alloc(48000 * 32); // 32 seconds verifies fitting, not truncation.
    film.audio = await saveNarration(film, pcm, "audio/L16");
    film.revision++; film.output = await assembleFilm(film); await saveFilm(film);
    const diagnostic = await new Promise<string>((resolve, reject) => { execFile(ffmpegPath(), ["-hide_banner", "-i", filmPath(film.id, film.output!)], { windowsHide: true }, (error, _stdout, stderr) => { if (error && !stderr.includes("Duration:")) reject(error); else resolve(stderr); }); });
    expect(diagnostic).toContain("Duration: 00:00:30.00"); expect(diagnostic).toContain("Audio: aac"); expect(diagnostic).toContain("1280x720");
    const context = { params: Promise.resolve({ id: film.id }) };
    const playback = await media(new Request(`http://localhost/api/films/${film.id}/media`, { headers: { cookie: `sai-film-session=${film.session}`, range: "bytes=0-99" } }), context);
    expect(playback.status).toBe(206); expect((await playback.arrayBuffer()).byteLength).toBe(100);
    expect((await media(new Request("http://localhost/media", { headers: { cookie: "sai-film-session=session_wrong1234" } }), context)).status).toBe(404);
    const invalid = await media(new Request("http://localhost/media", { headers: { cookie: `sai-film-session=${film.session}`, range: "bytes=100-1" } }), context);
    expect(invalid.status).toBe(416);
  }, 120_000);
});
