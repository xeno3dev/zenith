# Zenith — Project Blueprint

## 1. Project Overview

**Name:** Zenith
**Tagline:** *The study companion that brings your whole student life into one app.*
**Built by:** Xeno Solutions.

**The problem.** Studying involves a dozen small, repetitive annoyances that nobody bundles together: a timetable in one app, assignments tracked in another (or a notebook), exam dates scattered across syllabi and emails, a grade average that has to be hand-calculated whenever a student wants to know where they stand, flashcards that get reviewed in the wrong order (or not at all) because there's no system telling you what's actually due, and dense notes that only get value if you sit down and re-read them — which doesn't happen during a commute, a chore, or a tired evening. None of these problems are individually huge, but they add up to dozens of minutes lost and a constant low-grade mental overhead every single day of the school term.

**The purpose.** Zenith removes that overhead by bundling the whole loop — timetable, assignments, exams, grades, flashcards, and an AI study assistant — into one app, and goes a step further with an AI-generated audio podcast that turns a wall of notes into a conversation you can actually listen to. Small frictions removed thousands of times over a school term is the whole point.

## 2. Quality-of-Life Improvements

Three major QoL improvements Zenith already delivers:

1. **One app instead of five.** Timetable, assignments, exams, grades, and flashcards live in a single place instead of split across a planner app, a notes app, a spreadsheet, and a flashcard app — no more re-entering the same due date in three places.
2. **Automatic grade math.** Grades are logged once per assessment with a weight, and Zenith computes the running weighted average and predicted grade automatically — no more pulling out a calculator (or guessing) every time a student wants to know where they stand in a subject.
3. **Dead time becomes study time.** The AI podcast generator turns notes into a two-host audio conversation, so a commute, a chore, or a walk becomes review time instead of time that's simply lost — and the spaced-repetition flashcard scheduler means review sessions only ever surface the cards that actually need attention, instead of re-reviewing an entire deck every time.

Other QoL improvements worth exploring next:

- **One daily "what should I do right now" list.** Merge due flashcards, upcoming deadlines, and the weakest subject by grade into a single ranked action list, so a student doesn't have to check four screens to decide what to work on.
- **Calendar sync (ICS export).** Push the timetable and assignment/exam due dates into Google/Apple/Outlook calendars automatically, instead of requiring a student to re-type dates they've already entered into Zenith.
- **Auto-generated flashcards from notes.** Let Claude turn a pasted set of notes directly into a draft flashcard deck, removing the manual work of writing front/back cards one at a time.
- **A single daily digest notification.** "3 cards due, 1 assignment due tomorrow, your Chemistry podcast is ready" as one notification instead of separately checking each feature.
- **Clip-to-Zenith capture.** A browser extension or share-sheet action that sends highlighted text from anywhere straight into a flashcard deck or podcast queue, removing the copy-paste round trip.

## 3. Features

### Timetable Builder
A weekly schedule grid (Monday–Friday × configurable periods) where students assign subjects to time slots. Each subject carries a color, so the grid is scannable at a glance. Period blocks show subject name, teacher, and room. The grid can be exported as an image for quick sharing or printing.

### Assignment Tracker
Every assignment belongs to a subject and carries a due date, a priority flag (1–3), and a status that moves through a simple pipeline: **todo → in progress → done**. The assignment list can be filtered by subject, status, or "due before" a given date, and the UI surfaces a live countdown so the most urgent work is always visible first. Assignments group naturally by subject so a student can see at a glance how much outstanding work each class has.

### Exam Tracker
A dedicated view for everything exam-shaped: school internals, externals, and mock exams. Each exam is tagged by type (internal/external/mock) and subject, with a countdown timer to exam day. An "upcoming" filter surfaces everything in the next 30 days — the window where exam anxiety (and the need to actually plan revision) spikes. Per-subject exam history lets a student see how a subject's assessment pattern has looked over the term.

