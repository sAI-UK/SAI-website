import { apiError, validSessionId } from "@/lib/video/http";
import { videoJobRepository } from "@/lib/video/repository";
import { reportCategories } from "@/lib/video/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !validSessionId(body.sessionId)) return apiError("This session could not be verified.", 401);
  if (!reportCategories.includes(body.category)) return apiError("Choose one of the report options.");

  const job = await videoJobRepository.get(String(body.jobId ?? ""));
  if (!job || job.sessionId !== body.sessionId) return apiError("That temporary result was not found.", 404);
  await videoJobRepository.update(job.id, { reportedAt: new Date().toISOString() });

  // Only the category and internal job identifier are retained. No free-text student report is collected.
  return Response.json({ reported: true, message: "Thank you. Please also tell the adult supervising this activity." });
}
