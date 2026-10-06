import { ProviderError, type VideoGenerationProvider } from "../provider";

function unavailable(): never {
  throw new ProviderError(
    "No reviewed external video provider adapter has been implemented.",
    "PROVIDER_UNAVAILABLE",
  );
}

export const externalPlaceholderProvider: VideoGenerationProvider = {
  name: "external-placeholder",
  async createJob() {
    return unavailable();
  },
  async getJobStatus() {
    return unavailable();
  },
};
