"""
Enhanced Investment Recommendation Engine with Robust Error Handling
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import LLM providers
try:
    from langchain_groq import ChatGroq
    GROQ_AVAILABLE = True
except:
    logger.warning("Groq not available")
    GROQ_AVAILABLE = False

try:
    from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
    HF_AVAILABLE = True
except:
    try:
        from langchain_community.chat_models.huggingface import ChatHuggingFace
        from langchain_community.llms.huggingface_endpoint import HuggingFaceEndpoint
        HF_AVAILABLE = True
    except:
        logger.warning("HuggingFace not available")
        HF_AVAILABLE = False

# API Configuration
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

ACTIVE_LLM_PROVIDER = None
ACTIVE_API_KEY = None
ACTIVE_KEY_INDEX = None


def initialize_llm_with_fallback(temperature=0.7, max_tokens=8192, model_override=None):
    """Initialize LLM with automatic fallback between providers"""
    global ACTIVE_LLM_PROVIDER, ACTIVE_API_KEY, ACTIVE_KEY_INDEX

    if GROQ_AVAILABLE:
        for idx, api_key in enumerate(GROQ_API_KEYS, start=1):
            if not api_key:
                continue
            try:
                logger.info(f"Initializing Groq with key #{idx}")
                llm = ChatGroq(
                    model=model_override or "llama-3.3-70b-versatile",
                    groq_api_key=api_key,
                    temperature=temperature,
                    max_tokens=max_tokens
                )
                from langchain_core.messages import HumanMessage
                test = llm.invoke([HumanMessage(content="test")])
                if test and hasattr(test, "content"):
                    ACTIVE_LLM_PROVIDER = "groq"
                    ACTIVE_API_KEY = api_key
                    ACTIVE_KEY_INDEX = idx
                    logger.info(f"✅ Groq initialized (key #{idx})")
                    return llm
            except Exception as e:
                logger.warning(f"Groq key #{idx} failed: {e}")

    if HF_AVAILABLE:
        for idx, token in enumerate(HF_TOKENS, start=1):
            if not token:
                continue
            try:
                logger.info(f"Initializing HuggingFace with token #{idx}")
                endpoint = HuggingFaceEndpoint(
                    repo_id=model_override or "meta-llama/Llama-3.3-70B-Instruct",
                    huggingfacehub_api_token=token,
                    temperature=temperature,
                    max_new_tokens=max_tokens,
                )
                llm = ChatHuggingFace(llm=endpoint)
                from langchain_core.messages import HumanMessage
                test = llm.invoke([HumanMessage(content="test")])
                if test and hasattr(test, "content"):
                    ACTIVE_LLM_PROVIDER = "huggingface"
                    ACTIVE_API_KEY = token
                    ACTIVE_KEY_INDEX = idx
                    logger.info(f"✅ HuggingFace initialized (token #{idx})")
                    return llm
            except Exception as e:
                logger.warning(f"HuggingFace token #{idx} failed: {e}")

    raise ValueError("All LLM providers failed. Check API keys.")


def clean_and_extract_json(text: str) -> Optional[Dict]:
    """Extract and parse JSON with aggressive cleaning"""
    if not text or not text.strip():
        return None

    # Remove markdown code blocks
    text = re.sub(r'```(?:json)?\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    # Remove unicode quotes
    text = text.replace('\u201c', '"').replace('\u201d', '"')
    text = text.replace('\u2018', "'").replace('\u2019', "'")
    
    # Find JSON object boundaries
    start = text.find('{')
    if start == -1:
        return None
    
    depth = 0
    in_string = False
    escape = False
    
    for i in range(start, len(text)):
        ch = text[i]
        
        if ch == '"' and not escape:
            in_string = not in_string
        
        if ch == '\\' and not escape:
            escape = True
        else:
            escape = False
        
        if not in_string:
            if ch == '{':
                depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    candidate = text[start:i+1]
                    
                    # Clean the candidate
                    candidate = re.sub(r',\s*([\]}])', r'\1', candidate)  # Remove trailing commas
                    candidate = re.sub(r'₹\s*', '', candidate)  # Remove currency symbols
                    
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError as e:
                        logger.warning(f"JSON parse error: {e}")
                        return None
    
    return None


def safe_number(value, default=0):
    """Safely convert any value to a number"""
    if value is None or value == '':
        return default
    
    if isinstance(value, (int, float)):
        if value != value:  # Check for NaN
            return default
        return value
    
    if isinstance(value, str):
        # Remove all non-numeric characters except . and -
        cleaned = re.sub(r'[^\d.-]', '', value)
        try:
            if '.' in cleaned:
                return float(cleaned)
            return int(cleaned)
        except (ValueError, TypeError):
            return default
    
    return default


def safe_string(value, default='N/A'):
    """Safely convert value to string"""
    if value is None or value == '':
        return default
    return str(value).strip()


class RecommendationEngine:
    def __init__(self, temperature=0.7, max_tokens=8192, model_override=None):
        try:
            self.model = initialize_llm_with_fallback(temperature, max_tokens, model_override)
            logger.info(f"✅ Engine initialized: {ACTIVE_LLM_PROVIDER} (key #{ACTIVE_KEY_INDEX})")
        except Exception as e:
            logger.error(f"Failed to initialize: {e}")
            raise

    def _build_prompt(self, user_profile: Dict, market_data: Dict, portfolio_data: Optional[Dict]) -> str:
        """Build comprehensive prompt with strict JSON requirements"""
        
        risk_tolerance = safe_string(user_profile.get('riskTolerance'), 'moderate')
        monthly_income = safe_number(user_profile.get('monthlyIncome'), 50000)
        monthly_expenses = safe_number(user_profile.get('monthlyExpenses'), 30000)
        monthly_savings = max(0, monthly_income - monthly_expenses)
        age = safe_number(user_profile.get('age'), 30)
        goals = user_profile.get('financialGoals', ['Wealth creation'])
        
        nifty_trend = safe_string(market_data.get('niftyTrend'), 'Neutral')
        fii_flow = safe_number(market_data.get('fiiFlow'), 0)
        top_sectors = market_data.get('topSectors', ['IT', 'Banking', 'Pharma'])

        prompt = f"""STRICT JSON OUTPUT REQUIRED. Return ONLY valid JSON, no text before or after.

