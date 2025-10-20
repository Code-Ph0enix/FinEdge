// // export const SERVER_URL =  "https://2ecd-111-125-219-62.ngrok-free.app"
// export const SERVER_URL: string = "http://127.0.0.1:5000"; 

/**
 * FinEdge Utility Functions
 * 
 * @module utils/utils
 * @version 1.0.0
 */

// Server URL configuration
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

/**
 * Format number as Indian currency
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

/**
 * Format date to YYYY-MM-DD
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
};
