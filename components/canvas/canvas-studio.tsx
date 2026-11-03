"use client";
import { useRef, useState } from "react";
import { DrawingBoard, type DrawingBoardHandle } from "./drawing-board";
import { MoviePlayer, type MovieAssets } from "./movie-player";
import { movieTemplates, surpriseTemplateId, findTemplate } from "@/lib/canvas/templates";
import { sampleStory, sampleStyle, showcaseScript } from "@/lib/canvas/showcase";
import { StorybookAudio } from "@/lib/canvas/storybook-audio";

type Movie = {
  id: number;
  code: string;
  script: string;
  source: "ai" | "template" | "showcase";
  fixed: boolean;
  assets: MovieAssets;
  request: Record<string, unknown>;
};

// Quick ideas for the animation style. Children can also write their own.
const styleIdeas = [
  { label: "Watercolour", text: "Soft glowing watercolour storybook with gentle painted washes." },
  { label: "Paper cut-out", text: "Paper cut-out storybook with torn edges and soft shadows." },
  { label: "Neon", text: "Bright neon glow on a dark sky, like a light show." },
  { label: "Chalkboard", text: "Chalk drawing on a blackboard, dusty and hand-drawn." },
  { label: "Comic", text: "Bold comic book with thick outlines and big captions." },
  { label: "Pixel game", text: "Retro pixel-art video game." },
  { label: "Old ink book", text: "Old sepia ink storybook with wobbly hand-drawn lines." },
  { label: "Dreamy", text: "Soft, glowing, pastel dream." },
];

const templateChoices = [{ id: surpriseTemplateId, label: "Surprise me", description: "Let the AI pick the best shape for your story." }, ...movieTemplates];

async function requestMovie(body: Record<string, unknown>) {
  const response = await fetch("/api/canvas/movie", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || "The movie could not be written.");
  return data as { script: string; code: string; source: "ai" | "template"; note?: string };
}

