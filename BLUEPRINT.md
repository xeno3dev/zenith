# Scholara — Project Blueprint

## 1. Project Overview

**Name:** Scholara
**Tagline:** *The study companion that actually gets the Caribbean classroom.*
**Built by:** Xeno Solutions, for the Hack Club Stardance program.

**The problem.** Caribbean secondary and sixth-form students sitting CSEC and CAPE examinations are underserved by the dominant productivity and study tools on the market. Notion is a blank canvas that demands hours of template-building before it's useful. Google Classroom is built around a single teacher pushing assignments to a single class, not around a student juggling eight CSEC subjects across multiple teachers, School-Based Assessments (SBAs), mocks, and CXC-set externals. Neither tool knows what "Form 5," "POA," "Integrated Science," or "a Grade 1" means. Neither understands that a CSEC grading scale runs 1 (best) to 6 (worst), inverted from the A–F intuition baked into most western EdTech.

**The purpose.** Scholara is a single, opinionated app built specifically for CSEC/CAPE students: a timetable that speaks in "periods" and CSEC subjects out of the box, an assignment and exam tracker that understands SBA deadlines and mock exam season, a grade tracker that predicts your CXC grade from a weighted average, a spaced-repetition flashcard system for the memorization-heavy parts of the syllabus (history dates, biology terms, French vocabulary), an AI study assistant that can explain a CAPE Unit 2 topic at the right level, and — the flagship feature — an AI-generated audio podcast that turns a wall of notes into a 10-minute conversation between two hosts you can listen to on the route to school.

## 2. Stardance Submission Rationale

Scholara is a fit for Hack Club Stardance on every axis the program cares about:

- **Built by a student, for students.** Scholara was designed and built by a student who lives the CSEC/CAPE experience, not a company guessing at it from the outside.
- **Claude API is structural, not decorative.** The Anthropic Claude API isn't a chatbot bolted onto the side — it is the engine behind two of Scholara's core features: the AI study assistant (chat / explain / quiz-me) and the podcast generator, which depends on Claude to write a structured, natural-sounding two-host script that is then handed to a TTS pipeline. Remove Claude and the flagship feature doesn't exist.
- **Addresses a real, underserved demographic.** CSEC/CAPE students are a market every major EdTech company has ignored. Scholara's data model, grading logic, and subject presets are written around the actual CXC syllabus structure and grading scale, not retrofitted from a US/UK model.
- **Open source.** The full source is public on GitHub, with a clear README, environment variable documentation, and Docker Compose quick start so any student (or any other Hack Clubber) can self-host it.
- **Aligned with Hack Club's mission.** Hack Club exists to get young people building real things instead of consuming. Scholara is exactly that: a young builder shipping a tool to solve their own problem, then opening it up for their entire region to use.

## 3. Features

### Timetable Builder
A weekly schedule grid (Monday–Friday × configurable periods) where students assign subjects to time slots. Each subject carries a color, so the grid is scannable at a glance. Period blocks show subject name, teacher, and room. The grid can be exported as an image for quick sharing (e.g., posting in a class WhatsApp group) or printing.

### Assignment Tracker
Every assignment belongs to a subject and carries a due date, a priority flag (1–3), and a status that moves through a simple pipeline: **todo → in progress → done**. The assignment list can be filtered by subject, status, or "due before" a given date, and the UI surfaces a live countdown so the most urgent work is always visible first. Assignments group naturally by subject so a student can see at a glance how much outstanding work each class has.

### Exam Tracker
A dedicated view for everything exam-shaped: CSEC/CAPE externals, school internals, and mock exams. Each exam is tagged by type (internal/external/mock) and subject, with a countdown timer to exam day. An "upcoming" filter surfaces everything in the next 30 days — the window where exam anxiety (and the need to actually plan revision) spikes. Per-subject exam history lets a student see how a subject's assessment pattern has looked over the term.

### Grade Tracker
Grades are logged per subject with a score, a max score, and a weight (so a 40%-weighted SBA and a 10%-weighted classwork count appropriately toward the running average). Scholara computes a weighted average per subject and — critically — maps that percentage onto the CXC 1–6 grading scale, the scale CSEC/CAPE students actually think in. A summary view shows every subject's predicted grade as a color-coded badge (green for a strong 1/2, yellow for a middling 3/4, red for a 5/6 that needs attention), plus simple bar-chart visualizations of where a student stands across all subjects.

