/**
 * FinEdge Onboarding - Entry Card Component
 * 
 * Reusable card component for displaying and managing financial entries
 * (income, expenses, assets, liabilities) with edit/delete functionality.
 * 
 * @module components/onboarding/shared/EntryCard
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Edit2, Trash2, IndianRupeeIcon } from 'lucide-react';

interface EntryCardProps {
  id: string;
  title: string;
  amount: number;
  subtitle: string;
  badge?: string;
  badgeColor?: string;
  icon: React.ReactNode;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const EntryCard: React.FC<EntryCardProps> = ({
  id,
  title,
  amount,
  subtitle,
  badge,
  badgeColor = 'bg-indigo-500',
  icon,
  onEdit,
  onDelete,
}) => {
  const { theme } = useTheme();

  return (
    <div
      className={`p-4 rounded-lg transition-all duration-200 ${
        theme === 'dark'
          ? 'bg-gray-700 hover:bg-gray-600'
          : 'bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="flex items-start justify-between">
        {/* Left Section - Icon and Details */}
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 ${badgeColor} rounded-lg`}>
            {icon}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {title}
              </h4>
              {badge && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badgeColor} text-white`}>
                  {badge}
                </span>
              )}
            </div>
            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {subtitle}
            </p>
            <p className={`text-lg font-bold mt-1 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              ₹{amount.toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Right Section - Action Buttons */}
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={() => onEdit(id)}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-gray-500 text-gray-300'
                : 'hover:bg-gray-200 text-gray-600'
            }`}
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'hover:bg-red-900/30 text-red-400'
                : 'hover:bg-red-50 text-red-600'
            }`}
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default EntryCard;

// End of frontend/src/components/onboarding/shared/EntryCard.tsx
