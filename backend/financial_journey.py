"""
gemini fin path in backend - UPDATED TO GROQ/HUGGINGFACE WITH FALLBACK

#=========================================================================================================================
# LATEST VERSION OF THE CODE USING GROQ/HUGGINGFACE WITH FALLBACK
#=========================================================================================================================
"""

import os
import json
import logging
from dotenv import load_dotenv

# Configure logging FIRST
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

# Load API key
load_dotenv()

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


def initialize_llm_with_fallback(temperature: float = 0.7, max_tokens: int = 16384, model_override: str = None):
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


# --- Enhanced System Instruction with Analysis ---
SYSTEM_INSTRUCTION = """
You are an expert Indian financial advisor with deep knowledge of Indian markets, tax laws, and investment instruments.

Given a user's investment query, risk profile, and any available user data, generate a comprehensive investment analysis and pathway.

Return a single, well-structured JSON object with the following keys:

1. "nodes": Array of flowchart nodes representing the investment pathway steps
   - Each node must have: "id", "position" (with "x" and "y"), "data" (with "label"), and "style" (with "background" and "border")
   - Use appropriate Indian financial terms and instruments (FD, PPF, NPS, Equity MF, Debt MF, Gold, Real Estate, etc.)

2. "edges": Array of connections between nodes
   - Each edge must have: "id", "source", "target", "label" (optional), and "style" (with "stroke")

3. "analysis": Comprehensive analysis object containing:
   - "summary": 3-4 sentence overview of the recommended strategy
   - "riskAssessment": Detailed risk analysis (2-3 sentences)
   - "expectedReturns": Specific return expectations with timeframes
   - "timeHorizon": Recommended investment duration with reasoning
   - "keyBenefits": Array of 4-5 key advantages of this strategy
   - "considerations": Array of 4-5 important points to consider or potential risks
   - "assetBreakdown": Array of asset allocation details, each containing:
     * "category": Asset class name (e.g., "Fixed Income", "Equity", "Gold", etc.)
     * "allocation": Percentage allocation (e.g., "40%")
     * "instruments": Array of specific recommended instruments
     * "rationale": Explanation for this allocation (2-3 sentences)
   - "taxImplications": Detailed tax considerations for this strategy (3-4 sentences)
   - "rebalancingStrategy": How and when to rebalance the portfolio (2-3 sentences)

4. "userProfile": Summary of extracted user information
   - "investmentAmount": Amount to be invested (e.g., "₹1,00,000")
   - "riskProfile": Risk category (Conservative/Moderate/Aggressive)
   - "goals": Array of identified investment goals

CRITICAL - HANDLING RISK TOLERANCE DISCREPANCY:
- The user has TWO risk tolerances:
  1. originalRiskTolerance: Their risk tolerance from profile/onboarding
  2. selectedRiskForThisQuery: The risk they selected for THIS specific financial plan
- ALWAYS acknowledge BOTH in your response
- Example: "While your profile indicates you're a conservative investor, you've opted for a moderate-risk strategy for this plan. Here's how we'll balance both..."
- If the selected risk differs from original, explain the implications
- Provide safeguards if they're taking more risk than usual

USER DATA INTEGRATION:
- Use the provided user data (income, expenses, assets, liabilities, goals) to personalize recommendations
- Reference their actual financial numbers in the analysis
- Adjust investment amounts based on their actual savings capacity
- Consider their existing investments when recommending new allocations
- Factor in their liabilities when assessing risk capacity
- Align strategy with their stated financial goals

QUERY LANGUAGE HANDLING:
- Respond in the SAME LANGUAGE as the user's query
- If query is in Hindi, respond in Hindi
- If query is in Hinglish (mixed), use Hinglish
- If query is in English, respond in English
- Maintain professional financial terminology in any language


IMPORTANT GUIDELINES:
- Use Indian Rupee symbol (₹) consistently
- Reference Indian tax laws (Section 80C, LTCG, STCG, etc.)
- Recommend appropriate Indian instruments based on risk profile
- Consider inflation, typically 5-6% in India
- For Conservative: Focus on FD, PPF, Debt Funds, Corporate Bonds
- For Moderate: Mix of Equity MF (50-60%), Debt (30-40%), Gold (10%)
- For Aggressive: Heavy equity exposure (70-80%), growth stocks, sectoral funds
- Provide realistic return expectations based on historical Indian market performance
- Consider liquidity requirements and emergency funds
- Be specific with instrument names when possible (e.g., "HDFC Top 100 Fund" rather than just "equity funds")

Do NOT return any text outside of this JSON object.
"""

# Initialize model with fallback
try:
    model = initialize_llm_with_fallback(temperature=0.7, max_tokens=16384)
    logger.info(f"✅ Model initialized successfully using {ACTIVE_LLM_PROVIDER} (key #{ACTIVE_KEY_INDEX})")
