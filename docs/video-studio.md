# SAI Creator Studio — four-scene films

Open `/creator-studio`. `/video-studio` redirects here. Standalone image generation is removed from the UI and its former API returns 410.

## Run locally

Run `npm install`, then `npm run dev`. The existing `.env.local` needs `GEMINI_API_KEY` from a billed Google project with access to the selected models. Secrets stay on the server. No additional API key is needed.

Optional settings:

```text
VIDEO_PROVIDER=mock
FILM_PLANNER_MODEL=gemini-3.1-flash-lite
FILM_TTS_MODEL=gemini-3.8-flash-tts
FILM_DATA_DIR=.data/films
FILM_MAX_SAVED=20
```

Remove `VIDEO_PROVIDER=mock` for real generation. Mock mode uses a template scene plan and produces coloured placeholder clips and a real, silent MP4; it does not call Google or claim to animate the uploaded reference. Planning, narration and video generation in live mode use paid Google services.

FFmpeg is installed through `ffmpeg-static`. If needed, set `FFMPEG_PATH` to an installed FFmpeg binary. Starting a film checks FFmpeg before submitting paid video requests.

## User flow

1. Enter a title, character description, story, visual style and orientation. Optionally upload a PNG, JPEG or WebP reference up to 5 MB. Images are decoded, resized and re-encoded with metadata removed; SVG and corrupt files are rejected.
2. Plan four scenes: introduction, problem, action, outcome. Planning uses structured text generation and optionally the image. Edit each scene and the single narration script (up to 80 words) before video generation.
3. Generate four 8-second 720p Veo 3.1 Fast clips sequentially. Each uses shared character/style/context and the same reference asset when supplied. The UI shows spinners and actual stages, never an invented percentage.
4. FFmpeg trims the clips to 7, 8, 8 and 7 seconds, normalises framing/frame rate and joins them into a 30-second H.264 MP4. Original soundtracks are removed. Optional English narration uses one voice, is fitted to at most 29 seconds without cutting words, then padded to match the film.
5. Watch and download the film or edit/regenerate one scene. Other clips and the existing narration are reused. Update narration during the initial plan; scene revisions should remain consistent with that script.

Reference images guide subject appearance; exact likeness and continuity are not guaranteed. Google person-generation and regional restrictions still apply. This demo does not bypass provider filters.

## Costs and recovery

The displayed video estimate is $3.20 USD for four 8-second Fast clips at 720p ($0.10/second), before taxes and separate planning/narration costs. Replacement clips are approximately $0.80 each. Check these constants against Google pricing before a public launch.

There is a persistent limit of 12 submitted clips per film, including uncertain submissions, and a configurable cap of 20 saved films per data directory. These are demo controls, not public authentication or an account-wide billing cap.

Operations and local media are saved to disk. Submissions are reserved before calling Google. Polling/download errors do not generate replacement videos. Unknown submission outcomes require explicit acknowledgement before a new paid request. Narration failures can be retried separately, or the film can be assembled silently. Assembly failures retain all source clips.

The browser advances one saved step at a time, checking every five seconds while open. Checks pause after 30 minutes or a network failure and offer Resume. A provider operation already submitted continues at Google if the tab closes; subsequent scenes/assembly resume when the original tab reloads. Session identity uses browser local storage; the active film ID is stored in that tab's session storage. Closing the tab loses that shortcut; this demo has no project library.

Film media is served through session-checked routes with byte-range playback support. No Google media URL, key or uploaded image is returned in the public film record. Local films expire for API access 48 hours after planning. Local files remain until an operator archives/removes them; expiry is not automatic deletion. The `.data` directory is ignored by Git.

## Hosting limits

Use one long-running Node process with writable persistent disk and FFmpeg, with request timeouts of at least 180 seconds. Per-film locks are in-process. This version is not suitable for ephemeral serverless storage or multiple workers sharing the same data directory. Keep the demo access controlled before exposing a paid API publicly. Old single-clip API modules remain for compatibility, but Creator Studio exclusively uses `/api/films`.

## Verification

`npm test` covers reference validation, operation recovery, deduplication, ownership, spending limits, partial regeneration, narration fitting, exact 30-second real FFmpeg exports and media range responses. Google responses are mocked; tests do not spend credit.

`npm run build` checks the production Next.js application. Live Google model access and visual/audio generation quality still require a paid smoke test with a supported reference image.

Sources: [Veo](https://ai.google.dev/gemini-api/docs/veo), [structured output](https://ai.google.dev/gemini-api/docs/structured-output), [speech](https://ai.google.dev/gemini-api/docs/speech-generation), [pricing](https://ai.google.dev/gemini-api/docs/pricing).
