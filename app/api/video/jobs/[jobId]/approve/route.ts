import { apiError, validSessionId } from "@/lib/video/http";
import { reviewJob } from "@/lib/video/job-service";
import { getRuntimeMode } from "@/lib/video/provider";
import { toPublicJob, videoJobRepository } from "@/lib/video/repository";
import { prototypeTeacherAuthorisation } from "@/lib/video/teacher-approval";
import type { ApprovalState } from "@/lib/video/types";

export const runtime = "nodejs";

const decisions: ApprovalState[] = ["approved", "changes_requested", "rejected"];

export async function POST(request: Request, context: { params: Promise<{ jobId: string }> }) {
  const body = await request.json().catch(() => null);
  if (!body || !validSessionId(body.sessionId)) return apiError("This session could not be verified.", 401);
  if (!decisions.includes(body.decision)) return apiError("Choose a valid review decision.");

  const mode = getRuntimeMode();
  const authorised = await prototypeTeacherAuthorisation.canReview({
    sessionId: body.sessionId,
    mode,
    simulated: body.simulated === true,
  });
  if (!authorised) {
    return apiError(
      "Real teacher authentication is not configured. Use the labelled simulation only in demo mode.",
      403,
      "TEACHER_AUTHORISATION_REQUIRED",
    );
  }

  const { jobId } = await context.params;
  const job = await videoJobRepository.get(jobId);
  if (!job || job.sessionId !== body.sessionId) return apiError("That temporary job was not found.", 404);
  if (job.status !== "awaiting_teacher_approval") {
    return apiError("This story is no longer waiting for review.", 409, "INVALID_JOB_STATE");
  }

  const updated = await reviewJob(job, body.decision);
  if (!updated) return apiError("That temporary job was not found.", 404);
  return Response.json({ job: toPublicJob(updated) });
}
