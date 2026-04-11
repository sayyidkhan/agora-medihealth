# PRD: MediVoice — AI-Assisted Telemedicine Triage & MC Issuance

## 1. Overview

### Product Name
**MediVoice**

### Tagline
*"Speak your symptoms. Get your MC. Skip the queue."*

### Summary
MediVoice is a voice-first telemedicine platform that lets patients describe their symptoms through a conversational AI agent, which conducts a structured clinical interview, generates a consultation summary, and routes it to a licensed doctor for async review and MC (medical certificate) approval — all without requiring a physical clinic visit for common ailments.

### Problem Statement
Singapore's polyclinics see millions of visits annually, with a significant proportion for minor, self-limiting conditions (flu, URTI, headache, gastroenteritis). These cases:
- Occupy ~30–40 min of a doctor's time per patient for what is clinically a 3-minute decision
- Force patients to take half-days off work just to get an MC
- Create unnecessary exposure risk in waiting rooms
- Are linguistically inaccessible to non-English-speaking residents

MediVoice closes this gap by separating the **data collection** step (AI does this via voice) from the **clinical decision** step (doctor reviews async in <2 min), enabling one doctor to handle 10x the cases in the same time.

---

## 2. Target Users

### Primary: Patients
- Working adults with minor ailments needing an MC
- Elderly residents who prefer speaking over typing
- Non-English speakers (Mandarin, Malay, Tamil)
- Parents calling in for a sick child

### Secondary: Doctors / Medical Officers
- GPs and polyclinic MOs who review completed AI consultations
- Clinic administrators managing case queues

---

## 3. Core User Flows

### Flow A: Patient Voice Consultation

```
Patient opens MediVoice web app
  → Clicks "Start Consultation"
  → Agora RTC joins channel, Agora ConvoAI agent starts
  → AI agent greets patient and conducts structured clinical interview:
      - Chief complaint ("What's bothering you today?")
      - Duration ("How long have you had this?")
      - Severity (1–10 scale, prompted verbally)
      - Associated symptoms (fever, cough, vomiting, etc.)
      - Relevant history (allergies, chronic conditions)
      - Current medications
  → Agent detects consultation is complete
  → AI generates structured consultation summary (JSON + human-readable)
  → Patient sees summary on screen, confirms accuracy
  → Case enters "Pending Doctor Review" queue
  → Patient receives estimated review time (e.g., "within 30 minutes")
```

### Flow B: Doctor Review & Approval

```
Doctor logs into MediVoice Dashboard
  → Sees queue of pending cases with AI summaries
  → Clicks into a case:
      - Reads AI-generated summary
      - Can replay audio transcript if needed
      - Sees flagged red-alert items (e.g., chest pain, difficulty breathing → auto-escalated, not shown here)
  → Doctor makes one of three decisions:
      1. ✅ Approve MC — select duration (1–3 days), add optional notes
      2. 📝 Approve with modification — edit diagnosis/duration before approving
      3. 🚨 Escalate — flag for in-person visit, patient notified immediately
  → Patient receives push notification + downloadable PDF MC
```

### Flow C: Red Flag Auto-Escalation (Safety Net)

```
During AI interview, if patient mentions:
  - Chest pain / difficulty breathing
  - Sudden severe headache
  - High fever >39.5°C in child <2 years
  - Altered consciousness
  - Suicidal ideation
→ Agent immediately halts standard flow
→ Verbally advises patient to call 995 or go to A&E
→ Case is flagged as "Escalated – Do Not Issue MC"
→ Duty doctor is notified in real time via Agora RTC call
```

---

## 4. Features (Hackathon Scope)

### Must-Have (MVP)
| # | Feature | Description |
|---|---------|-------------|
| 1 | Voice AI Clinical Interview | Agora ConvoAI agent conducts structured symptom collection |
| 2 | Real-time transcription | Live transcript shown during the consultation |
| 3 | AI Consultation Summary | Auto-generated structured summary post-interview |
| 4 | Doctor Review Dashboard | Web UI for doctor to view cases and approve/reject MCs |
| 5 | MC Approval Action | Doctor clicks approve → generates a mock MC PDF |
| 6 | Red Flag Detection | Agent detects serious symptoms and escalates verbally |
| 7 | Case Queue | Pending, approved, and escalated cases visible in dashboard |

### Nice-to-Have (If Time Permits)
| # | Feature | Description |
|---|---------|-------------|
| 8 | Multilingual support | Patient can speak in Mandarin, Malay, or Tamil |
| 9 | Doctor ↔ Patient voice call | Agora RTC live escalation call from dashboard |
| 10 | MC PDF download | Formatted, downloadable MC with QR verification |
| 11 | Session replay | Doctor can replay patient audio |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Patient Browser                    │
│  React App  ──── Agora RTC SDK ────────────────┐    │
│  (mic/speaker)                                  │    │
└─────────────────────────────────────────────────|───┘
                                                  │
                              Agora SD-RTN (Cloud)│
                                                  │