USER PROFILE:
- Risk Tolerance: {risk_tolerance}
- Monthly Savings: ₹{monthly_savings:,}
- Age: {age}
- Goals: {', '.join(goals) if isinstance(goals, list) else goals}

MARKET DATA (India):
- NIFTY Trend: {nifty_trend}
- FII Flow: {fii_flow} Cr
- Top Sectors: {', '.join(top_sectors)}

GENERATE investment recommendations matching this EXACT JSON structure:

{{
  "marketSentiment": {{
    "trend": "Bullish/Neutral/Bearish",
    "fiiFlow": "{fii_flow}",
    "riskLevel": "Low/Moderate/High",
    "summary": "2-3 sentence market analysis"
  }},
  "stocks": [
    {{
      "symbol": "RELIANCE",
      "name": "Reliance Industries Ltd",
      "currentPrice": 2450,
      "targetPrice": 2800,
      "expectedReturn": "14-18%",
      "riskLevel": "Moderate",
      "sector": "Energy",
      "recommendedAllocation": 15,
      "monthlyInvestment": {int(monthly_savings * 0.15)},
      "reasoning": "Strong fundamentals with diversified revenue streams",
      "keyMetrics": {{"pe": 24.5, "marketCap": "Large Cap", "dividend": "0.5%"}}
    }}
  ],
  "mutualFunds": [
    {{
      "name": "ICICI Prudential Bluechip Fund",
      "category": "Large Cap",
      "nav": 68.50,
      "returns1Y": 15.2,
      "returns3Y": 18.5,
      "returns5Y": 16.8,
      "riskLevel": "Moderate",
      "recommendedAllocation": 25,
      "monthlyInvestment": {int(monthly_savings * 0.25)},
      "reasoning": "Consistent performer with low expense ratio",
      "rating": 4
    }}
  ],
  "fixedDeposits": [
    {{
      "bank": "HDFC Bank",
      "tenure": "1 Year",
      "interestRate": 7.0,
      "minAmount": 10000,
      "recommendedAllocation": 20,
      "monthlyInvestment": {int(monthly_savings * 0.20)},
      "reasoning": "Safe guaranteed returns for emergency fund",
      "features": ["Guaranteed returns", "Premature withdrawal available", "Tax saver option"]
    }}
  ],
  "bonds": [
    {{
      "name": "HDFC Bank Bonds",
      "type": "Corporate Bond",
      "tenure": "3 Years",
      "interestRate": 7.5,
      "minAmount": 10000,
      "recommendedAllocation": 10,
      "monthlyInvestment": {int(monthly_savings * 0.10)},
      "reasoning": "Higher yields than FDs with good credit rating",
      "features": ["AAA rated", "Fixed returns", "Tradeable"]
    }}
  ],
  "realEstate": [
    {{
      "type": "REIT",
      "name": "Embassy Office Parks REIT",
      "expectedReturn": "8-10%",
      "lockInPeriod": "Open-ended",
      "minAmount": 50000,
      "recommendedAllocation": 10,
      "reasoning": "Real estate exposure without large capital commitment",
      "features": ["Regular dividend income", "Listed on NSE", "Professional management"]
    }}
  ],
  "actionPlan": [
    "Build emergency fund covering 6 months expenses",
    "Start SIPs in recommended mutual funds",
    "Diversify across asset classes as per allocation",
    "Review portfolio quarterly and rebalance"
  ]
}}

CRITICAL RULES:
1. ALL numeric values must be plain numbers (no commas, no ₹ symbols)
2. Provide at least 3-5 recommendations per category
3. Ensure monthlyInvestment values are realistic based on savings
4. ALL fields must be present with valid data
5. Return ONLY the JSON object, nothing else

