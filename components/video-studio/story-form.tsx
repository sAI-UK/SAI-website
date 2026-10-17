import { moods, storyValues, videoDurations, visualStyles, type StructuredStory } from "@/lib/video/types";

type Props = {
  story: StructuredStory;
  errors: Record<string, string>;
  onChange: (story: StructuredStory) => void;
  onContinue: () => void;
  busy: boolean;
  resolution?: "720p" | "1080p";
  disabled?: boolean;
};

const fieldClass =
  "mt-2 min-h-12 w-full rounded-md border border-forest/20 bg-paper px-4 py-3 text-base text-ink outline-none transition placeholder:text-ink/40 focus:border-teal focus:ring-4 focus:ring-teal/10";

export function StoryForm({ story, errors, onChange, onContinue, busy, resolution = "720p", disabled = false }: Props) {
  const set = <K extends keyof StructuredStory>(key: K, value: StructuredStory[K]) =>
    onChange({ ...story, [key]: value });

  return (
    <form
      aria-describedby={Object.keys(errors).length ? "story-error-summary" : undefined}
      onSubmit={(event) => {
        event.preventDefault();
        onContinue();
      }}
      className="space-y-8"
    >
      <fieldset disabled={busy} className="space-y-8">
      {Object.keys(errors).length > 0 && (
        <div id="story-error-summary" role="alert" className="rounded-md border border-coral/40 bg-coral/10 p-5">
          <p className="font-semibold text-forest">Please check these parts of your story:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
            {Object.entries(errors).map(([field, message]) => (
              <li key={field}>
                <a className="underline underline-offset-2" href={`#${field}`}>{message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block font-medium text-forest" htmlFor="title">Story title</label>
          <input id="title" value={story.title} onChange={(e) => set("title", e.target.value)} className={fieldClass} maxLength={80} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? "title-error" : undefined} />
          {errors.title && <span id="title-error" className="mt-2 block text-sm text-red-800">{errors.title}</span>}
        </div>
        <div>
          <label className="block font-medium text-forest" htmlFor="mainCharacter">Main character</label>
          <input id="mainCharacter" value={story.mainCharacter} onChange={(e) => set("mainCharacter", e.target.value)} className={fieldClass} maxLength={120} placeholder="A curious fox called Fern" aria-invalid={Boolean(errors.mainCharacter)} />
          <span className="mt-2 block text-sm font-normal text-ink/60">Make your character fictional. Do not use a real person&apos;s name.</span>
        </div>
      </div>

      <div>
        <label className="block font-medium text-forest" htmlFor="setting">Setting</label>
        <input id="setting" value={story.setting} onChange={(e) => set("setting", e.target.value)} className={fieldClass} maxLength={160} placeholder="A floating library above the clouds" aria-invalid={Boolean(errors.setting)} />
      </div>

      <div>
        <label className="block font-medium text-forest" htmlFor="action">What happens?</label>
        <textarea id="action" value={story.action} onChange={(e) => set("action", e.target.value)} className={`${fieldClass} min-h-32 resize-y`} maxLength={500} placeholder="Describe the beginning, one important choice and how the moment ends." aria-invalid={Boolean(errors.action)} />
        <span className="mt-2 block text-sm font-normal text-ink/60">{story.action.length}/500 characters</span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label className="block font-medium text-forest" htmlFor="value">Value or theme</label>
          <select id="value" value={story.value} onChange={(e) => set("value", e.target.value as StructuredStory["value"])} className={fieldClass}>
            {storyValues.map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium text-forest" htmlFor="style">Visual style</label>
          <select id="style" value={story.style} onChange={(e) => set("style", e.target.value as StructuredStory["style"])} className={fieldClass}>
            {visualStyles.map((style) => <option key={style}>{style}</option>)}
          </select>
        </div>
        <div>
          <label className="block font-medium text-forest" htmlFor="mood">Mood</label>
          <select id="mood" value={story.mood} onChange={(e) => set("mood", e.target.value)} className={fieldClass}>
            {moods.map((mood) => <option key={mood}>{mood}</option>)}
          </select>
        </div>
        <fieldset>
          <legend className="font-medium text-forest">Video duration</legend>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {videoDurations.map((duration) => (
              <label key={duration} className={`flex min-h-12 cursor-pointer items-center justify-center rounded-md border px-3 py-2 text-sm font-semibold transition focus-within:ring-4 focus-within:ring-teal/10 ${story.duration === duration ? "border-forest bg-forest text-white" : "border-forest/20 bg-paper text-forest"}`}>
                <input className="sr-only" type="radio" name="duration" value={duration} disabled={resolution === "1080p" && duration !== 8} checked={story.duration === duration} onChange={() => set("duration", duration)} />
                {duration} seconds
              </label>
            ))}
          </div>
          {resolution === "1080p" && <p className="mt-2 text-sm text-ink/60">1080p videos require 8 seconds.</p>}
        </fieldset>
      </div>

      <div>
        <label className="block font-medium text-forest" htmlFor="dialogue">Optional dialogue or narration</label>
        <textarea id="dialogue" value={story.dialogue ?? ""} onChange={(e) => set("dialogue", e.target.value)} className={`${fieldClass} min-h-24 resize-y`} maxLength={280} placeholder="A short line your character might say" />
      </div>

      <button disabled={busy || disabled} className="min-h-12 rounded bg-forest px-7 py-3 font-semibold text-white transition hover:bg-forest/90 focus:outline-none focus:ring-4 focus:ring-teal/25 disabled:cursor-not-allowed disabled:opacity-60">
        {busy ? "Starting generation…" : "Generate video"}
      </button>
      </fieldset>
    </form>
  );
}
