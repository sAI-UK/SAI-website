import { ProviderError, type VideoGenerationProvider } from "../provider";
import { defaultVideoSettings } from "../settings";

const base = "https://generativelanguage.googleapis.com/v1beta";

export function geminiKey() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new ProviderError("Add GEMINI_API_KEY to .env.local and restart the server.", "PROVIDER_UNAVAILABLE");
  return key;
}

export function validOperation(name: string) {
  return /^models\/veo-3\.1-(?:fast-)?generate-preview\/operations\/[a-zA-Z0-9_-]+$/.test(name);
}

export function validVideoUri(uri: string) {
  try {
    const url = new URL(uri);
    return url.protocol === "https:" && url.hostname === "generativelanguage.googleapis.com" && !url.username && !url.password && !url.port && url.pathname.startsWith("/v1beta/files/");
  } catch { return false; }
}

async function googleRequest(path: string, body?: unknown) {
  let response: Response;
  try {
    response = await fetch(`${base}/${path}`, {
      method: body ? "POST" : "GET",
      headers: { "x-goog-api-key": geminiKey(), "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof ProviderError) throw error;
    throw new ProviderError("Could not reach Google. If submission timed out, it may still be generating; do not immediately submit again.", "PROVIDER_TIMEOUT");
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    // Never expose Google's raw message: it can contain secrets or story text.
    const diagnostic = typeof data.error?.message === "string" ? data.error.message : "";
    const badRequest = /personGeneration|person_generation|allow_adult|allow_all/i.test(diagnostic)
      ? "Google rejected the people-generation setting. Restart the updated server to use the text-to-video default. Regional restrictions may still apply."
      : /API key|API_KEY_INVALID/i.test(diagnostic)
        ? "Google says the API key is invalid. Check GEMINI_API_KEY in .env.local and restart the server."
        : /billing|paid tier/i.test(diagnostic)
          ? "Google requires billing. Check the Google project linked to your API key."
          : /duration|resolution|aspectRatio|aspect_ratio|sampleCount/i.test(diagnostic)
            ? "Google rejected a video setting. Try 8 seconds, 720p and landscape."
            : "Google rejected the request (400 INVALID_ARGUMENT). The story or API settings were not accepted; this does not by itself mean a content restriction was violated.";
    const message = response.status === 429 ? "Google's quota or rate limit has been reached. Check your billing and quota in AI Studio."
      : [401, 403].includes(response.status) ? "Google rejected access. Check your API key, billing and Veo permissions."
      : response.status === 404 ? "The Veo model or operation is unavailable for this project."
      : response.status === 400 ? badRequest
      : "Google's video service is unavailable. Try checking the status again later.";
    throw new ProviderError(message, "PROVIDER_FAILED");
  }
  return data;
}

export const veoVideoProvider: VideoGenerationProvider = {
  name: "veo",
  async createJob(input) {
    const settings = input.settings ?? defaultVideoSettings();
    const data = await googleRequest(`models/${settings.model}:predictLongRunning`, {
      instances: [{ prompt: input.providerPrompt }],
      parameters: {
        sampleCount: 1,
        durationSeconds: input.duration,
        aspectRatio: settings.aspectRatio,
        resolution: settings.resolution,
        // Use Google's text-to-video default and provider-enforced restrictions.
      },
    });
    if (typeof data.name !== "string" || !validOperation(data.name)) throw new ProviderError("Google returned an unexpected operation. Check AI Studio before submitting again.", "PROVIDER_FAILED");
    return { id: data.name, status: "generating" };
  },
  async getJobStatus(id) {
    if (!validOperation(id)) throw new ProviderError("Invalid Google operation.", "PROVIDER_FAILED");
    const data = await googleRequest(id);
    if (!data.done) return { status: "generating" };
    if (data.error) return { status: "failed", errorCode: "GOOGLE_GENERATION_FAILED" };
    const result = data.response?.generateVideoResponse;
    const uri = result?.generatedSamples?.[0]?.video?.uri;
    if (!uri) return { status: "failed", errorCode: result?.raiMediaFilteredCount ? "GOOGLE_CONTENT_FILTERED" : "GOOGLE_NO_VIDEO" };
    if (!validVideoUri(uri)) throw new ProviderError("Google returned an unsupported video location.", "PROVIDER_FAILED");
    return { status: "completed", progress: 100, assetReference: uri };
  },
};
