import React, { useState, useEffect } from "react";
import {
  BookOpen,
  TrendingUp,
  Brain,
  Award,
  Users,
  Trophy,
  Target,
  Clock,
  CheckCircle,
  RotateCcw,
  ExternalLink,
  Star,
  BarChart3,
  Medal,
  Zap
} from "lucide-react";

const courseraCoursesData = {
  Beginner: [
    {
      id: "finance-basics-001",
      title: "Financial Markets",
      provider: "Yale University",
      instructor: "Robert Shiller",
      description: "An overview of the ideas, methods, and institutions that permit human society to manage risks and foster enterprise.",
      duration: "33 hours",
      modules: 7,
      rating: 4.6,
      students: 180000,
      skills: ["Financial Analysis", "Finance", "Investment", "Financial Markets"],
      courseUrl: "https://www.coursera.org/learn/financial-markets-global",
      progress: 0,
      certificate: true,
      level: "Beginner",
      estimatedWeeks: 7
    },
    {
      id: "investing-101-002", 
      title: "Introduction to Portfolio Construction and Analysis",
      provider: "Rice University",
      instructor: "James Weston",
      description: "Learn the basics of portfolio theory and how to construct and analyze investment portfolios.",
      duration: "16 hours",
      modules: 4,
      rating: 4.4,
      students: 45000,
      skills: ["Portfolio Management", "Investment Analysis", "Risk Management"],
      courseUrl: "https://www.coursera.org/learn/portfolio-construction",
      progress: 0,
      certificate: true,
      level: "Beginner",
      estimatedWeeks: 4
    },
    {
      id: "personal-finance-003",
      title: "Personal Finance", 
      provider: "Duke University",
      instructor: "Emma Rasiel",
      description: "Master the fundamentals of personal finance including budgeting, saving, and investing.",
      duration: "18 hours",
      modules: 6,
      rating: 4.7,
      students: 95000,
      skills: ["Personal Finance", "Budgeting", "Saving", "Investment Planning"],
      courseUrl: "https://www.coursera.org/learn/personal-finance",
      progress: 0,
      certificate: true,
      level: "Beginner",
      estimatedWeeks: 6
    }
  ],
  Intermediate: [
    {
      id: "trading-algorithms-004",
      title: "Trading Algorithms",
      provider: "Indian School of Business",
      instructor: "Gaurav Vohra",
      description: "Learn how to develop and implement algorithmic trading strategies.",
      duration: "25 hours",
      modules: 6,
      rating: 4.3,
      students: 32000,
      skills: ["Algorithmic Trading", "Python", "Financial Analysis", "Quantitative Finance"],
      courseUrl: "https://www.coursera.org/learn/trading-algorithms",
      progress: 0,
      certificate: true,
      level: "Intermediate",
      estimatedWeeks: 6
    },
    {
      id: "valuation-005",
      title: "Introduction to Corporate Finance",
      provider: "University of Pennsylvania", 
      instructor: "Michael Roberts",
      description: "Learn corporate finance fundamentals including valuation, capital structure, and financial planning.",
      duration: "28 hours",
      modules: 8,
      rating: 4.5,
      students: 67000,
      skills: ["Corporate Finance", "Valuation", "Capital Structure", "Financial Planning"],
      courseUrl: "https://www.coursera.org/learn/wharton-finance",
      progress: 0,
      certificate: true,
      level: "Intermediate",
      estimatedWeeks: 7
    },
    {
      id: "behavioral-finance-006",
      title: "Behavioral Finance",
      provider: "Duke University",
      instructor: "Emma Rasiel",
      description: "Understand how psychological factors influence financial decision-making.",
      duration: "22 hours",
      modules: 5,
      rating: 4.6,
      students: 28000,
      skills: ["Behavioral Economics", "Investment Psychology", "Decision Making"],
      courseUrl: "https://www.coursera.org/learn/behavioral-finance",
      progress: 0,
      certificate: true,
      level: "Intermediate",
      estimatedWeeks: 5
    }
  ],
  Advanced: [
    {
      id: "portfolio-optimization-007",
      title: "Portfolio and Risk Management",
      provider: "Rice University",
      instructor: "James Weston",
      description: "Advanced portfolio optimization techniques and risk management strategies.",
      duration: "35 hours",
      modules: 10,
      rating: 4.4,
      students: 15000,
      skills: ["Portfolio Optimization", "Risk Management", "Derivatives", "Hedge Strategies"],
      courseUrl: "https://www.coursera.org/learn/portfolio-risk-management",
      progress: 0,
      certificate: true,
      level: "Advanced",
      estimatedWeeks: 8
    },
    {
      id: "derivatives-008",
      title: "Financial Engineering and Risk Management",
      provider: "Columbia University",
      instructor: "Martin Haugh",
      description: "Master advanced derivatives and financial engineering techniques.",
      duration: "42 hours",
      modules: 12,
      rating: 4.5,
      students: 12000,
      skills: ["Derivatives", "Financial Engineering", "Risk Management", "Quantitative Methods"],
      courseUrl: "https://www.coursera.org/learn/financial-engineering-1",
      progress: 0,
      certificate: true,
      level: "Advanced",
      estimatedWeeks: 10
    }
  ],
  Expert: [
    {
      id: "machine-learning-finance-009",
      title: "Machine Learning for Trading",
      provider: "New York Institute of Finance", 
      instructor: "Michael Halls-Moore",
      description: "Apply machine learning techniques to financial markets and algorithmic trading.",
      duration: "48 hours",
      modules: 15,
      rating: 4.7,
      students: 8500,
      skills: ["Machine Learning", "Algorithmic Trading", "Python", "Data Science"],
      courseUrl: "https://www.coursera.org/learn/machine-learning-trading",
      progress: 0,
      certificate: true,
      level: "Expert",
      estimatedWeeks: 12
    },
    {
      id: "cryptocurrency-010",
      title: "Cryptocurrency and Blockchain",
      provider: "University of Pennsylvania",
      instructor: "Jessica Wachter",
      description: "Deep dive into cryptocurrency markets, blockchain technology, and DeFi protocols.",
      duration: "38 hours",
      modules: 11,
      rating: 4.6,
      students: 6200,
      skills: ["Blockchain", "Cryptocurrency", "DeFi", "Smart Contracts"],
      courseUrl: "https://www.coursera.org/learn/cryptocurrency",
      progress: 0,
      certificate: true,
      level: "Expert",
      estimatedWeeks: 9
    }
  ]
};

