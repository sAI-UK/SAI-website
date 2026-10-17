import { apiError, validSessionId } from "@/lib/video/http";
import { checkRateLimit } from "@/lib/video/rate-limit";
import { validateBrief, planFilm } from "@/lib/film/planner";
import { filmId, locked, readFilm, savedFilmCount, saveFilm } from "@/lib/film/store";
import { filmResponse, readBody } from "@/lib/film/http";
import type { Film } from "@/lib/film/types";
export const runtime = "nodejs";
export const maxDuration = 180;
export async function POST(request: Request) {
  try {
    const body = await readBody(request);
    if (!validSessionId(body.session) || !validSessionId(body.key)) return apiError("Start a new session and try again.");
    if (!checkRateLimit(`film-plan:${body.session}`, 4, 60_000).allowed) return apiError("Please wait before planning another film.", 429);
    return await locked("create-films", async () => {
      const id = filmId(body.session, body.key);
      const existing = await readFilm(id);
      if (existing) return filmResponse(request, existing);
      const saved = await savedFilmCount();
      const limit = Math.max(1, Math.min(100, Number(process.env.FILM_MAX_SAVED || 20) || 20));
      if (saved >= limit) return apiError(`This demo has reached its limit of ${limit} saved films. Archive old films on the server before creating more.`, 429);
      const demo = process.env.VIDEO_PROVIDER === "mock";
      if (!demo && !process.env.GEMINI_API_KEY?.trim()) return apiError("Add your Gemini API key on the server to enable planning.", 503);
      const brief = await validateBrief(body.brief);
      const plan = await planFilm(brief, demo);
      const film: Film = { id, session: body.session, brief, scenes: plan.scenes.map((description: string) => ({ description, status: "waiting", attempts: 0 })), narration: plan.narration, narrate: true, status: "draft", mode: demo ? "demo" : "live", createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 48 * 3600_000).toISOString(), revision: 1, actions: [], attempts: 0 };
      await saveFilm(film);
      return filmResponse(request, film);
    });
  } catch (error) { return apiError(error instanceof Error ? error.message : "The film could not be planned.", 400); }
}
