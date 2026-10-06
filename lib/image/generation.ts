import { geminiKey } from "@/lib/video/providers/veo";

export const imageRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"] as const;
export type ImageIdea = {
  subject: string; setting: string; action: string; style: string;
  mood: string; lighting: string; composition: string; text: string;
  aspectRatio: (typeof imageRatios)[number];
};
export type ImageResult = { dataUrl: string; mimeType: string };

export function validateImageIdea(input: unknown): { idea?: ImageIdea; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  if (!input || typeof input !== "object") return { errors: { subject: "Describe the image you want to create." } };
  const source = input as Record<string, unknown>;
  const idea = {} as ImageIdea;
  for (const field of ["subject", "setting", "action", "style", "mood", "lighting", "composition", "text"] as const) {
    const value = source[field];
    if (typeof value !== "string" || value.length > 600) { errors[field] = "Use up to 600 characters for this field."; idea[field] = ""; }
    else idea[field] = value.normalize("NFKC").replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  }
  if (idea.subject.length < 3) errors.subject = "Describe the subject of your image.";
  if (!idea.style) errors.style = "Choose a visual style.";
  if (!imageRatios.includes(source.aspectRatio as ImageIdea["aspectRatio"])) errors.aspectRatio = "Choose a supported image format.";
  idea.aspectRatio = source.aspectRatio as ImageIdea["aspectRatio"];
  return Object.keys(errors).length ? { errors } : { idea, errors };
}

export function buildImagePrompt(idea: ImageIdea) {
  return [
    `Create one finished still image in ${idea.style} style, composed for ${idea.aspectRatio}.`,
    `Main subject: ${JSON.stringify(idea.subject)}.`,
    idea.setting && `Setting and background: ${JSON.stringify(idea.setting)}.`,
    idea.action && `Pose or action captured in this moment: ${JSON.stringify(idea.action)}.`,
    idea.mood && `Mood: ${JSON.stringify(idea.mood)}.`,
    idea.lighting && `Lighting: ${JSON.stringify(idea.lighting)}.`,
    idea.composition && `Composition and viewpoint: ${JSON.stringify(idea.composition)}.`,
    idea.text ? `Include exactly this visible text: ${JSON.stringify(idea.text)}. Use clear, legible lettering.` : "No visible text, captions or logos.",
    "Keep the main subject clear, with coherent details and a balanced composition.",
  ].filter(Boolean).join(" ");
}

export async function generateImage(idea: ImageIdea): Promise<ImageResult> {
  let response: Response;
  try {
    response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent", {
      method: "POST", headers: { "x-goog-api-key": geminiKey(), "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildImagePrompt(idea) }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], responseFormat: { image: { aspectRatio: idea.aspectRatio } } } }),
      signal: AbortSignal.timeout(120_000), cache: "no-store",
    });
  } catch {
    throw new Error("Image submission could not be confirmed. Retry the unchanged form to recover this request; check AI Studio before starting a new paid version.");
  }
  if (!response.ok) {
    throw new Error(response.status === 429 ? "Google's image generation quota has been reached. Check your billing and quota."
      : [400, 401, 403].includes(response.status) ? "Google rejected the image request. Check your API key, billing, model access and image description."
      : response.status === 404 ? "Nano Banana is not available for this Google project. Check model access in AI Studio."
      : "Google's image service is unavailable. Please try later.");
  }
  const data = await response.json();
  if (data.promptFeedback?.blockReason) throw new Error("Google's content filters blocked this image request. Edit the description before trying again.");
  const parts = data.candidates?.[0]?.content?.parts;
  const image = Array.isArray(parts) ? parts.find((part: { inlineData?: { mimeType?: string } }) => ["image/png", "image/jpeg", "image/webp"].includes(part.inlineData?.mimeType ?? ""))?.inlineData : undefined;
  if (!image || typeof image.data !== "string" || !/^[A-Za-z0-9+/]+={0,2}$/.test(image.data) || image.data.length > 15_000_000) throw new Error("Google did not return a supported image. Your request may have been filtered. Edit the description before creating another version.");
  return { dataUrl: `data:${image.mimeType};base64,${image.data}`, mimeType: image.mimeType };
}
