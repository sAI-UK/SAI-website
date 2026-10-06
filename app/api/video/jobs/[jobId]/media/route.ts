import { apiError, validSessionId } from "@/lib/video/http";
import { videoJobRepository } from "@/lib/video/repository";
import { geminiKey, validVideoUri } from "@/lib/video/providers/veo";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const session = request.headers.get("cookie")?.split(";").map(p => p.trim()).find(p => p.startsWith("sai-video-session="))?.slice("sai-video-session=".length);
  if (!validSessionId(session)) return apiError("This video session could not be verified.", 401);
  const { jobId } = await context.params;
  const job = await videoJobRepository.get(jobId);
  if (!job || job.sessionId !== session) return apiError("This temporary video was not found.", 404);
  if (new Date(job.expiresAt).getTime() <= Date.now()) return apiError("This video has expired.", 410);
  if (job.status !== "completed" || !job.resultAssetReference || !validVideoUri(job.resultAssetReference)) return apiError("This video is not ready.", 409);
  try {
    let uri = job.resultAssetReference;
    let upstream: Response | undefined;
    for (let attempt = 0; attempt < 4; attempt++) {
      const url = new URL(uri);
      const google = url.protocol === "https:" && url.hostname === "generativelanguage.googleapis.com";
      const storage = url.protocol === "https:" && (url.hostname === "storage.googleapis.com" || url.hostname.endsWith(".googleusercontent.com"));
      if ((!google && !storage) || url.username || url.password || url.port) return apiError("Unsupported video location.", 502);
      const headers: Record<string, string> = google ? { "x-goog-api-key": geminiKey() } : {};
      const range = request.headers.get("range");
      if (range) headers.Range = range;
      upstream = await fetch(uri, { headers, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(60_000) });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const location = upstream.headers.get("location");
      await upstream.body?.cancel();
      if (!location) return apiError("Video redirect failed.", 502);
      uri = new URL(location, uri).toString();
    }
    if (!upstream?.ok || !upstream.body) return apiError("The video could not be retrieved. It may have expired.", 502);
    const download = new URL(request.url).searchParams.get("download") === "1";
    const filename = job.structuredStory.title.replace(/[^a-zA-Z0-9_-]+/g, "-").slice(0, 70) || "sai-story";
    const headers = new Headers({ "Content-Type": "video/mp4", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}.mp4"` });
    for (const name of ["content-length", "content-range", "accept-ranges"]) { const value = upstream.headers.get(name); if (value) headers.set(name, value); }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch { return apiError("Video retrieval failed. Please try again.", 502); }
}
