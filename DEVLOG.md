# Devlog: Zenith

## June 18

Today I've been working on Zenith, a study companion app combining timetables, assignments, exams, grades, flashcards, and an AI assistant. Today was supposed to be an easy one. It wasn't (curse you my luck).

### The Exam Bug

First off, the exam creation form would submit, display no error, and then just... not save anything. Assignments were fine. Grades were fine. Just exams. Stared at `Exams.jsx` for a while thinking something should be blatantly obvious about the frontend but all forms in the app look identical in code.

As it turns out, it was the backend this whole time. In `backend/app/routes/exams.py`, the validation check was:

```python
if not data.get("title") or not data.get("subject_id") or not data.get("exam_date"):
```

`subject_id` is an optional field. The frontend sends `null` when there's no selected subject, which is totally fine. But the backend was treating it as mandatory and silently rejecting any exam created without a subject with a 400. Remove one condition from that check and everything starts working.

And the "dashboard not updating" issue I had logged turned out to not even be a bug at all. The dashboard reloads data each time it mounts, so once exams were actually saving, the counter automatically started showing the right number. I was chasing a ghost.

### The Contrast Audit

Did a contrast audit because the app color scheme was recently changed to dark navy and golden yellow, and I had missed half the `text-white` on yellow button cases. I had been using `sed` to target `bg-primary text-white` but completely missed `bg-accent text-white` — the exact same yellow color, different class name. Five more pages plus the header avatar, all fixed.

### New Features

The rest of the session was new features:

- **Pomodoro timer** — circular SVG progress ring, work/break mode toggling, configurable durations, session counter
- **Timetable backend persistence** — moved timetable data from `localStorage` to a proper backend database so it persists across devices and browser clears
- **Flask-Migrate initialized** — tried running `flask db migrate` and got "Path doesn't exist: migrations" because `flask db init` had never been run on this project. Classic. Once sorted, the migration came up clean
- **AI features enabled** — switched the blueprint on, swapped the hardcoded Sonnet model for Haiku via `ANTHROPIC_MODEL` in `.env`, and added prompt caching to all four service functions so repeated system prompts hit the cache instead of billing full tokens every time

### Testing

After getting the API key in place, ran a full Playwright test suite end to end. Caught a few real bugs in the process:

- Login and Register forms had no `htmlFor`/`id` on their labels, so `getByLabel()` could never find them. Fixed accessibility and unblocked automated testing at the same time
- The AI chat user bubble was using `text-white` on the yellow primary background. Same contrast issue as before, different file (`AIChat.jsx`)
- The Header was rendering the page title as an `h2`, which created duplicate heading violations when combined with each page's own `h1`. Demoted it to a `p` tag with the same styles
- Edit and Delete buttons on subject cards were icon-only with no accessible name, so Playwright (and screen readers) had no way to target them. Added `aria-label` to both

All 12 tests pass. AI chat, explain, and quiz all confirmed working live against the API.

## June 19

### New Features

Before the bugs, a bunch of new things shipped:

- **AI sessions** — chats are now persistent and named, with a sidebar for switching between them
- **Image paste/upload** — you can paste a screenshot or drag in a file directly into the AI chat
- **Resources page** — attach files to subjects, preview PDFs and images in a side panel
- **Podcast ContentUploader** — the generator now has a proper library picker so you can pull in saved resources instead of pasting text every time
- **Timetable day labels** — simplified; no more verbose day names cluttering the grid

### The Podcast Pipeline

The podcast feature generates a two-host AI conversation from study material and synthesizes it to audio using Kokoro TTS. In theory. In practice, every single podcast was ending up in `status=failed`.

The first lead was the Kokoro endpoint. The service was calling `POST /tts` with `{"text": ..., "voice": ..., "speed": ...}` — a path that simply doesn't exist. Fetched the OpenAPI spec from the running Kokoro container and found the actual endpoint: `POST /v1/audio/speech` with `{"model": "kokoro", "input": ..., "voice": ..., "response_format": "mp3", "stream": false}`. Classic case of writing an integration against assumed docs instead of real ones.

After fixing that and adding logging throughout the pipeline, ran a live end-to-end test. Podcast id=7 went `pending → generating → ready` in about 135 seconds, producing a 7.6-minute episode. Pipeline confirmed working.

### The CI Failures

Two separate CI breaks had stacked up:

**`anthropic` version** — `requirements.txt` pinned `anthropic==0.39.0`, but the test environment has `httpx>=0.28` which removed the `proxies` kwarg from its client constructor. The anthropic SDK passes that kwarg on init. Result: `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'` on every test run. Bumped to `0.111.0` to match what's actually installed locally.

**Playwright strict mode** — A test was calling `getByRole('button', { name: 'New chat' })` which matched *two* elements: the sidebar "New chat" button and the welcome screen "Start a new chat" button (partial name match). Added `exact: true` to pin it to the sidebar button only.

Both fixed, CI green.

### The Session Bugs

Two related bugs that had been lurking:

**"User shows as Student"** — after a page reload, the display name would fall back to "Student" even though the user was still logged in. The auth store was initializing `user: null` and never persisting the user object to localStorage, so every reload wiped it. Fixed by saving the user as JSON in `localStorage` (`zenith_user`) and loading it back in a `loadUser()` helper on store init.

**"Requests stop working after an hour"** — after about 60 minutes, all API calls would start 401-ing with no recovery path except a manual logout and login. Two causes: `Login.jsx` and `Register.jsx` were both calling `login(user, access_token)` and silently dropping the `refresh_token` the API returned, so it was never stored. And the 401 interceptor in `api.js` had no refresh logic at all — it just cleared the session and redirected to `/login`.

Fixed by storing the refresh token in localStorage, passing it through the `login()` call, and implementing a proper refresh queue in the interceptor: on 401, attempt `POST /auth/refresh` with the stored refresh token, update the access token, and retry the original request. Concurrent 401s during the refresh are queued and drained once the new token comes back.

### The Audio Playback Bug

The podcasts were generating fine. Status was `ready`. The transcript and waveform rendered. The play button did nothing — no audio, no error, just silence.

Hitting the audio endpoint directly returned a 500. The traceback:

```
FileNotFoundError: No such file or directory:
'.../backend/app/./audio_storage/8.mp3'
```

Flask's `send_file`, when given a relative path, resolves it against `app.root_path` — which is the directory containing the Flask package's `__init__.py`. That's `backend/app/`, not `backend/`. So `./audio_storage/8.mp3` was being looked up inside `backend/app/audio_storage/` which doesn't exist.

The audio was correctly stored at `backend/audio_storage/8.mp3`. It just couldn't be found from there.

Two-part fix: the route now checks if the stored path is relative and, if so, resolves it against `os.path.dirname(current_app.root_path)` (the actual backend root) before calling `send_file`. And the service now wraps `AUDIO_STORAGE_PATH` in `os.path.abspath()` so future podcasts store an absolute path to begin with.

Verified: both auth header and query-string token delivery now return HTTP 200 with audio bytes.

## What's Next

Podcast playback is fully working end to end. Next up is polishing the player experience — seeking, progress sync with the transcript, and handling edge cases like podcasts that are still generating when the page loads.