except Exception as e:
    logger.error(f"❌ Failed to initialize model: {e}")
    model = None


def get_gemini_response(user_input: str, risk: str, user_data: dict = None) -> str:
    """
    Generate comprehensive financial advice with analysis and visualizations
    
    Args:
        user_input: User's investment query
        risk: Risk profile (conservative/moderate/aggressive)
        user_data: Additional user data fetched automatically (optional)
    """
    if model is None:
        error_response = {
            "nodes": [
                {
                    "id": "error",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": "Error: Model not initialized"},
                    "style": {"background": "bg-red-100", "border": "border-red-400"}
                }
            ],
            "edges": [],
            "analysis": {
                "summary": "Model initialization failed. Please check API keys.",
                "riskAssessment": "Unable to assess risk at this time.",
                "expectedReturns": "N/A",
                "timeHorizon": "N/A",
                "keyBenefits": ["Please check configuration"],
                "considerations": ["Verify GROQ_API_KEY_1/2/3 and HF_TOKEN_1/2/3"],
                "assetBreakdown": [],
                "taxImplications": "N/A",
                "rebalancingStrategy": "N/A"
            },
            "userProfile": {
                "investmentAmount": "N/A",
                "riskProfile": risk,
                "goals": []
            }
        }
        return json.dumps(error_response)
    
    try:
        # 🔹 AUTOMATIC USER DATA PROCESSING - START
        # This section processes automatically fetched user data
        # The user_data dict can contain:
        # - income: Annual income
        # - existingInvestments: Current investment portfolio
        # - liabilities: Loans, EMIs, etc.
        # - dependents: Number of dependents
        # - age: User's age
        # - employmentStatus: Employed/Self-employed/Retired
        # - emergencyFund: Existing emergency fund amount
        # - insuranceCoverage: Life/Health insurance details
        
        user_context = ""
        if user_data:
            user_context = f"\n\nAdditional User Data:\n"
            for key, value in user_data.items():
                user_context += f"- {key}: {value}\n"
        # 🔹 AUTOMATIC USER DATA PROCESSING - END
        
        prompt = f"""User Query: '{user_input}'
Risk Profile: '{risk}'
{user_context}

Based on the above information, create a comprehensive investment analysis with detailed textual explanations and a visual flowchart pathway. Ensure all analysis fields are thoroughly populated with actionable insights specific to Indian markets and regulations."""

        # Build message with system instruction
        from langchain_core.messages import SystemMessage, HumanMessage
        
        messages = [
            SystemMessage(content=SYSTEM_INSTRUCTION),
            HumanMessage(content=prompt)
        ]
        
        response = model.invoke(messages)
        
        # Extract response text
        response_text = response.content.strip()
        
        # Clean up markdown formatting if present
        if response_text.startswith('```'):
            response_text = response_text[7:]
        elif response_text.startswith('```'):
            response_text = response_text[3:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        return response_text.strip()
        
    except Exception as e:
        # Return a structured error response
        logger.error(f"Error generating response: {e}")
        error_response = {
            "nodes": [
                {
                    "id": "error",
                    "position": {"x": 250, "y": 100},
                    "data": {"label": f"Error: {str(e)}"},
                    "style": {"background": "bg-red-100", "border": "border-red-400"}
                }
            ],
            "edges": [],
            "analysis": {
                "summary": f"An error occurred while generating your investment pathway: {str(e)}",
                "riskAssessment": "Unable to assess risk at this time.",
                "expectedReturns": "N/A",
                "timeHorizon": "N/A",
                "keyBenefits": ["Please try again"],
                "considerations": ["Check your internet connection", "Verify API configuration"],
                "assetBreakdown": [],
                "taxImplications": "N/A",
                "rebalancingStrategy": "N/A"
            },
            "userProfile": {
                "investmentAmount": "N/A",
                "riskProfile": risk,
                "goals": []
            }
        }
        return json.dumps(error_response)


if __name__ == "__main__":
    test_query = "I have ₹1 lakh to invest for 3-5 years. Safety is my primary concern."
    test_risk = "conservative"
    
    # 🔹 Simulated user data for testing
    test_user_data = {
        'age': 30,
        'income': '₹8,00,000 per annum',
        'existingInvestments': 'PPF: ₹50,000',
        'dependents': 1,
        'employmentStatus': 'Employed'
    }

    print(f"Test Query: {test_query}")
    print(f"Risk Profile: {test_risk}")
    print(f"User Data: {test_user_data}\n")
    print(f"Active Provider: {ACTIVE_LLM_PROVIDER} (Key #{ACTIVE_KEY_INDEX})")
    print("--- Response ---")
    
    response = get_gemini_response(test_query, test_risk, test_user_data)
    
    # Pretty print the JSON response
    try:
        response_json = json.loads(response)
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(response)