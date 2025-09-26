# agent.py
import os
import re
import logging
import traceback
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.StreamHandler()
logger.addHandler(handler)

# Try to import optional dependencies (LangChain / Groq / Google GenAI)
LANGCHAIN_AVAILABLE = True
try:
    from langchain_groq import ChatGroq
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain import hub
except Exception as e:
    logger.info("LangChain/Groq/Google generative not available or failed to import. Falling back to simple agent.")
    LANGCHAIN_AVAILABLE = False

# Try to import optional finance helper (yfinance). If not available, we'll still run but without live prices.
YFINANCE_AVAILABLE = True
try:
    import yfinance as yf
except Exception:
    YFINANCE_AVAILABLE = False
    logger.info("yfinance not available. Price lookups will be disabled or return a friendly message.")

# Try to import user's tools if present; otherwise define lightweight stubs.
TOOL_IMPORT_OK = True
try:
    from tools.mytools import *  # optional: if user has custom tools
except Exception:
    TOOL_IMPORT_OK = False
    logger.info("tools.mytools not found — using local fallback tool stubs.")

    # minimal stubs (names expected by previous code). These are simple Python functions.
    def add(a, b):
        return a + b

    def subtract(a, b):
        return a - b

    def multiply(a, b):
        return a * b

    def divide(a, b):
        return a / b if b != 0 else None

    def power(a, b):
        return a ** b

    def search(query):
        return f"Search not available in this environment. You asked for: {query}"

    def repl_tool(code):
        return "repl not available"

    def get_historical_price(ticker, period='7d'):
        raise RuntimeError("No market data access")

    def get_current_price(ticker):
        raise RuntimeError("No market data access")

    def get_company_info(name):
        return {"error": "no company info available in fallback"}

    def schedule_task(*args, **kwargs):
        return "scheduling not available"

    def check_system_time():
        return datetime.utcnow().isoformat()


# A small mapping of common company names to yahoo tickers (expandable)
COMPANY_TO_TICKER = {
    "adani green": "ADANIGREEN.NS",
    "adani green energy": "ADANIGREEN.NS",
    "tata motors": "TATAMOTORS.NS",
    "tata consultancy services": "TCS.NS",
    "tcs": "TCS.NS",
    "reliance": "RELIANCE.NS",
    "hdfc bank": "HDFCBANK.NS",
    "infosys": "INFY.NS",
    "icici bank": "ICICIBANK.NS",
}

def normalize_company_name(name: str) -> str:
    n = name.lower().strip()
    # remove punctuation
    n = re.sub(r'[^\w\s]', '', n)
    return n

def resolve_ticker_from_name(name: str):
    n = normalize_company_name(name)
    if n in COMPANY_TO_TICKER:
        return COMPANY_TO_TICKER[n]
    # fallback: if user provided a ticker-like string, return it directly
    if re.match(r'^[A-Za-z\.\-]{1,10}(\.NS)?$', name.strip(), re.I):
        return name.strip().upper()
    return None


