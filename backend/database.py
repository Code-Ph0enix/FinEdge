"""
FinEdge MongoDB Database Connection Module

Handles connection to MongoDB Atlas and provides database access
for user profile management, onboarding data, and financial records.

Author: FinEdge Team
Version: 1.1.0 (Optimized & Cleaned)
"""

import os
import logging
from typing import Optional
from urllib.parse import quote_plus  # NEW - ADDED for password encoding
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Configuration
MONGODB_URI = os.environ.get("MONGODB_URI")
MONGODB_DB_NAME = os.environ.get("MONGODB_DB_NAME", "finedge_db")

# Global database connection
_db_client: Optional[MongoClient] = None
_database: Optional[Database] = None


def get_database() -> Database:
    """
    Get MongoDB database instance with connection pooling.
    
    UPDATED - Cleaner logging and automatic password encoding
    
    Creates a new connection if none exists, otherwise returns existing connection.
    Uses connection pooling for efficient resource management.
    
    Returns:
        Database: MongoDB database instance
        
    Raises:
        ValueError: If MONGODB_URI is not set in environment
        ConnectionFailure: If unable to connect to MongoDB
    """
    global _db_client, _database
    
    # Return existing connection if available (LEGACY)
    if _database is not None:
        return _database
    
    # Validate MongoDB URI (LEGACY)
    if not MONGODB_URI:
        raise ValueError("MONGODB_URI not set in environment")
    
    try:
        # UPDATED - Cleaner log message
        logger.info("📊 Connecting to MongoDB Atlas...")
        
        connection_uri = MONGODB_URI
        
        # ENHANCED - Auto-encode password with special characters
        if "mongodb+srv://" in connection_uri:
            try:
                # Extract username and password from URI
                parts = connection_uri.replace("mongodb+srv://", "").split("@")
                if len(parts) > 1:
                    credentials = parts[0]
                    if ":" in credentials:
                        username, password = credentials.split(":", 1)
                        
                        # Check if password needs encoding
                        special_chars = ['@', '#', '$', '%', '^', '&', '+', '=', ':', '/', '?', ' ', '!']
                        if any(char in password for char in special_chars):
                            encoded_password = quote_plus(password)
                            connection_uri = connection_uri.replace(f":{password}@", f":{encoded_password}@")
                            # Silent encoding - no log spam
            except Exception:
                # If parsing fails, continue with original URI
                pass
        
        # Create MongoDB client with connection pooling (LEGACY)
        _db_client = MongoClient(
            connection_uri,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            maxPoolSize=50
        )
        
        # Verify connection by pinging the database (LEGACY)
        _db_client.admin.command('ping')
        
        # Get database instance (LEGACY)
        _database = _db_client[MONGODB_DB_NAME]
        
        # UPDATED - Cleaner success message
        logger.info(f"✅ MongoDB connected: {MONGODB_DB_NAME}")
        return _database
        
    except ServerSelectionTimeoutError as e:
        # UPDATED - Shortened error message
        logger.error("❌ MongoDB timeout - check IP whitelist and cluster status")
        raise ConnectionFailure(f"MongoDB connection failed: {e}")
        
    except ConnectionFailure as e:
        logger.error(f"❌ MongoDB connection failed: {e}")
        raise
        
    except Exception as e:
        logger.error(f"❌ MongoDB error: {e}")
        raise


def close_database_connection():
    """
    Close the MongoDB connection.
    
    LEGACY - No changes
    
    Should be called when application shuts down to properly
    release database resources and connections.
    """
    global _db_client, _database
    
    if _db_client is not None:
        _db_client.close()
        _db_client = None
        _database = None
        logger.info("MongoDB connection closed")


def test_connection() -> bool:
    """
    Test MongoDB connection.
    
    UPDATED - Silent on success, only logs errors
    
    Useful for health checks and debugging.
    
    Returns:
        bool: True if connection successful, False otherwise
    """
    try:
        db = get_database()
        # Try to list collections to verify read access (LEGACY)
        collections = db.list_collection_names()
        # UPDATED - Silent success (no log spam)
        return True
    except Exception as e:
        # UPDATED - Only log on failure
        logger.error(f"❌ MongoDB test failed: {e}")
        return False


# Collection names (constants for consistency) - LEGACY - No changes
class Collections:
    """MongoDB collection names used in FinEdge application"""
    USER_PROFILES = "user_profiles"      # Main user profile and onboarding data
    INCOME = "income_entries"            # User income records
    EXPENSES = "expense_entries"         # User expense records
    ASSETS = "asset_entries"             # User asset records
    LIABILITIES = "liability_entries"    # User liability records
    GOALS = "financial_goals"            # User financial goals
    SESSIONS = "user_sessions"           # User session data (optional)


# UPDATED - Removed noisy startup initialization
# Database will connect lazily on first actual request
# This prevents double-connection logs and startup errors

# End of backend/database.py
