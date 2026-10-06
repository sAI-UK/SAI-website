import { createDirectJob } from "@/lib/video/job-service";
import { apiError, validSessionId } from "@/lib/video/http";
import { checkRateLimit } from "@/lib/video/rate-limit";
import { videoJobRepository, toPublicJob } from "@/lib/video/repository";
import { validateVideoSettings } from "@/lib/video/settings";
import { validateAndNormaliseStory } from "@/lib/video/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !validSessionId(body.sessionId)) return apiError("Start a new session and try again.");
  if (typeof body.idempotencyKey !== "string" || !/^[a-zA-Z0-9_-]{12,100}$/.test(body.idempotencyKey)) {
    return apiError("This request could not be safely identified. Please try again.");
  }

  const rate = checkRateLimit(`jobs:${body.sessionId}`, 6, 60_000);
  if (!rate.allowed) return apiError("Please wait before submitting again.", 429, "RATE_LIMITED");

  const existing = await videoJobRepository.findByIdempotencyKey(body.sessionId, body.idempotencyKey);
  if (!existing) {
    const configured = Number(process.env.VIDEO_MAX_JOBS_PER_SESSION ?? 20);
    const maximum = Number.isFinite(configured) ? Math.max(1, Math.min(100, configured)) : 20;
    if ((await videoJobRepository.countForSession(body.sessionId)) >= maximum) {
      return apiError(
        `This session has reached its limit of ${maximum} videos.`,
        429,
        "SESSION_QUOTA_REACHED",
      );
    }
  }

  const validation = validateAndNormaliseStory(body.story);
  if (!validation.story) {
    return apiError("Some parts of the story plan need attention.", 422, "VALIDATION_FAILED", validation.errors);
  }

  const settings = validateVideoSettings(body.settings, validation.story.duration);
  if (!settings) return apiError("Choose supported video settings. 1080p requires 8 seconds.", 422, "INVALID_SETTINGS");
  if (process.env.VIDEO_PROVIDER !== "mock" && !process.env.GEMINI_API_KEY?.trim()) {
    return apiError("Add GEMINI_API_KEY to .env.local and restart the server.", 503, "API_KEY_REQUIRED");
  }

  const result = await createDirectJob({
    story: validation.story,
    settings,
    sessionId: body.sessionId,
    idempotencyKey: body.idempotencyKey,
  });
  return Response.json({ job: toPublicJob(result.job), duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201, headers: { "Cache-Control": "no-store", "Set-Cookie": `sai-video-session=${body.sessionId}; HttpOnly; SameSite=Strict; Path=/api/video; Max-Age=172800${new URL(request.url).protocol === "https:" ? "; Secure" : ""}` } });
}
