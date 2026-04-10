import os
import uuid
import time
from datetime import datetime
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import httpx
from agora_token_builder import RtcTokenBuilder

RTC_ROLE_PUBLISHER = 1

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '..', '.env'))

app = FastAPI(title="MediVoice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGORA_APP_ID = os.getenv("AGORA_APP_ID")
AGORA_APP_CERTIFICATE = os.getenv("AGORA_APP_CERTIFICATE")
AGORA_CONVO_AI_BASE_URL = os.getenv("AGORA_CONVO_AI_BASE_URL", "https://api.agora.io")
AGORA_CUSTOMER_ID = os.getenv("AGORA_CUSTOMER_ID")
AGORA_CUSTOMER_SECRET = os.getenv("AGORA_CUSTOMER_SECRET")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
COUCHBASE_CONNECTION_STRING = os.getenv("COUCHBASE_CONNECTION_STRING")
COUCHBASE_USERNAME = os.getenv("COUCHBASE_USERNAME")
COUCHBASE_PASSWORD = os.getenv("COUCHBASE_PASSWORD")
COUCHBASE_BUCKET = os.getenv("COUCHBASE_BUCKET", "medivoice")

VOICE_IDS = {
    "male": os.getenv("ELEVENLABS_VOICE_ID_MALE", "pNInz6obpgDQGcFmaJgB"),
    "female": os.getenv("ELEVENLABS_VOICE_ID_FEMALE", "21m00Tcm4TlvDq8ikWAM"),
    "premium_male": os.getenv("ELEVENLABS_VOICE_ID_PREMIUM_MALE", "onwK4e9ZLuTAKqWW03F9"),
    "premium_female": os.getenv("ELEVENLABS_VOICE_ID_PREMIUM_FEMALE", "pMsXgVXv3BLzUgSXRplE"),
}

CLINICAL_SYSTEM_PROMPT = """You are MediVoice, a compassionate and professional AI medical assistant conducting a clinical interview.
Your role is to collect symptom information to help a licensed doctor make an informed decision about the patient's care.

IMPORTANT RULES:
1. You are NOT a doctor and cannot diagnose or prescribe. Always clarify this warmly.
2. Conduct a structured interview — ask ONE question at a time and wait for the response.
3. Keep questions concise and use plain language (not medical jargon).
4. Be warm, calm, and reassuring throughout.
5. RED FLAGS — if the patient mentions any of the following, IMMEDIATELY stop the interview, advise them to call 995 or go to A&E, and end the session:
   - Chest pain or tightness
   - Difficulty breathing or shortness of breath
   - Sudden severe headache ("worst headache of my life")
   - Stroke symptoms (face drooping, arm weakness, speech difficulty)
   - Suicidal thoughts or self-harm
   - High fever (>39°C) in a child under 2 years old
   - Unresponsiveness or altered consciousness
6. After collecting all necessary information, summarize the consultation clearly and tell the patient their case is being sent to a doctor for review.

INTERVIEW STRUCTURE (follow this order):
1. Greet the patient by name and acknowledge their pre-submitted complaint
2. Ask about chief complaint (confirm and expand)
3. Ask about duration (how long have they had this?)
4. Ask about severity (1-10 scale)
5. Ask about associated symptoms (fever, cough, runny nose, vomiting, diarrhoea, rash, etc.)
6. Ask about any known allergies
7. Ask about current medications
8. Ask if they have a thermometer reading (if fever suspected)
9. Summarize findings and close the consultation warmly

CLOSING: End with "Thank you for sharing that with me. I've summarized your consultation and it's being sent to our doctor for review. You'll be notified once they've made a decision. Please rest well and stay hydrated."
"""

# ─── In-memory store + Couchbase via REST API ────────────────────────────────

consultations_store: dict = {}
_cb_available: bool = False


def _cb_host():
    conn = COUCHBASE_CONNECTION_STRING or ""
    return conn.replace("couchbases://", "").replace("couchbase://", "")


def _cb_query_url():
    return f"https://{_cb_host()}:18093/query/service"


async def cb_ping() -> bool:
    """Check if Couchbase bucket is reachable."""
    if not COUCHBASE_USERNAME or not COUCHBASE_PASSWORD or not COUCHBASE_CONNECTION_STRING:
        return False
    try:
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(
                _cb_query_url(),
                json={"statement": f"SELECT 1 FROM `{COUCHBASE_BUCKET}` LIMIT 1"},
                auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
            )
            if resp.status_code == 200:
                body = resp.json()
                return body.get("status") == "success"
        return False
    except Exception:
        return False


async def cb_upsert(doc_id: str, doc: dict):
    """Write to Couchbase, always mirror to in-memory store."""
    consultations_store[doc_id] = doc
    try:
        import json as _json
        statement = f"UPSERT INTO `{COUCHBASE_BUCKET}` (KEY, VALUE) VALUES ($key, $val)"
        async with httpx.AsyncClient(verify=False, timeout=15.0) as client:
            resp = await client.post(
                _cb_query_url(),
                json={"statement": statement, "$key": doc_id, "$val": doc},
                auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
            )
    except Exception:
        pass


async def cb_get_all():
    """Fetch all consultations — prefer Couchbase, fall back to in-memory."""
    try:
        statement = (
            f"SELECT META().id as _id, `{COUCHBASE_BUCKET}`.* "
            f"FROM `{COUCHBASE_BUCKET}` "
            f"WHERE type='consultation' "
            f"ORDER BY created_at DESC"
        )
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(
                _cb_query_url(),
                json={"statement": statement},
                auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    return results
    except Exception:
        pass
    return sorted(consultations_store.values(), key=lambda x: x.get("created_at", ""), reverse=True)


async def cb_get(doc_id: str):
    """Fetch single doc — prefer Couchbase, fall back to in-memory."""
    try:
        statement = f"SELECT `{COUCHBASE_BUCKET}`.* FROM `{COUCHBASE_BUCKET}` USE KEYS $id"
        async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
            resp = await client.post(
                _cb_query_url(),
                json={"statement": statement, "args": [doc_id]},
                auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
            )
            if resp.status_code == 200:
                results = resp.json().get("results", [])
                if results:
                    return results[0]
    except Exception:
        pass
    return consultations_store.get(doc_id)


async def cb_update(doc_id: str, updates: dict):
    doc = await cb_get(doc_id)
    if not doc:
        return None
    doc.update(updates)
    await cb_upsert(doc_id, doc)
    return doc


# ─── Models ──────────────────────────────────────────────────────────────────

class TokenRequest(BaseModel):
    channel: str
    uid: int = 0


class AgentStartRequest(BaseModel):
    channel: str
    uid: int
    patient_name: str
    pre_prompt: str
    doctor_type: str = "General Practitioner"
    voice_type: str = "female"


class AgentStopRequest(BaseModel):
    agent_id: str
    channel: str


class ConsultationCreate(BaseModel):
    patient_name: str
    channel: str
    chief_complaint: str
    duration_days: Optional[int] = None
    severity: Optional[int] = None
    associated_symptoms: List[str] = []
    allergies: str = ""
    current_medications: str = ""
    ai_summary: str
    transcript: str
    doctor_type: str = "General Practitioner"


class ApproveRequest(BaseModel):
    mc_duration_days: int
    doctor_notes: str = ""
    medicine_recommendations: List[str] = []


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    db_ok = await cb_ping()
    return {
        "status": "ok",
        "service": "MediVoice API",
        "database": "couchbase:connected" if db_ok else "couchbase:unavailable (using in-memory fallback)",
        "in_memory_records": len(consultations_store),
    }


@app.post("/token")
def generate_token(req: TokenRequest):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(status_code=500, detail="Agora credentials not configured")
    expire_time = int(time.time()) + 3600
    token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        req.channel,
        req.uid,
        RTC_ROLE_PUBLISHER,
        expire_time,
    )
    return {"token": token, "channel": req.channel, "uid": req.uid, "app_id": AGORA_APP_ID}


@app.post("/agent/start")
async def start_agent(req: AgentStartRequest):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(status_code=500, detail="Agora credentials not configured")

    voice_id = VOICE_IDS.get(req.voice_type, VOICE_IDS["female"])

    # Token for agent (auto-assigned UID using "0")
    expire_time = int(time.time()) + 3600
    agent_token = RtcTokenBuilder.buildTokenWithUid(
        AGORA_APP_ID,
        AGORA_APP_CERTIFICATE,
        req.channel,
        0,
        RTC_ROLE_PUBLISHER,
        expire_time,
    )

    system_prompt = CLINICAL_SYSTEM_PROMPT.replace(
        "Greet the patient by name", f"Greet the patient as {req.patient_name}"
    )
    if req.pre_prompt:
        system_prompt += f"\n\nPatient pre-submitted complaint: \"{req.pre_prompt}\". Start by acknowledging this."

    # Unique agent name to avoid 409 collisions
    agent_name = f"mv-{uuid.uuid4().hex[:8]}"

    payload = {
        "name": agent_name,
        "properties": {
            "channel": req.channel,
            "token": agent_token,
            "agent_rtc_uid": "0",
            "remote_rtc_uids": ["*"],
            "enable_string_uid": False,
            "idle_timeout": 30,
            "asr": {"language": "en-US"},
            "llm": {
                "url": "https://api.openai.com/v1/chat/completions",
                "api_key": OPENAI_API_KEY,
                "model": "gpt-4o",
                "system_messages": [{"role": "system", "content": system_prompt}],
                "max_tokens": 1024,
                "temperature": 0.7,
            },
            "tts": {
                "vendor": "elevenlabs",
                "params": {
                    "api_key": ELEVENLABS_API_KEY,
                    "voice_id": voice_id,
                    "model_id": "eleven_turbo_v2",
                },
            },
            "vad": {"silence_duration_ms": 480, "speech_duration_ms": 15},
        },
    }

    # Build auth header — use Basic Auth with Customer ID + Secret
    import base64
    creds = base64.b64encode(f"{AGORA_CUSTOMER_ID}:{AGORA_CUSTOMER_SECRET}".encode()).decode()
    auth_header = f"Basic {creds}"

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{AGORA_CONVO_AI_BASE_URL}/api/conversational-ai-agent/v2/projects/{AGORA_APP_ID}/join",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": auth_header,
                },
            )
            if resp.status_code not in (200, 201):
                raise HTTPException(status_code=resp.status_code, detail=resp.text)
            data = resp.json()
            data["_agent_name"] = agent_name
            return data
    except httpx.RequestError as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/agent/stop")
