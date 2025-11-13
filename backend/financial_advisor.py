"""
FinEdge AI Financial Advisor - Consolidated Backend Module

This module combines ReAct agent capabilities with Gemini chat for comprehensive
financial advisory. It provides tool-based research with session management.

Features:
- ReAct agent with financial tools (LEGACY + ENHANCED)
- Session-based chat management (LEGACY + ENHANCED)
- Fallback mechanisms for reliability (NEW - ADDED)
- Integrated research and advisory (ENHANCED)

Author: FinEdge Team
Version: 2.0.0 (Consolidated & Enhanced)
"""

import os
import sys
import logging
import warnings
from typing import Optional, Dict, Any, List
from datetime import datetime

# Third-party imports
from dotenv import load_dotenv
import google.generativeai as genai  # type: ignore

# LangChain imports for ReAct agent (LEGACY)
# from langchain.agents import AgentExecutor, create_react_agent
# from langchain_classic.agents import AgentExecutor, create_react_agent
from langchain.agents import create_react_agent
from langchain_core.agents import AgentExecutor

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

# Suppress warnings (LEGACY)
warnings.filterwarnings("ignore")

# Configure logging (ENHANCED - more detailed)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables (LEGACY)
load_dotenv()

# ==================== CONFIGURATION ====================

# API Configuration (LEGACY + ENHANCED error handling)
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

try:
    genai.configure(api_key=GEMINI_API_KEY)  # type: ignore
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {e}")
    raise

# ==================== GEMINI CHAT CONFIGURATION (LEGACY) ====================

# Gemini model configuration for financial advisory (LEGACY)
GENERATION_CONFIG = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    #"max_output_tokens": 8192,
    "max_output_tokens": 2048,
    "response_mime_type": "text/plain",
}
# ENHANCED - More concise instruction (UPDATED)
FINANCIAL_ADVISOR_INSTRUCTION = """You are a knowledgeable personal financial advisor dedicated to helping individuals navigate their financial journey. Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. Be precise and practical in your advice while considering individual circumstances.

Key areas of expertise:
- Budgeting and expense tracking
- Investment strategies and portfolio management
- Retirement planning
- Debt management and elimination
- Tax planning considerations
- Emergency fund planning
- Risk management and insurance
- Stock market analysis and research
- Company fundamentals evaluation

**IMPORTANT RESPONSE GUIDELINES (NEW - ADDED):**
1. Keep responses concise and to-the-point (max 300-400 words for general queries)
2. Use bullet points and short paragraphs for readability
3. Provide actionable advice, not lengthy explanations
4. For "teach me" or "basics" questions: Give 3-5 key points with brief explanations
5. For investment queries: Focus on key metrics, risks, and 2-3 specific recommendations
6. Avoid repetition and filler content
7. If the user asks for details, then provide comprehensive answers

Provide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.

If the user provides you with research data from tools (like stock prices, company info, historical data), use it comprehensively in your response. Always cite the data when making recommendations.

When answering investment queries:
1. Consider current market conditions
2. Evaluate company fundamentals
3. Assess risk factors
4. Provide balanced pros and cons (2-3 each maximum)
5. Never guarantee returns or outcomes

Remember: Brevity is key. Quality over quantity."""
# # System instruction
# FINANCIAL_ADVISOR_INSTRUCTION = """You are a knowledgeable personal financial advisor dedicated to helping individuals navigate their financial journey. Focus on providing guidance on budgeting, investing, retirement planning, debt management, and wealth building strategies. Be precise and practical in your advice while considering individual circumstances.

# Key areas of expertise:
# - Budgeting and expense tracking
# - Investment strategies and portfolio management
# - Retirement planning
# - Debt management and elimination
# - Tax planning considerations
# - Emergency fund planning
# - Risk management and insurance
# - Stock market analysis and research
# - Company fundamentals evaluation

# Provide balanced, ethical financial advice and acknowledge when certain situations may require consultation with other financial professionals.

# If the user provides you with research data from tools (like stock prices, company info, historical data), use it comprehensively in your response. Always cite the data when making recommendations.

# When answering investment queries:
# 1. Consider current market conditions
# 2. Evaluate company fundamentals
# 3. Assess risk factors
# 4. Provide balanced pros and cons
# 5. Never guarantee returns or outcomes
# """

