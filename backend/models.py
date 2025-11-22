"""
FinEdge MongoDB Data Models

Defines schemas and helper functions for MongoDB collections.
Includes validation, default values, and CRUD operations.

Author: FinEdge Team
Version: 1.0.0
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from bson import ObjectId
import logging

logger = logging.getLogger(__name__)


# ==================== SCHEMA DEFINITIONS ====================

class UserProfileSchema:
    """
    User Profile Schema
    
    Main document storing user's financial profile and onboarding status.
    Links to Clerk user authentication via clerkUserId.
    """
    
    @staticmethod
    def create_default(clerk_user_id: str) -> Dict[str, Any]:
        """
        Create a default user profile document.
        
        Args:
            clerk_user_id (str): Unique Clerk user identifier
            
        Returns:
            dict: Default user profile document
        """
        return {
            "clerkUserId": clerk_user_id,
            "onboardingCompleted": False,
            "onboardingStep": 0,  # Track which step user is on (0-5)
            "riskTolerance": None,  # Will be set during onboarding
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow(),
            "lastLoginAt": datetime.utcnow(),
            # Summary statistics (calculated from entries)
            "totalIncome": 0,
            "totalExpenses": 0,
            "totalAssets": 0,
            "totalLiabilities": 0,
            "netWorth": 0,
            # Metadata
            "version": "1.0.0"
        }
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> bool:
        """Validate user profile data structure"""
        required_fields = ["clerkUserId", "onboardingCompleted"]
        return all(field in data for field in required_fields)


class IncomeSchema:
    """Income Entry Schema"""
    
    @staticmethod
    def create(
        clerk_user_id: str,
        source: str,
        amount: float,
        frequency: str,
        category: str,
        date: str
    ) -> Dict[str, Any]:
        """
        Create an income entry document.
        
        Args:
            clerk_user_id: User's Clerk ID
            source: Income source name (e.g., "Salary from TCS")
            amount: Income amount
            frequency: 'monthly' | 'yearly' | 'one-time'
            category: 'salary' | 'investment' | 'gift' | 'other'
            date: Date string (ISO format)
            
        Returns:
            dict: Income entry document
        """
        return {
            "clerkUserId": clerk_user_id,
            "source": source,
            "amount": float(amount),
            "frequency": frequency,
            "category": category,
            "date": date,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> bool:
        """Validate income entry data"""
        required = ["clerkUserId", "source", "amount", "frequency", "category"]
        valid_frequencies = ["monthly", "yearly", "one-time"]
        valid_categories = ["salary", "investment", "gift", "other"]
        amount = data.get("amount")
        
        return (
            all(field in data for field in required) and
            data.get("frequency") in valid_frequencies and
            data.get("category") in valid_categories and
            isinstance(amount, (int, float)) and
            amount >= 0
        )


class ExpenseSchema:
    """Expense Entry Schema"""
    
    @staticmethod
    def create(
        clerk_user_id: str,
        name: str,
        amount: float,
        category: str,
        frequency: str,
        date: str,
        is_essential: bool = False
    ) -> Dict[str, Any]:
        """
        Create an expense entry document.
        
        Args:
            clerk_user_id: User's Clerk ID
            name: Expense name/description
            amount: Expense amount
            category: 'shopping' | 'housing' | 'transport' | 'food' | 'health' | 'travel' | 'utilities' | 'other'
            frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time'
            date: Date string (ISO format)
            is_essential: Whether expense is essential
            
        Returns:
            dict: Expense entry document
        """
        return {
            "clerkUserId": clerk_user_id,
            "name": name,
            "amount": float(amount),
            "category": category,
            "frequency": frequency,
            "date": date,
            "isEssential": is_essential,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> bool:
        """Validate expense entry data"""
        required = ["clerkUserId", "name", "amount", "category", "frequency"]
        valid_frequencies = ["daily", "weekly", "monthly", "yearly", "one-time"]
        valid_categories = ["shopping", "housing", "transport", "food", "health", "travel", "utilities", "other"]
        amount = data.get("amount")
        
        return (
            all(field in data for field in required) and
            data.get("frequency") in valid_frequencies and
            data.get("category") in valid_categories and
            isinstance(amount, (int, float)) and
            amount >= 0
        )


class AssetSchema:
    """Asset Entry Schema"""
    
    @staticmethod
    def create(
        clerk_user_id: str,
        name: str,
        value: float,
        category: str,
        purchase_date: Optional[str] = None,
        appreciation_rate: Optional[float] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create an asset entry document.
        
        Args:
            clerk_user_id: User's Clerk ID
            name: Asset name/description
            value: Current asset value
            category: 'realestate' | 'investments' | 'vehicles' | 'bank' | 'cash' | 'other'
            purchase_date: Date of purchase (optional)
            appreciation_rate: Annual appreciation rate % (optional)
            notes: Additional notes (optional)
            
        Returns:
            dict: Asset entry document
        """
        return {
            "clerkUserId": clerk_user_id,
            "name": name,
            "value": float(value),
            "category": category,
            "purchaseDate": purchase_date,
            "appreciationRate": float(appreciation_rate) if appreciation_rate else None,
            "notes": notes,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> bool:
        """Validate asset entry data"""
        required = ["clerkUserId", "name", "value", "category"]
        valid_categories = ["realestate", "investments", "vehicles", "bank", "cash", "other"]
        value = data.get("value")
        
        return (
            all(field in data for field in required) and
            data.get("category") in valid_categories and
            isinstance(value, (int, float)) and
            value >= 0
        )


class LiabilitySchema:
    """Liability Entry Schema"""
    
    @staticmethod
    def create(
        clerk_user_id: str,
        name: str,
        amount: float,
        category: str,
        interest_rate: Optional[float] = None,
        due_date: Optional[str] = None,
        monthly_payment: Optional[float] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create a liability entry document.
        
        Args:
            clerk_user_id: User's Clerk ID
            name: Liability name/description
            amount: Outstanding liability amount
            category: 'homeloan' | 'carloan' | 'personalloan' | 'creditcard' | 'education' | 'other'
            interest_rate: Annual interest rate % (optional)
            due_date: Final due date (optional)
            monthly_payment: Monthly payment amount (optional)
            notes: Additional notes (optional)
            
        Returns:
            dict: Liability entry document
        """
        return {
            "clerkUserId": clerk_user_id,
            "name": name,
            "amount": float(amount),
            "category": category,
            "interestRate": float(interest_rate) if interest_rate else None,
            "dueDate": due_date,
            "monthlyPayment": float(monthly_payment) if monthly_payment else None,
            "notes": notes,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    
    @staticmethod
    def validate(data: Dict[str, Any]) -> bool:
        """Validate liability entry data"""
        required = ["clerkUserId", "name", "amount", "category"]
        valid_categories = ["homeloan", "carloan", "personalloan", "creditcard", "education", "other"]
        amount = data.get("amount")
        
        return (
            all(field in data for field in required) and
            data.get("category") in valid_categories and
            isinstance(amount, (int, float)) and
            amount >= 0
        )


# ==================== HELPER FUNCTIONS ====================

def serialize_document(doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Convert MongoDB document to JSON-serializable dict.
    
    Converts ObjectId to string and datetime to ISO format.
    
    Args:
        doc: MongoDB document
        
    Returns:
        dict: JSON-serializable document
    """
    if doc is None:
        return None
    
    # Convert ObjectId to string
    if "_id" in doc:
        doc_id = str(doc["_id"])
        doc["_id"] = doc_id
        doc.setdefault("id", doc_id)
    
    # Convert datetime objects to ISO format strings
    for key, value in doc.items():
        if isinstance(value, datetime):
            doc[key] = value.isoformat()
        elif isinstance(value, ObjectId):
            doc[key] = str(value)
    
    return doc


def calculate_net_worth(
    total_assets: float,
    total_liabilities: float
) -> float:
    """
    Calculate net worth.
    
    Args:
        total_assets: Sum of all asset values
        total_liabilities: Sum of all liability amounts
        
    Returns:
        float: Net worth (assets - liabilities)
    """
    return round(total_assets - total_liabilities, 2)


def calculate_monthly_cash_flow(
    monthly_income: float,
    monthly_expenses: float
) -> float:
    """
    Calculate monthly cash flow.
    
    Args:
        monthly_income: Total monthly income
        monthly_expenses: Total monthly expenses
        
    Returns:
        float: Monthly cash flow (income - expenses)
    """
    return round(monthly_income - monthly_expenses, 2)
# ==================== END OF FILE ====================