async def stop_agent(req: AgentStopRequest):
    import base64
    creds = base64.b64encode(f"{AGORA_CUSTOMER_ID}:{AGORA_CUSTOMER_SECRET}".encode()).decode()
    auth_header = f"Basic {creds}"
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            await client.post(
                f"{AGORA_CONVO_AI_BASE_URL}/api/conversational-ai-agent/v2/projects/{AGORA_APP_ID}/agents/{req.agent_id}/leave",
                headers={"Authorization": auth_header},
            )
    except Exception:
        pass
    return {"status": "stopped", "agent_id": req.agent_id}


@app.post("/consultation")
async def create_consultation(req: ConsultationCreate):
    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "type": "consultation",
        "patient_name": req.patient_name,
        "channel": req.channel,
        "status": "pending",
        "chief_complaint": req.chief_complaint,
        "duration_days": req.duration_days,
        "severity": req.severity,
        "associated_symptoms": req.associated_symptoms,
        "allergies": req.allergies,
        "current_medications": req.current_medications,
        "ai_summary": req.ai_summary,
        "transcript": req.transcript,
        "doctor_type": req.doctor_type,
        "mc_duration_days": None,
        "doctor_notes": None,
        "medicine_recommendations": [],
        "approved_at": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    await cb_upsert(doc_id, doc)
    return doc


