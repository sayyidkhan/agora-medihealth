import json
import os
import uuid
import time
from datetime import datetime
from typing import Optional, List
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
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

ELEVENLABS_TTS_MODEL = os.getenv("ELEVENLABS_MODEL_ID", "eleven_flash_v2_5")
TTS_PREVIEW_MAX_CHARS = 800
# Landing-page previews: explicit MP3 format decodes reliably in Web Audio; CJK needs language + multilingual model.
ELEVENLABS_PREVIEW_OUTPUT_FORMAT = os.getenv("ELEVENLABS_PREVIEW_OUTPUT_FORMAT", "mp3_44100_128")
ELEVENLABS_PREVIEW_I18N_MODEL = os.getenv("ELEVENLABS_PREVIEW_I18N_MODEL", "eleven_multilingual_v2")


def resolve_elevenlabs_voice_id(voice_type: Optional[str]) -> str:
    """Map UI voice_type (Landing / Consult) to configured ElevenLabs voice_id."""
    key = (voice_type or "female").strip()
    if key in VOICE_IDS:
        return VOICE_IDS[key]
    if key.startswith("spicy_"):
        gender = key.replace("spicy_", "", 1)
        mapped = f"premium_{gender}"
        return VOICE_IDS.get(mapped, VOICE_IDS["premium_female"])
    for prefix in ("zh_", "ms_", "ta_"):
        if key.startswith(prefix):
            gender = key[len(prefix) :]
            return VOICE_IDS.get(gender, VOICE_IDS["female"])
    return VOICE_IDS["female"]


def tts_preview_language_code(voice_type: str) -> Optional[str]:
    """ISO 639-1 code for ElevenLabs (enforces script/language for zh / ms / ta previews)."""
    key = (voice_type or "").strip()
    if key.startswith("zh_"):
        return "zh"
    if key.startswith("ms_"):
        return "ms"
    if key.startswith("ta_"):
        return "ta"
    return None


def asr_language_from_symptom_locale(locale: Optional[str]) -> str:
    """BCP-47 language for Agora Convo AI ASR (align with patient dictation locale from the app)."""
    if not locale or not str(locale).strip():
        return "en-US"
    loc = str(locale).strip().replace("_", "-")
    low = loc.lower()
    if low.startswith("zh"):
        return "zh-CN"
    if low.startswith("ms"):
        return "ms-MY"
    if low.startswith("ta"):
        return "ta-IN"
    if low == "en-gb":
        return "en-GB"
    return "en-US"


