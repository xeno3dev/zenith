# Devlog: Exams Were Silently Dying and I Had No Idea Why

Today I've been working on Zenith, a study companion app combining timetables, assignments, exams, grades, flashcards, and an AI assistant. Today was supposed to be an easy one. It wasn't (curse you my luck).

## The Exam Bug

First off, the exam creation form would submit, display no error, and then just... not save anything. Assignments were fine. Grades were fine. Just exams. Stared at `Exams.jsx` for a while thinking something should be blatantly obvious about the frontend but all forms in the app look identical in code.

As it turns out, it was the backend this whole time. In `backend/app/routes/exams.py`, line 36, the validation check was:

```python
if not data.get("title") or not data.get("subject_id") or not data.get("exam_date"):
```

`subject_id` is an optional field. The frontend sends `null` when there's no selected subject, which is totally fine. But the backend was treating it as mandatory and silently rejecting any exam created without a subject with a 400. Remove one condition from that check and everything starts working.

And the "dashboard not updating" issue I had logged turned out to not even be a bug at all. The dashboard reloads data each time it mounts, so once exams were actually saving, the counter automatically started showing the right number. I was chasing a ghost.

## The Contrast Audit

Did a contrast audit because the app color scheme was recently changed to dark navy and golden yellow, and I had missed half the `text-white` on yellow button cases. I had been using `sed` to target `bg-primary text-white` but completely missed `bg-accent text-white` — the exact same yellow color, different class name. Five more pages plus the header avatar, all fixed.

## New Features

The rest of the session was new features:

- **Pomodoro timer** — circular SVG progress ring, work/break mode toggling, configurable durations, session counter
- **Timetable backend persistence** — moved timetable data from `localStorage` to a proper backend database so it persists across devices and browser clears
- **Flask-Migrate initialized** — tried running `flask db migrate` and got "Path doesn't exist: migrations" because `flask db init` had never been run on this project. Classic. Once sorted, the migration came up clean
- **AI features enabled** — switched the blueprint on, swapped the hardcoded Sonnet model for Haiku via `ANTHROPIC_MODEL` in `.env`, and added prompt caching to all four service functions so repeated system prompts hit the cache instead of billing full tokens every time

## Testing

After getting the API key in place, ran a full Playwright test suite end to end. Caught a few real bugs in the process:

- Login and Register forms had no `htmlFor`/`id` on their labels, so `getByLabel()` could never find them. Fixed accessibility and unblocked automated testing at the same time
- The AI chat user bubble was using `text-white` on the yellow primary background. Same contrast issue as before, different file (`AIChat.jsx`)
- The Header was rendering the page title as an `h2`, which created duplicate heading violations when combined with each page's own `h1`. Demoted it to a `p` tag with the same styles
- Edit and Delete buttons on subject cards were icon-only with no accessible name, so Playwright (and screen readers) had no way to target them. Added `aria-label` to both

All 12 tests pass. AI chat, explain, and quiz all confirmed working live against the API.

## What's Next

Podcast pipeline. It's the flagship feature and the whole reason this app exists.