Generate the complete JSON now:"""

        return prompt

    def _validate_and_normalize(self, data: Dict, user_profile: Dict, market_data: Dict) -> Dict:
        """Comprehensive validation and normalization"""
        
        monthly_income = safe_number(user_profile.get('monthlyIncome'), 50000)
        monthly_expenses = safe_number(user_profile.get('monthlyExpenses'), 30000)
        monthly_savings = max(1000, monthly_income - monthly_expenses)
        
        # Ensure marketSentiment exists
        if 'marketSentiment' not in data or not isinstance(data['marketSentiment'], dict):
            data['marketSentiment'] = {
                'trend': safe_string(market_data.get('niftyTrend'), 'Neutral'),
                'fiiFlow': str(safe_number(market_data.get('fiiFlow'), 0)),
                'riskLevel': 'Moderate',
                'summary': 'Market conditions are stable. Diversification recommended.'
            }
        
        # Normalize stocks
        if 'stocks' not in data or not isinstance(data['stocks'], list):
            data['stocks'] = []
        
        for stock in data['stocks']:
            stock['currentPrice'] = safe_number(stock.get('currentPrice'), 100)
            stock['targetPrice'] = safe_number(stock.get('targetPrice'), stock['currentPrice'] * 1.1)
            stock['recommendedAllocation'] = safe_number(stock.get('recommendedAllocation'), 10)
            stock['monthlyInvestment'] = safe_number(
                stock.get('monthlyInvestment'),
                int(monthly_savings * stock['recommendedAllocation'] / 100)
            )
            stock['symbol'] = safe_string(stock.get('symbol'), 'N/A')
            stock['name'] = safe_string(stock.get('name'), 'Unknown Stock')
            stock['expectedReturn'] = safe_string(stock.get('expectedReturn'), '10-15%')
            stock['riskLevel'] = safe_string(stock.get('riskLevel'), 'Moderate')
            stock['sector'] = safe_string(stock.get('sector'), 'Diversified')
            stock['reasoning'] = safe_string(stock.get('reasoning'), 'Quality stock with growth potential')
            
            if 'keyMetrics' not in stock:
                stock['keyMetrics'] = {}
            stock['keyMetrics']['pe'] = safe_number(stock['keyMetrics'].get('pe'), 20)
            stock['keyMetrics']['marketCap'] = safe_string(stock['keyMetrics'].get('marketCap'), 'Large Cap')
            stock['keyMetrics']['dividend'] = safe_string(stock['keyMetrics'].get('dividend'), '1%')
        
        # Normalize mutual funds
        if 'mutualFunds' not in data or not isinstance(data['mutualFunds'], list):
            data['mutualFunds'] = []
        
        for fund in data['mutualFunds']:
            fund['nav'] = safe_number(fund.get('nav'), 50)
            fund['returns1Y'] = safe_number(fund.get('returns1Y'), 12)
            fund['returns3Y'] = safe_number(fund.get('returns3Y'), 14)
            fund['returns5Y'] = safe_number(fund.get('returns5Y'), 13)
            fund['recommendedAllocation'] = safe_number(fund.get('recommendedAllocation'), 15)
            fund['monthlyInvestment'] = safe_number(
                fund.get('monthlyInvestment'),
                int(monthly_savings * fund['recommendedAllocation'] / 100)
            )
            fund['rating'] = safe_number(fund.get('rating'), 4)
            fund['name'] = safe_string(fund.get('name'), 'Diversified Fund')
            fund['category'] = safe_string(fund.get('category'), 'Equity')
            fund['riskLevel'] = safe_string(fund.get('riskLevel'), 'Moderate')
            fund['reasoning'] = safe_string(fund.get('reasoning'), 'Consistent long-term performer')
        
        # Normalize fixed deposits
        if 'fixedDeposits' not in data or not isinstance(data['fixedDeposits'], list):
            data['fixedDeposits'] = []
        
        for fd in data['fixedDeposits']:
            fd['interestRate'] = safe_number(fd.get('interestRate'), 6.5)
            fd['minAmount'] = safe_number(fd.get('minAmount'), 10000)
            fd['recommendedAllocation'] = safe_number(fd.get('recommendedAllocation'), 15)
            fd['monthlyInvestment'] = safe_number(
                fd.get('monthlyInvestment'),
                int(monthly_savings * fd['recommendedAllocation'] / 100)
            )
            fd['bank'] = safe_string(fd.get('bank'), 'Major Bank')
            fd['tenure'] = safe_string(fd.get('tenure'), '1 Year')
            fd['reasoning'] = safe_string(fd.get('reasoning'), 'Safe guaranteed returns')
            
            if 'features' not in fd or not isinstance(fd['features'], list):
                fd['features'] = ['Guaranteed returns', 'Capital protection', 'Flexible tenure']
        
        # Normalize bonds
        if 'bonds' not in data or not isinstance(data['bonds'], list):
            data['bonds'] = []
        
        for bond in data['bonds']:
            bond['interestRate'] = safe_number(bond.get('interestRate'), 7.0)
            bond['minAmount'] = safe_number(bond.get('minAmount'), 10000)
            bond['recommendedAllocation'] = safe_number(bond.get('recommendedAllocation'), 10)
            bond['monthlyInvestment'] = safe_number(
                bond.get('monthlyInvestment'),
                int(monthly_savings * bond['recommendedAllocation'] / 100)
            )
            bond['name'] = safe_string(bond.get('name'), 'Corporate Bond')
            bond['type'] = safe_string(bond.get('type'), 'Corporate')
            bond['tenure'] = safe_string(bond.get('tenure'), '3 Years')
            bond['reasoning'] = safe_string(bond.get('reasoning'), 'Higher yields with good rating')
            
            if 'features' not in bond or not isinstance(bond['features'], list):
                bond['features'] = ['Fixed returns', 'Credit rated', 'Regular interest']
        
        # Normalize real estate
        if 'realEstate' not in data or not isinstance(data['realEstate'], list):
            data['realEstate'] = []
        
        for re in data['realEstate']:
            re['minAmount'] = safe_number(re.get('minAmount'), 50000)
            re['recommendedAllocation'] = safe_number(re.get('recommendedAllocation'), 10)
            re['type'] = safe_string(re.get('type'), 'REIT')
            re['name'] = safe_string(re.get('name'), 'Real Estate Fund')
            re['expectedReturn'] = safe_string(re.get('expectedReturn'), '8-10%')
            re['lockInPeriod'] = safe_string(re.get('lockInPeriod'), 'Open-ended')
            re['reasoning'] = safe_string(re.get('reasoning'), 'Real estate exposure without large capital')
            
            if 'features' not in re or not isinstance(re['features'], list):
                re['features'] = ['Professional management', 'Regular income', 'Listed security']
        
        # Action plan
        if 'actionPlan' not in data or not isinstance(data['actionPlan'], list) or len(data['actionPlan']) == 0:
            data['actionPlan'] = [
                'Build emergency fund covering 6 months expenses',
                'Start SIPs in recommended mutual funds',
                'Diversify investments across asset classes',
                'Review and rebalance portfolio quarterly'
            ]
        
        # Metadata
        data['metadata'] = {
            'generatedAt': datetime.utcnow().isoformat(),
            'provider': ACTIVE_LLM_PROVIDER,
            'keyIndex': ACTIVE_KEY_INDEX,
            'validated': True
        }
        
        return data

    def _get_fallback_recommendations(self, user_profile: Dict, market_data: Dict) -> Dict:
        """High-quality fallback recommendations"""
        
        monthly_income = safe_number(user_profile.get('monthlyIncome'), 50000)
        monthly_expenses = safe_number(user_profile.get('monthlyExpenses'), 30000)
        monthly_savings = max(1000, monthly_income - monthly_expenses)
        risk_tolerance = safe_string(user_profile.get('riskTolerance'), 'moderate').lower()
        
        # Adjust allocations based on risk
        if risk_tolerance == 'low':
            equity_allocation = 0.20
            debt_allocation = 0.50
            fd_allocation = 0.30
        elif risk_tolerance == 'high':
            equity_allocation = 0.50
            debt_allocation = 0.20
            fd_allocation = 0.30
        else:  # moderate
            equity_allocation = 0.35
            debt_allocation = 0.35
            fd_allocation = 0.30
        
        return {
            'marketSentiment': {
                'trend': safe_string(market_data.get('niftyTrend'), 'Neutral'),
                'fiiFlow': str(safe_number(market_data.get('fiiFlow'), 0)),
                'riskLevel': 'Moderate',
                'summary': 'Market conditions are stable with moderate volatility. Diversified approach recommended for long-term wealth creation.'
            },
            'stocks': [
                {
                    'symbol': 'RELIANCE',
                    'name': 'Reliance Industries Ltd',
                    'currentPrice': 2450,
                    'targetPrice': 2800,
                    'expectedReturn': '14-18%',
                    'riskLevel': 'Moderate',
                    'sector': 'Energy',
                    'recommendedAllocation': int(equity_allocation * 40),
                    'monthlyInvestment': int(monthly_savings * equity_allocation * 0.40),
                    'reasoning': 'Diversified conglomerate with strong fundamentals and consistent growth across multiple sectors',
                    'keyMetrics': {'pe': 24.5, 'marketCap': 'Large Cap', 'dividend': '0.5%'}
                },
                {
                    'symbol': 'HDFCBANK',
                    'name': 'HDFC Bank Ltd',
                    'currentPrice': 1650,
                    'targetPrice': 1850,
                    'expectedReturn': '12-15%',
                    'riskLevel': 'Low',
                    'sector': 'Banking',
                    'recommendedAllocation': int(equity_allocation * 35),
                    'monthlyInvestment': int(monthly_savings * equity_allocation * 0.35),
                    'reasoning': 'Leading private sector bank with robust asset quality and digital banking capabilities',
                    'keyMetrics': {'pe': 18.5, 'marketCap': 'Large Cap', 'dividend': '1.2%'}
                },
                {
                    'symbol': 'TCS',
                    'name': 'Tata Consultancy Services',
                    'currentPrice': 3850,
                    'targetPrice': 4200,
                    'expectedReturn': '10-13%',
                    'riskLevel': 'Low',
                    'sector': 'IT',
                    'recommendedAllocation': int(equity_allocation * 25),
                    'monthlyInvestment': int(monthly_savings * equity_allocation * 0.25),
                    'reasoning': 'Global IT leader with strong client base and consistent revenue growth',
                    'keyMetrics': {'pe': 26.8, 'marketCap': 'Large Cap', 'dividend': '1.8%'}
                }
            ],
            'mutualFunds': [
                {
                    'name': 'ICICI Prudential Bluechip Fund',
                    'category': 'Large Cap',
                    'nav': 68.50,
                    'returns1Y': 15.2,
                    'returns3Y': 18.5,
                    'returns5Y': 16.8,
                    'riskLevel': 'Moderate',
                    'recommendedAllocation': int(debt_allocation * 50),
                    'monthlyInvestment': int(monthly_savings * debt_allocation * 0.50),
                    'reasoning': 'Consistent performer with diversified portfolio and low expense ratio',
                    'rating': 4
                },
                {
                    'name': 'SBI Magnum Balanced Fund',
                    'category': 'Hybrid',
                    'nav': 45.30,
                    'returns1Y': 13.8,
                    'returns3Y': 16.2,
                    'returns5Y': 14.5,
                    'riskLevel': 'Moderate',
                    'recommendedAllocation': int(debt_allocation * 30),
                    'monthlyInvestment': int(monthly_savings * debt_allocation * 0.30),
                    'reasoning': 'Balanced approach with equity and debt allocation for steady returns',
                    'rating': 4
                },
                {
                    'name': 'HDFC Corporate Bond Fund',
                    'category': 'Debt',
                    'nav': 25.80,
                    'returns1Y': 7.5,
                    'returns3Y': 8.2,
                    'returns5Y': 7.8,
                    'riskLevel': 'Low',
                    'recommendedAllocation': int(debt_allocation * 20),
                    'monthlyInvestment': int(monthly_savings * debt_allocation * 0.20),
                    'reasoning': 'Low-risk debt fund with stable returns and high credit quality portfolio',
                    'rating': 5
                }
            ],
            'fixedDeposits': [
                {
                    'bank': 'HDFC Bank',
                    'tenure': '1 Year',
                    'interestRate': 7.0,
                    'minAmount': 10000,
                    'recommendedAllocation': int(fd_allocation * 50),
                    'monthlyInvestment': int(monthly_savings * fd_allocation * 0.50),
                    'reasoning': 'Safe guaranteed returns with high liquidity and capital protection',
                    'features': ['Guaranteed returns', 'Premature withdrawal available', 'Auto-renewal option']
                },
                {
                    'bank': 'SBI Fixed Deposit',
                    'tenure': '2 Years',
                    'interestRate': 7.25,
                    'minAmount': 10000,
                    'recommendedAllocation': int(fd_allocation * 50),
                    'monthlyInvestment': int(monthly_savings * fd_allocation * 0.50),
                    'reasoning': 'Higher interest rate for longer tenure with government backing',
                    'features': ['Higher returns', 'Loan against FD', 'Senior citizen benefits']
                }
            ],
            'bonds': [
                {
                    'name': 'HDFC Bank Bonds',
                    'type': 'Corporate Bond',
                    'tenure': '3 Years',
                    'interestRate': 7.5,
                    'minAmount': 10000,
                    'recommendedAllocation': 10,
                    'monthlyInvestment': int(monthly_savings * 0.10),
                    'reasoning': 'Higher yields than FDs with AAA credit rating and tradeable nature',
                    'features': ['AAA rated', 'Fixed returns', 'Listed and tradeable', 'Better than FD returns']
                }
            ],
            'realEstate': [
                {
                    'type': 'REIT',
                    'name': 'Embassy Office Parks REIT',
                    'expectedReturn': '8-10%',
                    'lockInPeriod': 'Open-ended',
                    'minAmount': 50000,
                    'recommendedAllocation': 5,
                    'reasoning': 'Real estate exposure without large capital commitment with regular dividend income',
                    'features': ['Regular dividend income', 'Listed on NSE', 'Professional management', 'Diversified property portfolio']
                }
            ],
            'actionPlan': [
                f'Build emergency fund of ₹{monthly_expenses * 6:,.0f} (6 months expenses) in liquid savings',
                f'Invest ₹{int(monthly_savings * equity_allocation):,} monthly in stocks/equity funds for growth',
                f'Allocate ₹{int(monthly_savings * debt_allocation):,} monthly to debt funds for stability',
                f'Keep ₹{int(monthly_savings * fd_allocation):,} monthly in FDs for safety and liquidity',
                'Review portfolio every quarter and rebalance if allocation drifts by more than 5%',
                'Increase equity allocation gradually as you gain investment experience',
                'Consider tax-saving investments (ELSS, PPF) to optimize returns',
                'Maintain adequate health and term insurance coverage'
            ],
            'metadata': {
                'generatedAt': datetime.utcnow().isoformat(),
                'source': 'fallback',
                'provider': 'system',
                'validated': True
            }
        }

    def generate_recommendations(self, user_profile: Dict, market_data: Dict, portfolio_data: Optional[Dict] = None) -> Dict:
        """Generate recommendations with robust error handling"""
        
        if not self.model:
            logger.error("LLM not initialized, using fallback")
            return self._get_fallback_recommendations(user_profile, market_data)
        
        prompt = self._build_prompt(user_profile, market_data, portfolio_data)
        
        max_attempts = 3
        for attempt in range(1, max_attempts + 1):
            try:
                logger.info(f"🤖 Generating recommendations (attempt {attempt}/{max_attempts})")
                
                from langchain_core.messages import HumanMessage
                response = self.model.invoke([HumanMessage(content=prompt)])
                raw_text = getattr(response, 'content', '') or str(response)
                
                logger.info(f"📝 Received {len(raw_text)} characters")
                
                # Extract and parse JSON
                parsed = clean_and_extract_json(raw_text)
                
                if parsed:
                    # Validate and normalize
                    validated = self._validate_and_normalize(parsed, user_profile, market_data)
                    logger.info("✅ Successfully generated and validated recommendations")
                    return validated
                else:
                    logger.warning(f"⚠️ Failed to parse JSON on attempt {attempt}")
                    if attempt < max_attempts:
                        continue
                    
            except Exception as e:
                logger.error(f"❌ Error on attempt {attempt}: {e}")
                if attempt >= max_attempts:
                    break
        
        # All attempts failed, return fallback
        logger.warning("⚠️ All attempts failed, returning fallback recommendations")
        return self._get_fallback_recommendations(user_profile, market_data)


# Global instance
try:
    recommendation_engine = RecommendationEngine()
    logger.info("✅ Global recommendation engine initialized")
except Exception as e:
    logger.error(f"❌ Failed to initialize global engine: {e}")
    recommendation_engine = None


def get_personalized_recommendations(user_profile: Dict, market_data: Dict, portfolio_data: Optional[Dict] = None) -> Dict:
    """Public API to generate recommendations"""
    if recommendation_engine is None:
        logger.error("Engine not initialized, creating fallback")
        temp_engine = RecommendationEngine()
        return temp_engine._get_fallback_recommendations(user_profile, market_data)
    
    return recommendation_engine.generate_recommendations(user_profile, market_data, portfolio_data)




























# """
# gemini_recommendations.py - Enhanced Recommendations Engine
# Robust data validation, structured output, and error handling
# """

