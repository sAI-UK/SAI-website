"use client";
import { useEffect, useRef, useState } from "react";
import { scriptPlaceholder, wrapMovieScript } from "@/lib/canvas/player-shell";
import type { StorybookAudio } from "@/lib/canvas/storybook-audio";

export type MovieAssets = {
  background: string | null;
  hero: { src: string; x: number; y: number; w: number; h: number } | null;
  story: string;
};

let shellRequest: Promise<string> | null = null;
function loadShell() {
  shellRequest ??= fetch("/api/canvas/player", { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("The movie player could not be loaded.");
    return response.text();
  }).catch((error) => { shellRequest = null; throw error; });
  return shellRequest;
}

const readyTimeout = 10_000;
const heartbeatTimeout = 4_000;

/**
 * Plays a movie script inside a sandboxed iframe. The iframe has its own "null" origin,
 * no network access (see the CSP in app/api/canvas/player/route.ts) and only receives the drawing.
 * A watchdog removes it if it stops responding or runs too long.
 */
export function MoviePlayer({ code, assets, audio, onError, onFinished }: { code: string; assets: MovieAssets; audio?: StorybookAudio; onError: (message: string) => void; onFinished?: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [stopped, setStopped] = useState(false);
  const callbacks = useRef({ onError, onFinished });
  callbacks.current = { onError, onFinished };

  useEffect(() => {
    let cancelled = false;
    loadShell().then((shell) => { if (!cancelled) setHtml(shell.split(scriptPlaceholder).join(wrapMovieScript(code))); }).catch((error) => callbacks.current.onError(error.message));
    return () => { cancelled = true; };
  }, [code]);

  useEffect(() => {
    if (!html) return;
    let lastSign = Date.now();
    let phase: "loading" | "playing" | "done" = "loading";
    let deadline = Date.now() + readyTimeout;
    const stop = (message: string) => {
      phase = "done";
      audio?.stop(0.3);
      setStopped(true);
      callbacks.current.onError(message);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.data?.source !== "sai-movie" || phase === "done") return;
      const data = event.data;
      lastSign = Date.now();
      if (data.type === "ready") frame.current?.contentWindow?.postMessage({ type: "assets", ...assets }, "*");
      if (data.type === "started") { phase = "playing"; deadline = Date.now() + (Math.min(Number(data.duration) || 60, 130) + 10) * 1000; audio?.start(); }
      if (data.type === "scene" && typeof data.sky === "string") audio?.setSky(data.sky);
      if (data.type === "sound" && typeof data.name === "string") audio?.sfx(data.name);
      if (data.type === "finished") { phase = "done"; audio?.stop(); callbacks.current.onFinished?.(); }
      if (data.type === "error") stop(`${data.phase === "build" ? "The movie script has a problem" : "The movie stopped while playing"}: ${String(data.message).slice(0, 300)}`);
    };
    const watchdog = window.setInterval(() => {
      if (phase === "done") return;
      if (Date.now() > deadline) stop(phase === "loading" ? "The movie took too long to start." : "The movie ran for too long.");
      else if (phase === "playing" && Date.now() - lastSign > heartbeatTimeout) stop("The movie stopped responding.");
    }, 500);
    window.addEventListener("message", onMessage);
    return () => { window.removeEventListener("message", onMessage); window.clearInterval(watchdog); audio?.stop(0.3); };
  }, [html, assets, audio]);

  if (stopped) return <div className="flex aspect-video w-full items-center justify-center rounded bg-ink/90 text-paper">The movie was stopped.</div>;
  if (!html) return <div className="flex aspect-video w-full items-center justify-center rounded bg-ink/90 text-paper">Getting the stage ready…</div>;
  return <iframe ref={frame} title="Your story movie" sandbox="allow-scripts" srcDoc={html} className="aspect-video w-full rounded border-0 bg-ink" />;
}
