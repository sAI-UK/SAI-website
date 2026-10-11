"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { visualStyles, type RuntimeMode } from "@/lib/video/types";
import { clipCost, sceneLengths, sceneNames, type FilmBrief, type PublicFilm } from "@/lib/film/types";
import { Spinner } from "./spinner";

const empty: FilmBrief = { title: "", character: "", story: "", style: "Storybook illustration", aspectRatio: "16:9" };
const field = "mt-2 min-h-12 w-full rounded-xl border border-forest/20 bg-white px-4 py-3 text-base font-normal text-ink outline-none focus:border-teal focus:ring-4 focus:ring-teal/10 disabled:bg-mist";
const button = "inline-flex min-h-12 items-center justify-center rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white transition hover:bg-forest/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal disabled:cursor-not-allowed disabled:opacity-50";
const secondary = "inline-flex min-h-11 items-center justify-center rounded-full border border-forest/20 px-5 py-2 text-sm font-semibold text-forest hover:bg-mist disabled:opacity-50";
const panel = "rounded-3xl border border-forest/10 bg-white p-6 shadow-card sm:p-8";
const activeStates = ["generating", "narrating", "assembling"];

export function FilmStudio({ mode }: { mode: RuntimeMode }) {
  const [brief, setBrief] = useState<FilmBrief>(empty);
  const [source, setSource] = useState<"text" | "image">("text");
  const [film, setFilm] = useState<PublicFilm | null>(null);
  const [scenes, setScenes] = useState<string[]>([]);
  const [narration, setNarration] = useState("");
  const [narrate, setNarrate] = useState(true);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  const [acknowledge, setAcknowledge] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const session = useRef(""); const planKey = useRef(""); const actionKey = useRef("");
  const pending = useRef(false); const mounted = useRef(true); const checksStarted = useRef(0);

  const accept = useCallback((next: PublicFilm, edit = false) => {
    setFilm(next); sessionStorage.setItem("sai-active-film", next.id);
    if (edit) { setScenes(next.scenes.map(scene => scene.description)); setNarration(next.narration); setNarrate(next.narrate); }
  }, []);
  useEffect(() => {
    mounted.current = true;
    session.current = localStorage.getItem("sai-film-session") || `session_${crypto.randomUUID()}`;
    localStorage.setItem("sai-film-session", session.current);
    planKey.current = sessionStorage.getItem("sai-film-plan-key") || `plan_${crypto.randomUUID()}`;
    sessionStorage.setItem("sai-film-plan-key", planKey.current);
    const saved = sessionStorage.getItem("sai-active-film");
    if (saved) fetch(`/api/films/${saved}`, { headers: { "x-film-session": session.current }, cache: "no-store" }).then(async response => {
      const data = await response.json();
      if (!mounted.current) return;
      if (!response.ok) { if ([404, 410].includes(response.status)) sessionStorage.removeItem("sai-active-film"); throw new Error(data.error?.message || "Could not restore your film."); }
      accept(data.film, true); checksStarted.current = Date.now();
    }).catch(error => { if (mounted.current) setMessage(error.message); }).finally(() => { if (mounted.current) setRestoring(false); });
    else setRestoring(false);
    return () => { mounted.current = false; };
  }, [accept]);

  useEffect(() => {
    if (!film || !activeStates.includes(film.status) || paused) return;
    let stopped = false;
    const timer = setTimeout(async () => {
      if (Date.now() - checksStarted.current > 30 * 60_000) { setPaused(true); return; }
      try {
        const response = await fetch(`/api/films/${film.id}`, { method: "POST", headers: { "Content-Type": "application/json", "x-film-session": session.current }, body: JSON.stringify({ action: "advance" }) });
        const data = await response.json();
        if (stopped) return;
        if (!response.ok) throw new Error(data.error?.message || "Could not check your film.");
        accept(data.film); setMessage("");
      } catch (error) { if (!stopped) { setMessage(`${(error as Error).message} Your completed scenes are saved.`); setPaused(true); } }
    }, film.mode === "demo" ? 750 : 5000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [film, paused, accept]);

  function changeBrief(next: FilmBrief) { setBrief(next); planKey.current = `plan_${crypto.randomUUID()}`; sessionStorage.setItem("sai-film-plan-key", planKey.current); }
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { setMessage("Choose a PNG, JPEG or WebP image up to 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { changeBrief({ ...brief, image: String(reader.result) }); setMessage(""); };
    reader.onerror = () => setMessage("This image could not be read. Please try another file.");
    reader.readAsDataURL(file);
  }
  async function plan(event: React.FormEvent) {
    event.preventDefault(); if (pending.current) return;
    if (source === "image" && !brief.image) { setMessage("Upload a reference image first."); return; }
    pending.current = true; setBusy("Planning your four scenes"); setMessage("");
    try {
      const response = await fetch("/api/films", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ session: session.current, key: planKey.current, brief: { ...brief, image: source === "image" ? brief.image : undefined } }) });
      const data = await response.json(); if (!response.ok) throw new Error(data.error?.message || "Could not plan this film.");
      accept(data.film, true);
    } catch (error) { setMessage((error as Error).message); }
    finally { pending.current = false; setBusy(""); }
  }
  async function action(action: string, extra: Record<string, unknown> = {}) {
    if (!film || pending.current) return;
    pending.current = true; setBusy("Saving your film"); setMessage("");
    if (!actionKey.current) actionKey.current = `action_${crypto.randomUUID()}`;
    try {
      const response = await fetch(`/api/films/${film.id}`, { method: "POST", headers: { "Content-Type": "application/json", "x-film-session": session.current }, body: JSON.stringify({ action, key: actionKey.current, ...extra }) });
      const data = await response.json();
      if (!response.ok) { actionKey.current = ""; throw new Error(data.error?.message || "This action could not be completed."); }
      accept(data.film, true); actionKey.current = ""; setPaused(false); setAcknowledge(false); checksStarted.current = Date.now();
    } catch (error) { setMessage((error as Error).message); }
    finally { pending.current = false; setBusy(""); }
  }
  function reset() { setFilm(null); setScenes([]); setNarration(""); setMessage(""); setPaused(false); actionKey.current = ""; sessionStorage.removeItem("sai-active-film"); changeBrief(empty); setSource("text"); }
  const stage = !film ? 0 : film.status === "draft" ? 1 : film.status === "completed" ? 3 : 2;
  const active = Boolean(film && activeStates.includes(film.status));
  const current = film?.scenes.findIndex(scene => scene.status !== "ready") ?? -1;
  const statusText = current >= 0 ? `Generating scene ${current + 1} of 4` : film?.status === "narrating" ? "Recording your narration" : "Assembling your film";
  const demo = (film?.mode ?? mode) === "demo";

  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
    <nav aria-label="Film creation steps"><ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">{["Start your story", "Review scenes", "Create your film", "Watch & refine"].map((label, index) => <li key={label} aria-current={stage === index ? "step" : undefined} className={`rounded-xl border px-3 py-3 text-sm font-semibold ${stage === index ? "border-forest bg-forest text-white" : "border-forest/10 bg-white text-forest/70"}`}><span className="mr-2 opacity-60">0{index + 1}</span>{label}</li>)}</ol></nav>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-sm text-ink/70"><p>Four scenes · 30 seconds · 720p</p><p>{demo ? "Demo mode · placeholder clips, no paid generation" : mode === "unconfigured" ? "Add your Gemini API key on the server to begin" : "Powered by Veo · paid generation"}</p></div>
    {message && <div role="alert" className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{message}</div>}
    {restoring ? <div className={`${panel} mt-8`}><Spinner label="Restoring your studio" /></div> : !film ? <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <form onSubmit={plan} className={panel}><fieldset disabled={Boolean(busy)} className="space-y-6"><div><p className="text-sm font-semibold uppercase tracking-widest text-teal">Your idea comes first</p><h2 className="mt-2 font-serif text-3xl text-forest">Start your story</h2></div>
        <fieldset><legend className="font-medium text-forest">How would you like to begin?</legend><div className="mt-3 grid grid-cols-2 gap-3">{(["text", "image"] as const).map(value => <label key={value} className={`cursor-pointer rounded-2xl border p-4 text-sm font-semibold focus-within:ring-2 focus-within:ring-teal ${source === value ? "border-teal bg-sky/40 text-forest" : "border-forest/15"}`}><input type="radio" name="source" checked={source === value} onChange={() => { setSource(value); changeBrief(brief); }} className="mr-2 accent-teal" />{value === "text" ? "Start with text" : "Use a reference image"}</label>)}</div></fieldset>
        {source === "image" && <div className="rounded-2xl border border-dashed border-teal/40 bg-mist p-5"><label className="font-medium text-forest">Reference image<input className="mt-3 block w-full text-sm file:mr-3 file:rounded-full file:border-0 file:bg-forest file:px-4 file:py-2 file:text-white" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => upload(event.target.files?.[0])} /></label><p className="mt-2 text-xs leading-5 text-ink/70">PNG, JPEG or WebP · up to 5 MB. Use a clear character image you have permission to use. Google’s content restrictions apply.</p>{brief.image && <div className="mt-4 flex items-center gap-4"><Image src={brief.image} alt="Your character reference" width={144} height={144} unoptimized className="h-36 w-36 rounded-xl object-contain" /><button type="button" className={secondary} onClick={() => changeBrief({ ...brief, image: undefined })}>Remove image</button></div>}</div>}
        <label className="block font-medium text-forest">Film title<input required maxLength={80} className={field} value={brief.title} onChange={event => changeBrief({ ...brief, title: event.target.value })} placeholder="Fern and the little bridge" /></label>
        <label className="block font-medium text-forest">Main character<textarea required maxLength={600} className={`${field} min-h-24`} value={brief.character} onChange={event => changeBrief({ ...brief, character: event.target.value })} placeholder="A small orange fox in a red coat, curious and kind" /><span className="mt-1 block text-xs font-normal text-ink/60">Describe the features you want to stay consistent across scenes.</span></label>
        <label className="block font-medium text-forest">What happens in your story?<textarea required minLength={10} maxLength={2000} className={`${field} min-h-32`} value={brief.story} onChange={event => changeBrief({ ...brief, story: event.target.value })} placeholder="A fox notices a rabbit struggling to cross a stream and finds a way to help." /></label>
        <div className="grid gap-5 sm:grid-cols-2"><label className="font-medium text-forest">Visual style<select className={field} value={brief.style} onChange={event => changeBrief({ ...brief, style: event.target.value })}>{visualStyles.map(style => <option key={style}>{style}</option>)}</select></label><label className="font-medium text-forest">Format<select className={field} value={brief.aspectRatio} onChange={event => changeBrief({ ...brief, aspectRatio: event.target.value as FilmBrief["aspectRatio"] })}><option value="16:9">Landscape · 16:9</option><option value="9:16">Portrait · 9:16</option></select></label></div>
        <p className="text-sm leading-6 text-ink/65">Review the scene plan before generating video.{!demo && " Planning uses a small paid text-model request; no video is generated yet."}</p>
        <button className={button} disabled={Boolean(busy) || mode === "unconfigured"}>{busy ? <Spinner label={busy} /> : "Plan my film"}</button>
      </fieldset></form>
      <aside className={`${panel} h-fit`}><p className="text-sm uppercase tracking-widest text-teal">A story in four moments</p><ol className="mt-6 space-y-6">{sceneNames.map((name, index) => <li key={name} className="flex gap-3"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-sm font-semibold text-teal">{index + 1}</span><div><h3 className="font-semibold text-forest">{name}</h3><p className="mt-1 text-sm leading-6 text-ink/70">{["Meet your character and their world.", "Give them something to overcome.", "Show the choice that makes a difference.", "Bring the story to a satisfying close."][index]}</p></div></li>)}</ol><p className="mt-6 border-t border-forest/10 pt-5 text-sm leading-6 text-ink/65">One character, one location and a clear action make a stronger short film.</p></aside>
    </div> : <div className="mt-8 space-y-6">
      <section className={panel}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm uppercase tracking-widest text-teal">{film.status === "draft" ? "Shape the story" : film.status === "completed" ? "Your film is ready" : "Your film is taking shape"}</p><h2 className="mt-2 font-serif text-3xl text-forest">{film.brief.title}</h2><p className="mt-2 text-sm text-ink/65">{film.brief.style} · {film.brief.aspectRatio === "16:9" ? "Landscape" : "Portrait"}{film.hasImage ? " · Shared character reference" : ""}</p></div>{!active && <button className={secondary} disabled={Boolean(busy)} onClick={reset}>{film.status === "draft" ? "Change story" : "Start a new film"}</button>}</div>
        {active && <div className="mt-6 rounded-2xl bg-sky/50 p-5 text-forest">{paused ? <p>Automatic checks are paused. Your saved scenes are safe.</p> : <Spinner label={statusText} />}<p className="mt-3 text-sm leading-6 text-ink/65">Each scene can take several minutes. Keep this page open to continue the sequence; return to this tab to resume after a refresh.</p>{paused && <button className={`${secondary} mt-3`} onClick={() => { checksStarted.current = Date.now(); setPaused(false); }}>Resume film creation</button>}</div>}
        {film.error && <p role="alert" className="mt-5 rounded-xl bg-amber-50 p-4 text-sm text-amber-950">{film.error}</p>}
        {film.status === "completed" && film.media && <><video aria-label="Your completed 30-second film" src={film.media} controls playsInline className="mx-auto mt-6 max-h-[65vh] w-full rounded-2xl bg-forest" /><div className="mt-5 flex flex-wrap items-center gap-4"><a className={button} href={`${film.media}&download=1`} download>Download MP4</a><p className="text-sm text-ink/65">Download within 48 hours. Edit a scene below to make another version.</p></div></>}
        {demo && <p className="mt-4 text-sm text-ink/65">Demo clips are abstract placeholders. The demo export is silent; live generation uses your story and optional narration.</p>}
      </section>
      <div className="grid gap-5 md:grid-cols-2">{film.scenes.map((scene, index) => <section key={index} className={panel}><div className="mb-4 flex items-center justify-between gap-3"><h3 className="font-serif text-2xl text-forest">{index + 1}. {sceneNames[index]}</h3><span className="rounded-full bg-mist px-3 py-1 text-xs text-forest">{sceneLengths[index]}s in film</span></div>
        {scene.media && <video aria-label={`Scene ${index + 1} preview`} src={scene.media} controls playsInline preload="metadata" className="mb-4 max-h-64 w-full rounded-xl bg-forest" />}
        <label className="block text-sm font-medium text-forest">Scene {index + 1} description<textarea maxLength={1200} minLength={10} className={`${field} min-h-36 text-sm leading-6`} disabled={active || Boolean(busy)} value={scenes[index] ?? scene.description} onChange={event => { actionKey.current = ""; setScenes(previous => previous.map((value, position) => position === index ? event.target.value : value)); }} /></label>
        {film.status !== "draft" && <div className="mt-3 text-sm text-forest">{["generating", "submitting"].includes(scene.status) && !paused ? <Spinner label="Generating" /> : <span>{({ ready: "Ready", waiting: "Waiting", failed: "Needs attention", uncertain: "Submission unconfirmed", generating: "Generating", submitting: "Submitting" })[scene.status]}</span>}</div>}
        {scene.error && <p className="mt-3 text-sm leading-6 text-red-900">{scene.error}</p>}
        {scene.status === "uncertain" && <label className="mt-3 flex items-start gap-2 text-sm leading-6"><input type="checkbox" checked={acknowledge} onChange={event => setAcknowledge(event.target.checked)} className="mt-1" />I have checked Google usage and understand a retry may add another charge.</label>}
        {!active && film.status !== "draft" && ["ready", "failed", "uncertain"].includes(scene.status) && <button className={`${secondary} mt-4`} disabled={Boolean(busy) || (scene.status === "uncertain" && !acknowledge) || film.attempts >= 12} onClick={() => action("retry-scene", { index, description: scenes[index], acknowledge })}>{scene.status === "ready" ? "Regenerate" : "Retry"} scene {index + 1}{demo ? "" : ` · $${clipCost.toFixed(2)}`}</button>}
      </section>)}</div>
      {film.status === "draft" && <section className={panel}><h3 className="font-serif text-2xl text-forest">One voice for the whole story</h3><label className="mt-4 flex items-center gap-3 text-sm font-medium"><input type="checkbox" checked={narrate} onChange={event => setNarrate(event.target.checked)} className="h-4 w-4 accent-teal" />Add a continuous narration track</label>{narrate && <label className="mt-4 block text-sm font-medium">Narration script<textarea maxLength={900} className={`${field} min-h-32`} value={narration} onChange={event => setNarration(event.target.value)} /><span className="mt-2 block text-xs font-normal text-ink/65">{narration.trim().split(/\s+/).filter(Boolean).length}/80 words · Aim for 45–60 words. Clip soundtracks are removed.</span></label>}<div className="mt-6 rounded-2xl bg-mist p-5"><p className="font-semibold text-forest">{demo ? "Demo generation · no charge" : `Estimated video cost: $${(clipCost * 4).toFixed(2)} USD`}</p><p className="mt-2 text-sm leading-6 text-ink/65">{demo ? "Test the whole flow with four placeholder clips." : "Four 8-second generations, edited into 30 seconds. Planning and narration are billed separately by Google. Each replacement clip is approximately $0.80. Prices exclude taxes."}</p></div><button className={`${button} mt-6`} disabled={Boolean(busy) || scenes.some(scene => scene.trim().length < 10) || (narrate && narration.trim().split(/\s+/).length > 80)} onClick={() => action("start", { scenes, narration, narrate })}>{busy ? <Spinner label={busy} /> : "Generate my film"}</button></section>}
      {film.status === "failed" && film.scenes.every(scene => scene.status === "ready") && <section className={panel}><h3 className="font-serif text-2xl text-forest">Your four scenes are saved</h3><p className="mt-3 text-sm leading-6 text-ink/70">Retry the final step without regenerating your clips. A new narration request may incur another audio charge.</p><div className="mt-4 flex flex-wrap gap-3"><button disabled={Boolean(busy)} className={button} onClick={() => action("assemble")}>Retry final assembly</button><button disabled={Boolean(busy)} className={secondary} onClick={() => action("assemble", { withoutNarration: true })}>Assemble without narration</button></div></section>}
      {busy && film.status !== "draft" && <div className="text-forest"><Spinner label={busy} /></div>}
    </div>}
  </div>;
}
