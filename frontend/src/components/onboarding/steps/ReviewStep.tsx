/**
 * FinEdge Onboarding - Review Step
 * 
 * Step 6: Final review of all entered data before submission to MongoDB.
 * Displays comprehensive summary with edit options.
 * 
 * @module components/onboarding/steps/ReviewStep
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { CheckCircle2, Edit2, TrendingUp, TrendingDown, Wallet, AlertTriangle } from 'lucide-react';

const ReviewStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, goToStep, submitOnboarding, isSubmitting, error } = useOnboarding();

  // Calculate totals
  const totalIncome = data.income.reduce(
    (sum, i) => sum + (i.frequency === 'monthly' ? i.amount * 12 : i.frequency === 'yearly' ? i.amount : 0),
    0
  );
  const totalExpenses = data.expenses.reduce(
    (sum, e) => sum + (e.frequency === 'monthly' ? e.amount * 12 : e.frequency === 'yearly' ? e.amount : 0),
    0
  );
  const totalAssets = data.assets.reduce((sum, a) => sum + a.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, l) => sum + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  const annualSavings = totalIncome - totalExpenses;

  const riskLabels = {
    conservative: 'Conservative',
    moderately_conservative: 'Moderately Conservative',
    moderate: 'Moderate',
    moderately_aggressive: 'Moderately Aggressive',
    aggressive: 'Aggressive',
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-green-900/20 border border-green-800' : 'bg-green-50 border border-green-200'}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`w-6 h-6 mt-0.5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
          <div>
            <p className={`font-semibold ${theme === 'dark' ? 'text-green-300' : 'text-green-900'}`}>
              You're all set!
            </p>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-green-200' : 'text-green-700'}`}>
              Review your financial profile below. You can edit any section before submitting.
            </p>
          </div>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Risk Tolerance */}
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Risk Tolerance
            </h3>
            <button
              onClick={() => goToStep(1)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-indigo-600" />
            </button>
          </div>
          <p className={`text-lg font-bold ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
            {data.riskTolerance ? riskLabels[data.riskTolerance] : 'Not selected'}
          </p>
        </div>

        {/* Net Worth */}
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <Wallet className={`w-5 h-5 ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-600'}`} />
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Net Worth
            </h3>
          </div>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ₹{netWorth.toLocaleString('en-IN')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Assets: ₹{totalAssets.toLocaleString('en-IN')} | Liabilities: ₹{totalLiabilities.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Annual Income */}
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className={`w-5 h-5 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Annual Income
            </h3>
          </div>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
            ₹{totalIncome.toLocaleString('en-IN')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.income.length} income source(s)
          </p>
        </div>

        {/* Annual Expenses */}
        <div className={`p-5 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className={`w-5 h-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Annual Expenses
            </h3>
          </div>
          <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
            ₹{totalExpenses.toLocaleString('en-IN')}
          </p>
          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {data.expenses.length} expense(s) tracked
          </p>
        </div>
      </div>

      {/* Savings Rate */}
      <div className={`p-5 rounded-lg ${annualSavings >= 0 ? (theme === 'dark' ? 'bg-green-900/20' : 'bg-green-50') : (theme === 'dark' ? 'bg-red-900/20' : 'bg-red-50')}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Annual Savings
            </h3>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {annualSavings >= 0 ? 'Positive cash flow' : 'Budget deficit'}
            </p>
          </div>
          <p className={`text-2xl font-bold ${annualSavings >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ₹{annualSavings.toLocaleString('en-IN')}
          </p>
        </div>
        <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${annualSavings >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
            style={{ width: `${Math.min(100, Math.abs((annualSavings / totalIncome) * 100))}%` }}
          />
        </div>
        <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          Savings Rate: {totalIncome > 0 ? ((annualSavings / totalIncome) * 100).toFixed(1) : 0}%
        </p>
      </div>

      {/* Detailed Sections */}
      <div className="space-y-4">
        {/* Income Section */}
        <div className={`p-5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Income Sources ({data.income.length})
            </h3>
            <button
              onClick={() => goToStep(2)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {data.income.map((income) => (
              <div key={income.id} className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>{income.source}</span>
                <span className="font-semibold">₹{income.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Expenses Section */}
        <div className={`p-5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Expenses ({data.expenses.length})
            </h3>
            <button
              onClick={() => goToStep(3)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {data.expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>{expense.name}</span>
                <span className="font-semibold">₹{expense.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
            {data.expenses.length > 5 && (
              <p className="text-xs text-gray-500">And {data.expenses.length - 5} more...</p>
            )}
          </div>
        </div>

        {/* Assets Section */}
        <div className={`p-5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Assets ({data.assets.length})
            </h3>
            <button
              onClick={() => goToStep(4)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {data.assets.map((asset) => (
              <div key={asset.id} className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>{asset.name}</span>
                <span className="font-semibold text-green-600 dark:text-green-400">₹{asset.value.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Liabilities Section */}
        <div className={`p-5 rounded-lg border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Liabilities ({data.liabilities.length})
            </h3>
            <button
              onClick={() => goToStep(5)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          </div>
          <div className="space-y-2">
            {data.liabilities.map((liability) => (
              <div key={liability.id} className={`flex justify-between text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                <span>{liability.name}</span>
                <span className="font-semibold text-red-600 dark:text-red-400">₹{liability.amount.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-red-900/20 border border-red-800' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            <p className={`text-sm ${theme === 'dark' ? 'text-red-200' : 'text-red-700'}`}>
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={submitOnboarding}
        disabled={isSubmitting}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
          isSubmitting
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-xl hover:scale-105'
        }`}
      >
        {isSubmitting ? 'Submitting...' : '✨ Complete Onboarding & Get Started'}
      </button>
    </div>
  );
};

export default ReviewStep;

// End of frontend/src/components/onboarding/steps/ReviewStep.tsx
