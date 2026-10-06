import type { VideoJob } from "./types";

export interface VideoJobRepository {
  create(job: VideoJob): Promise<VideoJob>;
  get(id: string): Promise<VideoJob | undefined>;
  update(id: string, changes: Partial<VideoJob>): Promise<VideoJob | undefined>;
  findByIdempotencyKey(sessionId: string, key: string): Promise<VideoJob | undefined>;
  countForSession(sessionId: string): Promise<number>;
}

class InMemoryVideoJobRepository implements VideoJobRepository {
  private readonly jobs = new Map<string, VideoJob>();

  async create(job: VideoJob) {
    this.jobs.set(job.id, job);
    return job;
  }

  async get(id: string) {
    return this.jobs.get(id);
  }

  async update(id: string, changes: Partial<VideoJob>) {
    const current = this.jobs.get(id);
    if (!current) return undefined;
    const updated = { ...current, ...changes };
    this.jobs.set(id, updated);
    return updated;
  }

  async findByIdempotencyKey(sessionId: string, key: string) {
    return [...this.jobs.values()].find(
      (job) => job.sessionId === sessionId && job.idempotencyKey === key,
    );
  }

  async countForSession(sessionId: string) {
    return [...this.jobs.values()].filter((job) => job.sessionId === sessionId).length;
  }

  clear() {
    this.jobs.clear();
  }
}

const globalRepository = globalThis as typeof globalThis & {
  __saiVideoRepository?: InMemoryVideoJobRepository;
};

export const videoJobRepository =
  globalRepository.__saiVideoRepository ?? new InMemoryVideoJobRepository();

globalRepository.__saiVideoRepository = videoJobRepository;

export function toPublicJob(job: VideoJob) {
  return {
    id: job.id,
    status: job.status,
    approvalState: job.approvalState,
    selectedValue: job.selectedValue,
    duration: job.duration,
    style: job.style,
    progress: job.progress,
    safeStatusMessage: job.safeStatusMessage,
    resultAssetReference: job.providerName === "veo" && job.resultAssetReference ? `/api/video/jobs/${job.id}/media` : job.resultAssetReference,
    settings: job.settings,
    providerName: job.providerName,
    createdAt: job.createdAt,
    expiresAt: job.expiresAt,
    title: job.structuredStory.title,
    recoverable: job.status === "failed",
  };
}