# Simple fallback agent that can answer a few finance related prompts (and otherwise echoes)
class SimpleAgent:
    def __init__(self):
        self.name = "simple-fallback-agent"

    def _get_current_price(self, ticker: str):
        if not YFINANCE_AVAILABLE:
            raise RuntimeError("yfinance not installed or no network access.")
        logger.info(f"Fetching current price for {ticker} via yfinance")
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="1d")
            if hist is None or hist.empty:
                # try using fast_info
                info = t.info if hasattr(t, "info") else {}
                return info.get("currentPrice") or info.get("previousClose") or None
            latest_close = hist['Close'].iloc[-1]
            return float(latest_close)
        except Exception as e:
            logger.warning(f"yfinance fetch failed: {e}")
            raise

    def _get_historical(self, ticker: str, days: int = 7):
        if not YFINANCE_AVAILABLE:
            raise RuntimeError("yfinance not installed or no network access.")
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period=f"{days+2}d")  # a bit extra
            if hist is None or hist.empty:
                return []
            # return date -> close
            rows = hist.tail(days)
            return [(str(idx.date()), float(r['Close'])) for idx, r in rows.iterrows()]
        except Exception as e:
            logger.warning(f"yfinance historic fetch failed: {e}")
            raise

    def run(self, user_input: str):
        user_input = (user_input or "").strip()
        low = user_input.lower()

        thought = "I will attempt to parse the user request and either fetch prices (if available) or respond with a helpful message."

        # stock price pattern
        m = re.search(r'stock price of (.+)', low)
        if m:
            company = m.group(1).strip()
            ticker = resolve_ticker_from_name(company)
            if not ticker:
                return {"thought": f"Could not resolve ticker for '{company}'.", "output": f"I couldn't find a ticker for '{company}'. Try a ticker like 'TCS.NS' or give full company name."}
            try:
                price = self._get_current_price(ticker)
                return {
                    "thought": f"Resolved '{company}' -> '{ticker}'. Queried current price.",
                    "output": f"Current price of {company.title()} ({ticker}) is ₹{price:.2f} (close)."
                }
            except Exception as e:
                return {
                    "thought": f"Attempted to fetch price for {ticker} but failed: {e}",
                    "output": f"Could not fetch live price for {company.title()} ({ticker}). Reason: {str(e)}. If you want live data, install `yfinance` and ensure network access."
                }

        # last week return
        m = re.search(r'last week return of (.+)', low)
        if m:
            company = m.group(1).strip()
            ticker = resolve_ticker_from_name(company)
            if not ticker:
                return {"thought": f"Could not resolve ticker for '{company}'.", "output": f"Couldn't find a ticker for '{company}'. Try again with ticker."}
            try:
                hist = self._get_historical(ticker, days=7)
                if len(hist) < 2:
                    return {"thought": "Historic data too small", "output": f"Not enough historical data to compute last week return for {company.title()} ({ticker})."}
                start_price = hist[0][1]
                end_price = hist[-1][1]
                pct = ((end_price - start_price) / start_price) * 100
                return {
                    "thought": f"Fetched {len(hist)} days of historical prices for {ticker}.",
                    "output": f"Return for last {len(hist)} trading days for {company.title()} ({ticker}): {pct:.2f}% (from ₹{start_price:.2f} to ₹{end_price:.2f})."
                }
            except Exception as e:
                return {"thought": f"Failed historic fetch: {e}", "output": f"Could not compute last week return for {company.title()} ({ticker}). Ensure yfinance + network or try again."}

        # last N days stock price
        m = re.search(r'last\s*(\d+)\s*days stock price of (.+)', low)
        if m:
            days = int(m.group(1))
            company = m.group(2).strip()
            ticker = resolve_ticker_from_name(company)
            if not ticker:
                return {"thought": f"Could not resolve ticker for '{company}'.", "output": f"Couldn't find a ticker for '{company}'."}
            try:
                hist = self._get_historical(ticker, days=days)
                if not hist:
                    return {"thought": "No historical data", "output": f"No historical data available for {company.title()} ({ticker})."}
                lines = [f"{d}: ₹{close:.2f}" for d, close in hist]
                return {"thought": f"Fetched {len(hist)} days for {ticker}", "output": "\n".join(lines)}
            except Exception as e:
                return {"thought": f"Historic fetch failed: {e}", "output": f"Could not fetch last {days} days for {company.title()} ({ticker})."}

        # If not any pattern, return a helpful fallback
        if low.strip() == "":
            return {"thought": "Empty query", "output": "Please send a question or a stock query like 'stock price of TCS'."}

        # generic fallback - echo + suggestion
        return {
            "thought": "Used fallback responder (no LLM).",
            "output": f"I understood: \"{user_input}\".\nI can fetch stock prices and simple metrics if `yfinance` is installed. Try queries like:\n- 'stock price of TCS'\n- 'last week return of tata motors'\n- 'last 3 days stock price of tcs'"
        }


