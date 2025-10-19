/**
 * FinEdge Onboarding Layout Component
 * 
 * Provides consistent layout wrapper for all onboarding steps including
 * progress indicator, navigation buttons, and responsive design.
 * 
 * @module components/onboarding/OnboardingLayout
 * @version 1.0.0
 */

import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useOnboarding } from '../../context/OnboardingContext';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  title: string;
  description: string;
  showBack?: boolean;
  showNext?: boolean;
  nextLabel?: string;
  onNext?: () => void;
}

const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  title,
  description,
  showBack = true,
  showNext = true,
  nextLabel = 'Next',
  onNext,
}) => {
  const { theme } = useTheme();
  const {
    currentStep,
    goToPreviousStep,
    goToNextStep,
    canProceedToNextStep,
  } = useOnboarding();

  const steps = [
    { number: 1, label: 'Risk Tolerance' },
    { number: 2, label: 'Income' },
    { number: 3, label: 'Expenses' },
    { number: 4, label: 'Assets' },
    { number: 5, label: 'Liabilities' },
    { number: 6, label: 'Review' },
  ];

  const handleNext = () => {
    if (onNext) {
      onNext();
    } else {
      goToNextStep();
    }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header with Progress */}
      <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Logo */}
          <div className="flex items-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">F</span>
              </div>
              <span className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                FinEdge
              </span>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <React.Fragment key={step.number}>
                  {/* Step Circle */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 ${
                        step.number === currentStep
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/50'
                          : step.number < currentStep
                          ? 'bg-green-500 text-white'
                          : theme === 'dark'
                          ? 'bg-gray-700 text-gray-400'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium hidden sm:block ${
                        step.number === currentStep
                          ? 'text-indigo-600'
                          : theme === 'dark'
                          ? 'text-gray-400'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                        step.number < currentStep
                          ? 'bg-green-500'
                          : theme === 'dark'
                          ? 'bg-gray-700'
                          : 'bg-gray-300'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress Bar */}
            <div className={`w-full h-2 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} rounded-full overflow-hidden`}>
              <div
                className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / 6) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8`}>
          {/* Title and Description */}
          <div className="mb-8">
            <h1 className={`text-3xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h1>
            <p className={`text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              {description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">{children}</div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
            {showBack && currentStep > 1 ? (
              <button
                onClick={goToPreviousStep}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {showNext && (
              <button
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-200 ml-auto ${
                  canProceedToNextStep()
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:shadow-indigo-500/50 hover:scale-105'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {nextLabel}
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator (Mobile) */}
        <div className="text-center mt-4">
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Step {currentStep} of 6
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout;

// End of frontend/src/components/onboarding/OnboardingLayout.tsx
