"""
Gemini-based Financial Advisor Chat Module

This module provides a simple chat interface with Gemini AI configured specifically 
for financial advisory tasks. Used by the Flask application for handling chat requests.

Author: FinEdge Team
"""

import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.environ["GEMINI_API_KEY"])

# Gemini model configuration for financial advisory
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Initialize Gemini model with financial advisor system instruction
model = genai.GenerativeModel(
    model_name="gemini-1.5-flash",
    generation_config=generation_config,
    system_instruction="""You are a knowledgeable personal financial advisor dedicated to helping individuals navigate their financial journey. Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. Be precise and practical in your advice while considering individual circumstances.

Key areas of expertise:
- Budgeting and expense tracking
- Investment strategies and portfolio management
- Retirement planning
- Debt management and elimination
- Tax planning considerations
- Emergency fund planning
- Risk management and insurance

Provide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.

If the user provides you the research data then use it for your response.
""",
)

# Initialize chat session
chat_session = model.start_chat(history=[])

def jgaad_chat_with_gemini(query: str, research: str = '') -> str:
    """
    Send a query to Gemini AI with optional research context.
    
    Args:
        query (str): User's financial question or query
        research (str, optional): Additional research context to include
        
    Returns:
        str: AI response with financial advice
    """
    global chat_session
    
    # Format the message with research context if provided
    message = f"{research}\nBased on the above research answer the following query properly\n{query}" if research else query
    
    try:
        response = chat_session.send_message(message)
        return response.text
    except Exception as e:
        return f"Error processing your request: {str(e)}"

# Test functionality when run directly
if __name__ == "__main__":
    # Sample test query
    test_query = "Should I invest in IT companies now?"
    response = jgaad_chat_with_gemini(test_query)
    print("Test Response:", response)