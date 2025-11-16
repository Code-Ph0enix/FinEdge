"""
gemini_recommendations - Groq/HuggingFace with robust JSON extraction & fallback
Option A implementation: Smart JSON Fixer (extract + repair messy LLM output)
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime

# Configure logging FIRST
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Try importing Groq and HF wrappers (optional)
try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except Exception:
    logger.warning("langchain_groq not available")
    GROQ_AVAILABLE = False

try:
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
    HF_AVAILABLE = True
except Exception:
    try:
        from langchain_community.chat_models.huggingface import ChatHuggingFace
        from langchain_community.llms.huggingface_endpoint import HuggingFaceEndpoint
        HF_AVAILABLE = True
    except Exception:
        logger.warning("langchain_huggingface not available")
        HF_AVAILABLE = False

# ==================================================================================================================================================================================================
# ==================== API KEY / provider fallback configuration ====================
# =================================================================================================================================================================================================
GROQ_API_KEYS = [
    os.getenv("GROQ_API_KEY_1"),
    os.getenv("GROQ_API_KEY_2"),
    os.getenv("GROQ_API_KEY_3"),
]

HF_TOKENS = [
    os.getenv("HF_TOKEN_1"),
    os.getenv("HF_TOKEN_2"),
    os.getenv("HF_TOKEN_3"),
]

ACTIVE_LLM_PROVIDER: Optional[str] = None
ACTIVE_API_KEY: Optional[str] = None
ACTIVE_KEY_INDEX: Optional[int] = None


def initialize_llm_with_fallback(temperature: float = 0.7, max_tokens: int = 8192, model_override: str = None):
    """
    Initialize LLM with fallback: try Groq keys then HuggingFace tokens.
    Returns a model object with .invoke(list_of_messages) interface.
    """
    global ACTIVE_LLM_PROVIDER, ACTIVE_API_KEY, ACTIVE_KEY_INDEX

    # Try Groq
    if GROQ_AVAILABLE:
        for idx, api_key in enumerate(GROQ_API_KEYS, start=1):
            if not api_key:
                continue
            try:
                logger.info(f"Attempting to initialize Groq with API key #{idx}...")
                llm = ChatGroq(
                    model=model_override or "llama-3.3-70b-versatile",
                    groq_api_key=api_key,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                # quick sanity test
                from langchain_core.messages import HumanMessage
                resp = llm.invoke([HumanMessage(content="test")])
                if resp and hasattr(resp, "content"):
                    ACTIVE_LLM_PROVIDER = "groq"
                    ACTIVE_API_KEY = api_key
                    ACTIVE_KEY_INDEX = idx
                    logger.info(f"✅ Successfully initialized Groq (key #{idx})")
                    return llm
            except Exception as e:
                logger.warning(f"Groq key #{idx} failed: {e}")
                continue

    # Try HuggingFace
    if HF_AVAILABLE:
        for idx, token in enumerate(HF_TOKENS, start=1):
            if not token:
                continue
            try:
                logger.info(f"Attempting to initialize HuggingFace with token #{idx}...")
                llm_endpoint = HuggingFaceEndpoint(
                    repo_id=model_override or "meta-llama/Llama-3.3-70B-Instruct",
                    huggingfacehub_api_token=token,
                    temperature=temperature,
                    max_new_tokens=max_tokens,
                )
                llm = ChatHuggingFace(llm=llm_endpoint)
                from langchain_core.messages import HumanMessage
                resp = llm.invoke([HumanMessage(content="test")])
                if resp and hasattr(resp, "content"):
                    ACTIVE_LLM_PROVIDER = "huggingface"
                    ACTIVE_API_KEY = token
                    ACTIVE_KEY_INDEX = idx
                    logger.info(f"✅ Successfully initialized HuggingFace (token #{idx})")
                    return llm
            except Exception as e:
                logger.warning(f"HuggingFace token #{idx} failed: {e}")
                continue

    raise ValueError("All LLM providers failed to initialize. Check GROQ_API_KEY_* and HF_TOKEN_* env vars.")


# ==================================================================================================================================================================================================
# ----------------------------- JSON extraction & cleaning helpers -----------------------------
# =================================================================================================================================================================================================
def _strip_code_fences(text: str) -> str:
    """
    Remove markdown code fences and leading/trailing backticks.
    """
    # Remove ```json ... ``` or ``` ... ```
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```", "", text)
    # Remove single backticks
    text = text.replace("`", "")
    return text.strip()


def _find_balanced_json(text: str) -> Optional[str]:
    """
    Find the first balanced JSON object in text. Returns the substring or None.
    Works by scanning for the first '{' and matching braces.
    """
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    in_str = False
    esc = False
    for i in range(start, len(text)):
        ch = text[i]
        if ch == '"' and not esc:
            in_str = not in_str
        if ch == "\\" and not esc:
            esc = True
        else:
            esc = False
        if not in_str:
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    return text[start:i + 1]
    return None


def _wrap_top_level_if_needed(text: str) -> str:
    """
    If text looks like top-level key-value pairs (e.g. '"marketSentiment": {...}, "stocks": [...]'),
    wrap with { ... }.
    """
    trimmed = text.strip()
    # If starts with a quote-key and contains a colon but doesn't start with {, wrap it
    if trimmed and not trimmed.startswith("{") and re.search(r'^\s*"[A-Za-z0-9_]+"\s*:', trimmed):
        return "{" + trimmed + "}"
    return trimmed


def _remove_trailing_commas(json_text: str) -> str:
    """
    Remove trailing commas before } or ] which commonly break JSON.
    """
    # Remove trailing commas like ,} or ,]
    json_text = re.sub(r",\s*([\]}])", r"\1", json_text)
    # Remove stray commas at end of object
    json_text = re.sub(r",\s*$", "", json_text)
    return json_text


def _fix_single_quotes(json_text: str) -> str:
    """
    Replace single quotes used for keys/strings with double quotes when safe.
    This is heuristic — we only do it when double quotes are absent.
    """
    if '"' not in json_text and "'" in json_text:
        # naive conversion: replace single quotes with double quotes
        return json_text.replace("'", '"')
    return json_text


def extract_and_fix_json(text: str) -> Tuple[Optional[dict], str]:
    """
    Try to extract a JSON object from the given text and repair common issues.
    Returns (parsed_dict or None, final_cleaned_text_used_for_parsing).
    """
    if not text or not text.strip():
        return None, ""

    # 1) Strip code fences/backticks and unicode variations of quotes
    t = _strip_code_fences(text)
    t = t.replace("\u201c", '"').replace("\u201d", '"').replace("\u2018", "'").replace("\u2019", "'")

    # 2) Attempt to find a balanced JSON object substring
    found = _find_balanced_json(t)
    if found:
        candidate = found
    else:
        # 3) If none found, maybe the model returned top-level pairs without braces. Wrap if needed.
        candidate = _wrap_top_level_if_needed(t)

    # 4) Clean candidate: remove trailing commas, fix quotes
    candidate = _remove_trailing_commas(candidate)
    candidate = _fix_single_quotes(candidate)

    # 5) Attempt JSON load
    try:
        parsed = json.loads(candidate)
        return parsed, candidate
    except json.JSONDecodeError:
        # last-ditch heuristics: try to salvage by extracting the first {...} pair via regex
        bracket_match = re.search(r"\{[\s\S]*\}", candidate)
        if bracket_match:
            candidate2 = bracket_match.group(0)
            candidate2 = _remove_trailing_commas(candidate2)
            try:
                parsed = json.loads(candidate2)
                return parsed, candidate2
            except json.JSONDecodeError:
                pass

    return None, candidate

# ==================================================================================================================================================================================================
# ----------------------------- Recommendation engine -----------------------------
# ==================================================================================================================================================================================================

class RecommendationEngine:
    def __init__(self, temperature: float = 0.7, max_tokens: int = 8192, model_override: str = None):
        try:
            self.model = initialize_llm_with_fallback(temperature=temperature, max_tokens=max_tokens, model_override=model_override)
            logger.info(f"✅ Recommendation Engine initialized using {ACTIVE_LLM_PROVIDER} (key #{ACTIVE_KEY_INDEX})")
        except Exception as e:
            logger.error(f"Failed to initialize recommendation engine: {e}")
            raise

        # Stronger safety + JSON-only instructions appended to prompt
        self.json_prefix = (
            "IMPORTANT: Return a single VALID JSON OBJECT and NOTHING ELSE. "
            "Start the response with '{' and end with '}'. Do not include any explanation, markdown, or text outside the JSON. "
            "Ensure numeric fields are numbers (no commas, no '₹' currency symbols)."
        )

        # Quick schema check keys
        self._required_keys = ["marketSentiment", "stocks", "mutualFunds"]

    # def _build_recommendation_prompt(self, user_profile: Dict[str, Any], market_data: Dict[str, Any], portfolio_data: Optional[Dict[str, Any]]) -> str:
    #     """
    #     Build a robust instruction + example JSON skeleton to bias the model toward valid JSON output.
    #     """
    #     risk_tolerance = user_profile.get("riskTolerance", "moderate")
    #     monthly_income = user_profile.get("monthlyIncome", 0)
    #     monthly_expenses = user_profile.get("monthlyExpenses", 0)
    #     monthly_savings = max(0, monthly_income - monthly_expenses)
    #     financial_goals = user_profile.get("financialGoals", [])
    #     age = user_profile.get("age", 30)

    #     nifty_trend = market_data.get("niftyTrend", "neutral")
    #     fii_flow = market_data.get("fiiFlow", 0)
    #     top_sectors = market_data.get("topSectors", ["IT", "Banking", "Pharma"])

    #     # Example skeleton (small) — this nudges model to produce same shape
    #     skeleton = {
    #         "marketSentiment": {
    #             "trend": "Neutral",
    #             "fiiFlow": f"{fii_flow}",
    #             "riskLevel": "Moderate",
    #             "summary": "Short (1-2 sentences) market overview"
    #         },
    #         "stocks": [
    #             {
    #                 "symbol": "HDFCBANK",
    #                 "name": "HDFC Bank Ltd.",
    #                 "currentPrice": 0,
    #                 "targetPrice": 0,
    #                 "expectedReturn": "0-0%",
    #                 "riskLevel": "Low/Moderate/High",
    #                 "sector": "Banking",
    #                 "recommendedAllocation": 0,
    #                 "monthlyInvestment": 0,
    #                 "reasoning": "Why this matches the user",
    #                 "keyMetrics": {"pe": 0.0, "marketCap": "Large Cap", "dividend": "0%"}
    #             }
    #         ],
    #         "mutualFunds": [],
    #         "fixedDeposits": [],
    #         "actionPlan": []
    #     }

    #     prompt_parts = [
    #         self.json_prefix,
    #         "",
    #         "CLIENT PROFILE:",
    #         f"- Risk Tolerance: {risk_tolerance}",
    #         f"- Monthly Savings Capacity: {monthly_savings}",
    #         f"- Age: {age}",
    #         f"- Financial Goals: {', '.join(financial_goals) if financial_goals else 'Wealth creation'}",
    #         "",
    #         "CURRENT MARKET CONDITIONS (India):",
    #         f"- NIFTY 50 Trend: {nifty_trend}",
    #         f"- FII Flow (Cr): {fii_flow}",
    #         f"- Top Sectors: {', '.join(top_sectors)}",
    #         "",
    #         "TASK: Produce personalized investment recommendations in VALID JSON matching the example skeleton below. "
    #         "Only include Indian stocks (NSE/BSE). Do not include any commentary or text outside the JSON.",
    #         "",
    #         "JSON SKELETON EXAMPLE (use this shape, but populate with realistic values):",
    #         json.dumps(skeleton, indent=2),
    #         "",
    #         "RETURN the JSON now."
    #     ]

    #     return "\n".join(prompt_parts)

    # def _validate_and_fill(self, recommendations: Dict[str, Any], user_profile: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[str, Any]:
    #     """
    #     Validate required keys and fill defaults if missing. Adds metadata.
    #     """
    #     if "marketSentiment" not in recommendations:
    #         recommendations["marketSentiment"] = {
    #             "trend": market_data.get("niftyTrend", "Neutral"),
    #             "fiiFlow": str(market_data.get("fiiFlow", 0)),
    #             "riskLevel": "Moderate",
    #             "summary": "Market data not available; defaults applied."
    #         }
    #     if "stocks" not in recommendations or not isinstance(recommendations["stocks"], list):
    #         recommendations["stocks"] = []
    #     if "mutualFunds" not in recommendations or not isinstance(recommendations["mutualFunds"], list):
    #         recommendations["mutualFunds"] = []

    #     # Ensure numeric fields are numeric and not strings with commas or ₹
    #     def _normalize_number(v):
    #         if isinstance(v, (int, float)):
    #             return v
    #         if isinstance(v, str):
    #             s = v.replace(",", "").replace("₹", "").strip()
    #             try:
    #                 if "." in s:
    #                     return float(s)
    #                 return int(s)
    #             except Exception:
    #                 return v
    #         return v

    #     for s in recommendations.get("stocks", []):
    #         s["currentPrice"] = _normalize_number(s.get("currentPrice", 0))
    #         s["targetPrice"] = _normalize_number(s.get("targetPrice", 0))
    #         s["recommendedAllocation"] = _normalize_number(s.get("recommendedAllocation", 0))
    #         s["monthlyInvestment"] = _normalize_number(s.get("monthlyInvestment", 0))

    #     # Add metadata
    #     recommendations.setdefault("metadata", {})
    #     recommendations["metadata"].update({
    #         "generatedAt": datetime.utcnow().isoformat(),
    #         "usedProvider": ACTIVE_LLM_PROVIDER,
    #         "keyIndex": ACTIVE_KEY_INDEX
    #     })
    #     return recommendations

    # def _get_fallback_recommendations(self, user_profile: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[str, Any]:
    #     """
    #     Conservative fallback recommendations (kept small and safe).
    #     """
    #     logger.warning("⚠️ Using fallback recommendations")
    #     monthly_savings = max(0, user_profile.get("monthlySavings", user_profile.get("monthlyIncome", 0) - user_profile.get("monthlyExpenses", 0)))
    #     risk = user_profile.get("riskTolerance", "moderate").lower()

    #     return {
    #         "marketSentiment": {
    #             "trend": market_data.get("niftyTrend", "Neutral"),
    #             "fiiFlow": str(market_data.get("fiiFlow", 0)),
    #             "riskLevel": "Moderate",
    #             "summary": "Fallback conservative guidance due to temporary AI failure."
    #         },
    #         "stocks": [
    #             {
    #                 "symbol": "HDFCBANK",
    #                 "name": "HDFC Bank Ltd.",
    #                 "currentPrice": 1650.0,
    #                 "targetPrice": 1800.0,
    #                 "expectedReturn": "8-12%",
    #                 "riskLevel": "Low",
    #                 "sector": "Banking",
    #                 "recommendedAllocation": 20,
    #                 "monthlyInvestment": int(monthly_savings * 0.15),
    #                 "reasoning": "Large-cap defensive allocation for stability.",
    #                 "keyMetrics": {"pe": 18.5, "marketCap": "Large Cap", "dividend": "1.2%"}
    #             }
    #         ],
    #         "mutualFunds": [
    #             {
    #                 "name": "SBI Bluechip Fund",
    #                 "category": "Large Cap",
    #                 "nav": 65.50,
    #                 "returns1Y": 12.5,
    #                 "returns3Y": 14.0,
    #                 "returns5Y": 13.5,
    #                 "riskLevel": "Low",
    #                 "recommendedAllocation": 30,
    #                 "monthlyInvestment": int(monthly_savings * 0.30),
    #                 "reasoning": "Core large-cap equity exposure via SIP."
    #             }
    #         ],
    #         "fixedDeposits": [],
    #         "actionPlan": [
    #             "Maintain emergency fund (6 months expenses)",
    #             "Start SIPs into recommended mutual funds",
    #             "Review allocation yearly"
    #         ],
    #         "metadata": {
    #             "generatedAt": datetime.utcnow().isoformat(),
    #             "source": "fallback"
    #         }
    #     }

    # def generate_recommendations(self, user_profile: Dict[str, Any], market_data: Dict[str, Any], portfolio_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    #     """
    #     Public method: generate recommendations with retries and robust JSON extraction.
    #     Returns parsed recommendations or fallback if all else fails.
    #     """
    #     if not self.model:
    #         logger.error("LLM model not initialized")
    #         return self._get_fallback_recommendations(user_profile, market_data)

    #     prompt = self._build_recommendation_prompt(user_profile, market_data, portfolio_data)

    #     max_retries = 3
    #     last_candidate_text = ""
    #     for attempt in range(1, max_retries + 1):
    #         try:
    #             logger.info(f"🤖 Attempt {attempt}/{max_retries}: Calling LLM API...")
    #             from langchain_core.messages import HumanMessage
    #             response = self.model.invoke([HumanMessage(content=prompt)])
    #             raw_text = getattr(response, "content", "") or str(response)
    #             raw_text = raw_text.strip()
    #             logger.info(f"📝 Received response (first 300 chars): {raw_text[:300]!s}")

    #             # Extract and try to parse JSON
    #             parsed, used_text = extract_and_fix_json(raw_text)
    #             last_candidate_text = used_text

    #             if parsed is not None:
    #                 # Validate and return
    #                 parsed = self._validate_and_fill(parsed, user_profile, market_data)
    #                 parsed["metadata"]["parsedFromModel"] = True
    #                 logger.info("✅ Successfully parsed and validated model output")
    #                 return parsed
    #             else:
    #                 logger.warning("⚠️ Could not parse JSON from model output")
    #                 # If not last attempt, slightly adjust prompt nudges
    #                 if attempt < max_retries:
    #                     logger.info("🔄 Retrying with stronger JSON-only instruction")
    #                     prompt = self.json_prefix + "\n\n" + prompt
    #                     continue
    #                 else:
    #                     logger.error("❌ All retries exhausted; returning fallback recommendations")
    #                     fallback = self._get_fallback_recommendations(user_profile, market_data)
    #                     fallback["metadata"]["parsedFromModel"] = False
    #                     fallback["metadata"]["lastModelAttempt"] = last_candidate_text[:2000]
    #                     return fallback

    #         except Exception as e:
    #             logger.exception(f"Error while generating recommendations (attempt {attempt}): {e}")
    #             if attempt >= max_retries:
    #                 fallback = self._get_fallback_recommendations(user_profile, market_data)
    #                 fallback["metadata"]["parsedFromModel"] = False
    #                 fallback["metadata"]["error"] = str(e)
    #                 return fallback
    #             # else continue retrying

    #     # Should not reach here; return fallback
    #     return self._get_fallback_recommendations(user_profile, market_data)