# import os
# import re
# import json
# import logging
# from typing import Dict, List, Any, Optional
# from datetime import datetime

# # Configure logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # Import LLM libraries
# try:
#     from langchain_groq import ChatGroq
#     GROQ_AVAILABLE = True
# except Exception:
#     logger.warning("langchain_groq not available")
#     GROQ_AVAILABLE = False

# try:
#     from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
#     HF_AVAILABLE = True
# except Exception:
#     try:
#         from langchain_community.chat_models.huggingface import ChatHuggingFace
#         from langchain_community.llms.huggingface_endpoint import HuggingFaceEndpoint
#         HF_AVAILABLE = True
#     except Exception:
#         logger.warning("HuggingFace not available")
#         HF_AVAILABLE = False


# class RecommendationEngine:
#     """AI-powered investment recommendation engine with robust validation"""
    
#     def __init__(self):
#         self.groq_api_key = os.getenv("GROQ_API_KEY")
#         self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
#         self.llm = self._initialize_llm()
        
#     def _initialize_llm(self):
#         """Initialize LLM with fallback chain"""
#         if GROQ_AVAILABLE and self.groq_api_key:
#             try:
#                 return ChatGroq(
#                     api_key=self.groq_api_key,
#                     model_name="llama-3.1-70b-versatile",
#                     temperature=0.3,
#                     max_tokens=4000
#                 )
#             except Exception as e:
#                 logger.error(f"Groq initialization failed: {e}")
        
