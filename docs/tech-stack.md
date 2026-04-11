# MediVoice — Tech Stack

## Overview

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Voice Transport | Agora RTC SDK | Real-time audio between patient and AI agent |
| AI Agent | Agora Conversational AI Engine | Manages STT → LLM → TTS pipeline |
| LLM | OpenAI GPT-4o | Clinical interview reasoning and summary generation |
| TTS | ElevenLabs | AI agent voice (4 voice options: standard/premium, male/female) |
| Frontend | React + Vite | Patient consultation UI + Doctor dashboard |
| Styling | TailwindCSS | UI styling |
| Icons | Lucide React | UI icons |
| Components | shadcn/ui | Prebuilt UI components |
| Backend | FastAPI (Python) | Agora token generation, ConvoAI agent lifecycle |
| Database | Couchbase (Capella) | Consultation records, MC storage — hackathon sponsor |
| PDF | ReportLab (Python) | MC certificate generation |

---

## Frontend

```
frontend/
├── React 18 + Vite
├── TailwindCSS
├── shadcn/ui components
├── Lucide React icons
├── Agora RTC SDK (agora-rtc-sdk-ng)
└── couchbase (Couchbase Node.js SDK)
```

### Pages
| Route | Description |
|-------|-------------|
| `/` | Landing page — start consultation or go to doctor login |
| `/consult` | Patient voice consultation with AI agent |
| `/doctor` | Doctor login |
| `/doctor/dashboard` | Doctor case queue and MC approval |

---

## Backend

```
backend/
├── FastAPI (Python 3.11+)
├── python-dotenv
├── agora-token-builder (Agora token generation)
├── httpx (Agora ConvoAI REST calls)
├── couchbase (Couchbase Python SDK)
└── reportlab (MC PDF generation)
```

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/token` | Generate Agora RTC token for patient session |
| `POST` | `/agent/start` | Start ConvoAI agent for a consultation |
| `POST` | `/agent/stop` | Stop ConvoAI agent |
| `POST` | `/consultation` | Save completed consultation summary |
| `GET` | `/consultations` | List all consultations (doctor dashboard) |
| `PATCH` | `/consultation/:id/approve` | Doctor approves MC |
| `PATCH` | `/consultation/:id/escalate` | Doctor escalates to in-person |
| `GET` | `/consultation/:id/mc.pdf` | Download generated MC PDF |

---

## Database (Couchbase Capella)

### Bucket: `medivoice`
### Scope: `_default` / Collection: `consultations`

#### Document structure (JSON)
```json
{
  "id": "uuid",
  "type": "consultation",
  "patient_name": "string",
  "status": "pending | approved | escalated",
  "chief_complaint": "string",
  "duration_days": "number",
  "severity": "number (1-10)",
  "associated_symptoms": ["string"],
  "allergies": "string",
  "current_medications": "string",
  "ai_summary": "string",
  "transcript": "string",
  "mc_duration_days": "number | null",
  "doctor_notes": "string | null",
  "approved_at": "ISO8601 | null",
  "created_at": "ISO8601"
}
```

### Why Couchbase?
- Hackathon sponsor — bonus points with judges
- JSON-native document store — perfect for flexible consultation data
- Couchbase Capella (cloud) — zero infra setup, free trial available
- N1QL SQL-like queries for doctor dashboard filtering

---

## Infrastructure (Local / Hackathon)

```
localhost:5173   → React frontend (Vite dev server)
localhost:8000   → FastAPI backend
cloud.couchbase.com → Couchbase Capella (managed cloud DB)
```

---

## Agora ConvoAI Agent Config

```json
{
  "llm": {
    "provider": "openai",
    "model": "gpt-4o",
    "system_prompt": "<clinical interview prompt>"
  },
  "tts": {
    "provider": "elevenlabs",
    "voice_id": "<selected voice>",
    "model": "eleven_turbo_v2"
  },
  "stt": {
    "provider": "agora"
  }
}
```

---

*Document version: v1.0 — Agora Hackathon Singapore 2026, April 10, 2026*
