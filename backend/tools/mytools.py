from datetime import datetime
import datetime as dt

try:
    from langchain_core.tools import tool
except ImportError:
    from langchain.agents import tool

from dotenv import load_dotenv
import os
import logging

logger = logging.getLogger(__name__)
load_dotenv()

# ======================================== BASIC TOOLS ========================================
@tool
def check_system_time(format: str = "%Y-%m-%d %H:%M:%S"):
    """Returns the current indian date and time in the specified format"""
    current_time = dt.datetime.now()
    formatted_time = current_time.strftime(format)
    return formatted_time

@tool
def add(a: int, b: int) -> int:
    """Adds two numbers together"""
    return a + b

@tool
def subtract(a: int, b: int) -> int:
    """Subtracts the second number from the first number"""
    return a - b

@tool
def multiply(a: int, b: int) -> int:
    """Multiplies two numbers together"""
    return a * b

@tool
def divide(a: int, b: int) -> float:
    """Divides the first number by the second number"""
    return a / b

@tool
def power(a: int, b: int) -> int:
    """Raises the first number to the power of the second number"""
    return a ** b

# ======================================== USEFUL TOOLS ========================================
from langchain_core.tools import Tool
from langchain_experimental.utilities import PythonREPL
from langchain_community.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()
python_repl = PythonREPL()

repl_tool = Tool(
    name="python_repl",
    description="A Python shell. Use this to execute python commands. Input should be a valid python command. If you want to see the output of a value, you should print it out with `print(...)`.",
    func=python_repl.run,
)

# ======================================== FINANCE TOOLS ========================================
import yfinance as yf
from typing import List, Dict
import requests
import json
from pathlib import Path

def get_ticker_from_company(company_name: str) -> str:
    """
    Get the stock ticker symbol for a given company name.
    Enhanced with Indian market support.
    """
    # Extended mapping for Indian stocks
    INDIAN_STOCK_MAP = {
        "adani green energy": "ADANIGREEN.NS",
        "adani green": "ADANIGREEN.NS",
        "adanigreen": "ADANIGREEN.NS",
        "reliance": "RELIANCE.NS",
        "reliance industries": "RELIANCE.NS",
        "tcs": "TCS.NS",
        "hdfc bank": "HDFCBANK.NS",
        "hdfcbank": "HDFCBANK.NS",
        "infosys": "INFY.NS",
        "infy": "INFY.NS",
        "wipro": "WIPRO.NS",
        "icici bank": "ICICIBANK.NS",
        "bharti airtel": "BHARTIARTL.NS",
        "airtel": "BHARTIARTL.NS",
        "sbi": "SBIN.NS",
        "state bank": "SBIN.NS",
        "itc": "ITC.NS",
        "larsen": "LT.NS",
        "l&t": "LT.NS",
        "asian paints": "ASIANPAINT.NS",
        "maruti": "MARUTI.NS",
        "bajaj finance": "BAJFINANCE.NS",
        "titan": "TITAN.NS",
        "sensex": "^BSESN",
        "nifty": "^NSEI",
        "nifty 50": "^NSEI",
        "bank nifty": "^NSEBANK"
    }
    
    # Check Indian stock map first
    normalized = company_name.strip().lower()
    if normalized in INDIAN_STOCK_MAP:
        return INDIAN_STOCK_MAP[normalized]
    
    # Try Yahoo Finance API
    base_url = f"https://query1.finance.yahoo.com/v1/finance/search?q={company_name}&lang=en-US&region=US&quotesCount=5&newsCount=3&listsCount=2&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true&enableResearchReports=true&enableCulturalAssets=true&enableLogoUrl=true&enableLists=false&recommendCount=5"
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://finance.yahoo.com/',
        'Origin': 'https://finance.yahoo.com'
    }
    
    try:
        response = requests.get(base_url, headers=headers, timeout=5)
        data = response.json()
        symbol = data['quotes'][0]['symbol']
        return symbol
    except:
        # Final fallback: append .NS for Indian stocks
        return f"{company_name.upper().replace(' ', '')}.NS"