CLINICAL_SYSTEM_PROMPT = """You are MediVoice, a compassionate and professional AI medical assistant conducting a clinical interview.
Your role is to collect symptom information to help a licensed doctor make an informed decision about the patient's care.

IMPORTANT RULES:
1. You are NOT a doctor and cannot diagnose or prescribe. Always clarify this warmly.
2. Anchor everything to what the patient actually said — especially anything they typed before the call. Do not ignore their initial complaint or give a generic interview.
3. Your first spoken turn (after greeting) must: (a) reflect their specific concern in your own words so they feel heard, (b) offer brief, sensible general guidance tied to that concern — e.g. rest, fluids, simple self-care, what symptoms would mean they should seek urgent care — framed as general information, not a diagnosis, (c) then ask ONE clear follow-up question.
4. Conduct a structured interview — after that first turn, ask ONE question at a time and wait for the response.
5. Keep questions concise and use plain language (not medical jargon).
6. Be warm, calm, and reassuring throughout.
7. RED FLAGS — if the patient mentions any of the following, IMMEDIATELY stop the interview, advise them to call 995 or go to A&E, and end the session:
   - Chest pain or tightness
   - Difficulty breathing or shortness of breath
   - Sudden severe headache ("worst headache of my life")
   - Stroke symptoms (face drooping, arm weakness, speech difficulty)
   - Suicidal thoughts or self-harm
   - High fever (>39°C) in a child under 2 years old
   - Unresponsiveness or altered consciousness
8. After collecting all necessary information, summarize the consultation clearly and tell the patient their case is being sent to a doctor for review.

INTERVIEW STRUCTURE (follow this order; skip steps already answered):
1. Greet the patient by name; address their stated complaint with tailored general guidance + one focused question (see rule 3).
2. Chief complaint — confirm and expand only if not already clear from their initial message.
3. Duration (how long have they had this?)
4. Severity (1-10 scale) where relevant
5. Associated symptoms (fever, cough, runny nose, vomiting, diarrhoea, rash, etc.)
6. Any known allergies
7. Current medications
8. Thermometer reading if fever suspected
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
    symptom_input_locale: Optional[str] = None
    symptom_input_language: Optional[str] = None


class AgentStopRequest(BaseModel):
    agent_id: str
    channel: str


class TtsPreviewRequest(BaseModel):
    voice_type: str = "female"
    text: str


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
    voice_type: Optional[str] = None
    symptom_input_locale: Optional[str] = None
    symptom_input_language: Optional[str] = None
    patient_id: Optional[str] = None  # demo login user id (localStorage)


class ApproveRequest(BaseModel):
    mc_duration_days: int
    doctor_notes: str = ""
    medicine_recommendations: List[str] = []


def _format_agora_convo_join_error(resp: httpx.Response) -> str:
    """Turn Agora Conversational AI /join failures into actionable text for developers."""
    raw = (resp.text or "").strip()
    try:
        body = resp.json()
    except Exception:
        return raw or f"Agora Conversational AI error (HTTP {resp.status_code})."

    reason = body.get("reason") or ""
    detail = body.get("detail")
    if isinstance(detail, (dict, list)):
        detail_s = json.dumps(detail)
    else:
        detail_s = str(detail or "").strip()

    lines = []
    low = (detail_s + " " + str(reason)).lower()
    if "edge failed" in low or "request failed" in low:
        lines.append(
            "Agora started the request but failed on their edge (often bad LLM/TTS BYOK payload or provider keys).\n\n"
            "Checklist:\n"
            "• OPENAI_API_KEY and ELEVENLABS_API_KEY must be valid in .env (restart backend after changes).\n"
            "• ElevenLabs often needs a paid plan for Convo AI TTS; free tier can be blocked.\n"
            "• LLM config must follow Agora docs: model under llm.params; ElevenLabs uses params.key not api_key.\n"
        )
    if "appid" in low or ("allocate" in low and "edge failed" not in low):
        lines.append(
            "Agora Conversational AI could not allocate an agent for this App ID.\n\n"
            "Checklist:\n"
            "• AGORA_APP_ID must be the exact App ID from the same Agora project (Console → Project Management).\n"
            "• Conversational AI must be enabled for that project (Console → products / Conversational AI).\n"
            "• AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET are the RESTful API key pair "
            "(Console → Account → RESTful API — not the App Certificate).\n"
            "• Optional: try AGORA_CONVO_AI_BASE_URL for your region if Agora docs specify a regional host.\n"
        )
    if reason == "InvalidRequest" and not lines:
        lines.append(
            "InvalidRequest from Agora — see Agora message below. Common causes: wrong join JSON schema, "
            "or OpenAI/ElevenLabs rejected the call from Agora servers."
        )
    if detail_s:
        lines.append(f"Agora message: {detail_s}")
    if reason:
        lines.append(f"Reason: {reason}")
    return "\n".join(lines) if lines else (raw or f"HTTP {resp.status_code}")


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    db_ok = await cb_ping()
    return {
        "status": "ok",
        "service": "MediVoice API",
        "database": "couchbase:connected" if db_ok else "couchbase:unavailable (using in-memory fallback)",
        "in_memory_records": len(consultations_store),
        "agora_rtc_configured": bool(AGORA_APP_ID and AGORA_APP_CERTIFICATE),
        "agora_convo_api_configured": bool(AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET),
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


@app.post("/tts/preview")
async def tts_preview(req: TtsPreviewRequest):
    """Stream a short ElevenLabs clip for the landing-page doctor voice previews (same IDs as Convo AI)."""
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="ELEVENLABS_API_KEY is not configured. Add it to .env and restart the backend.",
        )
    text = (req.text or "").strip()
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    if len(text) > TTS_PREVIEW_MAX_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"text must be at most {TTS_PREVIEW_MAX_CHARS} characters",
        )
    voice_id = resolve_elevenlabs_voice_id(req.voice_type)
    lang_code = tts_preview_language_code(req.voice_type)
    # Flash matches Agora live agent for en; multilingual + language_code fixes silent/broken CJK previews.
    model_id = ELEVENLABS_PREVIEW_I18N_MODEL if lang_code else ELEVENLABS_TTS_MODEL
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
    payload: dict = {"text": text, "model_id": model_id}
    if lang_code:
        payload["language_code"] = lang_code
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                url,
                params={"output_format": ELEVENLABS_PREVIEW_OUTPUT_FORMAT},
                headers={
                    "xi-api-key": ELEVENLABS_API_KEY,
                    "Accept": "audio/mpeg",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not reach ElevenLabs: {exc}",
        ) from exc
    if resp.status_code != 200:
        raise HTTPException(
            status_code=502,
            detail=(resp.text or "")[:500] or f"ElevenLabs HTTP {resp.status_code}",
        )
    if not resp.content or len(resp.content) < 64:
        raise HTTPException(
            status_code=502,
            detail="ElevenLabs returned empty audio — check voice_id, quota, and model access.",
        )
    return Response(content=resp.content, media_type="audio/mpeg")


@app.post("/agent/start")
async def start_agent(req: AgentStartRequest):
    if not AGORA_APP_ID or not AGORA_APP_CERTIFICATE:
        raise HTTPException(status_code=500, detail="Agora credentials not configured")
    if not AGORA_CUSTOMER_ID or not AGORA_CUSTOMER_SECRET:
        raise HTTPException(
            status_code=500,
            detail="AGORA_CUSTOMER_ID and AGORA_CUSTOMER_SECRET are required for Conversational AI "
            "(Agora Console → RESTful API — Customer ID + Customer secret).",
        )
    if not OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY is not set. Agora's agent needs it for the LLM (BYOK).",
        )
    if not ELEVENLABS_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="ELEVENLABS_API_KEY is not set. Agora's agent needs it for TTS (BYOK).",
        )

    voice_id = resolve_elevenlabs_voice_id(req.voice_type)

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
        system_prompt += (
            f'\n\nPatient pre-submitted complaint (treat this as their opening request — respond to it directly): "{req.pre_prompt}". '
            "Open the voice session by greeting them, mirroring this concern, giving brief relevant general advice (no diagnosis or prescription), then your first interview question."
        )
    if req.symptom_input_locale or req.symptom_input_language:
        loc = req.symptom_input_language or req.symptom_input_locale or ""
        system_prompt += (
            f"\n\nThe patient typed or dictated that complaint primarily in: {loc}. "
            "Interpret wording and idioms in that language context when helpful; respond in clear English unless the patient switches language."
        )

    # Unique agent name to avoid 409 collisions
    agent_name = f"mv-{uuid.uuid4().hex[:8]}"

    asr_lang = asr_language_from_symptom_locale(req.symptom_input_locale)
    payload = {
        "name": agent_name,
        "properties": {
            "channel": req.channel,
            "token": agent_token,
            "agent_rtc_uid": "0",
            # Convo AI currently allows only one subscriber UID (not "*"). Must match the patient RTC uid.
            "remote_rtc_uids": [str(req.uid)],
            "enable_string_uid": False,
            "idle_timeout": 180,
            "asr": {"language": asr_lang},
            # OpenAI BYOK: model / max_tokens / temperature belong under params (Agora Convo AI schema).
            "llm": {
                "url": "https://api.openai.com/v1/chat/completions",
                "api_key": OPENAI_API_KEY,
                "system_messages": [{"role": "system", "content": system_prompt}],
                # Without greeting_message the agent often waits forever for speech; patient hears nothing first.
                "greeting_message": (
                    "Hello {{user_name}}, this is MediVoice. I've read what you shared about your symptoms. "
                    "Let's talk it through — please tell me in your own words how you're feeling right now."
                ),
                "greeting_configs": {"mode": "single_first"},
                "template_variables": {"user_name": req.patient_name or "there"},
                "failure_message": "I'm sorry, I'm having a technical issue. Please end the call and try again.",
                "max_history": 32,
                "params": {
                    "model": "gpt-4o",
                    "max_tokens": 1024,
                    "temperature": 0.7,
                },
            },
            # ElevenLabs: Conversational AI expects params.key (not api_key). See Agora ElevenLabs TTS docs.
            "tts": {
                "vendor": "elevenlabs",
                "params": {
                    "key": ELEVENLABS_API_KEY,
                    "voice_id": voice_id,
                    "model_id": ELEVENLABS_TTS_MODEL,
                    "sample_rate": 24000,
                },
            },
            # Prefer current turn_detection over deprecated top-level vad (fixes stuck / no-response turns).
            "turn_detection": {
                "mode": "default",
                "config": {
                    "speech_threshold": 0.35,
                    "start_of_speech": {
                        "mode": "vad",
                        "vad_config": {
                            "interrupt_duration_ms": 200,
                            "speaking_interrupt_duration_ms": 240,
                            "prefix_padding_ms": 600,
                        },
                    },
                    "end_of_speech": {
                        "mode": "vad",
                        "vad_config": {"silence_duration_ms": 720},
                    },
                },
            },
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
                raise HTTPException(
                    status_code=502,
                    detail=_format_agora_convo_join_error(resp),
                )
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
        "patient_id": req.patient_id,
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
        "voice_type": req.voice_type,
        "symptom_input_locale": req.symptom_input_locale,
        "symptom_input_language": req.symptom_input_language,
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


@app.get("/patient/consultations")
async def list_patient_consultations(patient_id: str):
    """All consultations for a demo patient id (from dummy login). Not for production."""
    if not patient_id or not patient_id.strip():
        raise HTTPException(status_code=400, detail="patient_id required")
    pid = patient_id.strip()
    docs = await cb_get_all()
    mine = [d for d in docs if d.get("patient_id") == pid]
    return sorted(mine, key=lambda x: x.get("created_at", ""), reverse=True)


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
