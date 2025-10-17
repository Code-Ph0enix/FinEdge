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

# --- Flask/FastAPI Integration Example ---
# Uncomment and modify based on your framework

# from flask import Flask, request, jsonify
# from flask_cors import CORS
# 
# app = Flask(__name__)
# CORS(app)
# 
# @app.route('/ai-financial-path', methods=['POST'])
# def ai_financial_path():
#     try:
#         user_input = request.form.get('input', '')
#         risk = request.form.get('risk', 'conservative')
#         
#         # 🔹 AUTOMATIC USER DATA FETCHING - START
#         # Fetch user data from your database/session
#         # Example:
#         # user_id = request.headers.get('User-ID') or session.get('user_id')
#         # user_data = fetch_user_data_from_db(user_id)
#         # 
#         # user_data could be:
#         # {
#         #     'income': '₹12,00,000 per annum',
#         #     'existingInvestments': 'PPF: ₹2L, EPF: ₹5L',
#         #     'liabilities': 'Home Loan EMI: ₹25,000/month',
#         #     'dependents': 2,
#         #     'age': 32,
#         #     'employmentStatus': 'Employed',
#         #     'emergencyFund': '₹3,00,000',
#         #     'insuranceCoverage': 'Life: ₹50L, Health: ₹10L'
#         # }
#         
#         user_data_json = request.form.get('userData', '{}')
#         user_data = json.loads(user_data_json) if user_data_json else {}
#         # 🔹 AUTOMATIC USER DATA FETCHING - END
#         
#         response = get_gemini_response(user_input, risk, user_data)
#         response_json = json.loads(response)
#         
#         return jsonify(response_json)
#     
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
# 
# if __name__ == '__main__':
#     app.run(debug=True, port=5000)

# --- Run from terminal (for testing) ---
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












































































# import os
# import google.generativeai as genai
# from dotenv import load_dotenv

# # Load API key
# load_dotenv()
# genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# # --- Simple Config ---
# generation_config = {
#     "temperature": 0.6,
#     "top_p": 0.95,
#     "max_output_tokens": 8192,
#     "response_mime_type": "application/json"  # ✅ plain text output
# }

# # --- Simple System Instruction ---
# # SYSTEM_INSTRUCTION = # In your Python backend file (e.g., app.py or a utils file)

# SYSTEM_INSTRUCTION = """
# You are an expert Indian financial advisor.
# Given a user's investment query and risk profile, generate a personalized investment pathway.
# Return the response as a single, minified JSON object with two keys: "nodes" and "edges".

# - The "nodes" array should contain objects for each step in the investment plan (e.g., "Initial Investment", "Asset Allocation", "Specific Instruments"). Each node object must have:
#   - "id": A unique string identifier.
#   - "position": An object with "x" and "y" coordinates.
#   - "data": An object with a "label" key containing the node's text.
#   - "style": An object with "background", "border" keys for styling.

# - The "edges" array should contain objects representing the connections between nodes. Each edge object must have:
#   - "id": A unique string identifier (e.g., "e1-2").
#   - "source": The "id" of the starting node.
#   - "target": The "id" of the ending node.
#   - "label": (Optional) Text to display on the connection.
#   - "style": An object with a "stroke" key for styling.

# Do NOT return any text outside of this JSON object.
# """
# # SYSTEM_INSTRUCTION = """
# # You are an expert Indian financial advisor.
# # Given a user's investment query and risk profile, generate a personalized investment pathway.
# # Return a single, minified JSON object with two top-level keys: "explanation" and "flowchart".

# # 1.  The "explanation" key must contain a human-readable paragraph (2-4 sentences) summarizing the investment strategy, its reasoning, and expected outcomes. Use Indian currency (₹) and financial terms.
# # 2.  The "flowchart" key must contain an object with two keys: "nodes" and "edges", formatted for a flowchart library.
# #     - "nodes" should be an array of objects, each with an "id", "position", "data" (with a "label"), and "style".
# #     - "edges" should be an array of objects connecting the nodes.

