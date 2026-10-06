import { createHash } from "node:crypto";

import type { StructuredStory, VideoSettings } from "./types";

export function buildProviderPrompt(story: StructuredStory, settings?: VideoSettings) {
  const narration = story.dialogue
    ? `Spoken dialogue or narration in English: ${JSON.stringify(story.dialogue)}. Fit the line naturally within ${story.duration} seconds; do not add extra speech.`
    : "No spoken dialogue or narration. Use subtle ambient sound fitting the scene.";

  return [
    `Create a ${story.duration}-second fictional animated story preview in a ${story.style.toLowerCase()} style.`,
    `Story title for context only: ${JSON.stringify(story.title)}. Do not render the title as text.`,
    `The fictional main character is ${story.mainCharacter}.`,
    `The setting is ${story.setting}.`,
    `Story action: ${story.action}.`,
    `The mood is ${story.mood.toLowerCase()} and the value explored is ${story.value.toLowerCase()}.`,
    narration,
    "Use no identifiable real people, no photorealistic faces, no private information, no branding, and no distressing or adult content.",
    `Use a ${settings?.aspectRatio ?? "16:9"} composition and an age-appropriate, clearly fictional visual treatment.`,
    "Show one focused, continuous scene with a clear action and a satisfying final moment. Keep character appearance consistent, use smooth deliberate camera movement and compose the subject clearly. No subtitles, logos or on-screen text.",
  ].join(" ");
}

export function hashPrompt(prompt: string) {
  return createHash("sha256").update(prompt).digest("hex");
}
