/**
 * FinEdge Expenses Tab - MongoDB Connected
 * 
 * Manages expense entries with real-time MongoDB synchronization.
 * Users can track spending across multiple categories.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { DollarSign, Plus, Trash2, Edit2, X, ShoppingCart, Home, Car, Utensils, Heart, Plane, Smartphone, Zap } from 'lucide-react';
import { SERVER_URL } from '../../../utils/utils';

interface Expense {
  id: string;
  name: string;
  amount: number;
  category: 'shopping' | 'housing' | 'transport' | 'food' | 'health' | 'travel' | 'utilities' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  date: string;
  isEssential: boolean;
}

const normalizeExpense = (doc: any): Expense => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  amount:
    typeof doc?.amount === 'number'
      ? doc.amount
      : Number.parseFloat(doc?.amount ?? '0') || 0,
  category: (doc?.category ?? 'other') as Expense['category'],
  frequency: (doc?.frequency ?? 'monthly') as Expense['frequency'],
  date: doc?.date ?? new Date().toISOString().split('T')[0],
  isEssential: Boolean(doc?.isEssential),
});

const categoryIcons = {
  shopping: ShoppingCart,
  housing: Home,
  transport: Car,
  food: Utensils,
  health: Heart,
  travel: Plane,
  utilities: Zap,
  other: Smartphone
};

const categoryColors = {
  shopping: 'blue',
  housing: 'green',
  transport: 'orange',
  food: 'yellow',
  health: 'red',
  travel: 'purple',
  utilities: 'indigo',
  other: 'gray'
};

export const ExpensesTab = () => {
  const { user } = useUser();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'shopping',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    isEssential: false
  });

  // Fetch expenses from MongoDB on component mount
  useEffect(() => {
    const fetchExpenses = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${SERVER_URL}/api/user-profile/expenses?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const normalized = (data.expenses || [])
            .map(normalizeExpense)
            .filter((expense: Expense) => Boolean(expense.id));
          setExpenses(normalized);
        } else {
          console.error('Failed to fetch expenses data');
        }
      } catch (error) {
        console.error('Error fetching expenses:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExpenses();
  }, [user]);

  const handleAdd = async () => {
    if (!user?.id) return;

    try {
      const amountValue = Number.parseFloat(formData.amount);
      const amount = Number.isNaN(amountValue) ? 0 : amountValue;

      const response = await fetch(`${SERVER_URL}/api/user-profile/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: formData.name,
          amount,
          category: formData.category,
          frequency: formData.frequency,
          date: formData.date,
          isEssential: formData.isEssential,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.expense) {
          setExpenses((prev) => [...prev, normalizeExpense(result.expense)]);
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        console.error('Failed to add expense');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedExpense || !user?.id) return;

    try {
      const amountValue = Number.parseFloat(formData.amount);
      const amount = Number.isNaN(amountValue) ? 0 : amountValue;

      const response = await fetch(`${SERVER_URL}/api/user-profile/expenses`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          _id: selectedExpense,
          name: formData.name,
          amount,
          category: formData.category,
          frequency: formData.frequency,
          date: formData.date,
          isEssential: formData.isEssential,
        }),
      });

      if (response.ok) {
        setExpenses((prev) =>
          prev.map((expense) =>
            expense.id === selectedExpense
              ? {
                  ...expense,
                  name: formData.name,
                  amount,
                  category: formData.category as Expense['category'],
                  frequency: formData.frequency as Expense['frequency'],
                  date: formData.date,
                  isEssential: formData.isEssential,
                }
              : expense
          )
        );
        setIsModalOpen(false);
        setIsEditing(false);
        resetForm();
      } else {
        console.error('Failed to update expense');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id || !id || !confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/expenses?clerkUserId=${user.id}&entryId=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setExpenses((prev) => prev.filter((expense) => expense.id !== id));
      } else {
        console.error('Failed to delete expense');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (expense: Expense) => {
    setFormData({
      name: expense.name,
      amount: expense.amount.toString(),
      category: expense.category,
      frequency: expense.frequency,
      date: expense.date,
      isEssential: expense.isEssential
    });
    setSelectedExpense(expense.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'shopping',
      frequency: 'monthly',
      date: new Date().toISOString().split('T')[0],
      isEssential: false
    });
    setSelectedExpense(null);
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
      {/* Add Expense Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your spending and manage your budget
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      {/* Expense List */}
      {expenses.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No expenses tracked yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Start tracking your spending to better manage your budget
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => {
            const Icon = categoryIcons[expense.category];
            const color = categoryColors[expense.category];
            return (
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {expense.name}
                        </h3>
                        {expense.isEssential && (
                          <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs font-medium rounded-full">
                            Essential
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{expense.category}</span>
                        <span>•</span>
                        <span className="capitalize">{expense.frequency}</span>
                        <span>•</span>
                        <span>{new Date(expense.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-3">
                        ₹{expense.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(expense)}
                      className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(expense.id)}
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

      {/* Total Expenses Summary */}
      {expenses.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Monthly Expenses (estimated)</p>
              <p className="text-3xl font-bold mt-1">
                ₹{expenses.reduce((sum, exp) => {
                  if (exp.frequency === 'monthly') return sum + exp.amount;
                  if (exp.frequency === 'yearly') return sum + (exp.amount / 12);
                  if (exp.frequency === 'weekly') return sum + (exp.amount * 4);
                  if (exp.frequency === 'daily') return sum + (exp.amount * 30);
                  return sum;
                }, 0).toLocaleString('en-IN')}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-white/30" />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditing ? 'Edit Expense' : 'Add Expense'}
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
                  Expense Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Monthly Rent"
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
                  placeholder="15000"
                  min="0"
                  step="0.01"
                  required
                />
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
                  <option value="shopping">Shopping</option>
                  <option value="housing">Housing</option>
                  <option value="transport">Transport</option>
                  <option value="food">Food</option>
                  <option value="health">Health</option>
                  <option value="travel">Travel</option>
                  <option value="utilities">Utilities</option>
                  <option value="other">Other</option>
                </select>
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
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
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

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isEssential"
                  checked={formData.isEssential}
                  onChange={(e) => setFormData({ ...formData, isEssential: e.target.checked })}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                <label htmlFor="isEssential" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  This is an essential expense
                </label>
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

// End of frontend/src/pages/MyData/tabs/ExpensesTab.tsx
