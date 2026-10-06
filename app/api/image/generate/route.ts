import { apiError, validSessionId } from "@/lib/video/http";
import { checkRateLimit } from "@/lib/video/rate-limit";
import { generateImage, validateImageIdea, type ImageResult } from "@/lib/image/generation";

export const runtime = "nodejs";
export const maxDuration = 150;
const requests = new Map<string, { result: Promise<ImageResult>; expires: number }>();

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !validSessionId(body.sessionId) || typeof body.idempotencyKey !== "string" || !/^[a-zA-Z0-9_-]{12,100}$/.test(body.idempotencyKey)) return apiError("Start a new session and try again.");
  const validation = validateImageIdea(body.idea);
  if (!validation.idea) return apiError("Check the image description.", 422, "VALIDATION_FAILED", validation.errors);
  if (!process.env.GEMINI_API_KEY?.trim()) return apiError("Add GEMINI_API_KEY to .env.local and restart the server.", 503, "API_KEY_REQUIRED");
  const now = Date.now();
  for (const [key, value] of requests) if (value.expires < now) requests.delete(key);
  const key = `${body.sessionId}:${body.idempotencyKey}`;
  let stored = requests.get(key);
  if (!stored) {
    if (!checkRateLimit(`image:${body.sessionId}`, 6).allowed || requests.size >= 100) return apiError("Please wait before generating another image.", 429, "RATE_LIMITED");
    const result = generateImage(validation.idea);
    stored = { result, expires: now + 30 * 60_000 };
    requests.set(key, stored);
  }
  try { return Response.json({ image: await stored.result }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error instanceof Error ? error.message : "Image generation failed.", 502, "IMAGE_GENERATION_FAILED"); }
}