# Initialize Gemini model (LEGACY)
gemini_model = genai.GenerativeModel(  # type: ignore
    model_name="gemini-2.5-pro",
    generation_config=GENERATION_CONFIG,  # type: ignore
    system_instruction=FINANCIAL_ADVISOR_INSTRUCTION,
)

# ==================== SESSION MANAGEMENT (LEGACY + ENHANCED) ====================

# Dictionary to store chat sessions per user/session ID (LEGACY)
chat_sessions: Dict[str, Any] = {}

# NEW - ADDED: Session metadata for tracking
session_metadata: Dict[str, Dict[str, Any]] = {}


def get_or_create_chat_session(session_id: str = 'default') -> Any:
    """
    Get existing chat session or create a new one for the given session ID.
    
    LEGACY FUNCTION - Enhanced with metadata tracking
    
    Args:
        session_id (str): Unique identifier for the chat session
        
    Returns:
        Chat session object
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'
        
    if session_id not in chat_sessions:
        try:
            chat_sessions[session_id] = gemini_model.start_chat(history=[])
            
            # NEW - ADDED: Track session metadata
            session_metadata[session_id] = {
                'created_at': datetime.now().isoformat(),
                'last_activity': datetime.now().isoformat(),
                'message_count': 0
            }
            
            logger.info(f"Created new chat session: {session_id}")
        except Exception as e:
            logger.error(f"Failed to create chat session {session_id}: {e}")
            raise
    else:
        # NEW - ADDED: Update last activity
        session_metadata[session_id]['last_activity'] = datetime.now().isoformat()
        
    return chat_sessions[session_id]


def clear_chat_session(session_id: str = 'default') -> bool:
    """
    Clear a specific chat session.
    
    LEGACY FUNCTION - Enhanced with metadata cleanup
    
    Args:
        session_id (str): Session ID to clear
        
    Returns:
        bool: True if session was cleared, False if not found
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'
        
    if session_id in chat_sessions:
        del chat_sessions[session_id]
        
        # NEW - ADDED: Clean up metadata
        if session_id in session_metadata:
            del session_metadata[session_id]
            
        logger.info(f"Cleared chat session: {session_id}")
        return True
    return False


def get_chat_history(session_id: str = 'default') -> list:
    """
    Get chat history for a specific session.
    
    LEGACY FUNCTION - No changes
    
    Args:
        session_id (str): Session ID to get history for
        
    Returns:
        list: Chat history
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'
        
    if session_id in chat_sessions:
        return chat_sessions[session_id].history
    return []


def get_active_sessions() -> List[str]:
    """
    Get list of all active session IDs.
    
    LEGACY FUNCTION - No changes
    
    Returns:
        list: List of active session IDs
    """
    return list(chat_sessions.keys())


def get_session_info(session_id: str = 'default') -> Optional[Dict[str, Any]]:
    """
    Get metadata information about a specific session.
    
    NEW - ADDED: Provides session statistics
    
    Args:
        session_id (str): Session ID to get info for
        
    Returns:
        dict: Session metadata or None if not found
    """
    if session_id in session_metadata:
        info = session_metadata[session_id].copy()
        info['session_id'] = session_id
        info['history_length'] = len(get_chat_history(session_id))
        return info
    return None


def cleanup_old_sessions(max_sessions: int = 100) -> int:
    """
    Clean up old sessions if too many are active.
    Removes oldest sessions first based on last activity.
    
    LEGACY FUNCTION - ENHANCED with smarter cleanup
    
    Args:
        max_sessions (int): Maximum number of sessions to keep
        
    Returns:
        int: Number of sessions removed
    """
    if len(chat_sessions) > max_sessions:
        # ENHANCED - Sort by last activity time instead of FIFO
        sorted_sessions = sorted(
            session_metadata.items(),
            key=lambda x: x[1].get('last_activity', ''),
        )
        
        sessions_to_remove = len(chat_sessions) - max_sessions
        removed_count = 0
        
        for i in range(sessions_to_remove):
            if i < len(sorted_sessions):
                session_id = sorted_sessions[i][0]
                clear_chat_session(session_id)
                removed_count += 1
                
        logger.info(f"Cleaned up {removed_count} old sessions")
        return removed_count
    return 0


# ==================== REACT AGENT SETUP (LEGACY + ENHANCED) ====================

def get_react_prompt_template():
    """
    LEGACY FUNCTION - Imported from react_template.py
    This should be in your react_template.py file
    """
    try:
        from react_template import get_react_prompt_template as get_template
        return get_template()
    except ImportError:
        logger.warning("react_template.py not found, using default template")
        # Provide a minimal default if react_template.py is missing
        from langchain.prompts import PromptTemplate
        return PromptTemplate(
            input_variables=["input", "agent_scratchpad", "tools", "tool_names"],
            template="""Answer the following questions as best you can. You have access to the following tools:

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
        )