# ===================================================================================================================================================================================================
# THIS IS THE UPDATED CODE, ABOVE IS THE OLDER CODE, JUST KEPT FOR REFERENCE
# ===================================================================================================================================================================================================

    def _build_recommendation_prompt(self,user_profile: Dict[str, Any],market_data: Dict[str, Any],portfolio_data: Optional[Dict[str, Any]]) -> str:
        """
        Build a robust instruction + example JSON skeleton to bias the model
        toward valid output matching the full expected schema.
        """
    
        risk_tolerance = user_profile.get("riskTolerance", "moderate")
        monthly_income = user_profile.get("monthlyIncome", 0)
        monthly_expenses = user_profile.get("monthlyExpenses", 0)
        monthly_savings = max(0, monthly_income - monthly_expenses)
        financial_goals = user_profile.get("financialGoals", [])
        age = user_profile.get("age", 30)

        nifty_trend = market_data.get("niftyTrend", "neutral")
        fii_flow = market_data.get("fiiFlow", 0)
        top_sectors = market_data.get("topSectors", ["IT", "Banking", "Pharma"])

        # FULL JSON SKELETON — Matches frontend structure
        skeleton = {
            "marketSentiment": {
                "trend": "Neutral",
                "fiiFlow": f"{fii_flow}",
                "riskLevel": "Moderate",
                "summary": "Short (1-2 sentences) market overview"
            },
            "stocks": [],
            "mutualFunds": [],
            "fixedDeposits": [],
            "equityFunds": [],
            "debtFunds": [],
            "hybridFunds": [],
            "lowRiskStocks": [],
            "moderateRiskStocks": [],
            "highRiskStocks": [],
            "bonds": [],
            "realEstate": [],
            "gold": [],
            "etfs": [],
            "sips": [],
            "actionPlan": []
        }

        prompt_parts = [
            self.json_prefix,
            "",
            "CLIENT PROFILE:",
            f"- Risk Tolerance: {risk_tolerance}",
            f"- Monthly Savings Capacity: {monthly_savings}",
            f"- Age: {age}",
            f"- Financial Goals: {', '.join(financial_goals) if financial_goals else 'Wealth creation'}",
            "",
            "CURRENT MARKET CONDITIONS (India):",
            f"- NIFTY 50 Trend: {nifty_trend}",
            f"- FII Flow (Cr): {fii_flow}",
            f"- Top Sectors: {', '.join(top_sectors)}",
            "",
            "TASK:",
            "Produce detailed investment recommendations in VALID JSON ONLY. "
            "Do not include commentary or markdown. Must strictly follow the JSON skeleton.",
            "",
            "JSON SKELETON (MATCH THIS EXACT STRUCTURE):",
            json.dumps(skeleton, indent=2),
            "",
            "RETURN ONLY THE JSON."]
        
        return "\n".join(prompt_parts)
    
    def _validate_and_fill(self,recommendations: Dict[str, Any],user_profile: Dict[str, Any],market_data: Dict[str, Any]) -> Dict[str, Any]:
        # Ensure marketSentiment
        if "marketSentiment" not in recommendations:
            recommendations["marketSentiment"] = {
                "trend": market_data.get("niftyTrend", "Neutral"),
                "fiiFlow": str(market_data.get("fiiFlow", 0)),
                "riskLevel": "Moderate",
                "summary": "Market data unavailable; defaults used."
            }

        # All arrays that must exist
        array_fields = [
            "stocks", "mutualFunds", "fixedDeposits",
            "equityFunds", "debtFunds", "hybridFunds",
            "lowRiskStocks", "moderateRiskStocks", "highRiskStocks",
            "bonds", "realEstate", "gold", "etfs", "sips",
            "actionPlan"
        ]

        for key in array_fields:
            if key not in recommendations or not isinstance(recommendations[key], list):
                recommendations[key] = []

        # Normalizer
        def _normalize_number(v):
            if isinstance(v, (int, float)):
                return v
            if isinstance(v, str):
                s = v.replace(",", "").replace("₹", "").strip()
                try:
                    return float(s) if "." in s else int(s)
                except:
                    return v
            return v

        # Normalize numeric fields for STOCKS only
        for s in recommendations.get("stocks", []):
            s["currentPrice"] = _normalize_number(s.get("currentPrice", 0))
            s["targetPrice"] = _normalize_number(s.get("targetPrice", 0))
            s["recommendedAllocation"] = _normalize_number(s.get("recommendedAllocation", 0))
            s["monthlyInvestment"] = _normalize_number(s.get("monthlyInvestment", 0))

        # Add metadata
        recommendations.setdefault("metadata", {})
        recommendations["metadata"].update({
            "generatedAt": datetime.utcnow().isoformat(),
            "usedProvider": ACTIVE_LLM_PROVIDER,
            "keyIndex": ACTIVE_KEY_INDEX
        })
        return recommendations
    
    def _get_fallback_recommendations(self, user_profile: Dict[str, Any], market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Robust fallback with COMPLETE JSON structure so frontend never breaks.
        """
        logger.warning("⚠️ Using fallback recommendations")

        monthly_savings = max(
            0,
            user_profile.get(
                "monthlySavings",
                user_profile.get("monthlyIncome", 0) - user_profile.get("monthlyExpenses", 0)
            )
        )

        rec = {
            "marketSentiment": {
                "trend": market_data.get("niftyTrend", "Neutral"),
                "fiiFlow": str(market_data.get("fiiFlow", 0)),
                "riskLevel": "Moderate",
                "summary": "Fallback conservative guidance due to AI failure."
            },

            "stocks": [
                {
                    "symbol": "HDFCBANK",
                    "name": "HDFC Bank Ltd.",
                    "currentPrice": 1650.0,
                    "targetPrice": 1800.0,
                    "expectedReturn": "8-12%",
                    "riskLevel": "Low",
                    "sector": "Banking",
                    "recommendedAllocation": 20,
                    "monthlyInvestment": int(monthly_savings * 0.15),
                    "reasoning": "Large-cap stability for conservative fallback.",
                    "keyMetrics": {"pe": 18.5, "marketCap": "Large Cap", "dividend": "1.2%"}
                }
            ],

            "mutualFunds": [
                {
                    "name": "SBI Bluechip Fund",
                    "category": "Large Cap",
                    "nav": 65.50,
                    "returns1Y": 12.5,
                    "returns3Y": 14.0,
                    "returns5Y": 13.5,
                    "riskLevel": "Low",
                    "recommendedAllocation": 30,
                    "monthlyInvestment": int(monthly_savings * 0.30),
                    "reasoning": "Stable equity exposure for fallback."
                }
            ],

            "fixedDeposits": [
                {
                    "bank": "SBI Fixed Deposit",
                    "tenure": "1 Year",
                    "interestRate": 6.5,
                    "minAmount": 10000,
                    "recommendedAllocation": 20,
                    "monthlyInvestment": int(monthly_savings * 0.20),
                    "reasoning": "Safe and guaranteed returns.",
                    "features": ["Guaranteed returns", "Capital protection"]
                }
            ],

            "actionPlan": [
                "Maintain emergency fund (6 months).",
                "Start SIPs in recommended mutual funds.",
                "Review and rebalance anytime market changes."
            ],

            "metadata": {
                "generatedAt": datetime.utcnow().isoformat(),
                "source": "fallback"
            }
        }

        # Ensure all frontend-required keys exist
        for key in [
            "equityFunds", "debtFunds", "hybridFunds",
            "lowRiskStocks", "moderateRiskStocks", "highRiskStocks",
            "bonds", "realEstate", "gold", "etfs", "sips"
        ]:
            rec[key] = []
        return rec

# ===================================================================================================================================================================================================
# ----------------------------- Module-level initialization -----------------------------
# ===================================================================================================================================================================================================
try:
    recommendation_engine = RecommendationEngine()
    logger.info("✅ Global recommendation engine initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize recommendation engine: {e}")
    recommendation_engine = None


def get_personalized_recommendations(user_profile: Dict[str, Any], market_data: Dict[str, Any], portfolio_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Wrapper function to call the global recommendation engine.
    """
    if recommendation_engine is None:
        logger.error("Recommendation engine not initialized - returning fallback")
        engine = RecommendationEngine  # type: ignore
        return RecommendationEngine()._get_fallback_recommendations(user_profile, market_data)

    return recommendation_engine.generate_recommendations(user_profile, market_data, portfolio_data)
