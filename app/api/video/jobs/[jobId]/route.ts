import { apiError, validSessionId } from "@/lib/video/http";
import { refreshJob } from "@/lib/video/job-service";
import { toPublicJob, videoJobRepository } from "@/lib/video/repository";

export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const sessionId = request.headers.get("x-video-session-id");
  if (!validSessionId(sessionId)) return apiError("This session could not be verified.", 401, "SESSION_REQUIRED");

  const { jobId } = await context.params;
  const job = await videoJobRepository.get(jobId);
  if (!job || job.sessionId !== sessionId) return apiError("That temporary job was not found.", 404, "JOB_NOT_FOUND");

  const refreshed = await refreshJob(job);
  if (!refreshed) return apiError("That temporary job was not found.", 404, "JOB_NOT_FOUND");
  return Response.json({ job: toPublicJob(refreshed) });
}