### Grade Tracker
Grades are logged per subject with a score, a max score, and a weight (so a heavily-weighted exam and a lightly-weighted classwork assignment count appropriately toward the running average). Zenith computes a weighted average per subject and maps that percentage onto a predicted grade. A summary view shows every subject's predicted grade as a color-coded badge (green for strong, yellow for middling, red for needs-attention), plus simple bar-chart visualizations of where a student stands across all subjects.

### Flashcard System (SRS)
Students build decks of front/back flashcards, optionally tied to a subject. Review sessions use the SM-2 spaced repetition algorithm (see Section 8) to schedule when each card comes back, so time is spent on the cards that are about to be forgotten rather than re-reviewing everything indiscriminately. A due-today queue surfaces exactly the cards that need attention right now. Decks can be bootstrapped from a CSV import in the same front/back format Anki uses, so a student migrating from Anki (or inheriting a deck from a friend) doesn't have to retype anything.

### Pomodoro Timer
A built-in focus timer (25 minutes on, 5 minutes off by default, configurable) that can be linked to a subject, logging each session so a student can see — and a parent or tutor can verify — how study time is actually distributed across subjects over a term.

### AI Study Assistant
Powered by the Claude API, with three modes:
- **Chat** — a free-form study conversation, with the current subject/page passed in as context so answers stay relevant.
- **Explain** — give it a topic, a subject, and a level, and Claude produces a level-appropriate explanation.
- **Quiz me** — point it at a flashcard deck and Claude generates fresh quiz questions that test the same concepts the cards cover, rather than just echoing the card text back.

### Podcast Generator (Flagship)
Turns study material into an audio conversation between two AI hosts. Full technical breakdown in Section 4.

## 4. Podcast Generator — Deep Dive

This is the feature where Claude's output becomes something a student actually *listens to*.

### What it does
A student provides study material — pasted notes, a flashcard deck, or (eventually) a PDF — and Zenith produces a NotebookLM-style audio episode: a natural, engaging conversation between two AI hosts walking through that material. The result is something a student can put on while commuting, doing chores, or just resting their eyes after a day of reading.

### The hosts
- **Ari** — the explainer. Analytical and clear, breaks complex ideas into structured pieces, sets context before diving in. Voice: deeper, measured (Kokoro voice `am_adam`).
- **Sol** — the curious student. Asks the question the listener is already thinking, makes connections, supplies examples and analogies. Voice: lighter, more energetic (Kokoro voice `af_sky`).

### Pipeline
1. The student submits content + a subject name via the `PodcastGenerator` wizard in the frontend.
2. Flask creates a `Podcast` row with `status = "pending"` and immediately returns `202 Accepted` — generation happens out-of-band so the request doesn't block on minutes of TTS work.
3. A background thread takes over:
   1. `podcast_service` calls `ai_service.generate_podcast_script(content, subject)`.
   2. Claude returns a JSON script: an array of `{speaker: "Ari" | "Sol", text: str}` turns.
   3. For each turn, `tts_service.synthesize(text, speaker)` calls Kokoro TTS with the speaker's mapped voice.
   4. `pydub` concatenates every audio clip, inserting 300ms of silence between speaker turns so the conversation breathes.
   5. The combined audio is exported as a single MP3 to `AUDIO_STORAGE_PATH`.
   6. The `Podcast` row is updated: `status = "ready"`, `audio_path` set, `duration_seconds` recorded.
4. The frontend polls `GET /podcasts/<id>` every 3 seconds until `status` flips to `"ready"` (or `"failed"`).
5. `PodcastPlayer` loads with a custom audio UI, a collapsible transcript (`ScriptViewer`), and playback controls.

### TTS strategy
- **Primary: Kokoro TTS** — a self-hosted, open-source, 82M-parameter TTS model. Chosen because it's free, self-hostable on the same Docker network as everything else, fast, and good enough quality for a study podcast. Voice mapping: `af_sky` → Sol, `am_adam` → Ari.
- **Premium fallback: ElevenLabs** — a drop-in swap via the `TTS_PROVIDER` environment variable, for when higher production quality matters more than self-hosting cost.

