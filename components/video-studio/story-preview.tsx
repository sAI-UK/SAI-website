import type { StructuredStory } from "@/lib/video/types";

export function StoryPreview({ story, onEdit }: { story: StructuredStory; onEdit: () => void }) {
  const items = [
    ["Title", story.title],
    ["Main character", story.mainCharacter],
    ["Setting", story.setting],
    ["What happens", story.action],
    ["Value", story.value],
    ["Look and mood", `${story.style} · ${story.mood}`],
    ["Length", `${story.duration} seconds`],
    ...(story.dialogue ? [["Words", story.dialogue]] : []),
  ];
  return (
    <section aria-labelledby="story-plan-title" className="rounded-md border border-sand bg-paper p-6 shadow-card sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.06em] text-teal">Story plan</p>
          <h2 id="story-plan-title" className="mt-2 font-mono text-2xl text-ink">Your idea, in your words</h2>
        </div>
        <button onClick={onEdit} className="min-h-11 rounded border border-forest/20 px-5 py-2 text-sm font-semibold text-forest hover:bg-mist focus:outline-none focus:ring-4 focus:ring-teal/20">Edit story</button>
      </div>
      <dl className="mt-6 grid gap-5 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className={label === "What happens" ? "sm:col-span-2" : ""}>
            <dt className="text-xs font-semibold uppercase tracking-[0.15em] text-ink/75">{label}</dt>
            <dd className="mt-1 leading-7 text-ink/80">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
