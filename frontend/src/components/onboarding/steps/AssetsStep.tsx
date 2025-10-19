/**
 * FinEdge Onboarding - Assets Step
 * 
 * Step 4: User adds their assets including properties, investments, and savings.
 * 
 * @module components/onboarding/steps/AssetsStep
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Plus, Building2, X, Briefcase, Car, Landmark, Coins, CreditCard } from 'lucide-react';
import type { AssetEntry, AssetFormData } from '../../../types/onboarding';
import EntryCard from '../shared/EntryCard';

const AssetsStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, addAsset, updateAsset, deleteAsset } = useOnboarding();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    value: '',
    category: 'bank',
    purchaseDate: '',
    appreciationRate: '',
    notes: '',
  });

  const categoryIcons = {
    realestate: <Building2 className="w-5 h-5 text-white" />,
    investments: <Briefcase className="w-5 h-5 text-white" />,
    vehicles: <Car className="w-5 h-5 text-white" />,
    bank: <Landmark className="w-5 h-5 text-white" />,
    cash: <Coins className="w-5 h-5 text-white" />,
    other: <CreditCard className="w-5 h-5 text-white" />,
  };

  const categoryLabels = {
    realestate: 'Real Estate',
    investments: 'Investments',
    vehicles: 'Vehicles',
    bank: 'Bank Account',
    cash: 'Cash',
    other: 'Other',
  };

  const handleOpenModal = (entry?: AssetEntry) => {
    if (entry) {
      setEditingId(entry.id);
      setFormData({
        name: entry.name,
        value: entry.value.toString(),
        category: entry.category,
        purchaseDate: entry.purchaseDate || '',
        appreciationRate: entry.appreciationRate?.toString() || '',
        notes: entry.notes || '',
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        value: '',
        category: 'bank',
        purchaseDate: '',
        appreciationRate: '',
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

    const assetEntry: AssetEntry = {
      id: editingId || `asset_${Date.now()}`,
      name: formData.name,
      value: parseFloat(formData.value),
      category: formData.category,
      purchaseDate: formData.purchaseDate || undefined,
      appreciationRate: formData.appreciationRate ? parseFloat(formData.appreciationRate) : undefined,
      notes: formData.notes || undefined,
    };

    if (editingId) {
      updateAsset(editingId, assetEntry);
    } else {
      addAsset(assetEntry);
    }

    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this asset?')) {
      deleteAsset(id);
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
          Add Asset
        </span>
      </button>

      {/* Asset List */}
      {data.assets.length === 0 ? (
        <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No assets added yet.</p>
          <p className="text-sm mt-1">Add at least one asset to continue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.assets.map((asset) => (
            <EntryCard
              key={asset.id}
              id={asset.id}
              title={asset.name}
              amount={asset.value}
              subtitle={categoryLabels[asset.category]}
              badgeColor="bg-emerald-500"
              icon={categoryIcons[asset.category]}
              onEdit={() => handleOpenModal(asset)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Summary */}
      {data.assets.length > 0 && (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-emerald-900/20' : 'bg-emerald-50'}`}>
          <div className="flex justify-between items-center">
            <span className={`font-semibold ${theme === 'dark' ? 'text-emerald-300' : 'text-emerald-900'}`}>
              Total Asset Value
            </span>
            <span className={`text-xl font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`}>
              ₹{data.assets.reduce((sum, a) => sum + a.value, 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-inherit">
              <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {editingId ? 'Edit Asset' : 'Add Asset'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="e.g., Mumbai Apartment"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Value (₹) *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="5000000"
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
                  <option value="realestate">Real Estate</option>
                  <option value="investments">Investments</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Purchase Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  Annual Appreciation Rate (%) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.appreciationRate}
                  onChange={(e) => setFormData({ ...formData, appreciationRate: e.target.value })}
                  className={`w-full px-4 py-2 rounded-lg border ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}`}
                  placeholder="5.5"
                  min="0"
                  max="100"
                  step="0.1"
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

export default AssetsStep;

// End of frontend/src/components/onboarding/steps/AssetsStep.tsx