### Prompt engineering
The Claude system prompt for script generation is deliberately specific, because TTS output quality depends entirely on how "speakable" the generated text is:
- Natural speech patterns: contractions, the occasional em-dash, "..." for a thinking pause.
- Each speaker turn capped at 2–4 sentences, so the rhythm of the conversation stays natural and TTS chunks don't run on.
- Varied sentence length — a script where every line is the same length reads like a list, not a conversation.
- Concrete, relatable examples wherever the subject allows it.
- No markdown in the output at all — it goes straight into a TTS engine, which would read asterisks and hashes aloud.
- Start with a hook, not a syllabus-style introduction.
- End with a memorable summary line, not just a fade-out.

### Example script structure
A good Ari/Sol script for a History topic follows an arc, not a transcript of facts:
1. **Hook** — Sol opens with a provocative question about the topic.
2. **Context** — Ari sets the scene: who, when, where, why it matters historically.
3. **Back-and-forth build** — several turns where each speaker builds on the last point rather than restating it; Sol asks clarifying or connecting questions, Ari supplies structure and detail.
4. **"But why does this matter?"** — Sol pushes past the facts to ask what the point of knowing this actually is.
5. **Modern tie-in** — Ari connects the historical material to something present-day and relevant.
6. **Wrap-up** — Sol summarizes the core idea in one or two sentences; Ari adds one final, memorable insight to close the episode.

## 5. Tech Stack

- **Backend:** Python 3.12, Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, Flask-CORS, psycopg2, pydub, the `anthropic` Python SDK
- **Frontend:** Vite, React 18, React Router v6, Tailwind CSS, Zustand, axios, lucide-react, react-hot-toast
- **Database:** PostgreSQL 16
- **TTS:** Kokoro TTS (self-hosted, primary) / ElevenLabs (premium fallback)
- **AI:** Anthropic Claude API (Claude Sonnet, latest available model)
- **Auth:** JWT (short-lived access token + longer-lived refresh token) via Flask-JWT-Extended
- **Deployment:** Docker Compose, deployed via Coolify on a Proxmox-hosted VPS — the same infrastructure pattern as Xeno Solutions' other products (Keylo, The Spot)
- **PWA:** Web app manifest + service worker for installability and basic offline asset caching

## 6. Database Schema

| Table | Column | Type | Notes |
|---|---|---|---|
| **users** | id | UUID (string) | primary key |
| | email | string | unique, not null |
| | password_hash | string | not null |
| | name | string | not null |
| | school | string | nullable |
| | grade_level | string | nullable (e.g. "10th grade") |
| | created_at | datetime | default now |
| **subjects** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | name | string | not null |
| | color | string | hex color |
| | teacher | string | nullable |
| | room | string | nullable |
| | created_at | datetime | default now |
| **assignments** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | subject_id | integer | FK → subjects.id, nullable |
| | title | string | not null |
| | description | text | nullable |
| | due_date | datetime | indexed |
| | priority | integer | 1–3, default 2 |
| | status | string | todo / in_progress / done |
| | created_at | datetime | default now |
| **exams** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | subject_id | integer | FK → subjects.id |
| | title | string | not null |
| | exam_date | datetime | indexed |
| | exam_type | string | internal / external / mock |
| | notes | text | nullable |
| | created_at | datetime | default now |
| **decks** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | subject_id | integer | FK → subjects.id, nullable |
| | name | string | not null |
| | description | text | nullable |
| | created_at | datetime | default now |
| **flashcards** | id | integer | primary key |
| | deck_id | integer | FK → decks.id, indexed |
| | front | text | not null |
| | back | text | not null |
| | ease_factor | float | default 2.5 |
| | interval | integer | days, default 1 |
| | repetitions | integer | default 0 |
| | next_review | datetime | indexed, default now |
| | created_at | datetime | default now |
| **grades** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | subject_id | integer | FK → subjects.id, indexed |
| | assessment_name | string | not null |
| | score | float | not null |
| | max_score | float | not null |
| | weight | float | default 1.0 |
| | date | datetime | default now |
| | notes | text | nullable |
| **podcasts** | id | integer | primary key |
| | user_id | UUID | FK → users.id, indexed |
| | title | string | not null |
| | source_type | string | notes / flashcards / pdf |
| | source_content | text | not null |
| | script | JSON | array of `{speaker, text}`, nullable until generated |
| | audio_path | string | nullable until ready |
| | duration_seconds | integer | nullable until ready |
| | status | string | pending / generating / ready / failed |
| | error_message | text | nullable |
| | created_at | datetime | default now |

