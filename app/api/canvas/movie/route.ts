import { apiError } from "@/lib/video/http";
import { readBody } from "@/lib/film/http";
import { generateMovie, validateMovieRequest } from "@/lib/canvas/generator";

export const runtime = "nodejs";
export const maxDuration = 120;

// Turns a child's story (plus their drawing) into a movie script for the sandboxed player.
export async function POST(request: Request) {
  let body: unknown;
  try { body = await readBody(request); } catch (error) { return apiError(error instanceof Error ? error.message : "Invalid request.", 400); }
  let movieRequest;
  try { movieRequest = validateMovieRequest(body); } catch (error) { return apiError(error instanceof Error ? error.message : "Invalid request.", 400); }
  const demo = process.env.VIDEO_PROVIDER === "mock" || !process.env.GEMINI_API_KEY?.trim();
  try {
    const movie = await generateMovie(movieRequest, demo);
    return Response.json(movie, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiError(error instanceof Error ? error.message : "The movie could not be written.", 502, "GENERATION_FAILED");
  }
}
