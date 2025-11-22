"""
FinEdge AI Financial Advisor - Consolidated Backend Module

This module combines ReAct agent capabilities with Groq chat for comprehensive
financial advisory. It provides tool-based research with session management.

Features:
- ReAct agent with financial tools (LEGACY + ENHANCED)
- Session-based chat management (LEGACY + ENHANCED)
- Fallback mechanisms for reliability (NEW - ADDED)
- Multi-provider API key fallback (Groq -> HuggingFace)
- Integrated research and advisory (ENHANCED)

Author: FinEdge Team
Version: 2.0.0 (Consolidated & Enhanced - Groq Integration with Fallback)
"""

import os
import sys
import logging
import warnings
from typing import Optional, Dict, Any, List
from datetime import datetime

# =========================================================
# NEW IMPORTS FOR ENHANCED FUNCTIONALITY & FALLBACKS
# =========================================================

# new: yfinance for real-time price fetching and Flask JSON helper (used by app.py later)
import yfinance as yf
import re
from flask import jsonify  # only imported here so app.py code snippet can call helper if needed

# =========================================================
# Third-party imports
from dotenv import load_dotenv

# ---------- LangChain imports (updated for 1.x) ----------
# We attempt to import the modern 1.x APIs first, and gracefully fallback when necessary.
create_tool_calling_agent = None
try:
    # Preferred in many 1.x setups
    from langchain.agents import create_tool_calling_agent  # type: ignore
    # if import succeeded, keep it
    create_tool_calling_agent = create_tool_calling_agent
except Exception:
    # Some installations might provide slightly different helpers or have them in experimental modules
    try:
        from langchain.agents import ToolCallingAgent, create_tool_calling_agent  # type: ignore
        create_tool_calling_agent = create_tool_calling_agent
    except Exception:
        try:
            # older transitional location
            from langchain_experimental.agents import create_tool_calling_agent  # type: ignore
            create_tool_calling_agent = create_tool_calling_agent
        except Exception:
            # final fallback: None (we'll handle agent creation failure later)
            create_tool_calling_agent = None

# AgentExecutor from langchain_core.agents is present in your environment per logs
try:
    from langchain_core.agents import AgentExecutor  # type: ignore
except Exception:
    # fallback to langchain.agents (rare)
    try:
        from langchain.agents import AgentExecutor  # type: ignore
    except Exception:
        AgentExecutor = None  # will handle later

# For prompt building in 1.x
ChatPromptTemplate = None
try:
    from langchain_core.prompts import ChatPromptTemplate  # type: ignore
    ChatPromptTemplate = ChatPromptTemplate
except Exception:
    try:
        from langchain.prompts import ChatPromptTemplate  # type: ignore
        ChatPromptTemplate = ChatPromptTemplate
    except Exception:
        ChatPromptTemplate = None

# Suppress warnings (LEGACY)
warnings.filterwarnings("ignore")

# Configure logging FIRST (ENHANCED - more detailed)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Import ChatGroq for Groq integration
try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    logger.warning("langchain_groq not available")

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

# Load environment variables (LEGACY)
load_dotenv()

# ==================== API KEY FALLBACK CONFIGURATION ====================

# NEW - ADDED: Multi-provider API key fallback system
GROQ_API_KEYS = [
    os.environ.get("GROQ_API_KEY_1"),
    os.environ.get("GROQ_API_KEY_2"),
    os.environ.get("GROQ_API_KEY_3"),
]

HF_TOKENS = [
    os.environ.get("HF_TOKEN_1"),
    os.environ.get("HF_TOKEN_2"),
    os.environ.get("HF_TOKEN_3"),
]

# Global variables to track active provider
ACTIVE_LLM_PROVIDER = None  # 'groq' or 'huggingface'
ACTIVE_API_KEY = None
ACTIVE_KEY_INDEX = None