#         if HF_AVAILABLE and self.hf_token:
#             try:
#                 endpoint = HuggingFaceEndpoint(
#                     repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
#                     huggingfacehub_api_token=self.hf_token,
#                     max_new_tokens=3000,
#                     temperature=0.3
#                 )
#                 return ChatHuggingFace(llm=endpoint)
#             except Exception as e:
#                 logger.error(f"HuggingFace initialization failed: {e}")
        
#         return None

#     def _safe_float(self, value: Any, default: float = 0.0) -> float:
#         """Safely convert value to float with validation"""
#         if value is None:
#             return default
        
#         if isinstance(value, (int, float)):
#             return float(value) if value > 0 else default
        
#         if isinstance(value, str):
#             # Remove currency symbols and commas
#             cleaned = re.sub(r'[₹$,\s]', '', value)
#             try:
#                 result = float(cleaned)
#                 return result if result > 0 else default
#             except (ValueError, TypeError):
#                 return default
        
#         return default

#     def _validate_recommendation_item(self, item: Dict, rec_type: str) -> Optional[Dict]:
#         """Validate and sanitize a single recommendation item"""
#         if not isinstance(item, dict):
#             return None
        
#         try:
#             # Common fields for all types
#             base_fields = {
#                 'name': str(item.get('name', '')).strip(),
#                 'type': str(item.get('type', '')).strip(),
#                 'rationale': str(item.get('rationale', '')).strip()
#             }
            
#             # Type-specific validation
#             if rec_type == 'stocks':
#                 validated = {
#                     **base_fields,
#                     'symbol': str(item.get('symbol', '')).strip().upper(),
#                     'sector': str(item.get('sector', '')).strip(),
#                     'currentPrice': self._safe_float(item.get('currentPrice')),
#                     'targetPrice': self._safe_float(item.get('targetPrice')),
#                     'potentialReturn': self._safe_float(item.get('potentialReturn')),
#                     'riskLevel': str(item.get('riskLevel', 'Medium')).strip(),
#                     'timeframe': str(item.get('timeframe', '6-12 months')).strip()
#                 }
#                 # Ensure minimum valid data
#                 if not validated['name'] or validated['currentPrice'] <= 0:
#                     return None
                    
#             elif rec_type == 'mutualFunds':
#                 validated = {
#                     **base_fields,
#                     'fundHouse': str(item.get('fundHouse', '')).strip(),
#                     'category': str(item.get('category', '')).strip(),
#                     'nav': self._safe_float(item.get('nav')),
#                     'returns1yr': self._safe_float(item.get('returns1yr', item.get('returns_1yr', 0))),
#                     'returns3yr': self._safe_float(item.get('returns3yr', item.get('returns_3yr', 0))),
#                     'expenseRatio': self._safe_float(item.get('expenseRatio', item.get('expense_ratio', 0))),
#                     'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 500))),
#                     'riskLevel': str(item.get('riskLevel', 'Medium')).strip()
#                 }
#                 if not validated['name'] or validated['nav'] <= 0:
#                     return None
                    
