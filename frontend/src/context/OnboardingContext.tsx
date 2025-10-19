/**
 * FinEdge Onboarding Context
 * 
 * Provides global state management for the onboarding flow including
 * step navigation, data management, and submission logic.
 * 
 * @module contexts/OnboardingContext
 * @version 1.0.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import type {
  OnboardingContextType,
  OnboardingData,
  OnboardingStep,
  RiskToleranceLevel,
  IncomeEntry,
  ExpenseEntry,
  AssetEntry,
  LiabilityEntry,
} from '../types/onboarding';
import { completeOnboarding } from '../utils/onboardingApi';

// Create context
const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

// ==================== PROVIDER COMPONENT ====================

/**
 * OnboardingProvider component
 * Wraps the onboarding flow and provides state management
 */
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const navigate = useNavigate();

  // State
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Onboarding data state
  const [data, setData] = useState<OnboardingData>({
    riskTolerance: null,
    income: [],
    expenses: [],
    assets: [],
    liabilities: [],
  });

  // ==================== NAVIGATION ====================

  const goToNextStep = useCallback(() => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
      setError(null);
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
      setError(null);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: OnboardingStep) => {
    setCurrentStep(step);
    setError(null);
  }, []);

  // ==================== DATA UPDATES ====================

  const updateRiskTolerance = useCallback((risk: RiskToleranceLevel) => {
    setData((prev) => ({ ...prev, riskTolerance: risk }));
  }, []);

  // Income operations
  const addIncome = useCallback((income: IncomeEntry) => {
    setData((prev) => ({
      ...prev,
      income: [...prev.income, income],
    }));
  }, []);

  const updateIncome = useCallback((id: string, income: IncomeEntry) => {
    setData((prev) => ({
      ...prev,
      income: prev.income.map((item) => (item.id === id ? income : item)),
    }));
  }, []);

  const deleteIncome = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      income: prev.income.filter((item) => item.id !== id),
    }));
  }, []);

  // Expense operations
  const addExpense = useCallback((expense: ExpenseEntry) => {
    setData((prev) => ({
      ...prev,
      expenses: [...prev.expenses, expense],
    }));
  }, []);

  const updateExpense = useCallback((id: string, expense: ExpenseEntry) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.map((item) => (item.id === id ? expense : item)),
    }));
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((item) => item.id !== id),
    }));
  }, []);

  // Asset operations
  const addAsset = useCallback((asset: AssetEntry) => {
    setData((prev) => ({
      ...prev,
      assets: [...prev.assets, asset],
    }));
  }, []);

  const updateAsset = useCallback((id: string, asset: AssetEntry) => {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.map((item) => (item.id === id ? asset : item)),
    }));
  }, []);

  const deleteAsset = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      assets: prev.assets.filter((item) => item.id !== id),
    }));
  }, []);

  // Liability operations
  const addLiability = useCallback((liability: LiabilityEntry) => {
    setData((prev) => ({
      ...prev,
      liabilities: [...prev.liabilities, liability],
    }));
  }, []);

  const updateLiability = useCallback((id: string, liability: LiabilityEntry) => {
    setData((prev) => ({
      ...prev,
      liabilities: prev.liabilities.map((item) => (item.id === id ? liability : item)),
    }));
  }, []);

  const deleteLiability = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      liabilities: prev.liabilities.filter((item) => item.id !== id),
    }));
  }, []);

  // ==================== VALIDATION ====================

  const canProceedToNextStep = useCallback((): boolean => {
    switch (currentStep) {
      case 1: // Risk Tolerance
        return data.riskTolerance !== null;
      case 2: // Income
        return data.income.length > 0;
      case 3: // Expenses
        return data.expenses.length > 0;
      case 4: // Assets
        return data.assets.length > 0;
      case 5: // Liabilities
        return data.liabilities.length > 0;
      case 6: // Review
        return (
          data.riskTolerance !== null &&
          data.income.length > 0 &&
          data.expenses.length > 0 &&
          data.assets.length > 0 &&
          data.liabilities.length > 0
        );
      default:
        return false;
    }
  }, [currentStep, data]);

  // ==================== SUBMISSION ====================

  const submitOnboarding = useCallback(async () => {
    if (!user?.id) {
      setError('User not authenticated');
      return;
    }

    if (!data.riskTolerance) {
      setError('Please select a risk tolerance level');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        clerkUserId: user.id,
        riskTolerance: data.riskTolerance,
        income: data.income,
        expenses: data.expenses,
        assets: data.assets,
        liabilities: data.liabilities,
      };

      const response = await completeOnboarding(payload);

      if (response.success) {
        // Redirect to home page after successful onboarding
        navigate('/');
      } else {
        setError(response.message || 'Failed to complete onboarding');
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setError('An error occurred while submitting your data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, data, navigate]);

  // ==================== CONTEXT VALUE ====================

  const value: OnboardingContextType = {
    // State
    currentStep,
    data,
    isSubmitting,
    error,

    // Navigation
    goToNextStep,
    goToPreviousStep,
    goToStep,

    // Data updates
    updateRiskTolerance,
    addIncome,
    updateIncome,
    deleteIncome,
    addExpense,
    updateExpense,
    deleteExpense,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,

    // Submit
    submitOnboarding,

    // Validation
    canProceedToNextStep,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

// ==================== CUSTOM HOOK ====================

/**
 * useOnboarding hook
 * Access onboarding context in any component
 * 
 * @throws Error if used outside OnboardingProvider
 */
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  
  return context;
};

// End of frontend/src/contexts/OnboardingContext.tsx