def initialize_tools():
    """
    Initialize all financial tools for the ReAct agent.
    
    LEGACY FUNCTION - Imports from tools/mytools.py (updated import path)
    
    Returns:
        list: List of tool objects
    """
    try:
        # ENHANCED - Import from tools directory (respecting folder structure)
        from tools.mytools import (
            add, subtract, multiply, divide, power,
            search, repl_tool,
            get_historical_price, get_current_price, 
            get_company_info, evaluate_returns,
            check_system_time
        )
        
        tools = [
            # Basic tools (LEGACY)
            add, subtract, multiply, divide, power,
            # Utility tools (LEGACY)
            search, repl_tool, check_system_time,
            # Financial tools (LEGACY)
            get_historical_price, get_current_price, 
            get_company_info, evaluate_returns
        ]
        
        logger.info(f"Initialized {len(tools)} tools successfully")
        return tools
        
    except ImportError as e:
        logger.error(f"Failed to import tools from tools/mytools.py: {e}")
        # NEW - ADDED: Try alternate import path as fallback
        try:
            logger.info("Attempting alternate import path...")
            import sys
            import os
            
            # Add tools directory to path if not already there
            tools_dir = os.path.join(os.path.dirname(__file__), 'tools')
            if tools_dir not in sys.path:
                sys.path.insert(0, tools_dir)
            
            #===================================================================================================================
            # this line seems dicey, if any error comes, come to this line and maybe solve it. this was original line
            # from mytools import (................
            # ===================================================================================================================
            from tools.mytools import (
                add, subtract, multiply, divide, power,
                search, repl_tool,
                get_historical_price, get_current_price, 
                get_company_info, evaluate_returns,
                check_system_time
            )
            
            tools = [
                add, subtract, multiply, divide, power,
                search, repl_tool, check_system_time,
                get_historical_price, get_current_price, 
                get_company_info, evaluate_returns
            ]
            
            logger.info(f"Initialized {len(tools)} tools successfully via alternate path")
            return tools
            
        except ImportError as e2:
            logger.error(f"Alternate import also failed: {e2}")
            # Return minimal toolset if import fails (NEW - ADDED for robustness)
            return []

# def initialize_tools():
#     """
#     Initialize all financial tools for the ReAct agent.
    
#     LEGACY FUNCTION - Imports from mytools.py
    
#     Returns:
#         list: List of tool objects
#     """
#     try:
#         # Import from your tools directory (LEGACY)
#         from tools.mytools import (
#             add, subtract, multiply, divide, power,
#             search, repl_tool,
#             get_historical_price, get_current_price, 
#             get_company_info, evaluate_returns,
#             check_system_time
#         )
        
#         tools = [
#             # Basic tools (LEGACY)
#             add, subtract, multiply, divide, power,
#             # Utility tools (LEGACY)
#             search, repl_tool, check_system_time,
#             # Financial tools (LEGACY)
#             get_historical_price, get_current_price, 
#             get_company_info, evaluate_returns
#         ]
        
#         logger.info(f"Initialized {len(tools)} tools successfully")
#         return tools
        
#     except ImportError as e:
#         logger.error(f"Failed to import tools: {e}")
#         # Return minimal toolset if import fails (NEW - ADDED for robustness)
#         return []


# Initialize LLM for ReAct agent (LEGACY)
react_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    google_api_key=GEMINI_API_KEY,
    temperature=0,
    max_output_tokens=1024
)

# Initialize tools (LEGACY)
tools = initialize_tools()

