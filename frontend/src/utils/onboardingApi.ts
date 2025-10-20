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













// /**
//  * FinEdge Onboarding API Client
//  * 
//  * Handles all API calls for onboarding flow
//  * 
//  * @module utils/onboardingApi
//  * @version 2.0.0 - FIXED
//  */

// import axios from 'axios';

// // Get server URL from environment or default
// const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

// // Types
// interface OnboardingPayload {
//   clerkUserId: string;
//   riskTolerance: string;
//   income: any[];
//   expenses: any[];
//   assets: any[];
//   liabilities: any[];
// }

// interface OnboardingResponse {
//   success: boolean;
//   message?: string;
//   data?: any;
// }

// /**
//  * ✅ COMPLETE FIXED VERSION
//  * Submit all onboarding data to backend in ONE transaction
//  */
// export const completeOnboarding = async (payload: OnboardingPayload): Promise<OnboardingResponse> => {
//   try {
//     console.log('🚀 Submitting onboarding data:', payload);

//     // Step 1: Save user profile with risk tolerance
//     const profileResponse = await axios.post(`${SERVER_URL}/api/onboarding/complete`, {
//       clerkUserId: payload.clerkUserId,
//       riskTolerance: payload.riskTolerance,
//       onboardingCompleted: true,
//       onboardingStep: 6
//     });

//     console.log('✅ Profile saved:', profileResponse.data);

//     // Step 2: Save all income entries
//     for (const income of payload.income) {
//       try {
//         await axios.post(`${SERVER_URL}/api/user-profile/income`, {
//           clerkUserId: payload.clerkUserId,
//           source: income.source,
//           amount: income.amount,
//           frequency: income.frequency,
//           category: income.category,
//           date: income.date
//         });
//         console.log('✅ Income saved:', income.source);
//       } catch (err) {
//         console.error('❌ Failed to save income:', income, err);
//       }
//     }

//     // Step 3: Save all expense entries
//     for (const expense of payload.expenses) {
//       try {
//         await axios.post(`${SERVER_URL}/api/user-profile/expenses`, {
//           clerkUserId: payload.clerkUserId,
//           name: expense.name,
//           amount: expense.amount,
//           category: expense.category,
//           frequency: expense.frequency,
//           date: expense.date,
//           isEssential: expense.isEssential || false
//         });
//         console.log('✅ Expense saved:', expense.name);
//       } catch (err) {
//         console.error('❌ Failed to save expense:', expense, err);
//       }
//     }

//     // Step 4: Save all asset entries
//     for (const asset of payload.assets) {
//       try {
//         await axios.post(`${SERVER_URL}/api/user-profile/assets`, {
//           clerkUserId: payload.clerkUserId,
//           name: asset.name,
//           value: asset.value,
//           category: asset.category,
//           purchaseDate: asset.purchaseDate,
//           appreciationRate: asset.appreciationRate || 0,
//           notes: asset.notes || ''
//         });
//         console.log('✅ Asset saved:', asset.name);
//       } catch (err) {
//         console.error('❌ Failed to save asset:', asset, err);
//       }
//     }

//     // Step 5: Save all liability entries
//     for (const liability of payload.liabilities) {
//       try {
//         await axios.post(`${SERVER_URL}/api/user-profile/liabilities`, {
//           clerkUserId: payload.clerkUserId,
//           name: liability.name,
//           amount: liability.amount,
//           category: liability.category,
//           interestRate: liability.interestRate || 0,
//           dueDate: liability.dueDate,
//           monthlyPayment: liability.monthlyPayment || 0,
//           notes: liability.notes || ''
//         });
//         console.log('✅ Liability saved:', liability.name);
//       } catch (err) {
//         console.error('❌ Failed to save liability:', liability, err);
//       }
//     }

//     console.log('🎉 Onboarding completed successfully!');

//     return {
//       success: true,
//       message: 'Onboarding completed successfully',
//       data: profileResponse.data
//     };

//   } catch (error: any) {
//     console.error('❌ Onboarding error:', error);
    
//     return {
//       success: false,
//       message: error.response?.data?.error || error.message || 'Failed to complete onboarding'
//     };
//   }
// };

// /**
//  * Check if user has completed onboarding
//  */
// export const checkOnboardingStatus = async (clerkUserId: string): Promise<boolean> => {
//   try {
//     const response = await axios.get(`${SERVER_URL}/api/onboarding/status`, {
//       params: { clerkUserId }
//     });
    
//     return response.data.onboardingCompleted || false;
//   } catch (error) {
//     console.error('Error checking onboarding status:', error);
//     return false;
//   }
// };
