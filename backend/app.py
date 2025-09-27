"""
FinEdge Backend API

A comprehensive financial platform backend providing:
- AI-powered financial agent endpoints
- Real-time market data from 25+ indices
- Financial planning and analysis tools
- Chatbot integration with advanced AI models

Author: FinEdge Team
Version: 1.0.0
"""

# Standard library imports
import logging
import os
import re
import subprocess
import sys
from datetime import datetime

# Third-party imports
from flask import Flask, request, jsonify
from flask_cors import CORS
import yfinance as yf
import pandas as pd

# Local imports
try:
    from onboard import bank_data, mf_data
except ImportError:
    logging.warning("Could not import onboard data")
    bank_data, mf_data = {}, {}

try:
    from jgaad_ai_agent_backup import jgaad_chat_with_gemini, clear_chat_session, get_active_sessions, get_chat_history
    import gemini_fin_path
except ImportError:
    logging.warning("Could not import AI modules")
    jgaad_chat_with_gemini = None
    clear_chat_session = None
    get_active_sessions = None
    get_chat_history = None
    gemini_fin_path = None

# Initialize Flask application
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.route('/', methods=['GET'])
def home():
    """Health check endpoint for the FinEdge API."""
    return jsonify({
        "status": "healthy",
        "message": "FinEdge API is running",
        "version": "1.0.0",
        "endpoints": [
            "/agent - AI Financial Agent",
            "/api/market-summary - Market Data",
            "/ai-financial-path - Financial Planning"
        ]
    })

# =================== DYNAMIC APIS ===================
@app.route('/agent', methods=['POST'])
def agent():
    inp = request.form.get('input')
    session_id = request.form.get('session_id', 'default')  # Get session ID from request
    
    if not inp:
        return jsonify({'error': 'No input provided'}), 400
    
    # Basic input validation
    if len(inp) > 1000:  # Prevent extremely long inputs
        return jsonify({'error': 'Input too long'}), 400
    
    try:
        print(f"Processing input: {inp}")
        
        # Add timeout to prevent hanging - use full path to ensure correct environment
        import os
        import sys
        python_executable = sys.executable  # Use the same Python that's running Flask
        agent_path = os.path.join(os.path.dirname(__file__), 'agent.py')
        
        process = subprocess.Popen(
            [python_executable, agent_path, inp], 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE,
            universal_newlines=True,
            cwd=os.path.dirname(__file__)  # Set working directory to backend folder
        )
        
        output = []
        # Stream output in real-time
        if process.stdout is not None:
            while True:
                line = process.stdout.readline()
                if not line and process.poll() is not None:
                    break
                if line:
                    print(line.strip())  # Print to terminal in real-time
                    output.append(line)
        else:
            logger.error("process.stdout is None")
        
        output_str = ''.join(output)
        return_code = process.wait()
        
        # Check if process failed
        if return_code != 0:
            if process.stderr is not None:
                stderr = process.stderr.read()
            else:
                stderr = ""
                logger.error("process.stderr is None")
            logger.error(f"Agent script failed with return code {return_code}")
            logger.error(f"STDERR: {stderr}")
            logger.error(f"STDOUT: {output_str}")
            return jsonify({
                'error': 'Agent processing failed', 
                'details': stderr[:500],  # Include error details for debugging
                'return_code': return_code
            }), 500
        
        # Debug: Log the full output to see what we received
        logger.info(f"Agent output: {output_str[:500]}...")  # Log first 500 chars
        
        # Use regex to extract the response between <Response> tags
        final_answer = re.search(r'<Response>(.*?)</Response>', output_str, re.DOTALL)
        if final_answer:
            final_answer = final_answer.group(1).strip()
        else:
            logger.warning(f"No <Response> tags found in output. Full output: {output_str}")
            # Try to extract the agent's final answer differently
            if "Final Answer:" in output_str:
                # Extract everything after "Final Answer:"
                final_answer = output_str.split("Final Answer:")[-1].strip()
            else:
                # Fallback to backup AI if available
                if jgaad_chat_with_gemini:
                    try:
                        final_answer = jgaad_chat_with_gemini(inp, output_str, session_id)
                    except Exception as e:
                        logger.error(f"Backup AI failed: {e}")
                        final_answer = "Error processing request"
                else:
                    final_answer = f"Agent ran but no proper response found. Output: {output_str[-200:]}"
        
        return jsonify({'output': final_answer, 'thought': output_str})
        
    except subprocess.TimeoutExpired:
        process.kill()
        return jsonify({'error': 'Request timed out'}), 500
    except Exception as e:
        logger.error(f"Error in agent endpoint: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/ai-financial-path', methods=['POST'])
def ai_financial_path():
    # Fix the original bug - check if 'input' exists in form data
    if 'input' not in request.form:
        return jsonify({'error': 'No input provided'}), 400
        
    input_text = request.form.get('input', '').strip()
    if not input_text:
        return jsonify({'error': 'Input cannot be empty'}), 400
        
    risk = request.form.get('risk', 'conservative')
    
    # Validate risk level
    allowed_risks = ['conservative', 'moderate', 'aggressive']
    if risk not in allowed_risks:
        return jsonify({'error': f'Invalid risk level. Allowed: {allowed_risks}'}), 400
    
    print(f"Processing financial path for: {input_text}, risk: {risk}")
    
    if not gemini_fin_path:
        return jsonify({'error': 'Financial AI service not available'}), 503
    
    try:
        response = gemini_fin_path.get_gemini_response(input_text, risk)
        return jsonify(response)
    except Exception as e:
        logger.error(f"Financial path error: {e}")
        return jsonify({'error': 'Something went wrong'}), 500

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

@app.route('/clear-chat-session', methods=['POST'])
def clear_chat_session_endpoint():
    """Clear a specific chat session"""
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
    """Get list of all active chat sessions"""
    try:
        if get_active_sessions:
            sessions = get_active_sessions()
            return jsonify({
                'active_sessions': sessions,
                'count': len(sessions)
            })
        else:
            return jsonify({'error': 'Session management not available'}), 503
            
    except Exception as e:
        logger.error(f"Error getting active sessions: {e}")
        return jsonify({'error': 'Internal server error'}), 500

@app.route('/chat-history', methods=['GET'])
def get_chat_history_endpoint():
    """Get chat history for a specific session"""
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

# =================== BOTS ===================
# Add your bot endpoints here

if __name__ == "__main__":
    app.run(debug=True)