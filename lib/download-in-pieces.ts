/**
 * Downloads a large file in pieces and saves it as one file. Hosted servers limit how much
 * a single response can carry, so a full film is fetched a few megabytes at a time.
 */
export async function downloadInPieces(url: string, filename: string) {
  const parts: ArrayBuffer[] = [];
  let start = 0;
  let total = Infinity;
  while (start < total) {
    const response = await fetch(url, { headers: { range: `bytes=${start}-` } });
    if (response.status === 200) { parts.push(await response.arrayBuffer()); break; }
    if (response.status !== 206) throw new Error("The film could not be downloaded.");
    total = Number(/\/(\d+)$/.exec(response.headers.get("content-range") ?? "")?.[1] ?? 0);
    const piece = await response.arrayBuffer();
    if (!piece.byteLength) break;
    parts.push(piece);
    start += piece.byteLength;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob(parts, { type: "video/mp4" }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
}
