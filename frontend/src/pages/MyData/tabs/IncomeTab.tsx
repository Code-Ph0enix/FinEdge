/**
 * FinEdge Income Tab - MongoDB Connected
 * 
 * Manages income entries with real-time MongoDB synchronization.
 * Users can add, edit, and delete income sources.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { IndianRupeeIcon, Plus, Trash2, Edit2, X, Briefcase, Gift, Landmark, TrendingUp } from 'lucide-react';
import { SERVER_URL } from '../../../utils/utils';

interface Income {
  id: string;
  source: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'one-time';
  category: 'salary' | 'investment' | 'gift' | 'other';
  date: string;
}

const categoryIcons = {
  salary: Briefcase,
  investment: TrendingUp,
  gift: Gift,
  other: Landmark
};

export const IncomeTab = () => {
  const { user } = useUser();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedIncome, setSelectedIncome] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly',
    category: 'salary',
    date: new Date().toISOString().split('T')[0]
  });

  // Fetch incomes from MongoDB on component mount
  useEffect(() => {
    const fetchIncomes = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${SERVER_URL}/api/user-profile/income?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          setIncomes(data.income || []);
        } else {
          console.error('Failed to fetch income data');
        }
      } catch (error) {
        console.error('Error fetching income:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchIncomes();
  }, [user]);

  const handleAdd = async () => {
    if (!user?.id) return;

    const newIncome: Income = {
      id: `income_${Date.now()}`,
      source: formData.source,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency as 'monthly' | 'yearly' | 'one-time',
      category: formData.category as 'salary' | 'investment' | 'gift' | 'other',
      date: formData.date
    };

    try {
      const response = await fetch(`${SERVER_URL}/api/user-profile/income`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          ...newIncome
        }),
      });

      if (response.ok) {
        setIncomes([...incomes, newIncome]);
        setIsModalOpen(false);
        resetForm();
      } else {
        console.error('Failed to add income');
      }
    } catch (error) {
      console.error('Error adding income:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedIncome || !user?.id) return;

    const updatedIncome: Income = {
      id: selectedIncome,
      source: formData.source,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency as 'monthly' | 'yearly' | 'one-time',
      category: formData.category as 'salary' | 'investment' | 'gift' | 'other',
      date: formData.date
    };

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/income/${selectedIncome}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clerkUserId: user.id,
            ...updatedIncome
          }),
        }
      );

      if (response.ok) {
        setIncomes(incomes.map(inc => 
          inc.id === selectedIncome ? updatedIncome : inc
        ));
        setIsModalOpen(false);
        setIsEditing(false);
        resetForm();
      } else {
        console.error('Failed to update income');
      }
    } catch (error) {
      console.error('Error updating income:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id || !confirm('Are you sure you want to delete this income source?')) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/income/${id}?clerkUserId=${user.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setIncomes(incomes.filter(inc => inc.id !== id));
      } else {
        console.error('Failed to delete income');
      }
    } catch (error) {
      console.error('Error deleting income:', error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (income: Income) => {
    setFormData({
      source: income.source,
      amount: income.amount.toString(),
      frequency: income.frequency,
      category: income.category,
      date: income.date
    });
    setSelectedIncome(income.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      source: '',
      amount: '',
      frequency: 'monthly',
      category: 'salary',
      date: new Date().toISOString().split('T')[0]
    });
    setSelectedIncome(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      handleEdit();
    } else {
      handleAdd();
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Income Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Income Sources</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track all your income sources and earnings
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Income
        </button>
      </div>

      {/* Income List */}
      {incomes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <IndianRupeeIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No income sources added yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Click "Add Income" to get started
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {incomes.map((income) => {
            const Icon = categoryIcons[income.category];
            return (
              <div
                key={income.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <Icon className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {income.source}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{income.category}</span>
                        <span>•</span>
                        <span className="capitalize">{income.frequency}</span>
                        <span>•</span>
                        <span>{new Date(income.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-3">
                        ₹{income.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(income)}
                      className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(income.id)}
                      className="p-2 text-gray-600 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total Income Summary */}
      {incomes.length > 0 && (
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Monthly Income (estimated)</p>
              <p className="text-3xl font-bold mt-1">
                ₹{incomes.reduce((sum, inc) => {
                  if (inc.frequency === 'monthly') return sum + inc.amount;
                  if (inc.frequency === 'yearly') return sum + (inc.amount / 12);
                  return sum;
                }, 0).toLocaleString('en-IN')}
              </p>
            </div>
            <IndianRupeeIcon className="w-12 h-12 text-white/30" />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Income' : 'Add Income'}
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
                  Income Source *
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Salary from TCS"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="salary">Salary</option>
                  <option value="investment">Investment</option>
                  <option value="gift">Gift</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
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
                  {isEditing ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// End of frontend/src/pages/MyData/tabs/IncomeTab.tsx
