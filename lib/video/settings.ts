import type { VideoSettings } from "./types";

export function defaultVideoSettings(): VideoSettings {
  return {
    model: "veo-3.1-fast-generate-preview",
    resolution: "720p",
    aspectRatio: "16:9",
  };
}

export function validateVideoSettings(input: unknown, duration: number): VideoSettings | undefined {
  if (input === undefined) return defaultVideoSettings();
  if (!input || typeof input !== "object") return undefined;
  const settings = input as VideoSettings;
  if (!["veo-3.1-fast-generate-preview", "veo-3.1-generate-preview"].includes(settings.model)) return undefined;
  if (!["720p", "1080p"].includes(settings.resolution)) return undefined;
  if (!["16:9", "9:16"].includes(settings.aspectRatio)) return undefined;
  if (settings.resolution === "1080p" && duration !== 8) return undefined;
  return { model: "veo-3.1-fast-generate-preview", resolution: settings.resolution, aspectRatio: settings.aspectRatio };
}

export function estimatedVideoCost(settings: VideoSettings, duration: number) {
  return duration * (settings.model === "veo-3.1-generate-preview" ? 0.4 : settings.resolution === "1080p" ? 0.12 : 0.1);
}
