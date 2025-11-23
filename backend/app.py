# ===========================================================================================================
#                                          MAIN BACKEND CODE - app.py
# ===========================================================================================================
# Standard library imports
import json
import logging
import os
import re
import subprocess
import sys
import time
from datetime import datetime
from flask import Flask, request, jsonify
from datetime import datetime, timedelta  # ✅ ADD timedelta
import logging
import requests  # ✅ ADD requests


# =================================================================================================================
# REMOVE THIS BLOCK OR MODIFY IT IF AGAIN SOMETHING BREAKS IN DEPLOTMENT
import sys
import types

# Universal compatibility shim for LangChain modules expecting `langchain_core.pydantic_v1`
try:
    import langchain_core.pydantic_v1
except ImportError:
    import pydantic as _pydantic

    # Map all commonly used v1 symbols to their v2 equivalents
    compat = types.SimpleNamespace(
        BaseModel=_pydantic.BaseModel,
        Field=_pydantic.Field,
        ConfigDict=getattr(_pydantic, "ConfigDict", dict),
        ValidationError=_pydantic.ValidationError,
        root_validator=lambda *a, **kw: (lambda f: f),
        validator=lambda *a, **kw: (lambda f: f),
    )

    sys.modules["langchain_core.pydantic_v1"] = compat


# ===================================================================================================================

# NEW - ADDED: MongoDB imports for user data management
from database import get_database, close_database_connection, Collections, test_connection
from models import (
    UserProfileSchema, IncomeSchema, ExpenseSchema, 
    AssetSchema, LiabilitySchema, serialize_document,
    calculate_net_worth, calculate_monthly_cash_flow
)
from bson import ObjectId
# ADD this import near other imports
from recommendations import get_personalized_recommendations
# at top of app.py imports
from ai_financial_advisor import resolve_ticker, fetch_stock_price_by_symbol


# ✅ ADD THESE TWO LINES TO SILENCE YFINANCE
yf_logger = logging.getLogger('yfinance')
yf_logger.setLevel(logging.CRITICAL)

# Third-party imports
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd

# NEW - ADDED: Reduce werkzeug (Flask) logging verbosity
logging.getLogger('werkzeug').setLevel(logging.WARNING)

# Local imports
try:
    from onboard import bank_data, mf_data
except ImportError:
    logging.warning("Could not import onboard data")
    bank_data, mf_data = {}, {}

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ADD THIS LINE - Create logger instance
logger = logging.getLogger(__name__)

# NEW - ENHANCED (Replace the above with):
try:
    # ENHANCED - Import from consolidated module
    from ai_financial_advisor import (
        get_comprehensive_financial_advice,  # NEW - Main function
        chat_with_advisor,  # LEGACY compatible
        get_agent_research,  # NEW - For research-only
        clear_chat_session,  # LEGACY compatible
        get_active_sessions,  # LEGACY compatible
        get_chat_history,  # LEGACY compatible
        get_session_info,  # NEW - Session metadata
        cleanup_old_sessions  # NEW - Automatic cleanup
    )
    import financial_journey as financial_journey
    logger.info("AI Financial Advisor module loaded successfully")
except ImportError as e:
    logging.warning(f"Could not import AI modules: {e}")
    get_comprehensive_financial_advice = None
    chat_with_advisor = None
    get_agent_research = None
    clear_chat_session = None
    get_active_sessions = None
    get_chat_history = None
    get_session_info = None
    cleanup_old_sessions = None
    financial_journey = None

# Initialize Flask application
app = Flask(__name__)
CORS(app)

# Import and register learning routes
try:
    from learning_routes import learning_bp
    app.register_blueprint(learning_bp)
    logger.info("Learning routes registered successfully")
except ImportError as e:
    logger.warning(f"Could not import learning routes: {e}")

# NEW - UPDATED: Database initialization for Flask 3.0
def init_app():
    """Initialize application and database connection"""
    with app.app_context():
        try:
            # UPDATED - Single clean message
            test_connection()
            logger.info("🚀 FinEdge Backend Ready")
        except Exception:
            logger.warning("⚠️ MongoDB will connect on first request")

# NEW - UPDATED: Cleanup on app teardown
# @app.teardown_appcontext
# def shutdown_database(exception=None):
#     """Close database connection when app shuts down"""
#     close_database_connection()


@app.route('/', methods=['GET'])
def home():
    """Health check endpoint for the FinEdge API."""
    return jsonify({
        "status": "running",
        "message": "FinEdge API is running",
        "version": "1.0.0",
        # "endpoints": [
        #     "/agent - AI Financial Agent",
        #     "/api/market-summary - Market Data",
        #     "/ai-financial-path - Financial Planning"
        # ]
    })

