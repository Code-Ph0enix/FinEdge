/**
 * FinEdge Goals Tab - MongoDB Connected
 * 
 * Manages financial goals with real-time MongoDB synchronization.
 * Users can set, track, and manage their financial objectives.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Target, DollarSign, Home, Briefcase, GraduationCap, Car, Plus, Trash2, X, Edit2, LucideIcon, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SERVER_URL } from '../../../utils/utils';

interface Goal {
  id: string;
  name: string;
  icon: string;
  target: string;
  current: string;
}

type IconType = keyof typeof availableIcons;

const availableIcons = {
  Briefcase,
  Home,
  GraduationCap,
  Car,
  Target
} as const;

// Currency formatter
const formatToINR = (amount: string | number) => {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[₹,]/g, '')) : amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(numericAmount);
};

export const GoalsTab = () => {
  const { user } = useUser();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Target' as IconType,
    target: '',
    current: ''
  });

  // Fetch goals from MongoDB on component mount
  useEffect(() => {
    const fetchGoals = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${SERVER_URL}/api/user-profile/goals?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setGoals(data.goals || []);
        } else {
          console.error('Failed to fetch goals data');
        }
      } catch (error) {
        console.error('Error fetching goals:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
  }, [user]);

  const handleAddGoal = async () => {
    if (!user?.id) return;

    const newGoal: Goal = {
      id: `goal_${Date.now()}`,
      name: formData.name,
      icon: formData.icon,
      target: formData.target,
      current: formData.current
    };

    try {
      const response = await fetch(`${SERVER_URL}/api/user-profile/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          ...newGoal
        }),
      });

      if (response.ok) {
        setGoals([...goals, newGoal]);
        resetForm();
        setIsModalOpen(false);
      } else {
        console.error('Failed to add goal');
      }
    } catch (error) {
      console.error('Error adding goal:', error);
    }
  };

  const handleUpdateGoal = async () => {
    if (!selectedGoal || !user?.id) return;

    const updatedGoal: Goal = {
      id: selectedGoal,
      name: formData.name,
      icon: formData.icon,
      target: formData.target,
      current: formData.current
    };

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/goals/${selectedGoal}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkUserId: user.id,
            ...updatedGoal
          }),
        }
      );

      if (response.ok) {
        setGoals(goals.map(goal => 
          goal.id === selectedGoal ? updatedGoal : goal
        ));
        resetForm();
        setIsModalOpen(false);
        setIsEditMode(false);
      } else {
        console.error('Failed to update goal');
      }
    } catch (error) {
      console.error('Error updating goal:', error);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this goal?')) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/goals/${id}?clerkUserId=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setGoals(goals.filter(goal => goal.id !== id));
        if (selectedGoal === id) {
          setSelectedGoal(null);
        }
      } else {
        console.error('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const openEditModal = (goal: Goal) => {
    setFormData({
      name: goal.name,
      icon: goal.icon as IconType,
      target: goal.target,
      current: goal.current
    });
    setSelectedGoal(goal.id);
    setIsEditMode(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      icon: 'Target' as IconType,
      target: '',
      current: ''
    });
    setSelectedGoal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditMode) {
      handleUpdateGoal();
    } else {
      handleAddGoal();
    }
  };

  const calculateProgress = (current: string, target: string) => {
    const currentNum = parseFloat(current.replace(/[₹,]/g, ''));
    const targetNum = parseFloat(target.replace(/[₹,]/g, ''));
    return targetNum > 0 ? Math.min((currentNum / targetNum) * 100, 100) : 0;
  };

  const getIconComponent = (iconName: string): LucideIcon => {
    return availableIcons[iconName as IconType] || Target;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const selectedGoalData = goals.find(g => g.id === selectedGoal);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Financial Goals</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your progress towards your financial objectives
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Target className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No goals set yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Start setting financial goals to track your progress
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((goal) => {
            const IconComponent = getIconComponent(goal.icon);
            const progress = calculateProgress(goal.current, goal.target);
            
            return (
              <motion.div
                key={goal.id}
                whileHover={{ scale: 1.02 }}
                className={`relative p-6 rounded-xl cursor-pointer transition-all duration-200 ${
                  selectedGoal === goal.id
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl'
                    : 'bg-white dark:bg-gray-800 hover:shadow-lg'
                }`}
                onClick={() => setSelectedGoal(goal.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${
                    selectedGoal === goal.id ? 'bg-white/20' : 'bg-indigo-100 dark:bg-indigo-900/30'
                  }`}>
                    <IconComponent className={`w-6 h-6 ${
                      selectedGoal === goal.id ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'
                    }`} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(goal);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedGoal === goal.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteGoal(goal.id);
                      }}
                      className={`p-2 rounded-lg transition-colors ${
                        selectedGoal === goal.id
                          ? 'hover:bg-white/20 text-white'
                          : 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className={`text-lg font-semibold mb-2 ${
                  selectedGoal === goal.id ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  {goal.name}
                </h3>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className={selectedGoal === goal.id ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}>
                      Current
                    </span>
                    <span className="font-semibold">
                      {formatToINR(goal.current)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className={selectedGoal === goal.id ? 'text-white/80' : 'text-gray-600 dark:text-gray-400'}>
                      Target
                    </span>
                    <span className="font-semibold">
                      {formatToINR(goal.target)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <div className={`w-full h-2 rounded-full ${
                    selectedGoal === goal.id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-700'
                  }`}>
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedGoal === goal.id ? 'bg-white' : 'bg-gradient-to-r from-indigo-500 to-purple-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm font-semibold ${
                      selectedGoal === goal.id ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>
                      {progress.toFixed(1)}%
                    </span>
                    <span className={`text-xs ${
                      selectedGoal === goal.id ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {formatToINR(parseFloat(goal.target) - parseFloat(goal.current.replace(/[₹,]/g, '')))} remaining
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {isEditMode ? 'Edit Goal' : 'Add New Goal'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Goal Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="e.g., Buy a House"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icon *
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {Object.keys(availableIcons).map((iconName) => {
                      const IconComponent = availableIcons[iconName as IconType];
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: iconName as IconType })}
                          className={`p-3 rounded-lg transition-all ${
                            formData.icon === iconName
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                        >
                          <IconComponent className="w-5 h-5 mx-auto" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.target}
                    onChange={(e) => setFormData({ ...formData, target: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="5000000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Current Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={formData.current}
                    onChange={(e) => setFormData({ ...formData, current: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    placeholder="1000000"
                    min="0"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
                  >
                    {isEditMode ? 'Update' : 'Add'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// End of frontend/src/pages/MyData/tabs/GoalsTab.tsx