# Create ReAct agent (LEGACY)
try:
    prompt_template = get_react_prompt_template()
    react_agent = create_react_agent(react_llm, tools, prompt_template)
    
    # Create agent executor (LEGACY + ENHANCED configuration)
    agent_executor = AgentExecutor(
        agent=react_agent,
        tools=tools,
        verbose=True,  # LEGACY
        handle_parsing_errors=True,  # LEGACY
        max_iterations=5,  # ENHANCED - increased from 3 to 5 for better research
        return_intermediate_steps=True,  # ENHANCED - changed to True for better debugging
        early_stopping_method="generate"  # NEW - ADDED for cleaner outputs
    )
    
    logger.info("ReAct agent initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize ReAct agent: {e}")
    agent_executor = None


# ==================== CORE ADVISOR FUNCTIONS (ENHANCED) ====================

def get_agent_research(user_query: str, session_id: str = 'default') -> Dict[str, Any]:
    """
    Use ReAct agent to research the query using available tools.
    
    LEGACY FUNCTION - ENHANCED with better error handling and structured output
    
    Args:
        user_query (str): User's financial question
        session_id (str): Session identifier for tracking
        
    Returns:
        dict: Research results with output, intermediate steps, and metadata
    """
    if not agent_executor:
        logger.warning("ReAct agent not available, skipping research")
        return {
            'success': False,
            'output': '',
            'error': 'Agent not initialized',
            'intermediate_steps': []
        }
    
    try:
        logger.info(f"[{session_id}] Starting research for query: {user_query[:100]}...")
        
        # LEGACY - Execute agent with query
        response = agent_executor.invoke({"input": user_query})
        
        # ENHANCED - Structure the response better
        return {
            'success': True,
            'output': response.get("output", ""),
            'intermediate_steps': response.get("intermediate_steps", []),
            'error': None
        }
        
    except Exception as e:
        logger.error(f"[{session_id}] Research failed: {e}")
        # ENHANCED - Return structured error
        return {
            'success': False,
            'output': '',
            'error': str(e),
            'intermediate_steps': []
        }


def chat_with_advisor(
    query: str, 
    research_context: str = '', 
    session_id: str = 'default'
) -> str:
    """
    Send a query to the financial advisor with optional research context.
    
    LEGACY FUNCTION - ENHANCED with better context formatting
    
    Args:
        query (str): User's financial question
        research_context (str): Research data from ReAct agent
        session_id (str): Session identifier for conversation continuity
        
    Returns:
        str: AI advisor response
    """
    # Input validation (LEGACY)
    if not query or not isinstance(query, str):
        return "Error: Invalid query provided"
    
    if len(query.strip()) == 0:
        return "Error: Empty query provided"
        
    # Limit query length (LEGACY)
    if len(query) > 5000:
        return "Error: Query too long. Please limit to 5000 characters."
    
    try:
        # Get or create chat session (LEGACY)
        chat_session = get_or_create_chat_session(session_id)
        
        # ENHANCED - Format message with better structure
        if research_context:
            message = f"""RESEARCH DATA FROM TOOLS:
{research_context}

USER QUESTION:
{query}

Please provide a comprehensive financial advisory response based on the research data above and your expertise. Cite specific numbers and data points from the research when making recommendations."""
        else:
            message = query
        
        logger.info(f"[{session_id}] Processing advisory query: {query[:100]}...")
        
        # Send message to Gemini (LEGACY)
        response = chat_session.send_message(message)  # type: ignore
        
        if not response or not hasattr(response, 'text') or not response.text:
            raise ValueError("Empty or invalid response from Gemini")
        
        # NEW - ADDED: Update session metadata
        if session_id in session_metadata:
            session_metadata[session_id]['message_count'] += 1
            session_metadata[session_id]['last_activity'] = datetime.now().isoformat()
            
        logger.info(f"[{session_id}] Successfully generated advisory response")
        return str(response.text)
        
    except Exception as e:
        logger.warning(f"[{session_id}] Primary request failed: {e}")
        
        # LEGACY - Session recovery mechanism
        try:
            logger.info(f"[{session_id}] Attempting session recovery")
            clear_chat_session(session_id)
            new_session = get_or_create_chat_session(session_id)
            response = new_session.send_message(message)  # type: ignore
            
            if not response or not hasattr(response, 'text') or not response.text:
                raise ValueError("Empty or invalid response from Gemini on retry")
                
            logger.info(f"[{session_id}] Session recovery successful")
            return str(response.text)
            
        except Exception as retry_error:
            logger.error(f"[{session_id}] Session recovery failed: {retry_error}")
            return f"I apologize, but I'm experiencing technical difficulties. Please try again in a moment. Error: {str(retry_error)}"


