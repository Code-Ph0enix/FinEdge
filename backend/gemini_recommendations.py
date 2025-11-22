"""
gemini_recommendations.py - Enhanced Recommendations Engine
Robust data validation, structured output, and error handling
"""

import os
import re
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import LLM libraries
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
        logger.warning("HuggingFace not available")
        HF_AVAILABLE = False


class RecommendationEngine:
    """AI-powered investment recommendation engine with robust validation"""
    
    def __init__(self):
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.hf_token = os.getenv("HUGGINGFACE_TOKEN")
        self.llm = self._initialize_llm()
        
    def _initialize_llm(self):
        """Initialize LLM with fallback chain"""
        if GROQ_AVAILABLE and self.groq_api_key:
            try:
                return ChatGroq(
                    api_key=self.groq_api_key,
                    model_name="llama-3.1-70b-versatile",
                    temperature=0.3,
                    max_tokens=4000
                )
            except Exception as e:
                logger.error(f"Groq initialization failed: {e}")
        
        if HF_AVAILABLE and self.hf_token:
            try:
                endpoint = HuggingFaceEndpoint(
                    repo_id="mistralai/Mixtral-8x7B-Instruct-v0.1",
                    huggingfacehub_api_token=self.hf_token,
                    max_new_tokens=3000,
                    temperature=0.3
                )
                return ChatHuggingFace(llm=endpoint)
            except Exception as e:
                logger.error(f"HuggingFace initialization failed: {e}")
        
        return None

    def _safe_float(self, value: Any, default: float = 0.0) -> float:
        """Safely convert value to float with validation"""
        if value is None:
            return default
        
        if isinstance(value, (int, float)):
            return float(value) if value > 0 else default
        
        if isinstance(value, str):
            # Remove currency symbols and commas
            cleaned = re.sub(r'[₹$,\s]', '', value)
            try:
                result = float(cleaned)
                return result if result > 0 else default
            except (ValueError, TypeError):
                return default
        
        return default

    def _validate_recommendation_item(self, item: Dict, rec_type: str) -> Optional[Dict]:
        """Validate and sanitize a single recommendation item"""
        if not isinstance(item, dict):
            return None
        
        try:
            # Common fields for all types
            base_fields = {
                'name': str(item.get('name', '')).strip(),
                'type': str(item.get('type', '')).strip(),
                'rationale': str(item.get('rationale', '')).strip()
            }
            
            # Type-specific validation
            if rec_type == 'stocks':
                validated = {
                    **base_fields,
                    'symbol': str(item.get('symbol', '')).strip().upper(),
                    'sector': str(item.get('sector', '')).strip(),
                    'currentPrice': self._safe_float(item.get('currentPrice')),
                    'targetPrice': self._safe_float(item.get('targetPrice')),
                    'potentialReturn': self._safe_float(item.get('potentialReturn')),
                    'riskLevel': str(item.get('riskLevel', 'Medium')).strip(),
                    'timeframe': str(item.get('timeframe', '6-12 months')).strip()
                }
                # Ensure minimum valid data
                if not validated['name'] or validated['currentPrice'] <= 0:
                    return None
                    
            elif rec_type == 'mutualFunds':
                validated = {
                    **base_fields,
                    'fundHouse': str(item.get('fundHouse', '')).strip(),
                    'category': str(item.get('category', '')).strip(),
                    'nav': self._safe_float(item.get('nav')),
                    'returns1yr': self._safe_float(item.get('returns1yr', item.get('returns_1yr', 0))),
                    'returns3yr': self._safe_float(item.get('returns3yr', item.get('returns_3yr', 0))),
                    'expenseRatio': self._safe_float(item.get('expenseRatio', item.get('expense_ratio', 0))),
                    'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 500))),
                    'riskLevel': str(item.get('riskLevel', 'Medium')).strip()
                }
                if not validated['name'] or validated['nav'] <= 0:
                    return None
                    
            elif rec_type == 'bonds':
                validated = {
                    **base_fields,
                    'issuer': str(item.get('issuer', '')).strip(),
                    'rating': str(item.get('rating', '')).strip(),
                    'couponRate': self._safe_float(item.get('couponRate', item.get('coupon_rate', 0))),
                    'ytm': self._safe_float(item.get('ytm', item.get('yield_to_maturity', 0))),
                    'maturity': str(item.get('maturity', '')).strip(),
                    'faceValue': self._safe_float(item.get('faceValue', item.get('face_value', 1000))),
                    'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 10000))),
                    'riskLevel': str(item.get('riskLevel', 'Low')).strip()
                }
                if not validated['name'] or validated['couponRate'] <= 0:
                    return None
                    
            elif rec_type == 'realEstate':
                validated = {
                    **base_fields,
                    'location': str(item.get('location', '')).strip(),
                    'propertyType': str(item.get('propertyType', item.get('property_type', ''))).strip(),
                    'expectedPrice': self._safe_float(item.get('expectedPrice', item.get('expected_price', 0))),
                    'rentalYield': self._safe_float(item.get('rentalYield', item.get('rental_yield', 0))),
                    'appreciationPotential': self._safe_float(item.get('appreciationPotential', item.get('appreciation_potential', 0))),
                    'timeframe': str(item.get('timeframe', '5-10 years')).strip(),
                    'riskLevel': str(item.get('riskLevel', 'Medium')).strip()
                }
                if not validated['name'] or validated['expectedPrice'] <= 0:
                    return None
                    
            elif rec_type == 'commodities':
                validated = {
                    **base_fields,
                    'commodity': str(item.get('commodity', '')).strip(),
                    'currentPrice': self._safe_float(item.get('currentPrice', item.get('current_price', 0))),
                    'unit': str(item.get('unit', 'per unit')).strip(),
                    'targetPrice': self._safe_float(item.get('targetPrice', item.get('target_price', 0))),
                    'potentialReturn': self._safe_float(item.get('potentialReturn', item.get('potential_return', 0))),
                    'timeframe': str(item.get('timeframe', '6-12 months')).strip(),
                    'riskLevel': str(item.get('riskLevel', 'High')).strip()
                }
                if not validated['name'] or validated['currentPrice'] <= 0:
                    return None
                    
            elif rec_type == 'alternativeInvestments':
                validated = {
                    **base_fields,
                    'investmentType': str(item.get('investmentType', item.get('investment_type', ''))).strip(),
                    'minInvestment': self._safe_float(item.get('minInvestment', item.get('min_investment', 0))),
                    'expectedReturn': self._safe_float(item.get('expectedReturn', item.get('expected_return', 0))),
                    'lockInPeriod': str(item.get('lockInPeriod', item.get('lock_in_period', ''))).strip(),
                    'liquidity': str(item.get('liquidity', 'Medium')).strip(),
                    'riskLevel': str(item.get('riskLevel', 'High')).strip()
                }
                if not validated['name'] or validated['minInvestment'] <= 0:
                    return None
            
            else:
                return None
            
            return validated
            
        except Exception as e:
            logger.error(f"Validation error for {rec_type}: {e}")
            return None

    def _extract_json_from_text(self, text: str) -> Optional[Dict]:
        """Extract and parse JSON from LLM response"""
        if not text:
            return None
        
            # Try direct JSON parse first
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

            # Extract JSON from markdown code blocks
        json_patterns = [
        r"json\s*(\{.*?\})\s*",                      # json { ... } 
        r"\s*(\{.*?\})\s*",                          #  { ... } 
        r"(\{(?:[^{}]|(?:\{[^{}]*\}))*\})"           # fallback: any balanced JSON-like {}
        ]
        
        for pattern in json_patterns:
            matches = re.findall(pattern, text, re.DOTALL)
            for match in matches:
                try:
                    parsed = json.loads(match)
                    if isinstance(parsed, dict):
                        return parsed
                except json.JSONDecodeError:
                    continue
        
        return None

    def _build_comprehensive_prompt(self, user_data: Dict) -> str:
        """Build structured prompt for LLM"""
        return f"""You are a professional financial advisor. Generate personalized investment recommendations based on user profile.

USER PROFILE:
- Age: {user_data.get('age', 'N/A')}
- Income: ₹{user_data.get('monthly_income', 0):,.0f}/month
- Risk Tolerance: {user_data.get('risk_tolerance', 'Medium')}
- Investment Goals: {user_data.get('investment_goals', 'Wealth Building')}
- Time Horizon: {user_data.get('time_horizon', 'Medium-term')}
- Current Investments: {user_data.get('current_investments', 'None')}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - no extra text, explanations, or markdown
2. ALL numeric values MUST be positive numbers (no strings, no symbols, no N/A)
3. ALL string fields must have meaningful content (no empty strings)
4. Include 2-4 recommendations per category based on user profile
5. Ensure realistic Indian market data

OUTPUT FORMAT (STRICT JSON):
{{
  "marketSentiment": {{
    "trend": "Bullish/Neutral/Bearish",
    "fiiFlow": numeric_value,
    "riskLevel": "Low/Medium/High",
    "summary": "brief market analysis"
  }},
  "stocks": [
    {{
      "name": "Company Name",
      "symbol": "SYMBOL",
      "sector": "Sector Name",
      "currentPrice": positive_number,
      "targetPrice": positive_number,
      "potentialReturn": positive_percentage,
      "riskLevel": "Low/Medium/High",
      "timeframe": "6-12 months",
      "rationale": "why this stock",
      "type": "Large Cap/Mid Cap/Small Cap"
    }}
  ],
  "mutualFunds": [
    {{
      "name": "Fund Name",
      "fundHouse": "AMC Name",
      "category": "Equity/Debt/Hybrid",
      "nav": positive_number,
      "returns1yr": positive_percentage,
      "returns3yr": positive_percentage,
      "expenseRatio": positive_percentage,
      "minInvestment": positive_number,
      "riskLevel": "Low/Medium/High",
      "rationale": "why this fund",
      "type": "Growth/Dividend/Index"
    }}
  ],
  "bonds": [
    {{
      "name": "Bond Name",
      "issuer": "Government/Corporate",
      "rating": "AAA/AA+/etc",
      "couponRate": positive_percentage,
      "ytm": positive_percentage,
      "maturity": "date or period",
      "faceValue": positive_number,
      "minInvestment": positive_number,
      "riskLevel": "Low/Medium",
      "rationale": "why this bond",
      "type": "Government/Corporate/Tax-Free"
    }}
  ],
  "realEstate": [
    {{
      "name": "Property/REIT Name",
      "location": "City/Area",
      "propertyType": "Residential/Commercial/REIT",
      "expectedPrice": positive_number,
      "rentalYield": positive_percentage,
      "appreciationPotential": positive_percentage,
      "timeframe": "5-10 years",
      "riskLevel": "Medium/High",
      "rationale": "why this investment",
      "type": "Direct/REIT/Fractional"
    }}
  ],
  "commodities": [
    {{
      "name": "Commodity Name",
      "commodity": "Gold/Silver/Crude",
      "currentPrice": positive_number,
      "unit": "per gram/per barrel",
      "targetPrice": positive_number,
      "potentialReturn": positive_percentage,
      "timeframe": "6-12 months",
      "riskLevel": "Medium/High",
      "rationale": "why this commodity",
      "type": "Precious Metal/Energy/Agricultural"
    }}
  ],
  "alternativeInvestments": [
    {{
      "name": "Investment Name",
      "investmentType": "P2P/Startup/Art/Crypto",
      "minInvestment": positive_number,
      "expectedReturn": positive_percentage,
      "lockInPeriod": "period description",
      "liquidity": "Low/Medium/High",
      "riskLevel": "High/Very High",
      "rationale": "why this alternative",
      "type": "Alternative category"
    }}
  ]
}}

Generate recommendations NOW (JSON only):"""

    def generate_recommendations(self, user_data: Dict) -> Dict[str, Any]:
        """Main method to generate recommendations"""
        logger.info("Starting recommendation generation")
        
        try:
            if self.llm:
                prompt = self._build_comprehensive_prompt(user_data)
                response = self.llm.invoke(prompt)
                
                # Extract content
                content = response.content if hasattr(response, 'content') else str(response)
                parsed_data = self._extract_json_from_text(content)
                
                if parsed_data:
                    return self._validate_and_structure_response(parsed_data, user_data)
            
            # Fallback to structured data
            logger.warning("Using fallback recommendations")
            return self._generate_fallback_recommendations(user_data)
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return self._generate_fallback_recommendations(user_data)

    def _validate_and_structure_response(self, data: Dict, user_data: Dict) -> Dict:
        """Validate and structure the LLM response"""
        structured = {
            'marketSentiment': {
                'trend': str(data.get('marketSentiment', {}).get('trend', 'Neutral')),
                'fiiFlow': self._safe_float(data.get('marketSentiment', {}).get('fiiFlow', 0)),
                'riskLevel': str(data.get('marketSentiment', {}).get('riskLevel', 'Medium')),
                'summary': str(data.get('marketSentiment', {}).get('summary', 'Market conditions are stable'))
            },
            'stocks': [],
            'mutualFunds': [],
            'bonds': [],
            'realEstate': [],
            'commodities': [],
            'alternativeInvestments': [],
            'metadata': {
                'generatedAt': datetime.utcnow().isoformat(),
                'userProfile': {
                    'riskTolerance': user_data.get('risk_tolerance', 'Medium'),
                    'investmentGoals': user_data.get('investment_goals', 'Wealth Building')
                }
            }
        }
        
        # Validate each recommendation type
        for rec_type in ['stocks', 'mutualFunds', 'bonds', 'realEstate', 'commodities', 'alternativeInvestments']:
            if rec_type in data and isinstance(data[rec_type], list):
                for item in data[rec_type]:
                    validated = self._validate_recommendation_item(item, rec_type)
                    if validated:
                        structured[rec_type].append(validated)
        
        # If any category is empty, add fallback items
        structured = self._ensure_minimum_recommendations(structured, user_data)
        
        return structured

    def _ensure_minimum_recommendations(self, data: Dict, user_data: Dict) -> Dict:
        """Ensure each category has at least 1-2 recommendations"""
        risk_tolerance = user_data.get('risk_tolerance', 'Medium').lower()
        
        # Add fallback stocks if empty
        if len(data['stocks']) < 2:
            default_stocks = [
                {
                    'name': 'HDFC Bank Ltd', 'symbol': 'HDFCBANK', 'sector': 'Banking',
                    'currentPrice': 1650.0, 'targetPrice': 1850.0, 'potentialReturn': 12.0,
                    'riskLevel': 'Low', 'timeframe': '12 months',
                    'rationale': 'Leading private sector bank with strong fundamentals', 'type': 'Large Cap'
                },
                {
                    'name': 'Reliance Industries', 'symbol': 'RELIANCE', 'sector': 'Energy',
                    'currentPrice': 2450.0, 'targetPrice': 2750.0, 'potentialReturn': 12.2,
                    'riskLevel': 'Medium', 'timeframe': '12 months',
                    'rationale': 'Diversified conglomerate with strong growth in retail and telecom', 'type': 'Large Cap'
                }
            ]
            data['stocks'].extend(default_stocks[:2 - len(data['stocks'])])
        
        # Add fallback mutual funds if empty
        if len(data['mutualFunds']) < 2:
            default_mf = [
                {
                    'name': 'HDFC Flexi Cap Fund', 'fundHouse': 'HDFC Mutual Fund',
                    'category': 'Flexi Cap', 'nav': 875.0, 'returns1yr': 18.5,
                    'returns3yr': 22.3, 'expenseRatio': 1.2, 'minInvestment': 500.0,
                    'riskLevel': 'Medium', 'rationale': 'Consistent performer with flexible investment approach', 'type': 'Growth'
                },
                {
                    'name': 'ICICI Prudential Bluechip Fund', 'fundHouse': 'ICICI Prudential',
                    'category': 'Large Cap', 'nav': 92.5, 'returns1yr': 15.8,
                    'returns3yr': 19.2, 'expenseRatio': 1.05, 'minInvestment': 5000.0,
                    'riskLevel': 'Low', 'rationale': 'Stable large-cap fund suitable for conservative investors', 'type': 'Growth'
                }
            ]
            data['mutualFunds'].extend(default_mf[:2 - len(data['mutualFunds'])])
        
        # Add fallback bonds if empty
        if len(data['bonds']) < 1:
            data['bonds'].append({
                'name': 'Government of India 7Y Bond', 'issuer': 'Government of India',
                'rating': 'AAA', 'couponRate': 7.18, 'ytm': 7.25,
                'maturity': '2031', 'faceValue': 1000.0, 'minInvestment': 10000.0,
                'riskLevel': 'Low', 'rationale': 'Safe government-backed investment with stable returns', 'type': 'Government'
            })
        
        return data

    def _generate_fallback_recommendations(self, user_data: Dict) -> Dict:
        """Generate complete fallback recommendations"""
        return {
            'marketSentiment': {
                'trend': 'Neutral',
                'fiiFlow': 2500.0,
                'riskLevel': 'Medium',
                'summary': 'Markets are showing steady growth with moderate volatility'
            },
            'stocks': [
                {
                    'name': 'HDFC Bank Ltd', 'symbol': 'HDFCBANK', 'sector': 'Banking',
                    'currentPrice': 1650.0, 'targetPrice': 1850.0, 'potentialReturn': 12.0,
                    'riskLevel': 'Low', 'timeframe': '12 months',
                    'rationale': 'Strong fundamentals and consistent dividend payer', 'type': 'Large Cap'
                },
                {
                    'name': 'Infosys Ltd', 'symbol': 'INFY', 'sector': 'IT Services',
                    'currentPrice': 1450.0, 'targetPrice': 1650.0, 'potentialReturn': 13.8,
                    'riskLevel': 'Low', 'timeframe': '12 months',
                    'rationale': 'Global IT leader with strong order book', 'type': 'Large Cap'
                }
            ],
            'mutualFunds': [
                {
                    'name': 'HDFC Flexi Cap Fund', 'fundHouse': 'HDFC Mutual Fund',
                    'category': 'Flexi Cap', 'nav': 875.0, 'returns1yr': 18.5,
                    'returns3yr': 22.3, 'expenseRatio': 1.2, 'minInvestment': 500.0,
                    'riskLevel': 'Medium', 'rationale': 'Diversified portfolio with proven track record', 'type': 'Growth'
                },
                {
                    'name': 'SBI Bluechip Fund', 'fundHouse': 'SBI Mutual Fund',
                    'category': 'Large Cap', 'nav': 72.5, 'returns1yr': 16.2,
                    'returns3yr': 20.1, 'expenseRatio': 1.15, 'minInvestment': 5000.0,
                    'riskLevel': 'Low', 'rationale': 'Stable large-cap focused fund', 'type': 'Growth'
                }
            ],
            'bonds': [
                {
                    'name': 'Government of India 7Y Bond', 'issuer': 'Government of India',
                    'rating': 'AAA', 'couponRate': 7.18, 'ytm': 7.25,
                    'maturity': '2031', 'faceValue': 1000.0, 'minInvestment': 10000.0,
                    'riskLevel': 'Low', 'rationale': 'Sovereign-backed safe investment', 'type': 'Government'
                }
            ],
            'realEstate': [
                {
                    'name': 'Embassy Office Parks REIT', 'location': 'Bangalore',
                    'propertyType': 'REIT', 'expectedPrice': 385.0, 'rentalYield': 6.5,
                    'appreciationPotential': 8.0, 'timeframe': '5-7 years',
                    'riskLevel': 'Medium', 'rationale': 'Leading office REIT with quality assets', 'type': 'REIT'
                }
            ],
            'commodities': [
                {
                    'name': 'Gold ETF', 'commodity': 'Gold', 'currentPrice': 62500.0,
                    'unit': 'per 10g', 'targetPrice': 68000.0, 'potentialReturn': 8.8,
                    'timeframe': '12 months', 'riskLevel': 'Medium',
                    'rationale': 'Safe haven asset for portfolio diversification', 'type': 'Precious Metal'
                }
            ],
            'alternativeInvestments': [
                {
                    'name': 'Peer-to-Peer Lending', 'investmentType': 'P2P Lending',
                    'minInvestment': 10000.0, 'expectedReturn': 12.5, 'lockInPeriod': '12-36 months',
                    'liquidity': 'Low', 'riskLevel': 'High',
                    'rationale': 'Higher returns through direct lending', 'type': 'Alternative'
                }
            ],
            'metadata': {
                'generatedAt': datetime.utcnow().isoformat(),
                'userProfile': {
                    'riskTolerance': user_data.get('risk_tolerance', 'Medium'),
                    'investmentGoals': user_data.get('investment_goals', 'Wealth Building')
                }
            }
        }


# Main function for API integration
def get_personalized_recommendations(user_data: Dict) -> Dict[str, Any]:
    """
    Main entry point for recommendations API
    Args:
        user_data: Dict containing user profile
    Returns:
        Dict with structured recommendations
    """
    engine = RecommendationEngine()
    return engine.generate_recommendations(user_data)