#             elif rec_type == 'bonds':
#                 validated = {
#                     **base_fields,
#                     'issuer': str(item.get('issuer', '')).strip(),
#                     'rating': str(item.get('rating', '')).strip(),
#                     'couponRate': self._safe_float(item.get('couponRate', item.get('coupon_rate', 0))),
#                     'ytm': self._safe_float(item.get('ytm', item.get('yield_to_maturity', 0))),
#                     'maturity': str(item.get('maturity', '')).strip(),
#                     'faceValue': self._safe_float(item.get('faceValue', item.get('face_value', 1000))),
#                     'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 10000))),
#                     'riskLevel': str(item.get('riskLevel', 'Low')).strip()
#                 }
#                 if not validated['name'] or validated['couponRate'] <= 0:
#                     return None
                    
#             elif rec_type == 'realEstate':
#                 validated = {
#                     **base_fields,
#                     'location': str(item.get('location', '')).strip(),
#                     'propertyType': str(item.get('propertyType', item.get('property_type', ''))).strip(),
#                     'expectedPrice': self._safe_float(item.get('expectedPrice', item.get('expected_price', 0))),
#                     'rentalYield': self._safe_float(item.get('rentalYield', item.get('rental_yield', 0))),
#                     'appreciationPotential': self._safe_float(item.get('appreciationPotential', item.get('appreciation_potential', 0))),
#                     'timeframe': str(item.get('timeframe', '5-10 years')).strip(),
#                     'riskLevel': str(item.get('riskLevel', 'Medium')).strip()
#                 }
#                 if not validated['name'] or validated['expectedPrice'] <= 0:
#                     return None
                    
#             elif rec_type == 'commodities':
#                 validated = {
#                     **base_fields,
#                     'commodity': str(item.get('commodity', '')).strip(),
#                     'currentPrice': self._safe_float(item.get('currentPrice', item.get('current_price', 0))),
#                     'unit': str(item.get('unit', 'per unit')).strip(),
#                     'targetPrice': self._safe_float(item.get('targetPrice', item.get('target_price', 0))),
#                     'potentialReturn': self._safe_float(item.get('potentialReturn', item.get('potential_return', 0))),
#                     'timeframe': str(item.get('timeframe', '6-12 months')).strip(),
#                     'riskLevel': str(item.get('riskLevel', 'High')).strip()
#                 }
#                 if not validated['name'] or validated['currentPrice'] <= 0:
#                     return None
                    
#             elif rec_type == 'alternativeInvestments':
#                 validated = {
#                     **base_fields,
#                     'investmentType': str(item.get('investmentType', item.get('investment_type', ''))).strip(),
#                     'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 0))),
#                     'expectedReturn': self._safe_float(item.get('expectedReturn', item.get('expected_return', 0))),
#                     'lockInPeriod': str(item.get('lockInPeriod', item.get('lock_in_period', ''))).strip(),
#                     'liquidity': str(item.get('liquidity', 'Medium')).strip(),
#                     'riskLevel': str(item.get('riskLevel', 'High')).strip()
#                 }
#                 if not validated['name'] or validated['minInvestment'] <= 0:
#                     return None
            
#             else:
#                 return None
            
#             return validated
            
#         except Exception as e:
#             logger.error(f"Validation error for {rec_type}: {e}")
#             return None

#     def _extract_json_from_text(self, text: str) -> Optional[Dict]:
#         """Extract and parse JSON from LLM response"""
#         if not text:
#             return None
        
#             # Try direct JSON parse first
#         try:
#             return json.loads(text)
#         except json.JSONDecodeError:
#             pass

#             # Extract JSON from markdown code blocks
#         json_patterns = [
#         r"json\s*(\{.*?\})\s*",                      # json { ... } 
#         r"\s*(\{.*?\})\s*",                          #  { ... } 
#         r"(\{(?:[^{}]|(?:\{[^{}]*\}))*\})"           # fallback: any balanced JSON-like {}
#         ]
        
#         for pattern in json_patterns:
#             matches = re.findall(pattern, text, re.DOTALL)
#             for match in matches:
#                 try:
#                     parsed = json.loads(match)
#                     if isinstance(parsed, dict):
#                         return parsed
#                 except json.JSONDecodeError:
#                     continue
        
#         return None

#     def _build_comprehensive_prompt(self, user_data: Dict) -> str:
#         """Build structured prompt for LLM"""
#         return f"""You are a professional financial advisor. Generate personalized investment recommendations based on user profile.

# USER PROFILE:
# - Age: {user_data.get('age', 'N/A')}
# - Income: ₹{user_data.get('monthly_income', 0):,.0f}/month
# - Risk Tolerance: {user_data.get('risk_tolerance', 'Medium')}
# - Investment Goals: {user_data.get('investment_goals', 'Wealth Building')}
# - Time Horizon: {user_data.get('time_horizon', 'Medium-term')}
# - Current Investments: {user_data.get('current_investments', 'None')}

# CRITICAL REQUIREMENTS:
# 1. Return ONLY valid JSON - no extra text, explanations, or markdown
# 2. ALL numeric values MUST be positive numbers (no strings, no symbols, no N/A)
# 3. ALL string fields must have meaningful content (no empty strings)
# 4. Include 2-4 recommendations per category based on user profile
# 5. Ensure realistic Indian market data

