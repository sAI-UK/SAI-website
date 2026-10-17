import { readFile } from "node:fs/promises";
import { apiError, validSessionId } from "@/lib/video/http";
import { blobEnabled, filmBlobSize, getFilmBlob } from "@/lib/film/blob";
import { filmPath, readFilm } from "@/lib/film/store";
export const runtime = "nodejs";
// Hosted functions cap each response at about 4.5 MB, so playback is sent in pieces. Video players request the rest as needed.
const chunkSize = 4 * 1024 * 1024;

/** Where the video bytes come from: Blob storage when connected, otherwise the local .data folder. */
async function openMedia(id: string, file: string) {
  if (blobEnabled()) {
    const size = await filmBlobSize(id, file);
    if (size === null) return null;
    return {
      size,
      async read(start: number, end: number) {
        const saved = await getFilmBlob(id, file, `bytes=${start}-${end}`);
        if (!saved) throw new Error("The saved video could not be read.");
        const bytes = new Uint8Array(await new Response(saved.stream).arrayBuffer());
        // Storage normally returns just the requested range; trim in case it sent the whole file.
        return saved.headers.get("content-range") ? bytes : bytes.subarray(start, end + 1);
      },
    };
  }
  const bytes = await readFile(filmPath(id, file));
  return { size: bytes.length, read: async (start: number, end: number) => bytes.subarray(start, end + 1) };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = request.headers.get("cookie")?.split(";").map(part => part.trim()).find(part => part.startsWith("sai-film-session="))?.split("=")[1];
  if (!validSessionId(session) || !/^[a-f0-9]{32}$/.test(id)) return apiError("This film session could not be verified.", 401);
  try {
    const film = await readFilm(id);
    if (!film || film.session !== session) return apiError("Film not found.", 404);
    if (Date.parse(film.expiresAt) <= Date.now()) return apiError("This film has expired.", 410);
    const url = new URL(request.url); const index = url.searchParams.get("scene");
    if (index !== null && !/^[0-3]$/.test(index)) return apiError("Unknown scene.");
    const file = index === null ? film.output : film.scenes[Number(index)]?.file;
    if (!file) return apiError("This video is not ready.", 409);
    const media = await openMedia(id, file);
    if (!media) return apiError("The saved video could not be read.", 404);
    const { size } = media;
    const headers = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
    const download = url.searchParams.get("download") === "1";
    if (download) headers.set("Content-Disposition", `attachment; filename="${film.brief.title.replace(/[^a-zA-Z0-9_-]/g, "-") || "sai-film"}.mp4"`);
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
      const requestedEnd = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
      if (start > requestedEnd || start >= size) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
      const end = Math.min(requestedEnd, start + chunkSize - 1);
      headers.set("Content-Range", `bytes ${start}-${end}/${size}`); headers.set("Content-Length", String(end - start + 1));
      return new Response(new Uint8Array(await media.read(start, end)), { status: 206, headers });
    }
    headers.set("Content-Length", String(size));
    return new Response(new Uint8Array(await media.read(0, size - 1)), { headers });
  } catch { return apiError("The saved video could not be read.", 404); }
}