# 1. Fetch Historical Data
@tool
def get_historical_price(inputs: str) -> str:
    """
    Fetch historical stock prices for a given company over a specified date range.
    Args:
        inputs (str): A string containing the company name, start date, and duration (comma separated).
                     Format: "company_name, YYYY-MM-DD, number_of_days"
    Returns:
        str: A string representation of the historical stock prices.
    """
    try:
        company_name, start_date, duration = inputs.split(",")
        company_name = company_name.strip()
        start_date = start_date.strip()
        duration = duration.strip()
        
        end_date = dt.datetime.strptime(start_date, "%Y-%m-%d") + dt.timedelta(days=int(duration))
        ticker = get_ticker_from_company(company_name)
        stock = yf.Ticker(ticker)
        data = stock.history(start=start_date, end=end_date.strftime("%Y-%m-%d"))
        
        if data.empty:
            return f"No historical data available for {company_name} ({ticker})"
        
        values = {}
        for key, value in data["Close"].items():
            date = str(key).split(" ")[0]
            values[date] = f'{value:.2f}'
        
        return str(values)
    except Exception as e:
        return f"Error fetching historical data: {str(e)}"

# 2. Get Current Price - FIXED AND UNCOMMENTED
@tool
def get_current_price(company_name: str) -> str:
    """
    Get the current/latest price of a stock or market index.
    Works for stocks, Sensex, Nifty, and other indices.
    
    Args:
        company_name (str): The name of the company or index (e.g., 'Reliance', 'Sensex', 'Nifty')
    
    Returns:
        str: JSON string with price data or error message
    """
    try:
        if not company_name:
            return json.dumps({"error": "Empty company name"})
        
        # Resolve to ticker
        symbol = get_ticker_from_company(company_name)
        logger.info(f"Fetching price for {company_name} → {symbol}")
        
        # Fetch using yfinance
        stock = yf.Ticker(symbol)
        
        # Try multiple price sources
        info = {}
        try:
            info = stock.info or {}
        except Exception as e:
            logger.warning(f"stock.info failed: {e}")
            info = {}
        
        # Try to get current price
        price = info.get("regularMarketPrice") or info.get("currentPrice")
        
        # Fallback 1: Use recent history
        if price is None:
            hist = stock.history(period="1d", interval="1m")
            if hist is not None and not hist.empty:
                price = float(hist["Close"].iloc[-1])
            else:
                # Fallback 2: Use 5-day history (last close)
                hist = stock.history(period="5d")
                if hist is not None and not hist.empty:
                    price = float(hist["Close"].iloc[-1])
        
        # Fallback 3: Use previousClose
        if price is None:
            price = info.get("previousClose") or info.get("regularMarketPreviousClose")
        
        if price is None:
            return json.dumps({
                "error": f"No price data available for {company_name} ({symbol}). Market might be closed or symbol invalid.",
                "symbol": symbol
            })
        
        # Calculate metrics
        currency = info.get("currency") or "INR"
        prev_close = info.get("previousClose")
        change = None
        change_pct = None
        
        if prev_close is not None:
            try:
                change = float(price) - float(prev_close)
                change_pct = round((change / float(prev_close)) * 100, 2) if float(prev_close) != 0 else None
            except Exception:
                change = None
                change_pct = None
        
        # result = {
        #     "symbol": symbol,
        #     "price": round(float(price), 2),
        #     "previous_close": prev_close,
        #     "change": round(change, 2) if change else None,
        #     "change_percent": change_pct,
        #     "currency": currency,
        #     "52_week_low": info.get("fiftyTwoWeekLow"),
        #     "52_week_high": info.get("fiftyTwoWeekHigh"),
        #     "timestamp": dt.datetime.utcnow().isoformat()
        # }
        result = {
            "symbol": symbol,
            "price": round(float(price), 2),
            "previous_close": round(float(prev_close), 2) if prev_close else None,
            "change": round(change, 2) if change else None,
            "change_percent": change_pct,
            "currency": currency,
            "52_week_low": round(float(info.get("fiftyTwoWeekLow")), 2) if info.get("fiftyTwoWeekLow") else None,
            "52_week_high": round(float(info.get("fiftyTwoWeekHigh")), 2) if info.get("fiftyTwoWeekHigh") else None,
            "timestamp": dt.datetime.utcnow().isoformat()
        }

        
        logger.info(f"Successfully fetched price for {symbol}: {price}")
        return json.dumps(result)
        
    except Exception as e:
        logger.exception(f"get_current_price failed for {company_name}: {e}")
        return json.dumps({"error": str(e), "company": company_name})

