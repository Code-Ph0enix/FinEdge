# ===============================================================================================================================
# FUNCTIONALITY OF CODE ATTEMPT - LATEST
# ===============================================================================================================================
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
    # Remove json ...  or  ... 
    text = re.sub(r"(?:json)?\s*", "", text)
    text = re.sub(r"\s*", "", text)
    # Remove single backticks
    text = text.replace("", "")
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
    
    # ===================================================================================================================================================================================================
    # CHANGING THIS FUNCTION AS WELL
    # ==================================================================================================================================================================================================  
    
    # def _validate_and_fill(self,recommendations: Dict[str, Any],user_profile: Dict[str, Any],market_data: Dict[str, Any]) -> Dict[str, Any]:
    #     # Ensure marketSentiment
    #     if "marketSentiment" not in recommendations:
    #         recommendations["marketSentiment"] = {
    #             "trend": market_data.get("niftyTrend", "Neutral"),
    #             "fiiFlow": str(market_data.get("fiiFlow", 0)),
    #             "riskLevel": "Moderate",
    #             "summary": "Market data unavailable; defaults used."
    #         }

    #     # All arrays that must exist
    #     array_fields = [
    #         "stocks", "mutualFunds", "fixedDeposits",
    #         "equityFunds", "debtFunds", "hybridFunds",
    #         "lowRiskStocks", "moderateRiskStocks", "highRiskStocks",
    #         "bonds", "realEstate", "gold", "etfs", "sips",
    #         "actionPlan"
    #     ]

    #     for key in array_fields:
    #         if key not in recommendations or not isinstance(recommendations[key], list):
    #             recommendations[key] = []

    #     # Normalizer
    #     def _normalize_number(v):
    #         if isinstance(v, (int, float)):
    #             return v
    #         if isinstance(v, str):
    #             s = v.replace(",", "").replace("₹", "").strip()
    #             try:
    #                 return float(s) if "." in s else int(s)
    #             except:
    #                 return v
    #         return v

    #     # Normalize numeric fields for STOCKS only
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

        # Normalizer - FIXED to return 0 instead of v for invalid values
        def _normalize_number(v):
            if isinstance(v, (int, float)):
                return v
            if isinstance(v, str):
                s = v.replace(",", "").replace("₹", "").strip()
                try:
                    return float(s) if "." in s else int(s)
                except:
                    return 0  # ✅ CHANGED: Return 0 instead of v
            return 0  # ✅ CHANGED: Return 0 for None/undefined

        # Normalize numeric fields for STOCKS
        for s in recommendations.get("stocks", []):
            s["currentPrice"] = _normalize_number(s.get("currentPrice", 0))
            s["targetPrice"] = _normalize_number(s.get("targetPrice", 0))
            s["recommendedAllocation"] = _normalize_number(s.get("recommendedAllocation", 0))
            s["monthlyInvestment"] = _normalize_number(s.get("monthlyInvestment", 0))

        # ✅ NEW: Normalize numeric fields for MUTUAL FUNDS
        for mf in recommendations.get("mutualFunds", []):
            mf["nav"] = _normalize_number(mf.get("nav", 0))
            mf["returns1Y"] = _normalize_number(mf.get("returns1Y", 0))
            mf["returns3Y"] = _normalize_number(mf.get("returns3Y", 0))
            mf["returns5Y"] = _normalize_number(mf.get("returns5Y", 0))
            mf["recommendedAllocation"] = _normalize_number(mf.get("recommendedAllocation", 0))
            mf["monthlyInvestment"] = _normalize_number(mf.get("monthlyInvestment", 0))
            mf["rating"] = _normalize_number(mf.get("rating", 3))

        # ✅ NEW: Normalize numeric fields for FIXED DEPOSITS
        for fd in recommendations.get("fixedDeposits", []):
            fd["interestRate"] = _normalize_number(fd.get("interestRate", 0))
            fd["minAmount"] = _normalize_number(fd.get("minAmount", 0))
            fd["recommendedAllocation"] = _normalize_number(fd.get("recommendedAllocation", 0))
            fd["monthlyInvestment"] = _normalize_number(fd.get("monthlyInvestment", 0))

        # ✅ NEW: Normalize numeric fields for BONDS
        for bond in recommendations.get("bonds", []):
            bond["interestRate"] = _normalize_number(bond.get("interestRate", 0))
            bond["minAmount"] = _normalize_number(bond.get("minAmount", 0))
            bond["recommendedAllocation"] = _normalize_number(bond.get("recommendedAllocation", 0))
            bond["monthlyInvestment"] = _normalize_number(bond.get("monthlyInvestment", 0))

        # ✅ NEW: Normalize numeric fields for REAL ESTATE
        for re in recommendations.get("realEstate", []):
            re["minAmount"] = _normalize_number(re.get("minAmount", 0))
            re["recommendedAllocation"] = _normalize_number(re.get("recommendedAllocation", 0))

        # Add metadata
        recommendations.setdefault("metadata", {})
        recommendations["metadata"].update({
            "generatedAt": datetime.utcnow().isoformat(),
            "usedProvider": ACTIVE_LLM_PROVIDER,
            "keyIndex": ACTIVE_KEY_INDEX
        })
        return recommendations
    
    # ===================================================================================================================================================================================================
    # CHANGED FUNCTION ENDS TILL ABOVE LINE
    # ===================================================================================================================================================================================================
    
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
    
    
    def generate_recommendations(self, user_profile: Dict[str, Any], market_data: Dict[str, Any], portfolio_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Public method: generate recommendations with retries and robust JSON extraction.
        Returns parsed recommendations or fallback if all else fails.
        """
        if not self.model:
            logger.error("LLM model not initialized")
            return self._get_fallback_recommendations(user_profile, market_data)

        prompt = self._build_recommendation_prompt(user_profile, market_data, portfolio_data)

        max_retries = 3
        last_candidate_text = ""
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"🤖 Attempt {attempt}/{max_retries}: Calling LLM API...")
                from langchain_core.messages import HumanMessage
                response = self.model.invoke([HumanMessage(content=prompt)])
                raw_text = getattr(response, "content", "") or str(response)
                raw_text = raw_text.strip()
                logger.info(f"📝 Received response (first 300 chars): {raw_text[:300]!s}")

                # Extract and try to parse JSON
                parsed, used_text = extract_and_fix_json(raw_text)
                last_candidate_text = used_text

                if parsed is not None:
                    # Validate and return
                    parsed = self._validate_and_fill(parsed, user_profile, market_data)
                    parsed["metadata"]["parsedFromModel"] = True
                    logger.info("✅ Successfully parsed and validated model output")
                    return parsed
                else:
                    logger.warning("⚠️ Could not parse JSON from model output")
                    # If not last attempt, slightly adjust prompt nudges
                    if attempt < max_retries:
                        logger.info("🔄 Retrying with stronger JSON-only instruction")
                        prompt = self.json_prefix + "\n\n" + prompt
                        continue
                    else:
                        logger.error("❌ All retries exhausted; returning fallback recommendations")
                        fallback = self._get_fallback_recommendations(user_profile, market_data)
                        fallback["metadata"]["parsedFromModel"] = False
                        fallback["metadata"]["lastModelAttempt"] = last_candidate_text[:2000]
                        return fallback

            except Exception as e:
                logger.exception(f"Error while generating recommendations (attempt {attempt}): {e}")
                if attempt >= max_retries:
                    fallback = self._get_fallback_recommendations(user_profile, market_data)
                    fallback["metadata"]["parsedFromModel"] = False
                    fallback["metadata"]["error"] = str(e)
                    return fallback
                # else continue retrying

        # Should not reach here; return fallback
        return self._get_fallback_recommendations(user_profile, market_data)

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











































































































































# ===============================================================================================================================
# FUNCTIONALITY OF CODE ATTEMPT - 1
# ===============================================================================================================================

"""
gemini recommendations - UPDATED TO GROQ/HUGGINGFACE WITH FALLBACK
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

# Configure logging FIRST (before imports that use logger)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Groq for primary LLM
try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    logger.warning("langchain_groq not available")
    GROQ_AVAILABLE = False

# Import HuggingFace for fallback
try:
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
    HF_AVAILABLE = True
except ImportError:
    try:
        from langchain_community.chat_models.huggingface import ChatHuggingFace
        from langchain_community.llms.huggingface_endpoint import HuggingFaceEndpoint
        HF_AVAILABLE = True
    except ImportError:
        logger.warning("langchain_huggingface not available")
        HF_AVAILABLE = False

# ==================== API KEY FALLBACK CONFIGURATION ====================

# Multi-provider API key fallback system
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

# Global variables to track active provider
ACTIVE_LLM_PROVIDER = None  # 'groq' or 'huggingface'
ACTIVE_API_KEY = None
ACTIVE_KEY_INDEX = None


def initialize_llm_with_fallback(temperature: float = 0.7, max_tokens: int = 8192, model_override: str = None):
    """
    Initialize LLM with automatic fallback logic.
    Tries Groq keys first (1, 2, 3), then HuggingFace tokens (1, 2, 3).
    """
    global ACTIVE_LLM_PROVIDER, ACTIVE_API_KEY, ACTIVE_KEY_INDEX

    # Try Groq keys first
    if GROQ_AVAILABLE:
        for idx, api_key in enumerate(GROQ_API_KEYS, 1):
            if api_key:
                try:
                    logger.info(f"Attempting to initialize Groq with API key #{idx}...")
                    llm = ChatGroq(
                        model=model_override or "llama-3.3-70b-versatile",  # your ai model here
                        groq_api_key=api_key,
                        temperature=temperature,
                        max_tokens=max_tokens
                    )
                    
                    # Test the connection with a simple query
                    from langchain_core.messages import HumanMessage
                    test_response = llm.invoke([HumanMessage(content="test")])
                    
                    if test_response and hasattr(test_response, 'content'):
                        ACTIVE_LLM_PROVIDER = 'groq'
                        ACTIVE_API_KEY = api_key
                        ACTIVE_KEY_INDEX = idx
                        logger.info(f"✅ Successfully initialized Groq with API key #{idx}")
                        return llm
                    
                except Exception as e:
                    logger.warning(f"✗ Groq API key #{idx} failed: {e}")
                    continue

    # Fallback to HuggingFace
    if HF_AVAILABLE:
        for idx, hf_token in enumerate(HF_TOKENS, 1):
            if hf_token:
                try:
                    logger.info(f"Attempting to initialize HuggingFace with token #{idx}...")
                    
                    # Initialize HuggingFace endpoint
                    llm_endpoint = HuggingFaceEndpoint(
                        repo_id=model_override or "your-ai-model-here",  # your ai model here
                        huggingfacehub_api_token=hf_token,
                        temperature=temperature,
                        max_new_tokens=max_tokens,
                    )
                    
                    # Wrap with ChatHuggingFace for chat interface
                    llm = ChatHuggingFace(llm=llm_endpoint)
                    
                    # Test the connection
                    from langchain_core.messages import HumanMessage
                    test_response = llm.invoke([HumanMessage(content="test")])
                    
                    if test_response and hasattr(test_response, 'content'):
                        ACTIVE_LLM_PROVIDER = 'huggingface'
                        ACTIVE_API_KEY = hf_token
                        ACTIVE_KEY_INDEX = idx
                        logger.info(f"✅ Successfully initialized HuggingFace with token #{idx}")
                        return llm
                    
                except Exception as e:
                    logger.warning(f"✗ HuggingFace token #{idx} failed: {e}")
                    continue

    # If all keys failed
    raise ValueError(
        "All API keys failed. Please check your GROQ_API_KEY_1/2/3 and HF_TOKEN_1/2/3 environment variables."
    )


class RecommendationEngine:
    """
    AI-powered investment recommendation engine using Groq/HuggingFace
    """
    
    def __init__(self):
        """Initialize the recommendation engine with fallback LLM"""
        try:
            # Initialize with fallback logic
            self.model = initialize_llm_with_fallback(temperature=0.7, max_tokens=8192)
            logger.info(f"✅ Recommendation Engine initialized successfully using {ACTIVE_LLM_PROVIDER} (key #{ACTIVE_KEY_INDEX})")
        except Exception as e:
            logger.error(f"❌ Failed to initialize LLM: {e}")
            raise
    
    
    def generate_recommendations(
        self,
        user_profile: Dict[str, Any],
        market_data: Dict[str, Any],
        portfolio_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate personalized investment recommendations using AI
        
        Args:
            user_profile: User's financial profile including risk tolerance, income, expenses
            market_data: Current market conditions and sentiment
            portfolio_data: Optional existing portfolio data
            
        Returns:
            dict: Structured recommendations including stocks, mutual funds, bonds, etc.
        """
        try:
            logger.info(f"📊 Generating recommendations for user with risk profile: {user_profile.get('riskTolerance', 'unknown')}")
            
            # Build the prompt
            prompt = self._build_recommendation_prompt(user_profile, market_data, portfolio_data)
            
            # Generate recommendations with retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    logger.info(f"🤖 Attempt {attempt + 1}/{max_retries}: Calling LLM API...")
                    
                    # Call LLM using LangChain interface
                    from langchain_core.messages import HumanMessage
                    response = self.model.invoke([HumanMessage(content=prompt)])
                    
                    # Extract and clean JSON from response
                    response_text = response.content.strip()
                    
                    # Remove markdown code blocks if present
                    if response_text.startswith('```'):
                        response_text = response_text[7:]
                    elif response_text.startswith('```'):
                        response_text = response_text[3:]
                    if response_text.endswith('```'):
                        response_text = response_text[:-3]
                    
                    response_text = response_text.strip()
                    
                    # Log response length for debugging
                    logger.info(f"📝 Received response: {len(response_text)} characters")
                    
                    # Parse JSON
                    recommendations = json.loads(response_text)
                    
                    # VALIDATE: Check if response is complete
                    required_keys = ['marketSentiment', 'stocks', 'mutualFunds']
                    if all(key in recommendations for key in required_keys):
                        logger.info(f"✅ Successfully generated valid recommendations")
                        
                        # Add metadata
                        recommendations['metadata'] = {
                            'generatedAt': datetime.utcnow().isoformat(),
                            'userRiskProfile': user_profile.get('riskTolerance'),
                            'marketCondition': market_data.get('niftyTrend', 'neutral'),
                            'modelUsed': ACTIVE_LLM_PROVIDER,
                            'keyIndex': ACTIVE_KEY_INDEX
                        }
                        
                        return recommendations
                    else:
                        missing_keys = [k for k in required_keys if k not in recommendations]
                        logger.warning(f"⚠️ Incomplete response, missing keys: {missing_keys}")
                        
                        if attempt < max_retries - 1:
                            logger.info(f"🔄 Retrying...")
                            continue
                        else:
                            # Return partial response with defaults
                            return self._fill_missing_fields(recommendations)
                    
                except json.JSONDecodeError as e:
                    logger.error(f"❌ Failed to parse AI response as JSON: {e}")
                    logger.error(f"Response text (first 500 chars): {response_text[:500]}")
                    
                    if attempt < max_retries - 1:
                        logger.info(f"🔄 Retrying with adjusted parameters...")
                        continue
                    else:
                        # Last attempt failed, return fallback
                        logger.error(f"❌ All retries exhausted, returning fallback recommendations")
                        return self._get_fallback_recommendations(user_profile, market_data)
                
                except Exception as e:
                    logger.error(f"❌ Error during generation attempt {attempt + 1}: {e}")
                    if attempt < max_retries - 1:
                        continue
                    else:
                        raise
            
            # Should not reach here, but just in case
            return self._get_fallback_recommendations(user_profile, market_data)
            
        except Exception as e:
            logger.error(f"❌ Error generating recommendations: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    
    def _fill_missing_fields(self, recommendations: dict) -> dict:
        """Fill in missing required fields with defaults"""
        
        if 'marketSentiment' not in recommendations:
            recommendations['marketSentiment'] = {
                'trend': 'Neutral',
                'fiiFlow': '0 Cr',
                'riskLevel': 'Moderate',
                'summary': 'Market data temporarily unavailable.'
            }
        
        if 'stocks' not in recommendations or not isinstance(recommendations['stocks'], list):
            recommendations['stocks'] = []
        
        if 'mutualFunds' not in recommendations or not isinstance(recommendations['mutualFunds'], list):
            recommendations['mutualFunds'] = []
        
        return recommendations
    
    
    def _get_fallback_recommendations(self, user_profile: dict, market_data: dict) -> dict:
        """Return safe fallback recommendations when AI generation fails"""
        
        logger.warning("⚠️ Using fallback recommendations")
        
        risk = user_profile.get('riskTolerance', 'moderate').lower()
        monthly_savings = user_profile.get('monthlySavings', 10000)
        
        # Conservative fallback recommendations
        return {
            "marketSentiment": {
                "trend": market_data.get('niftyTrend', 'Neutral'),
                "fiiFlow": f"{market_data.get('fiiFlow', 0)} Cr",
                "riskLevel": "Moderate",
                "summary": "Market analysis temporarily unavailable. These are conservative recommendations based on your profile."
            },
            "stocks": [
                {
                    "symbol": "HDFCBANK",
                    "name": "HDFC Bank Ltd.",
                    "currentPrice": 1650.00,
                    "expectedReturn": "12-15%",
                    "riskLevel": "Low",
                    "sector": "Banking",
                    "recommendedAllocation": 15 if 'aggressive' in risk else 20,
                    "monthlyInvestment": int(monthly_savings * 0.15),
                    "reasoning": "Stable banking sector leader with consistent growth.",
                    "keyMetrics": {
                        "pe": 18.5,
                        "marketCap": "Large Cap",
                        "dividend": "1.2%"
                    }
                },
                {
                    "symbol": "RELIANCE",
                    "name": "Reliance Industries Ltd.",
                    "currentPrice": 2450.00,
                    "expectedReturn": "15-18%",
                    "riskLevel": "Moderate",
                    "sector": "Conglomerate",
                    "recommendedAllocation": 15,
                    "monthlyInvestment": int(monthly_savings * 0.15),
                    "reasoning": "Diversified business with strong fundamentals.",
                    "keyMetrics": {
                        "pe": 22.3,
                        "marketCap": "Large Cap",
                        "dividend": "0.8%"
                    }
                }
            ],
            "mutualFunds": [
                {
                    "name": "SBI Bluechip Fund",
                    "category": "Large Cap",
                    "nav": 65.50,
                    "returns1Y": 18.5,
                    "returns3Y": 16.2,
                    "returns5Y": 14.8,
                    "riskLevel": "Low",
                    "recommendedAllocation": 30,
                    "monthlyInvestment": int(monthly_savings * 0.30),
                    "reasoning": "Consistent performer in large-cap segment with low risk.",
                    "rating": 4
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
                    "reasoning": "Safe investment with guaranteed returns.",
                    "features": ["Guaranteed returns", "Capital protection", "Flexible tenure"]
                }
            ],
            "actionPlan": [
                "Start with systematic investment plans (SIPs) in mutual funds",
                "Gradually build emergency fund equivalent to 6 months expenses",
                "Review and rebalance portfolio quarterly"
            ],
            "metadata": {
                "generatedAt": datetime.utcnow().isoformat(),
                "userRiskProfile": user_profile.get('riskTolerance'),
                "source": "fallback",
                "note": "AI recommendations temporarily unavailable"
            }
        }
    
    
    def _build_recommendation_prompt(
        self,
        user_profile: Dict[str, Any],
        market_data: Dict[str, Any],
        portfolio_data: Optional[Dict[str, Any]]
    ) -> str:
        """
        Build a comprehensive prompt for AI
        """
        
        # Extract user data
        risk_tolerance = user_profile.get('riskTolerance', 'moderate')
        monthly_income = user_profile.get('monthlyIncome', 0)
        monthly_expenses = user_profile.get('monthlyExpenses', 0)
        monthly_savings = monthly_income - monthly_expenses
        financial_goals = user_profile.get('financialGoals', [])
        current_age = user_profile.get('age', 30)
        
        # Extract market data
        nifty_trend = market_data.get('niftyTrend', 'neutral')
        top_performing_sectors = market_data.get('topSectors', [])
        fii_flow = market_data.get('fiiFlow', 0)
        
        # Build structured prompt
        prompt = f"""
You are an expert Indian financial advisor analyzing investment opportunities for a client.

CLIENT PROFILE:
- Risk Tolerance: {risk_tolerance}
- Monthly Income: ₹{monthly_income:,}
- Monthly Expenses: ₹{monthly_expenses:,}
- Monthly Savings Capacity: ₹{monthly_savings:,}
- Age: {current_age} years
- Financial Goals: {', '.join(financial_goals) if financial_goals else 'Wealth creation'}

CURRENT MARKET CONDITIONS (India):
- NIFTY 50 Trend: {nifty_trend}
- FII Flow: ₹{fii_flow:,} Cr
- Top Performing Sectors: {', '.join(top_performing_sectors) if top_performing_sectors else 'IT, Banking, Pharma'}

{"CURRENT PORTFOLIO:" if portfolio_data else "NOTE: This is a new investor with no existing portfolio"}
{json.dumps(portfolio_data, indent=2) if portfolio_data else "No holdings yet"}

TASK:
Generate personalized investment recommendations in the following STRICT JSON format:

{{
  "marketSentiment": {{
    "trend": "Bullish/Bearish/Neutral",
    "fiiFlow": "{fii_flow} Cr",
    "riskLevel": "Low/Moderate/High",
    "summary": "2-3 sentence market overview"
  }},
  
  "stocks": [
    {{
      "symbol": "HDFCBANK",
      "name": "HDFC Bank Ltd.",
      "currentPrice": 1450.25,
      "targetPrice": 1650.00,
      "expectedReturn": "12-15%",
      "riskLevel": "Low",
      "sector": "Banking",
      "recommendedAllocation": 15,
      "monthlyInvestment": {int(monthly_savings * 0.15)},
      "reasoning": "Detailed 2-3 sentence explanation matching user's risk profile",
      "keyMetrics": {{
        "pe": 18.5,
        "marketCap": "Large Cap",
        "dividend": "1.2%"
      }}
    }}
  ],
  
  "mutualFunds": [
    {{
      "name": "Mirae Asset Large Cap Fund",
      "category": "Large Cap Equity",
      "nav": 95.25,
      "returns1Y": 15.8,
      "returns3Y": 18.2,
      "returns5Y": 16.5,
      "riskLevel": "Moderate",
      "recommendedAllocation": 20,
      "monthlyInvestment": {int(monthly_savings * 0.20)},
      "reasoning": "Why this fund matches user profile",
      "rating": 5
    }}
  ],
  
  "fixedDeposits": [
    {{
      "bank": "SBI",
      "tenure": "2-3 years",
      "interestRate": 7.10,
      "minAmount": 10000,
      "recommendedAllocation": 15,
      "monthlyInvestment": {int(monthly_savings * 0.15)},
      "reasoning": "Capital preservation component",
      "features": ["Senior Citizen Bonus", "Premature Withdrawal", "Auto Renewal"]
    }}
  ],
  
  "actionPlan": [
    "Start SIP in recommended mutual funds with ₹X per month",
    "Invest lump sum amount in Fixed Deposits for emergency fund",
    "Review and rebalance portfolio quarterly"
  ]
}}

IMPORTANT GUIDELINES:
1. Recommend ONLY Indian stocks (NSE/BSE listed)
2. Suggest 4-6 stocks maximum, diversified across sectors
3. Match recommendations to user's risk tolerance ({risk_tolerance})
4. Consider monthly savings capacity (₹{monthly_savings:,})
5. Provide REALISTIC target prices and returns
6. Explain WHY each recommendation fits this specific user
7. Use current market data for recommendations
8. Return ONLY valid JSON, no markdown formatting, no extra text
9. Ensure ALL numeric values are valid numbers (not null or undefined)
10. Complete the entire JSON response without truncation

Generate the recommendations now:
"""
        
        return prompt


# Initialize global engine instance
try:
    recommendation_engine = RecommendationEngine()
    logger.info("✅ Global recommendation engine initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize recommendation engine: {e}")
    recommendation_engine = None


def get_personalized_recommendations(
    user_profile: Dict[str, Any],
    market_data: Dict[str, Any],
    portfolio_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Main function to get personalized recommendations
    
    Args:
        user_profile: User's financial profile
        market_data: Current market conditions
        portfolio_data: User's current portfolio (optional)
    
    Returns:
        Personalized investment recommendations
    """
    if recommendation_engine is None:
        logger.error("❌ Recommendation engine not initialized")
        return {
            'error': 'Recommendation service unavailable',
            'stocks': [],
            'mutualFunds': []
        }
    
    return recommendation_engine.generate_recommendations(
        user_profile,
        market_data,
        portfolio_data
    )





# ===============================================================================================================================
# FUNCTIONALITY OF CODE ATTEMPT - 2
# ===============================================================================================================================

# """
# =========================================================================================================================
# FinEdge AI-Powered Investment Recommendations Engine
# =========================================================================================================================

# Uses Google Gemini AI to generate personalized investment recommendations based on:
# - User's financial profile (income, expenses, savings, risk tolerance)
# - Current market conditions (Nifty, Sensex, sector performance)
# - Portfolio gaps and diversification needs
# - Financial goals and investment horizon

# Author: FinEdge Team
# Version: 2.0.0
# Last Updated: October 2025
# =========================================================================================================================
# """


# # ======================================================================================================================================================
# # clear cache command if needed
# # run this in console tab of the chrome browser when testing recommendations. or while starting new. 

# # VERY IMPORTANT COMMAND
# # // ✅ DELETE CORRUPT CACHE
# # fetch('https://finedge-backend.onrender.com/api/recommendations/clear?clerkUserId=user_34H9ahPZKL5ggfNLNYxP1nT3ECo', {
# #   method: 'DELETE'
# # })
# # .then(res => res.json())
# # .then(data => {
# #   console.log('✅ Cache cleared:', data);
# #   // Now reload page
# #   window.location.reload();
# # });

# # ======================================================================================================================================================









# import os
# import json
# import logging
# from typing import Dict, List, Any, Optional
# from datetime import datetime, timedelta
# import google.generativeai as genai

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Configure Gemini AI
# GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
# if not GEMINI_API_KEY:
#     raise ValueError("❌ GEMINI_API_KEY not found in environment variables")

# genai.configure(api_key=GEMINI_API_KEY)


# class RecommendationEngine:
#     """
#     AI-powered investment recommendation engine using Gemini
#     """
    
#     def __init__(self):
#         """Initialize the recommendation engine with Gemini model"""
#         try:
#             # ✅ Using latest fast model
#             self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
#             logger.info("✅ Gemini Recommendation Engine initialized successfully")
#         except Exception as e:
#             logger.error(f"❌ Failed to initialize Gemini: {e}")
#             raise
    
    
#     def generate_recommendations(
#         self,
#         user_profile: Dict[str, Any],
#         market_data: Dict[str, Any],
#         portfolio_data: Optional[Dict[str, Any]] = None
#     ) -> Dict[str, Any]:
#         """
#         Generate personalized investment recommendations using Gemini AI
        
#         Args:
#             user_profile: User's financial profile including risk tolerance, income, expenses
#             market_data: Current market conditions and sentiment
#             portfolio_data: Optional existing portfolio data
            
#         Returns:
#             dict: Structured recommendations including stocks, mutual funds, bonds, etc.
#         """
#         try:
#             logger.info(f"📊 Generating recommendations for user with risk profile: {user_profile.get('riskTolerance', 'unknown')}")
            
#             # Build the prompt
#             prompt = self._build_recommendation_prompt(user_profile, market_data, portfolio_data)
            
#             # ✅ Configure generation with higher token limit
#             generation_config = {
#                 "temperature": 0.7,
#                 "top_p": 0.95,
#                 "top_k": 40,
#                 "max_output_tokens": 8192,
#                 "response_mime_type": "text/plain",
#             }
            
#             # Generate recommendations with retry logic
#             max_retries = 3
#             for attempt in range(max_retries):
#                 try:
#                     logger.info(f"🤖 Attempt {attempt + 1}/{max_retries}: Calling Gemini API...")
                    
#                     response = self.model.generate_content(
#                         prompt,
#                         generation_config=generation_config
#                     )
                    
#                     # ✅ Extract and clean JSON from response
#                     response_text = response.text.strip()
                    
#                     # Remove markdown code blocks if present
#                     if response_text.startswith('```'):
#                         response_text = response_text[7:]
#                     if response_text.startswith('```'):
#                         response_text = response_text[3:]
#                     if response_text.endswith('```'):
#                         response_text = response_text[:-3]
                    
#                     response_text = response_text.strip()
                    
#                     # Log response length for debugging
#                     logger.info(f"📝 Received response: {len(response_text)} characters")
                    
#                     # Parse JSON
#                     recommendations = json.loads(response_text)
                    
#                     # ✅ VALIDATE: Check if response is complete
#                     required_keys = ['marketSentiment', 'stocks', 'mutualFunds']
#                     if all(key in recommendations for key in required_keys):
#                         logger.info(f"✅ Successfully generated valid recommendations")
                        
#                         # Add metadata
#                         recommendations['metadata'] = {
#                             'generatedAt': datetime.utcnow().isoformat(),
#                             'userRiskProfile': user_profile.get('riskTolerance'),
#                             'marketCondition': market_data.get('niftyTrend', 'neutral'),
#                             'modelUsed': 'gemini-2.0-flash-exp'
#                         }
                        
#                         return recommendations
#                     else:
#                         missing_keys = [k for k in required_keys if k not in recommendations]
#                         logger.warning(f"⚠️ Incomplete response, missing keys: {missing_keys}")
                        
#                         if attempt < max_retries - 1:
#                             logger.info(f"🔄 Retrying...")
#                             continue
#                         else:
#                             # Return partial response with defaults
#                             return self._fill_missing_fields(recommendations)
                    
#                 except json.JSONDecodeError as e:
#                     logger.error(f"❌ Failed to parse AI response as JSON: {e}")
#                     logger.error(f"Response text (first 500 chars): {response_text[:500]}")
                    
#                     if attempt < max_retries - 1:
#                         logger.info(f"🔄 Retrying with adjusted parameters...")
#                         # Reduce temperature for more deterministic output
#                         generation_config["temperature"] = max(0.1, generation_config["temperature"] - 0.2)
#                         continue
#                     else:
#                         # Last attempt failed, return fallback
#                         logger.error(f"❌ All retries exhausted, returning fallback recommendations")
#                         return self._get_fallback_recommendations(user_profile, market_data)
                
#                 except Exception as e:
#                     logger.error(f"❌ Error during generation attempt {attempt + 1}: {e}")
#                     if attempt < max_retries - 1:
#                         continue
#                     else:
#                         raise
            
#             # Should not reach here, but just in case
#             return self._get_fallback_recommendations(user_profile, market_data)
            
#         except Exception as e:
#             logger.error(f"❌ Error generating recommendations: {e}")
#             import traceback
#             traceback.print_exc()
#             raise
    
    
#     def _fill_missing_fields(self, recommendations: dict) -> dict:
#         """Fill in missing required fields with defaults"""
        
#         if 'marketSentiment' not in recommendations:
#             recommendations['marketSentiment'] = {
#                 'trend': 'Neutral',
#                 'fiiFlow': '0 Cr',
#                 'riskLevel': 'Moderate',
#                 'summary': 'Market data temporarily unavailable.'
#             }
        
#         if 'stocks' not in recommendations or not isinstance(recommendations['stocks'], list):
#             recommendations['stocks'] = []
        
#         if 'mutualFunds' not in recommendations or not isinstance(recommendations['mutualFunds'], list):
#             recommendations['mutualFunds'] = []
        
#         return recommendations
    
    
#     def _get_fallback_recommendations(self, user_profile: dict, market_data: dict) -> dict:
#         """Return safe fallback recommendations when AI generation fails"""
        
#         logger.warning("⚠️ Using fallback recommendations")
        
#         risk = user_profile.get('riskTolerance', 'moderate').lower()
#         monthly_savings = user_profile.get('monthlySavings', 10000)
        
#         # Conservative fallback recommendations
#         return {
#             "marketSentiment": {
#                 "trend": market_data.get('niftyTrend', 'Neutral'),
#                 "fiiFlow": f"{market_data.get('fiiFlow', 0)} Cr",
#                 "riskLevel": "Moderate",
#                 "summary": "Market analysis temporarily unavailable. These are conservative recommendations based on your profile."
#             },
#             "stocks": [
#                 {
#                     "symbol": "HDFCBANK",
#                     "name": "HDFC Bank Ltd.",
#                     "currentPrice": 1650.00,
#                     "expectedReturn": "12-15%",
#                     "riskLevel": "Low",
#                     "sector": "Banking",
#                     "recommendedAllocation": 15 if 'aggressive' in risk else 20,
#                     "monthlyInvestment": int(monthly_savings * 0.15),
#                     "reasoning": "Stable banking sector leader with consistent growth.",
#                     "keyMetrics": {
#                         "pe": 18.5,
#                         "marketCap": "Large Cap",
#                         "dividend": "1.2%"
#                     }
#                 },
#                 {
#                     "symbol": "RELIANCE",
#                     "name": "Reliance Industries Ltd.",
#                     "currentPrice": 2450.00,
#                     "expectedReturn": "15-18%",
#                     "riskLevel": "Moderate",
#                     "sector": "Conglomerate",
#                     "recommendedAllocation": 15,
#                     "monthlyInvestment": int(monthly_savings * 0.15),
#                     "reasoning": "Diversified business with strong fundamentals.",
#                     "keyMetrics": {
#                         "pe": 22.3,
#                         "marketCap": "Large Cap",
#                         "dividend": "0.8%"
#                     }
#                 }
#             ],
#             "mutualFunds": [
#                 {
#                     "name": "SBI Bluechip Fund",
#                     "category": "Large Cap",
#                     "nav": 65.50,
#                     "returns1Y": 18.5,
#                     "returns3Y": 16.2,
#                     "returns5Y": 14.8,
#                     "riskLevel": "Low",
#                     "recommendedAllocation": 30,
#                     "monthlyInvestment": int(monthly_savings * 0.30),
#                     "reasoning": "Consistent performer in large-cap segment with low risk.",
#                     "rating": 4
#                 }
#             ],
#             "fixedDeposits": [
#                 {
#                     "bank": "SBI Fixed Deposit",
#                     "tenure": "1 Year",
#                     "interestRate": 6.5,
#                     "minAmount": 10000,
#                     "recommendedAllocation": 20,
#                     "monthlyInvestment": int(monthly_savings * 0.20),
#                     "reasoning": "Safe investment with guaranteed returns.",
#                     "features": ["Guaranteed returns", "Capital protection", "Flexible tenure"]
#                 }
#             ],
#             "actionPlan": [
#                 "Start with systematic investment plans (SIPs) in mutual funds",
#                 "Gradually build emergency fund equivalent to 6 months expenses",
#                 "Review and rebalance portfolio quarterly"
#             ],
#             "metadata": {
#                 "generatedAt": datetime.utcnow().isoformat(),
#                 "userRiskProfile": user_profile.get('riskTolerance'),
#                 "source": "fallback",
#                 "note": "AI recommendations temporarily unavailable"
#             }
#         }
    
    
#     def _build_recommendation_prompt(
#         self,
#         user_profile: Dict[str, Any],
#         market_data: Dict[str, Any],
#         portfolio_data: Optional[Dict[str, Any]]
#     ) -> str:
#         """
#         Build a comprehensive prompt for Gemini AI
#         """
        
#         # Extract user data
#         risk_tolerance = user_profile.get('riskTolerance', 'moderate')
#         monthly_income = user_profile.get('monthlyIncome', 0)
#         monthly_expenses = user_profile.get('monthlyExpenses', 0)
#         monthly_savings = monthly_income - monthly_expenses
#         financial_goals = user_profile.get('financialGoals', [])
#         current_age = user_profile.get('age', 30)
        
#         # Extract market data
#         nifty_trend = market_data.get('niftyTrend', 'neutral')
#         top_performing_sectors = market_data.get('topSectors', [])
#         fii_flow = market_data.get('fiiFlow', 0)
        
#         # Build structured prompt
#         prompt = f"""
# You are an expert Indian financial advisor analyzing investment opportunities for a client.

# CLIENT PROFILE:
# - Risk Tolerance: {risk_tolerance}
# - Monthly Income: ₹{monthly_income:,}
# - Monthly Expenses: ₹{monthly_expenses:,}
# - Monthly Savings Capacity: ₹{monthly_savings:,}
# - Age: {current_age} years
# - Financial Goals: {', '.join(financial_goals) if financial_goals else 'Wealth creation'}

# CURRENT MARKET CONDITIONS (India):
# - NIFTY 50 Trend: {nifty_trend}
# - FII Flow: ₹{fii_flow:,} Cr
# - Top Performing Sectors: {', '.join(top_performing_sectors) if top_performing_sectors else 'IT, Banking, Pharma'}

# {"CURRENT PORTFOLIO:" if portfolio_data else "NOTE: This is a new investor with no existing portfolio"}
# {json.dumps(portfolio_data, indent=2) if portfolio_data else "No holdings yet"}

# TASK:
# Generate personalized investment recommendations in the following STRICT JSON format:

# {{
#   "marketSentiment": {{
#     "trend": "Bullish/Bearish/Neutral",
#     "fiiFlow": "{fii_flow} Cr",
#     "riskLevel": "Low/Moderate/High",
#     "summary": "2-3 sentence market overview"
#   }},
  
#   "stocks": [
#     {{
#       "symbol": "HDFCBANK",
#       "name": "HDFC Bank Ltd.",
#       "currentPrice": 1450.25,
#       "targetPrice": 1650.00,
#       "expectedReturn": "12-15%",
#       "riskLevel": "Low",
#       "sector": "Banking",
#       "recommendedAllocation": 15,
#       "monthlyInvestment": {int(monthly_savings * 0.15)},
#       "reasoning": "Detailed 2-3 sentence explanation matching user's risk profile",
#       "keyMetrics": {{
#         "pe": 18.5,
#         "marketCap": "Large Cap",
#         "dividend": "1.2%"
#       }}
#     }}
#   ],
  
#   "mutualFunds": [
#     {{
#       "name": "Mirae Asset Large Cap Fund",
#       "category": "Large Cap Equity",
#       "nav": 95.25,
#       "returns1Y": 15.8,
#       "returns3Y": 18.2,
#       "returns5Y": 16.5,
#       "riskLevel": "Moderate",
#       "recommendedAllocation": 20,
#       "monthlyInvestment": {int(monthly_savings * 0.20)},
#       "reasoning": "Why this fund matches user profile",
#       "rating": 5
#     }}
#   ],
  
#   "fixedDeposits": [
#     {{
#       "bank": "SBI",
#       "tenure": "2-3 years",
#       "interestRate": 7.10,
#       "minAmount": 10000,
#       "recommendedAllocation": 15,
#       "monthlyInvestment": {int(monthly_savings * 0.15)},
#       "reasoning": "Capital preservation component",
#       "features": ["Senior Citizen Bonus", "Premature Withdrawal", "Auto Renewal"]
#     }}
#   ],
  
#   "actionPlan": [
#     "Start SIP in recommended mutual funds with ₹X per month",
#     "Invest lump sum amount in Fixed Deposits for emergency fund",
#     "Review and rebalance portfolio quarterly"
#   ]
# }}

# IMPORTANT GUIDELINES:
# 1. Recommend ONLY Indian stocks (NSE/BSE listed)
# 2. Suggest 4-6 stocks maximum, diversified across sectors
# 3. Match recommendations to user's risk tolerance ({risk_tolerance})
# 4. Consider monthly savings capacity (₹{monthly_savings:,})
# 5. Provide REALISTIC target prices and returns
# 6. Explain WHY each recommendation fits this specific user
# 7. Use current market data for recommendations
# 8. Return ONLY valid JSON, no markdown formatting, no extra text
# 9. Ensure ALL numeric values are valid numbers (not null or undefined)
# 10. Complete the entire JSON response without truncation

# Generate the recommendations now:
# """
        
#         return prompt


# # Initialize global engine instance
# try:
#     recommendation_engine = RecommendationEngine()
#     logger.info("✅ Global recommendation engine initialized")
# except Exception as e:
#     logger.error(f"❌ Failed to initialize recommendation engine: {e}")
#     recommendation_engine = None


# def get_personalized_recommendations(
#     user_profile: Dict[str, Any],
#     market_data: Dict[str, Any],
#     portfolio_data: Optional[Dict[str, Any]] = None
# ) -> Dict[str, Any]:
#     """
#     Main function to get personalized recommendations
    
#     Args:
#         user_profile: User's financial profile
#         market_data: Current market conditions
#         portfolio_data: User's current portfolio (optional)
    
#     Returns:
#         Personalized investment recommendations
#     """
#     if recommendation_engine is None:
#         logger.error("❌ Recommendation engine not initialized")
#         return {
#             'error': 'Recommendation service unavailable',
#             'stocks': [],
#             'mutualFunds': []
#         }
    
#     return recommendation_engine.generate_recommendations(
#         user_profile,
#         market_data,
#         portfolio_data
#     )