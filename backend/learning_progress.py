from datetime import datetime
from typing import List, Dict, Optional
from pydantic import BaseModel, Field
from bson import ObjectId
import pymongo
from database import get_database

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class CourseProgress(BaseModel):
    course_id: str
    title: str
    provider: str
    progress_percentage: int = Field(ge=0, le=100)
    completed: bool = False
    completion_date: Optional[datetime] = None
    time_spent: int = 0  # in minutes
    last_accessed: datetime = Field(default_factory=datetime.utcnow)
    modules_completed: List[int] = []
    quiz_scores: Dict[str, int] = {}
    certificate_earned: bool = False

class LearningStreak(BaseModel):
    current_streak: int = 0
    longest_streak: int = 0
    last_activity_date: Optional[datetime] = None
    streak_milestones: List[int] = []  # Days when milestones were reached

class LearningGoals(BaseModel):
    daily_minutes: int = 30
    weekly_courses: int = 1
    monthly_points: int = 1000
    target_level: str = "Intermediate"

class UserLearningProfile(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: str  # Clerk user ID
    username: str
    email: str
    
    # Progress tracking
    total_points: int = 0
    level: str = "Beginner"  # Beginner, Intermediate, Advanced, Expert
    courses_completed: int = 0
    total_time_spent: int = 0  # in minutes
    
    # Course progress
    course_progress: List[CourseProgress] = []
    completed_courses: List[str] = []  # course IDs
    
    # Streaks and engagement
    learning_streak: LearningStreak = Field(default_factory=LearningStreak)
    
    # Goals and preferences
    learning_goals: LearningGoals = Field(default_factory=LearningGoals)
    preferred_learning_time: Optional[str] = None  # morning, afternoon, evening
    
    # Achievements and badges
    badges_earned: List[str] = []
    achievements: List[Dict] = []
    
    # Social features
    public_profile: bool = True
    leaderboard_participation: bool = True
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None

    class Config:
        allow_population_by_field_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class LearningProgressManager:
    def __init__(self):
        self.db = get_database()
        self.collection = self.db.learning_progress
        
        # Create indexes for better performance
        self.collection.create_index("user_id", unique=True)
        self.collection.create_index("total_points")
        self.collection.create_index([("total_points", -1), ("courses_completed", -1)])
        self.collection.create_index("updated_at")

    async def create_user_profile(self, user_id: str, username: str, email: str) -> UserLearningProfile:
        """Create a new learning profile for a user."""
        profile = UserLearningProfile(
            user_id=user_id,
            username=username,
            email=email
        )
        
        try:
            result = self.collection.insert_one(profile.dict(by_alias=True))
            profile.id = result.inserted_id
            return profile
        except pymongo.errors.DuplicateKeyError:
            # User already exists, return existing profile
            return await self.get_user_profile(user_id)

    async def get_user_profile(self, user_id: str) -> Optional[UserLearningProfile]:
        """Get user's learning profile."""
        doc = self.collection.find_one({"user_id": user_id})
        if doc:
            return UserLearningProfile(**doc)
        return None

    async def update_course_progress(self, user_id: str, course_id: str, progress_data: Dict) -> bool:
        """Update progress for a specific course."""
        user_profile = await self.get_user_profile(user_id)
        if not user_profile:
            return False

        # Find existing course progress or create new one
        course_progress = None
        for i, cp in enumerate(user_profile.course_progress):
            if cp.course_id == course_id:
                course_progress = cp
                course_index = i
                break

        if course_progress is None:
            # Create new course progress
            course_progress = CourseProgress(
                course_id=course_id,
                title=progress_data.get('title', ''),
                provider=progress_data.get('provider', ''),
                progress_percentage=progress_data.get('progress_percentage', 0)
            )
            user_profile.course_progress.append(course_progress)
        else:
            # Update existing progress
            course_progress.progress_percentage = progress_data.get('progress_percentage', course_progress.progress_percentage)
            course_progress.last_accessed = datetime.utcnow()

        # Check if course is completed
        if course_progress.progress_percentage == 100 and not course_progress.completed:
            course_progress.completed = True
            course_progress.completion_date = datetime.utcnow()
            course_progress.certificate_earned = True
            
            # Update user stats
            user_profile.courses_completed += 1
            user_profile.total_points += 300  # 300 points per completed course
            
            # Add to completed courses if not already there
            if course_id not in user_profile.completed_courses:
                user_profile.completed_courses.append(course_id)

        # Update user level based on completed courses
        self._update_user_level(user_profile)
        
        # Update learning streak
        self._update_learning_streak(user_profile)
        
        user_profile.updated_at = datetime.utcnow()

        # Save to database
        result = self.collection.update_one(
            {"user_id": user_id},
            {"$set": user_profile.dict(by_alias=True, exclude={"id"})}
        )
        
        return result.modified_count > 0

    def _update_user_level(self, profile: UserLearningProfile):
        """Update user level based on completed courses."""
        completed = profile.courses_completed
        
        if completed >= 15:
            profile.level = "Expert"
        elif completed >= 8:
            profile.level = "Advanced"
        elif completed >= 3:
            profile.level = "Intermediate"
        else:
            profile.level = "Beginner"

    def _update_learning_streak(self, profile: UserLearningProfile):
        """Update learning streak based on activity."""
        now = datetime.utcnow()
        last_activity = profile.learning_streak.last_activity_date
        
        if last_activity:
            days_diff = (now - last_activity).days
            
            if days_diff == 1:
                # Continue streak
                profile.learning_streak.current_streak += 1
            elif days_diff > 1:
                # Streak broken
                profile.learning_streak.current_streak = 1
            # If days_diff == 0, same day activity, no change to streak
        else:
            # First activity
            profile.learning_streak.current_streak = 1
        
        # Update longest streak
        if profile.learning_streak.current_streak > profile.learning_streak.longest_streak:
            profile.learning_streak.longest_streak = profile.learning_streak.current_streak
        
        profile.learning_streak.last_activity_date = now

    async def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """Get top users for leaderboard."""
        pipeline = [
            {"$match": {"leaderboard_participation": True}},
            {"$sort": {"total_points": -1, "courses_completed": -1}},
            {"$limit": limit},
            {"$project": {
                "username": 1,
                "total_points": 1,
                "courses_completed": 1,
                "level": 1,
                "learning_streak.current_streak": 1,
                "badges_earned": 1
            }}
        ]
        
        return list(self.collection.aggregate(pipeline))

    async def get_user_rank(self, user_id: str) -> Optional[int]:
        """Get user's rank in the leaderboard."""
        user_profile = await self.get_user_profile(user_id)
        if not user_profile:
            return None
        
        # Count users with higher points
        higher_count = self.collection.count_documents({
            "total_points": {"$gt": user_profile.total_points},
            "leaderboard_participation": True
        })
        
        return higher_count + 1

    async def reset_user_progress(self, user_id: str) -> bool:
        """Reset all progress for a user."""
        reset_data = {
            "total_points": 0,
            "courses_completed": 0,
            "total_time_spent": 0,
            "course_progress": [],
            "completed_courses": [],
            "learning_streak.current_streak": 0,
            "badges_earned": [],
            "achievements": [],
            "level": "Beginner",
            "updated_at": datetime.utcnow()
        }
        
        result = self.collection.update_one(
            {"user_id": user_id},
            {"$set": reset_data}
        )
        
        return result.modified_count > 0

    async def award_badge(self, user_id: str, badge_id: str, badge_name: str) -> bool:
        """Award a badge to a user."""
        result = self.collection.update_one(
            {"user_id": user_id},
            {
                "$addToSet": {"badges_earned": badge_id},
                "$push": {
                    "achievements": {
                        "type": "badge",
                        "badge_id": badge_id,
                        "badge_name": badge_name,
                        "earned_at": datetime.utcnow()
                    }
                },
                "$set": {"updated_at": datetime.utcnow()}
            }
        )
        
        return result.modified_count > 0

    async def get_learning_analytics(self, user_id: str) -> Dict:
        """Get comprehensive learning analytics for a user."""
        profile = await self.get_user_profile(user_id)
        if not profile:
            return {}
        
        # Calculate analytics
        total_courses_available = 50  # This would be dynamic based on available courses
        completion_rate = (profile.courses_completed / total_courses_available) * 100 if total_courses_available > 0 else 0
        
        # Weekly progress (mock data - would be calculated from actual activity)
        weekly_progress = [
            {"week": "Week 1", "points": 150, "courses": 1},
            {"week": "Week 2", "points": 300, "courses": 1},
            {"week": "Week 3", "points": 450, "courses": 2},
            {"week": "Week 4", "points": 200, "courses": 1},
        ]
        
        return {
            "total_points": profile.total_points,
            "courses_completed": profile.courses_completed,
            "completion_rate": round(completion_rate, 2),
            "current_streak": profile.learning_streak.current_streak,
            "longest_streak": profile.learning_streak.longest_streak,
            "time_spent": profile.total_time_spent,
            "level": profile.level,
            "badges_count": len(profile.badges_earned),
            "weekly_progress": weekly_progress,
            "next_milestone": self._get_next_milestone(profile)
        }
    
    def _get_next_milestone(self, profile: UserLearningProfile) -> Dict:
        """Calculate next milestone for the user."""
        milestones = [
            {"courses": 1, "title": "First Course Complete", "points": 300},
            {"courses": 3, "title": "Intermediate Learner", "points": 900},
            {"courses": 5, "title": "Dedicated Student", "points": 1500},
            {"courses": 10, "title": "Knowledge Seeker", "points": 3000},
            {"courses": 15, "title": "Expert Learner", "points": 4500},
        ]
        
        for milestone in milestones:
            if profile.courses_completed < milestone["courses"]:
                return {
                    "title": milestone["title"],
                    "target_courses": milestone["courses"],
                    "current_courses": profile.courses_completed,
                    "courses_needed": milestone["courses"] - profile.courses_completed,
                    "target_points": milestone["points"],
                    "current_points": profile.total_points,
                    "points_needed": max(0, milestone["points"] - profile.total_points)
                }
        
        return {"title": "All Milestones Achieved!", "message": "You're a learning champion!"}

# Initialize the learning progress manager
learning_manager = LearningProgressManager()