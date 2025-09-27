import { stockApiService } from '../services/stockApi';

// Static data that doesn't change frequently
export const monthlyData = [
  { name: 'Jan', value: 4000, expenses: 2800, savings: 1200 },
  { name: 'Feb', value: 3000, expenses: 2600, savings: 400 },
  { name: 'Mar', value: 5000, expenses: 2900, savings: 2100 },
  { name: 'Apr', value: 2780, expenses: 2500, savings: 280 },
  { name: 'May', value: 1890, expenses: 2400, savings: -510 },
  { name: 'Jun', value: 2390, expenses: 2200, savings: 190 }
];

export const assetAllocation = [
  { name: 'Indian Stocks', value: 45, amount: 4500000, color: '#4F46E5' },
  { name: 'Indian Bonds', value: 25, amount: 2500000, color: '#10B981' },
  { name: 'International Markets', value: 15, amount: 1500000, color: '#F59E0B' },
  { name: 'Real Estate (India)', value: 10, amount: 1000000, color: '#EF4444' },
  { name: 'Cash & Others', value: 5, amount: 500000, color: '#6B7280' }
];

export const incomeStreams = [
  { source: 'Primary Salary', amount: 8500, percentage: 70 },
  { source: 'Investments', amount: 2000, percentage: 16 },
  { source: 'Side Business', amount: 1200, percentage: 10 },
  { source: 'Rental Income', amount: 500, percentage: 4 }
];

export const expenseCategories = [
  { category: 'Housing', amount: 2500, percentage: 35 },
  { category: 'Transportation', amount: 800, percentage: 11 },
  { category: 'Food', amount: 1000, percentage: 14 },
  { category: 'Utilities', amount: 400, percentage: 6 },
  { category: 'Insurance', amount: 300, percentage: 4 },
  { category: 'Entertainment', amount: 600, percentage: 8 },
  { category: 'Savings', amount: 1500, percentage: 21 }
];

export const liabilities = [
  {
    type: 'Home Loan',
    amount: 5000000,
    monthlyPayment: 42000,
    interestRate: 8.5,
    paid: 1500000,
    isSecured: true,
    description: 'Home loan from SBI'
  },
  {
    type: 'Car Loan',
    amount: 800000,
    monthlyPayment: 15000,
    interestRate: 9.5,
    paid: 300000,
    isSecured: true,
    description: 'Car loan from HDFC'
  }
];

export const recentActivity = [
  {
    type: 'Stock Purchase',
    amount: '+ ₹50,000',
    date: '2024-01-25',
    status: 'Completed',
    category: 'HDFC Bank',
    balance: '₹4,50,000'
  },
  {
    type: 'SIP Investment',
    amount: '+ ₹25,000',
    date: '2024-01-20',
    status: 'Completed',
    category: 'Mutual Funds',
    balance: '₹4,00,000'
  }
];

export const investmentGoals = [
  { name: 'Retirement', target: 2000000, current: 847293, timeline: '20 years' },
  { name: 'House Down Payment', target: 100000, current: 45000, timeline: '3 years' },
  { name: 'Emergency Fund', target: 50000, current: 35000, timeline: '1 year' },
  { name: 'Children Education', target: 150000, current: 25000, timeline: '10 years' }
];

export const riskMetrics = {
  volatility: 12.5,
  sharpeRatio: 1.8,
  maxDrawdown: -15.2,
  beta: 0.85,
  alpha: 2.3
};

// Example portfolio holdings for real-time calculations
export const userPortfolioHoldings = [
  { symbol: 'RELIANCE.NS', quantity: 50, boughtPrice: 2456.75 },
  { symbol: 'TCS.NS', quantity: 25, boughtPrice: 3789.20 },
  { symbol: 'HDFCBANK.NS', quantity: 30, boughtPrice: 1654.80 },
  { symbol: 'INFY.NS', quantity: 40, boughtPrice: 1456.25 },
  { symbol: 'ICICIBANK.NS', quantity: 35, boughtPrice: 1089.65 }
];

// Dynamic data functions that fetch real-time information

/**
 * Get real-time portfolio summary
 */
export const getPortfolioSummary = async () => {
  try {
    // Get current portfolio value
    const analysis = await stockApiService.analyzePortfolio(userPortfolioHoldings);
    
    // Calculate total portfolio value
    const totalValue = analysis.stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalProfitLoss = analysis.totalProfitOrLoss;
    const monthlyChange = ((totalProfitLoss / (totalValue - totalProfitLoss)) * 100);

    return {
      totalValue: Math.round(totalValue),
      monthlyReturns: Math.round(totalProfitLoss),
      riskScore: 72, // This would be calculated based on portfolio composition
      goalProgress: 42.3, // Based on investment goals progress
      monthlyChange: Math.round(monthlyChange * 100) / 100,
      returnsChange: 8.2 // This would be calculated based on historical data
    };
  } catch (error) {
    console.error('Error fetching portfolio summary:', error);
    // Fallback to static data
    return {
      totalValue: 847293,
      monthlyReturns: 4483,
      riskScore: 72,
      goalProgress: 42.3,
      monthlyChange: 12.5,
      returnsChange: 8.2
    };
  }
};

