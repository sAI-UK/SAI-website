import { apiError, validSessionId } from "@/lib/video/http";
import { advanceFilm, retryScene, startFilm } from "@/lib/film/service";
import { locked, readFilm, saveFilm } from "@/lib/film/store";
import { filmResponse, readBody } from "@/lib/film/http";
export const runtime = "nodejs";
export const maxDuration = 180;
type Context = { params: Promise<{ id: string }> };
async function handle(request: Request, context: Context, mutate: boolean) {
  const { id } = await context.params;
  const session = request.headers.get("x-film-session");
  if (!validSessionId(session) || !/^[a-f0-9]{32}$/.test(id)) return apiError("This film session could not be verified.", 401);
  try {
    return await locked(id, async () => {
      const film = await readFilm(id);
      if (!film || film.session !== session) return apiError("This film was not found in your session.", 404);
      if (Date.parse(film.expiresAt) <= Date.now()) return apiError("This temporary film has expired.", 410);
      if (!mutate) return filmResponse(request, film);
      const body = await readBody(request);
      if (body.action === "advance") return filmResponse(request, await advanceFilm(film));
      if (!validSessionId(body.key)) return apiError("This action needs a request identifier.");
      if (film.actions.includes(body.key)) return filmResponse(request, film);
      if (body.action === "start") await startFilm(film, body.scenes, body.narration, body.narrate);
      else if (body.action === "retry-scene") await retryScene(film, body.index, body.description, body.acknowledge);
      else if (body.action === "assemble") {
        if (film.status !== "failed" || film.scenes.some(scene => scene.status !== "ready")) return apiError("Complete the four scenes first.", 409);
        if (body.withoutNarration === true) film.narrate = false;
        film.audioRequested = false;
        film.status = film.narrate && !film.audio ? "generating" : "assembling";
        film.error = undefined;
      } else return apiError("Unknown film action.");
      film.actions.push(body.key);
      await saveFilm(film);
      return filmResponse(request, film);
    });
  } catch (error) { return apiError(error instanceof Error ? error.message : "The film could not be updated.", 400); }
}
export const GET = (request: Request, context: Context) => handle(request, context, false);
export const POST = (request: Request, context: Context) => handle(request, context, true);
