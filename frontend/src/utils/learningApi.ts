// Learning API utility functions for FinEdge
const API_BASE_URL = 'https://finedge-backend.onrender.com';

export interface CourseProgress {
  course_id: string;
  title: string;
  provider: string;
  progress_percentage: number;
  completed: boolean;
  completion_date?: string;
  time_spent: number;
  last_accessed: string;
  certificate_earned: boolean;
}

export interface UserLearningProfile {
  user_id: string;
  username: string;
  email: string;
  total_points: number;
  level: string;
  courses_completed: number;
  total_time_spent: number;
  course_progress: CourseProgress[];
  completed_courses: string[];
  learning_streak: {
    current_streak: number;
    longest_streak: number;
    last_activity_date?: string;
  };
  badges_earned: string[];
  achievements: any[];
  rank?: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  username: string;
  total_points: number;
  courses_completed: number;
  level: string;
  learning_streak: {
    current_streak: number;
  };
  badges_earned: string[];
}

class LearningAPI {
  private async fetchAPI(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  async getUserProfile(userId: string): Promise<UserLearningProfile> {
    const response = await this.fetchAPI(`/profile/${userId}`);
    return response.data;
  }

  async createUserProfile(userData: {
    user_id: string;
    username: string;
    email: string;
  }): Promise<UserLearningProfile> {
    const response = await this.fetchAPI('/profile', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  }

  async updateCourseProgress(progressData: {
    user_id: string;
    course_id: string;
    progress_percentage: number;
    title?: string;
    provider?: string;
    time_spent?: number;
  }): Promise<UserLearningProfile> {
    const response = await this.fetchAPI('/progress', {
      method: 'PUT',
      body: JSON.stringify(progressData),
    });
    return response.data;
  }

  async getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const response = await this.fetchAPI(`/leaderboard?limit=${limit}`);
    return response.data;
  }

  async getUserRank(userId: string): Promise<number> {
    const response = await this.fetchAPI(`/rank/${userId}`);
    return response.data.rank;
  }

  async resetProgress(userId: string): Promise<void> {
    await this.fetchAPI(`/reset/${userId}`, {
      method: 'POST',
    });
  }

  async awardBadge(badgeData: {
    user_id: string;
    badge_id: string;
    badge_name: string;
  }): Promise<void> {
    await this.fetchAPI('/badge', {
      method: 'POST',
      body: JSON.stringify(badgeData),
    });
  }

  async getLearningAnalytics(userId: string): Promise<any> {
    const response = await this.fetchAPI(`/analytics/${userId}`);
    return response.data;
  }

  async getCoursesProgress(userId: string): Promise<{
    courses_progress: Record<string, any>;
    completed_courses: string[];
    total_courses_completed: number;
  }> {
    const response = await this.fetchAPI(`/courses/progress/${userId}`);
    return response.data;
  }

  async getGlobalStats(): Promise<{
    total_users: number;
    total_courses_completed: number;
    total_certificates_earned: number;
    average_completion_rate: number;
    most_popular_course: string;
    top_learning_streak: number;
    total_learning_time: number;
    active_learners_this_week: number;
  }> {
    const response = await this.fetchAPI('/stats/global');
    return response.data;
  }
}

// Create a singleton instance
export const learningAPI = new LearningAPI();

// Helper functions for local storage
export const LearningStorage = {
  KEYS: {
    USER_PROGRESS: 'finedge-learning-progress',
    COURSE_CACHE: 'finedge-course-cache',
    LAST_SYNC: 'finedge-last-sync',
  },

  saveUserProgress(progress: UserLearningProfile): void {
    localStorage.setItem(this.KEYS.USER_PROGRESS, JSON.stringify(progress));
    localStorage.setItem(this.KEYS.LAST_SYNC, new Date().toISOString());
  },

  getUserProgress(): UserLearningProfile | null {
    const data = localStorage.getItem(this.KEYS.USER_PROGRESS);
    return data ? JSON.parse(data) : null;
  },

  saveCourseProgress(courseId: string, progress: number): void {
    const existing = this.getCourseProgress();
    existing[courseId] = progress;
    localStorage.setItem(this.KEYS.COURSE_CACHE, JSON.stringify(existing));
  },

  getCourseProgress(): Record<string, number> {
    const data = localStorage.getItem(this.KEYS.COURSE_CACHE);
    return data ? JSON.parse(data) : {};
  },

  getLastSyncTime(): Date | null {
    const timestamp = localStorage.getItem(this.KEYS.LAST_SYNC);
    return timestamp ? new Date(timestamp) : null;
  },

  clearAll(): void {
    Object.values(this.KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },

  // Check if data needs syncing (older than 5 minutes)
  needsSync(): boolean {
    const lastSync = this.getLastSyncTime();
    if (!lastSync) return true;
    
    const now = new Date();
    const diffMinutes = (now.getTime() - lastSync.getTime()) / (1000 * 60);
    return diffMinutes > 5;
  }
};

// Custom hooks for React components (import React and useState where used)
import { useState } from 'react';

export const useLearningProgress = () => {
  const [userProgress, setUserProgress] = useState<UserLearningProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUserProgress = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to load from cache first
      const cachedProgress = LearningStorage.getUserProgress();
      if (cachedProgress && !LearningStorage.needsSync()) {
        setUserProgress(cachedProgress);
        setLoading(false);
        return cachedProgress;
      }

      // Fetch from API
      const progress = await learningAPI.getUserProfile(userId);
      setUserProgress(progress);
      
      // Cache the result
      LearningStorage.saveUserProgress(progress);
      
      return progress;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load progress';
      setError(errorMessage);
      
      // Fallback to cached data if available
      const cachedProgress = LearningStorage.getUserProgress();
      if (cachedProgress) {
        setUserProgress(cachedProgress);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (userId: string, courseId: string, progress: number) => {
    try {
      // Optimistically update local state
      if (userProgress) {
        const updatedProgress = { ...userProgress };
        // Update course progress logic here
        setUserProgress(updatedProgress);
        LearningStorage.saveCourseProgress(courseId, progress);
      }

      // Sync with API
      const updated = await learningAPI.updateCourseProgress({
        user_id: userId,
        course_id: courseId,
        progress_percentage: progress,
      });

      setUserProgress(updated);
      LearningStorage.saveUserProgress(updated);
      
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update progress');
      throw err;
    }
  };

  const resetProgress = async (userId: string) => {
    try {
      await learningAPI.resetProgress(userId);
      
      // Clear local cache
      LearningStorage.clearAll();
      
      // Reload fresh data
      await loadUserProgress(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset progress');
      throw err;
    }
  };

  return {
    userProgress,
    loading,
    error,
    loadUserProgress,
    updateProgress,
    resetProgress,
    clearError: () => setError(null),
  };
};

// Badge and Achievement constants
export const BADGES = {
  FIRST_COURSE: { id: 'first_course', name: 'First Steps', description: 'Complete your first course' },
  STREAK_7: { id: 'streak_7', name: '7-Day Streak', description: 'Learn for 7 consecutive days' },
  STREAK_30: { id: 'streak_30', name: 'Monthly Dedication', description: 'Learn for 30 consecutive days' },
  LEVEL_INTERMEDIATE: { id: 'level_intermediate', name: 'Intermediate Learner', description: 'Reach Intermediate level' },
  LEVEL_ADVANCED: { id: 'level_advanced', name: 'Advanced Scholar', description: 'Reach Advanced level' },
  LEVEL_EXPERT: { id: 'level_expert', name: 'Expert Master', description: 'Reach Expert level' },
  CERTIFICATE_COLLECTOR: { id: 'cert_collector', name: 'Certificate Collector', description: 'Earn 5 certificates' },
  SPEED_LEARNER: { id: 'speed_learner', name: 'Speed Learner', description: 'Complete 3 courses in one week' },
  NIGHT_OWL: { id: 'night_owl', name: 'Night Owl', description: 'Complete courses between 10 PM - 2 AM' },
  EARLY_BIRD: { id: 'early_bird', name: 'Early Bird', description: 'Complete courses between 5 AM - 8 AM' },
};

export const ACHIEVEMENT_THRESHOLDS = {
  POINTS: [100, 500, 1000, 2500, 5000, 10000],
  COURSES: [1, 3, 5, 10, 15, 25],
  STREAK: [3, 7, 15, 30, 60, 100],
  TIME_SPENT: [60, 300, 600, 1200, 2400, 4800], // minutes
};

export default learningAPI;