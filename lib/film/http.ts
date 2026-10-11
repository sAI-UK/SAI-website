import type { Film } from "./types";
import { publicFilm } from "./store";
export async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Missing request.");
  const chunks: Uint8Array[] = []; let length = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; length += value.length; if (length > 7_100_000) { await reader.cancel(); throw new Error("The upload is too large. Use an image up to 5 MB."); } chunks.push(value); }
  const value = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid request.");
  return value;
}
export function filmResponse(request: Request, film: Film) {
  return Response.json({ film: publicFilm(film) }, { headers: { "Cache-Control": "no-store", "Set-Cookie": `sai-film-session=${film.session}; HttpOnly; SameSite=Strict; Path=/api/films; Max-Age=172800${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` } });
}