# # IMPORTANT: Keep the node labels concise. The detailed summary goes in the "explanation" field.
# # Do NOT return any text outside of this single JSON object.
# # """

# model = genai.GenerativeModel(
#     model_name="gemini-2.5-pro",
#     generation_config=generation_config,
#     system_instruction=SYSTEM_INSTRUCTION
# )

# def get_gemini_response(user_input: str, risk: str) -> str:
#     try:
#         prompt = f"User Query: '{user_input}'\nRisk Profile: '{risk}'"
#         response = model.generate_content(prompt)
#         return response.text.strip()
#     except Exception as e:
#         return f"⚠️ Error: {e}"

# # --- Run from terminal ---
# if __name__ == "__main__":
#     test_query = "I have ₹1 lakh to invest for 3-5 years. Safety is my primary concern."
#     test_risk = "Conservative"

#     print(f"Test Query: {test_query}")
#     print(f"Risk Profile: {test_risk}\n")
#     print("--- Gemini Response ---")
#     print(get_gemini_response(test_query, test_risk))































































































































































# #=========================================================================================================================
# # Upgraded to Gemini 2.5 Pro from Gemini 1.5 Flash for better performance and reliability.
# # Improved system instructions to ensure structured JSON output for investment pathways.
# #=========================================================================================================================
# import os
# import google.generativeai as genai
# import json
# from dotenv import load_dotenv

# # Load environment variables from .env file
# load_dotenv()

# # --- Configuration ---
# try:
#     genai.configure(api_key=os.environ["GEMINI_API_KEY"])
# except KeyError:
#     print("ERROR: GEMINI_API_KEY not found in environment variables.")
#     exit()

# # --- Model Setup ---
# # Upgraded to Gemini 1.5 Pro and configured to enforce JSON output
# generation_config = {
#     "temperature": 0.5, # Reduced for more factual, less "creative" financial advice
#     "top_p": 0.95,
#     "top_k": 40,
#     "max_output_tokens": 8192,
#     # "response_mime_type": "application/json", # Enforce JSON output
#     "response_mime_type": "text/plain", # Using text/plain to handle parsing manually
# }

# # System instruction to guide the model for better, structured responses
# SYSTEM_INSTRUCTION = """
# You are an expert financial advisor for the Indian market.

# Respond in valid JSON with exactly two keys: "summary" and "flowData".

# 1. "summary": A short paragraph (2–3 sentences) explaining the investment plan.
# 2. "flowData": Contains two arrays — "nodes" and "edges" — representing how funds are allocated.

# Rules:
# - Always include a node with id "start" for the total investment.
# - Other nodes represent asset classes (FDs, Mutual Funds, Gold, etc.).
# - Edges connect "start" to each node with labels like "30% ₹30,000".
# - Conservative = safer investments, Aggressive = more equity exposure.
# - Use only valid JSON, no extra text.
# """

# # SYSTEM_INSTRUCTION = """
# # You are an expert financial advisor for the Indian market. Your goal is to provide a clear, actionable, and human-readable investment recommendation based on a user's query and their selected risk profile.

# # You must provide your response as a well-written text explanation (in English), not in JSON, code blocks, or any structured format.

# # Your response should be detailed, formatted in complete sentences, and should read naturally — as if you are speaking to a client. Do not use headings, markdown syntax, or lists unless absolutely necessary. Keep your writing formal but friendly, concise, and practical.

# # The response should follow this structure:

# # 1. **Opening Summary (2–3 sentences)**  
# #    Start with a short overview that restates the user’s goal and summarizes the investment direction you recommend (e.g., balanced, growth-oriented, safety-first, etc.).

