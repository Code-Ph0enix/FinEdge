/**
 * FinEdge Onboarding - Expenses Step
 * 
 * Step 3: User adds their regular expenses with categorization.
 * 
 * @module components/onboarding/steps/ExpensesStep
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Plus, ShoppingCart, X, Home, Car, Utensils, Heart, Plane, Zap, Smartphone } from 'lucide-react';
import type { ExpenseEntry, ExpenseFormData } from '../../../types/onboarding';
import EntryCard from '../shared/EntryCard';

const ExpensesStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, addExpense, updateExpense, deleteExpense } = useOnboarding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ExpenseFormData>({
    name: '',
    amount: '',
    category: 'shopping',
    frequency: 'monthly',
    date: new Date().toISOString().split('T')[0],
    isEssential: false,
  });

  const categoryIcons = {
    shopping: <ShoppingCart className="w-5 h-5 text-white" />,
    housing: <Home className="w-5 h-5 text-white" />,
    transport: <Car className="w-5 h-5 text-white" />,
    food: <Utensils className="w-5 h-5 text-white" />,
    health: <Heart className="w-5 h-5 text-white" />,
    travel: <Plane className="w-5 h-5 text-white" />,
    utilities: <Zap className="w-5 h-5 text-white" />,
    other: <Smartphone className="w-5 h-5 text-white" />,
  };

  const handleOpenModal = (entry?: ExpenseEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        name: entry.name,
        amount: entry.amount.toString(),
        category: entry.category,
        frequency: entry.frequency,
        date: entry.date,
        isEssential: entry.isEssential,
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        amount: '',
        category: 'shopping',
        frequency: 'monthly',
        date: new Date().toISOString().split('T')[0],
        isEssential: false,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const expenseEntry: ExpenseEntry = {
      id: editingId || `expense_${Date.now()}`,
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      frequency: formData.frequency,
      date: formData.date,
      isEssential: formData.isEssential,
    };

    if (editingId) {
      updateExpense(editingId, expenseEntry);
    } else {
      addExpense(expenseEntry);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this expense?')) {
      deleteExpense(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Button */}
      <button
        onClick={() => handleOpenModal()}
        className="w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      >
        <Plus className="w-5 h-5 text-indigo-600" />
        <span className={`font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
          Add Expense
        </span>
      </button>

      {/* Expense List */}
      {data.expenses.length === 0 ? (
        <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No expenses added yet.</p>
          <p className="text-sm mt-1">Add at least one expense to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.expenses.map((expense) => (
            <EntryCard
              key={expense.id}
              id={expense.id}
              title={expense.name}
              amount={expense.amount}
              subtitle={`${expense.frequency} • ${expense.category}${expense.isEssential ? ' • Essential' : ''}`}
              badge={expense.isEssential ? 'Essential' : undefined}
              badgeColor="bg-red-500"
              icon={categoryIcons[expense.category]}
              onEdit={() => handleOpenModal(expense)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {data.expenses.length > 0 && (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>
              Total Monthly Expenses (estimated)
            </span>
            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              ₹{data.expenses.reduce((sum, e) => sum + (e.frequency === 'monthly' ? e.amount : e.frequency === 'yearly' ? e.amount / 12 : 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Modal - Similar to IncomeStep but with expense fields */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Expense' : 'Add Expense'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Expense Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Monthly Rent"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="15000"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Frequency *
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
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
                <label htmlFor="isEssential" className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  This is an essential expense
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold ${theme === 'dark' ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg"
                >
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpensesStep;

// End of frontend/src/components/onboarding/steps/ExpensesStep.tsx
