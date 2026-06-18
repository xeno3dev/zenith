# Zenith

**(Patially) AI-powered student organizer.**

Built by [Xeno Solutions](https://github.com/xeno3dev) as a [Hack Club Stardance](https://stardance.hackclub.com/) submission.

Zenith is a student productivity app built to help students study smarter. It brings together timetable management, assignment and exam tracking, grade estimation, and flashcards in one clean app, with an AI study assistant powered by Claude and an AI-generated podcast feature that turns your study topics into audio you can actually learn from (Like NotebookLM).

See [`BLUEPRINT.md`](./BLUEPRINT.md) for the full project blueprint (features, architecture, database schema, API reference, SM-2 algorithm, roadmap, and deployment notes).

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
zenith/
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
