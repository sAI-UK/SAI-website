import { spawn } from "node:child_process";
import { readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { filmPath } from "./store";
import { sceneLengths, type Film } from "./types";

export function ffmpegPath() { return process.env.FFMPEG_PATH || path.resolve("node_modules/ffmpeg-static", process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg"); }
export async function runFfmpeg(args: string[]) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(ffmpegPath(), ["-hide_banner", "-loglevel", "error", "-nostdin", "-y", ...args], { windowsHide: true, stdio: ["ignore", "ignore", "pipe"] });
    let diagnostic = "";
    child.stderr.on("data", chunk => { diagnostic = (diagnostic + chunk.toString()).slice(-2000); });
    const timer = setTimeout(() => { child.kill(); reject(new Error("Film assembly timed out. Your clips are saved; retry assembly.")); }, 150_000);
    child.on("error", () => { clearTimeout(timer); reject(new Error("Video assembly is unavailable. Install ffmpeg-static or configure FFMPEG_PATH.")); });
    child.on("close", code => { clearTimeout(timer); if (code === 0) resolve(); else reject(new Error(`Video processing failed. Your clips are saved; retry assembly.${diagnostic.includes("Invalid data") ? " A media file could not be decoded." : ""}`)); });
  });
}
export async function checkMediaEngine() { await runFfmpeg(["-version"]); }
export async function mockClip(film: Film, index: number) {
  const file = `scene-${index}-${film.scenes[index].attempts}.mp4`;
  const size = film.brief.aspectRatio === "9:16" ? "720x1280" : "1280x720";
  const colours = ["0x22594c", "0x3b6478", "0xa26b38", "0x457b66"];
  await runFfmpeg(["-f", "lavfi", "-i", `color=c=${colours[index]}:s=${size}:r=24:d=8`, "-vf", "drawbox=x='100+120*t':y=200:w=200:h=200:color=white@0.35:t=fill", "-c:v", "libx264", "-preset", "ultrafast", "-pix_fmt", "yuv420p", "-an", filmPath(film.id, file)]);
  return file;
}
export async function assembleFilm(film: Film) {
  const width = film.brief.aspectRatio === "9:16" ? 720 : 1280;
  const height = film.brief.aspectRatio === "9:16" ? 1280 : 720;
  const args = film.scenes.flatMap(scene => ["-i", filmPath(film.id, scene.file!)]);
  if (film.audio) args.push("-i", filmPath(film.id, film.audio));
  const filters = film.scenes.map((_, index) => `[${index}:v]trim=duration=${sceneLengths[index]},setpts=PTS-STARTPTS,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24[v${index}]`);
  filters.push("[v0][v1][v2][v3]concat=n=4:v=1:a=0[outv]");
  if (film.audio) filters.push("[4:a]apad,atrim=duration=30,afade=t=out:st=29.7:d=0.3[outa]");
  args.push("-filter_complex", filters.join(";"), "-map", "[outv]");
  if (film.audio) args.push("-map", "[outa]", "-c:a", "aac", "-b:a", "128k"); else args.push("-an");
  const output = `film-${film.revision}.mp4`;
  const temporary = `assembling-${film.revision}.mp4`;
  args.push("-c:v", "libx264", "-preset", "fast", "-crf", "22", "-pix_fmt", "yuv420p", "-t", "30", "-movflags", "+faststart", filmPath(film.id, temporary));
  await runFfmpeg(args);
  await rename(filmPath(film.id, temporary), filmPath(film.id, output));
  return output;
}
export async function saveNarration(film: Film, bytes: Buffer, mime: string) {
  const raw = mime.includes("wav") ? "voice-source.wav" : "voice-source.pcm";
  await writeFile(filmPath(film.id, raw), bytes);
  // Decode to PCM to measure duration, then fit the entire narration without cutting off words.
  const input = mime.includes("wav") ? [] : ["-f", "s16le", "-ar", "24000", "-ac", "1"];
  await runFfmpeg([...input, "-i", filmPath(film.id, raw), "-f", "s16le", "-ar", "24000", "-ac", "1", filmPath(film.id, "voice.pcm")]);
  const pcm = await readFile(filmPath(film.id, "voice.pcm"));
  const seconds = pcm.length / 48000;
  if (seconds < 1 || seconds > 90) throw new Error("The narration length was unexpected. Shorten the script and try again.");
  const speed = Math.max(1, seconds / 29);
  const tempo = speed > 2 ? `atempo=2,atempo=${speed / 2}` : `atempo=${speed}`;
  await runFfmpeg(["-f", "s16le", "-ar", "24000", "-ac", "1", "-i", filmPath(film.id, "voice.pcm"), "-af", tempo, filmPath(film.id, "narration.wav")]);
  return "narration.wav";
}
