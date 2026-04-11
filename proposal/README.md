# MediVoice — Hackathon Proposal

---

## Project Info

| Field | Value |
|-------|-------|
| **Project Name** | MediVoice |
| **Tagline** | Speak your symptoms. Get your MC. Skip the queue. |
| **Demo URL** | https://agora-medihealth.vercel.app/ |
| **Repository** | https://github.com/sayyidkhan/agora-medihealth |
| **Video Demo** | https://www.youtube.com/watch?v=v4ACgmgYVfg |
| **Slides (PDF)** | Uploaded to submission portal (Supabase storage) |

---

## About / Description

### What is MediVoice?

MediVoice is a voice-first AI telehealth platform that lets patients describe their symptoms through a conversational AI agent, which conducts a structured clinical interview, generates a consultation summary, and routes it to a licensed doctor for async review and MC (medical certificate) approval — all without a physical clinic visit.

### The Problem

Singapore's polyclinics handle ~2.3 million visits per year, with roughly half for minor, self-limiting conditions (flu, URTI, gastroenteritis). These cases:

- Occupy 30–40 minutes of a doctor's time for what is a 3-minute clinical decision
- Force patients to take half-days off work just to obtain an MC
- Create unnecessary exposure risk in crowded waiting rooms
- Are inaccessible to non-English-speaking residents

**The bottleneck is data collection, not medical judgement.**

### The Insight: One Doctor. 100x the Reach.

Traditional telehealth just moves the clinic online. MediVoice scales it.

| | Traditional Clinic | Telehealth App | MediVoice |
|--|--|--|--|
| Patients per doctor/hr | ~2 | ~4 | **~80** |
| Clinic branches served | 1 | 1 | **Unlimited** |
| Data collection | Doctor | Doctor | **AI Agent** |
| Languages | 1–2 | 1–2 | **4** |

### The Solution

| | Before | MediVoice |
|--|--|--|
| Patient wait | 2–3 hours at clinic | ~10 min from home |
| Doctor time per case | 30–40 min | < 2 min async review |
| Data collection | Doctor does it manually | AI conducts full interview |
| MC issuance | In-person only | PDF delivered instantly |
| Language | English only | EN · 中文 · BM · தமிழ் |
| Throughput | ~8 cases/hr per doctor | ~80 cases/hr per doctor |

### How It Works

1. Patient opens MediVoice → clicks **Start Consultation**
2. Agora ConvoAI agent conducts structured clinical interview (complaint, duration, severity, symptoms, allergies, medications)
3. Red-flag detected (chest pain, altered consciousness) → agent stops, advises **995 / A&E** + escalates to on-duty doctor via live Agora RTC call
4. AI generates structured summary → patient confirms → enters doctor queue
5. Doctor reviews async in < 2 min → approves → **MC PDF issued instantly**

**Human-in-the-loop: no MC is ever issued without explicit doctor approval.**

### Why Agora — Not Zoom, Teams, or Generic WebRTC?

Agora ConvoAI runs the full STT → LLM → TTS loop **inside the call** over sub-200ms global SD-RTN. No external pipeline duct-taped together. This is what makes real-time, natural-sounding clinical voice interviews possible at scale.

### Impact

- **10x** doctor throughput per hour
- Wait time: **2–3 hours → ~10 minutes**
- Cost to patient: **$8.99** (the price of a chicken rice — healthcare is affordable again)
- Supports **4 languages**: English, Mandarin, Malay, Tamil
- HITL guaranteed: no MC issued without doctor approval

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Voice Transport** | Agora RTC SDK (`agora-rtc-sdk-ng`) |
| **AI Agent** | Agora Conversational AI Engine (`agora-agent-client-toolkit`) |
| **LLM** | OpenAI GPT-4o |
| **TTS** | ElevenLabs / Cartesia (via Agora ConvoAI) |
| **Backend** | Python · FastAPI · Uvicorn |
| **Database** | Couchbase |
| **PDF Generation** | ReportLab |
| **Frontend** | React 19 · TailwindCSS · Vite |
| **UI Components** | Radix UI · Lucide React · shadcn/ui |

**Built with:** Agora RTC SDK · Agora Conversational AI · OpenAI GPT-4o · ElevenLabs · FastAPI · React · TailwindCSS · Couchbase · Python · Vite

**Category:** Healthcare / MedTech

---

## Deployment

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://agora-medihealth.vercel.app/ |
| Backend (Render) | https://agora-medihealth.onrender.com |

---

## Media

| File | Description |
|------|-------------|
| `thumbnail.png` | App thumbnail (submitted) |
| `1.png` | Doctor selection screen |
| `2.png` | Doctor voice selection with avatars |
| `3.png` | Live consultation — patient video call |
| `4.png` | AI transcript during consultation |
| `5.png` | Consultation summary & doctor review |
| `demo.mov` | Short app demo clip |
| `Screen Recording 2026-04-10 at 4.07.59 PM.mov` | Full screen recording |

---

## GTM Strategy

**Phase 1 — Pilot** with:
- Private GP clinics (after-hours coverage)
- Corporate health benefits providers
- University campus health centres

**Phase 2 — Scale** to polyclinic partnerships and regional SEA expansion (Malaysia, Indonesia).

---

## Market

| Metric | Value |
|--------|-------|
| SEA Telemedicine Market (2025) | **$2B+** |
| SG polyclinic visits / year | **~2.3M** |
| MC-eligible cases / year | **~1.1M** |
| Patient cost (MediVoice) | **$8.99** vs $15–30 + transport |
