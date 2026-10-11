import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Film, PublicFilm } from "./types";

export const filmRoot = () => path.resolve(process.env.FILM_DATA_DIR || ".data/films");
export function filmPath(id: string, file = "film.json") {
  if (!/^[a-f0-9]{32}$/.test(id) || !/^[a-zA-Z0-9_.-]+$/.test(file)) throw new Error("Invalid film location.");
  return path.join(filmRoot(), id, file);
}
export function filmId(session: string, key: string) { return createHash("sha256").update(`${session}:${key}`).digest("hex").slice(0, 32); }
export async function readFilm(id: string) {
  try {
    const film = JSON.parse(await readFile(filmPath(id), "utf8")) as Film;
    // Older code labelled explicit 400 rejections as uncertain submissions.
    // Restore a normal retry without requiring an unnecessary charge acknowledgement.
    for (const scene of film.scenes) {
      if (scene.status === "uncertain" && !scene.operation && scene.error === "Google rejected this request (400). Check model access, billing and supported content.") {
        scene.status = "failed";
        scene.error = "Google rejected the previous scene request (400) before returning an operation. Retry this scene with the updated request format.";
      }
    }
    return film;
  }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function saveFilm(film: Film) {
  await mkdir(path.dirname(filmPath(film.id)), { recursive: true });
  const temporary = filmPath(film.id, `${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(film), { mode: 0o600 });
  await rename(temporary, filmPath(film.id));
}
const globals = globalThis as typeof globalThis & { filmLocks?: Map<string, Promise<unknown>> };
const locks = globals.filmLocks ??= new Map();
export async function locked<T>(id: string, work: () => Promise<T>): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  const pending = previous.catch(() => undefined).then(work);
  locks.set(id, pending);
  try { return await pending; } finally { if (locks.get(id) === pending) locks.delete(id); }
}
export function publicFilm(film: Film): PublicFilm {
  const { image: reference, ...brief } = film.brief;
  return { id: film.id, brief, hasImage: Boolean(reference), narration: film.narration, narrate: film.narrate, status: film.status, mode: film.mode, createdAt: film.createdAt, expiresAt: film.expiresAt, revision: film.revision, attempts: film.attempts, error: film.error,
    scenes: film.scenes.map(({ description, status, error, attempts, file }, index) => ({ description, status, error, attempts, ...(file ? { media: `/api/films/${film.id}/media?scene=${index}&v=${film.revision}` } : {}) })),
    ...(film.output ? { media: `/api/films/${film.id}/media?v=${film.revision}` } : {}) };
}
