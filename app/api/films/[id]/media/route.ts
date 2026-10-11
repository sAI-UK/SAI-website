import { readFile } from "node:fs/promises";
import { apiError, validSessionId } from "@/lib/video/http";
import { filmPath, readFilm } from "@/lib/film/store";
export const runtime = "nodejs";
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
    const bytes = await readFile(filmPath(id, file));
    const headers = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
    if (url.searchParams.get("download") === "1") headers.set("Content-Disposition", `attachment; filename="${film.brief.title.replace(/[^a-zA-Z0-9_-]/g, "-") || "sai-film"}.mp4"`);
    const range = request.headers.get("range");
    if (range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
      const start = match[1] ? Number(match[1]) : Math.max(0, bytes.length - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), bytes.length - 1) : bytes.length - 1;
      if (start > end || start >= bytes.length) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
      headers.set("Content-Range", `bytes ${start}-${end}/${bytes.length}`); headers.set("Content-Length", String(end - start + 1));
      return new Response(new Uint8Array(bytes.subarray(start, end + 1)), { status: 206, headers });
    }
    headers.set("Content-Length", String(bytes.length));
    return new Response(new Uint8Array(bytes), { headers });
  } catch { return apiError("The saved video could not be read.", 404); }
}