# # 2. **Detailed Breakdown (2–3 paragraphs)**  
# #    Explain *why* this approach suits their risk profile and time horizon.  
# #    Mention approximate allocations in percentage terms (e.g., 40% Fixed Deposits, 35% Debt Mutual Funds, 25% Equity Funds), but do not use JSON or tables.  
# #    Give reasoning — for example:  
# #    - Conservative investors → prefer stable, low-risk instruments like FDs, Debt Funds, and Government Schemes.  
# #    - Moderate investors → should mix equities and debt for steady growth.  
# #    - Aggressive investors → can take higher risk with more exposure to equity and small/mid-cap funds.

# # 3. **Closing Advice (1–2 sentences)**  
# #    End with an encouraging recommendation or cautionary note, reminding the user about diversification, review frequency, or consulting a financial planner if needed.

# # ---

# # **Tone & Style Guidelines:**
# # - Write naturally — like a human advisor, not a bot.  
# # - Avoid lists or bullet points unless they aid clarity.  
# # - Mention Indian-specific instruments (FDs, Mutual Funds, NPS, PPF, Gold ETFs, etc.).  
# # - Use the ₹ symbol for currency and Indian numbering format (₹1,00,000 not ₹100,000).  
# # - Do not include any JSON, code snippets, or structural formatting in the output.  

# # **Example Expected Output:**

# # > Based on your conservative risk profile and a 3–5 year investment horizon, your focus should be on capital safety with limited market exposure. A suitable plan would allocate around 50% of your ₹1,00,000 investment to Fixed Deposits, 30% to high-quality Debt Mutual Funds, and the remaining 20% to Large-Cap Equity Funds for moderate growth potential.  
# # >  
# # > This mix ensures stability while allowing a small equity component to outpace inflation. Regularly reviewing your portfolio every 12–18 months can help maintain balance as market conditions change.

# # ---

# # **In summary:**  
# # You must output a *plain text explanation* that feels like an authentic, professional financial recommendation tailored to the user’s situation.
# # """

# model = genai.GenerativeModel(
#     model_name="gemini-2.5-pro", # Using the more powerful Pro model
#     generation_config=generation_config,
#     system_instruction=SYSTEM_INSTRUCTION,
# )

# def get_gemini_response(user_input: str, risk: str) -> dict:
#     """
#     Generates a personalized investment pathway using the Gemini Pro model.

#     Args:
#         user_input: The user's query about their investment goals.
#         risk: The user's selected risk profile ('Conservative', 'Moderate', 'Aggressive').

#     Returns:
#         A dictionary containing the investment plan or an error message.
#     """
#     try:
#         # Create a more detailed prompt for the model
#         prompt = f"User Query: '{user_input}', Risk Profile: '{risk}'"

#         response = model.generate_content(prompt)
        
#         # The API response is already a parsed JSON object due to response_mime_type
#         return json.loads(response.text)

#     except Exception as e:
#         print(f"An error occurred: {e}")
#         # Return a structured error message for the frontend to handle
#         return {
#             "error": "Failed to generate investment path. The model may be unavailable or the request could not be processed. Please try again later."
#         }

# # --- Main execution block for testing ---
# if __name__ == "__main__":
#     # Sample test query matching the UI
#     test_query = "I have ₹1 lakh to invest for 3-5 years. Safety is my primary concern."
#     test_risk = "Conservative"
    
#     print(f"Test Query: {test_query}")
#     print(f"Risk Profile: {test_risk}")
    
#     response_data = get_gemini_response(test_query, test_risk)
    
#     # Pretty-print the JSON response for readability
#     print("\n--- Gemini Response ---")
#     print(json.dumps(response_data, indent=2))




















































































































































































#======================================================================================================================================
# # Previous version of the code before the upgrade to Gemini 2.5 Pro
# # Retained for reference; not used in current implementation
# =====================================================================================================================================


# import os
# import google.generativeai as genai
# import re
# import json
# from dotenv import load_dotenv

# load_dotenv()

# genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# # Create the model
# generation_config = {
#   "temperature": 1,
#   "top_p": 0.95,
#   "top_k": 40,
#   "max_output_tokens": 8192,
#   "response_mime_type": "text/plain",
# }

# model = genai.GenerativeModel(
#   model_name="gemini-1.5-flash",
#   generation_config=generation_config,
#   system_instruction="You are a personal financial advisor dedicated to helping in  financial journey. Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. Be precise and practical in your advice while considering individual circumstances.\\n\\nKey areas of expertise:\\n- Budgeting and expense tracking\\n- Investment strategies and portfolio management\\n- Retirement planning\\n- Debt management and elimination\\n- Tax planning considerations\\n- Emergency fund planning\\n- Risk management and insurance\\n\\nProvide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.\n\nYou can increase the number of nodes and edges in the response if needed.\n\nFor the given user query you have to response a proper output by giving proper response in the following format\nStrictly follow the given format only\n\n\n\n{\n  \"nodes\": [\n    {\n      \"id\": \"start\",\n      \"position\": { \"x\": 250, \"y\": 50 },\n      \"data\": { \"label\": \"Investment\\n₹1,00,000\" },\n      \"style\": {\n        \"background\": \"bg-blue-100\",\n        \"border\": \"border-blue-500\"\n      }\n    },\n    {\n      \"id\": \"index\",\n      \"position\": { \"x\": 50, \"y\": 200 },\n      \"data\": { \"label\": \"Index Funds\\n₹40,000\" },\n      \"style\": {\n        \"background\": \"bg-indigo-100\",\n        \"border\": \"border-indigo-500\"\n      }\n    },\n    {\n      \"id\": \"midcap\",\n      \"position\": { \"x\": 250, \"y\": 200 },\n      \"data\": { \"label\": \"Mid-Cap Stocks\\n₹35,000\" },\n      \"style\": {\n        \"background\": \"bg-orange-100\",\n        \"border\": \"border-orange-500\"\n      }\n    },\n    {\n      \"id\": \"gold\",\n      \"position\": { \"x\": 450, \"y\": 200 },\n      \"data\": { \"label\": \"Gold Investment\\n₹25,000\" },\n      \"style\": {\n        \"background\": \"bg-yellow-100\",\n        \"border\": \"border-yellow-500\"\n      }\n    }\n  ],\n  \"edges\": [\n    {\n      \"id\": \"e-index\",\n      \"source\": \"start\",\n      \"target\": \"index\",\n      \"label\": \"40%\",\n      \"style\": { \"stroke\": \"stroke-indigo-500\" }\n    },\n    {\n      \"id\": \"e-midcap\",\n      \"source\": \"start\",\n      \"target\": \"midcap\",\n      \"label\": \"35%\",\n      \"style\": { \"stroke\": \"stroke-orange-500\" }\n    },\n    {\n      \"id\": \"e-gold\",\n      \"source\": \"start\",\n      \"target\": \"gold\",\n      \"label\": \"25%\",\n      \"style\": { \"stroke\": \"stroke-yellow-500\" }\n    }\n  ]\n}",
# )

# chat_session = model.start_chat(
#   history=[
#   ]
# )

# def get_gemini_response(user_input: str, risk:str) -> str:
#     response = chat_session.send_message(f'{user_input} \nMy risk profile is:{risk}')
#     markdown_text = response.text
#     # Extract content between ```json and ``` blocks
#     json_match = re.search(r'```json\s*(.*?)\s*```', markdown_text, re.DOTALL)
#     print(json_match.group(1))
#     if json_match:
#         resp = json.loads(json_match.group(1))
#     else:
#         # Fallback to try parsing the entire response as JSON
#         resp = json.loads(markdown_text)

#     return resp

# if __name__ == "__main__":
#     # Sample test query
#     test_query = "I have around ten lakh rupees where should I invest them"
#     print("Test Query:", test_query)
#     response = get_gemini_response(test_query)
#     print("Response:", response)