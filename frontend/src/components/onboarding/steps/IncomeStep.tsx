/**
 * FinEdge Onboarding - Income Step
 * 
 * Step 2: User adds their income sources with amount, frequency, and category.
 * 
 * @module components/onboarding/steps/IncomeStep
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Plus, IndianRupeeIcon, X, Briefcase, TrendingUp, Gift, Landmark } from 'lucide-react';
import type { IncomeEntry, IncomeFormData } from '../../../types/onboarding';
import EntryCard from '../shared/EntryCard';

const IncomeStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, addIncome, updateIncome, deleteIncome } = useOnboarding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<IncomeFormData>({
    source: '',
    amount: '',
    frequency: 'monthly',
    category: 'salary',
    date: new Date().toISOString().split('T')[0],
  });

  // Category icons
  const categoryIcons = {
    salary: <Briefcase className="w-5 h-5 text-white" />,
    investment: <TrendingUp className="w-5 h-5 text-white" />,
    gift: <Gift className="w-5 h-5 text-white" />,
    other: <Landmark className="w-5 h-5 text-white" />,
  };

  const handleOpenModal = (entry?: IncomeEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        source: entry.source,
        amount: entry.amount.toString(),
        frequency: entry.frequency,
        category: entry.category,
        date: entry.date,
      });
    } else {
      setEditingId(null);
      setFormData({
        source: '',
        amount: '',
        frequency: 'monthly',
        category: 'salary',
        date: new Date().toISOString().split('T')[0],
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

    const incomeEntry: IncomeEntry = {
      id: editingId || `income_${Date.now()}`,
      source: formData.source,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      category: formData.category,
      date: formData.date,
    };

    if (editingId) {
      updateIncome(editingId, incomeEntry);
    } else {
      addIncome(incomeEntry);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this income entry?')) {
      deleteIncome(id);
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
          Add Income Source
        </span>
      </button>

      {/* Income List */}
      {data.income.length === 0 ? (
        <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <IndianRupeeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No income sources added yet.</p>
          <p className="text-sm mt-1">Add at least one income source to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.income.map((income) => (
            <EntryCard
              key={income.id}
              id={income.id}
              title={income.source}
              amount={income.amount}
              subtitle={`${income.frequency} • ${income.category}`}
              badge={income.frequency}
              badgeColor="bg-green-500"
              icon={categoryIcons[income.category]}
              onEdit={() => handleOpenModal(income)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {data.income.length > 0 && (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}>
              Total Monthly Income (estimated)
            </span>
            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
              ₹{data.income.reduce((sum, i) => sum + (i.frequency === 'monthly' ? i.amount : i.frequency === 'yearly' ? i.amount / 12 : 0), 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Income' : 'Add Income'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Income Source *
                </label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Salary from TCS"
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
                  placeholder="50000"
                  min="0"
                  step="0.01"
                  required
                />
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
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="one-time">One-time</option>
                </select>
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
                  <option value="salary">Salary</option>
                  <option value="investment">Investment</option>
                  <option value="gift">Gift</option>
                  <option value="other">Other</option>
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

              {/* Modal Footer */}
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

export default IncomeStep;

// End of frontend/src/components/onboarding/steps/IncomeStep.tsx
