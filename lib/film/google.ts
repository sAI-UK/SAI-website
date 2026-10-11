import { geminiKey, validVideoUri } from "@/lib/video/providers/veo";

export class GoogleRequestError extends Error {
  constructor(message: string, public readonly status?: number) { super(message); }
  get uncertain() { return this.status === undefined || this.status >= 500 || this.status === 408; }
}

function safeDiagnostic(message: unknown, key: string, body: unknown) {
  if (typeof message !== "string") return "";
  let cleaned = message.split(key).join("[redacted]");
  // Providers can echo request values. Keep field names and validation details,
  // but remove supplied prompts, images and credentials before returning errors.
  const redact = (value: unknown) => {
    if (typeof value === "string" && value.length > 24) cleaned = cleaned.split(value).join("[request content]");
    else if (Array.isArray(value)) value.forEach(redact);
    else if (value && typeof value === "object") Object.values(value).forEach(redact);
  };
  redact(body);
  return cleaned.replace(/AIza[A-Za-z0-9_-]+/g, "[redacted]").replace(/https?:\/\/\S+/g, "[provider link]").replace(/[A-Za-z0-9+/=]{120,}/g, "[encoded content]").replace(/[\r\n]+/g, " ").slice(0, 700);
}

export async function google(path: string, body?: unknown, timeout = 120_000) {
  const key = geminiKey();
  const stage = path.includes("predictLongRunning") ? "scene generation" : path.includes("/operations/") ? "video status check" : path === "interactions" ? "narration" : "story planning";
  let response: Response;
  try { response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${path}`, { method: body ? "POST" : "GET", headers: { "x-goog-api-key": key, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(timeout), cache: "no-store" }); }
  catch { throw new GoogleRequestError(`Google could not be reached during ${stage}. The request may have been accepted; check your Google usage before retrying.`); }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const diagnostic = safeDiagnostic(data.error?.message, key, body);
    const code = typeof data.error?.status === "string" && /^[A-Z_]+$/.test(data.error.status) ? ` ${data.error.status}` : "";
    const fallback = response.status === 429 ? "Google's quota has been reached." : "Google did not provide further details.";
    throw new GoogleRequestError(`Google rejected ${stage} (${response.status}${code}): ${diagnostic || fallback}`, response.status);
  }
  return response.json();
}
export async function downloadClip(uri: string) {
  if (!validVideoUri(uri)) throw new Error("Unsupported video location.");
  let url = new URL(uri);
  for (let redirect = 0; redirect < 5; redirect++) {
    const googleHost = url.hostname === "generativelanguage.googleapis.com";
    if (url.protocol !== "https:" || (!googleHost && url.hostname !== "storage.googleapis.com") || url.username || url.password || url.port) throw new Error("Unsupported media redirect.");
    const response = await fetch(url, { headers: googleHost ? { "x-goog-api-key": geminiKey() } : {}, redirect: "manual", signal: AbortSignal.timeout(120_000) });
    if ([301, 302, 303, 307, 308].includes(response.status)) { const location = response.headers.get("location"); if (!location) break; url = new URL(location, url); continue; }
    if (!response.ok) throw new Error("The clip could not be downloaded. Check again before generating a replacement.");
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > 100 * 1024 * 1024) throw new Error("The generated clip is too large.");
    return bytes;
  }
  throw new Error("The video download did not complete.");
}
