---
marp: true
theme: default
paginate: true
style: |
  :root {
    --color-primary: #1a6faf;
    --color-accent: #00b4d8;
    --color-bg: #f0f6ff;
    --color-dark: #0d1b2a;
    --color-muted: #5a7a9f;
  }

  section {
    background: #f0f6ff;
    color: #0d1b2a;
    font-family: 'Segoe UI', sans-serif;
    padding: 48px 64px;
  }

  h1 {
    color: #1a6faf;
    font-size: 2.2em;
    border-bottom: 3px solid #00b4d8;
    padding-bottom: 12px;
    margin-bottom: 24px;
  }

  h2 {
    color: #1a6faf;
    font-size: 1.6em;
  }

  h3 {
    color: #00b4d8;
    font-size: 1.1em;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  strong {
    color: #1a6faf;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85em;
  }

  th {
    background: #1a6faf;
    color: white;
    padding: 8px 12px;
    text-align: left;
  }

  td {
    padding: 7px 12px;
    border-bottom: 1px solid #c8dff0;
  }

  tr:nth-child(even) td {
    background: #dceeff;
  }

  section.cover {
    background: linear-gradient(135deg, #0d1b2a 0%, #1a6faf 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  section.cover h1 {
    color: white;
    font-size: 3em;
    border-bottom: 3px solid #00b4d8;
  }

  section.cover h2 {
    color: #90d4f0;
    font-size: 1.3em;
    font-weight: 400;
    margin-top: 8px;
  }

  section.cover p {
    color: #a0c8e8;
    font-size: 0.9em;
    margin-top: 40px;
  }

  section.dark {
    background: linear-gradient(135deg, #0d1b2a 0%, #1a3a5c 100%);
    color: white;
  }

  section.dark h1 {
    color: #00b4d8;
    border-bottom-color: #1a6faf;
  }

  section.dark h3 {
    color: #90d4f0;
  }

  .pill {
    display: inline-block;
    background: #1a6faf;
    color: white;
    border-radius: 999px;
    padding: 3px 14px;
    font-size: 0.8em;
    margin: 2px;
  }

  blockquote {
    border-left: 4px solid #00b4d8;
    background: #dceeff;
    padding: 12px 20px;
    margin: 16px 0;
    font-style: italic;
    color: #0d1b2a;
  }
---

<!-- _class: cover -->

# MediVoice 🎙️
## Speak your symptoms. Get your MC. Skip the queue.

Agora Voice AI Hackathon · Singapore 2026

---

# 😷 Problem

**2.3M polyclinic visits/year in Singapore — half for minor ailments.**

- Doctors spend **30–40 min** per patient on a **3-min clinical decision**
- Patients take **half-days off** just to get an MC
- Waiting rooms = unnecessary exposure risk
- Services locked out of non-English speakers

> The bottleneck is **data collection**, not medical judgement.

---

# 💡 The Insight: One Doctor. 100x the Reach.

**Traditional telehealth just moves the clinic online. We scale it.**

| | Traditional Clinic | Telehealth App | **MediVoice** |
|---|---|---|---|
| Patients per doctor/hr | ~2 | ~4 | **~80** |
| Clinic branches served | 1 | 1 | **Unlimited** |
| Data collection | Doctor | Doctor | **AI Agent** |
| Languages | 1–2 | 1–2 | **4** |

**One AI doctor. Every branch. Every language. 24/7.**

> **Why Agora?** ConvoAI runs STT → LLM → TTS inside the call, sub-200ms via SD-RTN. Not duct-taped together.

---

# ✅ Solution: AI Telehealth Platform

| | ❌ Before | ✅ MediVoice |
|---|---|---|
| **Patient wait** | 2–3 hours at clinic | ~10 min from home |
| **Doctor time** | 30–40 min per case | < 2 min async review |
| **Data collection** | Doctor does it manually | AI conducts full interview |
| **MC issuance** | In-person only | PDF delivered instantly |
| **Language** | English only | EN · 中文 · BM · தமிழ் |
| **Throughput** | ~8 cases/hr per doctor | **~80 cases/hr per doctor** |

**One doctor. 10x the impact. Zero waiting room.**

---

# 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Voice Transport** | Agora RTC SDK (`agora-rtc-sdk-ng`) |
| **AI Agent** | Agora Conversational AI Engine (`agora-agent-client-toolkit`) |
| **LLM** | OpenAI GPT-4o |
| **TTS** | ElevenLabs / Cartesia |
| **Backend** | Python · FastAPI · Uvicorn |
| **Auth & Token** | Agora Token Builder · `python-dotenv` |
| **Database** | Couchbase |
| **PDF Generation** | ReportLab |
| **Frontend** | React 19 · TailwindCSS · Vite |
| **UI Components** | Radix UI · Lucide React · shadcn/ui |

> Agora handles the full loop — STT → LLM → TTS — over low-latency SD-RTN. Not a wrapper.

---

# 🏗️ Architecture

| Layer | Component | Tech | Role |
|-------|-----------|------|------|
| 🧑 **Patient** | React App | Agora RTC SDK | Voice input · live transcript |
| ☁️ **Agora Cloud** | SD-RTN · ConvoAI | STT → GPT-4o → TTS | AI clinical interview |
| ⚙️ **Backend** | API Server | FastAPI · Couchbase | Token gen · agent control · case DB |
| 🩺 **Doctor** | Dashboard | React · TailwindCSS | Review · approve · escalate |

> All real-time intelligence flows through Agora — no custom STT or TTS pipeline.

---

# 🎤 Patient Flow

1. Open MediVoice → **Start Consultation**
2. AI agent interviews: complaint, duration, severity, symptoms, meds
3. Red-flag detected? → agent stops, advises **995 / A&E** + **immediately escalates to on-duty doctor via live Agora RTC call**
4. Summary generated → patient confirms → **enters doctor queue**

> No app. No typing. No waiting room. Just speak.

---

# 🩺 Doctor Flow

Doctor opens dashboard → sees AI-structured case summary.

| Decision | Action |
|----------|--------|
| ✅ Approve | Select MC duration (1–3 days) → PDF issued |
| 📝 Modify | Edit diagnosis or duration |
| 🚨 Escalate | Flag for in-person, patient notified |

**One screen. One click. Under 2 minutes.**

<div style="margin-top:20px;background:#1a6faf;color:white;border-radius:10px;padding:14px 24px;display:flex;align-items:center;gap:16px;font-size:0.9em">
<span style="font-size:2em">🧑‍⚕️</span>
<div><strong style="color:#90d4f0;font-size:1.1em">HITL — Human In The Loop</strong><br/>AI never issues an MC autonomously. Every case requires an explicit doctor decision before anything is sent to the patient.</div>
</div>

---

# 📈 Market & Affordability

| Metric | Value |
|--------|-------|
| SEA Telemedicine Market (2025) | **$2B+** |
| SG polyclinic visits / year | **~2.3M** |
| MC-eligible cases / year | **~1.1M** |

**Healthcare shouldn't cost more than a meal.**

| | Traditional Clinic | MediVoice |
|--|--|--|
| Patient cost | $15–30 + transport | **$8.99** |
| Time spent | Half a day | ~10 min |
| Where | Queue at clinic | From home |

> 🍗 The price of a chicken rice. Healthcare is affordable again.

---

# 🏁 The Ask

> **Partner with one polyclinic group for a 3-month pilot.**

- MC wait: **2.5 hrs → 30 min**
- Doctor throughput: **10x**
- Built on Agora RTC + ConvoAI · FastAPI · React
