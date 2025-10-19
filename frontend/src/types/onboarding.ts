/**
 * FinEdge Onboarding Type Definitions
 * 
 * Defines all interfaces for the user onboarding flow including
 * financial data entries, form state, and API responses.
 * 
 * //@module types/onboarding
 * //@version 1.0.0
 */

// ==================== RISK TOLERANCE ====================

/**
 * Risk tolerance levels matching backend schema
 */
export type RiskToleranceLevel = 
  | 'conservative'
  | 'moderately_conservative'
  | 'moderate'
  | 'moderately_aggressive'
  | 'aggressive';

/**
 * Risk tolerance display information
 */
export interface RiskToleranceOption {
  value: RiskToleranceLevel;
  label: string;
  description: string;
  color: string;
  icon: string;
  strategy: string[];
}

// ==================== INCOME ENTRY ====================

/**
 * Income entry interface matching backend IncomeSchema
 */
export interface IncomeEntry {
  id: string;                                    // Unique identifier (generated client-side)
  source: string;                                // Income source name (e.g., "Salary from TCS")
  amount: number;                                // Income amount
  frequency: 'monthly' | 'yearly' | 'one-time'; // Payment frequency
  category: 'salary' | 'investment' | 'gift' | 'other'; // Income category
  date: string;                                  // Date in ISO format (YYYY-MM-DD)
}

/**
 * Form data for adding/editing income entry
 */
export interface IncomeFormData {
  source: string;
  amount: string;                                // String for form input, converts to number
  frequency: 'monthly' | 'yearly' | 'one-time';
  category: 'salary' | 'investment' | 'gift' | 'other';
  date: string;
}

// ==================== EXPENSE ENTRY ====================

/**
 * Expense entry interface matching backend ExpenseSchema
 */
export interface ExpenseEntry {
  id: string;                                    // Unique identifier
  name: string;                                  // Expense name/description
  amount: number;                                // Expense amount
  category: 'shopping' | 'housing' | 'transport' | 'food' | 'health' | 'travel' | 'utilities' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  date: string;                                  // Date in ISO format
  isEssential: boolean;                          // Whether expense is essential
}

/**
 * Form data for adding/editing expense entry
 */
export interface ExpenseFormData {
  name: string;
  amount: string;
  category: 'shopping' | 'housing' | 'transport' | 'food' | 'health' | 'travel' | 'utilities' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'one-time';
  date: string;
  isEssential: boolean;
}

// ==================== ASSET ENTRY ====================

/**
 * Asset entry interface matching backend AssetSchema
 */
export interface AssetEntry {
  id: string;                                    // Unique identifier
  name: string;                                  // Asset name/description
  value: number;                                 // Current asset value
  category: 'realestate' | 'investments' | 'vehicles' | 'bank' | 'cash' | 'other';
  purchaseDate?: string;                         // Optional purchase date
  appreciationRate?: number;                     // Optional annual appreciation rate (%)
  notes?: string;                                // Optional notes
}

/**
 * Form data for adding/editing asset entry
 */
export interface AssetFormData {
  name: string;
  value: string;
  category: 'realestate' | 'investments' | 'vehicles' | 'bank' | 'cash' | 'other';
  purchaseDate?: string;
  appreciationRate?: string;
  notes?: string;
}

// ==================== LIABILITY ENTRY ====================

/**
 * Liability entry interface matching backend LiabilitySchema
 */
export interface LiabilityEntry {
  id: string;                                    // Unique identifier
  name: string;                                  // Liability name/description
  amount: number;                                // Outstanding liability amount
  category: 'homeloan' | 'carloan' | 'personalloan' | 'creditcard' | 'education' | 'other';
  interestRate?: number;                         // Optional annual interest rate (%)
  dueDate?: string;                              // Optional final due date
  monthlyPayment?: number;                       // Optional monthly payment amount
  notes?: string;                                // Optional notes
}

/**
 * Form data for adding/editing liability entry
 */
export interface LiabilityFormData {
  name: string;
  amount: string;
  category: 'homeloan' | 'carloan' | 'personalloan' | 'creditcard' | 'education' | 'other';
  interestRate?: string;
  dueDate?: string;
  monthlyPayment?: string;
  notes?: string;
}

// ==================== ONBOARDING STATE ====================

/**
 * Complete onboarding data state
 */
export interface OnboardingData {
  riskTolerance: RiskToleranceLevel | null;     // Selected risk tolerance
  income: IncomeEntry[];                         // List of income entries
  expenses: ExpenseEntry[];                      // List of expense entries
  assets: AssetEntry[];                          // List of asset entries
  liabilities: LiabilityEntry[];                 // List of liability entries
}

/**
 * Onboarding step identifier
 */
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Onboarding context interface
 */
export interface OnboardingContextType {
  // State
  currentStep: OnboardingStep;                   // Current step (1-6)
  data: OnboardingData;                          // All onboarding data
  isSubmitting: boolean;                         // Is form being submitted
  error: string | null;                          // Error message if any
  
  // Navigation
  goToNextStep: () => void;                      // Move to next step
  goToPreviousStep: () => void;                  // Move to previous step
  goToStep: (step: OnboardingStep) => void;      // Jump to specific step
  
  // Data updates
  updateRiskTolerance: (risk: RiskToleranceLevel) => void;
  addIncome: (income: IncomeEntry) => void;
  updateIncome: (id: string, income: IncomeEntry) => void;
  deleteIncome: (id: string) => void;
  addExpense: (expense: ExpenseEntry) => void;
  updateExpense: (id: string, expense: ExpenseEntry) => void;
  deleteExpense: (id: string) => void;
  addAsset: (asset: AssetEntry) => void;
  updateAsset: (id: string, asset: AssetEntry) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: LiabilityEntry) => void;
  updateLiability: (id: string, liability: LiabilityEntry) => void;
  deleteLiability: (id: string) => void;
  
  // Submit
  submitOnboarding: () => Promise<void>;         // Submit complete onboarding data
  
  // Validation
  canProceedToNextStep: () => boolean;           // Check if can proceed to next step
}

// ==================== API RESPONSE TYPES ====================

/**
 * Onboarding status response from backend
 */
export interface OnboardingStatusResponse {
  onboardingCompleted: boolean;
  onboardingStep: number;
  profile: any;                                  // User profile data
}

/**
 * Onboarding completion request payload
 */
export interface OnboardingCompletionPayload {
  clerkUserId: string;
  riskTolerance: RiskToleranceLevel;
  income: IncomeEntry[];
  expenses: ExpenseEntry[];
  assets: AssetEntry[];
  liabilities: LiabilityEntry[];
}

/**
 * Onboarding completion response
 */
export interface OnboardingCompletionResponse {
  success: boolean;
  message: string;
  profileId?: string;
}

// End of frontend/src/types/onboarding.ts