// Mock leaderboard data - this would come from your MongoDB
const mockLeaderboard = [
  { id: 1, name: "Alex Chen", avatar: "AC", totalPoints: 2480, coursesCompleted: 8, level: "Expert", streak: 15 },
  { id: 2, name: "Priya Sharma", avatar: "PS", totalPoints: 2350, coursesCompleted: 7, level: "Advanced", streak: 12 },
  { id: 3, name: "Ravi Kumar", avatar: "RK", totalPoints: 2120, coursesCompleted: 6, level: "Advanced", streak: 8 },
  { id: 4, name: "Sarah Johnson", avatar: "SJ", totalPoints: 1890, coursesCompleted: 5, level: "Intermediate", streak: 5 },
  { id: 5, name: "Mike Wilson", avatar: "MW", totalPoints: 1650, coursesCompleted: 4, level: "Intermediate", streak: 3 }
];

// Mock user progress - this would come from your MongoDB
const mockUserProgress = {
  userId: "current-user",
  name: "You", 
  totalPoints: 1420,
  coursesCompleted: 3,
  level: "Intermediate",
  streak: 7,
  rank: 6,
  completedCourses: ["finance-basics-001", "investing-101-002", "personal-finance-003"],
  courseProgress: {
    "finance-basics-001": 100,
    "investing-101-002": 100, 
    "personal-finance-003": 100,
    "trading-algorithms-004": 45,
    "valuation-005": 20
  } as Record<string, number>
};

const levelConfig = [
  { level: "Beginner", icon: BookOpen, color: "bg-green-500", bgColor: "bg-green-50 dark:bg-green-950/20", textColor: "text-green-600 dark:text-green-400" },
  { level: "Intermediate", icon: TrendingUp, color: "bg-blue-500", bgColor: "bg-blue-50 dark:bg-blue-950/20", textColor: "text-blue-600 dark:text-blue-400" },
  { level: "Advanced", icon: Brain, color: "bg-purple-500", bgColor: "bg-purple-50 dark:bg-purple-950/20", textColor: "text-purple-600 dark:text-purple-400" },
  { level: "Expert", icon: Award, color: "bg-orange-500", bgColor: "bg-orange-50 dark:bg-orange-950/20", textColor: "text-orange-600 dark:text-orange-400" }
];

