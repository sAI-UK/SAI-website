import { apiError, validSessionId } from "@/lib/video/http";
import { checkRateLimit } from "@/lib/video/rate-limit";
import { evaluateStorySafety } from "@/lib/video/safety";
import { validateAndNormaliseStory } from "@/lib/video/validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !validSessionId(body.sessionId)) return apiError("Start a new session and try again.", 400);

  const rate = checkRateLimit(`safety:${body.sessionId}`, 12, 60_000);
  if (!rate.allowed) {
    return apiError(
      `Please wait ${rate.retryAfterSeconds} seconds before checking another idea.`,
      429,
      "RATE_LIMITED",
    );
  }

  const validation = validateAndNormaliseStory(body.story);
  if (!validation.story) {
    return apiError("Some parts of the story plan need attention.", 422, "VALIDATION_FAILED", validation.errors);
  }

  return Response.json(evaluateStorySafety(validation.story));
}
