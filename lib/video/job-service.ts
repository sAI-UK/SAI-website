import { randomUUID } from "node:crypto";

import { buildProviderPrompt, hashPrompt } from "./prompt-builder";
import {
  getProviderStatusWithRetry,
  getVideoProvider,
  ProviderError,
  withProviderTimeout,
} from "./provider";
import { videoJobRepository } from "./repository";
import type { ApprovalState, SafetyOutcome, StructuredStory, VideoJob, VideoSettings } from "./types";
import { veoVideoProvider } from "./providers/veo";

const statusMessages = {
  queued: "Your story is queued for generation.",
  generating: "Your video is generating. This can take several minutes.",
  completed: "Your video is ready to watch and download.",
  failed: "The preview could not be created this time. Your story plan is still available.",
} as const;

// Reserve the job before contacting Google: simultaneous requests with the same
// key must never submit a second billable generation.
type DirectInput = { story: StructuredStory; settings: VideoSettings; sessionId: string; idempotencyKey: string };
const submissions = new Map<string, Promise<{ job: VideoJob; duplicate: boolean }>>();
export async function createDirectJob(input: DirectInput) {
  const key = `${input.sessionId}:${input.idempotencyKey}`;
  const pending = submissions.get(key);
  if (pending) return { ...(await pending), duplicate: true };
  const operation = submitDirectJob(input);
  submissions.set(key, operation);
  try { return await operation; } finally { submissions.delete(key); }
}
async function submitDirectJob(input: DirectInput) {
  const existing = await videoJobRepository.findByIdempotencyKey(input.sessionId, input.idempotencyKey);
  if (existing) return { job: existing, duplicate: true };
  const now = new Date();
  const job: VideoJob = {
    id: randomUUID(), sessionId: input.sessionId, idempotencyKey: input.idempotencyKey,
    status: "queued", structuredStory: input.story, settings: input.settings,
    sanitisedPromptHash: hashPrompt(buildProviderPrompt(input.story, input.settings)),
    selectedValue: input.story.value, duration: input.story.duration, style: input.story.style,
    safetyOutcome: { allowed: true, needsTeacherReview: false, childSafeMessage: "", flaggedCategories: [], sanitisedPreview: input.story },
    approvalState: "approved", providerName: process.env.VIDEO_PROVIDER === "mock" ? "mock" : "veo",
    safeStatusMessage: "Submitting your story to the video service.",
    createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString(),
  };
  await videoJobRepository.create(job);
  const updated = await reviewJob(job, "approved");
  return { job: updated ?? job, duplicate: false };
}

export async function createAwaitingJob(input: {
  story: StructuredStory;
  safetyOutcome: SafetyOutcome;
  sessionId: string;
  idempotencyKey: string;
}) {
  const existing = await videoJobRepository.findByIdempotencyKey(input.sessionId, input.idempotencyKey);
  if (existing) return { job: existing, duplicate: true };

  const provider = await getVideoProvider();
  const prompt = buildProviderPrompt(input.story);
  const now = new Date();
  const retentionHours = Math.max(1, Math.min(72, Number(process.env.VIDEO_RETENTION_HOURS ?? 24)));
  const job: VideoJob = {
    id: randomUUID(),
    sessionId: input.sessionId,
    idempotencyKey: input.idempotencyKey,
    status: "awaiting_teacher_approval",
    structuredStory: input.story,
    sanitisedPromptHash: hashPrompt(prompt),
    selectedValue: input.story.value,
    duration: input.story.duration,
    style: input.story.style,
    safetyOutcome: input.safetyOutcome,
    approvalState: "awaiting_teacher_review",
    providerName: provider.name,
    safeStatusMessage: "Your idea is waiting for the supervising adult to review it.",
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + retentionHours * 60 * 60 * 1_000).toISOString(),
  };
  await videoJobRepository.create(job);
  return { job, duplicate: false };
}

export async function reviewJob(job: VideoJob, decision: ApprovalState) {
  if (decision !== "approved") {
    return videoJobRepository.update(job.id, {
      approvalState: decision,
      status: decision === "rejected" ? "rejected" : "needs_changes",
      safeStatusMessage:
        decision === "rejected"
          ? "The supervising adult has decided not to create this version."
          : "The supervising adult has asked for changes. Return to your story plan and try again.",
    });
  }

  const provider = await getVideoProvider();
  const providerPrompt = buildProviderPrompt(job.structuredStory, job.settings);
  try {
    const providerJob = await withProviderTimeout(
      provider.createJob({
        story: job.structuredStory,
        providerPrompt,
        duration: job.duration,
        aspectRatio: job.settings?.aspectRatio ?? "16:9",
        settings: job.settings,
        resolutionTier: "standard",
        safetyLevel: "strict",
      }), 35_000,
    );
    return videoJobRepository.update(job.id, {
      approvalState: "approved",
      status: providerJob.status,
      providerJobId: providerJob.id,
      safeStatusMessage: statusMessages[providerJob.status],
      progress: provider.name === "mock" ? 5 : undefined,
    });
  } catch (error) {
    return videoJobRepository.update(job.id, {
      approvalState: "approved",
      status: "failed",
      operationalErrorCode: error instanceof ProviderError ? error.code : "PROVIDER_FAILED",
      safeStatusMessage: error instanceof ProviderError ? error.message : statusMessages.failed,
    });
  }
}

export async function refreshJob(job: VideoJob) {
  if (new Date(job.expiresAt).getTime() <= Date.now()) {
    return videoJobRepository.update(job.id, {
      status: "failed",
      resultAssetReference: undefined,
      operationalErrorCode: "JOB_EXPIRED",
      safeStatusMessage: "This temporary video has expired. Start a new story to continue.",
    });
  }
  if (!job.providerJobId || !["queued", "generating"].includes(job.status)) return job;

  const provider = job.providerName === "veo" ? veoVideoProvider : await getVideoProvider();
  try {
    const providerStatus = await getProviderStatusWithRetry(provider, job.providerJobId);
    return videoJobRepository.update(job.id, {
      status: providerStatus.status,
      progress: providerStatus.progress,
      resultAssetReference: providerStatus.assetReference,
      operationalErrorCode: providerStatus.errorCode,
      safeStatusMessage: providerStatus.errorCode === "GOOGLE_CONTENT_FILTERED"
        ? "Google could not generate this story because of its content filters. Edit your story before trying again."
        : providerStatus.status === "failed" ? "Google did not return a video. This may be a content or audio processing issue. Edit your story before trying again."
        : statusMessages[providerStatus.status],
    });
  } catch (error) {
    // A polling failure does not mean the paid generation failed.
    return { ...job, safeStatusMessage: error instanceof ProviderError ? error.message : "Status could not be checked. We will retry shortly." };
  }
}
