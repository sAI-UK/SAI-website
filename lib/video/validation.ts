import {
  storyValues,
  videoDurations,
  visualStyles,
  type StructuredStory,
} from "./types";

const limits: Record<keyof StructuredStory, number> = {
  title: 80,
  mainCharacter: 120,
  setting: 160,
  action: 500,
  value: 40,
  style: 60,
  mood: 60,
  dialogue: 280,
  duration: 2,
};

function normaliseText(value: unknown, max: number) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function validateAndNormaliseStory(input: unknown): {
  story?: StructuredStory;
  errors: Record<string, string>;
} {
  if (!input || typeof input !== "object") {
    return { errors: { story: "Add a story plan before continuing." } };
  }

  const source = input as Record<string, unknown>;
  const title = normaliseText(source.title, limits.title);
  const mainCharacter = normaliseText(source.mainCharacter, limits.mainCharacter);
  const setting = normaliseText(source.setting, limits.setting);
  const action = normaliseText(source.action, limits.action);
  const mood = normaliseText(source.mood, limits.mood);
  const dialogue = normaliseText(source.dialogue, limits.dialogue);
  const value = normaliseText(source.value, limits.value);
  const style = normaliseText(source.style, limits.style);
  const duration = Number(source.duration);
  const errors: Record<string, string> = {};

  if (title.length < 2) errors.title = "Give your story a short title.";
  if (mainCharacter.length < 2) errors.mainCharacter = "Describe a fictional main character.";
  if (setting.length < 2) errors.setting = "Describe where the story happens.";
  if (action.length < 10) errors.action = "Tell us a little more about what happens.";
  if (!storyValues.includes(value as StructuredStory["value"])) errors.value = "Choose a value or theme.";
  if (!visualStyles.includes(style as StructuredStory["style"])) errors.style = "Choose one of the available visual styles.";
  if (mood.length < 2) errors.mood = "Choose or describe a mood.";
  if (!videoDurations.includes(duration as StructuredStory["duration"])) errors.duration = "Choose 4, 6 or 8 seconds.";

  if (Object.keys(errors).length) return { errors };

  return {
    errors,
    story: {
      title,
      mainCharacter,
      setting,
      action,
      value: value as StructuredStory["value"],
      style: style as StructuredStory["style"],
      mood,
      dialogue: dialogue || undefined,
      duration: duration as StructuredStory["duration"],
    },
  };
}
