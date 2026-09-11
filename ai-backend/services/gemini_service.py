import os
import json
import logging
from typing import Optional, Dict, Any
from dotenv import load_dotenv

from models import IncidentCreate, TriageAssessment

load_dotenv()
logger = logging.getLogger(__name__)

# Import SDKs gracefully
try:
    from groq import Groq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False


class GeminiService:
    """
    Multi-provider AI service supporting:
    - Attempt 1: Groq (llama-3.3-70b-versatile)
    - Attempt 2: Gemini (gemini-2.0-flash / gemini-2.5-flash)
    - Attempt 3: NVIDIA NIM (meta/llama-3.1-70b-instruct)
    - Attempt 4: Deterministic rule-based fallback
    """

    def __init__(self):
        # 1. Groq Client
        groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if GROQ_AVAILABLE and groq_key and groq_key != "your_groq_api_key_here":
            try:
                self.groq_client = Groq(api_key=groq_key)
                logger.info("Groq client initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Groq: {e}")

        # 2. Gemini Client
        gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_client = None
        if GENAI_AVAILABLE and gemini_key and gemini_key != "your_gemini_api_key_here":
            try:
                self.gemini_client = genai.Client(api_key=gemini_key)
                logger.info("Gemini client initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini: {e}")

        # 3. NVIDIA Client
        nvidia_key = os.getenv("NVIDIA_API_KEY")
        self.nvidia_client = None
        if OPENAI_AVAILABLE and nvidia_key and nvidia_key != "your_nvidia_api_key_here":
            try:
                self.nvidia_client = OpenAI(
                    api_key=nvidia_key,
                    base_url="https://integrate.api.nvidia.com/v1"
                )
                logger.info("NVIDIA NIM client initialized.")
            except Exception as e:
                logger.warning(f"Failed to initialize NVIDIA NIM: {e}")

    def generate_text_fallback(self, prompt: str) -> Dict[str, str]:
        """
        Executes cascading multi-provider text generation:
        Attempt 1: Groq -> Attempt 2: Gemini -> Attempt 3: NVIDIA NIM.
        """
        # --- ATTEMPT 1: GROQ ---
        if self.groq_client:
            try:
                logger.info("Attempting Groq...")
                response = self.groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile"
                )
                return {"provider": "groq", "response": response.choices[0].message.content}
            except Exception as e:
                logger.warning(f"Groq failed: {str(e)}")

        # --- ATTEMPT 2: GEMINI ---
        if self.gemini_client:
            try:
                logger.info("Attempting Gemini fallback...")
                response = self.gemini_client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt
                )
                return {"provider": "gemini", "response": response.text}
            except Exception as e:
                logger.warning(f"Gemini failed: {str(e)}")

        # --- ATTEMPT 3: NVIDIA NIM ---
        if self.nvidia_client:
            try:
                logger.info("Attempting NVIDIA fallback...")
                response = self.nvidia_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="meta/llama-3.1-70b-instruct"
                )
                return {"provider": "nvidia", "response": response.choices[0].message.content}
            except Exception as e:
                logger.error(f"NVIDIA failed: {str(e)}")

        raise RuntimeError("All AI providers are currently down. Please try again later.")

    def triage_incident(self, incident: IncidentCreate, is_duplicate: bool = False) -> TriageAssessment:
        """
        Triage with cascading AI fallback: Groq -> Gemini -> NVIDIA NIM -> Rule-based.
        """
        prompt = f"""
You are an emergency response triage coordinator. Analyze this disaster incident and return ONLY valid JSON:
Disaster Type: {incident.disaster_type}
Severity Rating (1-10): {incident.severity_scale}
Latitude: {incident.latitude}, Longitude: {incident.longitude}
Location: {incident.location}
Affected Count: {incident.affected_count}
Requested Resources: {json.dumps(incident.requested_resources)}
Description: {incident.description}
Is Duplicate: {is_duplicate}

Schema:
{{
  "calculated_priority": <int 1-100>,
  "urgency_level": "<Critical|High|Medium|Low>",
  "verified_needs": {{"food": <int>, "water": <int>, "medical": <int>, "rescue": <int>}},
  "is_duplicate": {str(is_duplicate).lower()},
  "reasoning": "<string>"
}}
"""
        # Attempt AI generation across providers
        for provider_call in [self._try_groq_triage, self._try_gemini_triage, self._try_nvidia_triage]:
            try:
                res = provider_call(prompt, is_duplicate)
                if res:
                    return res
            except Exception as e:
                logger.warning(f"Triage provider call failed: {e}")

        # Deterministic fallback
        return self._rule_based_triage(incident, is_duplicate=is_duplicate)

    def _try_groq_triage(self, prompt: str, is_duplicate: bool) -> Optional[TriageAssessment]:
        if not self.groq_client:
            return None
        logger.info("Attempting Groq for triage...")
        res = self.groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        data = json.loads(res.choices[0].message.content)
        data["is_duplicate"] = is_duplicate
        return TriageAssessment(**data)

    def _try_gemini_triage(self, prompt: str, is_duplicate: bool) -> Optional[TriageAssessment]:
        if not self.gemini_client:
            return None
        logger.info("Attempting Gemini for triage...")
        res = self.gemini_client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=TriageAssessment,
                temperature=0.1
            )
        )
        data = json.loads(res.text.strip())
        data["is_duplicate"] = is_duplicate
        return TriageAssessment(**data)

    def _try_nvidia_triage(self, prompt: str, is_duplicate: bool) -> Optional[TriageAssessment]:
        if not self.nvidia_client:
            return None
        logger.info("Attempting NVIDIA for triage...")
        res = self.nvidia_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="meta/llama-3.1-70b-instruct",
            response_format={"type": "json_object"}
        )
        data = json.loads(res.choices[0].message.content)
        data["is_duplicate"] = is_duplicate
        return TriageAssessment(**data)

    def generate_dispatch_brief(self, category: str, location: str, allocated: dict, shortfall: dict, priority: int) -> str:
        prompt = (
            f"You are a tactical emergency dispatch commander. Generate exactly one concise, actionable, "
            f"professional 1-sentence dispatch directive for first responders based on this deployment: "
            f"Disaster: {category}, Location: {location}, Priority: {priority}/100, "
            f"Allocated Resources: {allocated}, Shortfall: {shortfall}. "
            f"Do not include preamble or multiple sentences."
        )
        try:
            res = self.generate_text_fallback(prompt)
            brief = res.get("response", "").strip().replace("\n", " ")
            if brief:
                return brief
        except Exception:
            pass

        loc_str = location if location else "incident site"
        res_summary = ", ".join(f"{k}: {v}" for k, v in allocated.items() if v > 0) or "standby reconnaissance"
        return f"Deploy emergency units immediately to {loc_str} for {category} response with committed assets ({res_summary}) under Priority {priority} protocol."

    def _rule_based_triage(self, incident: IncidentCreate, is_duplicate: bool = False, fallback_reason: Optional[str] = None) -> TriageAssessment:
        base_score = incident.severity_scale * 7
        if incident.affected_count > 500:
            count_factor = 25
        elif incident.affected_count > 100:
            count_factor = 18
        elif incident.affected_count > 20:
            count_factor = 10
        else:
            count_factor = 5

        desc_lower = (incident.description + " " + incident.disaster_type).lower()
        critical_keywords = ["trapped", "collapse", "drowning", "casualt", "explosion", "fire", "bleed", "unconscious", "catastrophic"]
        keyword_bonus = 5 if any(kw in desc_lower for kw in critical_keywords) else 0

        calculated_priority = min(100, max(1, base_score + count_factor + keyword_bonus))
        if is_duplicate:
            calculated_priority = max(1, calculated_priority - 20)

        if calculated_priority >= 80 or incident.severity_scale >= 8:
            urgency_level = "Critical"
        elif calculated_priority >= 60 or incident.severity_scale >= 6:
            urgency_level = "High"
        elif calculated_priority >= 40 or incident.severity_scale >= 4:
            urgency_level = "Medium"
        else:
            urgency_level = "Low"

        standard_keys = ["food", "water", "medical", "rescue"]
        verified_needs = {}
        for key in standard_keys:
            requested = incident.requested_resources.get(key, 0)
            if requested > 0:
                verified_needs[key] = int(requested)
            else:
                if key == "medical" and urgency_level in ["Critical", "High"]:
                    verified_needs[key] = max(5, int(incident.affected_count * 0.2))
                elif key == "rescue" and urgency_level == "Critical":
                    verified_needs[key] = max(3, int(incident.affected_count * 0.1))
                elif key in ["food", "water"] and incident.affected_count > 0:
                    verified_needs[key] = max(10, incident.affected_count)
                else:
                    verified_needs[key] = 0

        reason = (
            f"Rule-based triage applied: Severity {incident.severity_scale}/10, "
            f"Affected: {incident.affected_count}, Priority: {calculated_priority}/100."
        )
        if is_duplicate:
            reason += " Flagged as duplicate report in 500m proximity."
        if fallback_reason:
            reason += f" Note: {fallback_reason}"

        return TriageAssessment(
            calculated_priority=calculated_priority,
            urgency_level=urgency_level,
            verified_needs=verified_needs,
            is_duplicate=is_duplicate,
            reasoning=reason
        )


gemini_service = GeminiService()