# ============================================================================================================================================================
# EHNANCED - CONSOLIDATED FUNCTION REPLACES THE BELOW LEGACY FUNCTION.
# ============================================================================================================================================================
def classify_query_with_ai(user_query: str) -> Dict[str, Any]:
    """
    Use Gemini to intelligently classify if a query needs research tools.
    
    NEW - ADDED: AI-powered classification (replaces keyword matching)
    
    Returns:
        dict: {
            'needs_research': bool,
            'reasoning': str,
            'query_type': str
        }
    """
    try:
        classification_prompt = f"""You are a query classifier for a financial advisory chatbot.

Analyze this user query and determine if it needs REAL-TIME DATA from tools (like stock prices, company info, historical data) or if it's a CONCEPTUAL question that can be answered from knowledge alone.

User Query: "{user_query}"

Classification Rules:
1. NEEDS RESEARCH (needs_research: true) - If query asks for:
   - Current/live stock prices, market data
   - Specific company information, financials, PE ratios
   - Historical performance, returns calculation
   - Investment analysis for specific stocks/companies
   - Comparison between specific stocks
   - "Should I invest in [specific company]?"

2. CONCEPTUAL (needs_research: false) - If query asks for:
   - Explanations of financial concepts (SIP, mutual funds, bonds, etc.)
   - General advice on budgeting, saving, planning
   - How-to guides, step-by-step processes
   - Differences between concepts (not specific companies)
   - General investment strategies
   - Tax planning concepts

Respond in this EXACT JSON format (no extra text):
{{
    "needs_research": true/false,
    "query_type": "research-based" or "conceptual",
    "reasoning": "brief 1-line explanation"
}}"""

        # Quick classification using Gemini (FAST - uses lower token limit)
        temp_config = {
            "temperature": 0,  # Deterministic classification
            "top_p": 1,
            "top_k": 1,
            "max_output_tokens": 100,  # Very small for speed
            "response_mime_type": "application/json",
        }
        
        classifier_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",  # Faster model for classification
            generation_config=temp_config,
        )
        
        response = classifier_model.generate_content(classification_prompt)
        
        # Parse JSON response
        import json
        result = json.loads(response.text)
        
        logger.info(f"Query classified: {result['query_type']} - {result['reasoning']}")
        return result
        
    except Exception as e:
        logger.error(f"Classification failed: {e}, defaulting to research mode")
        # FALLBACK: If classification fails, default to using research (safer)
        return {
            'needs_research': True,
            'query_type': 'research-based',
            'reasoning': 'Classification error, using research as fallback'
        }


