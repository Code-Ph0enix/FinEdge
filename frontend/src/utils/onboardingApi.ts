/**
 * FinEdge Onboarding API Utilities
 * 
 * Handles all API calls related to user onboarding including
 * status checks, data submission, and CRUD operations.
 * 
 * @module utils/onboardingApi
 * @version 1.0.0
 */

import { SERVER_URL } from './utils.ts';
import type {
  OnboardingStatusResponse,
  OnboardingCompletionPayload,
  OnboardingCompletionResponse,
  IncomeEntry,
  ExpenseEntry,
  AssetEntry,
  LiabilityEntry,
} from '../types/onboarding';

// ==================== ONBOARDING STATUS & COMPLETION ====================

/**
 * Check if user has completed onboarding
 * 
 * @param clerkUserId - User's Clerk authentication ID
 * @returns Onboarding status and profile data
 */
export const checkOnboardingStatus = async (
  clerkUserId: string
): Promise<OnboardingStatusResponse> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/onboarding/status?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    throw error;
  }
};

/**
 * Submit complete onboarding data to backend
 * 
 * @param payload - Complete onboarding data including all entries
 * @returns Success status and profile ID
 */
export const completeOnboarding = async (
  payload: OnboardingCompletionPayload
): Promise<OnboardingCompletionResponse> => {
  try {
    const response = await fetch(`${SERVER_URL}/api/onboarding/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error completing onboarding:', error);
    throw error;
  }
};

// ==================== USER PROFILE DATA ====================

/**
 * Get complete user profile with all financial data
 * 
 * @param clerkUserId - User's Clerk ID
 * @returns Complete user profile including all entries
 */
export const getUserProfile = async (clerkUserId: string) => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/user-profile?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
};

// ==================== INCOME CRUD ====================

/**
 * Get all income entries for user
 */
export const getIncome = async (clerkUserId: string): Promise<IncomeEntry[]> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/user-profile/income?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.income || [];
  } catch (error) {
    console.error('Error fetching income:', error);
    throw error;
  }
};

/**
 * Add new income entry
 */
export const addIncome = async (
  clerkUserId: string,
  income: Omit<IncomeEntry, 'id'>
) => {
  try {
    const response = await fetch(`${SERVER_URL}/api/user-profile/income`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerkUserId, ...income }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error adding income:', error);
    throw error;
  }
};

// ==================== EXPENSE CRUD ====================

/**
 * Get all expense entries for user
 */
export const getExpenses = async (clerkUserId: string): Promise<ExpenseEntry[]> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/user-profile/expenses?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.expenses || [];
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// ==================== ASSET CRUD ====================

/**
 * Get all asset entries for user
 */
export const getAssets = async (clerkUserId: string): Promise<AssetEntry[]> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/user-profile/assets?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.assets || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    throw error;
  }
};

// ==================== LIABILITY CRUD ====================

/**
 * Get all liability entries for user
 */
export const getLiabilities = async (
  clerkUserId: string
): Promise<LiabilityEntry[]> => {
  try {
    const response = await fetch(
      `${SERVER_URL}/api/user-profile/liabilities?clerkUserId=${clerkUserId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.liabilities || [];
  } catch (error) {
    console.error('Error fetching liabilities:', error);
    throw error;
  }
};

// ==================== VALIDATION HELPERS ====================

/**
 * Validate if onboarding data is complete and ready to submit
 */
export const validateOnboardingData = (data: OnboardingCompletionPayload): boolean => {
  // Risk tolerance is required
  if (!data.riskTolerance) {
    return false;
  }

  // At least one entry in each category is required
  if (
    data.income.length === 0 ||
    data.expenses.length === 0 ||
    data.assets.length === 0 ||
    data.liabilities.length === 0
  ) {
    return false;
  }

  return true;
};

// End of frontend/src/utils/onboardingApi.ts
