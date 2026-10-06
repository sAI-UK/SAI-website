import { randomUUID } from "node:crypto";

import type { VideoGenerationProvider } from "../provider";
import type { ProviderJobStatus, SafeVideoRequest } from "../types";

type MockRecord = { createdAt: number; request: SafeVideoRequest };

const globalMockStore = globalThis as typeof globalThis & {
  __saiMockVideoJobs?: Map<string, MockRecord>;
};

const mockJobs = globalMockStore.__saiMockVideoJobs ?? new Map<string, MockRecord>();
globalMockStore.__saiMockVideoJobs = mockJobs;

export const mockVideoProvider: VideoGenerationProvider = {
  name: "mock",
  async createJob(input) {
    const id = `mock_${randomUUID()}`;
    mockJobs.set(id, { createdAt: Date.now(), request: input });
    return { id, status: "queued" };
  },
  async getJobStatus(providerJobId): Promise<ProviderJobStatus> {
    const job = mockJobs.get(providerJobId);
    if (!job) return { status: "failed", errorCode: "MOCK_JOB_NOT_FOUND" };

    const elapsed = Date.now() - job.createdAt;
    if (elapsed < 1_500) return { status: "queued", progress: 10 };
    if (elapsed < 3_500) return { status: "generating", progress: 45 };
    if (elapsed < 5_500) return { status: "generating", progress: 78 };
    return {
      status: "completed",
      progress: 100,
      assetReference: "/video-studio/mock-story.svg",
    };
  },
  async cancelJob(providerJobId) {
    mockJobs.delete(providerJobId);
  },
  async deleteAsset() {
    // The shared local demo asset contains no student data.
  },
};