def initialize_llm_with_fallback(temperature: float = 1, max_tokens: int = 2048, model_override: str = None):
    """
    NEW - ADDED: Initialize LLM with automatic fallback logic.
    Tries Groq keys first (1, 2, 3), then HuggingFace tokens (1, 2, 3).
    Automatically maps Groq model names to HuggingFace equivalents.
    """
    global ACTIVE_LLM_PROVIDER, ACTIVE_API_KEY, ACTIVE_KEY_INDEX

    # MODEL MAPPING: Groq name → HuggingFace name
    groq_to_hf_model_map = {
        "llama-3.3-70b-versatile": "meta-llama/Llama-3.3-70B-Instruct",
        "llama-3.1-8b-instant": "meta-llama/Llama-3.1-8B-Instruct",
    }

    # Try Groq keys first
    if GROQ_AVAILABLE:
        for idx, api_key in enumerate(GROQ_API_KEYS, 1):
            if api_key:
                try:
                    logger.info(f"Attempting to initialize Groq with API key #{idx}...")
                    llm = ChatGroq(
                        model=model_override or "llama-3.3-70b-versatile",  # Groq model name
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
                        logger.info(f"✅ Successfully initialized Groq with API key #{idx}, model: {model_override or 'llama-3.3-70b-versatile'}")
                        return llm
                    
                except Exception as e:
                    logger.warning(f"✗ Groq API key #{idx} failed: {e}")
                    continue

    # Fallback to HuggingFace
    if HF_AVAILABLE:
        # Convert Groq model name to HuggingFace model name
        hf_model = groq_to_hf_model_map.get(
            model_override, 
            "meta-llama/Llama-3.3-70B-Instruct"  # Default fallback
        )
        
        for idx, hf_token in enumerate(HF_TOKENS, 1):
            if hf_token:
                try:
                    logger.info(f"Attempting to initialize HuggingFace with token #{idx}...")
                    
                    # Initialize HuggingFace endpoint
                    llm_endpoint = HuggingFaceEndpoint(
                        repo_id=hf_model,  # HuggingFace model name (converted from Groq)
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
                        logger.info(f"✅ Successfully initialized HuggingFace with token #{idx}, model: {hf_model}")
                        return llm
                    
                except Exception as e:
                    logger.warning(f"✗ HuggingFace token #{idx} failed: {e}")
                    continue

    # If all keys failed
    raise ValueError(
        "All API keys failed. Please check your GROQ_API_KEY_1/2/3 and HF_TOKEN_1/2/3 environment variables."
    )


def get_active_provider_info() -> Dict[str, Any]:
    """
    NEW - ADDED: Get information about the currently active LLM provider.
    """
    return {
        'provider': ACTIVE_LLM_PROVIDER,
        'key_index': ACTIVE_KEY_INDEX,
        'status': 'active' if ACTIVE_LLM_PROVIDER else 'not_initialized'
    }


# ==================== CONFIGURATION ====================

# Initialize LLMs with fallback logic
try:
    logger.info("Initializing chat LLM with fallback logic...")
    groq_chat_llm = initialize_llm_with_fallback(
        temperature=1, 
        max_tokens=2048, 
        model_override="llama-3.3-70b-versatile"  # Optimized for financial advice
    )
    logger.info(f"Chat LLM configured successfully using {ACTIVE_LLM_PROVIDER} (key #{ACTIVE_KEY_INDEX})")
except Exception as e:
    logger.error(f"Failed to configure any LLM provider: {e}")
    raise

# ==================== FINANCIAL ADVISOR CONFIGURATION ====================

# ENHANCED - More concise instruction (UPDATED)
FINANCIAL_ADVISOR_INSTRUCTION = """You are a knowledgeable personal financial advisor dedicated to helping individuals navigate their financial journey. Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. Be precise and practical in your advice while considering individual circumstances.

Key areas of expertise:
- Budgeting and expense tracking
- Investment strategies and portfolio management
- Retirement planning
- Debt management and elimination
- Tax planning considerations
- Emergency fund planning
- Risk management and insurance
- Stock market analysis and research
- Company fundamentals evaluation

**IMPORTANT RESPONSE GUIDELINES (NEW - ADDED):**
1. Keep responses concise and to-the-point (max 300-400 words for general queries)
2. Use bullet points and short paragraphs for readability
3. Provide actionable advice, not lengthy explanations
4. For "teach me" or "basics" questions: Give 3-5 key points with brief explanations
5. For investment queries: Focus on key metrics, risks, and 2-3 specific recommendations
6. Avoid repetition and filler content
7. If the user asks for details, then provide comprehensive answers

Provide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.

If the user provides you with research data from tools (like stock prices, company info, historical data), use it comprehensively in your response. Always cite the data when making recommendations.

When answering investment queries:
1. Consider current market conditions
2. Evaluate company fundamentals
3. Assess risk factors
4. Provide balanced pros and cons (2-3 each maximum)
5. Never guarantee returns or outcomes

Remember: Brevity is key. Quality over quantity."""

# ==================== SESSION MANAGEMENT (LEGACY + ENHANCED) ====================

# Dictionary to store chat sessions per user/session ID (UPDATED for message history)
chat_sessions: Dict[str, List[Dict[str, str]]] = {}

# NEW - ADDED: Session metadata for tracking
session_metadata: Dict[str, Dict[str, Any]] = {}


def get_or_create_chat_session(session_id: str = 'default') -> List[Dict[str, str]]:
    """
    Get existing chat session history or create a new one for the given session ID.
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'

    if session_id not in chat_sessions:
        try:
            chat_sessions[session_id] = []

            # NEW - ADDED: Track session metadata
            session_metadata[session_id] = {
                'created_at': datetime.now().isoformat(),
                'last_activity': datetime.now().isoformat(),
                'message_count': 0
            }

            logger.info(f"Created new chat session: {session_id}")
        except Exception as e:
            logger.error(f"Failed to create chat session {session_id}: {e}")
            raise
    else:
        # NEW - ADDED: Update last activity
        session_metadata[session_id]['last_activity'] = datetime.now().isoformat()

    return chat_sessions[session_id]


def clear_chat_session(session_id: str = 'default') -> bool:
    """
    Clear a specific chat session.
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'

    if session_id in chat_sessions:
        del chat_sessions[session_id]

        # NEW - ADDED: Clean up metadata
        if session_id in session_metadata:
            del session_metadata[session_id]

        logger.info(f"Cleared chat session: {session_id}")
        return True
    return False


def get_chat_history(session_id: str = 'default') -> list:
    """
    Get chat history for a specific session.
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'

    if session_id in chat_sessions:
        return chat_sessions[session_id]
    return []


def get_active_sessions() -> List[str]:
    """
    Get list of all active session IDs.
    """
    return list(chat_sessions.keys())


def get_session_info(session_id: str = 'default') -> Optional[Dict[str, Any]]:
    """
    Get metadata information about a specific session.
    """
    if session_id in session_metadata:
        info = session_metadata[session_id].copy()
        info['session_id'] = session_id
        info['history_length'] = len(get_chat_history(session_id))
        return info
    return None


def cleanup_old_sessions(max_sessions: int = 100) -> int:
    """
    Clean up old sessions if too many are active.
    """
    if len(chat_sessions) > max_sessions:
        # ENHANCED - Sort by last activity time instead of FIFO
        sorted_sessions = sorted(
            session_metadata.items(),
            key=lambda x: x[1].get('last_activity', ''),
        )

        sessions_to_remove = len(chat_sessions) - max_sessions
        removed_count = 0

        for i in range(sessions_to_remove):
            if i < len(sorted_sessions):
                session_id = sorted_sessions[i][0]
                clear_chat_session(session_id)
                removed_count += 1

        logger.info(f"Cleaned up {removed_count} old sessions")
        return removed_count
    return 0


# ==================== REACT AGENT SETUP (UPDATED FOR 1.X) ====================

def get_react_prompt_template():
    """
    LEGACY FUNCTION - Imported from react_template.py
    """
    try:
        from react_template import get_react_prompt_template as get_template
        return get_template()
    except ImportError:
        logger.warning("react_template.py not found, using default template")
        # Provide a minimal default if react_template.py is missing
        from langchain.prompts import PromptTemplate
        return PromptTemplate(
            input_variables=["input", "agent_scratchpad", "tools", "tool_names"],
            template="""Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought:{agent_scratchpad}"""
        )


def initialize_tools():
    """
    Initialize all financial tools for the ReAct agent.
    """
    try:
        from tools.mytools import (
            add, subtract, multiply, divide, power,
            search, repl_tool,
            get_historical_price, get_current_price,
            get_company_info, evaluate_returns,
            check_system_time
        )

        tools = [
            # Basic tools (LEGACY)
            add, subtract, multiply, divide, power,
            # Utility tools (LEGACY)
            search, repl_tool, check_system_time,
            # Financial tools (LEGACY)
            get_historical_price, get_current_price,
            get_company_info, evaluate_returns
        ]

        logger.info(f"Initialized {len(tools)} tools successfully")
        return tools

    except ImportError as e:
        logger.error(f"Failed to import tools from tools/mytools.py: {e}")
        # NEW - ADDED: Try alternate import path as fallback
        try:
            logger.info("Attempting alternate import path...")
            import sys
            import os

            tools_dir = os.path.join(os.path.dirname(__file__), 'tools')
            if tools_dir not in sys.path:
                sys.path.insert(0, tools_dir)

            from tools.mytools import (
                add, subtract, multiply, divide, power,
                search, repl_tool,
                get_historical_price, get_current_price,
                get_company_info, evaluate_returns,
                check_system_time
            )

            tools = [
                add, subtract, multiply, divide, power,
                search, repl_tool, check_system_time,
                get_historical_price, get_current_price,
                get_company_info, evaluate_returns
            ]

            logger.info(f"Initialized {len(tools)} tools successfully via alternate path")
            return tools

        except ImportError as e2:
            logger.error(f"Alternate import also failed: {e2}")
            # Return minimal toolset if import fails (NEW - ADDED for robustness)
            return []
        
# =====================================================================================
# STOCK PRICE / TICKER HELPERS - NEW FUNCTION ADDED TO SHOW REAL-TIME PRICE FETCHING
# =====================================================================================

# Minimal company name -> ticker mapping. Extend this in production.
_TICKER_OVERRIDE = {
    # common examples; extend as needed
    "adani green energy": "ADANIGREEN.NS",
    "reliance": "RELIANCE.NS",
    "tcs": "TCS.NS",
    "hdfc bank": "HDFCBANK.NS",
    "hdfcbank": "HDFCBANK.NS",
    "infosys": "INFY.NS",
    "reliance industries": "RELIANCE.NS",
    "nifty": "^NSEI",
    "sensex": "^BSESN"
}

def resolve_ticker(query: str) -> str:
    """
    Resolve a user free-text (company name or ticker) into a yfinance-compatible ticker string.
    Strategy:
      1. lowercase normalize and check override dict
      2. if looks like a ticker (all upper + maybe .NS), return as-is
      3. fallback: try appending .NS
    This is intentionally simple and reliable. Improve with a proper symbol lookup if needed.
    """
    if not query:
        return ""
    q = query.strip().lower()
    # quick check override map
    if q in _TICKER_OVERRIDE:
        return _TICKER_OVERRIDE[q]
    # if user passed symbol like ADANIGREEN or ADANIGREEN.NS
    simple = re.sub(r"[^A-Za-z0-9\.]", "", query).upper()
    # if already contains a dot (like .NS) or starts with ^ (index), return
    if "." in simple or simple.startswith("^"):
        return simple
    # finally append NSE suffix as a guess
    return simple + ".NS"

def fetch_stock_price_by_symbol(symbol: str) -> Dict[str, Any]:
    """
    Use yfinance to fetch the latest price and some metadata for a given symbol.
    Returns a structured dict or raises an exception. Caller should handle exceptions.
    """
    try:
        if not symbol:
            raise ValueError("Empty symbol")

        t = yf.Ticker(symbol)
        # Try to get realtime-ish market price
        info = {}
        try:
            info = t.info if hasattr(t, "info") else {}
        except Exception:
            info = {}

        # Try to get regularMarketPrice from info
        price = info.get("regularMarketPrice") or info.get("currentPrice")

        # If info didn't have it, fallback to last history close
        if price is None:
            hist = t.history(period="1d", interval="1m")
            if not hist.empty:
                # last row close
                price = float(hist['Close'].iloc[-1])
            else:
                # try 5d
                hist = t.history(period="5d")
                price = float(hist['Close'].iloc[-1]) if not hist.empty else None

        # additional metadata
        prev_close = info.get("previousClose") or info.get("regularMarketPreviousClose")
        currency = info.get("currency") or "INR"
        day_change = None
        day_pct = None
        if price is not None and prev_close is not None:
            try:
                day_change = float(price) - float(prev_close)
                day_pct = (day_change / float(prev_close)) * 100 if float(prev_close) != 0 else None
            except Exception:
                day_change = None
                day_pct = None

        # 52 week
        fifty_two_week_low = info.get("fiftyTwoWeekLow")
        fifty_two_week_high = info.get("fiftyTwoWeekHigh")

        return {
            "symbol": symbol,
            "price": price,
            "previous_close": prev_close,
            "change": day_change,
            "change_percent": round(day_pct, 2) if day_pct is not None else None,
            "currency": currency,
            "52_week_low": fifty_two_week_low,
            "52_week_high": fifty_two_week_high,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.exception(f"fetch_stock_price_by_symbol error for {symbol}: {e}")
        raise



# Initialize LLM for ReAct agent with fallback (UPDATED)
try:
    logger.info("Initializing ReAct agent LLM with fallback logic...")
    react_llm = initialize_llm_with_fallback(
        temperature=0, 
        max_tokens=1024,
        model_override="llama-3.1-8b-instant"  # Fast model for tool execution
    )
    logger.info(f"ReAct LLM configured successfully using {ACTIVE_LLM_PROVIDER}")
except Exception as e:
    logger.error(f"Failed to configure ReAct LLM: {e}")
    react_llm = None

# Initialize tools (LEGACY)
tools = initialize_tools()
# ---------------------------
# Register / wrap get_current_price tool (D + B)
# ---------------------------

# If the module 'get_current_price' tool exists in tools list, keep it.
# Otherwise, add our robust wrapper that uses yfinance helper above.
def _get_current_price_wrapper(arg: str):
    """
    Wrapper for ReAct agent tool calling. Accepts either a symbol or natural language,
    resolves to a symbol, and returns JSON-like string result.
    """
    try:
        # If the user passed something like "price of Adani Green", extract the company phrase
        # crude extraction: take last 6-8 words after 'price' or 'current price'
        text = (arg or "").strip()
        # Try to extract quoted substring if provided
        m = re.search(r'["“](.+?)["”]', text)
        company = None
        if m:
            company = m.group(1)
        else:
            # try common patterns
            m2 = re.search(r'price of (.+)', text, flags=re.I)
            if m2:
                company = m2.group(1)
            else:
                # fallback: take last 4 words as company
                parts = text.split()
                company = " ".join(parts[-4:]) if len(parts) >= 1 else text

        symbol = resolve_ticker(company)
        data = fetch_stock_price_by_symbol(symbol)
        return data
    except Exception as e:
        return {"error": str(e)}

# Add wrapper into tools map for MinimalToolAgent if not present
try:
    # If explicit tool exists (from tools.mytools) prefer that name
    found = False
    for t in tools or []:
        name = getattr(t, "name", None) or getattr(t, "__name__", None)
        if name and name.lower() == "get_current_price".lower():
            found = True
            break
    if not found:
        # expose wrapper as a simple callable with name 'get_current_price'
        tools = (tools or []) + [_get_current_price_wrapper]
        logger.info("Added _get_current_price_wrapper to tools for robust price fetching")
except Exception as e:
    logger.warning(f"Failed to register price wrapper: {e}")




# ===============================================================================================================================
# CHANGE THIS PART IF DEPLOY FAILS
# ===============================================================================================================================

# Create ReAct / Tool-calling agent (robust & backward-compatible)
agent_executor = None

if react_llm:
    try:
        prompt_template = get_react_prompt_template()

        # Build ChatPromptTemplate if available
        if ChatPromptTemplate is not None:
            try:
                prompt_text = prompt_template.template if hasattr(prompt_template, "template") else str(prompt_template)
            except Exception:
                prompt_text = str(prompt_template)

            try:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", prompt_text),
                    ("user", "{input}"),
                    ("placeholder", "{agent_scratchpad}")
                ])
            except Exception:
                # If ChatPromptTemplate.from_messages signature differs, fallback to raw prompt text
                prompt = prompt_text
        else:
            prompt = prompt_template

        react_agent = None
        created_by = None

        # --- Attempt 1: initialize_agent from common locations ---
        initialize_agent_fn = None
        for mod_path in ("langchain.agents", "langchain_core.agents", "langchain.agents.agent"):
            try:
                mod = __import__(mod_path, fromlist=["initialize_agent"])
                initialize_agent_fn = getattr(mod, "initialize_agent")
                if initialize_agent_fn:
                    created_by = f"{mod_path}.initialize_agent"
                    break
            except Exception:
                continue

        if initialize_agent_fn:
            try:
                # prefer AgentType from whichever module provides it
                AgentTypeObj = None
                for mod_path in ("langchain.agents", "langchain_core.agents", "langchain.agents.agent"):
                    try:
                        mod = __import__(mod_path, fromlist=["AgentType"])
                        AgentTypeObj = getattr(mod, "AgentType")
                        break
                    except Exception:
                        continue

                if AgentTypeObj is not None:
                    react_agent = initialize_agent_fn(
                        tools=tools,
                        llm=react_llm,
                        agent=AgentTypeObj.ZERO_SHOT_REACT_DESCRIPTION,
                        verbose=True,
                        handle_parsing_errors=True,
                        max_iterations=5,
                        early_stopping_method="generate",
                        agent_kwargs={"system_message": prompt} if isinstance(prompt, str) else {"system_message": str(prompt)}
                    )
                else:
                    # If AgentType not found, call initialize_agent with common kwargs and hope for the best
                    react_agent = initialize_agent_fn(
                        tools=tools,
                        llm=react_llm,
                        verbose=True,
                        handle_parsing_errors=True,
                        max_iterations=5,
                    )
                logger.info(f"✅ Created ReAct agent using {created_by}")
            except Exception as e:
                logger.warning(f"{created_by} call failed: {e}")
                react_agent = None

        # --- Attempt 2: try legacy or alternate helpers (many names in different versions) ---
        if react_agent is None:
            for try_name in ("create_react_agent", "create_tool_calling_agent", "create_structured_chat_agent"):
                try:
                    for mod_path in ("langchain.agents", "langchain_experimental.agents", "langchain.agents.agent", "langchain.experimental.agents"):
                        try:
                            mod = __import__(mod_path, fromlist=[try_name])
                            fn = getattr(mod, try_name)
                            # try both keyword and positional call variants
                            try:
                                react_agent = fn(llm=react_llm, tools=tools, prompt=prompt)
                            except TypeError:
                                react_agent = fn(react_llm, tools, prompt)
                            created_by = f"{mod_path}.{try_name}"
                            logger.info(f"✅ Created ReAct agent using {created_by}")
                            break
                        except Exception:
                            continue
                    if react_agent:
                        break
                except Exception:
                    continue

        # --- If a react_agent object was created, try to wrap / adapt it to be an executor ---
        if react_agent is not None:
            # Many LC versions return an AgentExecutor-like object directly; use it as-is.
            agent_executor = react_agent
            logger.info("✅ Tool-calling agent initialized successfully (using detected agent object)")
        else:
            # --- FINAL FALLBACK: Build a small, safe tool-calling adapter that won't crash the app ---
            # This fallback provides minimal tool-calling by matching tool names in the user query.
            logger.warning("All agent factories failed. Falling back to minimal tool-calling adapter.")

            # Build a name -> callable mapping from tools (they might be bare functions or Tool-like)
            tool_map = {}
            for t in tools or []:
                try:
                    # If it's a LangChain Tool object with .name and .run
                    name = getattr(t, "name", None) or getattr(t, "__name__", None) or str(t)
                    call_fn = getattr(t, "run", None) or t
                    tool_map[name.lower()] = call_fn
                except Exception:
                    continue

            class MinimalToolAgent:
                """
                A minimal adapter that implements .invoke and .run so existing call-sites work.
                Heuristic behavior:
                - If query mentions a tool name, call that tool with the whole query (or extracted argument).
                - Otherwise, ask the LLM (react_llm) to answer directly (no tools).
                """
                def __init__(self, llm, tools_map, default_prompt=None):
                    self.llm = llm
                    self.tools_map = tools_map
                    self.default_prompt = default_prompt

                # def _find_tool_for_query(self, query_text: str):
                #     q = query_text.lower()
                #     # exact name match or contained name (prefers longer names)
                #     best = None
                #     for name in sorted(self.tools_map.keys(), key=lambda x: -len(x)):
                #         if name in q:
                #             best = name
                #             break
                #     return best

                # =============================================================
                # ENHANCED TOOL FINDING WITH HEURISTICS
                # =============================================================

                def _find_tool_for_query(self, query_text: str):
                    q = query_text.lower()
                    # exact name match or contained name (prefers longer names)
                    best = None
                    for name in sorted(self.tools_map.keys(), key=lambda x: -len(x)):
                        if name in q:
                            best = name
                            break
                    # Additional heuristic: if user asks about 'price', 'current price', 'trading at', map to get_current_price
                    if not best:
                        if re.search(r'\b(price|current price|trading at|cmp|share price|stock price)\b', q):
                            # prefer tool named like get_current_price if available
                            for candidate in ("get_current_price", "current_price", "price", "price_lookup"):
                                if candidate in self.tools_map:
                                    best = candidate
                                    break
                            # final fallback: if wrapper function added without specific name, attempt to find a callable that returns dict with 'price'
                            if not best:
                                for nm, fn in self.tools_map.items():
                                    try:
                                        # quick probe: don't actually call, but match name heuristics
                                        if "price" in nm:
                                            best = nm
                                            break
                                    except Exception:
                                        continue
                    return best


                def invoke(self, payload):
                    # accept {'input': "..."} or a list of messages (compat)
                    try:
                        if isinstance(payload, dict) and "input" in payload:
                            query_text = payload["input"]
                        elif isinstance(payload, (list, tuple)):
                            # try to convert list messages to a single text
                            query_text = " ".join([m.content if hasattr(m, "content") else str(m) for m in payload])
                        else:
                            query_text = str(payload)
                    except Exception:
                        query_text = str(payload)

                    tool_name = self._find_tool_for_query(query_text)
                    if tool_name:
                        fn = self.tools_map.get(tool_name)
                        try:
                            # Call tool function; many tools accept a single string argument
                            result = fn(query_text)
                        except TypeError:
                            try:
                                result = fn(query_text, None)
                            except Exception as e:
                                result = f"Tool call failed: {e}"
                        return {"output": str(result), "intermediate_steps": [(tool_name, str(result))]}
                    else:
                        # fallback: ask the LLM
                        try:
                            from langchain_core.messages import HumanMessage
                            resp = self.llm.invoke([HumanMessage(content=query_text)])
                            text = getattr(resp, "content", str(resp))
                            return {"output": str(text), "intermediate_steps": []}
                        except Exception as e:
                            return {"output": f"LLM fallback failed: {e}", "intermediate_steps": []}

                def run(self, query_text: str):
                    return self.invoke({"input": query_text}).get("output", "")

            agent_executor = MinimalToolAgent(react_llm, tool_map, default_prompt=prompt)
            logger.info("✅ Minimal tool-calling adapter initialized as agent_executor (fallback)")

    except Exception as e:
        logger.error(f"Failed to initialize tool-calling/ReAct agent: {e}")
        logger.info("Agent features will be disabled (agent_executor = None) but chat remains available.")
        agent_executor = None
else:
    logger.warning("ReAct LLM not available, agent will not be initialized")

# ==================== CORE ADVISOR FUNCTIONS (ENHANCED) ====================

def _invoke_agent_executor(agent_exec, user_query: str) -> Dict[str, Any]:
    """
    Helper to invoke agent executor in a backwards/forwards compatible way.
    Returns a dict-like result with keys 'output' and optionally 'intermediate_steps'.
    """
    try:
        # Preferred: agent_executor.invoke accepts a dict input in new API
        if hasattr(agent_exec, "invoke"):
            # Some AgentExecutors return structured objects; normalize to dict
            raw = agent_exec.invoke({"input": user_query})
            # If raw is a string, normalize
            if isinstance(raw, str):
                return {"output": raw, "intermediate_steps": []}
            # If raw is a mapping-like object or has get
            try:
                return {
                    "output": raw.get("output", raw.get("text", str(raw))),
                    "intermediate_steps": raw.get("intermediate_steps", [])
                }
            except Exception:
                return {"output": str(raw), "intermediate_steps": []}

        # Fallback: agent_executor.run(query)
        elif hasattr(agent_exec, "run"):
            raw = agent_exec.run(user_query)
            if isinstance(raw, str):
                return {"output": raw, "intermediate_steps": []}
            else:
                return {"output": str(raw), "intermediate_steps": []}

        else:
            raise RuntimeError("Agent executor has no invoke or run method")
    except Exception as ex:
        # Bubble up exception to caller to handle logging/returns
        raise


def get_agent_research(user_query: str, session_id: str = 'default') -> Dict[str, Any]:
    """
    Use ReAct agent to research the query using available tools.
    """
    if not agent_executor:
        logger.warning("ReAct / tool-calling agent not available, skipping research")
        return {
            'success': False,
            'output': '',
            'error': 'Agent not initialized',
            'intermediate_steps': []
        }

    try:
        logger.info(f"[{session_id}] Starting research for query: {user_query[:100]}...")

        # Invoke agent using compatibility helper
        result = _invoke_agent_executor(agent_executor, user_query)

        return {
            'success': True,
            'output': result.get("output", ""),
            'intermediate_steps': result.get("intermediate_steps", []),
            'error': None
        }

    except Exception as e:
        logger.error(f"[{session_id}] Research failed: {e}")
        return {
            'success': False,
            'output': '',
            'error': str(e),
            'intermediate_steps': []
        }


def chat_with_advisor(
    query: str,
    research_context: str = '',
    session_id: str = 'default'
) -> str:
    """
    Send a query to the financial advisor with optional research context.
    Uses fallback LLM (Groq or HuggingFace).
    """
    # Input validation (LEGACY)
    if not query or not isinstance(query, str):
        return "Error: Invalid query provided"

    if len(query.strip()) == 0:
        return "Error: Empty query provided"

    # Limit query length (LEGACY)
    if len(query) > 5000:
        return "Error: Query too long. Please limit to 5000 characters."

    try:
        # Get or create chat session (UPDATED for message history)
        chat_history = get_or_create_chat_session(session_id)

        # ENHANCED - Format message with better structure
        if research_context:
            message = f"""RESEARCH DATA FROM TOOLS:
{research_context}

USER QUESTION:
{query}

Please provide a comprehensive financial advisory response based on the research data above and your expertise. Cite specific numbers and data points from the research when making recommendations."""
        else:
            message = query

        logger.info(f"[{session_id}] Processing advisory query: {query[:100]}...")

        # Build messages for LLM
        from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
        
        messages = [SystemMessage(content=FINANCIAL_ADVISOR_INSTRUCTION)]
        
        # Add chat history
        for msg in chat_history:
            if msg['role'] == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                messages.append(AIMessage(content=msg['content']))
        
        # Add current message
        messages.append(HumanMessage(content=message))

        # Send to active LLM (Groq or HuggingFace)
        response = groq_chat_llm.invoke(messages)

        if not response or not hasattr(response, 'content') or not response.content:
            raise ValueError("Empty or invalid response from LLM")

        response_text = str(response.content)

        # Update chat history
        chat_history.append({'role': 'user', 'content': message})
        chat_history.append({'role': 'assistant', 'content': response_text})

        # NEW - ADDED: Update session metadata
        if session_id in session_metadata:
            session_metadata[session_id]['message_count'] += 1
            session_metadata[session_id]['last_activity'] = datetime.now().isoformat()

        logger.info(f"[{session_id}] Successfully generated advisory response using {ACTIVE_LLM_PROVIDER}")
        return response_text

    except Exception as e:
        logger.warning(f"[{session_id}] Primary request failed: {e}")

        # LEGACY - Session recovery mechanism
        try:
            logger.info(f"[{session_id}] Attempting session recovery")
            clear_chat_session(session_id)
            new_history = get_or_create_chat_session(session_id)
            
            from langchain_core.messages import SystemMessage, HumanMessage
            messages = [
                SystemMessage(content=FINANCIAL_ADVISOR_INSTRUCTION),
                HumanMessage(content=message)
            ]
            
            response = groq_chat_llm.invoke(messages)

            if not response or not hasattr(response, 'content') or not response.content:
                raise ValueError("Empty or invalid response from LLM on retry")

            response_text = str(response.content)
            
            # Update new history
            new_history.append({'role': 'user', 'content': message})
            new_history.append({'role': 'assistant', 'content': response_text})

            logger.info(f"[{session_id}] Session recovery successful")
            return response_text

        except Exception as retry_error:
            logger.error(f"[{session_id}] Session recovery failed: {retry_error}")
            return f"I apologize, but I'm experiencing technical difficulties. Please try again in a moment. Error: {str(retry_error)}"


# ============================================================================================================================================================
# ENHANCED - CONSOLIDATED FUNCTION REPLACES THE BELOW LEGACY FUNCTION.
# ============================================================================================================================================================
def classify_query_with_ai(user_query: str) -> Dict[str, Any]:
    """
    Use active LLM to intelligently classify if a query needs research tools.
    """
    try:
        classification_prompt = f"""You are a query classifier for a financial advisory chatbot.

Analyze this user query and determine if it needs REAL-TIME DATA from tools (like stock prices, company info, historical data) or if it's a CONCEPTUAL question that can be answered from knowledge alone.

User Query: "{user_query}"

Classification Rules:
1. NEEDS RESEARCH (needs_research: true) - If query asks for:
   - Current/live stock prices, market data
   - Specific company information, financials, PE ratios
   - Historical performance, returns calculation
   - Investment analysis for specific stocks/companies
   - Comparison between specific stocks
   - "Should I invest in [specific company]?"

2. CONCEPTUAL (needs_research: false) - If query asks for:
   - Explanations of financial concepts (SIP, mutual funds, bonds, etc.)
   - General advice on budgeting, saving, planning
   - How-to guides, step-by-step processes
   - Differences between concepts (not specific companies)
   - General investment strategies
   - Tax planning concepts

Respond in this EXACT JSON format (no extra text):
{{
    "needs_research": true/false,
    "query_type": "research-based" or "conceptual",
    "reasoning": "brief 1-line explanation"
}}"""

        # Quick classification using fast model
        classifier_llm = initialize_llm_with_fallback(
            temperature=0, 
            max_tokens=100,
            model_override="llama-3.1-8b-instant"  # Ultra-fast classification
        )

        from langchain_core.messages import HumanMessage
        response = classifier_llm.invoke([HumanMessage(content=classification_prompt)])

        # Parse JSON response
        import json
        result = json.loads(response.content)

        logger.info(f"Query classified: {result['query_type']} - {result['reasoning']}")
        return result

    except Exception as e:
        logger.error(f"Classification failed: {e}, defaulting to research mode")
        # FALLBACK: If classification fails, default to using research (safer)
        return {
            'needs_research': True,
            'query_type': 'research-based',
            'reasoning': 'Classification error, using research as fallback'
        }

def get_comprehensive_financial_advice(
    user_query: str,
    session_id: str = 'default',
    use_research: bool = True
) -> Dict[str, Any]:

    start_time = datetime.now()

    # Step 0 — Classification
    if use_research:
        classification = classify_query_with_ai(user_query)
        should_use_research = classification['needs_research']
        query_type = classification['query_type']
        classification_reasoning = classification['reasoning']
    else:
        should_use_research = False
        query_type = 'conceptual'
        classification_reasoning = 'Research disabled by user'

    logger.info(f"[{session_id}] Query type: {query_type}")
    logger.info(f"[{session_id}] Should use research: {should_use_research}")
    logger.info(f"[{session_id}] Reasoning: {classification_reasoning}")

    # STEP 1 — Research Phase (correct position)
    research_context = ""
    research_results = {}

    if should_use_research and agent_executor:
        logger.info(f"[{session_id}] Phase 1: Conducting research")
        research_results = get_agent_research(user_query, session_id)

        if research_results.get("success"):
            raw = research_results.get("output", "")

            # Format dict → readable text
            if isinstance(raw, dict):
                research_context = "\n".join([f"{k}: {v}" for k, v in raw.items()])
            elif isinstance(raw, str):
                research_context = raw
            else:
                research_context = str(raw)

            logger.info(f"[{session_id}] Formatted research context: {research_context}")
            logger.info(f"[{session_id}] Research completed successfully")
        else:
            logger.warning(f"[{session_id}] Research failed, proceeding without it")

    else:
        logger.info(f"[{session_id}] Skipping research phase")

    # STEP 2 — Advisory LLM using research context
    logger.info(f"[{session_id}] Phase 2: Generating financial advice using {ACTIVE_LLM_PROVIDER}")
    advisory_response = chat_with_advisor(user_query, research_context, session_id)

    processing_time = (datetime.now() - start_time).total_seconds()

    return {
        "advice": advisory_response,
        "research_used": should_use_research,
        "query_type": query_type,
        "processing_time": processing_time,
        "research_context": research_context,
        "raw_research": research_results
    }


    # Construct comprehensive response (ENHANCED)
    response = {
        'session_id': session_id,
        'query': user_query,
        'advice': advisory_response,
        'research_used': should_use_research and research_results.get('success', False),
        'research_skipped': not should_use_research,  # NEW - ADDED
        'query_type': query_type,  # NEW - ADDED (AI-determined)
        'classification_reasoning': classification_reasoning if use_research else None,  # NEW - ADDED
        'research_output': research_context if research_results.get('success') else None,
        'processing_time_seconds': round(processing_time, 2),
        'timestamp': datetime.now().isoformat(),
        'llm_provider': ACTIVE_LLM_PROVIDER,  # NEW - ADDED
        'llm_key_index': ACTIVE_KEY_INDEX,  # NEW - ADDED
        'error': research_results.get('error') if not research_results.get('success') else None
    }

    logger.info(f"[{session_id}] Completed in {processing_time:.2f}s using {ACTIVE_LLM_PROVIDER}")
    return response


# ==================== LEGACY COMPATIBILITY FUNCTIONS ====================

def get_agent_response(user_input: str) -> str:
    """
    LEGACY FUNCTION - Maintained for backward compatibility with agent.py
    """
    if not agent_executor:
        return "Agent not available. Please check configuration."

    try:
        result = _invoke_agent_executor(agent_executor, user_input)
        return result.get("output", "No response generated")
    except Exception as e:
        logger.error(f"Agent response error: {e}")
        return f"Sorry, I encountered an error: {str(e)}"


def jgaad_chat_with_gemini(query: str, research: str = '', session_id: str = 'default') -> str:
    """
    LEGACY FUNCTION - Maintained for backward compatibility with jgaad_ai_agent_backup.py
    (Now uses Groq/HF instead of Gemini)
    """
    return chat_with_advisor(query, research, session_id)


# ==================== COMMAND LINE INTERFACE (LEGACY + ENHANCED) ====================

def run_cli():
    """
    Run the advisor from command line.
    """
    if len(sys.argv) > 1:
        # Get query from command line arguments (LEGACY)
        query = ' '.join(sys.argv[1:])

        # Check for flags (NEW - ADDED)
        use_research = '--no-research' not in sys.argv
        session_id = 'cli_session'

        logger.info(f"Processing CLI query: {query}")

        # Get comprehensive advice (NEW - ADDED)
        result = get_comprehensive_financial_advice(
            query,
            session_id=session_id,
            use_research=use_research
        )

        # ENHANCED - Better output formatting
        print("\n" + "="*80)
        print("FINEDGE AI FINANCIAL ADVISOR")
        print("="*80)
        print(f"\nQuery: {query}")
        print(f"\nLLM Provider: {result['llm_provider']} (Key #{result['llm_key_index']})")
        print(f"Processing Time: {result['processing_time_seconds']}s")

        if result['research_used']:
            print(f"\n{'─'*80}")
            print("RESEARCH FINDINGS:")
            print(f"{'─'*80}")
            print(result['research_output'])

        print(f"\n{'─'*80}")
        print("FINANCIAL ADVICE:")
        print(f"{'─'*80}")

        # Output in legacy format for app.py compatibility
        print(f"<Response>{result['advice']}</Response>")

        print("\n" + "="*80)

    else:
        # ENHANCED - Better help message
        print("\n" + "="*80)
        print("FinEdge AI Financial Advisor - Command Line Interface")
        print("="*80)
        print("\nUsage:")
        print("  python ai_financial_advisor.py <your question>")
        print("\nOptions:")
        print("  --no-research    Skip tool-based research, direct chat only")
        print("  --test          Run test suite")
        print("\nExamples:")
        print("  python ai_financial_advisor.py Should I invest in Cipla pharmaceuticals?")
        print("  python ai_financial_advisor.py What is the current price of Reliance?")
        print("  python ai_financial_advisor.py --no-research Tell me about SIP investing")
        print("\nAPI Keys:")
        print("  The system will try GROQ_API_KEY_1, _2, _3, then HF_TOKEN_1, _2, _3")
        print(f"  Currently using: {ACTIVE_LLM_PROVIDER or 'None'} (Key #{ACTIVE_KEY_INDEX or 'N/A'})")
        print("="*80 + "\n")


# ==================== TESTING SUITE (ENHANCED) ====================

def run_tests():
    """
    NEW - ADDED: Comprehensive testing suite
    """
    print("\n" + "="*80)
    print("FINEDGE AI FINANCIAL ADVISOR - TEST SUITE")
    print("="*80)
    print(f"\nActive LLM Provider: {ACTIVE_LLM_PROVIDER} (Key #{ACTIVE_KEY_INDEX})")
    print("="*80)

    test_session = "test_session_" + datetime.now().strftime("%Y%m%d_%H%M%S")

    # Test 1: Basic chat without research
    print("\n[TEST 1] Basic chat without research...")
    try:
        response = chat_with_advisor(
            "What is a mutual fund?",
            session_id=test_session
        )
        print(f"✓ Success: {response[:100]}...")
    except Exception as e:
        print(f"✗ Failed: {e}")

    # Test 2: Research-based query
    print("\n[TEST 2] Research-based financial query...")
    try:
        result = get_comprehensive_financial_advice(
            "What is the current price of Reliance Industries?",
            session_id=test_session,
            use_research=True
        )
        print(f"✓ Success: Research used: {result['research_used']}")
        print(f"  Advice length: {len(result['advice'])} chars")
        print(f"  Provider: {result['llm_provider']}")
    except Exception as e:
        print(f"✗ Failed: {e}")

    # Test 3: Session management
    print("\n[TEST 3] Session management...")
    try:
        history = get_chat_history(test_session)
        print(f"✓ Chat history: {len(history)} messages")

        session_info = get_session_info(test_session)
        print(f"✓ Session info: {session_info}")

        active_sessions = get_active_sessions()
        print(f"✓ Active sessions: {len(active_sessions)}")

        cleared = clear_chat_session(test_session)
        print(f"✓ Session cleared: {cleared}")
    except Exception as e:
        print(f"✗ Failed: {e}")

    # Test 4: Agent-only response (legacy compatibility)
    print("\n[TEST 4] Legacy agent response...")
    try:
        response = get_agent_response("What is 2+2?")
        print(f"✓ Success: {response}")
    except Exception as e:
        print(f"✗ Failed: {e}")

    # Test 5: Provider info
    print("\n[TEST 5] Active provider information...")
    try:
        provider_info = get_active_provider_info()
        print(f"✓ Provider: {provider_info['provider']}")
        print(f"✓ Key Index: {provider_info['key_index']}")
        print(f"✓ Status: {provider_info['status']}")
    except Exception as e:
        print(f"✗ Failed: {e}")

    print("\n" + "="*80)
    print("TEST SUITE COMPLETED")
    print("="*80 + "\n")


# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    # Check if --test flag is provided (NEW - ADDED)
    if '--test' in sys.argv:
        run_tests()
    else:
        run_cli()
