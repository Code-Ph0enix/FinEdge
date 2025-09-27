/**
 * Schema Compatibility Validation for FinEdge Real-time Integration
 * This file validates that our real-time APIs return data in the exact format expected by frontend components
 * 
 * All type definitions are imported from ../types/index.ts for better organization
 */

import { 
  PortfolioSummary,
  MarketIndicator,
  StockPriceResponse,
  PortfolioAnalysisResponse,
  MarketSummaryResponse,
  SchemaValidation
} from '../types';

// ====== VALIDATION FUNCTIONS ======

/**
 * Validates portfolio summary data structure
 */
export const validatePortfolioSummary = (data: any): SchemaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (typeof data.totalValue !== 'number') errors.push('totalValue must be a number');
  if (typeof data.todayGainLoss !== 'number') errors.push('todayGainLoss must be a number');
  if (typeof data.todayGainLossPercent !== 'number') errors.push('todayGainLossPercent must be a number');
  if (typeof data.totalGainLoss !== 'number') errors.push('totalGainLoss must be a number');
  if (typeof data.totalGainLossPercent !== 'number') errors.push('totalGainLossPercent must be a number');

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates market indicator data structure
 */
export const validateMarketIndicator = (data: any): SchemaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof data.name !== 'string') errors.push('name must be a string');
  if (typeof data.value !== 'number') errors.push('value must be a number');
  if (typeof data.change !== 'number') errors.push('change must be a number');
  if (typeof data.changePercent !== 'number') errors.push('changePercent must be a number');

  return { 
    isValid: errors.length === 0, 
    errors, 
    warnings 
  };
};

/**
 * Validates stock price response data structure
 */
export const validateStockPriceResponse = (data: any): SchemaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (typeof data.symbol !== 'string') errors.push('symbol must be a string');
  if (data.price !== null && typeof data.price !== 'number') {
    errors.push('price must be a number or null');
  }
  
  if (data.timestamp && typeof data.timestamp !== 'string') {
    warnings.push('timestamp should be a string');
  }
  if (data.error && typeof data.error !== 'string') {
    warnings.push('error should be a string');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates portfolio analysis response data structure
 */
export const validatePortfolioAnalysisResponse = (data: any): SchemaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(data.holdings)) errors.push('holdings must be an array');
  if (typeof data.summary !== 'object') errors.push('summary must be an object');

  // Validate each holding in the array
  if (Array.isArray(data.holdings)) {
    data.holdings.forEach((stock: any, index: number) => {
      if (typeof stock.symbol !== 'string') errors.push(`holdings[${index}].symbol must be a string`);
      if (typeof stock.boughtPrice !== 'number') errors.push(`holdings[${index}].boughtPrice must be a number`);
      if (typeof stock.currentPrice !== 'number') errors.push(`holdings[${index}].currentPrice must be a number`);
      if (typeof stock.quantity !== 'number') errors.push(`holdings[${index}].quantity must be a number`);
      if (typeof stock.totalValue !== 'number') errors.push(`holdings[${index}].totalValue must be a number`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates market summary response data structure
 */
export const validateMarketSummaryResponse = (data: any): SchemaValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.indices) {
    errors.push('indices field is required');
    return { isValid: false, errors, warnings };
  }

  // Check if indices is array or object
  if (Array.isArray(data.indices)) {
    data.indices.forEach((index: any, i: number) => {
      if (typeof index.value !== 'number') errors.push(`indices[${i}].value must be a number`);
      if (typeof index.change !== 'number') errors.push(`indices[${i}].change must be a number`);
      if (typeof index.perChange !== 'number') errors.push(`indices[${i}].perChange must be a number`);
      if (typeof index.symbol !== 'string') errors.push(`indices[${i}].symbol must be a string`);
    });
  } else {
    // Handle object format
    Object.keys(data.indices).forEach(key => {
      const index = data.indices[key];
      if (typeof index.value !== 'number') errors.push(`indices.${key}.value must be a number`);
      if (typeof index.change !== 'number') errors.push(`indices.${key}.change must be a number`);
      if (typeof index.perChange !== 'number') errors.push(`indices.${key}.perChange must be a number`);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// ====== COMPATIBILITY CHECKS ======

/**
 * Validates if the real-time data matches expected frontend component schema
 */
export const validateRealTimeCompatibility = (dataType: string, data: any): SchemaValidation => {
  switch (dataType) {
    case 'portfolioSummary':
      return validatePortfolioSummary(data);
    case 'marketIndicator':
      return validateMarketIndicator(data);
    case 'stockPrice':
      return validateStockPriceResponse(data);
    case 'portfolioAnalysis':
      return validatePortfolioAnalysisResponse(data);
    case 'marketSummary':
      return validateMarketSummaryResponse(data);
    default:
      return {
        isValid: false,
        errors: [`Unknown data type: ${dataType}`],
        warnings: []
      };
  }
};

/**
 * Logs validation results for debugging
 */
export const logValidationResults = (dataType: string, validation: SchemaValidation): void => {
  if (!validation.isValid) {
    console.error(`❌ ${dataType} validation failed:`, validation.errors);
  }
  if (validation.warnings && validation.warnings.length > 0) {
    console.warn(`⚠️ ${dataType} validation warnings:`, validation.warnings);
  }
  if (validation.isValid && (!validation.warnings || validation.warnings.length === 0)) {
    console.log(`✅ ${dataType} validation passed`);
  }
};