def get_comprehensive_financial_advice(
    user_query: str,
    session_id: str = 'default',
    use_research: bool = True
) -> Dict[str, Any]:
    """
    Main function that combines ReAct agent research with Gemini advisory.
    
    ENHANCED - AI-powered smart query routing (OPTIMIZED & FOOLPROOF)
    """
    start_time = datetime.now()
    
    # NEW - ADDED: AI-powered classification (replaces keyword matching)
    if use_research:
        classification = classify_query_with_ai(user_query)
        should_use_research = classification['needs_research']
        query_type = classification['query_type']
        classification_reasoning = classification['reasoning']
    else:
        should_use_research = False
        query_type = 'conceptual'
        classification_reasoning = 'Research disabled by user'
    
    if not should_use_research:
        logger.info(f"[{session_id}] AI classified as {query_type}, skipping research phase")
        logger.info(f"[{session_id}] Reasoning: {classification_reasoning}")
    
    # Step 1: Research with ReAct agent (ENHANCED - AI-driven conditional)
    research_results = {}
    research_context = ""
    
    if should_use_research and agent_executor:
        logger.info(f"[{session_id}] Phase 1: Conducting research")
        research_results = get_agent_research(user_query, session_id)
        
        if research_results['success']:
            research_context = research_results['output']
            logger.info(f"[{session_id}] Research completed successfully")
        else:
            logger.warning(f"[{session_id}] Research failed, proceeding without it")
    
    # Step 2: Get advisory response from Gemini (LEGACY)
    logger.info(f"[{session_id}] Phase 2: Generating financial advice")
    advisory_response = chat_with_advisor(user_query, research_context, session_id)
    
    # Calculate processing time (LEGACY)
    end_time = datetime.now()
    processing_time = (end_time - start_time).total_seconds()
    
    # Construct comprehensive response (ENHANCED)
    response = {
        'session_id': session_id,
        'query': user_query,
        'advice': advisory_response,
        'research_used': should_use_research and research_results.get('success', False),
        'research_skipped': not should_use_research,  # NEW - ADDED
        'query_type': query_type,  # NEW - ADDED (AI-determined)
        'classification_reasoning': classification_reasoning if use_research else None,  # NEW - ADDED
        'research_output': research_context if research_results.get('success') else None,
        'processing_time_seconds': round(processing_time, 2),
        'timestamp': datetime.now().isoformat(),
        'error': research_results.get('error') if not research_results.get('success') else None
    }
    
    logger.info(f"[{session_id}] Completed in {processing_time:.2f}s")
    return response
# def get_comprehensive_financial_advice(
#     user_query: str,
#     session_id: str = 'default',
#     use_research: bool = True
# ) -> Dict[str, Any]:
#     """
#     Main function that combines ReAct agent research with Gemini advisory.
    
#     NEW - ADDED: Consolidated function that orchestrates both systems
    
#     Args:
#         user_query (str): User's financial question
#         session_id (str): Session identifier
#         use_research (bool): Whether to use ReAct agent for research
        
#     Returns:
#         dict: Complete response with advice, research, and metadata
#     """
#     start_time = datetime.now()
    
#     # Step 1: Research with ReAct agent (if enabled)
#     research_results = {}
#     research_context = ""
    
#     if use_research and agent_executor:
#         logger.info(f"[{session_id}] Phase 1: Conducting research")
#         research_results = get_agent_research(user_query, session_id)
        
#         if research_results['success']:
#             research_context = research_results['output']
#             logger.info(f"[{session_id}] Research completed successfully")
#         else:
#             logger.warning(f"[{session_id}] Research failed, proceeding without it")
    
#     # Step 2: Get advisory response from Gemini
#     logger.info(f"[{session_id}] Phase 2: Generating financial advice")
#     advisory_response = chat_with_advisor(user_query, research_context, session_id)
    
#     # Calculate processing time
#     end_time = datetime.now()
#     processing_time = (end_time - start_time).total_seconds()
    
#     # Construct comprehensive response
#     response = {
#         'session_id': session_id,
#         'query': user_query,
#         'advice': advisory_response,
#         'research_used': use_research and research_results.get('success', False),
#         'research_output': research_context if research_results.get('success') else None,
#         'processing_time_seconds': round(processing_time, 2),
#         'timestamp': datetime.now().isoformat(),
#         'error': research_results.get('error') if not research_results.get('success') else None
#     }
    
#     logger.info(f"[{session_id}] Completed in {processing_time:.2f}s")
#     return response


# ==================== LEGACY COMPATIBILITY FUNCTIONS ====================

def get_agent_response(user_input: str) -> str:
    """
    LEGACY FUNCTION - Maintained for backward compatibility with agent.py
    
    Get response from ReAct agent only (without Gemini chat).
    """
    if not agent_executor:
        return "Agent not available. Please check configuration."
    
    try:
        response = agent_executor.invoke({"input": user_input})
        return response.get("output", "No response generated")
    except Exception as e:
        logger.error(f"Agent response error: {e}")
        return f"Sorry, I encountered an error: {str(e)}"


def jgaad_chat_with_gemini(query: str, research: str = '', session_id: str = 'default') -> str:
    """
    LEGACY FUNCTION - Maintained for backward compatibility with jgaad_ai_agent_backup.py
    
    Direct chat with Gemini (legacy interface).
    """
    return chat_with_advisor(query, research, session_id)