# 3. Fetch Company Info
@tool
def get_company_info(company_name: str) -> str:
    """
    Retrieve company information for a given ticker.
    Args:
        company_name (str): The name of the company.
    Returns:
        str: A string representation of the company information.
    """
    try:
        ticker = get_ticker_from_company(company_name)
        stock = yf.Ticker(ticker)
        info = stock.info
        
        # Filter relevant info
        relevant_keys = ['longName', 'sector', 'industry', 'marketCap', 'currency', 
                        'previousClose', 'open', 'dayHigh', 'dayLow', 'fiftyTwoWeekHigh', 
                        'fiftyTwoWeekLow', 'volume', 'averageVolume']
        
        filtered_info = {k: info.get(k) for k in relevant_keys if k in info}
        return json.dumps(filtered_info, indent=2)
    except Exception as e:
        return json.dumps({"error": str(e)})

# 4. Calculate Returns
@tool
def evaluate_returns(inputs: str) -> str:
    """
    Calculate the percentage change in stock price over a duration from current date.
    Args:
        inputs (str): A string containing the company name and duration (comma separated).
                     Format: "company_name, duration" (e.g., "Reliance, 1M")
    Returns:
        str: A string representation of the percentage change in stock price.
    """
    try:
        company_name, duration = inputs.split(",")
        company_name = company_name.strip()
        duration = duration.strip()
        
        ticker = get_ticker_from_company(company_name)
        stock = yf.Ticker(ticker)
        data = stock.history(period=duration)
        
        if data.empty:
            return f"No data available for {company_name} for period {duration}"
        
        first_close = data['Close'].iloc[0]
        last_close = data['Close'].iloc[-1]
        percentage_change = ((last_close - first_close) / first_close * 100)
        
        return f"The stock price of {company_name} has changed by {percentage_change:.2f}% in the last {duration}"
    except Exception as e:
        return f"Error calculating returns: {str(e)}"

# ======================================== CONNECTION TOOLS ========================================

if __name__ == "__main__":
    # Test the tools
    print(get_current_price("Adani Green Energy"))
    print(get_current_price("Sensex"))
    print(get_current_price("Nifty"))








# # import datetime
# # from langchain.agents import tool
# # from dotenv import load_dotenv
# # import os

# # load_dotenv()
# # ✅ FIXED: Import tool from correct location for LangChain 1.x
# from datetime import datetime
# try:
#     from langchain_core.tools import tool
# except ImportError:
#     # Fallback for older versions
#     from langchain.agents import tool

# from dotenv import load_dotenv
# import os
# import logging
# logger = logging.getLogger(__name__)

# load_dotenv()


# # ======================================== BASIC TOOLS ========================================

# @tool
# def check_system_time(format: str = "%Y-%m-%d %H:%M:%S"):
#     """Returns the current indian date and time in the specified format"""

#     # get the current date and time
#     current_time = datetime.datetime.now()
    
#     # format the time as a string in the format "YYYY-MM-DD HH:MM:SS"
#     formatted_time = current_time.strftime(format)
    
#     # return the formatted time
#     return formatted_time

# @tool
# def add(a: int, b: int) -> int:
#     """Adds two numbers together"""
#     return a + b

# @tool
# def subtract(a: int, b: int) -> int:
#     """Subtracts the second number from the first number"""
#     return a - b

# @tool
# def multiply(a: int, b: int) -> int:
#     """Multiplies two numbers together"""
#     return a * b

# @tool
# def divide(a: int, b: int) -> float:
#     """Divides the first number by the second number"""
#     return a / b

# @tool
# def power(a: int, b: int) -> int:
#     """Raises the first number to the power of the second number"""
#     return a ** b


