"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ImageIdea, ImageResult } from "@/lib/image/generation";

const initial: ImageIdea = { subject: "", setting: "", action: "", style: "Storybook illustration", mood: "Hopeful", lighting: "Soft natural light", composition: "", text: "", aspectRatio: "1:1" };
const fields = [
  { key: "subject", label: "Subject", placeholder: "Describe the person, character or object and its appearance", required: true },
  { key: "setting", label: "Setting and background", placeholder: "A woodland clearing with glowing flowers at sunset" },
  { key: "action", label: "Action or pose", placeholder: "A fox offering a lantern to a small dragon" },
  { key: "composition", label: "Composition", placeholder: "Eye-level view, main subjects centred, space around the edges" },
  { key: "text", label: "Text to include (optional)", placeholder: "Exact words to appear in the image" },
] as const;
const inputClass = "mt-2 min-h-12 w-full rounded-md border border-forest/20 bg-paper px-4 py-3 text-base text-ink focus:border-teal focus:outline-none focus:ring-4 focus:ring-teal/10";

export function ImageStudio({ configured }: { configured: boolean }) {
  const [idea, setIdea] = useState(initial);
  const [image, setImage] = useState<ImageResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const submitting = useRef(false);
  const requestKey = useRef("");

  function change<K extends keyof ImageIdea>(key: K, value: ImageIdea[K]) {
    requestKey.current = "";
    setIdea(current => ({ ...current, [key]: value }));
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setMessage(""); setErrors({});
    const sessionId = sessionStorage.getItem("sai-video-session") ?? `session_${crypto.randomUUID()}`;
    sessionStorage.setItem("sai-video-session", sessionId);
    if (!requestKey.current) requestKey.current = `image_${crypto.randomUUID()}`;
    try {
      const response = await fetch("/api/image/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idea, sessionId, idempotencyKey: requestKey.current }) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error?.message ?? "Image generation failed."); setErrors(data.error?.details ?? {}); return; }
      setImage(data.image);
    } catch { setMessage("The request could not be confirmed. Retry the unchanged form to recover it without submitting another generation."); }
    finally { setBusy(false); submitting.current = false; }
  }

  if (image) {
    const extension = image.mimeType === "image/jpeg" ? "jpg" : image.mimeType === "image/webp" ? "webp" : "png";
    return <section className="mx-auto max-w-4xl rounded-md border border-sand bg-paper p-6 shadow-card sm:p-8" aria-labelledby="image-result-title">
      <p className="text-sm font-semibold uppercase tracking-widest text-teal">Completed</p>
      <h2 id="image-result-title" className="mt-2 font-mono text-2xl text-ink">Your image is ready</h2>
      <Image src={image.dataUrl} alt={idea.subject} width={1024} height={1024} unoptimized className="mt-6 max-h-[70vh] w-full rounded-md bg-mist object-contain" />
      <p className="mt-4 text-sm text-ink/70">AI-generated with Nano Banana. Check details and lettering before using the image.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={image.dataUrl} download={`sai-creation.${extension}`} className="inline-flex min-h-12 items-center rounded bg-teal px-6 py-3 font-semibold text-white">Download image</a>
        <button onClick={() => { setImage(null); requestKey.current = ""; }} className="min-h-12 rounded border border-forest/20 px-6 py-3 font-semibold text-forest">Create another version</button>
        <button onClick={() => { setImage(null); setIdea(initial); requestKey.current = ""; }} className="min-h-12 rounded border border-forest/20 px-6 py-3 font-semibold text-forest">Start a new image</button>
      </div>
    </section>;
  }

  return <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
    <section className="rounded-md border border-sand bg-paper p-6 shadow-card sm:p-8" aria-labelledby="image-form-title">
      <h2 id="image-form-title" className="font-mono text-2xl text-ink">Describe your image</h2>
      <p className="mt-3 text-sm leading-6 text-ink/70">Build a still image with Nano Banana. Describe the details that matter most.</p>
      {!configured && <p role="status" className="mt-4 rounded bg-amber-50 p-4 text-sm text-amber-950">Add GEMINI_API_KEY to .env.local and restart the server to enable images.</p>}
      {message && <p role="alert" className="mt-4 rounded bg-amber-50 p-4 text-sm text-amber-950">{message}</p>}
      <form onSubmit={generate} className="mt-6">
        <fieldset disabled={busy} className="space-y-6">
          {fields.map(field => <div key={field.key}><label htmlFor={`image-${field.key}`} className="font-medium text-forest">{field.label}</label><textarea id={`image-${field.key}`} required={"required" in field && field.required} maxLength={600} value={idea[field.key]} onChange={e => change(field.key, e.target.value)} placeholder={field.placeholder} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `image-${field.key}-error` : undefined} className={`${inputClass} min-h-24 resize-y`} />{errors[field.key] && <p id={`image-${field.key}-error`} className="mt-2 text-sm text-red-900">{errors[field.key]}</p>}</div>)}
          <div className="grid gap-6 sm:grid-cols-2">
            <label className="font-medium text-forest">Visual style<select aria-label="Image visual style" className={inputClass} value={idea.style} onChange={e => change("style", e.target.value)}>{["Storybook illustration", "Watercolour", "Cinematic realism", "Colourful 2D illustration", "Clay art", "Paper cut-out", "Oil painting", "Pencil sketch"].map(value => <option key={value}>{value}</option>)}</select></label>
            <label className="font-medium text-forest">Mood<input aria-label="Image mood" className={inputClass} maxLength={600} value={idea.mood} onChange={e => change("mood", e.target.value)} /></label>
            <label className="font-medium text-forest">Lighting<input aria-label="Image lighting" className={inputClass} maxLength={600} value={idea.lighting} onChange={e => change("lighting", e.target.value)} /></label>
            <label className="font-medium text-forest">Image format<select aria-label="Image format" className={inputClass} value={idea.aspectRatio} onChange={e => change("aspectRatio", e.target.value as ImageIdea["aspectRatio"])}><option value="1:1">Square · 1:1</option><option value="16:9">Landscape · 16:9</option><option value="9:16">Portrait · 9:16</option><option value="4:3">Landscape · 4:3</option><option value="3:4">Portrait · 3:4</option></select></label>
          </div>
          <p className="text-sm text-ink/60">Each new generation uses your paid Gemini API balance.</p>
          <button disabled={busy || !configured} className="min-h-12 rounded bg-forest px-7 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Generating image…" : "Generate image"}</button>
          {busy && <p role="status" className="text-sm text-forest">Nano Banana is creating your image. This can take up to two minutes.</p>}
        </fieldset>
      </form>
    </section>
    <aside className="h-fit rounded-md border border-sand bg-paper p-6"><h2 className="font-mono text-xl text-ink">Compose a clear scene</h2><p className="mt-3 text-sm leading-6 text-ink/70">Describe the subject’s appearance, a precise setting, and the pose you want to capture. Lighting and composition help set the atmosphere.</p><p className="mt-4 text-sm leading-6 text-ink/70">For text, enter only the exact words you want. Download the result before closing the page.</p></aside>
  </div>;
}
