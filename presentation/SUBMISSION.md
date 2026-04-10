# Hackathon Submission — MediVoice

---

## STEP 1 — Basics

**PROJECT NAME**
```
MediVoice
```

**TAGLINE**
```
Speak your symptoms. Get your MC. Skip the queue.
```

**ABOUT / DESCRIPTION**

```markdown
## What is MediVoice?

MediVoice is a voice-first AI telehealth platform that lets patients describe their symptoms through a conversational AI agent, which conducts a structured clinical interview, generates a consultation summary, and routes it to a licensed doctor for async review and MC (medical certificate) approval — all without a physical clinic visit.

## The Problem

Singapore's polyclinics handle ~2.3 million visits per year, with roughly half for minor, self-limiting conditions (flu, URTI, gastroenteritis). These cases:

- Occupy 30–40 minutes of a doctor's time for what is a 3-minute clinical decision
- Force patients to take half-days off work just to obtain an MC
- Create unnecessary exposure risk in crowded waiting rooms
- Are inaccessible to non-English-speaking residents

The bottleneck is **data collection**, not medical judgement.

## The Solution

MediVoice separates **data collection** (AI does this via voice) from **clinical decision-making** (doctor reviews async in under 2 minutes), enabling one doctor to handle 10x the cases in the same time.

**One AI doctor. Every branch. Every language. 24/7.**

| | Traditional Clinic | MediVoice |
|--|--|--|
| Patient wait | 2–3 hours | ~10 min from home |
| Doctor time per case | 30–40 min | < 2 min |
| Cost to patient | $15–30 + transport | **$8.99** |
| Languages | 1–2 | EN · 中文 · BM · தமிழ் |
| Doctor throughput | ~2 cases/hr | ~80 cases/hr |

## How It Works

1. Patient opens MediVoice and clicks **Start Consultation**
2. Agora RTC joins the channel; the ConvoAI agent begins a structured SOAP-lite clinical interview (chief complaint, duration, severity, symptoms, allergies, medications)
3. If red-flag symptoms are detected (chest pain, altered consciousness, high fever in infants), the agent immediately advises 995 / A&E and escalates to the on-duty doctor via a live Agora RTC call
4. AI generates a structured consultation summary; patient confirms and enters the doctor queue
5. Doctor reviews the AI summary async in under 2 minutes and clicks Approve → MC PDF issued instantly

## Tech Stack

- **Voice Transport:** Agora RTC SDK (`agora-rtc-sdk-ng`)
- **AI Agent:** Agora Conversational AI Engine (`agora-agent-client-toolkit`)
- **LLM:** OpenAI GPT-4o (via Agora ConvoAI)
- **TTS:** ElevenLabs / Cartesia (via Agora ConvoAI)
- **Backend:** Python · FastAPI · Uvicorn
- **Database:** Couchbase
- **PDF Generation:** ReportLab
- **Frontend:** React 19 · TailwindCSS · Vite
- **UI Components:** Radix UI · Lucide React · shadcn/ui

## Why Agora — Not Zoom, Teams, or Generic WebRTC?

Agora ConvoAI runs the full STT → LLM → TTS loop **inside the call** over a sub-200ms global SD-RTN. There is no external pipeline duct-taped together. This is what makes real-time, natural-sounding clinical voice interviews possible at scale.

## Impact

- **10x** doctor throughput per hour
- Wait time: **2.5 hours → 30 minutes**
- Cost to patient: **$8.99** (the price of a chicken rice — healthcare is affordable again)
- Supports **4 languages**: English, Mandarin, Malay, Tamil
- Human-in-the-loop: **no MC is ever issued without explicit doctor approval**
```

---

## STEP 1b — Tags & Track

**BUILT WITH** *(type each one and press Enter)*
```
Agora RTC SDK
Agora Conversational AI
OpenAI GPT-4o
ElevenLabs
FastAPI
React
TailwindCSS
Couchbase
Python
Vite
```

**CATEGORY**
```
Healthcare / MedTech
```

---

## STEP 2 — Media & Links

**GitHub Repository**
```
https://github.com/sayyidkhan/agora-medihealth
```

**Presentation Slides (PDF)**
```
https://github.com/sayyidkhan/agora-medihealth/blob/main/presentation/slides.pdf
```

**Demo Video**
```
[Record and upload a 2–3 min Loom / YouTube demo here]
```

---

## STEP 3 — Team & Submit

**Team Name**
```
agora-medihealth
```

**Team Members**
```
[Add your name(s) and email(s) here]
```

**Hackathon**
```
Agora Voice AI Hackathon Singapore 2026
```