# # ======================================== USEFUL TOOLS ========================================
# from langchain_core.tools import Tool
# from langchain_experimental.utilities import PythonREPL
# from langchain_community.tools import DuckDuckGoSearchRun

# search = DuckDuckGoSearchRun()

# python_repl = PythonREPL()
# repl_tool = Tool(
#     name="python_repl",
#     description="A Python shell. Use this to execute python commands. Input should be a valid python command. If you want to see the output of a value, you should print it out with `print(...)`.",
#     func=python_repl.run,
# )

# # ======================================== FINANCE TOOLS ========================================
# import yfinance as yf
# from typing import List, Dict
# import requests
# import json
# from pathlib import Path

# def get_ticker_from_company(company_name: str) -> str:
#     """
#     Get the stock ticker symbol for a given company name.

#     Args:
#         company_name (str): The name of the company.

#     Returns:
#         str: The stock ticker symbol.
#     """
#     base_url = f"https://query1.finance.yahoo.com/v1/finance/search?q={company_name}&lang=en-US&region=US&quotesCount=5&newsCount=3&listsCount=2&enableFuzzyQuery=false&quotesQueryId=tss_match_phrase_query&multiQuoteQueryId=multi_quote_single_token_query&newsQueryId=news_cie_vespa&enableCb=true&enableNavLinks=true&enableEnhancedTrivialQuery=true&enableResearchReports=true&enableCulturalAssets=true&enableLogoUrl=true&enableLists=false&recommendCount=5"
    
#     headers = {
#         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
#         'Accept': 'application/json, text/plain, */*',
#         'Accept-Language': 'en-US,en;q=0.9',
#         'Referer': 'https://finance.yahoo.com/',
#         'Origin': 'https://finance.yahoo.com'
#     }
    
#     response = requests.get(base_url, headers=headers)
#     data = response.json()
#     try:
#         symbol = data['quotes'][0]['symbol']
#     except:
#         raise Exception("Company name not found, try again by providing a valid company name.")
#     return symbol

# # 1. Fetch Historical Data
# @tool
# def get_historical_price(inputs: str) -> str:
#     """
#     Fetch historical stock prices for a given company over a specified date range.

#     Args:
#         inputs (str): A string containing the company name(The name of the company), start date(Start date in the format 'YYYY-MM-DD'), and duration(number of days to fetch the data for) max 30 days.

#     Returns:
#         str: A string representation of the historical stock prices.
#     """
#     try:
#         company_name, start_date, duration = inputs.split(",")
#         company_name = company_name.strip()
#         start_date = start_date.strip()
#         duration = duration.strip()
#         end_date = datetime.datetime.strptime(start_date, "%Y-%m-%d") + datetime.timedelta(days=int(duration))
#         ticker = get_ticker_from_company(company_name)
#         stock = yf.Ticker(ticker)
#         data = stock.history(start=start_date, end=end_date.strftime("%Y-%m-%d").split(" ")[0])

#         values = {}
#         for key, value in data["Close"].items():
#             # Extract the date portion from the key
#             date = str(key).split(" ")[0]
#             values[date] = f'{value:.2f}'

#         print("\nStock Prices (RPOWER.NS):")
#         print("-" * 30)
#         print("Date          | Price (INR)")
#         print("-" * 30)
#         for date, price in values.items():
#             print(f"{date} | {price:>8}")
#         print("-" * 30)

#         return str(values)
#     except Exception as e:
#         return str(e)

# # 2. Get Current Price
# # @tool
# # def get_current_price(company_name: str) -> str:
# #     """
# #     Get the current price of a stock.

# #     Args:
# #         company_name (str): The name of the company.

# #     Returns:
# #         str: The current price of the stock.
# #     """
# #     try:
# #         symbol = get_ticker_from_company(company_name)
# #         stock = yf.Ticker(symbol)
# #         hist = stock.history(period='1d')
# #         if not hist.empty:
# #             return f"{hist['Close'].iloc[-1]:.2f}"
# #         return 'No data available'
# #     except Exception as e:
# #         return str(e)
# # new robust get_current_price in tools/mytools.py
# # @tool
# # def get_current_price(company_name: str) -> str:
# #     """
# #     Robust current price tool:
# #     - Accepts company name or ticker.
# #     - Resolves to a ticker using get_ticker_from_company (your existing helper).
# #     - Uses yfinance to fetch current price and metadata.
# #     - Returns a JSON string with symbol, price (float), currency, timestamp (ISO) or {"error": "..."}.
# #     """
# #     import json
# #     try:
# #         if not company_name:
# #             return json.dumps({"error": "Empty company_name"})

