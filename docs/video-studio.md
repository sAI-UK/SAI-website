# SAI Creator Studio

Open /creator-studio to choose Image or Video. The old /video-studio URL redirects there. Each mode has its own form; switching preserves drafts and completed results while the page stays open.

## Setup

Put the following in .env.local and restart npm run dev:

    GEMINI_API_KEY=your_actual_key
    VIDEO_MAX_JOBS_PER_SESSION=20

The existing key is used for both generation types and stays server-side. Its Google project needs billing and access to the relevant models. No second key is required. VEO_MODEL is no longer used: videos default to Veo 3.1 Fast. Remove VIDEO_PROVIDER=mock for live video generation. Images do not use the mock video adapter.

## Images

Nano Banana uses the stable gemini-2.5-flash-image model. The form accepts subject, setting, action or pose, style, mood, lighting, composition, optional visible text and aspect ratio. Those values become a still-image prompt. Supported formats: 1:1, 16:9, 9:16, 4:3 and 3:4.

POST /api/image/generate calls Google's generateContent API. It displays the returned raster image and offers a download using its actual PNG, JPEG or WebP MIME type. There is no video duration or audio field in this mode. Image requests can take up to two minutes; a deployed host must allow this request duration. Check generated lettering and details before using an image.

Repeated requests with the same session and request key reuse the result or pending request for 30 minutes. Image results are kept temporarily in server memory and in the mounted browser component. Download before closing or refreshing the page. A timeout can leave an unknown paid operation; check AI Studio before submitting a new version. Google content filters remain active.

## Videos

Veo 3.1 Fast uses 4, 6 or 8 seconds at 720p; 8 seconds at 1080p; landscape or portrait. The form becomes a scene prompt with action and optional audio. Format, duration and resolution are also passed as API parameters. Text-to-video omits personGeneration so Google applies its supported default and regional restrictions.

The browser polls the long-running operation every 10 seconds for up to 10 minutes, then offers a manual status check. Google does not expose a percentage. Polling errors do not trigger another paid generation. Submission is deduplicated. Active video details are stored in tab session storage for refresh recovery.

Completed videos play through a same-origin media route, authenticated with an HttpOnly session cookie. The server streams MP4 with range support and never forwards the key to another host during redirects. Download promptly: videos expire after 48 hours.

## Demo limitations

This is a founder demo for one Node server. Generation records and request limits use memory and disappear on restart; they are not shared between processes or serverless instances. Add shared persistent storage before using multiple servers. Session limits are not a hard spending cap or public access control. The app's old safety and teacher-review code remains unused by the generation flow.

## Verification

npm test
npm run lint
npm run build

Automated tests mock Google and do not spend credit. To verify live access, generate an image and a short Fast video using your configured key, then check both downloads.

Official documentation:
https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash-image
https://ai.google.dev/gemini-api/docs/generate-content/image-generation
https://ai.google.dev/gemini-api/docs/veo
