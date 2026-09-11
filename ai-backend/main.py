import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from routes.incidents import router as incidents_router
from routes.sms import router as sms_router
from services.gemini_service import gemini_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Disaster Resource Allocation & AI Fallback API",
    description="Backend microservice for disaster incident triage, deterministic resource allocation, dispatch briefs, audit logging, and multi-provider AI fallback (Groq -> Gemini -> NVIDIA NIM).",
    version="1.2.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(incidents_router)
app.include_router(sms_router)


class PromptRequest(BaseModel):
    prompt: str


@app.post("/generate")
async def generate_text(request: PromptRequest):
    """
    Multi-provider AI text generation fallback:
    Attempt 1: Groq (llama-3.3-70b-versatile)
    Attempt 2: Gemini (gemini-2.0-flash)
    Attempt 3: NVIDIA NIM (meta/llama-3.1-70b-instruct)
    """
    try:
        result = gemini_service.generate_text_fallback(request.prompt)
        return result
    except RuntimeError as e:
        logger.error(f"All AI providers failed: {e}")
        raise HTTPException(
            status_code=500,
            detail="All AI providers are currently down. Please try again later."
        )


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Disaster Resource Allocation & AI Fallback Backend"}