export function CanvasStudio() {
  const board = useRef<DrawingBoardHandle>(null);
  const [story, setStory] = useState("");
  const [styleText, setStyleText] = useState("");
  const [template, setTemplate] = useState(surpriseTemplateId);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showCode, setShowCode] = useState(false);
  const nextId = useRef(1);
  const [audio] = useState(() => new StorybookAudio());
  const [muted, setMuted] = useState(false);
  const [sampleLoaded, setSampleLoaded] = useState(false);

  const playTemplate = (assets: MovieAssets, request: Record<string, unknown>, message: string) => {
    const fallback = findTemplate(template) ?? movieTemplates[0];
    setNotice(message);
    setMovie({ id: nextId.current++, code: fallback.code, script: fallback.code, source: "template", fixed: true, assets, request });
  };

  const fillSample = () => {
    if (!board.current?.drawSample()) { setNotice("The brushes are still loading. Try again in a moment."); return; }
    setStory(sampleStory);
    setStyleText(sampleStyle);
    setTemplate(surpriseTemplateId);
    setNotice(null);
    setSampleLoaded(true);
  };

  // Plays the hand-made showcase movie for the sample drawing (no AI), to show the player at its best.
  const playShowcase = () => {
    if (!board.current || board.current.isEmpty()) return;
    audio.unlock();
    const layers = board.current.exportLayers();
    setNotice(null);
    setShowCode(false);
    setMovie({ id: nextId.current++, code: showcaseScript, script: showcaseScript, source: "showcase", fixed: true, assets: { background: layers.background, hero: layers.hero, story: sampleStory }, request: {} });
  };

  const bringToLife = async () => {
    if (!board.current) return;
    if (story.trim().length < 3) { setNotice("Write a few words of your story first."); return; }
    if (board.current.isEmpty()) { setNotice("Draw something first: your character, a background or both."); return; }
    audio.unlock();
    const layers = board.current.exportLayers();
    const assets: MovieAssets = { background: layers.background, hero: layers.hero, story: story.trim() };
    const request = { story: story.trim(), style: styleText.trim(), template, preview: layers.preview, drawing: { hasBackground: !!layers.background, hasHero: !!layers.hero } };
    setBusy("Writing your movie…");
    setNotice(null);
    setShowCode(false);
    try {
      const result = await requestMovie(request);
      setNotice(result.note ?? null);
      setMovie({ id: nextId.current++, ...result, fixed: false, assets, request });
    } catch (error) {
      playTemplate(assets, request, `${error instanceof Error ? error.message : "The AI could not be reached."} Playing the template instead.`);
    } finally { setBusy(null); }
  };

  // If the AI's script breaks while playing, ask the AI to fix it once, then fall back to the template.
  const onPlayerError = async (message: string) => {
    if (!movie) return;
    console.warn("[SAI Canvas]", message);
    if (movie.source !== "ai") { setNotice(message); return; }
    if (movie.fixed) { playTemplate(movie.assets, movie.request, `${message} Playing the template instead.`); return; }
    setBusy("Fixing a small mistake in the movie…");
    try {
      const result = await requestMovie({ ...movie.request, fix: { script: movie.script, error: message } });
      setNotice(result.note ?? null);
      setMovie({ ...movie, id: nextId.current++, ...result, fixed: true });
    } catch (error) {
      playTemplate(movie.assets, movie.request, `${error instanceof Error ? error.message : message} Playing the template instead.`);
    } finally { setBusy(null); }
  };

  const storyPanel = (
        <form
          className="flex flex-col gap-3"
          onSubmit={(event) => { event.preventDefault(); void bringToLife(); }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.06em] text-teal">SAI Canvas</p>
            <h1 className="mt-1 font-display text-lg leading-snug text-ink">Draw it. Tell it. Watch it move.</h1>
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="canvas-story" className="font-display text-base font-semibold text-forest">Your story</label>
            <button type="button" className="rounded border border-sand bg-white/70 px-2 py-1 text-xs text-forest hover:border-forest/50" onClick={fillSample}>Fill in a sample</button>
          </div>
          <textarea
            id="canvas-story"
            value={story}
            onChange={(event) => setStory(event.target.value)}
            maxLength={1500}
            rows={6}
            placeholder="What happens in your story? Once upon a time…"
            className="w-full resize-none rounded border border-sand bg-white/80 p-2 text-sm leading-6 text-ink placeholder:text-ink/45 focus:border-forest focus:outline-none"
          />
          <div>
            <label htmlFor="canvas-style" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.06em] text-ink/60">Animation style</label>
            <textarea
              id="canvas-style"
              value={styleText}
              onChange={(event) => setStyleText(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="How should it look? Glowing watercolour, neon, chalk…"
              className="w-full resize-none rounded border border-sand bg-white/80 p-2 text-sm leading-6 text-ink placeholder:text-ink/45 focus:border-forest focus:outline-none"
            />
            <div className="mt-1.5 flex flex-wrap gap-1">
              {styleIdeas.map((idea) => (
                <button key={idea.label} type="button" onClick={() => setStyleText(idea.text)} className="rounded-full border border-sand bg-white/60 px-2 py-0.5 text-[11px] text-ink/75 hover:border-forest/50">{idea.label}</button>
              ))}
            </div>
          </div>
          <fieldset>
            <legend className="mb-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-ink/60">Story shape</legend>
            <div className="flex flex-wrap gap-1.5">
              {templateChoices.map((choice) => (
                <button
                  key={choice.id}
                  type="button"
                  title={choice.description}
                  aria-pressed={template === choice.id}
                  onClick={() => setTemplate(choice.id)}
                  className={`rounded-full border px-2.5 py-1 text-xs transition ${template === choice.id ? "border-forest bg-forest text-paper" : "border-sand bg-white/70 text-ink/80 hover:border-forest/50"}`}
                >{choice.label}</button>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={!!busy} className="w-full rounded bg-forest px-4 py-2.5 text-sm font-semibold text-paper transition hover:bg-forest/90 disabled:opacity-60">
            {busy ?? "Bring it to life"}
          </button>
          {sampleLoaded && story === sampleStory && (
            <button type="button" onClick={playShowcase} className="w-full rounded border border-forest/40 bg-white/70 px-4 py-2 text-sm font-semibold text-forest transition hover:border-forest">
              Watch the hand-made showcase
            </button>
          )}
          {notice && !movie && <p role="status" className="text-xs leading-5 text-coral">{notice}</p>}
          <p className="text-xs leading-5 text-ink/60">Tip: draw your character on the <strong>Character</strong> layer so it can move around, and the scenery on the <strong>Background</strong> layer.</p>
        </form>
  );

  // A full-screen workspace: the canvas fills the space beside the story panel (stacked on small screens).
  return (
    <div>
      <section className="flex flex-col gap-3 p-3 sm:p-4 lg:h-[calc(100dvh-81px)] lg:flex-row">
        <div className="min-w-0 lg:h-full lg:flex-1">
          <DrawingBoard ref={board} />
        </div>
        <aside className="w-full shrink-0 overflow-y-auto rounded border border-sand bg-paper p-4 lg:h-full lg:w-[23rem]">
          {storyPanel}
        </aside>
      </section>

      {movie && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/80 p-4" role="dialog" aria-modal="true" aria-label="Your movie">
          <div className="w-full max-w-5xl space-y-3">
            {busy ? (
              <div className="flex aspect-video w-full items-center justify-center rounded bg-ink text-paper">{busy}</div>
            ) : (
              <MoviePlayer key={movie.id} code={movie.code} assets={movie.assets} audio={audio} onError={(message) => void onPlayerError(message)} />
            )}
            {notice && <p role="status" className="rounded bg-paper/90 px-3 py-2 text-sm text-ink">{notice}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded bg-paper px-4 py-2 text-sm font-semibold text-forest" onClick={() => { audio.unlock(); setMovie({ ...movie, id: nextId.current++ }); }}>Play again</button>
              <button type="button" className="rounded border border-paper/60 px-4 py-2 text-sm text-paper" aria-pressed={!muted} onClick={() => { audio.setMuted(!muted); setMuted(!muted); }}>{muted ? "Sound off" : "Sound on"}</button>
              <button type="button" className="rounded bg-paper px-4 py-2 text-sm font-semibold text-forest" onClick={() => { setMovie(null); setNotice(null); }}>Back to my drawing</button>
              <button type="button" className="rounded border border-paper/60 px-4 py-2 text-sm text-paper" aria-expanded={showCode} onClick={() => setShowCode(!showCode)}>{showCode ? "Hide the code" : movie.source === "ai" ? "See the code the AI wrote" : "See the movie code"}</button>
              <span className="self-center text-xs text-paper/70">{movie.source === "ai" ? "Written by the AI from your story" : movie.source === "showcase" ? "Hand-made showcase" : "Template movie"}</span>
            </div>
            {showCode && <pre className="max-h-64 overflow-auto rounded bg-black/70 p-3 text-xs leading-5 text-paper"><code>{movie.script}</code></pre>}
          </div>
        </div>
      )}
    </div>
  );
}
