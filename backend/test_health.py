"""
Health check tests for all external API providers used by MediVoice.

Providers tested:
  - Agora  (token generation + Conversational AI REST API)
  - OpenAI (models endpoint)
  - ElevenLabs (voices endpoint)
  - Couchbase (N1QL ping)

Run with:
    pytest test_health.py -v
"""

import os
import base64
import time

import httpx
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from agora_token_builder import RtcTokenBuilder

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

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

RTC_ROLE_PUBLISHER = 1


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _agora_basic_auth() -> str:
    creds = base64.b64encode(f"{AGORA_CUSTOMER_ID}:{AGORA_CUSTOMER_SECRET}".encode()).decode()
    return f"Basic {creds}"


def _cb_host() -> str:
    conn = COUCHBASE_CONNECTION_STRING or ""
    return conn.replace("couchbases://", "").replace("couchbase://", "")


def _cb_query_url() -> str:
    return f"https://{_cb_host()}:18093/query/service"


# ─── Agora ────────────────────────────────────────────────────────────────────

class TestAgoraHealth:
    """Tests for Agora credentials and reachability."""

    def test_agora_env_vars_present(self):
        """All required Agora env vars must be set."""
        missing = [
            name for name, val in {
                "AGORA_APP_ID": AGORA_APP_ID,
                "AGORA_APP_CERTIFICATE": AGORA_APP_CERTIFICATE,
                "AGORA_CUSTOMER_ID": AGORA_CUSTOMER_ID,
                "AGORA_CUSTOMER_SECRET": AGORA_CUSTOMER_SECRET,
            }.items()
            if not val
        ]
        assert not missing, f"Missing Agora env vars: {missing}"

    def test_agora_token_generation(self):
        """RtcTokenBuilder must produce a non-empty token string."""
        pytest.importorskip("agora_token_builder")
        expire_time = int(time.time()) + 3600
        token = RtcTokenBuilder.buildTokenWithUid(
            AGORA_APP_ID,
            AGORA_APP_CERTIFICATE,
            "health-check-channel",
            0,
            RTC_ROLE_PUBLISHER,
            expire_time,
        )
        assert isinstance(token, str) and len(token) > 0, "Token must be a non-empty string"

    @pytest.mark.asyncio
    async def test_agora_convo_ai_reachable(self):
        """
        Agora Conversational AI REST endpoint must respond (auth is validated,
        so a 401/403 still means the service is up; only network errors fail).
        """
        url = f"{AGORA_CONVO_AI_BASE_URL}/api/conversational-ai-agent/v2/projects/{AGORA_APP_ID}/join"
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.post(
                    url,
                    json={},
                    headers={
                        "Content-Type": "application/json",
                        "Authorization": _agora_basic_auth(),
                    },
                )
                # Any HTTP response (even 4xx) means the API is reachable
                assert resp.status_code < 500, (
                    f"Agora Convo AI returned server error {resp.status_code}: {resp.text}"
                )
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach Agora Convo AI endpoint: {exc}")


# ─── OpenAI ───────────────────────────────────────────────────────────────────

class TestOpenAIHealth:
    """Tests for OpenAI API reachability and key validity."""

    def test_openai_api_key_present(self):
        """OPENAI_API_KEY must be set."""
        assert OPENAI_API_KEY, "OPENAI_API_KEY is not set"

    @pytest.mark.asyncio
    async def test_openai_models_endpoint(self):
        """GET /v1/models must return 200 with a valid key."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(
                    "https://api.openai.com/v1/models",
                    headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
                )
                assert resp.status_code == 200, (
                    f"OpenAI /v1/models returned {resp.status_code}: {resp.text}"
                )
                data = resp.json()
                assert "data" in data, "Unexpected response shape from OpenAI /v1/models"
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach OpenAI API: {exc}")

    @pytest.mark.asyncio
    async def test_openai_gpt4o_available(self):
        """gpt-4o model must appear in the available models list."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}"},
            )
            if resp.status_code != 200:
                pytest.skip(f"Skipping model check — /v1/models returned {resp.status_code}")
            model_ids = [m["id"] for m in resp.json().get("data", [])]
            assert any("gpt-4o" in mid for mid in model_ids), (
                "gpt-4o is not available for this API key"
            )