### Flashcard System (SRS)
Students build decks of front/back flashcards, optionally tied to a subject. Review sessions use the SM-2 spaced repetition algorithm (see Section 8) to schedule when each card comes back, so time is spent on the cards that are about to be forgotten rather than re-reviewing everything indiscriminately. A due-today queue surfaces exactly the cards that need attention right now. Decks can be bootstrapped from a CSV import in the same front/back format Anki uses, so a student migrating from Anki (or a senior handing down a deck of CSEC History dates) doesn't have to retype anything.

### Pomodoro Timer
A built-in focus timer (25 minutes on, 5 minutes off by default, configurable) that can be linked to a subject, logging each session so a student can see — and a parent or tutor can verify — how study time is actually distributed across subjects over a term.

### AI Study Assistant
Powered by the Claude API, with three modes:
- **Chat** — a free-form study conversation, with the current subject/page passed in as context so answers stay relevant.
- **Explain** — give it a topic, a subject, and a level (e.g. "CSEC" or "CAPE Unit 2"), and Claude produces a level-appropriate explanation.
- **Quiz me** — point it at a flashcard deck and Claude generates fresh quiz questions that test the same concepts the cards cover, rather than just echoing the card text back.

### Podcast Generator (Flagship)
Turns study material into an audio conversation between two AI hosts. Full technical breakdown in Section 4.

## 4. Podcast Generator — Deep Dive

This is the centerpiece of the Stardance submission — the feature where Claude's output becomes something a student actually *listens to*.

### What it does
A student provides study material — pasted notes, a flashcard deck, or (eventually) a PDF — and Scholara produces a NotebookLM-style audio episode: a natural, engaging conversation between two AI hosts walking through that material. The result is something a student can put on while commuting, doing chores, or just resting their eyes after a day of reading.

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
- **Primary: Kokoro TTS** — a self-hosted, open-source, 82M-parameter TTS model. Chosen because it's free, self-hostable on the same Docker network as everything else, fast enough for a hackathon demo, and good enough quality for a study podcast. Voice mapping: `af_sky` → Sol, `am_adam` → Ari.
- **Premium fallback: ElevenLabs** — a drop-in swap via the `TTS_PROVIDER` environment variable, for when higher production quality matters more than self-hosting cost.

### Prompt engineering
The Claude system prompt for script generation is deliberately specific, because TTS output quality depends entirely on how "speakable" the generated text is:
- Natural speech patterns: contractions, the occasional em-dash, "..." for a thinking pause.
- Each speaker turn capped at 2–4 sentences, so the rhythm of the conversation stays natural and TTS chunks don't run on.
- Varied sentence length — a script where every line is the same length reads like a list, not a conversation.
- Concrete Caribbean examples wherever the subject allows it (mango trees and sugarcane for photosynthesis, cricket statistics for probability, regional history for context) — and Caribbean-aware framing throughout when the subject is a CSEC subject.
- No markdown in the output at all — it goes straight into a TTS engine, which would read asterisks and hashes aloud.
- Start with a hook, not a syllabus-style introduction.
- End with a memorable summary line, not just a fade-out.

### Example script structure
A good Ari/Sol script for a History topic follows an arc, not a transcript of facts:
1. **Hook** — Sol opens with a provocative question about the topic ("Okay, so why did one tiny island end up controlling half the Caribbean's sugar trade?").
2. **Context** — Ari sets the scene: who, when, where, why it matters historically.
3. **Back-and-forth build** — several turns where each speaker builds on the last point rather than restating it; Sol asks clarifying or connecting questions, Ari supplies structure and detail.
4. **"But why does this matter?"** — Sol pushes past the facts to ask what the point of knowing this actually is.
5. **Modern Caribbean tie-in** — Ari connects the historical material to something present-day and regionally relevant.
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
| | grade_level | string | nullable (e.g. "Form 4") |
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
| GET | /grades/summary | yes | per-subject weighted average + CSEC predicted grade |

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

Scholara's flashcard reviews are scheduled using **SM-2**, the algorithm originally published for SuperMemo and later adopted (with tweaks) by Anki. Implemented in `srs_service.py`.

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