# OUTPUT FORMAT (STRICT JSON):
# {{
#   "marketSentiment": {{
#     "trend": "Bullish/Neutral/Bearish",
#     "fiiFlow": numeric_value,
#     "riskLevel": "Low/Medium/High",
#     "summary": "brief market analysis"
#   }},
#   "stocks": [
#     {{
#       "name": "Company Name",
#       "symbol": "SYMBOL",
#       "sector": "Sector Name",
#       "currentPrice": positive_number,
#       "targetPrice": positive_number,
#       "potentialReturn": positive_percentage,
#       "riskLevel": "Low/Medium/High",
#       "timeframe": "6-12 months",
#       "rationale": "why this stock",
#       "type": "Large Cap/Mid Cap/Small Cap"
#     }}
#   ],
#   "mutualFunds": [
#     {{
#       "name": "Fund Name",
#       "fundHouse": "AMC Name",
#       "category": "Equity/Debt/Hybrid",
#       "nav": positive_number,
#       "returns1yr": positive_percentage,
#       "returns3yr": positive_percentage,
#       "expenseRatio": positive_percentage,
#       "minInvestment": positive_number,
#       "riskLevel": "Low/Medium/High",
#       "rationale": "why this fund",
#       "type": "Growth/Dividend/Index"
#     }}
#   ],
#   "bonds": [
#     {{
#       "name": "Bond Name",
#       "issuer": "Government/Corporate",
#       "rating": "AAA/AA+/etc",
#       "couponRate": positive_percentage,
#       "ytm": positive_percentage,
#       "maturity": "date or period",
#       "faceValue": positive_number,
#       "minInvestment": positive_number,
#       "riskLevel": "Low/Medium",
#       "rationale": "why this bond",
#       "type": "Government/Corporate/Tax-Free"
#     }}
#   ],
#   "realEstate": [
#     {{
#       "name": "Property/REIT Name",
#       "location": "City/Area",
#       "propertyType": "Residential/Commercial/REIT",
#       "expectedPrice": positive_number,
#       "rentalYield": positive_percentage,
#       "appreciationPotential": positive_percentage,
#       "timeframe": "5-10 years",
#       "riskLevel": "Medium/High",
#       "rationale": "why this investment",
#       "type": "Direct/REIT/Fractional"
#     }}
#   ],
#   "commodities": [
#     {{
#       "name": "Commodity Name",
#       "commodity": "Gold/Silver/Crude",
#       "currentPrice": positive_number,
#       "unit": "per gram/per barrel",
#       "targetPrice": positive_number,
#       "potentialReturn": positive_percentage,
#       "timeframe": "6-12 months",
#       "riskLevel": "Medium/High",
#       "rationale": "why this commodity",
#       "type": "Precious Metal/Energy/Agricultural"
#     }}
#   ],
#   "alternativeInvestments": [
#     {{
#       "name": "Investment Name",
#       "investmentType": "P2P/Startup/Art/Crypto",
#       "minInvestment": positive_number,
#       "expectedReturn": positive_percentage,
#       "lockInPeriod": "period description",
#       "liquidity": "Low/Medium/High",
#       "riskLevel": "High/Very High",
#       "rationale": "why this alternative",
#       "type": "Alternative category"
#     }}
#   ]
# }}

# Generate recommendations NOW (JSON only):"""

#     def generate_recommendations(self, user_data: Dict) -> Dict[str, Any]:
#         """Main method to generate recommendations"""
#         logger.info("Starting recommendation generation")
        
#         try:
#             if self.llm:
#                 prompt = self._build_comprehensive_prompt(user_data)
#                 response = self.llm.invoke(prompt)
                
#                 # Extract content
#                 content = response.content if hasattr(response, 'content') else str(response)
#                 parsed_data = self._extract_json_from_text(content)
                
#                 if parsed_data:
#                     return self._validate_and_structure_response(parsed_data, user_data)
            
#             # Fallback to structured data
#             logger.warning("Using fallback recommendations")
#             return self._generate_fallback_recommendations(user_data)
            
#         except Exception as e:
#             logger.error(f"Error generating recommendations: {e}")
#             return self._generate_fallback_recommendations(user_data)

#     def _validate_and_structure_response(self, data: Dict, user_data: Dict) -> Dict:
#         """Validate and structure the LLM response"""
#         structured = {
#             'marketSentiment': {
#                 'trend': str(data.get('marketSentiment', {}).get('trend', 'Neutral')),
#                 'fiiFlow': self._safe_float(data.get('marketSentiment', {}).get('fiiFlow', 0)),
#                 'riskLevel': str(data.get('marketSentiment', {}).get('riskLevel', 'Medium')),
#                 'summary': str(data.get('marketSentiment', {}).get('summary', 'Market conditions are stable'))
#             },
#             'stocks': [],
#             'mutualFunds': [],
#             'bonds': [],
#             'realEstate': [],
#             'commodities': [],
#             'alternativeInvestments': [],
#             'metadata': {
#                 'generatedAt': datetime.utcnow().isoformat(),
#                 'userProfile': {
#                     'riskTolerance': user_data.get('risk_tolerance', 'Medium'),
#                     'investmentGoals': user_data.get('investment_goals', 'Wealth Building')
#                 }
#             }
#         }
        
#         # Validate each recommendation type
#         for rec_type in ['stocks', 'mutualFunds', 'bonds', 'realEstate', 'commodities', 'alternativeInvestments']:
#             if rec_type in data and isinstance(data[rec_type], list):
#                 for item in data[rec_type]:
#                     validated = self._validate_recommendation_item(item, rec_type)
#                     if validated:
#                         structured[rec_type].append(validated)
        
#         # If any category is empty, add fallback items
#         structured = self._ensure_minimum_recommendations(structured, user_data)
        
#         return structured

#     def _ensure_minimum_recommendations(self, data: Dict, user_data: Dict) -> Dict:
#         """Ensure each category has at least 1-2 recommendations"""
#         risk_tolerance = user_data.get('risk_tolerance', 'Medium').lower()
        
#         # Add fallback stocks if empty
#         if len(data['stocks']) < 2:
#             default_stocks = [
#                 {
#                     'name': 'HDFC Bank Ltd', 'symbol': 'HDFCBANK', 'sector': 'Banking',
#                     'currentPrice': 1650.0, 'targetPrice': 1850.0, 'potentialReturn': 12.0,
#                     'riskLevel': 'Low', 'timeframe': '12 months',
#                     'rationale': 'Leading private sector bank with strong fundamentals', 'type': 'Large Cap'
#                 },
#                 {
#                     'name': 'Reliance Industries', 'symbol': 'RELIANCE', 'sector': 'Energy',
#                     'currentPrice': 2450.0, 'targetPrice': 2750.0, 'potentialReturn': 12.2,
#                     'riskLevel': 'Medium', 'timeframe': '12 months',
#                     'rationale': 'Diversified conglomerate with strong growth in retail and telecom', 'type': 'Large Cap'
#                 }
#             ]
#             data['stocks'].extend(default_stocks[:2 - len(data['stocks'])])
        