┌─────────────────────────────────────────────────|───┐
│              Agora Conversational AI Engine      │    │
│   STT → LLM (GPT-4o / Claude) → TTS ◄──────────┘    │
│   System prompt: clinical interview protocol         │
│   Tool call: submit_consultation_summary()           │
└──────────────────────┬──────────────────────────────┘
                       │ REST (summary payload)
┌──────────────────────▼──────────────────────────────┐
│                  Python Backend                      │
│  - Agora token generation                            │
│  - Start/stop ConvoAI agent (Agora REST API)         │
│  - POST /consultation  → save to DB                  │
│  - POST /approve       → generate MC                 │
│  - GET  /queue         → doctor dashboard data       │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Doctor Browser (Dashboard)              │
│  React App  — case queue, summary view, approve UI  │
└─────────────────────────────────────────────────────┘
```

### Tech Stack
| Layer | Technology |
|-------|-----------|
| Voice Transport | Agora RTC SDK |
| AI Agent | Agora Conversational AI Engine |
| LLM | OpenAI GPT-4o (via Agora ConvoAI config) |
| TTS | ElevenLabs / Cartesia (via Agora ConvoAI config) |
| Backend | Python (FastAPI) |
| Frontend | React + TailwindCSS |
| Storage | In-memory / SQLite (hackathon scope) |
| PDF Generation | ReportLab (Python) or browser print |

---

## 6. AI Agent System Prompt (Clinical Interview Protocol)

The Agora ConvoAI agent will be configured with a system prompt that:

1. Identifies itself as "MediVoice AI Assistant" (not a doctor)
2. Follows a structured SOAP-lite interview:
   - **S**ubjective: Chief complaint, duration, severity, associated symptoms
   - **O**bjective: Self-reported vitals if available (temp, etc.)
   - **A**llergies & medications
   - **P**lan intent: Confirms patient is seeking MC for minor illness
3. Detects red-flag keywords and escalates immediately
4. On completion, calls a tool function `submit_consultation()` with structured JSON
5. Speaks in a warm, calm, reassuring tone
6. Keeps each question short and waits for full patient response before proceeding

---

## 7. Data Model (Simplified)

### Consultation
```json
{
  "id": "uuid",
  "patient_name": "string",
  "created_at": "ISO8601",
  "status": "pending | approved | escalated | rejected",
  "chief_complaint": "string",
  "duration_days": "number",
  "severity": "1-10",
  "associated_symptoms": ["fever", "cough", ...],
  "allergies": "string",
  "current_medications": "string",
  "ai_summary": "string",
  "transcript": "string",
  "mc_duration_days": "number | null",
  "doctor_notes": "string | null",
  "approved_at": "ISO8601 | null"
}
```

---

## 8. Judging Alignment

| Criterion | How MediVoice Addresses It |
|-----------|---------------------------|
| **Integration & Use of Technologies (30%)** | Agora RTC + ConvoAI is the core of the product — not a wrapper |
| **System Functionality (30%)** | End-to-end demo: patient speaks → doctor approves → MC issued |
| **Originality of Concept (15%)** | Async doctor-in-the-loop MC issuance is a novel workflow |
| **Innovation & Creativity (20%)** | Voice-first healthcare triage is beyond "common" ConvoAI use cases |
| **Commercial Viability (10%)** | Clear B2B2C model: sell to clinic chains, IHH, Raffles Health |
| **Impact & Real-World Application (10%)** | Directly addresses SG polyclinic queue crisis |

---

## 9. Out of Scope (Hackathon)

- Actual integration with MOH / HealthHub
- Real medical licensing / legal compliance
- Patient identity verification (MyInfo / SingPass)
- Payment processing
- Prescription issuance (controlled drugs)
- Mobile app (web only for demo)

---

## 10. Pitch Narrative (5-min Story)

1. **Hook**: "Last month, 2.3 million people visited Singapore polyclinics. Half of them had the flu."
2. **Problem**: Show a patient waiting 2 hours for a 3-minute decision.
3. **Demo**: Live voice consultation with MediVoice AI agent.
4. **Aha moment**: Doctor dashboard — one click, MC issued in under 2 minutes.
5. **Scale**: One doctor reviewing async can handle 10x more cases.
6. **Market**: $2B+ telemedicine market in SEA. SG is the perfect regulated sandbox.
7. **Ask**: Partner with one polyclinic group for a 3-month pilot.

---

*Document version: v1.0 — Agora Hackathon Singapore 2026, April 10, 2026*
