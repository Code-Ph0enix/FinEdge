/**
 * FinEdge Onboarding - Risk Tolerance Step
 * 
 * Step 1: User selects their investment risk tolerance level
 * from 5 predefined options with detailed descriptions.
 * 
 * @module components/onboarding/steps/RiskToleranceStep
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { useOnboarding } from '../../../context/OnboardingContext';
import { Shield, TrendingUp, BarChart3, TrendingDown, AlertTriangle } from 'lucide-react';
import type { RiskToleranceLevel, RiskToleranceOption } from '../../../types/onboarding';

const RiskToleranceStep: React.FC = () => {
  const { theme } = useTheme();
  const { data, updateRiskTolerance } = useOnboarding();

  // Risk tolerance options with FinEdge theme colors
  const riskOptions: RiskToleranceOption[] = [
    {
      value: 'conservative',
      label: 'Conservative',
      description: 'Focus on preserving capital with minimal risk tolerance',
      color: 'bg-blue-500',
      icon: '🛡️',
      strategy: [
        'Majority in bonds and fixed-income securities',
        'High-quality, investment-grade investments',
        'Capital preservation is the primary goal',
        'Suitable for short-term financial goals',
      ],
    },
    {
      value: 'moderately_conservative',
      label: 'Moderately Conservative',
      description: 'Emphasis on stability with some growth potential',
      color: 'bg-cyan-500',
      icon: '📊',
      strategy: [
        '60-70% in bonds and fixed income',
        '30-40% in diversified equities',
        'Balanced approach to risk and return',
        'Suitable for medium-term goals (3-5 years)',
      ],
    },
    {
      value: 'moderate',
      label: 'Moderate',
      description: 'Balanced approach between growth and stability',
      color: 'bg-indigo-500',
      icon: '⚖️',
      strategy: [
        'Equal balance between stocks and bonds',
        'Diversified across sectors and asset classes',
        'Moderate risk for moderate returns',
        'Suitable for 5-10 year investment horizon',
      ],
    },
    {
      value: 'moderately_aggressive',
      label: 'Moderately Aggressive',
      description: 'Growth-oriented with acceptance of market volatility',
      color: 'bg-orange-500',
      icon: '📈',
      strategy: [
        '70-80% in growth stocks and equities',
        '20-30% in bonds for stability',
        'Focus on capital appreciation',
        'Suitable for long-term goals (10+ years)',
      ],
    },
    {
      value: 'aggressive',
      label: 'Aggressive',
      description: 'Maximum growth potential with high risk tolerance',
      color: 'bg-red-500',
      icon: '🚀',
      strategy: [
        'Primarily in high-growth stocks',
        'May include emerging markets and sectors',
        'Willing to accept significant short-term volatility',
        'Suitable for very long-term goals (15+ years)',
      ],
    },
  ];

  const handleSelect = (value: RiskToleranceLevel) => {
    updateRiskTolerance(value);
  };

  return (
    <div className="space-y-6">
      {/* Introduction Text */}
      <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-indigo-900/20 border border-indigo-800' : 'bg-indigo-50 border border-indigo-200'}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 mt-0.5 ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`} />
          <div>
            <p className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-300' : 'text-indigo-900'}`}>
              Understanding Risk Tolerance
            </p>
            <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-indigo-200' : 'text-indigo-700'}`}>
              Your risk tolerance helps us provide personalized investment recommendations.
              Consider your investment timeline, financial goals, and comfort with market volatility.
            </p>
          </div>
        </div>
      </div>

      {/* Risk Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {riskOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`text-left p-6 rounded-xl transition-all duration-200 ${
              data.riskTolerance === option.value
                ? `ring-2 ring-indigo-600 shadow-lg ${
                    theme === 'dark' ? 'bg-indigo-900/30' : 'bg-indigo-50'
                  }`
                : `${
                    theme === 'dark'
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-50 hover:bg-gray-100'
                  } hover:shadow-md`
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${option.color} rounded-lg flex items-center justify-center text-2xl`}>
                  {option.icon}
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {option.label}
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {option.description}
                  </p>
                </div>
              </div>

              {/* Selection Indicator */}
              {data.riskTolerance === option.value && (
                <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Strategy Points */}
            <div className="space-y-2 mt-4">
              {option.strategy.map((point, index) => (
                <div key={index} className="flex items-start gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full mt-2 ${option.color}`} />
                  <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </button>
        ))}
      </div>

      {/* Help Text */}
      <div className={`text-center p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          💡 Not sure? Most investors with a 5-10 year timeline choose{' '}
          <span className="font-semibold text-indigo-600">Moderate</span> risk tolerance.
        </p>
      </div>
    </div>
  );
};

export default RiskToleranceStep;

// End of frontend/src/components/onboarding/steps/RiskToleranceStep.tsx