const Learn = () => {
  const [selectedLevel, setSelectedLevel] = useState("Beginner");
  const [activeTab, setActiveTab] = useState<'courses' | 'leaderboard' | 'progress'>('courses');
  const [userProgress, setUserProgress] = useState(mockUserProgress);
  const [courses] = useState(courseraCoursesData);
  const [leaderboard] = useState(mockLeaderboard);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Load progress from localStorage or API
  useEffect(() => {
    const savedProgress = localStorage.getItem('finedge-learning-progress');
    if (savedProgress) {
      const parsed = JSON.parse(savedProgress);
      setUserProgress(parsed);
    }
  }, []);

  // Save progress to localStorage (in real app, this would be API call)
  const saveProgress = (newProgress: typeof userProgress) => {
    setUserProgress(newProgress);
    localStorage.setItem('finedge-learning-progress', JSON.stringify(newProgress));
  };

  const resetProgress = () => {
    const resetData = {
      ...mockUserProgress,
      totalPoints: 0,
      coursesCompleted: 0,
      completedCourses: [] as string[],
      courseProgress: {} as Record<string, number>,
      streak: 0
    };
    saveProgress(resetData);
    setShowResetConfirm(false);
  };

  const getCurrentLevelCourses = () => {
    return courses[selectedLevel as keyof typeof courses] || [];
  };

  const getProgressPercentage = (courseId: string) => {
    return userProgress.courseProgress[courseId] || 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-800 bg-clip-text text-transparent">
              Learning Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Master finance with world-class Coursera courses</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Progress Summary */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Progress</p>
                  <p className="font-bold text-gray-900 dark:text-white">{userProgress.totalPoints} points</p>
                </div>
              </div>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-1 border border-gray-200/50 dark:border-gray-700/50">
              {[
                { key: 'courses', label: 'Courses', icon: BookOpen },
                { key: 'leaderboard', label: 'Leaderboard', icon: Users },
                { key: 'progress', label: 'My Progress', icon: BarChart3 }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                    activeTab === key
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'courses' && (
          <>
            {/* Level Selection */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {levelConfig.map(({ level, icon: Icon, color, bgColor, textColor }) => (
                <button
                  key={level}
                  onClick={() => setSelectedLevel(level)}
                  className={`p-6 rounded-3xl border transition-all duration-300 ${
                    selectedLevel === level
                      ? 'border-indigo-300 dark:border-indigo-600 shadow-xl shadow-indigo-500/20 transform -translate-y-1'
                      : 'border-gray-200/50 dark:border-gray-700/50 bg-white/70 dark:bg-gray-800/50 hover:border-indigo-200 dark:hover:border-indigo-700'
                  } ${selectedLevel === level ? bgColor : ''}`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-2xl ${color} flex items-center justify-center mb-4 ${selectedLevel === level ? 'scale-110' : ''} transition-transform`}>
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                    <h3 className={`font-bold text-lg mb-2 ${selectedLevel === level ? textColor : 'text-gray-900 dark:text-white'}`}>
                      {level}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getCurrentLevelCourses().length} courses
                    </p>
                  </div>
                </button>
              ))}
            </div>

            {/* Coursera Courses Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {getCurrentLevelCourses().map((course) => {
                const progress = getProgressPercentage(course.id);
                const isCompleted = progress === 100;
                
                return (
                  <div
                    key={course.id}
                    className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20"
                  >
                    {/* Course Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                            {course.provider}
                          </span>
                          {isCompleted && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                    </div>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {course.rating}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {course.duration}
                        </span>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {course.skills.slice(0, 3).map((skill, index) => (
                        <span
                          key={index}
                          className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                      {course.skills.length > 3 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          +{course.skills.length - 3} more
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Progress
                        </span>
                        <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {course.modules} modules • {course.estimatedWeeks} weeks
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={course.courseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
                        >
                          {progress > 0 ? 'Continue' : 'Start Course'}
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === 'leaderboard' && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Leaderboard</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">See how you rank against other learners</p>
            </div>
            
            <div className="p-6">
              {/* Current User Position */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 rounded-2xl p-4 mb-6 border border-indigo-200/50 dark:border-indigo-700/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                      #{userProgress.rank}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">{userProgress.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {userProgress.totalPoints} points • {userProgress.coursesCompleted} courses completed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-orange-600 dark:text-orange-400">
                      {userProgress.streak} day streak
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Learners */}
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-500' : 'bg-gray-500'
                      }`}>
                        {index < 3 ? <Medal className="w-5 h-5" /> : index + 1}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{user.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {user.coursesCompleted} courses • {user.level}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white">{user.totalPoints}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">points</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-6">
            {/* Progress Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Completed</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{userProgress.coursesCompleted}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Courses finished</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Points</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{userProgress.totalPoints}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total earned</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Streak</h3>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{userProgress.streak}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Days learning</p>
              </div>

              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Rank</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">#{userProgress.rank}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Global position</p>
              </div>
            </div>

            {/* Reset Progress Button */}
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">Reset Progress</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Clear all your learning progress and start fresh. This action cannot be undone.
                  </p>
                </div>
                <button
                  onClick={() => setShowResetConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-xl transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              
              {showResetConfirm && (
                <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-red-700 dark:text-red-300 mb-3">
                    Are you sure you want to reset all your progress? This will clear all completed courses and points.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={resetProgress}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Yes, Reset
                    </button>
                    <button
                      onClick={() => setShowResetConfirm(false)}
                      className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Learn;