# ─── ElevenLabs ───────────────────────────────────────────────────────────────

class TestElevenLabsHealth:
    """Tests for ElevenLabs TTS API reachability and key validity."""

    def test_elevenlabs_api_key_present(self):
        """ELEVENLABS_API_KEY must be set."""
        assert ELEVENLABS_API_KEY, "ELEVENLABS_API_KEY is not set"

    @pytest.mark.asyncio
    async def test_elevenlabs_voices_endpoint(self):
        """GET /v1/voices must return 200 with a valid key."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(
                    "https://api.elevenlabs.io/v1/voices",
                    headers={"xi-api-key": ELEVENLABS_API_KEY},
                )
                assert resp.status_code == 200, (
                    f"ElevenLabs /v1/voices returned {resp.status_code}: {resp.text}"
                )
                data = resp.json()
                assert "voices" in data, "Unexpected response shape from ElevenLabs /v1/voices"
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach ElevenLabs API: {exc}")

    @pytest.mark.asyncio
    async def test_elevenlabs_configured_voices_exist(self):
        """All voice IDs configured in env vars must be resolvable via ElevenLabs API.

        /v1/voices only lists account-owned voices.  Shared and pre-built library
        voices are resolved individually via GET /v1/voices/{voice_id}, which works
        for both owned and library voices.
        """
        configured_voice_ids = {
            k: v for k, v in {
                "ELEVENLABS_VOICE_ID_MALE": os.getenv("ELEVENLABS_VOICE_ID_MALE"),
                "ELEVENLABS_VOICE_ID_FEMALE": os.getenv("ELEVENLABS_VOICE_ID_FEMALE"),
                "ELEVENLABS_VOICE_ID_PREMIUM_MALE": os.getenv("ELEVENLABS_VOICE_ID_PREMIUM_MALE"),
                "ELEVENLABS_VOICE_ID_PREMIUM_FEMALE": os.getenv("ELEVENLABS_VOICE_ID_PREMIUM_FEMALE"),
            }.items()
            if v
        }

        missing = {}
        async with httpx.AsyncClient(timeout=15.0) as client:
            for env_key, voice_id in configured_voice_ids.items():
                try:
                    resp = await client.get(
                        f"https://api.elevenlabs.io/v1/voices/{voice_id}",
                        headers={"xi-api-key": ELEVENLABS_API_KEY},
                    )
                    if resp.status_code != 200:
                        missing[env_key] = voice_id
                except httpx.RequestError as exc:
                    pytest.fail(f"Could not reach ElevenLabs API while checking {env_key}: {exc}")

        assert not missing, (
            f"These voice IDs could not be resolved via ElevenLabs API: {missing}"
        )

    @pytest.mark.asyncio
    async def test_elevenlabs_user_quota(self):
        """GET /v1/user must confirm the account is active and has remaining characters."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                resp = await client.get(
                    "https://api.elevenlabs.io/v1/user",
                    headers={"xi-api-key": ELEVENLABS_API_KEY},
                )
                assert resp.status_code == 200, (
                    f"ElevenLabs /v1/user returned {resp.status_code}: {resp.text}"
                )
                subscription = resp.json().get("subscription", {})
                used = subscription.get("character_count", 0)
                limit = subscription.get("character_limit", 0)
                remaining = limit - used
                assert remaining > 0, (
                    f"ElevenLabs character quota exhausted — used {used}/{limit}"
                )
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach ElevenLabs API: {exc}")


# ─── Couchbase ────────────────────────────────────────────────────────────────

