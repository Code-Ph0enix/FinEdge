"""
Gemini-based Financial Advisor Chat Module

This module provides a simple chat interface with Gemini AI configured specifically 
for financial advisory tasks. Used by the Flask application for handling chat requests.

Author: FinEdge Team
"""

import os
import logging
import google.generativeai as genai  # type: ignore
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Configure Gemini API with error handling
api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_API_KEY environment variable is not set")

try:
    genai.configure(api_key=api_key)  # type: ignore
    logger.info("Gemini API configured successfully")
except Exception as e:
    logger.error(f"Failed to configure Gemini API: {e}")
    raise

# Gemini model configuration for financial advisory
generation_config = {
    "temperature": 1,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
    "response_mime_type": "text/plain",
}

# Initialize Gemini model with financial advisor system instruction
model = genai.GenerativeModel(  # type: ignore
    model_name="gemini-1.5-flash",
    generation_config=generation_config,  # type: ignore
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

# Dictionary to store chat sessions per user/session ID
chat_sessions = {}

def get_or_create_chat_session(session_id: str = 'default') -> Any:
    """
    Get existing chat session or create a new one for the given session ID.
    
    Args:
        session_id (str): Unique identifier for the chat session
        
    Returns:
        Chat session object
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'
        
    if session_id not in chat_sessions:
        try:
            chat_sessions[session_id] = model.start_chat(history=[])
            logger.info(f"Created new chat session: {session_id}")
        except Exception as e:
            logger.error(f"Failed to create chat session {session_id}: {e}")
            raise
    return chat_sessions[session_id]

def clear_chat_session(session_id: str = 'default') -> bool:
    """
    Clear a specific chat session.
    
    Args:
        session_id (str): Session ID to clear
        
    Returns:
        bool: True if session was cleared, False if not found
    """
    if not session_id or not isinstance(session_id, str):
        session_id = 'default'
        
    if session_id in chat_sessions:
        del chat_sessions[session_id]
        logger.info(f"Cleared chat session: {session_id}")
        return True
    return False

def get_chat_history(session_id: str = 'default') -> list:
    """
    Get chat history for a specific session.
    
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

def get_active_sessions() -> list:
    """
    Get list of all active session IDs.
    
    Returns:
        list: List of active session IDs
    """
    return list(chat_sessions.keys())

def cleanup_old_sessions(max_sessions: int = 100) -> int:
    """
    Clean up old sessions if too many are active.
    Removes oldest sessions first.
    
    Args:
        max_sessions (int): Maximum number of sessions to keep
        
    Returns:
        int: Number of sessions removed
    """
    if len(chat_sessions) > max_sessions:
        # Remove oldest sessions (simple FIFO approach)
        sessions_to_remove = len(chat_sessions) - max_sessions
        session_ids = list(chat_sessions.keys())
        
        removed_count = 0
        for i in range(sessions_to_remove):
            if i < len(session_ids):
                session_id = session_ids[i]
                del chat_sessions[session_id]
                removed_count += 1
                logger.info(f"Removed old session: {session_id}")
                
        logger.info(f"Cleaned up {removed_count} old sessions")
        return removed_count
    return 0

def jgaad_chat_with_gemini(query: str, research: str = '', session_id: str = 'default') -> str:
    """
    Send a query to Gemini AI with optional research context and session management.
    
    Args:
        query (str): User's financial question or query
        research (str, optional): Additional research context to include
        session_id (str, optional): Unique session identifier for conversation continuity
        
    Returns:
        str: AI response with financial advice
    """
    # Input validation
    if not query or not isinstance(query, str):
        return "Error: Invalid query provided"
    
    if len(query.strip()) == 0:
        return "Error: Empty query provided"
        
    # Limit query length to prevent abuse
    if len(query) > 5000:
        return "Error: Query too long. Please limit to 5000 characters."
    
    try:
        # Get or create chat session for this user
        chat_session = get_or_create_chat_session(session_id)
        
        # Format the message with research context if provided
        message = f"{research}\nBased on the above research answer the following query properly\n{query}" if research else query
        
        logger.info(f"Processing query for session {session_id}: {query[:100]}...")
        
        response = chat_session.send_message(message)  # type: ignore
        
        if not response or not hasattr(response, 'text') or not response.text:
            raise ValueError("Empty or invalid response from Gemini")
            
        logger.info(f"Successfully processed query for session {session_id}")
        return str(response.text)
        
    except Exception as e:
        logger.warning(f"Primary request failed for session {session_id}: {e}")
        
        # If there's an error, try creating a new session
        try:
            logger.info(f"Attempting session recovery for {session_id}")
            clear_chat_session(session_id)
            new_session = get_or_create_chat_session(session_id)
            response = new_session.send_message(message)  # type: ignore
            
            if not response or not hasattr(response, 'text') or not response.text:
                raise ValueError("Empty or invalid response from Gemini on retry")
                
            logger.info(f"Session recovery successful for {session_id}")
            return str(response.text)
            
        except Exception as retry_error:
            logger.error(f"Session recovery failed for {session_id}: {retry_error}")
            return f"I apologize, but I'm experiencing technical difficulties. Please try again in a moment. Error: {str(retry_error)}"

# Test functionality when run directly
if __name__ == "__main__":
    try:
        # Sample test queries with session management
        test_session = "test_user_123"
        
        print("=== Testing Session-based Chat ===")
        
        # First query
        print("\n1. Testing first query...")
        response1 = jgaad_chat_with_gemini(
            "Should I invest in IT companies now?", 
            session_id=test_session
        )
        print("Query 1 Response:", response1[:200] + "..." if len(response1) > 200 else response1)
        
        # Follow-up query (should remember context)
        print("\n2. Testing follow-up query with context...")
        response2 = jgaad_chat_with_gemini(
            "What about the risks involved?", 
            session_id=test_session
        )
        print("Query 2 Response:", response2[:200] + "..." if len(response2) > 200 else response2)
        
        # Test session history
        print("\n3. Testing session history...")
        history = get_chat_history(test_session)
        print(f"Session History Length: {len(history)} messages")
        
        # Test active sessions
        print("\n4. Testing active sessions...")
        active = get_active_sessions()
        print(f"Active sessions: {active}")
        
        # Test session clearing
        print("\n5. Testing session clearing...")
        cleared = clear_chat_session(test_session)
        print(f"Session cleared: {cleared}")
        
        # Verify clearing
        active_after = get_active_sessions()
        print(f"Active sessions after clearing: {active_after}")
        
        print("\n=== All tests completed successfully! ===")
        
    except Exception as e:
        print(f"Test failed with error: {e}")
        logger.error(f"Test execution failed: {e}")