# ==================== COMMAND LINE INTERFACE (LEGACY + ENHANCED) ====================

def run_cli():
    """
    Run the advisor from command line.
    
    LEGACY FUNCTION - ENHANCED with better output formatting
    """
    if len(sys.argv) > 1:
        # Get query from command line arguments (LEGACY)
        query = ' '.join(sys.argv[1:])
        
        # Check for flags (NEW - ADDED)
        use_research = '--no-research' not in sys.argv
        session_id = 'cli_session'
        
        logger.info(f"Processing CLI query: {query}")
        
        # Get comprehensive advice (NEW - ADDED)
        result = get_comprehensive_financial_advice(
            query, 
            session_id=session_id,
            use_research=use_research
        )
        
        # ENHANCED - Better output formatting
        print("\n" + "="*80)
        print("FINEDGE AI FINANCIAL ADVISOR")
        print("="*80)
        print(f"\nQuery: {query}")
        print(f"\nProcessing Time: {result['processing_time_seconds']}s")
        
        if result['research_used']:
            print(f"\n{'─'*80}")
            print("RESEARCH FINDINGS:")
            print(f"{'─'*80}")
            print(result['research_output'])
        
        print(f"\n{'─'*80}")
        print("FINANCIAL ADVICE:")
        print(f"{'─'*80}")
        
        # Output in legacy format for app.py compatibility
        print(f"<Response>{result['advice']}</Response>")
        
        print("\n" + "="*80)
        
    else:
        # ENHANCED - Better help message
        print("\n" + "="*80)
        print("FinEdge AI Financial Advisor - Command Line Interface")
        print("="*80)
        print("\nUsage:")
        print("  python ai_financial_advisor.py <your question>")
        print("\nOptions:")
        print("  --no-research    Skip tool-based research, direct chat only")
        print("\nExamples:")
        print("  python ai_financial_advisor.py Should I invest in Cipla pharmaceuticals?")
        print("  python ai_financial_advisor.py What is the current price of Reliance?")
        print("  python ai_financial_advisor.py --no-research Tell me about SIP investing")
        print("="*80 + "\n")


# ==================== TESTING SUITE (ENHANCED) ====================

def run_tests():
    """
    NEW - ADDED: Comprehensive testing suite
    """
    print("\n" + "="*80)
    print("FINEDGE AI FINANCIAL ADVISOR - TEST SUITE")
    print("="*80)
    
    test_session = "test_session_" + datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Test 1: Basic chat without research
    print("\n[TEST 1] Basic chat without research...")
    try:
        response = chat_with_advisor(
            "What is a mutual fund?",
            session_id=test_session
        )
        print(f"✓ Success: {response[:100]}...")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    # Test 2: Research-based query
    print("\n[TEST 2] Research-based financial query...")
    try:
        result = get_comprehensive_financial_advice(
            "What is the current price of Reliance Industries?",
            session_id=test_session,
            use_research=True
        )
        print(f"✓ Success: Research used: {result['research_used']}")
        print(f"  Advice length: {len(result['advice'])} chars")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    # Test 3: Session management
    print("\n[TEST 3] Session management...")
    try:
        history = get_chat_history(test_session)
        print(f"✓ Chat history: {len(history)} messages")
        
        session_info = get_session_info(test_session)
        print(f"✓ Session info: {session_info}")
        
        active_sessions = get_active_sessions()
        print(f"✓ Active sessions: {len(active_sessions)}")
        
        cleared = clear_chat_session(test_session)
        print(f"✓ Session cleared: {cleared}")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    # Test 4: Agent-only response (legacy compatibility)
    print("\n[TEST 4] Legacy agent response...")
    try:
        response = get_agent_response("What is 2+2?")
        print(f"✓ Success: {response}")
    except Exception as e:
        print(f"✗ Failed: {e}")
    
    print("\n" + "="*80)
    print("TEST SUITE COMPLETED")
    print("="*80 + "\n")


# ==================== MAIN EXECUTION ====================

if __name__ == "__main__":
    # Check if --test flag is provided (NEW - ADDED)
    if '--test' in sys.argv:
        run_tests()
    else:
        run_cli()
