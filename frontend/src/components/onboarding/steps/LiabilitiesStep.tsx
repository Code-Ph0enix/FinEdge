/**
 * FinEdge Onboarding - Liabilities Step
 * 
 * Step 5: User adds their liabilities including loans and debts.
 * 
 * @module components/onboarding/steps/LiabilitiesStep
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Plus, AlertCircle, X, Home, Car, User, CreditCard, GraduationCap, FileText } from 'lucide-react';
import type { LiabilityEntry, LiabilityFormData } from '../../../types/onboarding';
import EntryCard from '../shared/EntryCard';

const LiabilitiesStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, addLiability, updateLiability, deleteLiability } = useOnboarding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<LiabilityFormData>({
    name: '',
    amount: '',
    category: 'personalloan',
    interestRate: '',
    dueDate: '',
    monthlyPayment: '',
    notes: '',
  });

  const categoryIcons = {
    homeloan: <Home className="w-5 h-5 text-white" />,
    carloan: <Car className="w-5 h-5 text-white" />,
    personalloan: <User className="w-5 h-5 text-white" />,
    creditcard: <CreditCard className="w-5 h-5 text-white" />,
    education: <GraduationCap className="w-5 h-5 text-white" />,
    other: <FileText className="w-5 h-5 text-white" />,
  };

  const categoryLabels = {
    homeloan: 'Home Loan',
    carloan: 'Car Loan',
    personalloan: 'Personal Loan',
    creditcard: 'Credit Card',
    education: 'Education Loan',
    other: 'Other',
  };

  const handleOpenModal = (entry?: LiabilityEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        name: entry.name,
        amount: entry.amount.toString(),
        category: entry.category,
        interestRate: entry.interestRate?.toString() || '',
        dueDate: entry.dueDate || '',
        monthlyPayment: entry.monthlyPayment?.toString() || '',
        notes: entry.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        amount: '',
        category: 'personalloan',
        interestRate: '',
        dueDate: '',
        monthlyPayment: '',
        notes: '',
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

    const liabilityEntry: LiabilityEntry = {
      id: editingId || `liability_${Date.now()}`,
      name: formData.name,
      amount: parseFloat(formData.amount),
      category: formData.category,
      interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      dueDate: formData.dueDate || undefined,
      monthlyPayment: formData.monthlyPayment ? parseFloat(formData.monthlyPayment) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      updateLiability(editingId, liabilityEntry);
    } else {
      addLiability(liabilityEntry);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this liability?')) {
      deleteLiability(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-orange-900/20 border border-orange-800' : 'bg-orange-50 border border-orange-200'}`}>
        <div className="flex items-start gap-3">
          <AlertCircle className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
          <p className={`text-sm ${theme === 'dark' ? 'text-orange-200' : 'text-orange-700'}`}>
            Include all loans, debts, and credit card balances. If you don't have any liabilities, you can skip by adding a placeholder entry with ₹0.
          </p>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={() => handleOpenModal()}
        className="w-full p-4 border-2 border-dashed rounded-lg transition-all duration-200 flex items-center justify-center gap-2 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
      >
        <Plus className="w-5 h-5 text-indigo-600" />
        <span className={`font-semibold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
          Add Liability
        </span>
      </button>

      {/* Liability List */}
      {data.liabilities.length === 0 ? (
        <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No liabilities added yet.</p>
          <p className="text-sm mt-1">Add at least one liability (or ₹0 if none) to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.liabilities.map((liability) => (
            <EntryCard
              key={liability.id}
              id={liability.id}
              title={liability.name}
              amount={liability.amount}
              subtitle={`${categoryLabels[liability.category]}${liability.interestRate ? ` • ${liability.interestRate}% APR` : ''}`}
              badge={liability.interestRate ? `${liability.interestRate}%` : undefined}
              badgeColor="bg-orange-500"
              icon={categoryIcons[liability.category]}
              onEdit={() => handleOpenModal(liability)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {data.liabilities.length > 0 && (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50'}`}>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`font-semibold ${theme === 'dark' ? 'text-red-300' : 'text-red-900'}`}>
                Total Liabilities
              </span>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
                ₹{data.liabilities.reduce((sum, l) => sum + l.amount, 0).toLocaleString('en-IN')}
              </span>
            </div>
            
            {/* Net Worth Preview */}
            <div className="pt-2 border-t border-red-200 dark:border-red-800">
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Estimated Net Worth
                </span>
                <span className={`text-sm font-bold ${
                  (data.assets.reduce((sum, a) => sum + a.value, 0) - data.liabilities.reduce((sum, l) => sum + l.amount, 0)) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  ₹{(data.assets.reduce((sum, a) => sum + a.value, 0) - data.liabilities.reduce((sum, l) => sum + l.amount, 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-inherit">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Liability' : 'Add Liability'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Liability Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Home Loan from SBI"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Outstanding Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="2500000"
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
                  <option value="homeloan">Home Loan</option>
                  <option value="carloan">Car Loan</option>
                  <option value="personalloan">Personal Loan</option>
                  <option value="creditcard">Credit Card</option>
                  <option value="education">Education Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Interest Rate (% per year) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="8.5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Monthly Payment (₹) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="25000"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="Additional details..."
                  rows={3}
                />
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

export default LiabilitiesStep;

// End of frontend/src/components/onboarding/steps/LiabilitiesStep.tsx