All foreign-key-bearing tables index `user_id` (and `subject_id`/`deck_id` where present) since virtually every query is scoped to "this user's records."

## 7. API Reference

All routes below are prefixed `/api` and, except where noted, require a JWT bearer token (`Authorization: Bearer <access_token>`).

### `auth`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | none | `{email, password, name, school?, grade_level?}` → `{user, access_token, refresh_token}` |
| POST | /auth/login | none | `{email, password}` → `{user, access_token, refresh_token}` |
| POST | /auth/refresh | refresh token | → `{access_token}` |
| GET | /auth/me | yes | → current user |
| POST | /auth/logout | yes | stateless no-op, clears client state |

### `subjects`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | /subjects | yes | list / create |
| GET / PUT / DELETE | /subjects/:id | yes | scoped to current user |

### `assignments`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | /assignments | yes | list (`?subject_id`, `?status`, `?due_before`) / create |
| GET / PUT / DELETE | /assignments/:id | yes | scoped to current user |

### `exams`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | /exams | yes | list (`?upcoming=true` → next 30 days) / create |
| GET / PUT / DELETE | /exams/:id | yes | scoped to current user |

### `flashcards`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | /decks | yes | list / create deck |
| GET / PUT / DELETE | /decks/:id | yes | scoped to current user |
| GET / POST | /decks/:id/cards | yes | list / create cards in a deck |
| GET / PUT / DELETE | /cards/:id | yes | scoped via deck ownership |
| GET | /cards/due | yes | `?deck_id` optional — cards due today |
| POST | /cards/:id/review | yes | `{quality: 0-5}` → runs SM-2, returns updated card |

### `grades`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET / POST | /grades | yes | list / create |
| GET / PUT / DELETE | /grades/:id | yes | scoped to current user |
| GET | /grades/summary | yes | per-subject weighted average + predicted grade |

### `ai`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /ai/chat | yes | `{messages, context}` → assistant reply |
| POST | /ai/explain | yes | `{topic, subject, level}` → explanation text |
| POST | /ai/quiz | yes | `{deck_id}` → generated quiz questions |

### `podcasts`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /podcasts | yes | list user's episodes |
| POST | /podcasts | yes | `{title, source_type, source_content, subject}` → `202` + pending record, generation runs in background |
| GET | /podcasts/:id | yes | status + details (poll target) |
| GET | /podcasts/:id/audio | yes | serves the MP3 |
| DELETE | /podcasts/:id | yes | deletes record + audio file |

## 8. Spaced Repetition Algorithm (SM-2)

Zenith's flashcard reviews are scheduled using **SM-2**, the algorithm originally published for SuperMemo and later adopted (with tweaks) by Anki. Implemented in `srs_service.py`.

**Quality scores (0–5)**, mapped to the review buttons:
- 0 = **Again** (complete failure to recall)
- 3 = **Hard** (recalled, but with significant difficulty)
- 4 = **Good** (recalled with some effort)
- 5 = **Easy** (recalled effortlessly)

**The algorithm:**
1. If `quality < 3`: the card is treated as forgotten. `repetitions` resets to 0 and `interval` resets to 1 day — the card comes right back tomorrow.
2. If `quality >= 3`: `repetitions` increments, and the new interval is computed as:
   - 1st successful repetition → 1 day
   - 2nd successful repetition → 6 days
   - every subsequent repetition → `round(previous_interval * ease_factor)`
