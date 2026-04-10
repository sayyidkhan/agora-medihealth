# MediVoice — UX Journey & Edge Cases

## Core User Journey

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PATIENT SIDE                                │
└─────────────────────────────────────────────────────────────────────┘

1. LANDING
   Patient opens MediVoice web app from home
   → Sees a clean homescreen with a virtual doctor avatar
   → Prompted: "What kind of doctor do you need today?"

2. DOCTOR SELECTION
   Patient selects doctor type:
   ┌─────────────────┬─────────────────┬─────────────────┐
   │  General (GP)   │  Paediatrician  │  Women's Health │
   └─────────────────┴─────────────────┴─────────────────┘
   → Also selects preferred doctor voice (Male / Female)

3. PRE-CONSULTATION PROMPT
   Patient types or speaks a brief description of their issue:
   e.g. "I have a headache and runny nose since yesterday"
   → This is passed as context to the AI agent before the session starts

4. VOICE CONSULTATION
   → AI Doctor avatar appears on screen (animated, human-like)
   → Agora RTC connects patient mic/speaker to ConvoAI engine
   → AI Doctor greets patient by name and acknowledges the pre-prompt
   → Conducts structured clinical interview:
      - Chief complaint confirmation
      - Duration and onset
      - Severity (1–10)
      - Associated symptoms
      - Fever / chills / vomiting / diarrhoea
      - Allergies
      - Current medications
      - Recent travel history (for infectious disease screening)
   → Live transcript shown on screen as conversation progresses
   → Patient can interrupt the AI at any time (interruption handling built into Agora ConvoAI)

5. AI TRIAGE DECISION (end of consultation)

   ┌──────────────────────────────────────────────────────────────┐
   │  MILD CASE (flu, cough, headache, URTI, gastro)              │
   │  → AI generates structured consultation summary              │
   │  → Routes to human doctor queue for async review             │
   │  → Patient sees: "Your consultation is being reviewed.       │
   │     Estimated response: within 30 minutes."                  │
   └──────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────┐
   │  ESCALATION CASE (red flags detected)                        │
   │  → AI pauses and verbally flags concern                      │
   │  → Notifies on-duty human doctor for live voice call         │
   │  → If no doctor available: directs patient to A&E / 995      │
   └──────────────────────────────────────────────────────────────┘

6. DOCTOR ASYNC REVIEW
   → On-duty doctor receives notification of pending case
   → Opens Doctor Dashboard → reads AI summary + transcript
   → Makes decision:
      ✅ Approve MC (select 1–3 days duration, add notes)
      📝 Modify & Approve (edit diagnosis or duration)
      🚨 Escalate (trigger live voice call with patient)

7. MC DELIVERY
   → Patient receives push notification: "Your MC is ready"
   → Downloads digitally signed PDF MC from the app
   → MC includes: patient name, diagnosis, duration, doctor name, date

8. MEDICINE RECOMMENDATION
   → Doctor optionally attaches a medicine recommendation:
      - List of OTC medicines (e.g. paracetamol, antihistamine)
      - Option A: "Pick up at nearest pharmacy" → map shown
      - Option B: "Deliver to my door" → Grab integration (future)
   → Patient sees medicine list with dosage instructions

```

---

## Edge Cases

### 🔴 Patient Safety Edge Cases

| Scenario | AI Behaviour | System Action |
|----------|-------------|---------------|
| Patient mentions chest pain / difficulty breathing | Immediately stops interview, verbally advises call 995 | Case flagged as EMERGENCY, duty doctor notified instantly via Agora RTC |
| Patient mentions suicidal thoughts or self-harm | Compassionately de-escalates, provides Samaritans of Singapore hotline (1-767) | Case escalated, flagged as MENTAL HEALTH CRISIS |
| Fever >39°C in child under 2 years | Advises immediate A&E visit, does not issue MC | Case escalated |
| Patient is unresponsive / silent for >30 seconds | AI gently re-prompts twice, then ends session gracefully | Session saved as INCOMPLETE |
| Patient disconnects mid-consultation | Session state saved to Couchbase | Patient can resume from where they left off |

---

### 🟡 Operational Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| No doctor available to review (off-hours) | Patient shown estimated wait time, gets notified when doctor comes online |
| Doctor takes >60 min to review | Patient gets reminder notification, case auto-escalated to next available doctor |
| Doctor rejects MC request | Patient notified with reason, advised to visit clinic in person |
| Patient submits duplicate consultation (same complaint within 24h) | System detects and warns: "You already have a pending consultation. View status?" |
| Patient claims severe symptoms but AI assesses as mild | AI errs on the side of caution — always escalates if patient insists severity is high |
| Patient speaks a language other than English | Multilingual fallback: agent switches to Mandarin / Malay / Tamil based on detected language |
| Patient is a minor (under 18) | System flags case, requires parent/guardian confirmation before MC issuance |

---

### 🟢 Medicine Fulfilment Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Patient has drug allergy | Doctor sees allergy in summary, selects alternative medicine |
| Prescribed medicine is out of stock at nearest pharmacy | App shows next nearest pharmacy with stock (future feature) |
| Patient prefers delivery | Grab Health / delivery integration triggered (future feature) |
| Patient already has medicine at home | Doctor notes "no prescription needed", skips medicine recommendation |

---

### 🔵 Technical Edge Cases

| Scenario | Behaviour |
|----------|-----------|
| Poor internet connection | Agora RTC auto-adjusts bitrate; session degrades gracefully |
| Browser microphone permission denied | App shows clear guide to enable mic, cannot proceed without it |
| AI agent fails to start (Agora API error) | User shown friendly error, retry button, fallback to text chat |
| Couchbase write fails | Retry with exponential backoff; if persistent, consultation saved locally and synced when connection restored |

---

## Full Happy Path Summary (Closed Loop)

```
Patient opens app
  → Selects GP + Female voice
  → Types: "I have flu and slight fever since yesterday"
  → Speaks with AI Doctor for ~3 minutes
  → AI determines: mild URTI, no red flags
  → Consultation routed to Dr. Tan (on duty today)
  → Dr. Tan reviews in 8 minutes, approves 2-day MC
  → Patient receives MC PDF notification
  → Dr. Tan recommends: Paracetamol 500mg + Loratadine
  → Patient taps "Find Nearest Pharmacy" → Guardian 200m away shown
  → Patient recovers at home ✅
```

---

## Screen Map

| Screen | Who Sees It | Key Actions |
|--------|------------|-------------|
| `/` | Patient | Landing, doctor type + voice selection, pre-prompt input |
| `/consult` | Patient | Live voice consultation with AI avatar, transcript |
| `/status` | Patient | Consultation status, MC download, medicine recommendation |
| `/doctor/login` | Doctor | Simple PIN or password login |
| `/doctor/dashboard` | Doctor | Case queue (pending / approved / escalated) |
| `/doctor/case/:id` | Doctor | Full consultation summary, approve / escalate / modify |

---

*Document version: v1.0 — Agora Hackathon Singapore 2026, April 10, 2026*
