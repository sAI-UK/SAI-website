import { createHash, randomUUID } from "node:crypto";
import { access, mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { blobEnabled, deleteBlobs, getFilmBlob, listFilmBlobs, putFilmBlob } from "./blob";
import type { Film, PublicFilm } from "./types";

// Hosted platforms such as Vercel only allow writing to the temporary folder, and it is cleared regularly.
const defaultFilmRoot = () => (process.env.VERCEL ? path.join(os.tmpdir(), "sai-films") : ".data/films");
export const filmRoot = () => path.resolve(process.env.FILM_DATA_DIR || defaultFilmRoot());
export function filmPath(id: string, file = "film.json") {
  if (!/^[a-f0-9]{32}$/.test(id) || !/^[a-zA-Z0-9_.-]+$/.test(file)) throw new Error("Invalid film location.");
  return path.join(filmRoot(), id, file);
}
export function filmId(session: string, key: string) { return createHash("sha256").update(`${session}:${key}`).digest("hex").slice(0, 32); }
async function readFilmText(id: string) {
  if (blobEnabled()) {
    const saved = await getFilmBlob(id, "film.json");
    return saved ? await new Response(saved.stream).text() : null;
  }
  try { return await readFile(filmPath(id), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
}
export async function readFilm(id: string) {
  const text = await readFilmText(id);
  if (text === null) return null;
  const film = JSON.parse(text) as Film;
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
export async function ensureFilmFolder(id: string) {
  await mkdir(path.dirname(filmPath(id)), { recursive: true });
}
export async function saveFilm(film: Film) {
  if (blobEnabled()) { await putFilmBlob(film.id, "film.json", JSON.stringify(film)); return; }
  await ensureFilmFolder(film.id);
  const temporary = filmPath(film.id, `${randomUUID()}.tmp`);
  await writeFile(temporary, JSON.stringify(film), { mode: 0o600 });
  await rename(temporary, filmPath(film.id));
}
/** Copies a finished media file from the local workspace into Blob storage (when connected). */
export async function storeFilmFile(id: string, file: string) {
  if (blobEnabled()) await putFilmBlob(id, file, await readFile(filmPath(id, file)));
}
/** Saves media bytes locally and, when connected, to Blob storage. */
export async function writeFilmFile(id: string, file: string, bytes: Buffer | Uint8Array) {
  await ensureFilmFolder(id);
  await writeFile(filmPath(id, file), bytes);
  await storeFilmFile(id, file);
}
/** Makes sure a media file is in the local workspace, fetching it from Blob storage if this server has not seen it. */
export async function ensureLocalFilmFile(id: string, file: string) {
  try { await access(filmPath(id, file)); return; } catch { /* Not on this server yet. */ }
  const saved = blobEnabled() ? await getFilmBlob(id, file) : null;
  if (!saved) throw new Error("A saved clip could not be found. Retry the affected scene.");
  await ensureFilmFolder(id);
  await writeFile(filmPath(id, file), Buffer.from(await new Response(saved.stream).arrayBuffer()));
}
/** Counts saved films. With Blob storage, films untouched for over 48 hours are deleted first. */
export async function savedFilmCount() {
  if (!blobEnabled()) return (await readdir(filmRoot()).catch(() => [])).length;
  const films = await listFilmBlobs();
  const cutoff = Date.now() - 49 * 3600_000;
  const expired = [...films.values()].filter(film => film.updated < cutoff);
  await deleteBlobs(expired.flatMap(film => film.urls));
  return films.size - expired.length;
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