@app.get("/consultations")
async def list_consultations():
    docs = await cb_get_all()
    return sorted(docs, key=lambda x: x.get("created_at", ""), reverse=True)


@app.get("/consultation/{consultation_id}")
async def get_consultation(consultation_id: str):
    doc = await cb_get(consultation_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return doc


@app.patch("/consultation/{consultation_id}/approve")
async def approve_consultation(consultation_id: str, req: ApproveRequest):
    doc = await cb_update(consultation_id, {
        "status": "approved",
        "mc_duration_days": req.mc_duration_days,
        "doctor_notes": req.doctor_notes,
        "medicine_recommendations": req.medicine_recommendations,
        "approved_at": datetime.utcnow().isoformat(),
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return doc


@app.patch("/consultation/{consultation_id}/escalate")
async def escalate_consultation(consultation_id: str):
    doc = await cb_update(consultation_id, {
        "status": "escalated",
        "approved_at": datetime.utcnow().isoformat(),
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Consultation not found")
    return doc


@app.get("/consultation/{consultation_id}/mc.pdf")
async def download_mc(consultation_id: str):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.units import cm
    from reportlab.lib import colors
    import io

    doc = await cb_get(consultation_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Consultation not found")
    if doc.get("status") != "approved":
        raise HTTPException(status_code=400, detail="MC not yet approved")

    buffer = io.BytesIO()
    pdf = SimpleDocTemplate(buffer, pagesize=A4, topMargin=2*cm, bottomMargin=2*cm)
    styles = getSampleStyleSheet()
    story = []

    story.append(Paragraph("<b>MEDIVOICE TELEMEDICINE</b>", styles["Title"]))
    story.append(Paragraph("Medical Certificate", styles["h2"]))
    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Spacer(1, 0.5*cm))

    approved_at = doc.get("approved_at", datetime.utcnow().isoformat())[:10]
    story.append(Paragraph(f"<b>Date:</b> {approved_at}", styles["Normal"]))
    story.append(Paragraph(f"<b>Patient Name:</b> {doc.get('patient_name', 'N/A')}", styles["Normal"]))
    story.append(Paragraph(f"<b>Diagnosis:</b> {doc.get('chief_complaint', 'N/A')}", styles["Normal"]))
    story.append(Paragraph(f"<b>MC Duration:</b> {doc.get('mc_duration_days', 1)} day(s)", styles["Normal"]))
    story.append(Spacer(1, 0.5*cm))

    if doc.get("doctor_notes"):
        story.append(Paragraph(f"<b>Doctor Notes:</b> {doc.get('doctor_notes')}", styles["Normal"]))
        story.append(Spacer(1, 0.5*cm))

    if doc.get("medicine_recommendations"):
        story.append(Paragraph("<b>Medication Recommendations:</b>", styles["Normal"]))
        for med in doc.get("medicine_recommendations", []):
            story.append(Paragraph(f"• {med}", styles["Normal"]))
        story.append(Spacer(1, 0.5*cm))

    story.append(HRFlowable(width="100%", thickness=1, color=colors.grey))
    story.append(Spacer(1, 0.3*cm))
    story.append(Paragraph("<i>This certificate is issued by a licensed physician via MediVoice Telemedicine Platform.</i>", styles["Normal"]))
    story.append(Paragraph("<i>For emergencies, call 995 or visit your nearest A&E.</i>", styles["Normal"]))

    pdf.build(story)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="MC_{consultation_id[:8]}.pdf"'},
    )
