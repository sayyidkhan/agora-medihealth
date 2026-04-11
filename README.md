# MediVoice

Voice-first AI telehealth demo: patients describe symptoms through an Agora-powered conversational agent; the backend issues RTC tokens, integrates optional TTS/avatar providers, and persists data via Couchbase.

**Stack:** React (Vite) · FastAPI · Agora RTC & Conversational AI · Couchbase (and optional ElevenLabs / Cartesia / Anam — see `.env.example`).

## Project links

| | |
|--|--|
| **Source code (repository)** | [github.com/sayyidkhan/agora-medihealth](https://github.com/sayyidkhan/agora-medihealth) |
| **Frontend** | [tree/main/frontend](https://github.com/sayyidkhan/agora-medihealth/tree/main/frontend) |
| **Backend** | [tree/main/backend](https://github.com/sayyidkhan/agora-medihealth/tree/main/backend) |
| **Presentation** | [tree/main/presentation](https://github.com/sayyidkhan/agora-medihealth/tree/main/presentation) |
| **Video demo** | [youtu.be/v4ACgmgYVfg](https://www.youtube.com/watch?v=v4ACgmgYVfg) |

## Repository layout

| Path | Purpose |
|------|--------|
| [`frontend/`](https://github.com/sayyidkhan/agora-medihealth/tree/main/frontend) | React UI |
| [`backend/`](https://github.com/sayyidkhan/agora-medihealth/tree/main/backend) | FastAPI API (`main.py`) |
| [`presentation/`](https://github.com/sayyidkhan/agora-medihealth/tree/main/presentation) | Hackathon deck — `slides.md` (Marp source) |
| [`proposal/`](https://github.com/sayyidkhan/agora-medihealth/tree/main/proposal) | Proposal assets and notes |

## Prerequisites

- Node.js 20+ and npm  
- Python 3.11+ (or compatible) with `pip`  
- Agora project with **Conversational AI** enabled (same App ID as RTC)  
- API keys as described in `.env.example`

## Configuration

From the repo root:

```bash
cp .env.example .env
```

Edit `.env` and fill in at least **Agora** (`AGORA_APP_ID`, `AGORA_APP_CERTIFICATE`, `AGORA_CUSTOMER_ID`, `AGORA_CUSTOMER_SECRET`), **OpenAI**, and your chosen **TTS** provider. The backend loads `.env` from the **repository root** (not `backend/`).

## Run locally

**Terminal 1 — API**

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 — frontend**

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default [http://localhost:5173](http://localhost:5173)). CORS allows `localhost:5173` and `localhost:3000`.

## Presentation (Marp)

Source: `presentation/slides.md`. Build a standalone HTML file:

```bash
cd presentation
npx --yes @marp-team/marp-cli --no-stdin slides.md -o index.html
```

On macOS/Linux, if the CLI waits for stdin, keep `--no-stdin`.

### GitHub Pages

Pushes to `main` that touch `presentation/**` trigger [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml): Marp runs in CI, and the result is pushed to the **`gh-pages`** branch (site root = `index.html`).

In the GitHub repo: **Settings → Pages →** branch **`gh-pages`**, folder **`/ (root)`**. The live URL is `https://<user>.github.io/<repo>/` (after DNS/build propagation). You can also run the workflow manually under **Actions**.

## License

Use and modification according to your team / hackathon rules.