/**
 * Get real-time market indicators
 */
export const getMarketIndicators = async () => {
  try {
    const marketSummary = await stockApiService.getMarketSummary();
    
    return [
      {
        name: 'NIFTY 50',
        value: marketSummary.NIFTY.value.toLocaleString('en-IN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }),
        trend: marketSummary.NIFTY.change > 0 ? 'up' : 'down',
        change: marketSummary.NIFTY.change,
        perChange: marketSummary.NIFTY.perChange
      },
      {
        name: 'SENSEX',
        value: marketSummary.SENSEX.value.toLocaleString('en-IN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }),
        trend: marketSummary.SENSEX.change > 0 ? 'up' : 'down',
        change: marketSummary.SENSEX.change,
        perChange: marketSummary.SENSEX.perChange
      },
      {
        name: 'BANK NIFTY',
        value: marketSummary.BANKNIFTY.value.toLocaleString('en-IN', { 
          minimumFractionDigits: 2, 
          maximumFractionDigits: 2 
        }),
        trend: marketSummary.BANKNIFTY.change > 0 ? 'up' : 'down',
        change: marketSummary.BANKNIFTY.change,
        perChange: marketSummary.BANKNIFTY.perChange
      }
    ];
  } catch (error) {
    console.error('Error fetching market indicators:', error);
    // Fallback to static data
    return [
      { name: 'NIFTY 50', value: '22,378.40', trend: 'up' },
      { name: 'SENSEX', value: '73,745.35', trend: 'up' },
      { name: 'BANK NIFTY', value: '46,875.20', trend: 'down' },
      { name: 'NIFTY IT', value: '33,456.80', trend: 'up' }
    ];
  }
};

/**
 * Get real-time performance data for charts
 */
export const getPerformanceData = async () => {
  try {
    // This would typically involve historical data fetching
    // For now, we'll return static data with some real-time adjustments
    const currentValue = await getPortfolioSummary();
    
    return [
      { month: 'Jan', portfolio: 1000000, benchmark: 980000, risk: 950000 },
      { month: 'Feb', portfolio: 1050000, benchmark: 1000000, risk: 980000 },
      { month: 'Mar', portfolio: 1150000, benchmark: 1100000, risk: 1050000 },
      { month: 'Apr', portfolio: 1200000, benchmark: 1150000, risk: 1100000 },
      { month: 'May', portfolio: 1250000, benchmark: 1200000, risk: 1150000 },
      { month: 'Jun', portfolio: currentValue.totalValue, benchmark: 1250000, risk: 1200000 }
    ];
  } catch (error) {
    console.error('Error fetching performance data:', error);
    return [
      { month: 'Jan', portfolio: 1000000, benchmark: 980000, risk: 950000 },
      { month: 'Feb', portfolio: 1050000, benchmark: 1000000, risk: 980000 },
      { month: 'Mar', portfolio: 1150000, benchmark: 1100000, risk: 1050000 },
      { month: 'Apr', portfolio: 1200000, benchmark: 1150000, risk: 1100000 },
      { month: 'May', portfolio: 1250000, benchmark: 1200000, risk: 1150000 },
      { month: 'Jun', portfolio: 1300000, benchmark: 1250000, risk: 1200000 }
    ];
  }
};

// Static fallback data for backwards compatibility
export const portfolioSummary = {
  totalValue: 847293,
  monthlyReturns: 4483,
  riskScore: 72,
  goalProgress: 42.3,
  monthlyChange: 12.5,
  returnsChange: 8.2
};

export const performanceData = [
  { month: 'Jan', portfolio: 1000000, benchmark: 980000, risk: 950000 },
  { month: 'Feb', portfolio: 1050000, benchmark: 1000000, risk: 980000 },
  { month: 'Mar', portfolio: 1150000, benchmark: 1100000, risk: 1050000 },
  { month: 'Apr', portfolio: 1200000, benchmark: 1150000, risk: 1100000 },
  { month: 'May', portfolio: 1250000, benchmark: 1200000, risk: 1150000 },
  { month: 'Jun', portfolio: 1300000, benchmark: 1250000, risk: 1200000 }
];

export const marketIndicators = [
  { name: 'NIFTY 50', value: '22,378.40', trend: 'up' },
  { name: 'SENSEX', value: '73,745.35', trend: 'up' },
  { name: 'BANK NIFTY', value: '46,875.20', trend: 'down' },
  { name: 'NIFTY IT', value: '33,456.80', trend: 'up' }
];