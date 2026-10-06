import type { ProviderJob, ProviderJobStatus, RuntimeMode, SafeVideoRequest } from "./types";

export interface VideoGenerationProvider {
  readonly name: string;
  createJob(input: SafeVideoRequest): Promise<ProviderJob>;
  getJobStatus(providerJobId: string): Promise<ProviderJobStatus>;
  cancelJob?(providerJobId: string): Promise<void>;
  deleteAsset?(providerAssetId: string): Promise<void>;
}

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: "PROVIDER_UNAVAILABLE" | "PROVIDER_TIMEOUT" | "PROVIDER_FAILED",
  ) {
    super(message);
  }
}

export async function withProviderTimeout<T>(operation: Promise<T>, timeoutMs = 8_000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<T>((_, reject) => {
        timer = setTimeout(
          () => reject(new ProviderError("The video service timed out.", "PROVIDER_TIMEOUT")),
          timeoutMs,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function getProviderStatusWithRetry(provider: VideoGenerationProvider, id: string) {
  try {
    return await withProviderTimeout(provider.getJobStatus(id));
  } catch (error) {
    if (error instanceof ProviderError && error.code === "PROVIDER_TIMEOUT") throw error;
    return withProviderTimeout(provider.getJobStatus(id));
  }
}

export function getRuntimeMode(): RuntimeMode {
  if (process.env.VIDEO_PROVIDER === "mock") return "demo";
  return process.env.GEMINI_API_KEY?.trim() ? "live" : "unconfigured";
}

export async function getVideoProvider(): Promise<VideoGenerationProvider> {
  const selected = process.env.VIDEO_PROVIDER ?? "veo";
  if (selected === "mock") {
    const { mockVideoProvider } = await import("./providers/mock");
    return mockVideoProvider;
  }

  if (selected === "external-placeholder") {
    const { externalPlaceholderProvider } = await import("./providers/external-placeholder");
    return externalPlaceholderProvider;
  }
  const { veoVideoProvider } = await import("./providers/veo");
  return veoVideoProvider;
}