3. `ease_factor` is updated on every review using the standard SM-2 formula:

   ```
   ef' = ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
   ```

   clamped to a floor of `1.3` (an ease factor below that makes intervals shrink too aggressively and the card never escapes a short review cycle).
4. `next_review` is set to `now + interval days`.

**Why SM-2, not FSRS.** Anki has since moved to FSRS (Free Spaced Repetition Scheduler), a more statistically sophisticated model that fits a per-user forgetting curve from review history. SM-2 was chosen for Zenith deliberately:
- It's simple enough to implement correctly quickly and to reason about when something looks wrong — important for a small codebase other students will read.
- It needs no historical data to "warm up" — a brand-new deck behaves sensibly from card one, whereas FSRS needs a meaningful review history to fit well.
- Typical study timescales (weeks to a few months until an exam) are short enough that SM-2's slightly less optimal long-tail scheduling doesn't matter — the difference between SM-2 and FSRS shows up over months-to-years of reviews, not one exam season.

## 9. Grading & Grade Prediction

Grades are logged per assessment with a score, a max score, and a weight, so a heavily-weighted exam and a lightly-weighted quiz contribute proportionally to the running average rather than being treated as equal data points.

**Grade predictor formula.** Zenith maps a subject's weighted average percentage onto a predicted letter grade:

| Weighted average | Predicted grade |
|---|---|
| ≥ 90% | A |
| 80–89% | B |
| 70–79% | C |
| 55–69% | D |
| 40–54% | E |
| < 40% | F |

**Subject presets.** New users can select from a list of common subjects (each preloaded with a sensible default color) at registration instead of building their subject list from scratch — removing the "blank canvas" problem that makes general-purpose tools like Notion a poor fit for this use case. The list is fully editable, so it adapts to any school's actual subject lineup.

## 10. Roadmap (Phased)

- **Phase 1 – Foundation (Weeks 1–2).** Auth, subjects, assignments, exams, basic grade tracking, timetable. Ship MVP.
- **Phase 2 – Study Tools (Weeks 3–4).** Flashcard system with SM-2 SRS, Pomodoro timer, CSV import.
- **Phase 3 – AI Features (Week 5).** AI chat assistant, explain-topic mode, quiz mode.
- **Phase 4 – Podcast Generator (Weeks 6–7).** Script generation, Kokoro TTS integration, audio pipeline, `PodcastPlayer` UI.
- **Phase 5 – Polish & Launch (Week 8).** PWA support, mobile optimization, subject presets, open source README, demo video.
- **Phase 6 – Further QoL improvements (future).** Daily "what should I do right now" digest, calendar (ICS) sync, auto-generated flashcards from notes, clip-to-Zenith capture extension.

## 11. Deployment

Zenith deploys as a Docker Compose stack via **Coolify**, running on the same Proxmox/Contabo VPS infrastructure as Xeno Solutions' other products (Keylo, The Spot). Coolify runs in an LXC container (`10.10.10.10`) behind an `nginx-ui` reverse proxy (`10.10.10.2`). The domain `zenith.app` is registered through Spaceship and points at the Contabo VPS IP. Coolify handles TLS termination and zero-downtime deploys triggered by a GitHub webhook on push to `main`. The Kokoro TTS service runs as a separate container on the same Docker network so the backend can reach it over the internal bridge network without exposing it publicly. Generated audio files are served either directly through Flask (`GET /podcasts/:id/audio`) or, in production, via nginx as a static asset path for lower overhead.

## 12. Submission Checklist

- [ ] Clear quality-of-life improvement explained (Section 2)
- [ ] Working and usable project (live demo deployed at zenith.app)
- [ ] Effort and thoughtful execution evident (full-stack app, AI integration, custom SRS scheduler, audio pipeline)
- [ ] Clear explanation of the problem being solved (Section 1)
- [ ] Minimum 3 hours spent (tracked via commit history / dev log)
- [ ] 3 major QoL improvements documented (Section 2)
- [ ] GitHub repo public (`xeno3dev/zenith`)
- [ ] README with screenshots, demo link, tech stack
- [ ] Demo video walkthrough