**Why SM-2, not FSRS.** Anki has since moved to FSRS (Free Spaced Repetition Scheduler), a more statistically sophisticated model that fits a per-user forgetting curve from review history. SM-2 was chosen for Scholara deliberately:
- It's simple enough to implement correctly in an afternoon and to reason about when something looks wrong — important for a hackathon timeline and for a codebase other students will read.
- It needs no historical data to "warm up" — a brand-new deck behaves sensibly from card one, whereas FSRS needs a meaningful review history to fit well.
- CSEC/CAPE study timescales (weeks to a few months until an exam) are short enough that SM-2's slightly less optimal long-tail scheduling doesn't matter — the difference between SM-2 and FSRS shows up over months-to-years of reviews, not one exam season.

## 9. CSEC/CAPE Specifics

**CSEC (Caribbean Secondary Education Certificate)** is administered by CXC (the Caribbean Examinations Council) and graded on a 1–6 scale, where **1–3 is a pass** and **4–6 is a fail** — the inverse of the letter-grade intuition most non-Caribbean tools assume. Standard CSEC subjects Scholara ships as presets: English A, English B, Mathematics, Human & Social Biology, Agricultural Science, History, Geography, Principles of Business (POB), Principles of Accounts (POA), Spanish, French, Computer Studies, Integrated Science, Physics, Chemistry, Biology, Physical Education, Art, Music, Technical Drawing, and Food & Nutrition.

**CAPE (Caribbean Advanced Proficiency Examination)** is the advanced-level counterpart, split into Unit 1 and Unit 2 per subject, also graded 1–6.

**Grade predictor formula.** Scholara maps a subject's weighted average percentage onto the CXC scale:

| Weighted average | CXC grade |
|---|---|
| ≥ 90% | 1 |
| 80–89% | 2 |
| 70–79% | 3 |
| 55–69% | 4 |
| 40–54% | 5 |
| < 40% | 6 |

**SBA tracking.** School-Based Assessments (coursework components, often 20–50% of a subject's final CXC mark depending on subject) are logged as grades like any other assessment, distinguished by their own `weight` value — so a heavily-weighted SBA pulls the running average appropriately rather than being treated as just another quiz.

**Presets.** New users can select from the full CSEC subject list (each preloaded with a sensible default color) at registration instead of building their subject list from scratch — directly addressing the "blank canvas" problem that makes general-purpose tools like Notion a poor fit for this audience.

## 10. Roadmap (Phased)

- **Phase 1 – Foundation (Weeks 1–2).** Auth, subjects, assignments, exams, basic grade tracking, timetable. Ship MVP.
- **Phase 2 – Study Tools (Weeks 3–4).** Flashcard system with SM-2 SRS, Pomodoro timer, CSV import.
- **Phase 3 – AI Features (Week 5).** AI chat assistant, explain-topic mode, quiz mode.
- **Phase 4 – Podcast Generator (Weeks 6–7).** Script generation, Kokoro TTS integration, audio pipeline, `PodcastPlayer` UI.
- **Phase 5 – Polish & Stardance Submission (Week 8).** PWA support, mobile optimization, CSEC subject presets, open source README, Stardance write-up, demo video.

## 11. Deployment

Scholara deploys as a Docker Compose stack via **Coolify**, running on the same Proxmox/Contabo VPS infrastructure as Xeno Solutions' other products (Keylo, The Spot). Coolify runs in an LXC container (`10.10.10.10`) behind an `nginx-ui` reverse proxy (`10.10.10.2`). The domain `scholara.app` is registered through Spaceship and points at the Contabo VPS IP. Coolify handles TLS termination and zero-downtime deploys triggered by a GitHub webhook on push to `main`. The Kokoro TTS service runs as a separate container on the same Docker network so the backend can reach it over the internal bridge network without exposing it publicly. Generated audio files are served either directly through Flask (`GET /podcasts/:id/audio`) or, in production, via nginx as a static asset path for lower overhead.

## 12. Stardance Submission Checklist

- [ ] GitHub repo public (`xeno3dev/scholara`)
- [ ] README with screenshots, demo link, tech stack
- [ ] Claude API integrated (AI assistant + podcast generation)
- [ ] Live demo deployed at scholara.app
- [ ] Demo video (3–5 min walkthrough, showing podcast generation end-to-end)
- [ ] Stardance submission form filled out
- [ ] Hack Club Slack post in #stardance
