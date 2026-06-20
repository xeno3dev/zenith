# Devlog: Zenith | The Beginnings

## June 18

Today I was working on Zenith, study companion app including timetables, assignments, exams, grades, flashcards, and an AI assistant. Today was going to be an easy one. It wasn't (curse you my luck).

### The Exam Bug

First off, the form for creating an exam would submit without errors, but would not save anything in the database. Assignment forms worked, grades forms worked, only exams didn't work. Stared at `Exams.jsx` for a while expecting something blatantly obvious about frontend but all forms in the app are exactly alike in code.

Turned out it was the backend the whole time. In `backend/app/routes/exams.py`, the validation looks like:

```python
if not data.get("title") or not data.get("subject_id") or not data.get("exam_date"):
```

`subject_id` is an optional field. Frontend sends `null` for it when the user doesn't select a subject and that's totally fine. However, the backend was treating it as required and silently returning 400 on any attempts to create an exam without a subject. Removed one condition and everything started working.

Oh, the "dashboard counter is not updating" issue that I logged? Well, the counter is reloading every time the Dashboard component is mounted and once the forms started saving the number showed the right count.

### The Contrast Audit

Conducted a contrast audit because the app color scheme was changed to dark navy and golden yellow recently and I had missed half the `text-white` on yellow button cases. Used `sed` to replace `bg-primary text-white` in many places and forgot about the other class `bg-accent text-white` which was the same yellow color. Five more pages and the header avatar, all fixed.

### New Features

And now for the new features:

- **Pomodoro timer** — circular SVG progress ring, work/break mode toggling, durations config, session counter
- **Timetable backend persistence** — moved timetable data from `localStorage` to database
- **Flask-Migrate initialized** — `flask db init` -> migrations folder -> `flask db migrate` -> empty migration. No issues detected
- **AI features enabled** — flipped the blueprint on, replaced Sonnet model with Haiku via `ANTHROPIC_MODEL` in .env, enabled prompt caching for all four services

### Testing

Once the API key is in place, ran a full Playwright test suite to check if it all works end to end. Did catch a couple of bugs in the process:

- Login/Register forms have no `htmlFor`/`id` for their labels, hence, `getByLabel()` couldn't find them. Fixed the accessibility and unblocked automated testing
- The bubble for an AI chat user has `text-white` class used on the yellow primary background. The same contrast problem in `AIChat.jsx` file
- The Header renders the page title as `<h2>`, hence, creating duplicates of `<h1>` headings. Fixed by downgrading the Header title to `<p>`
- Subject edit and delete buttons use icons only, no accessible name. Hence, Playwright (as well as screen readers) cannot interact with them. Fixed by adding `aria-label` to both

All 12 tests passed successfully. Checked AI chat, explain and quiz features against the API.

## June 19

### New Features

Bunch of new features before bugs:

- **AI sessions** — now chats are persistent and named, with a sidebar to switch between them
- **Image paste/upload** — you can paste or drag an image into the AI chat
- **Resources page** — attach files to your subjects, preview PDFs/images in the side panel
- **Podcast ContentUploader** — generator now uses a proper library picker
- **Timetable day labels** — now simpler, no extra verbose names

### The Podcast Pipeline

The podcast feature generates an AI conversation between two hosts from study material and synthesizes it to audio with Kokoro TTS. In theory. In practice, each and every podcast was stuck in `status=failed`.

First lead was the Kokoro endpoint. The service called `POST /tts` with `{"text": ..., "voice": ..., "speed": ...}` body. This endpoint simply doesn't exist. Retrieved the OpenAPI spec for the running Kokoro container and found out that the actual endpoint was `POST /v1/audio/speech` with `{"model": "kokoro", "input": ..., "voice": ..., "response_format": "mp3", "stream": false}` body.

After fixing that and adding some logging in the pipeline, ran an end-to-end test. Podcast #7 went `pending → generating → ready` in 135 seconds. The result was 7.6 minute episode. Confirmed that the pipeline works.

### The CI Failures

Two CI breaks have stacked up.

**`anthropic` version** — `requirements.txt` pins `anthropic==0.39.0` and the test environment has `httpx>=0.28` installed which removed the `proxies` kwarg from its client constructor. As a result, `TypeError: Client.__init__() got an unexpected keyword argument 'proxies'` on every test run. Updated `anthropic` version to `0.111.0` to match the actual local version.

**Playwright strict mode** — one of the tests was calling `getByRole('button', { name: 'New chat' })` and it matched two elements: the sidebar "New chat" button and the welcome screen "Start a new chat" button (matched with a partial name). Solved by adding `exact: true` to make it match only the sidebar button.

Both solved, CI green.

### The Session Bugs

Two session-related bugs I've missed.

**"User shows as Student"** — after a reload, the display name fell back to "Student" despite the user was logged in. The problem was that the auth store initializes `user: null` and does not persist the user object in `localStorage`. Fixed by saving the user object as JSON in `localStorage` (`zenith_user`) and reading it back in `loadUser()` function used in store initialization.

**"Requests stop working after an hour"** — after about 60 minutes of work, all API calls would start 401-ing and there would be no way to get back except for a manual logout/login. Two causes: `Login.jsx` and `Register.jsx` were calling `login(user, access_token)` and silently ignoring the `refresh_token` provided by the API, hence, it was never saved. And the 401 interceptor in `api.js` had no refresh logic at all, just clears the session and redirects to `/login`.

Fixed by saving `refresh_token` in `localStorage` along with the user, passing it to `login()` and implementing the refresh queue in the interceptor: on 401, try `POST /auth/refresh` with the stored refresh token, update the access token, retry the original request. Concurrent 401s during the refresh will be queued and executed once the access token is updated.

### The Audio Playback Bug

Podcasts generated perfectly. Status — `ready`. Transcript and waveform render fine. The play button does nothing — no audio, no error, just silence.

Hitting the endpoint directly returns 500. The trace:

```
FileNotFoundError: No such file or directory:
'.../backend/app/./audio_storage/8.mp3'
```

The `send_file()` method from Flask, when a relative path is passed to it, resolves it relative to `app.root_path` which is the directory with the package `__init__.py`. Which is `backend/app/`, not `backend/`. Therefore, `./audio_storage/8.mp3` resolves to `backend/app/audio_storage/8.mp3` which doesn't exist.

The actual audio is saved at `backend/audio_storage/8.mp3`. It just couldn't be found from there.

Two-part fix: the route now checks if the stored path is relative and, if it is, resolves it relative to `os.path.dirname(current_app.root_path)` before sending the file. And the service now wraps `AUDIO_STORAGE_PATH` in `os.path.abspath()` so future podcasts are going to store an absolute path.

Confirmed: both HTTP header and query-string token methods deliver HTTP 200 with audio bytes.

### The Timetable Dialog

The "Choose a subject" picker in the timetable had a transparent background - there was the overlay there, there was the component contents there, yet the dialog card was see-through of what it rested on.

The component happened to rely on `bg-surface`, a custom colour specified by our `tailwind.config.js`. Since Tailwind v4 does not process custom colors from the JS config like v3 when you use `@import "tailwindcss"`, `bg-surface` didn't work, it produced nothing. Replaced it with `bg-[#110E22]`, that is our custom theme's card/surface color, with an additional border to delineate it — `border border-white/10`.

## What's Next

The playback experience for podcasts now seems end to end. The next item up the backlog is to upgrade the UX on player – this involves seeking and correlating waveform to podcast script and handle new podcasts that are generated while the page is open.
