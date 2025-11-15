#=========================================================================================================================
# LATEST VERSION OF THE CODE USING GEMINI 2.5 PRO MODEL
#=========================================================================================================================

import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

# Load API key
load_dotenv()
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# --- Enhanced Config ---
generation_config = {
    "temperature": 0.7,
    "top_p": 0.95,
    "max_output_tokens": 16384,
    "response_mime_type": "application/json"
}

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

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash-exp",
    generation_config=generation_config,
    system_instruction=SYSTEM_INSTRUCTION
)

def get_gemini_response(user_input: str, risk: str, user_data: dict = None) -> str:
    """
    Generate comprehensive financial advice with analysis and visualizations
    
    Args:
        user_input: User's investment query
        risk: Risk profile (conservative/moderate/aggressive)
        user_data: Additional user data fetched automatically (optional)
    """
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

        response = model.generate_content(prompt)
        return response.text.strip()
        
    except Exception as e:
        # Return a structured error response
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
    print("--- Gemini Response ---")
    
    response = get_gemini_response(test_query, test_risk, test_user_data)
    
    # Pretty print the JSON response
    try:
        response_json = json.loads(response)
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print(response)