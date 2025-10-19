/**
 * FinEdge Onboarding Page
 * 
 * Main onboarding flow controller that wraps steps in OnboardingProvider
 * and renders the appropriate step based on current progress.
 * 
 * @module pages/Onboarding
 * @version 1.0.0
 */

import React from 'react';
import { OnboardingProvider } from '../context/OnboardingContext';
import OnboardingLayout from '../components/onboarding/OnboardingLayout';
import RiskToleranceStep from '../components/onboarding/steps/RiskToleranceStep';
import IncomeStep from '../components/onboarding/steps/IncomeStep';
import ExpensesStep from '../components/onboarding/steps/ExpensesStep';
import AssetsStep from '../components/onboarding/steps/AssetsStep';
import LiabilitiesStep from '../components/onboarding/steps/LiabilitiesStep';
import { useOnboarding } from '../context/OnboardingContext';
import ReviewStep from '../components/onboarding/steps/ReviewStep';


// Wrapper component to use onboarding context
const OnboardingContent: React.FC = () => {
  const { currentStep } = useOnboarding();

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <OnboardingLayout
            title="What's Your Risk Tolerance?"
            description="Help us understand your comfort level with investment risk. This will guide our recommendations."
          >
            <RiskToleranceStep />
          </OnboardingLayout>
        );
      
      case 2:
        return (
          <OnboardingLayout
            title="Add Your Income Sources"
            description="Let's start by understanding your income. Add all sources of income you receive."
          >
            <IncomeStep />
          </OnboardingLayout>
        );
      
      case 3:
        return (
          <OnboardingLayout
            title="Track Your Expenses"
            description="Add your regular expenses to get a complete financial picture."
          >
            <ExpensesStep />
          </OnboardingLayout>
        );
      
      case 4:
        return (
          <OnboardingLayout
            title="List Your Assets"
            description="Add all your assets including properties, investments, and savings."
          >
            <AssetsStep />
          </OnboardingLayout>
        );
      
      case 5:
        return (
          <OnboardingLayout
            title="Add Your Liabilities"
            description="Include any loans, debts, or financial obligations you have."
          >
            <LiabilitiesStep />
          </OnboardingLayout>
        );
        
        case 6:
            return (
                <OnboardingLayout
                    title="Review & Submit"
                    description="Review your financial information before submitting."
                    showNext={false}
                >
                <ReviewStep />
                </OnboardingLayout>
            );

      
      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

// Main Onboarding Page with Provider
const Onboarding: React.FC = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};

export default Onboarding;

// End of frontend/src/pages/Onboarding.tsx
