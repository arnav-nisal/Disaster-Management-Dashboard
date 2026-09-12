import os
import re
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
    NVIDIA_AVAILABLE = True
except ImportError:
    NVIDIA_AVAILABLE = False


class GeminiService:
    """
    Multi-provider AI text generation fallback:
    Attempt 1: Groq (llama-3.3-70b-versatile)
    Attempt 2: Gemini (gemini-2.0-flash via google-genai SDK)
    Attempt 3: NVIDIA NIM (meta/llama-3.1-70b-instruct)
    Final fallback: Deterministic rule-based engines.
    """

    def __init__(self):
        # Groq setup
        self.groq_key = os.getenv("GROQ_API_KEY")
        self.groq_client = None
        if GROQ_AVAILABLE and self.groq_key:
            try:
                self.groq_client = Groq(api_key=self.groq_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Groq client: {e}")

        # Gemini setup (using google-genai)
        self.gemini_key = os.getenv("GEMINI_API_KEY")
        self.gemini_client = None
        if GENAI_AVAILABLE and self.gemini_key:
            try:
                self.gemini_client = genai.Client(api_key=self.gemini_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client: {e}")

        # NVIDIA NIM setup (using OpenAI-compatible endpoint)
        self.nvidia_key = os.getenv("NVIDIA_API_KEY")
        self.nvidia_client = None
        if NVIDIA_AVAILABLE and self.nvidia_key:
            try:
                self.nvidia_client = OpenAI(
                    base_url="https://integrate.api.nvidia.com/v1",
                    api_key=self.nvidia_key
                )
            except Exception as e:
                logger.warning(f"Failed to initialize NVIDIA NIM client: {e}")

    def generate_text_fallback(self, prompt: str) -> Dict[str, str]:
        """
        Generic prompt fallback cascade: Groq -> Gemini -> NVIDIA NIM.
        """
        # Attempt 1: Groq
        if self.groq_client:
            for model_name in ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3.8-27b"]:
                try:
                    logger.info(f"Attempting Groq text generation with {model_name}...")
                    response = self.groq_client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model=model_name
                    )
                    return {"provider": "groq", "response": response.choices[0].message.content}
                except Exception as e:
                    logger.warning(f"Groq ({model_name}) failed: {str(e)}")

        # Attempt 2: Gemini
        if self.gemini_client:
            for model_name in ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"]:
                try:
                    logger.info(f"Attempting Gemini text generation with {model_name}...")
                    response = self.gemini_client.models.generate_content(
                        model=model_name,
                        contents=prompt
                    )
                    return {"provider": "gemini", "response": response.text}
                except Exception as e:
                    logger.warning(f"Gemini ({model_name}) failed: {str(e)}")

        # Attempt 3: NVIDIA NIM
        if self.nvidia_client:
            try:
                logger.info("Attempting NVIDIA text generation...")
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
        reporter_name = getattr(incident, "reporter_name", "Anonymous Reporter")
        severity_scale = getattr(incident, "severity_scale", getattr(incident, "severity_level", 5))
        requested_resources = getattr(incident, "requested_resources", {})

        prompt = f"""
You are an emergency response triage coordinator. Analyze this disaster incident and return ONLY valid JSON:
Disaster Type: {incident.disaster_type}
Reporter Name: {reporter_name}
Severity Level (1-10): {severity_scale}
Latitude: {incident.latitude}, Longitude: {incident.longitude}
Description: {incident.description}
Resources Needed: {json.dumps(requested_resources)}
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
        for model_name in ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3.8-27b"]:
            try:
                logger.info(f"Attempting Groq for triage with {model_name}...")
                res = self.groq_client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=model_name,
                    response_format={"type": "json_object"}
                )
                data = json.loads(res.choices[0].message.content)
                data["is_duplicate"] = is_duplicate
                return TriageAssessment(**data)
            except Exception as e:
                logger.warning(f"Groq triage ({model_name}) failed: {e}")
        return None

    def _try_gemini_triage(self, prompt: str, is_duplicate: bool) -> Optional[TriageAssessment]:
        if not self.gemini_client:
            return None
        for model_name in ["gemini-3.6-flash", "gemini-flash-latest", "gemini-2.5-flash", "gemini-2.0-flash"]:
            try:
                logger.info(f"Attempting Gemini for triage with {model_name}...")
                res = self.gemini_client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.1
                    )
                )
                raw_text = res.text.strip()
                if raw_text.startswith("```"):
                    raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
                    raw_text = re.sub(r"\s*```$", "", raw_text)
                data = json.loads(raw_text)
                data["is_duplicate"] = is_duplicate
                return TriageAssessment(**data)
            except Exception as e:
                logger.warning(f"Gemini triage ({model_name}) failed: {e}")
        return None

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
        severity_val = getattr(incident, "severity_scale", getattr(incident, "severity_level", 5))
        base_score = severity_val * 7
        affected_count = getattr(incident, "affected_count", 0)
        if affected_count > 500:
            count_factor = 25
        elif affected_count > 100:
            count_factor = 18
        elif affected_count > 20:
            count_factor = 10
        elif severity_val >= 8:
            count_factor = 15
        elif severity_val >= 5:
            count_factor = 10
        else:
            count_factor = 5

        desc_lower = (incident.description + " " + incident.disaster_type).lower()
        critical_keywords = ["trapped", "collapse", "drowning", "casualt", "explosion", "fire", "bleed", "unconscious", "catastrophic"]
        keyword_bonus = 5 if any(kw in desc_lower for kw in critical_keywords) else 0

        calculated_priority = min(100, max(1, base_score + count_factor + keyword_bonus))
        if is_duplicate:
            calculated_priority = max(1, calculated_priority - 20)

        if calculated_priority >= 80 or severity_val >= 8:
            urgency_level = "Critical"
        elif calculated_priority >= 60 or severity_val >= 6:
            urgency_level = "High"
        elif calculated_priority >= 40 or severity_val >= 4:
            urgency_level = "Medium"
        else:
            urgency_level = "Low"

        # Map requested_resources or resources_needed to verified_needs
        standard_keys = ["food", "water", "medical", "rescue"]
        parsed_needs: Dict[str, int] = {}
        default_resource_qtys = {
            "food": max(10, severity_val * 20),
            "water": max(20, severity_val * 40),
            "medical": max(5, severity_val * 5),
            "rescue": max(2, int(severity_val * 2))
        }

        # Check requested_resources (dict) first
        req_res = getattr(incident, "requested_resources", None)
        if isinstance(req_res, dict) and req_res:
            for k, v in req_res.items():
                parsed_needs[k.lower()] = int(v)
        else:
            res_needed = getattr(incident, "resources_needed", [])
            for item in res_needed:
                if not isinstance(item, str):
                    continue
                item_clean = item.strip()
                if not item_clean:
                    continue
                match = re.match(r"^([a-zA-Z_]+)\s*[:=]\s*(\d+)$", item_clean)
                if match:
                    res_key = match.group(1).lower()
                    parsed_needs[res_key] = int(match.group(2))
                else:
                    res_key = item_clean.lower()
                    parsed_needs[res_key] = default_resource_qtys.get(res_key, 10)

        verified_needs = {}
        for key in standard_keys:
            if key in parsed_needs:
                verified_needs[key] = parsed_needs[key]
            else:
                verified_needs[key] = 0

        for key, val in parsed_needs.items():
            if key not in verified_needs:
                verified_needs[key] = val

        reporter_name = getattr(incident, "reporter_name", "Anonymous Reporter")
        reason = (
            f"Rule-based triage applied: Severity {severity_val}/10, "
            f"Reporter: {reporter_name}, Priority: {calculated_priority}/100."
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