# =================== DYNAMIC APIS ===================
@app.route('/agent', methods=['POST'])
def agent():
    """
    ENHANCED AI Financial Advisor endpoint
    
    Changes from LEGACY:
    - Uses consolidated ai_financial_advisor.py module
    - Direct Python function call instead of subprocess
    - Better error handling and response formatting
    - Session management integrated
    - Research and advisory combined
    """
    inp = request.form.get('input')
    session_id = request.form.get('session_id', 'default')
    
    # LEGACY - Input validation
    if not inp:
        return jsonify({'error': 'No input provided'}), 400
    
    if len(inp) > 1000:
        return jsonify({'error': 'Input too long'}), 400
    
    # NEW - ADDED: Check for research preference
    use_research = request.form.get('use_research', 'true').lower() == 'true'
    
    try:
        logger.info(f"[{session_id}] Processing input: {inp[:100]}...")
        
        # ENHANCED - Use consolidated module instead of subprocess
        if get_comprehensive_financial_advice:
            # NEW - Use the comprehensive function
            result = get_comprehensive_financial_advice(
                user_query=inp,
                session_id=session_id,
                use_research=use_research
            )
            
            # ENHANCED - Structured response
            response = {
                'output': result['advice'],
                'thought': result.get('research_output', ''),
                'session_id': result['session_id'],
                'research_used': result['research_used'],
                'processing_time': result['processing_time_seconds'],
                'timestamp': result['timestamp']
            }
            
            # NEW - ADDED: Periodic session cleanup
            if cleanup_old_sessions:
                cleanup_old_sessions(max_sessions=100)
            
            logger.info(f"[{session_id}] Request completed successfully")
            return jsonify(response)
        
        else:
            # LEGACY FALLBACK - If new module not available
            logger.warning("New AI module not available, using legacy subprocess method")
            
            # Your existing subprocess code here (LEGACY)
            import subprocess
            python_executable = sys.executable
            agent_path = os.path.join(os.path.dirname(__file__), 'agent.py')
            
            process = subprocess.Popen(
                [python_executable, agent_path, inp], 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE,
                universal_newlines=True,
                cwd=os.path.dirname(__file__)
            )
            
            output = []
            if process.stdout is not None:
                while True:
                    line = process.stdout.readline()
                    if not line and process.poll() is not None:
                        break
                    if line:
                        output.append(line)
            
            output_str = ''.join(output)
            return_code = process.wait()
            
            if return_code != 0:
                stderr = process.stderr.read() if process.stderr else ""
                logger.error(f"Agent script failed: {stderr}")
                return jsonify({
                    'error': 'Agent processing failed', 
                    'details': stderr[:500],
                    'return_code': return_code
                }), 500
            
            # Extract response
            final_answer = re.search(r'<Response>(.*?)</Response>', output_str, re.DOTALL)
            if final_answer:
                final_answer = final_answer.group(1).strip()
            else:
                if "Final Answer:" in output_str:
                    final_answer = output_str.split("Final Answer:")[-1].strip()
                else:
                    if chat_with_advisor:
                        final_answer = chat_with_advisor(inp, output_str, session_id)
                    else:
                        final_answer = "Error: No advisor available"
            
            return jsonify({'output': final_answer, 'thought': output_str})
        
    except Exception as e:
        logger.error(f"[{session_id}] Error in agent endpoint: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

# @app.route('/ai-financial-path', methods=['POST'])
# def ai_financial_path():
#     # ... (your initial validation code is good) ...
#     if 'input' not in request.form:
#         return jsonify({'error': 'No input provided'}), 400
    
#     input_text = request.form.get('input', '').strip()
#     if not input_text:
#         return jsonify({'error': 'Input cannot be empty'}), 400
        
#     risk = request.form.get('risk', 'conservative')

#     print(f"Processing financial path for: {input_text}, risk: {risk}")
    
#     if not gemini_fin_path:
#         return jsonify({'error': 'Financial AI service not available'}), 503
    
#     try:
#         # 1. Get the JSON STRING from the Gemini service
#         response_string = gemini_fin_path.get_gemini_response(input_text, risk)
        
#         # 2. ✅ CRITICAL STEP: Parse the JSON string into a Python dictionary
#         response_dict = json.loads(response_string)
        
#         # 3. Now, jsonify the DICTIONARY to create a proper JSON response
#         return jsonify(response_dict)

#     except json.JSONDecodeError:
#         # This catches errors if Gemini returns something that isn't valid JSON
#         logger.error(f"Failed to decode JSON from Gemini. Raw response: {response_string}")
#         return jsonify({'error': 'The AI response was not in a valid format.'}), 500
#     except Exception as e:
#         logger.error(f"Financial path error: {e}")
#         return jsonify({'error': 'Something went wrong on the server.'}), 500


@app.route('/ai-financial-path', methods=['POST'])
def ai_financial_path():
    if 'input' not in request.form:
        return jsonify({'error': 'No input provided'}), 400
    
    input_text = request.form.get('input', '').strip()
    if not input_text:
        return jsonify({'error': 'Input cannot be empty'}), 400
        
    risk = request.form.get('risk', 'conservative')
    
    print(f"Processing financial path for: {input_text}, risk: {risk}")
    
    if not financial_journey:
        return jsonify({'error': 'Financial AI service not available'}), 503
    
    try:
        # 🔥 GET USER DATA FROM REQUEST
        user_data_str = request.form.get('userData', '{}')
        user_data = json.loads(user_data_str) if user_data_str else {}
        
        logger.info(f"📊 User data received: {user_data}")
        
        # 1. Get the JSON STRING from the Gemini service WITH USER DATA
        response_string = financial_journey.get_gemini_response(input_text, risk, user_data)
        
        # 2. Parse the JSON string into a Python dictionary
        response_dict = json.loads(response_string)
        
        # 3. Return proper JSON response
        return jsonify(response_dict)

    except json.JSONDecodeError:
        logger.error(f"Failed to decode JSON from Gemini. Raw response: {response_string}")
        return jsonify({'error': 'The AI response was not in a valid format.'}), 500
    except Exception as e:
        logger.error(f"Financial path error: {e}")
        return jsonify({'error': 'Something went wrong on the server.'}), 500


# =================== STATIC APIS ===================
@app.route('/auto-bank-data', methods=['GET'])  # Fixed: was 'get', now 'GET'
def AutoBankData():
    if not bank_data:
        return jsonify({'error': 'Bank data not available'}), 503
    return jsonify(bank_data)

@app.route('/auto-mf-data', methods=['GET'])  # Fixed: was 'get', now 'GET'
def AutoMFData():
    if not mf_data:
        return jsonify({'error': 'MF data not available'}), 503
    return jsonify(mf_data)

# =================== CONNECTION APIS ===================
# Add your connection APIs here

# =================== REAL-TIME STOCK APIs ===================

@app.route('/api/stock-price', methods=['POST'])
def get_stock_price():
    """Get current stock prices for multiple tickers"""
    try:
        data = request.get_json()
        tickers = data.get('tickers', [])
        
        if not tickers:
            return jsonify({'error': 'No tickers provided'}), 400
        
        prices = []
        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist = stock.history(period='1d')
                if not hist.empty:
                    current_price = hist['Close'].iloc[-1]
                    prices.append({
                        'symbol': ticker,
                        'price': round(float(current_price), 2),
                        'timestamp': datetime.now().isoformat()
                    })
                else:
                    prices.append({
                        'symbol': ticker,
                        'price': None,
                        'error': 'No data available'
                    })
            except Exception as e:
                prices.append({
                    'symbol': ticker,
                    'price': None,
                    'error': str(e)
                })
        
        return jsonify({'prices': prices})
    
    except Exception as e:
        logger.error(f"Error fetching stock prices: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/nifty-gainers', methods=['GET'])
def get_nifty_gainers():
    """Get top NIFTY gainers"""
    try:
        count = request.args.get('count', 10, type=int)
        
        # NIFTY 50 symbols (major ones)
        nifty_symbols = [
            'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS',
            'ICICIBANK.NS', 'KOTAKBANK.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS',
            'ASIANPAINT.NS', 'LT.NS', 'AXISBANK.NS', 'MARUTI.NS', 'NESTLEIND.NS',
            'HCLTECH.NS', 'WIPRO.NS', 'ULTRACEMCO.NS', 'TATAMOTORS.NS', 'POWERGRID.NS'
        ]
        
        gainers = []
        for symbol in nifty_symbols[:count]:
            try:
                stock = yf.Ticker(symbol)
                hist = stock.history(period='2d')
                if len(hist) >= 2:
                    current_price = hist['Close'].iloc[-1]
                    prev_price = hist['Close'].iloc[-2]
                    per_change = ((current_price - prev_price) / prev_price) * 100
                    
                    gainers.append({
                        'symbol': symbol.replace('.NS', ''),
                        'ltp': round(float(current_price), 2),
                        'netChng': round(float(current_price - prev_price), 2),
                        'perChange': round(float(per_change), 2)
                    })
            except Exception as e:
                logger.error(f"Error fetching data for {symbol}: {e}")
                continue
        
        # Sort by percentage change (gainers first)
        gainers.sort(key=lambda x: x['perChange'], reverse=True)
        
        return jsonify(gainers[:count])
    
    except Exception as e:
        logger.error(f"Error fetching NIFTY gainers: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/api/portfolio-analysis', methods=['POST'])
def get_portfolio_analysis():
    """Analyze portfolio profit/loss"""
    try:
        data = request.get_json()
        stocks = data.get('stocks', [])
        
        if not stocks:
            return jsonify({'error': 'No stocks provided'}), 400
        
        portfolio_analysis = []
        total_profit_loss = 0
        
        for stock in stocks:
            symbol = stock.get('symbol')
            bought_price = float(stock.get('boughtPrice', 0))
            quantity = int(stock.get('quantity', 0))
            
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='1d')
                
                if not hist.empty:
                    current_price = float(hist['Close'].iloc[-1])
                    profit_loss = (current_price - bought_price) * quantity
                    total_profit_loss += profit_loss
                    
                    portfolio_analysis.append({
                        'symbol': symbol,
                        'boughtPrice': bought_price,
                        'currentPrice': round(current_price, 2),
                        'quantity': quantity,
                        'profitOrLoss': round(profit_loss, 2),
                        'totalValue': round(current_price * quantity, 2)
                    })
                else:
                    portfolio_analysis.append({
                        'symbol': symbol,
                        'error': 'No current price data available'
                    })
                    
            except Exception as e:
                portfolio_analysis.append({
                    'symbol': symbol,
                    'error': str(e)
                })
        
        return jsonify({
            'stocks': portfolio_analysis,
            'totalProfitOrLoss': round(total_profit_loss, 2),
            'timestamp': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error analyzing portfolio: {e}")
        return jsonify({'error': 'Internal server error'}), 500

def get_market_category(index_name):
    """Categorize market indices for better organization"""
    if index_name in ['NIFTY 50', 'SENSEX', 'BANK NIFTY', 'NIFTY IT', 'NIFTY AUTO', 'NIFTY PHARMA', 
                      'NIFTY FMCG', 'NIFTY METAL', 'NIFTY ENERGY', 'NIFTY REALTY', 'NIFTY MEDIA', 
                      'NIFTY MIDCAP', 'NIFTY SMALLCAP']:
        return 'Indian Indices'
    elif index_name in ['S&P 500', 'NASDAQ', 'DOW JONES', 'FTSE 100', 'DAX', 'NIKKEI', 'HANG SENG', 'SHANGHAI']:
        return 'International Indices'
    elif index_name in ['GOLD', 'CRUDE OIL']:
        return 'Commodities'
    elif index_name in ['USD/INR']:
        return 'Currency'
    elif index_name in ['BITCOIN']:
        return 'Cryptocurrency'
    else:
        return 'Other'



@app.route('/api/market-summary', methods=['GET'])
def get_market_summary():
    """Get comprehensive market indices summary - 25+ major indices for marquee display"""
    try:
        # Indian-focused market data with major Indian brands and select international indices
        indices = {
            # Major Indian Indices (Priority)
            'NIFTY 50': '^NSEI',
            'SENSEX': '^BSESN',
            'BANK NIFTY': '^NSEBANK',
            'NIFTY IT': '^CNXIT',
            'NIFTY AUTO': '^CNXAUTO',
            'NIFTY PHARMA': '^CNXPHARMA',
            'NIFTY FMCG': '^CNXFMCG',
            'NIFTY METAL': '^CNXMETAL',
            'NIFTY ENERGY': '^CNXENERGY',
            'NIFTY REALTY': '^CNXREALTY',
            'NIFTY MEDIA': '^CNXMEDIA',
            'NIFTY MIDCAP': '^NSEMDCP50',
            'NIFTY SMALLCAP': '^NSESMLCP250',
            'NIFTY NEXT 50': '^NSMIDCP',
            'NIFTY PSU BANK': '^CNXPSUBANK',
            'NIFTY PRIVATE BANK': '^CNXPVTBANK',
            'NIFTY FINANCE': '^CNXFINANCE',
            'NIFTY INFRA': '^CNXINFRA',
            
            # Top Indian Companies (Individual Stocks)
            'RELIANCE': 'RELIANCE.NS',
            'TCS': 'TCS.NS',
            'HDFC BANK': 'HDFCBANK.NS',
            'INFOSYS': 'INFY.NS',
            'ICICI BANK': 'ICICIBANK.NS',
            'BHARTI AIRTEL': 'BHARTIARTL.NS',
            'SBI': 'SBIN.NS',
            'LT': 'LT.NS',
            'ITC': 'ITC.NS',
            'HCLTECH': 'HCLTECH.NS',
            'WIPRO': 'WIPRO.NS',
            'MARUTI SUZUKI': 'MARUTI.NS',
            'ASIAN PAINTS': 'ASIANPAINT.NS',
            'BAJAJ FINANCE': 'BAJFINANCE.NS',
            'TITAN': 'TITAN.NS',
            
            # Select International (Limited)
            'S&P 500': '^GSPC',
            'NASDAQ': '^IXIC',
            'NIKKEI': '^N225',
            
            # Essential Commodities & Currency
            'USD/INR': 'USDINR=X',
            'GOLD': 'GC=F',
            'CRUDE OIL': 'CL=F'
        }
        
        market_data = {}
        successful_fetches = 0
        
        for index_name, symbol in indices.items():
            try:
                ticker = yf.Ticker(symbol)
                hist = ticker.history(period='2d')
                
                if len(hist) >= 2:
                    current_value = hist['Close'].iloc[-1]
                    prev_value = hist['Close'].iloc[-2]
                    change = current_value - prev_value
                    per_change = (change / prev_value) * 100
                    
                    # Format values based on type
                    if 'USD/INR' in index_name:
                        formatted_value = round(float(current_value), 4)
                    elif index_name in ['GOLD', 'CRUDE OIL', 'BITCOIN']:
                        formatted_value = round(float(current_value), 2)
                    else:
                        formatted_value = round(float(current_value), 2)
                    
                    market_data[index_name] = {
                        'value': formatted_value,
                        'change': round(float(change), 2),
                        'perChange': round(float(per_change), 2),
                        'timestamp': datetime.now().isoformat(),
                        'symbol': symbol,
                        'category': get_market_category(index_name)
                    }
                    successful_fetches += 1
                    
                elif len(hist) >= 1:
                    # If only 1 day of data, show without change
                    current_value = hist['Close'].iloc[-1]
                    
                    if 'USD/INR' in index_name:
                        formatted_value = round(float(current_value), 4)
                    elif index_name in ['GOLD', 'CRUDE OIL', 'BITCOIN']:
                        formatted_value = round(float(current_value), 2)
                    else:
                        formatted_value = round(float(current_value), 2)
                    
                    market_data[index_name] = {
                        'value': formatted_value,
                        'change': 0,
                        'perChange': 0,
                        'timestamp': datetime.now().isoformat(),
                        'symbol': symbol,
                        'category': get_market_category(index_name)
                    }
                    successful_fetches += 1
                    
            except Exception as e:
                logger.error(f"Error fetching {index_name} ({symbol}): {e}")
                continue
        
        logger.info(f"Successfully fetched {successful_fetches}/{len(indices)} market indices")
        return jsonify({
            'indices': market_data,
            'totalIndices': successful_fetches,
            'lastUpdated': datetime.now().isoformat()
        })
    
    except Exception as e:
        logger.error(f"Error fetching market summary: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# =================== SESSION MANAGEMENT ===================
# ==================== NEW ENDPOINT - Session Info ====================
# NEW - ADDED: Get detailed session information

@app.route('/session-info', methods=['GET'])
def get_session_info_endpoint():
    """
    NEW - Get detailed information about a specific session
    """
    try:
        session_id = request.args.get('session_id', 'default')
        
        if get_session_info:
            info = get_session_info(session_id)
            if info:
                return jsonify({
                    'success': True,
                    'session_info': info
                })
            else:
                return jsonify({
                    'success': False,
                    'message': f'Session {session_id} not found'
                })
        else:
            return jsonify({'error': 'Session management not available'}), 503
            
    except Exception as e:
        logger.error(f"Error getting session info: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/clear-chat-session', methods=['POST'])
def clear_chat_session_endpoint():
    """
    LEGACY ENDPOINT - No functional changes, updated to use consolidated module
    Clear a specific chat session
    """
    try:
        session_id = request.form.get('session_id', 'default')
        
        if clear_chat_session:
            success = clear_chat_session(session_id)
            return jsonify({
                'success': success,
                'message': f'Session {session_id} cleared successfully' if success else f'Session {session_id} not found'
            })
        else:
            return jsonify({'error': 'Session management not available'}), 503
            
    except Exception as e:
        logger.error(f"Error clearing chat session: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/active-sessions', methods=['GET'])
def get_active_sessions_endpoint():
    """
    LEGACY ENDPOINT - ENHANCED with more details
    Get list of all active chat sessions
    """
    try:
        if get_active_sessions:
            sessions = get_active_sessions()
            
            # NEW - ADDED: Include session details
            session_details = []
            if get_session_info:
                for sid in sessions:
                    info = get_session_info(sid)
                    if info:
                        session_details.append(info)
            
            return jsonify({
                'active_sessions': sessions,
                'count': len(sessions),
                'session_details': session_details if session_details else None  # NEW
            })
        else:
            return jsonify({'error': 'Session management not available'}), 503
            
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    


@app.route('/chat-history', methods=['GET'])
def get_chat_history_endpoint():
    """
    LEGACY ENDPOINT - No functional changes
    Get chat history for a specific session
    """
    try:
        session_id = request.args.get('session_id', 'default')
        
        if get_chat_history:
            history = get_chat_history(session_id)
            return jsonify({
                'session_id': session_id,
                'history': history,
                'message_count': len(history)
            })
        else:
            return jsonify({'error': 'Session management not available'}), 503
            
    except Exception as e:
        logger.error(f"Error getting chat history: {e}")
        return jsonify({'error': 'Internal server error'}), 500

# ==================== NEW - ADDED: USER ONBOARDING & PROFILE ENDPOINTS ====================

@app.route('/api/onboarding/status', methods=['GET'])
def get_onboarding_status():
    """
    Check if user has completed onboarding.
    
    Query Params:
        clerkUserId: User's Clerk authentication ID
        
    Returns:
        {
            "onboardingCompleted": bool,
            "onboardingStep": int,
            "profile": dict (if exists)
        }
    """
    try:
        clerk_user_id = request.args.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        user_profile = db[Collections.USER_PROFILES].find_one({"clerkUserId": clerk_user_id})
        
        if user_profile:
            return jsonify({
                'onboardingCompleted': user_profile.get('onboardingCompleted', False),
                'onboardingStep': user_profile.get('onboardingStep', 0),
                'profile': serialize_document(user_profile)
            })
        else:
            # User doesn't exist yet - create default profile
            default_profile = UserProfileSchema.create_default(clerk_user_id)
            result = db[Collections.USER_PROFILES].insert_one(default_profile)
            default_profile['_id'] = result.inserted_id
            
            return jsonify({
                'onboardingCompleted': False,
                'onboardingStep': 0,
                'profile': serialize_document(default_profile)
            })
            
    except Exception as e:
        logger.error(f"Error checking onboarding status: {e}")
        return jsonify({'error': 'Internal server error'}), 500


# @app.route('/api/onboarding/complete', methods=['POST'])
# def complete_onboarding_endpoint():
#     """
#     ✅ NEW ENDPOINT - Complete onboarding and save profile
    
#     This endpoint is called when user finishes onboarding.
#     Saves user profile with risk tolerance and marks onboarding as complete.
#     """
#     try:
#         data = request.json
#         clerk_user_id = data.get('clerkUserId')
        
#         if not clerk_user_id:
#             return jsonify({'error': 'clerkUserId is required'}), 400
        
#         db = get_database()
#         profiles_collection = db[Collections.USER_PROFILES]
        
#         # Prepare profile data
#         profile_data = {
#             'clerkUserId': clerk_user_id,
#             'riskTolerance': data.get('riskTolerance', 'moderate'),
#             'onboardingCompleted': data.get('onboardingCompleted', True),
#             'onboardingStep': data.get('onboardingStep', 6),
#             'updatedAt': datetime.utcnow(),
#             'createdAt': datetime.utcnow()
#         }
        
#         # Upsert (update if exists, insert if not)
#         result = profiles_collection.update_one(
#             {'clerkUserId': clerk_user_id},
#             {'$set': profile_data},
#             upsert=True
#         )
        
#         logger.info(f"✅ Onboarding completed for user: {clerk_user_id}")
        
#         return jsonify({
#             'success': True,
#             'message': 'Onboarding completed successfully',
#             'profile': serialize_document(profile_data)
#         }), 200
        
#     except Exception as e:
#         logger.error(f"❌ Error completing onboarding: {e}")
#         return jsonify({'error': 'Failed to complete onboarding'}), 500


@app.route('/api/onboarding/complete', methods=['POST'])
def complete_onboarding():
    """
    Save complete onboarding data (all 5 steps).
    
    Request Body:
        {
            "clerkUserId": str,
            "riskTolerance": str,
            "income": [IncomeEntry],
            "expenses": [ExpenseEntry],
            "assets": [AssetEntry],
            "liabilities": [LiabilityEntry]
        }
        
    Returns:
        {
            "success": bool,
            "message": str,
            "profileId": str
        }
    """
    try:
        data = request.json
        if data is None:
            logger.error(f"No JSON body received in onboarding completion request. Raw data: {request.data}")
            return jsonify({'error': 'Missing or invalid JSON body'}), 400
        clerk_user_id = data.get('clerkUserId')
        risk_tolerance = data.get('riskTolerance')
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        if not risk_tolerance:
            logger.error(f"Missing riskTolerance in onboarding payload: {data}")
            return jsonify({'error': 'riskTolerance is required'}), 400
        db = get_database()
        # Update or create user profile
        user_profile = {
            "clerkUserId": clerk_user_id,
            "onboardingCompleted": True,
            "onboardingStep": 5,
            "riskTolerance": risk_tolerance,
            "updatedAt": datetime.utcnow()
        }
        result = db[Collections.USER_PROFILES].update_one(
            {"clerkUserId": clerk_user_id},
            {"$set": user_profile},
            upsert=True
        )
        # Save income entries
        income_entries = data.get('income', [])
        if income_entries:
            db[Collections.INCOME].delete_many({"clerkUserId": clerk_user_id})
            for entry in income_entries:
                income_doc = IncomeSchema.create(
                    clerk_user_id=clerk_user_id,
                    source=entry['source'],
                    amount=entry['amount'],
                    frequency=entry['frequency'],
                    category=entry['category'],
                    date=entry['date']
                )
                db[Collections.INCOME].insert_one(income_doc)
        # Save expense entries
        expense_entries = data.get('expenses', [])
        if expense_entries:
            db[Collections.EXPENSES].delete_many({"clerkUserId": clerk_user_id})
            for entry in expense_entries:
                expense_doc = ExpenseSchema.create(
                    clerk_user_id=clerk_user_id,
                    name=entry['name'],
                    amount=entry['amount'],
                    category=entry['category'],
                    frequency=entry['frequency'],
                    date=entry['date'],
                    is_essential=entry.get('isEssential', False)
                )
                db[Collections.EXPENSES].insert_one(expense_doc)
        # Save asset entries
        asset_entries = data.get('assets', [])
        if asset_entries:
            db[Collections.ASSETS].delete_many({"clerkUserId": clerk_user_id})
            for entry in asset_entries:
                asset_doc = AssetSchema.create(
                    clerk_user_id=clerk_user_id,
                    name=entry['name'],
                    value=entry['value'],
                    category=entry['category'],
                    purchase_date=entry.get('purchaseDate'),
                    appreciation_rate=entry.get('appreciationRate'),
                    notes=entry.get('notes')
                )
                db[Collections.ASSETS].insert_one(asset_doc)
        # Save liability entries
        liability_entries = data.get('liabilities', [])
        if liability_entries:
            db[Collections.LIABILITIES].delete_many({"clerkUserId": clerk_user_id})
            for entry in liability_entries:
                liability_doc = LiabilitySchema.create(
                    clerk_user_id=clerk_user_id,
                    name=entry['name'],
                    amount=entry['amount'],
                    category=entry['category'],
                    interest_rate=entry.get('interestRate'),
                    due_date=entry.get('dueDate'),
                    monthly_payment=entry.get('monthlyPayment'),
                    notes=entry.get('notes')
                )
                db[Collections.LIABILITIES].insert_one(liability_doc)
        logger.info(f"✅ Onboarding completed for user: {clerk_user_id}")
        return jsonify({
            'success': True,
            'message': 'Onboarding completed successfully',
            'profileId': str(result.upserted_id) if result.upserted_id else None
        })
    except Exception as e:
        logger.error(f"Error completing onboarding: {e}. Payload: {request.json}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


@app.route('/api/user-profile', methods=['GET'])
def get_user_profile():
    """
    Get complete user profile with all financial data.
    
    Query Params:
        clerkUserId: User's Clerk ID
        
    Returns:
        {
            "profile": UserProfile,
            "income": [IncomeEntry],
            "expenses": [ExpenseEntry],
            "assets": [AssetEntry],
            "liabilities": [LiabilityEntry],
            "summary": {
                "totalIncome": float,
                "totalExpenses": float,
                "totalAssets": float,
                "totalLiabilities": float,
                "netWorth": float
            }
        }
    """
    try:
        clerk_user_id = request.args.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        
        # Get user profile
        user_profile = db[Collections.USER_PROFILES].find_one({"clerkUserId": clerk_user_id})
        if not user_profile:
            return jsonify({'error': 'User profile not found'}), 404
        
        # Get all financial entries
        income = list(db[Collections.INCOME].find({"clerkUserId": clerk_user_id}))
        expenses = list(db[Collections.EXPENSES].find({"clerkUserId": clerk_user_id}))
        assets = list(db[Collections.ASSETS].find({"clerkUserId": clerk_user_id}))
        liabilities = list(db[Collections.LIABILITIES].find({"clerkUserId": clerk_user_id}))
        
        # Calculate summary statistics
        total_income = sum(entry['amount'] for entry in income)
        total_expenses = sum(entry['amount'] for entry in expenses)
        total_assets = sum(entry['value'] for entry in assets)
        total_liabilities = sum(entry['amount'] for entry in liabilities)
        net_worth = calculate_net_worth(total_assets, total_liabilities)
        
        return jsonify({
            'profile': serialize_document(user_profile),
            'income': [serialize_document(doc) for doc in income],
            'expenses': [serialize_document(doc) for doc in expenses],
            'assets': [serialize_document(doc) for doc in assets],
            'liabilities': [serialize_document(doc) for doc in liabilities],
            'summary': {
                'totalIncome': total_income,
                'totalExpenses': total_expenses,
                'totalAssets': total_assets,
                'totalLiabilities': total_liabilities,
                'netWorth': net_worth
            }
        })
        
    except Exception as e:
        logger.error(f"Error fetching user profile: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/calculators/asset-growth', methods=['GET'])
def get_asset_growth_projection():
    """Return aggregated projections for the asset growth calculators."""
    try:
        clerk_user_id = request.args.get('clerkUserId')

        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400

        db = get_database()
        assets = list(db[Collections.ASSETS].find({"clerkUserId": clerk_user_id}))
        incomes = list(db[Collections.INCOME].find({"clerkUserId": clerk_user_id}))
        expenses = list(db[Collections.EXPENSES].find({"clerkUserId": clerk_user_id}))
        profile = db[Collections.USER_PROFILES].find_one(
            {"clerkUserId": clerk_user_id},
            {"calculatorPreferences": 1},
        )
        calculator_preferences = profile.get("calculatorPreferences") if profile else None

        if not assets:
            return jsonify({
                'clerkUserId': clerk_user_id,
                'generatedAt': datetime.utcnow().isoformat(),
                'instruments': [],
                'summary': {
                    'assetValue': 0.0,
                    'monthlyIncome': 0.0,
                    'monthlyExpenses': 0.0,
                    'monthlySavings': 0.0,
                },
                'message': 'No assets found for the requested user.',
            }), 200

        response_payload = build_asset_growth_response(
            clerk_user_id=clerk_user_id,
            assets=assets,
            incomes=incomes,
            expenses=expenses,
            user_preferences=calculator_preferences,
        )

        return jsonify(response_payload)

    except Exception as exc:
        logger.error(f"Error generating asset growth projection: {exc}")
        return jsonify({'error': 'Internal server error', 'details': str(exc)}), 500


# ==================== INDIVIDUAL ENTRY CRUD ENDPOINTS ====================

@app.route('/api/user-profile/income', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_income():
    """CRUD operations for income entries"""
    try:
        clerk_user_id = request.args.get('clerkUserId') or request.json.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        
        if request.method == 'GET':
            # Get all income entries
            income = list(db[Collections.INCOME].find({"clerkUserId": clerk_user_id}))
            return jsonify({'income': [serialize_document(doc) for doc in income]})
        
        elif request.method == 'POST':
            # Add new income entry
            data = request.json
            income_doc = IncomeSchema.create(
                clerk_user_id=clerk_user_id,
                source=data['source'],
                amount=data['amount'],
                frequency=data['frequency'],
                category=data['category'],
                date=data['date']
            )
            result = db[Collections.INCOME].insert_one(income_doc)
            income_doc['_id'] = result.inserted_id
            return jsonify({'success': True, 'income': serialize_document(income_doc)}), 201
        
        elif request.method == 'PUT':
            # Update income entry
            data = request.json
            entry_id = data.get('_id')
            if not entry_id:
                return jsonify({'error': '_id is required for update'}), 400
            
            update_data = {k: v for k, v in data.items() if k not in ['_id', 'clerkUserId']}
            update_data['updatedAt'] = datetime.utcnow()
            
            db[Collections.INCOME].update_one(
                {"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id},
                {"$set": update_data}
            )
            return jsonify({'success': True, 'message': 'Income updated'})
        
        elif request.method == 'DELETE':
            # Delete income entry
            entry_id = request.args.get('entryId')
            if not entry_id:
                return jsonify({'error': 'entryId is required'}), 400
            
            db[Collections.INCOME].delete_one({"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id})
            return jsonify({'success': True, 'message': 'Income deleted'})
            
    except Exception as e:
        logger.error(f"Error managing income: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/user-profile/expenses', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_expenses():
    """CRUD operations for expense entries"""
    try:
        clerk_user_id = request.args.get('clerkUserId') or request.json.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        
        if request.method == 'GET':
            expenses = list(db[Collections.EXPENSES].find({"clerkUserId": clerk_user_id}))
            return jsonify({'expenses': [serialize_document(doc) for doc in expenses]})
        
        elif request.method == 'POST':
            data = request.json
            expense_doc = ExpenseSchema.create(
                clerk_user_id=clerk_user_id,
                name=data['name'],
                amount=data['amount'],
                category=data['category'],
                frequency=data['frequency'],
                date=data['date'],
                is_essential=data.get('isEssential', False)
            )
            result = db[Collections.EXPENSES].insert_one(expense_doc)
            expense_doc['_id'] = result.inserted_id
            return jsonify({'success': True, 'expense': serialize_document(expense_doc)}), 201
        
        elif request.method == 'PUT':
            data = request.json
            entry_id = data.get('_id')
            if not entry_id:
                return jsonify({'error': '_id is required for update'}), 400
            
            update_data = {k: v for k, v in data.items() if k not in ['_id', 'clerkUserId']}
            update_data['updatedAt'] = datetime.utcnow()
            
            db[Collections.EXPENSES].update_one(
                {"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id},
                {"$set": update_data}
            )
            return jsonify({'success': True, 'message': 'Expense updated'})
        
        elif request.method == 'DELETE':
            entry_id = request.args.get('entryId')
            if not entry_id:
                return jsonify({'error': 'entryId is required'}), 400
            
            db[Collections.EXPENSES].delete_one({"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id})
            return jsonify({'success': True, 'message': 'Expense deleted'})
            
    except Exception as e:
        logger.error(f"Error managing expenses: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/user-profile/assets', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_assets():
    """CRUD operations for asset entries"""
    try:
        clerk_user_id = request.args.get('clerkUserId')
        data = None
        if request.is_json:
            data = request.get_json(silent=True)
        if not clerk_user_id and data:
            clerk_user_id = data.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        
        if request.method == 'GET':
            assets = list(db[Collections.ASSETS].find({"clerkUserId": clerk_user_id}))
            return jsonify({'assets': [serialize_document(doc) for doc in assets]})
        
        elif request.method == 'POST':
            if not data:
                return jsonify({'error': 'Missing or invalid JSON body'}), 400
            try:
                asset_doc = AssetSchema.create(
                    clerk_user_id=clerk_user_id,
                    name=data.get('name'),
                    value=data.get('value'),
                    category=data.get('category'),
                    purchase_date=data.get('purchaseDate'),
                    appreciation_rate=data.get('appreciationRate'),
                    notes=data.get('notes')
                )
            except Exception as e:
                logger.error(f"AssetSchema.create failed: {e}. Data: {data}")
                return jsonify({'error': f'AssetSchema.create failed: {str(e)}', 'data': data}), 400
            try:
                result = db[Collections.ASSETS].insert_one(asset_doc)
                asset_doc['_id'] = result.inserted_id
                return jsonify({'success': True, 'asset': serialize_document(asset_doc)}), 201
            except Exception as e:
                logger.error(f"MongoDB insert_one failed: {e}. Asset doc: {asset_doc}")
                return jsonify({'error': f'MongoDB insert_one failed: {str(e)}', 'asset_doc': asset_doc}), 500
        
        elif request.method == 'PUT':
            data = request.json
            entry_id = data.get('_id')
            if not entry_id:
                return jsonify({'error': '_id is required for update'}), 400
            
            update_data = {k: v for k, v in data.items() if k not in ['_id', 'clerkUserId']}
            update_data['updatedAt'] = datetime.utcnow()
            
            db[Collections.ASSETS].update_one(
                {"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id},
                {"$set": update_data}
            )
            return jsonify({'success': True, 'message': 'Asset updated'})
        
        elif request.method == 'DELETE':
            entry_id = request.args.get('entryId')
            if not entry_id:
                return jsonify({'error': 'entryId is required'}), 400
            
            db[Collections.ASSETS].delete_one({"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id})
            return jsonify({'success': True, 'message': 'Asset deleted'})
            
    except Exception as e:
        logger.error(f"Error managing assets: {e}")
        return jsonify({'error': 'Internal server error'}), 500


@app.route('/api/user-profile/liabilities', methods=['GET', 'POST', 'PUT', 'DELETE'])
def manage_liabilities():
    """CRUD operations for liability entries"""
    try:
        clerk_user_id = request.args.get('clerkUserId') or request.json.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        
        if request.method == 'GET':
            liabilities = list(db[Collections.LIABILITIES].find({"clerkUserId": clerk_user_id}))
            return jsonify({'liabilities': [serialize_document(doc) for doc in liabilities]})
        
        elif request.method == 'POST':
            data = request.json
            liability_doc = LiabilitySchema.create(
                clerk_user_id=clerk_user_id,
                name=data['name'],
                amount=data['amount'],
                category=data['category'],
                interest_rate=data.get('interestRate'),
                due_date=data.get('dueDate'),
                monthly_payment=data.get('monthlyPayment'),
                notes=data.get('notes')
            )
            result = db[Collections.LIABILITIES].insert_one(liability_doc)
            liability_doc['_id'] = result.inserted_id
            return jsonify({'success': True, 'liability': serialize_document(liability_doc)}), 201
        
        elif request.method == 'PUT':
            data = request.json
            entry_id = data.get('_id')
            if not entry_id:
                return jsonify({'error': '_id is required for update'}), 400
            
            update_data = {k: v for k, v in data.items() if k not in ['_id', 'clerkUserId']}
            update_data['updatedAt'] = datetime.utcnow()
            
            db[Collections.LIABILITIES].update_one(
                {"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id},
                {"$set": update_data}
            )
            return jsonify({'success': True, 'message': 'Liability updated'})
        
        elif request.method == 'DELETE':
            entry_id = request.args.get('entryId')
            if not entry_id:
                return jsonify({'error': 'entryId is required'}), 400
            
            db[Collections.LIABILITIES].delete_one({"_id": ObjectId(entry_id), "clerkUserId": clerk_user_id})
            return jsonify({'success': True, 'message': 'Liability deleted'})
            
    except Exception as e:
        logger.error(f"Error managing liabilities: {e}")
        return jsonify({'error': 'Internal server error'}), 500
    
# ==========================================
# GOALS ENDPOINTS
# ==========================================

@app.route('/api/user-profile/goals', methods=['GET'])
def get_goals():
    """Get all goals for a user"""
    try:
        clerk_user_id = request.args.get('clerkUserId')
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400

        db = get_database()
        # Find user profile in USER_PROFILES collection
        user_profile = db[Collections.USER_PROFILES].find_one({'clerkUserId': clerk_user_id})
        
        if not user_profile:
            return jsonify({'goals': []}), 200
        
        # Goals are stored as an array inside user_profile document
        goals = user_profile.get('goals', [])
        return jsonify({'goals': goals}), 200

    except Exception as e:
        logger.error(f"Error fetching goals: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user-profile/goals', methods=['POST'])
def add_goal():
    """Add a new goal"""
    try:
        data = request.json
        clerk_user_id = data.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400

        # Extract goal data
        goal_data = {
            'id': data.get('id'),
            'name': data.get('name'),
            'icon': data.get('icon'),
            'target': data.get('target'),
            'current': data.get('current')
        }

        db = get_database()
        # Update user profile - add goal to goals array
        result = db[Collections.USER_PROFILES].update_one(
            {'clerkUserId': clerk_user_id},
            {
                '$push': {'goals': goal_data},
                '$set': {'updatedAt': datetime.utcnow()}
            },
            upsert=True
        )

        return jsonify({
            'message': 'Goal added successfully',
            'goal': goal_data
        }), 200

    except Exception as e:
        logger.error(f"Error adding goal: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user-profile/goals/<goal_id>', methods=['PUT'])
def update_goal(goal_id):
    """Update an existing goal"""
    try:
        data = request.json
        clerk_user_id = data.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400

        db = get_database()
        # Update the specific goal in the array using positional operator $
        result = db[Collections.USER_PROFILES].update_one(
            {
                'clerkUserId': clerk_user_id,
                'goals.id': goal_id
            },
            {
                '$set': {
                    'goals.$.name': data.get('name'),
                    'goals.$.icon': data.get('icon'),
                    'goals.$.target': data.get('target'),
                    'goals.$.current': data.get('current'),
                    'updatedAt': datetime.utcnow()
                }
            }
        )

        if result.modified_count == 0:
            return jsonify({'error': 'Goal not found'}), 404

        return jsonify({'message': 'Goal updated successfully'}), 200

    except Exception as e:
        logger.error(f"Error updating goal: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/user-profile/goals/<goal_id>', methods=['DELETE'])
def delete_goal(goal_id):
    """Delete a goal"""
    try:
        clerk_user_id = request.args.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400

        db = get_database()
        # Remove the goal from the array using $pull
        result = db[Collections.USER_PROFILES].update_one(
            {'clerkUserId': clerk_user_id},
            {
                '$pull': {'goals': {'id': goal_id}},
                '$set': {'updatedAt': datetime.utcnow()}
            }
        )

        if result.modified_count == 0:
            return jsonify({'error': 'Goal not found'}), 404

        return jsonify({'message': 'Goal deleted successfully'}), 200

    except Exception as e:
        logger.error(f"Error deleting goal: {e}")
        return jsonify({'error': str(e)}), 500
    

# ===========================================================================================================
#                              AI ADVISOR CHAT HISTORY API
# ===========================================================================================================

@app.route('/api/chat/ai-advisor/history', methods=['GET', 'POST', 'DELETE'])
def manage_ai_chat_history():
    """
    Manage AI Advisor chat history with MongoDB persistence
    
    GET: Retrieve user's chat history
    POST: Save/Update chat history
    DELETE: Clear chat history
    
    Query Params (GET/DELETE): clerkUserId
    Body (POST): { clerkUserId, messages }
    """
    try:
        # Get clerkUserId from query params or body
        clerk_user_id = request.args.get('clerkUserId')
        if not clerk_user_id and request.method in ['POST', 'DELETE']:
            data = request.json
            clerk_user_id = data.get('clerkUserId')
        
        if not clerk_user_id:
            logger.error("Missing clerkUserId in chat history request")
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        chat_collection = db[Collections.AI_CHAT_HISTORY]
        
        # ========== GET: Retrieve chat history ==========
        if request.method == 'GET':
            logger.info(f"📥 Fetching chat history for user: {clerk_user_id}")
            
            chat_doc = chat_collection.find_one({'clerkUserId': clerk_user_id})
            
            if chat_doc:
                messages = chat_doc.get('messages', [])
                logger.info(f"✅ Found {len(messages)} messages for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'messages': messages,
                    'lastUpdated': chat_doc.get('updatedAt', '').isoformat() if chat_doc.get('updatedAt') else '',
                    'messageCount': len(messages)
                }), 200
            else:
                logger.info(f"ℹ️ No chat history found for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'messages': [],
                    'lastUpdated': '',
                    'messageCount': 0
                }), 200
        
        # ========== POST: Save chat history ==========
        elif request.method == 'POST':
            data = request.json
            messages = data.get('messages', [])
            
            # Validate messages
            if not isinstance(messages, list):
                return jsonify({'error': 'messages must be an array'}), 400
            
            # Limit to last 100 messages to prevent huge documents
            if len(messages) > 100:
                logger.warning(f"⚠️ Trimming messages from {len(messages)} to 100")
                messages = messages[-100:]
            
            logger.info(f"💾 Saving {len(messages)} messages for user: {clerk_user_id}")
            
            chat_doc = {
                'clerkUserId': clerk_user_id,
                'messages': messages,
                'updatedAt': datetime.utcnow(),
                'messageCount': len(messages)
            }
            
            # Upsert (update if exists, insert if not)
            result = chat_collection.update_one(
                {'clerkUserId': clerk_user_id},
                {
                    '$set': chat_doc,
                    '$setOnInsert': {'createdAt': datetime.utcnow()}
                },
                upsert=True
            )
            
            logger.info(f"✅ Chat history saved for user: {clerk_user_id} ({len(messages)} messages)")
            
            return jsonify({
                'success': True,
                'message': 'Chat history saved successfully',
                'messageCount': len(messages),
                'modified': result.modified_count > 0,
                'upserted': result.upserted_id is not None
            }), 200
        
        # ========== DELETE: Clear chat history ==========
        elif request.method == 'DELETE':
            logger.info(f"🗑️ Clearing chat history for user: {clerk_user_id}")
            
            result = chat_collection.delete_one({'clerkUserId': clerk_user_id})
            
            if result.deleted_count > 0:
                logger.info(f"✅ Deleted chat history for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'message': 'Chat history cleared successfully',
                    'deletedCount': result.deleted_count
                }), 200
            else:
                logger.info(f"ℹ️ No chat history to delete for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'message': 'No chat history found',
                    'deletedCount': 0
                }), 200
            
    except Exception as e:
        logger.error(f"❌ Error managing AI chat history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to manage chat history',
            'details': str(e)
        }), 500









# ===========================================================================================================
#                         FINANCIAL PATH HISTORY MANAGEMENT API
# ===========================================================================================================

@app.route('/api/financial-path/history', methods=['GET', 'POST', 'DELETE'])
def manage_financial_path_history():
    """
    Manage Financial Path query history with MongoDB persistence
    
    GET: Retrieve user's last financial path result
    POST: Save new financial path result
    DELETE: Clear all financial path history
    
    Query Params (GET/DELETE): clerkUserId
    Body (POST): { clerkUserId, riskProfile, userQuery, serverData, fetchedUserData }
    """
    try:
        # Get clerkUserId from query params or body
        clerk_user_id = request.args.get('clerkUserId')
        if not clerk_user_id and request.method in ['POST', 'DELETE']:
            data = request.json
            clerk_user_id = data.get('clerkUserId')
        
        if not clerk_user_id:
            logger.error("Missing clerkUserId in financial path request")
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        db = get_database()
        path_collection = db[Collections.FINANCIAL_PATH_HISTORY]
        
        # ========== GET: Retrieve last financial path result ==========
        if request.method == 'GET':
            logger.info(f"📥 Fetching financial path history for user: {clerk_user_id}")
            
            # Get most recent result
            path_doc = path_collection.find_one(
                {'clerkUserId': clerk_user_id},
                sort=[('createdAt', -1)]  # Sort by newest first
            )
            
            if path_doc:
                logger.info(f"✅ Found financial path result for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'data': serialize_document(path_doc),
                'lastUpdated': path_doc.get('createdAt').isoformat() if path_doc.get('createdAt') and isinstance(path_doc.get('createdAt'), datetime) else str(path_doc.get('createdAt', ''))
                }), 200
            else:
                logger.info(f"ℹ️ No financial path history found for user: {clerk_user_id}")
                return jsonify({
                    'success': True,
                    'data': None,
                    'lastUpdated': ''
                }), 200
        
        # ========== POST: Save new financial path result ==========
        elif request.method == 'POST':
            data = request.json
            
            logger.info(f"💾 Saving financial path result for user: {clerk_user_id}")
            
            # Prepare document
            path_doc = {
                'clerkUserId': clerk_user_id,
                'riskProfile': data.get('riskProfile', ''),
                'userQuery': data.get('userQuery', ''),
                'serverData': data.get('serverData', {}),
                'fetchedUserData': data.get('fetchedUserData', {}),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow()
            }
            
            # Keep only last 5 results per user (to save space)
            existing_count = path_collection.count_documents({'clerkUserId': clerk_user_id})
            if existing_count >= 5:
                # Delete oldest result
                oldest = path_collection.find_one(
                    {'clerkUserId': clerk_user_id},
                    sort=[('createdAt', 1)]  # Sort by oldest first
                )
                if oldest:
                    path_collection.delete_one({'_id': oldest['_id']})
                    logger.info(f"🗑️ Deleted oldest financial path result for user: {clerk_user_id}")
            
            # Insert new result
            result = path_collection.insert_one(path_doc)
            path_doc['_id'] = result.inserted_id
            
            logger.info(f"✅ Saved financial path result for user: {clerk_user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Financial path result saved successfully',
                'data': serialize_document(path_doc)
            }), 201
        
        # ========== DELETE: Clear all financial path history ==========
        elif request.method == 'DELETE':
            logger.info(f"🗑️ Clearing financial path history for user: {clerk_user_id}")
            
            result = path_collection.delete_many({'clerkUserId': clerk_user_id})
            
            logger.info(f"✅ Deleted {result.deleted_count} financial path result(s) for user: {clerk_user_id}")
            
            return jsonify({
                'success': True,
                'message': 'Financial path history cleared successfully',
                'deletedCount': result.deleted_count
            }), 200
            
    except Exception as e:
        logger.error(f"❌ Error managing financial path history: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to manage financial path history',
            'details': str(e)
        }), 500
    










# ===========================================================================================================
#                         INVESTMENT RECOMMENDATIONS API
# ===========================================================================================================

@app.route('/api/recommendations/generate', methods=['POST'])
def generate_investment_recommendations():
    """
    Generate personalized investment recommendations using Gemini AI
    
    POST Body:
    {
        "clerkUserId": "user_123",
        "forceRefresh": false  // Optional: force regeneration
    }
    
    Returns:
    {
        "success": true,
        "recommendations": { stocks, mutualFunds, bonds, etc. },
        "cacheInfo": { cached, generatedAt, expiresAt }
    }
    """
    try:
        data = request.json
        clerk_user_id = data.get('clerkUserId')
        force_refresh = data.get('forceRefresh', False)
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        logger.info(f"📊 Generating recommendations for user: {clerk_user_id}")
        
        db = get_database()
        recommendations_collection = db[Collections.INVESTMENT_RECOMMENDATIONS]
        
        # ========== CHECK CACHE FIRST ==========
        if not force_refresh:
            cached = recommendations_collection.find_one(
                {'clerkUserId': clerk_user_id},
                sort=[('createdAt', -1)]
            )
            
            if cached:
                # Check if cache is still valid (24 hours)
                created_at = cached.get('createdAt')
                if isinstance(created_at, datetime):
                    age = datetime.utcnow() - created_at
                    if age < timedelta(hours=24):
                        logger.info(f"✅ Returning cached recommendations (age: {age.seconds//3600}h)")
                        return jsonify({
                            'success': True,
                            'recommendations': cached.get('recommendations'),
                            'cacheInfo': {
                                'cached': True,
                                'generatedAt': str(created_at),
                                'expiresAt': str(created_at + timedelta(hours=24)),
                                'ageHours': age.seconds // 3600
                            }
                        }), 200
        
        # ========== FETCH USER PROFILE ==========
        logger.info(f"📥 Fetching user profile for: {clerk_user_id}")
        
        try:
            # Fetch all user data
            profile_res = requests.get(f"{request.host_url}api/onboarding/status?clerkUserId={clerk_user_id}")
            income_res = requests.get(f"{request.host_url}api/user-profile/income?clerkUserId={clerk_user_id}")
            expenses_res = requests.get(f"{request.host_url}api/user-profile/expenses?clerkUserId={clerk_user_id}")
            assets_res = requests.get(f"{request.host_url}api/user-profile/assets?clerkUserId={clerk_user_id}")
            liabilities_res = requests.get(f"{request.host_url}api/user-profile/liabilities?clerkUserId={clerk_user_id}")
            goals_res = requests.get(f"{request.host_url}api/user-profile/goals?clerkUserId={clerk_user_id}")
            
            # Parse responses
            profile = profile_res.json() if profile_res.status_code == 200 else {}
            income = income_res.json() if income_res.status_code == 200 else {}
            expenses = expenses_res.json() if expenses_res.status_code == 200 else {}
            assets = assets_res.json() if assets_res.status_code == 200 else {}
            liabilities = liabilities_res.json() if liabilities_res.status_code == 200 else {}
            goals = goals_res.json() if goals_res.status_code == 200 else {}
            
            # Calculate financial metrics
            monthly_income = income.get('income', [])
            monthly_income_total = sum(
                inc['amount'] if inc['frequency'] == 'monthly' else inc['amount'] / 12
                for inc in monthly_income
            )
            
            monthly_expenses = expenses.get('expenses', [])
            monthly_expenses_total = sum(
                exp['amount'] if exp['frequency'] == 'monthly' 
                else exp['amount'] / 12 if exp['frequency'] == 'yearly'
                else exp['amount'] * 4 if exp['frequency'] == 'weekly'
                else exp['amount'] * 30 if exp['frequency'] == 'daily'
                else exp['amount']
                for exp in monthly_expenses
            )
            
            total_assets = sum(asset['value'] for asset in assets.get('assets', []))
            total_liabilities = sum(liability['amount'] for liability in liabilities.get('liabilities', []))
            
            # Build user profile dict
            user_profile = {
                'clerkUserId': clerk_user_id,
                'riskTolerance': profile.get('profile', {}).get('riskTolerance', 'moderate'),
                'monthlyIncome': monthly_income_total,
                'monthlyExpenses': monthly_expenses_total,
                'monthlySavings': monthly_income_total - monthly_expenses_total,
                'totalAssets': total_assets,
                'totalLiabilities': total_liabilities,
                'netWorth': total_assets - total_liabilities,
                'financialGoals': [g['name'] for g in goals.get('goals', [])],
                'age': profile.get('profile', {}).get('age', 30)
            }
            
            logger.info(f"✅ User profile: Savings=₹{user_profile['monthlySavings']}, Risk={user_profile['riskTolerance']}")
            
        except Exception as e:
            logger.error(f"❌ Error fetching user profile: {e}")
            return jsonify({'error': 'Failed to fetch user profile', 'details': str(e)}), 500
        
        # ========== GET MARKET DATA ==========
        logger.info(f"📈 Fetching market data...")
        
        try:
            # Fetch market indices from your existing endpoint
            market_res = requests.get(f"{request.host_url}api/market/comprehensive-summary")
            market_raw = market_res.json() if market_res.status_code == 200 else {}
            
            # Extract relevant market data
            indices = market_raw.get('indices', {})
            
            # Calculate market trend
            nifty_change = indices.get('NIFTY 50', {}).get('perChange', 0)
            market_trend = 'Bullish' if nifty_change > 1 else 'Bearish' if nifty_change < -1 else 'Neutral'
            
            # Get top performing sectors
            top_sectors = []
            for name, data in indices.items():
                if 'NIFTY' in name and data.get('perChange', 0) > 2:
                    sector = name.replace('NIFTY ', '')
                    top_sectors.append(sector)
            
            market_data = {
                'niftyTrend': market_trend,
                'niftyChange': nifty_change,
                'topSectors': top_sectors[:3],  # Top 3 sectors
                'fiiFlow': 2850,  # You can make this dynamic if you have FII data API
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ Market data: Trend={market_trend}, Nifty={nifty_change}%")
            
        except Exception as e:
            logger.error(f"❌ Error fetching market data: {e}")
            # Use default market data
            market_data = {
                'niftyTrend': 'Neutral',
                'niftyChange': 0,
                'topSectors': ['IT', 'Banking', 'Pharma'],
                'fiiFlow': 0,
                'timestamp': datetime.utcnow().isoformat()
            }
        
        # ========== GENERATE AI RECOMMENDATIONS ==========
        logger.info(f"🤖 Calling Gemini AI for recommendations...")
        
        try:
            recommendations = get_personalized_recommendations(
                user_profile=user_profile,
                market_data=market_data,
                portfolio_data=None  # You can add portfolio analysis later
            )
            
            logger.info(f"✅ AI recommendations generated successfully")
            
        except Exception as e:
            logger.error(f"❌ Error generating AI recommendations: {e}")
            import traceback
            traceback.print_exc()
            return jsonify({'error': 'Failed to generate recommendations', 'details': str(e)}), 500
        
        # ========== SAVE TO MONGODB CACHE ==========
        logger.info(f"💾 Saving recommendations to MongoDB...")
        
        try:
            cache_doc = {
                'clerkUserId': clerk_user_id,
                'recommendations': recommendations,
                'userProfile': user_profile,
                'marketData': market_data,
                'createdAt': datetime.utcnow(),
                'expiresAt': datetime.utcnow() + timedelta(hours=24)
            }
            
            # Keep only last 5 recommendations per user
            existing_count = recommendations_collection.count_documents({'clerkUserId': clerk_user_id})
            if existing_count >= 5:
                oldest = recommendations_collection.find_one(
                    {'clerkUserId': clerk_user_id},
                    sort=[('createdAt', 1)]
                )
                if oldest:
                    recommendations_collection.delete_one({'_id': oldest['_id']})
            
            recommendations_collection.insert_one(cache_doc)
            logger.info(f"✅ Recommendations cached successfully")
            
        except Exception as e:
            logger.error(f"⚠️ Failed to cache recommendations: {e}")
            # Continue anyway - caching is optional
        
        # ========== RETURN RESPONSE ==========
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'cacheInfo': {
                'cached': False,
                'generatedAt': datetime.utcnow().isoformat(),
                'expiresAt': (datetime.utcnow() + timedelta(hours=24)).isoformat(),
                'ageHours': 0
            },
            'userProfile': {
                'riskTolerance': user_profile['riskTolerance'],
                'monthlySavings': user_profile['monthlySavings']
            },
            'marketConditions': market_data
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error in recommendations endpoint: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


@app.route('/api/recommendations/get', methods=['GET'])
def get_cached_recommendations():
    """
    Get cached recommendations without regenerating
    
    Query Params:
        clerkUserId: User's Clerk ID
    
    Returns cached recommendations or null if none exist
    """
    try:
        clerk_user_id = request.args.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        logger.info(f"📥 Fetching cached recommendations for: {clerk_user_id}")
        
        db = get_database()
        recommendations_collection = db[Collections.INVESTMENT_RECOMMENDATIONS]
        
        cached = recommendations_collection.find_one(
            {'clerkUserId': clerk_user_id},
            sort=[('createdAt', -1)]
        )
        
        if cached:
            created_at = cached.get('createdAt')
            age = datetime.utcnow() - created_at if isinstance(created_at, datetime) else timedelta(0)
            
            logger.info(f"✅ Found cached recommendations (age: {age.seconds//3600}h)")
            
            return jsonify({
                'success': True,
                'recommendations': cached.get('recommendations'),
                'cacheInfo': {
                    'cached': True,
                    'generatedAt': str(created_at),
                    'expiresAt': str(created_at + timedelta(hours=24)) if isinstance(created_at, datetime) else '',
                    'ageHours': age.seconds // 3600
                }
            }), 200
        else:
            logger.info(f"ℹ️ No cached recommendations found")
            return jsonify({
                'success': True,
                'recommendations': None,
                'cacheInfo': {'cached': False}
            }), 200
            
    except Exception as e:
        logger.error(f"❌ Error fetching cached recommendations: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500


@app.route('/api/recommendations/clear', methods=['DELETE'])
def clear_recommendations_cache():
    """
    Clear all cached recommendations for a user
    
    Query Params:
        clerkUserId: User's Clerk ID
    """
    try:
        clerk_user_id = request.args.get('clerkUserId')
        
        if not clerk_user_id:
            return jsonify({'error': 'clerkUserId is required'}), 400
        
        logger.info(f"🗑️ Clearing recommendations cache for: {clerk_user_id}")
        
        db = get_database()
        recommendations_collection = db[Collections.INVESTMENT_RECOMMENDATIONS]
        
        result = recommendations_collection.delete_many({'clerkUserId': clerk_user_id})
        
        logger.info(f"✅ Deleted {result.deleted_count} cached recommendation(s)")
        
        return jsonify({
            'success': True,
            'message': f'Cleared {result.deleted_count} cached recommendation(s)',
            'deletedCount': result.deleted_count
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Error clearing recommendations cache: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500
    

# =======================================================
# BACKWARD COMPATIBLE ENDPOINT FOR FRONTEND LATEST ADDED
# =======================================================
@app.route('/api/recommendations/generate', methods=['POST'])
def generate_recommendations_endpoint():
    """
    Generate fresh recommendations for the user.
    Called when no cache exists or when refresh=true.
    """
    try:
        from recommendations import RecommendationEngine
        db = get_database()

        clerk_user_id = request.json.get("clerkUserId")
        force = request.json.get("forceRefresh", False)

        if not clerk_user_id:
            return jsonify({"error": "clerkUserId is required"}), 400

        # Load user profile
        profile = db[Collections.USER_PROFILES].find_one({"clerkUserId": clerk_user_id})
        if not profile:
            return jsonify({"error": "User profile not found"}), 404

        user_data = {
            "age": profile.get("age"),
            "risk_tolerance": profile.get("riskTolerance", "Medium"),
            "monthly_income": profile.get("monthlyIncome", 0),
            "investment_goals": profile.get("investmentGoals", "Wealth Building"),
            "time_horizon": profile.get("timeHorizon", "Medium"),
        }

        engine = RecommendationEngine()
        recs = engine.generate_recommendations(user_data)

        # Save to MongoDB cache
        db[Collections.INVESTMENT_RECOMMENDATIONS].insert_one({
            "clerkUserId": clerk_user_id,
            "recommendations": recs,
            "createdAt": datetime.utcnow()
        })

        return jsonify(recs)
    
    except Exception as e:
        logger.error(f"❌ Error generating recommendations: {e}")
        return jsonify({"error": "Internal server error", "details": str(e)}), 500

    
@app.route('/api/news', methods=['GET'])
def get_news():
    """
    Proxy endpoint for fetching financial news from GNews API with yfinance fallback
    Solves CORS issues by making server-side request
    """
    try:
        # Get query parameters from frontend
        category = request.args.get('category', 'All')
        
        # Determine search term based on category
        search_term = "indian finance" if category == "All" else f"indian {category.lower()}"
        
        # Try GNews API first
        gnews_api_key = os.environ.get('GNEWS_API_KEY')
        
        if gnews_api_key:
            try:
                # Make request to GNews API (server-side, no CORS issues)
                gnews_url = f"https://gnews.io/api/v4/search?q={search_term}&lang=en&country=in&max=10&apikey={gnews_api_key}"
                
                response = requests.get(gnews_url, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    
                    # Check for API errors in response
                    if 'errors' not in data:
                        # Return articles from GNews API
                        return jsonify({
                            'articles': data.get('articles', []),
                            'totalArticles': data.get('totalArticles', 0),
                            'source': 'gnews'
                        }), 200
            except Exception as gnews_error:
                logger.warning(f"GNews API failed: {gnews_error}")
        
        # Fallback to yfinance news if GNews fails or is not configured
        logger.info("Using yfinance for news data as fallback")
        
        # Get news from popular Indian stocks as a proxy for financial news
        indian_tickers = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS', 'HINDUNILVR.NS', 'SBIN.NS']
        
        articles = []
        
        for ticker in indian_tickers[:3]:  # Limit to 3 tickers to avoid too many requests
            try:
                stock = yf.Ticker(ticker)
                news = stock.news
                
                for item in news[:3]:  # Get 3 articles per stock
                    # Convert yfinance news format to expected format
                    article = {
                        'title': item.get('title', 'No Title'),
                        'description': item.get('summary', item.get('title', 'No description available')),
                        'content': item.get('summary', ''),
                        'url': item.get('link', ''),
                        'image': item.get('thumbnail', {}).get('resolutions', [{}])[-1].get('url', 'https://via.placeholder.com/640x480?text=Financial+News'),
                        'publishedAt': datetime.fromtimestamp(item.get('providerPublishTime', time.time())).isoformat(),
                        'source': {
                            'name': item.get('publisher', 'Yahoo Finance'),
                            'url': item.get('link', '')
                        }
                    }
                    articles.append(article)
                    
                    if len(articles) >= 10:  # Limit total articles
                        break
                        
                if len(articles) >= 10:
                    break
                    
            except Exception as ticker_error:
                logger.warning(f"Failed to get news for {ticker}: {ticker_error}")
                continue
        
        # If no articles found, provide sample financial news
        if not articles:
            articles = [
                {
                    'title': 'Indian Stock Market Update',
                    'description': 'Stay updated with the latest developments in Indian financial markets.',
                    'content': 'Market analysis and financial insights.',
                    'url': 'https://finance.yahoo.com',
                    'image': 'https://via.placeholder.com/640x480?text=Market+Update',
                    'publishedAt': datetime.now().isoformat(),
                    'source': {
                        'name': 'FinEdge News',
                        'url': 'https://finance.yahoo.com'
                    }
                }
            ]
        
        return jsonify({
            'articles': articles[:10],  # Limit to 10 articles
            'totalArticles': len(articles),
            'source': 'yfinance_fallback'
        }), 200
        
    except Exception as e:
        logger.error(f"News API error: {e}")
        return jsonify({
            'error': f'Server error: {str(e)}',
            'articles': []
        }), 500
    
# add endpoint
@app.route("/api/stock-price", methods=["GET"])
def api_stock_price():
    """
    Query parameters:
      - q  : free text company name or ticker (preferred)
      - symbol : explicit symbol like ADANIGREEN.NS
    Returns JSON with latest price data.
    """
    q = request.args.get("q", "").strip()
    symbol_param = request.args.get("symbol", "").strip()

    if symbol_param:
        symbol = symbol_param.strip()
    elif q:
        symbol = resolve_ticker(q)
    else:
        return jsonify({"error": "missing query parameter 'q' or 'symbol'"}), 400

    try:
        data = fetch_stock_price_by_symbol(symbol)
        return jsonify({"success": True, "symbol": symbol, "data": data})
    except Exception as e:
        logger.exception(f"API /api/stock-price error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

# ==================== END OF NEW ENDPOINTS ====================

if __name__ == '__main__':
    init_app()
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)