/**
 * FinEdge Liabilities Tab - MongoDB Connected
 * 
 * Manages liability entries with real-time MongoDB synchronization.
 * Users can track loans, debts, and financial obligations.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { DollarSign, Plus, Trash2, Edit2, X, Home, Car, CreditCard, GraduationCap, FileText, User } from 'lucide-react';
import { SERVER_URL } from '../../../utils/utils';

interface Liability {
  id: string;
  name: string;
  amount: number;
  category: 'homeloan' | 'carloan' | 'personalloan' | 'creditcard' | 'education' | 'other';
  interestRate?: number;
  dueDate?: string;
  monthlyPayment?: number;
  notes?: string;
}

const normalizeLiability = (doc: any): Liability => ({
  id: doc?.id ?? doc?._id ?? '',
  name: doc?.name ?? '',
  amount:
    typeof doc?.amount === 'number'
      ? doc.amount
      : Number.parseFloat(doc?.amount ?? '0') || 0,
  category: (doc?.category ?? 'other') as Liability['category'],
  interestRate:
    typeof doc?.interestRate === 'number'
      ? doc.interestRate
      : doc?.interestRate
      ? Number.parseFloat(doc.interestRate)
      : undefined,
  dueDate: doc?.dueDate ?? undefined,
  monthlyPayment:
    typeof doc?.monthlyPayment === 'number'
      ? doc.monthlyPayment
      : doc?.monthlyPayment
      ? Number.parseFloat(doc.monthlyPayment)
      : undefined,
  notes: doc?.notes ?? undefined,
});

const categoryIcons = {
  homeloan: Home,
  carloan: Car,
  personalloan: User,
  creditcard: CreditCard,
  education: GraduationCap,
  other: FileText
};

const categoryColors = {
  homeloan: 'red',
  carloan: 'orange',
  personalloan: 'yellow',
  creditcard: 'purple',
  education: 'blue',
  other: 'gray'
};

const categoryLabels = {
  homeloan: 'Home Loan',
  carloan: 'Car Loan',
  personalloan: 'Personal Loan',
  creditcard: 'Credit Card',
  education: 'Education Loan',
  other: 'Other'
};

export const LiabilitiesTab = () => {
  const { user } = useUser();
  const [liabilities, setLiabilities] = useState<Liability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedLiability, setSelectedLiability] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    category: 'personalloan',
    interestRate: '',
    dueDate: '',
    monthlyPayment: '',
    notes: ''
  });

  // Fetch liabilities from MongoDB on component mount
  useEffect(() => {
    const fetchLiabilities = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const normalized = (data.liabilities || [])
            .map(normalizeLiability)
            .filter((liability: Liability) => Boolean(liability.id));
          setLiabilities(normalized);
        } else {
          console.error('Failed to fetch liabilities data');
        }
      } catch (error) {
        console.error('Error fetching liabilities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiabilities();
  }, [user]);

  const handleAdd = async () => {
    if (!user?.id) return;

    try {
      const amountRaw = Number.parseFloat(formData.amount);
      const amount = Number.isNaN(amountRaw) ? 0 : amountRaw;
      const interestRaw = formData.interestRate
        ? Number.parseFloat(formData.interestRate)
        : undefined;
      const interestRate =
        interestRaw !== undefined && !Number.isNaN(interestRaw) ? interestRaw : undefined;
      const monthlyPaymentRaw = formData.monthlyPayment
        ? Number.parseFloat(formData.monthlyPayment)
        : undefined;
      const monthlyPayment =
        monthlyPaymentRaw !== undefined && !Number.isNaN(monthlyPaymentRaw)
          ? monthlyPaymentRaw
          : undefined;

      const response = await fetch(`${SERVER_URL}/api/user-profile/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: formData.name,
          amount,
          category: formData.category,
          interestRate: interestRate ?? null,
          dueDate: formData.dueDate || null,
          monthlyPayment: monthlyPayment ?? null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.liability) {
          setLiabilities((prev) => [...prev, normalizeLiability(result.liability)]);
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        console.error('Failed to add liability');
      }
    } catch (error) {
      console.error('Error adding liability:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedLiability || !user?.id) return;

    try {
      const amountRaw = Number.parseFloat(formData.amount);
      const amount = Number.isNaN(amountRaw) ? 0 : amountRaw;
      const interestRaw = formData.interestRate
        ? Number.parseFloat(formData.interestRate)
        : undefined;
      const interestRate =
        interestRaw !== undefined && !Number.isNaN(interestRaw) ? interestRaw : undefined;
      const monthlyPaymentRaw = formData.monthlyPayment
        ? Number.parseFloat(formData.monthlyPayment)
        : undefined;
      const monthlyPayment =
        monthlyPaymentRaw !== undefined && !Number.isNaN(monthlyPaymentRaw)
          ? monthlyPaymentRaw
          : undefined;

      const response = await fetch(`${SERVER_URL}/api/user-profile/liabilities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          _id: selectedLiability,
          name: formData.name,
          amount,
          category: formData.category,
          interestRate: interestRate ?? null,
          dueDate: formData.dueDate || null,
          monthlyPayment: monthlyPayment ?? null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        setLiabilities((prev) =>
          prev.map((liability) =>
            liability.id === selectedLiability
              ? {
                  ...liability,
                  name: formData.name,
                  amount,
                  category: formData.category as Liability['category'],
                  interestRate,
                  dueDate: formData.dueDate || undefined,
                  monthlyPayment,
                  notes: formData.notes || undefined,
                }
              : liability
          )
        );
        setIsModalOpen(false);
        setIsEditing(false);
        resetForm();
      } else {
        console.error('Failed to update liability');
      }
    } catch (error) {
      console.error('Error updating liability:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id || !id || !confirm('Are you sure you want to delete this liability?')) return;

    try {
      const response = await fetch(
        `${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${user.id}&entryId=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setLiabilities((prev) => prev.filter((liability) => liability.id !== id));
      } else {
        console.error('Failed to delete liability');
      }
    } catch (error) {
      console.error('Error deleting liability:', error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (liability: Liability) => {
    setFormData({
      name: liability.name,
      amount: liability.amount.toString(),
      category: liability.category,
      interestRate: liability.interestRate?.toString() || '',
      dueDate: liability.dueDate || '',
      monthlyPayment: liability.monthlyPayment?.toString() || '',
      notes: liability.notes || ''
    });
    setSelectedLiability(liability.id);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      category: 'personalloan',
      interestRate: '',
      dueDate: '',
      monthlyPayment: '',
      notes: ''
    });
    setSelectedLiability(null);
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
      {/* Add Liability Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Liabilities</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your debts, loans, and financial obligations
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Liability
        </button>
      </div>

      {/* Liability List */}
      {liabilities.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CreditCard className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No liabilities tracked yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Track your debts to better manage your financial health
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {liabilities.map((liability) => {
            const Icon = categoryIcons[liability.category];
            const color = categoryColors[liability.category];
            return (
              <div
                key={liability.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                      <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {liability.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{categoryLabels[liability.category]}</span>
                        {liability.interestRate && (
                          <>
                            <span>•</span>
                            <span>{liability.interestRate}% APR</span>
                          </>
                        )}
                        {liability.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {new Date(liability.dueDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                      {liability.monthlyPayment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Monthly Payment: ₹{liability.monthlyPayment.toLocaleString('en-IN')}
                        </p>
                      )}
                      {liability.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {liability.notes}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-3">
                        ₹{liability.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(liability)}
                      className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(liability.id)}
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

      {/* Total Liabilities Summary */}
      {liabilities.length > 0 && (
        <div className="bg-gradient-to-r from-red-500 to-rose-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm">Total Liabilities</p>
              <p className="text-3xl font-bold mt-1">
                ₹{liabilities.reduce((sum, liability) => sum + liability.amount, 0).toLocaleString('en-IN')}
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
                {isEditing ? 'Edit Liability' : 'Add Liability'}
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
                  Liability Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Home Loan from SBI"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outstanding Amount (₹) *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="2500000"
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
                  <option value="homeloan">Home Loan</option>
                  <option value="carloan">Car Loan</option>
                  <option value="personalloan">Personal Loan</option>
                  <option value="creditcard">Credit Card</option>
                  <option value="education">Education Loan</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interest Rate (% per year) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="8.5"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Monthly Payment (₹) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.monthlyPayment}
                  onChange={(e) => setFormData({ ...formData, monthlyPayment: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="25000"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Additional details..."
                  rows={3}
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

// End of frontend/src/pages/MyData/tabs/LiabilitiesTab.tsx
