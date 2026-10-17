// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, mkdir } from "node:fs/promises";
import path from "node:path";

// An in-memory stand-in for a Vercel Blob store, shared by every "server" in the test.
const store = vi.hoisted(() => new Map<string, { bytes: Buffer; uploadedAt: Date }>());
vi.mock("@vercel/blob", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@vercel/blob")>();
  return {
    ...actual,
    put: vi.fn(async (pathname: string, body: Buffer | string, options: { access: string }) => {
      expect(options.access).toBe("private");
      store.set(pathname, { bytes: typeof body === "string" ? Buffer.from(body) : Buffer.from(body), uploadedAt: new Date() });
      return { pathname, url: `https://blob.test/${pathname}` };
    }),
    get: vi.fn(async (pathname: string, options: { headers?: { range?: string } }) => {
      const saved = store.get(pathname);
      if (!saved) return null;
      const match = /^bytes=(\d+)-(\d+)$/.exec(options.headers?.range ?? "");
      const bytes = match ? saved.bytes.subarray(Number(match[1]), Number(match[2]) + 1) : saved.bytes;
      const headers = new Headers(match ? { "content-range": `bytes ${match[1]}-${match[2]}/${saved.bytes.length}` } : {});
      return { statusCode: 200, stream: new Response(bytes).body, headers, blob: {} };
    }),
    head: vi.fn(async (pathname: string) => {
      const saved = store.get(pathname);
      if (!saved) throw new actual.BlobNotFoundError();
      return { size: saved.bytes.length, uploadedAt: saved.uploadedAt, pathname };
    }),
    list: vi.fn(async ({ prefix }: { prefix: string }) => ({
      blobs: [...store].filter(([pathname]) => pathname.startsWith(prefix)).map(([pathname, saved]) => ({ pathname, url: pathname, uploadedAt: saved.uploadedAt, size: saved.bytes.length })),
      hasMore: false,
    })),
    del: vi.fn(async (urls: string[]) => { urls.forEach((url) => store.delete(url)); }),
  };
});

import { advanceFilm, startFilm } from "@/lib/film/service";
import { readFilm, savedFilmCount, saveFilm } from "@/lib/film/store";
import { assembleFilm } from "@/lib/film/media";
import { POST as plan } from "@/app/api/films/route";
import { GET as media } from "@/app/api/films/[id]/media/route";

const newServer = async () => vi.stubEnv("FILM_DATA_DIR", await mkdtemp(path.resolve(".data/test-runs/blob-")));

beforeEach(async () => {
  store.clear();
  await mkdir(".data/test-runs", { recursive: true });
  await newServer();
  vi.stubEnv("BLOB_READ_WRITE_TOKEN", "vercel_blob_rw_test");
  vi.stubEnv("VIDEO_PROVIDER", "mock");
});
afterEach(() => { vi.unstubAllEnvs(); });

describe("films kept in Blob storage", () => {
  it("lets a different server assemble and play a film another server started", async () => {
    const brief = { title: "Fern the fox", character: "An orange fox in a red coat", story: "A fox helps a rabbit cross a stream.", style: "Watercolour", aspectRatio: "16:9" };
    const response = await plan(new Request("http://localhost/api/films", { method: "POST", body: JSON.stringify({ session: "session_blob_test123", key: "request_blob_test123", brief }) }));
    expect(response.status).toBe(200);
    const { film: planned } = await response.json();

    // Server A makes the four clips.
    const film = (await readFilm(planned.id))!;
    await startFilm(film, film.scenes.map((scene) => scene.description), film.narration, false);
    for (let i = 0; i < 4; i++) await advanceFilm(film);
    expect(film.scenes.every((scene) => scene.status === "ready")).toBe(true);

    // Server B starts empty, so it must fetch the film and clips from storage.
    await newServer();
    const resumed = (await readFilm(film.id))!;
    expect(resumed.scenes.every((scene) => scene.status === "ready")).toBe(true);
    resumed.revision++;
    resumed.output = await assembleFilm(resumed);
    await saveFilm(resumed);
    expect(store.has(`films/${film.id}/${resumed.output}`)).toBe(true);

    // Server C plays it, and each response stays under the hosting size limit.
    await newServer();
    const context = { params: Promise.resolve({ id: film.id }) };
    const playback = await media(new Request(`http://localhost/api/films/${film.id}/media`, { headers: { cookie: `sai-film-session=${film.session}`, range: "bytes=0-" } }), context);
    expect(playback.status).toBe(206);
    const size = store.get(`films/${film.id}/${resumed.output}`)!.bytes.length;
    expect(playback.headers.get("content-range")).toBe(`bytes 0-${Math.min(size, 4 * 1024 * 1024) - 1}/${size}`);
    expect((await playback.arrayBuffer()).byteLength).toBeLessThanOrEqual(4 * 1024 * 1024);
  }, 120_000);

  it("clears out films nobody has touched for over two days", async () => {
    const old = new Date(Date.now() - 50 * 3600_000);
    store.set(`films/${"b".repeat(32)}/film.json`, { bytes: Buffer.from("{}"), uploadedAt: old });
    store.set(`films/${"b".repeat(32)}/scene-0-1.mp4`, { bytes: Buffer.from("x"), uploadedAt: old });
    store.set(`films/${"c".repeat(32)}/film.json`, { bytes: Buffer.from("{}"), uploadedAt: new Date() });
    expect(await savedFilmCount()).toBe(1);
    expect([...store.keys()]).toEqual([`films/${"c".repeat(32)}/film.json`]);
  });
});
