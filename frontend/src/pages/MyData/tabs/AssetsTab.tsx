/**
 * FinEdge Assets Tab - MongoDB Connected
 * 
 * Manages asset entries with real-time MongoDB synchronization.
 * Users can track properties, investments, and other valuable assets.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { DollarSign, Plus, Trash2, Edit2, X, Building2, Briefcase, Car, Landmark, Coins, CreditCard } from 'lucide-react';
import { SERVER_URL } from '../../../utils/utils';

// Fallback for SERVER_URL if undefined
const API_BASE_URL = SERVER_URL || 'http://localhost:5000';

interface Asset {
  id: string;
  name: string;
  value: number;
  category: 'realestate' | 'investments' | 'vehicles' | 'bank' | 'cash' | 'other';
  purchaseDate?: string;
  appreciationRate?: number;
  notes?: string;
}

const normalizeAsset = (doc: any): Asset | null => {
  try {
    if (!doc || (typeof doc !== 'object')) {
      console.warn('Invalid document provided to normalizeAsset:', doc);
      return null;
    }

    const id = doc?.id ?? doc?._id?.toString() ?? '';
    if (!id) {
      console.warn('Document missing id field:', doc);
      return null;
    }

    return {
      id,
      name: doc?.name?.toString() ?? '',
      value:
        typeof doc?.value === 'number'
          ? doc.value
          : Number.parseFloat(doc?.value ?? '0') || 0,
      category: (['realestate', 'investments', 'vehicles', 'bank', 'cash', 'other'].includes(doc?.category) 
    ? doc.category 
    : 'other') as Asset['category'],
      purchaseDate: doc?.purchaseDate ?? undefined,
      appreciationRate:
        typeof doc?.appreciationRate === 'number'
          ? doc.appreciationRate
          : doc?.appreciationRate
          ? (Number.parseFloat(doc.appreciationRate) || undefined)
          : undefined,
      notes: doc?.notes?.toString() ?? undefined,
    };
  } catch (error) {
    console.error('Error normalizing asset:', error, doc);
    return null;
  }
};

const categoryIcons = {
  realestate: Building2,
  investments: Briefcase,
  vehicles: Car,
  bank: Landmark,
  cash: Coins,
  other: CreditCard
};

const categoryColors = {
  realestate: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  investments: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-600 dark:text-blue-400'
  },
  vehicles: {
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    text: 'text-orange-600 dark:text-orange-400'
  },
  bank: {
    bg: 'bg-indigo-100 dark:bg-indigo-900/30',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  cash: {
    bg: 'bg-green-100 dark:bg-green-900/30',
    text: 'text-green-600 dark:text-green-400'
  },
  other: {
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    text: 'text-gray-600 dark:text-gray-400'
  }
};

const categoryLabels = {
  realestate: 'Real Estate',
  investments: 'Investments',
  vehicles: 'Vehicles',
  bank: 'Bank Account',
  cash: 'Cash',
  other: 'Other'
};

export const AssetsTab = () => {
  const { user, isLoaded } = useUser();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    category: 'bank',
    purchaseDate: '',
    appreciationRate: '',
    notes: ''
  });

  // Fetch assets from MongoDB on component mount
  useEffect(() => {
    const fetchAssets = async () => {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(
          `${API_BASE_URL}/api/user-profile/assets?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const normalized = (data.assets || [])
            .map(normalizeAsset)
            .filter((asset: Asset | null): asset is Asset => asset !== null && Boolean(asset.id));
          setAssets(normalized);
        } else {
          const errorData = await response.text();
          setError(`Failed to fetch assets: ${response.status} ${response.statusText}`);
          console.error('Failed to fetch assets data:', errorData);
        }
      } catch (error) {
        setError('Network error: Unable to connect to server');
        console.error('Error fetching assets:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssets();
  }, [user]);

  const handleAdd = async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }

    try {
      setError(null);
      const valueRaw = Number.parseFloat(formData.value);
      const value = Number.isNaN(valueRaw) ? 0 : valueRaw;
      const appreciationRaw = formData.appreciationRate
        ? Number.parseFloat(formData.appreciationRate)
        : undefined;
      const appreciationRate =
        appreciationRaw !== undefined && !Number.isNaN(appreciationRaw)
          ? appreciationRaw
          : undefined;

      const response = await fetch(`${API_BASE_URL}/api/user-profile/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          name: formData.name,
          value,
          category: formData.category,
          purchaseDate: formData.purchaseDate || null,
          appreciationRate: appreciationRate ?? null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result?.asset) {
          const normalized = normalizeAsset(result.asset);
          if (normalized) {
            setAssets((prev) => [...prev, normalized]);
          }
        }
        setIsModalOpen(false);
        resetForm();
      } else {
        const errorData = await response.text();
        setError(`Failed to add asset: ${response.status}`);
        console.error('Failed to add asset:', errorData);
      }
    } catch (error) {
      setError('Network error: Unable to save asset');
      console.error('Error adding asset:', error);
    }
  };

  const handleEdit = async () => {
    if (!selectedAsset || !user?.id) {
      setError('Invalid asset selection or user not authenticated');
      return;
    }

    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }

    try {
      setError(null);
      const valueRaw = Number.parseFloat(formData.value);
      const value = Number.isNaN(valueRaw) ? 0 : valueRaw;
      const appreciationRaw = formData.appreciationRate
        ? Number.parseFloat(formData.appreciationRate)
        : undefined;
      const appreciationRate =
        appreciationRaw !== undefined && !Number.isNaN(appreciationRaw)
          ? appreciationRaw
          : undefined;

      const response = await fetch(`${API_BASE_URL}/api/user-profile/assets`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          _id: selectedAsset,
          name: formData.name,
          value,
          category: formData.category,
          purchaseDate: formData.purchaseDate || null,
          appreciationRate: appreciationRate ?? null,
          notes: formData.notes || null,
        }),
      });

      if (response.ok) {
        setAssets((prev) =>
          prev.map((asset) =>
            asset.id === selectedAsset
              ? {
                  ...asset,
                  name: formData.name,
                  value,
                  category: formData.category as Asset['category'],
                  purchaseDate: formData.purchaseDate || undefined,
                  appreciationRate,
                  notes: formData.notes || undefined,
                }
              : asset
          )
        );
        setIsModalOpen(false);
        setIsEditing(false);
        resetForm();
      } else {
        const errorData = await response.text();
        setError(`Failed to update asset: ${response.status}`);
        console.error('Failed to update asset:', errorData);
      }
    } catch (error) {
      setError('Network error: Unable to update asset');
      console.error('Error updating asset:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user?.id || !id || !confirm('Are you sure you want to delete this asset?')) return;

    try {
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/api/user-profile/assets?clerkUserId=${user.id}&entryId=${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setAssets((prev) => prev.filter((asset) => asset.id !== id));
      } else {
        const errorData = await response.text();
        setError(`Failed to delete asset: ${response.status}`);
        console.error('Failed to delete asset:', errorData);
      }
    } catch (error) {
      setError('Network error: Unable to delete asset');
      console.error('Error deleting asset:', error);
    }
  };

  const openAddModal = () => {
    resetForm();
    setIsEditing(false);
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (asset: Asset) => {
    setFormData({
      name: asset.name,
      value: asset.value.toString(),
      category: asset.category,
      purchaseDate: asset.purchaseDate || '',
      appreciationRate: asset.appreciationRate?.toString() || '',
      notes: asset.notes || ''
    });
    setSelectedAsset(asset.id);
    setIsEditing(true);
    setError(null);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      value: '',
      category: 'bank',
      purchaseDate: '',
      appreciationRate: '',
      notes: ''
    });
    setSelectedAsset(null);
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      handleEdit();
    } else {
      handleAdd();
    }
  };

  // Loading state - also check if Clerk user is loaded
  if (isLoading || !isLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // User not authenticated state
  if (!user) {
    return (
      <div className="text-center py-12 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <div className="text-yellow-600 dark:text-yellow-400 text-lg mb-4">
          🔒 Authentication Required
        </div>
        <p className="text-yellow-500 dark:text-yellow-300 mb-4">
          Please sign in to view your assets
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-red-600 dark:text-red-400 text-lg mb-4">
          ⚠️ Error Loading Assets
        </div>
        <p className="text-red-500 dark:text-red-300 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add Asset Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Assets</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track your valuable assets and investments
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Asset
        </button>
      </div>

      {/* Asset List */}
      {assets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400 text-lg">No assets tracked yet</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
            Start tracking your assets to understand your net worth
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {assets.map((asset) => {
            const Icon = categoryIcons[asset.category] || categoryIcons.other;
            const color = categoryColors[asset.category] || categoryColors.other;
            return (
              <div
                key={asset.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`p-3 ${color.bg} rounded-lg`}>
                      <Icon className={`w-6 h-6 ${color.text}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {asset.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>{categoryLabels[asset.category]}</span>
                        {asset.purchaseDate && (
                          <>
                            <span>•</span>
                            <span>Purchased: {new Date(asset.purchaseDate).toLocaleDateString()}</span>
                          </>
                        )}
                        {asset.appreciationRate && (
                          <>
                            <span>•</span>
                            <span>{asset.appreciationRate}% annual growth</span>
                          </>
                        )}
                      </div>
                      {asset.notes && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                          {asset.notes}
                        </p>
                      )}
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
                        ₹{asset.value.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(asset)}
                      className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(asset.id)}
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

      {/* Total Assets Summary */}
      {assets.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">Total Asset Value</p>
              <p className="text-3xl font-bold mt-1">
                ₹{assets.reduce((sum, asset) => sum + asset.value, 0).toLocaleString('en-IN')}
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
                {isEditing ? 'Edit Asset' : 'Add Asset'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Asset Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Mumbai Apartment"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Current Value (₹) *
                </label>
                <input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="5000000"
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
                  <option value="realestate">Real Estate</option>
                  <option value="investments">Investments</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Purchase Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Annual Appreciation Rate (%) (Optional)
                </label>
                <input
                  type="number"
                  value={formData.appreciationRate}
                  onChange={(e) => setFormData({ ...formData, appreciationRate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="5.5"
                  min="0"
                  max="100"
                  step="0.1"
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

// End of frontend/src/pages/MyData/tabs/AssetsTab.tsx