#         # Add fallback mutual funds if empty
#         if len(data['mutualFunds']) < 2:
#             default_mf = [
#                 {
#                     'name': 'HDFC Flexi Cap Fund', 'fundHouse': 'HDFC Mutual Fund',
#                     'category': 'Flexi Cap', 'nav': 875.0, 'returns1yr': 18.5,
#                     'returns3yr': 22.3, 'expenseRatio': 1.2, 'minInvestment': 500.0,
#                     'riskLevel': 'Medium', 'rationale': 'Consistent performer with flexible investment approach', 'type': 'Growth'
#                 },
#                 {
#                     'name': 'ICICI Prudential Bluechip Fund', 'fundHouse': 'ICICI Prudential',
#                     'category': 'Large Cap', 'nav': 92.5, 'returns1yr': 15.8,
#                     'returns3yr': 19.2, 'expenseRatio': 1.05, 'minInvestment': 5000.0,
#                     'riskLevel': 'Low', 'rationale': 'Stable large-cap fund suitable for conservative investors', 'type': 'Growth'
#                 }
#             ]
#             data['mutualFunds'].extend(default_mf[:2 - len(data['mutualFunds'])])
        
#         # Add fallback bonds if empty
#         if len(data['bonds']) < 1:
#             data['bonds'].append({
#                 'name': 'Government of India 7Y Bond', 'issuer': 'Government of India',
#                 'rating': 'AAA', 'couponRate': 7.18, 'ytm': 7.25,
#                 'maturity': '2031', 'faceValue': 1000.0, 'minInvestment': 10000.0,
#                 'riskLevel': 'Low', 'rationale': 'Safe government-backed investment with stable returns', 'type': 'Government'
#             })
        
#         return data

#     def _generate_fallback_recommendations(self, user_data: Dict) -> Dict:
#         """Generate complete fallback recommendations"""
#         return {
#             'marketSentiment': {
#                 'trend': 'Neutral',
#                 'fiiFlow': 2500.0,
#                 'riskLevel': 'Medium',
#                 'summary': 'Markets are showing steady growth with moderate volatility'
#             },
#             'stocks': [
#                 {
#                     'name': 'HDFC Bank Ltd', 'symbol': 'HDFCBANK', 'sector': 'Banking',
#                     'currentPrice': 1650.0, 'targetPrice': 1850.0, 'potentialReturn': 12.0,
#                     'riskLevel': 'Low', 'timeframe': '12 months',
#                     'rationale': 'Strong fundamentals and consistent dividend payer', 'type': 'Large Cap'
#                 },
#                 {
#                     'name': 'Infosys Ltd', 'symbol': 'INFY', 'sector': 'IT Services',
#                     'currentPrice': 1450.0, 'targetPrice': 1650.0, 'potentialReturn': 13.8,
#                     'riskLevel': 'Low', 'timeframe': '12 months',
#                     'rationale': 'Global IT leader with strong order book', 'type': 'Large Cap'
#                 }
#             ],
#             'mutualFunds': [
#                 {
#                     'name': 'HDFC Flexi Cap Fund', 'fundHouse': 'HDFC Mutual Fund',
#                     'category': 'Flexi Cap', 'nav': 875.0, 'returns1yr': 18.5,
#                     'returns3yr': 22.3, 'expenseRatio': 1.2, 'minInvestment': 500.0,
#                     'riskLevel': 'Medium', 'rationale': 'Diversified portfolio with proven track record', 'type': 'Growth'
#                 },
#                 {
#                     'name': 'SBI Bluechip Fund', 'fundHouse': 'SBI Mutual Fund',
#                     'category': 'Large Cap', 'nav': 72.5, 'returns1yr': 16.2,
#                     'returns3yr': 20.1, 'expenseRatio': 1.15, 'minInvestment': 5000.0,
#                     'riskLevel': 'Low', 'rationale': 'Stable large-cap focused fund', 'type': 'Growth'
#                 }
#             ],
#             'bonds': [
#                 {
#                     'name': 'Government of India 7Y Bond', 'issuer': 'Government of India',
#                     'rating': 'AAA', 'couponRate': 7.18, 'ytm': 7.25,
#                     'maturity': '2031', 'faceValue': 1000.0, 'minInvestment': 10000.0,
#                     'riskLevel': 'Low', 'rationale': 'Sovereign-backed safe investment', 'type': 'Government'
#                 }
#             ],
#             'realEstate': [
#                 {
#                     'name': 'Embassy Office Parks REIT', 'location': 'Bangalore',
#                     'propertyType': 'REIT', 'expectedPrice': 385.0, 'rentalYield': 6.5,
#                     'appreciationPotential': 8.0, 'timeframe': '5-7 years',
#                     'riskLevel': 'Medium', 'rationale': 'Leading office REIT with quality assets', 'type': 'REIT'
#                 }
#             ],
#             'commodities': [
#                 {
#                     'name': 'Gold ETF', 'commodity': 'Gold', 'currentPrice': 62500.0,
#                     'unit': 'per 10g', 'targetPrice': 68000.0, 'potentialReturn': 8.8,
#                     'timeframe': '12 months', 'riskLevel': 'Medium',
#                     'rationale': 'Safe haven asset for portfolio diversification', 'type': 'Precious Metal'
#                 }
#             ],
#             'alternativeInvestments': [
#                 {
#                     'name': 'Peer-to-Peer Lending', 'investmentType': 'P2P Lending',
#                     'minInvestment': 10000.0, 'expectedReturn': 12.5, 'lockInPeriod': '12-36 months',
#                     'liquidity': 'Low', 'riskLevel': 'High',
#                     'rationale': 'Higher returns through direct lending', 'type': 'Alternative'
#                 }
#             ],
#             'metadata': {
#                 'generatedAt': datetime.utcnow().isoformat(),
#                 'userProfile': {
#                     'riskTolerance': user_data.get('risk_tolerance', 'Medium'),
#                     'investmentGoals': user_data.get('investment_goals', 'Wealth Building')
#                 }
#             }
#         }


# # Main function for API integration
# def get_personalized_recommendations(user_data: Dict) -> Dict[str, Any]:
#     """
#     Main entry point for recommendations API
#     Args:
#         user_data: Dict containing user profile
#     Returns:
#         Dict with structured recommendations
#     """
#     engine = RecommendationEngine()
#     return engine.generate_recommendations(user_data)