class TestCouchbaseHealth:
    """Tests for Couchbase Capella connectivity."""

    def test_couchbase_env_vars_present(self):
        """All required Couchbase env vars must be set."""
        missing = [
            name for name, val in {
                "COUCHBASE_CONNECTION_STRING": COUCHBASE_CONNECTION_STRING,
                "COUCHBASE_USERNAME": COUCHBASE_USERNAME,
                "COUCHBASE_PASSWORD": COUCHBASE_PASSWORD,
            }.items()
            if not val
        ]
        assert not missing, f"Missing Couchbase env vars: {missing}"

    @pytest.mark.asyncio
    async def test_couchbase_query_service_reachable(self):
        """N1QL query service must be reachable and return a valid response."""
        async with httpx.AsyncClient(verify=False, timeout=20.0) as client:
            try:
                resp = await client.post(
                    _cb_query_url(),
                    json={"statement": f"SELECT 1 AS ping FROM `{COUCHBASE_BUCKET}` LIMIT 1"},
                    auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
                )
                assert resp.status_code == 200, (
                    f"Couchbase query service returned {resp.status_code}: {resp.text}"
                )
                body = resp.json()
                assert body.get("status") == "success", (
                    f"Couchbase N1QL status was not 'success': {body}"
                )
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach Couchbase query service: {exc}")

    @pytest.mark.asyncio
    async def test_couchbase_bucket_accessible(self):
        """The configured bucket must be queryable."""
        async with httpx.AsyncClient(verify=False, timeout=20.0) as client:
            try:
                resp = await client.post(
                    _cb_query_url(),
                    json={
                        "statement": (
                            f"SELECT META().id FROM `{COUCHBASE_BUCKET}` "
                            f"WHERE type='consultation' LIMIT 1"
                        )
                    },
                    auth=(COUCHBASE_USERNAME, COUCHBASE_PASSWORD),
                )
                assert resp.status_code == 200, (
                    f"Bucket query returned {resp.status_code}: {resp.text}"
                )
                body = resp.json()
                assert body.get("status") == "success", (
                    f"Bucket '{COUCHBASE_BUCKET}' query failed: {body}"
                )
            except httpx.RequestError as exc:
                pytest.fail(f"Could not reach Couchbase for bucket check: {exc}")


# ─── Local backend ────────────────────────────────────────────────────────────

class TestLocalBackendHealth:
    """
    Smoke test: verifies the local FastAPI server's /health endpoint.
    Requires the backend to be running on localhost:8000.
    Skip gracefully if not running.
    """

    BASE_URL = "http://localhost:8000"

    @pytest.mark.asyncio
    async def test_local_health_endpoint(self):
        """GET /health must return 200 with status 'ok'."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/health")
            except httpx.RequestError:
                pytest.skip("Local backend is not running — start it with: uvicorn main:app --reload")
            assert resp.status_code == 200, f"/health returned {resp.status_code}"
            body = resp.json()
            assert body.get("status") == "ok", f"Unexpected /health body: {body}"

    @pytest.mark.asyncio
    async def test_local_token_endpoint(self):
        """POST /token must return a valid Agora token."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.post(
                    f"{self.BASE_URL}/token",
                    json={"channel": "health-check", "uid": 0},
                )
            except httpx.RequestError:
                pytest.skip("Local backend is not running")
            assert resp.status_code == 200, f"/token returned {resp.status_code}: {resp.text}"
            body = resp.json()
            assert "token" in body and body["token"], "No token in response"

    @pytest.mark.asyncio
    async def test_local_consultations_endpoint(self):
        """GET /consultations must return a list (empty is fine)."""
        async with httpx.AsyncClient(timeout=5.0) as client:
            try:
                resp = await client.get(f"{self.BASE_URL}/consultations")
            except httpx.RequestError:
                pytest.skip("Local backend is not running")
            assert resp.status_code == 200, f"/consultations returned {resp.status_code}"
            assert isinstance(resp.json(), list), "Expected a list from /consultations"
