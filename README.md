# Scholara

**AI-powered student organizer for Caribbean CSEC/CAPE students.**

Built by [Xeno Solutions](https://github.com/xeno3dev) as a [Hack Club Stardance](https://hackclub.com/) submission.

Scholara is a study companion that understands the Caribbean classroom: CSEC/CAPE subjects, grading conventions, and exam culture. It bundles a timetable builder, assignment & exam trackers, a weighted-grade tracker with CSEC grade prediction, a spaced-repetition flashcard system, an AI study assistant, and a flagship feature — an AI-generated study **podcast** where two hosts, Ari and Sol, talk through your notes like a NotebookLM-style deep dive.

See [`BLUEPRINT.md`](./BLUEPRINT.md) for the full project blueprint (features, architecture, database schema, API reference, SM-2 algorithm, CSEC/CAPE grading specifics, roadmap, and deployment notes).

## Tech stack

- **Backend:** Python 3.12, Flask, Flask-SQLAlchemy, Flask-Migrate, Flask-JWT-Extended, PostgreSQL 16, Anthropic Claude API, pydub
- **Frontend:** Vite, React 18, React Router v6, Tailwind CSS, Zustand, axios
- **TTS:** Kokoro TTS (self-hosted) or ElevenLabs
- **Deployment:** Docker Compose

## Quick start

```bash
cp .env.example .env
# fill in ANTHROPIC_API_KEY and other secrets in .env
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Health check: http://localhost:5000/health

## Project structure

```
scholara/
├── backend/    # Flask API
├── frontend/   # Vite + React app
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── BLUEPRINT.md
```

## Environment variables

See [`.env.example`](./.env.example) for the full list (database, JWT secret, Anthropic API key, TTS provider config, storage paths, CORS).

## License

MIT — built for the Hack Club Stardance program.