# If LangChain is available, we attempt to create a more capable ReAct-style agent.
def create_improved_agent():
    if not LANGCHAIN_AVAILABLE:
        logger.info("LangChain not available, returning SimpleAgent instance.")
        return SimpleAgent()

    # If LangChain imports succeeded, try to construct the react agent (best effort)
    try:
        # Grab prompt from hub if possible
        try:
            prompt = hub.pull("hwchase17/react")
        except Exception:
            from langchain.prompts import PromptTemplate
            template = """Answer the following questions as best you can. You have access to the following tools:

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
            prompt = PromptTemplate.from_template(template)

        # pick a working LLM
        llm = None
        for factory in [
            lambda: ChatGroq(model="llama-3.1-70b-versatile", temperature=0.1),
            lambda: ChatGroq(model="mixtral-8x7b-32768", temperature=0.1),
            lambda: ChatGoogleGenerativeAI(model="gemini-2.5-pro", temperature=0.1)
        ]:
            try:
                llm = factory()
                logger.info(f"Initialized LLM: {llm}")
                break
            except Exception as e:
                logger.warning(f"LLM init failed: {e}")
                continue

        if llm is None:
            logger.warning("No LLM could be initialized — falling back to SimpleAgent.")
            return SimpleAgent()

        # Build tools list if available (we use stubs / imported tools)
        tools = []
        # if tools were defined in tools.mytools they will be available in globals
        possible_tools = ['add', 'subtract', 'multiply', 'divide', 'power', 'search',
                          'repl_tool', 'get_historical_price', 'get_current_price',
                          'get_company_info', 'schedule_task', 'check_system_time']
        for tname in possible_tools:
            if tname in globals():
                fn = globals()[tname]
                # create a minimal tool description object expected by langchain
                try:
                    tools.append({"name": tname, "description": fn.__doc__ or f"{tname} tool", "func": fn})
                except Exception:
                    pass

        # try to create the react agent; if fails, fallback gracefully
        try:
            # langchain.create_react_agent expects different shapes depending on versions;
            # use create_react_agent(llm, tools, prompt) if available.
            agent = create_react_agent(llm, tools, prompt)
            agent_exec = AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)
            return agent_exec
        except Exception as e:
            logger.warning(f"Failed to create React agent: {e}\n{traceback.format_exc()}")
            return SimpleAgent()

    except Exception as exc:
        logger.exception("Unhandled error when creating improved agent, falling back to SimpleAgent.")
        return SimpleAgent()


def get_agent_response(user_input: str, max_retries: int = 2):
    """
    Returns a dict with keys:
      - thought: a short string describing what the agent did
      - output: the final answer text (string)

    This function will:
     - try to create a LangChain-based agent if possible
     - else use SimpleAgent
    """
    try:
        agent = create_improved_agent()
        # If agent has 'run' use it; if it has 'invoke' try that; if it's an AgentExecutor, prefer .run.
        if hasattr(agent, "run") and callable(agent.run):
            try:
                res = agent.run(user_input)
                # If LangChain AgentExecutor returns a dict-like or string, normalize:
                if isinstance(res, dict):
                    return {"thought": res.get("thought", ""), "output": res.get("output", str(res))}
                else:
                    # sometimes .run returns a string
                    return {"thought": "LLM agent produced an answer.", "output": str(res)}
            except Exception as e:
                logger.warning(f"agent.run failed: {e}")
                # if it's an AgentExecutor with .invoke, try invoke
                if hasattr(agent, "invoke") and callable(agent.invoke):
                    try:
                        inv = agent.invoke({"input": user_input})
                        # inv might be dict-like
                        if isinstance(inv, dict):
                            return {"thought": inv.get("thought", ""), "output": inv.get("output", str(inv))}
                        # if it's a scalar
                        return {"thought": "Agent invoke returned result.", "output": str(inv)}
                    except Exception as e2:
                        logger.warning(f"agent.invoke also failed: {e2}")
                # fallback: continue to fallback response below
        elif hasattr(agent, "invoke") and callable(agent.invoke):
            try:
                inv = agent.invoke({"input": user_input})
                if isinstance(inv, dict):
                    return {"thought": inv.get("thought", ""), "output": inv.get("output", str(inv))}
                return {"thought": "Agent invoke returned result.", "output": str(inv)}
            except Exception as e:
                logger.warning(f"agent.invoke failed: {e}")

        # If control reaches here, agent didn't return; try the simple fallback behavior
        # If agent is SimpleAgent, it should have returned above via .run, but we ensure double-check:
        if isinstance(agent, SimpleAgent):
            return agent.run(user_input)

        # Final fallback - echo
        return {"thought": "Fallback echo — something unexpected happened when calling the agent.", "output": f"I received: {user_input}"}

    except Exception as e:
        logger.exception("get_agent_response encountered an exception")
        return {"thought": "Internal server error while processing the request", "output": f"Sorry, an error occurred: {str(e)}"}
