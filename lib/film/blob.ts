import { BlobNotFoundError, del, get, head, list, put } from "@vercel/blob";

// When a Vercel Blob store is connected (it sets BLOB_READ_WRITE_TOKEN), films are kept there
// so every server sees the same files. Without it, films stay in the local .data folder.
export const blobEnabled = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());

// Films are private: only this site's server can read them, never a public link.
const access = "private" as const;
const blobPath = (id: string, file: string) => `films/${id}/${file}`;

const contentTypes: Record<string, string> = { json: "application/json", mp4: "video/mp4", wav: "audio/wav" };

export async function putFilmBlob(id: string, file: string, body: Buffer | string) {
  const extension = file.split(".").pop() ?? "";
  await put(blobPath(id, file), body, { access, addRandomSuffix: false, allowOverwrite: true, contentType: contentTypes[extension] ?? "application/octet-stream" });
}

/** Reads the latest copy straight from storage, skipping the CDN cache so film progress is never stale. */
export async function getFilmBlob(id: string, file: string, range?: string) {
  const result = await get(blobPath(id, file), { access, useCache: false, ...(range ? { headers: { range } } : {}) });
  return result?.statusCode === 200 ? result : null;
}

export async function filmBlobSize(id: string, file: string) {
  try { return (await head(blobPath(id, file))).size; }
  catch (error) { if (error instanceof BlobNotFoundError) return null; throw error; }
}

/** Lists saved films with the time each was last changed. */
export async function listFilmBlobs() {
  const films = new Map<string, { updated: number; urls: string[] }>();
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: "films/", cursor, limit: 1000 });
    for (const blob of page.blobs) {
      const id = blob.pathname.split("/")[1];
      const entry = films.get(id) ?? { updated: 0, urls: [] };
      entry.updated = Math.max(entry.updated, blob.uploadedAt.getTime());
      entry.urls.push(blob.url);
      films.set(id, entry);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return films;
}

export async function deleteBlobs(urls: string[]) {
  if (urls.length) await del(urls);
}
