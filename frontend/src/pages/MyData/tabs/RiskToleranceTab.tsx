/**
 * FinEdge Risk Tolerance Tab - MongoDB Connected
 * 
 * Displays and allows updating user's risk tolerance level.
 * Syncs with MongoDB user profile.
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { TrendingUp, ShieldAlert, BarChart, Save, AlertCircle } from 'lucide-react';
import { SERVER_URL } from '../../../utils/utils';

interface RiskLevel {
  value: string;
  label: string;
  description: string;
  color: string;
  icon: JSX.Element;
  strategy: string[];
}

const riskLevels: RiskLevel[] = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: 'Focus on preserving capital with minimal risk tolerance',
    color: 'bg-blue-500',
    icon: <ShieldAlert className="h-6 w-6 text-blue-500" />,
    strategy: [
      'Majority in bonds and fixed-income securities',
      'High-quality, investment-grade investments',
      'Capital preservation is the primary goal',
      'Suitable for short-term financial goals'
    ]
  },
  {
    value: 'moderately_conservative',
    label: 'Moderately Conservative',
    description: 'Emphasis on stability with some growth potential',
    color: 'bg-cyan-500',
    icon: <ShieldAlert className="h-6 w-6 text-cyan-500" />,
    strategy: [
      'Balanced mix of bonds and stocks',
      'Focus on dividend-paying stocks',
      'Moderate growth with risk management',
      'Good for medium-term goals'
    ]
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: 'Balanced approach between growth and security',
    color: 'bg-green-500',
    icon: <BarChart className="h-6 w-6 text-green-500" />,
    strategy: [
      'Equal mix of stocks and bonds',
      'Diversified portfolio across sectors',
      'Moderate growth expectations',
      'Balanced risk-reward ratio'
    ]
  },
  {
    value: 'moderately_aggressive',
    label: 'Moderately Aggressive',
    description: 'Higher growth potential with increased risk tolerance',
    color: 'bg-orange-500',
    icon: <TrendingUp className="h-6 w-6 text-orange-500" />,
    strategy: [
      'Higher allocation to growth stocks',
      'Potential for international exposure',
      'Accept market volatility for returns',
      'Long-term growth focus'
    ]
  },
  {
    value: 'aggressive',
    label: 'Aggressive',
    description: 'Maximum growth potential with highest risk tolerance',
    color: 'bg-red-500',
    icon: <TrendingUp className="h-6 w-6 text-red-500" />,
    strategy: [
      'Predominantly growth stocks',
      'Emerging markets and high-growth sectors',
      'Accept significant volatility',
      'Very long-term investment horizon'
    ]
  }
];

export const RiskToleranceTab = () => {
  const { user } = useUser();
  const [selectedRisk, setSelectedRisk] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch current risk tolerance from MongoDB
  useEffect(() => {
    const fetchRiskTolerance = async () => {
      if (!user?.id) return;

      try {
        setIsLoading(true);
        const response = await fetch(
          `${SERVER_URL}/api/onboarding/status?clerkUserId=${user.id}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.profile?.riskTolerance) {
            setSelectedRisk(data.profile.riskTolerance);
          }
        } else {
          console.error('Failed to fetch risk tolerance');
        }
      } catch (error) {
        console.error('Error fetching risk tolerance:', error);
        setError('Failed to load risk tolerance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiskTolerance();
  }, [user]);

  const handleRiskSelect = (riskValue: string) => {
    setSelectedRisk(riskValue);
    setHasChanges(riskValue !== selectedRisk);
    setSuccessMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    if (!user?.id || !selectedRisk) return;

    try {
      setIsSaving(true);
      setError(null);
      
      const response = await fetch(`${SERVER_URL}/api/onboarding/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkUserId: user.id,
          riskTolerance: selectedRisk,
          // Keep existing data - just update risk tolerance
          income: [],
          expenses: [],
          assets: [],
          liabilities: []
        }),
      });

      if (response.ok) {
        setSuccessMessage('Risk tolerance updated successfully!');
        setHasChanges(false);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError('Failed to update risk tolerance');
      }
    } catch (error) {
      console.error('Error saving risk tolerance:', error);
      setError('An error occurred while saving');
    } finally {
      setIsSaving(false);
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

  const selectedRiskLevel = riskLevels.find(level => level.value === selectedRisk);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Risk Tolerance</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define your investment risk comfort level
          </p>
        </div>
        {hasChanges && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="p-4 bg-green-100 dark:bg-green-900/30 border border-green-500 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-green-700 dark:text-green-300">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 border border-red-500 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Current Selection Summary */}
      {selectedRiskLevel && (
        <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              {selectedRiskLevel.icon}
            </div>
            <div>
              <p className="text-sm text-white/80">Current Risk Level</p>
              <h3 className="text-2xl font-bold">{selectedRiskLevel.label}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Risk Level Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskLevels.map((level) => (
          <button
            key={level.value}
            onClick={() => handleRiskSelect(level.value)}
            className={`p-6 rounded-xl text-left transition-all duration-200 ${
              selectedRisk === level.value
                ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-500 shadow-lg scale-105'
                : 'bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
            }`}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-lg ${level.color} bg-opacity-20`}>
                {level.icon}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${
                  selectedRisk === level.value 
                    ? 'text-indigo-700 dark:text-indigo-300' 
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {level.label}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {level.description}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                Investment Strategy
              </p>
              <ul className="space-y-1">
                {level.strategy.map((point, index) => (
                  <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full ${level.color}`} />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      {/* Info Box */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-semibold mb-1">Investment Guidance</p>
            <p>
              Your risk tolerance determines the types of investments recommended for you. 
              Consider your financial goals, investment timeline, and comfort with market fluctuations 
              when selecting your risk level. You can change this anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// End of frontend/src/pages/MyData/tabs/RiskToleranceTab.tsx