# #         # resolve to ticker (your existing helper function)
# #         symbol = get_ticker_from_company(company_name)

# #         # fetch using yfinance
# #         stock = yf.Ticker(symbol)

# #         # try best-effort price sources
# #         info = {}
# #         try:
# #             info = stock.info or {}
# #         except Exception:
# #             info = {}

# #         price = info.get("regularMarketPrice") or info.get("currentPrice")
# #         if price is None:
# #             # fallback: use intraday/last close
# #             hist = stock.history(period="1d", interval="1m")
# #             if hist is not None and not hist.empty:
# #                 price = float(hist["Close"].iloc[-1])
# #             else:
# #                 # fallback to previous close
# #                 price = info.get("previousClose") or info.get("regularMarketPreviousClose")

# #         if price is None:
# #             return json.dumps({"error": "No data available for ticker: " + str(symbol)})

# #         currency = info.get("currency") or "INR"
# #         prev_close = info.get("previousClose")
# #         change = None
# #         change_pct = None
# #         try:
# #             if prev_close is not None:
# #                 change = float(price) - float(prev_close)
# #                 change_pct = round((change / float(prev_close)) * 100, 2) if float(prev_close) != 0 else None
# #         except Exception:
# #             change = None
# #             change_pct = None

# #         out = {
# #             "symbol": symbol,
# #             "price": float(price),
# #             "previous_close": prev_close,
# #             "change": change,
# #             "change_percent": change_pct,
# #             "currency": currency,
# #             "timestamp": datetime.utcnow().isoformat()
# #         }
# #         return json.dumps(out)

# #     except Exception as e:
# #         import json, traceback
# #         logger.exception(f"get_current_price failed for {company_name}: {e}")
# #         return json.dumps({"error": str(e)})


# # 3. Fetch Company Info
# @tool
# def get_company_info(company_name: str) -> str:
#     """
#     Retrieve company information for a given ticker.

#     Args:
#         company_name (str): The name of the company.

#     Returns:
#         str: A string representation of the company information.
#     """
#     try:
#         ticker = get_ticker_from_company(company_name)
#         stock = yf.Ticker(ticker)
#         return str(stock.info)
#     except Exception as e:
#         return str(e)

# # 4. Calculate Returns
# @tool
# def evaluate_returns(inputs:str) -> str:
#     """
#     Calculate the percentage change in stock price over a duration from current date.

#     Args:
#         inputs (str): A string containing the company name and duration (comma separated).
#         The duration can be like '1M', '1W', '1D'. Max 1 month data can be fetched.

#     Returns:
#         str: A string representation of the percentage change in stock price.
#     """
#     try:
#         company_name, duration = inputs.split(",")
#         company_name = company_name.strip()
#         duration = duration.strip()

#         ticker = get_ticker_from_company(company_name)
#         stock = yf.Ticker(ticker)
#         data = stock.history(period=duration)
        
#         if data.empty:
#             return "No data available"
            
#         first_close = data['Close'].iloc[0]
#         last_close = data['Close'].iloc[-1]
#         percentage_change = ((last_close - first_close) / first_close * 100)
        
#         return f"The stock price of {company_name} has changed by {percentage_change:.2f}% in the last {duration}"
#     except Exception as e:
#         return str(e)

# # ======================================== CONNECTION TOOLS ========================================


# if __name__ == "__main__":
#     # print(get_historical_price("Reliance Industries, 2021-01-01, 30"))
#     # print(get_current_price("Reliance Industries"))
#     # print(get_company_info("Reliance Industries"))
#     # print(evaluate_returns("Reliance Industries, 1Y"))
#     # send_whatsapp_message("Hello, this is a test message from the tool.")
#     # schedule_task("Test Task, This is a test task, 14:40")
#     pass