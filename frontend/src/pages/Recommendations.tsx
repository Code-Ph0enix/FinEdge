// Enhanced Investment Recommendations Component
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  TrendingUp, BarChart2, Shield, Briefcase, Building2, 
  Landmark, Wallet, RefreshCw, Sparkles, Clock, Target, 
  AlertCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { SERVER_URL } from '../utils/utils';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface MarketSentiment {
  trend: string;
  fiiFlow: string | number;
  riskLevel: string;
  summary: string;
}

interface StockRecommendation {
  symbol: string;
  name: string;
  currentPrice: number;
  targetPrice?: number;
  expectedReturn: string;
  riskLevel: string;
  sector: string;
  recommendedAllocation: number;
  monthlyInvestment: number;
  reasoning: string;
  keyMetrics?: {
    pe?: number;
    marketCap?: string;
    dividend?: string;
  };
}

interface MutualFundRecommendation {
  name: string;
  category: string;
  nav: number;
  returns1Y: number;
  returns3Y?: number;
  returns5Y?: number;
  riskLevel: string;
  recommendedAllocation: number;
  monthlyInvestment: number;
  reasoning: string;
  rating: number;
}

interface FixedDepositRecommendation {
  bank: string;
  tenure: string;
  interestRate: number;
  minAmount: number;
  recommendedAllocation: number;
  monthlyInvestment: number;
  reasoning: string;
  features: string[];
}

interface BondRecommendation {
  name: string;
  type: string;
  tenure: string;
  interestRate: number;
  minAmount: number;
  recommendedAllocation: number;
  monthlyInvestment: number;
  reasoning: string;
  features: string[];
}

interface RealEstateRecommendation {
  type: string;
  name: string;
  expectedReturn: string;
  lockInPeriod: string;
  minAmount: number;
  recommendedAllocation: number;
  reasoning: string;
  features: string[];
}

interface Recommendations {
  marketSentiment: MarketSentiment;
  stocks: StockRecommendation[];
  mutualFunds: MutualFundRecommendation[];
  fixedDeposits: FixedDepositRecommendation[];
  bonds: BondRecommendation[];
  realEstate: RealEstateRecommendation[];
  actionPlan: string[];
  metadata?: any;
}

interface CacheInfo {
  cached: boolean;
  generatedAt?: string;
  expiresAt?: string;
  ageHours?: number;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') return defaultValue;
  if (typeof value === 'number') return isNaN(value) ? defaultValue : value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^\d.-]/g, '');
    const parsed = cleaned.includes('.') ? parseFloat(cleaned) : parseInt(cleaned);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
};

const safeString = (value: any, defaultValue: string = 'N/A'): string => {
  if (value === null || value === undefined || value === '') return defaultValue;
  return String(value).trim();
};

const formatCurrency = (amount: number): string => {
  return `₹${safeNumber(amount).toLocaleString('en-IN')}`;
};

const getRiskColor = (riskLevel: string): string => {
  const risk = safeString(riskLevel, 'Moderate').toLowerCase();
  if (risk.includes('low')) return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
  if (risk.includes('high')) return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
};

// ============================================
// MAIN COMPONENT
// ============================================

const Recommendations: React.FC = () => {
  const { user, isLoaded } = useUser();

  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ cached: false });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');

  useEffect(() => {
    if (isLoaded && user?.id) {
      loadRecommendations();
    }
  }, [isLoaded, user?.id]);

  const loadRecommendations = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('📥 Loading recommendations for user:', user.id);
      
      const response = await axios.get(`${SERVER_URL}/api/recommendations/get`, {
        params: { clerkUserId: user.id }
      });
      
      if (response.data.success && response.data.recommendations) {
        console.log('✅ Cached recommendations loaded');
        setRecommendations(response.data.recommendations);
        setCacheInfo(response.data.cacheInfo || { cached: true });
      } else {
        console.log('⚠️ No cache found, generating new recommendations');
        await generateRecommendations();
      }
      
    } catch (err: any) {
      console.error('❌ Error loading recommendations:', err);
      // Try generating if loading fails
      await generateRecommendations();
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (forceRefresh: boolean = false) => {
    if (!user?.id) return;
    
    setGenerating(true);
    setError(null);
    
    try {
      console.log('🤖 Generating AI recommendations...');
      
      const response = await axios.post(`${SERVER_URL}/api/recommendations/generate`, {
        clerkUserId: user.id,
        forceRefresh
      });
      
      if (response.data.success) {
        console.log('✅ Recommendations generated successfully');
        setRecommendations(response.data.recommendations);
        setCacheInfo(response.data.cacheInfo || { cached: true });
      } else {
        throw new Error('Failed to generate recommendations');
      }
      
    } catch (err: any) {
      console.error('❌ Error generating recommendations:', err);
      setError(err.response?.data?.error || 'Failed to generate recommendations. Please try again.');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  // Filter functions
  const filterByRisk = (items: any[]): any[] => {
    if (!items || !Array.isArray(items)) return [];
    if (riskFilter === 'all') return items;
    return items.filter(item => {
      const risk = safeString(item.riskLevel, '').toLowerCase();
      return risk.includes(riskFilter.toLowerCase());
    });
  };

  const getFilteredStocks = (): StockRecommendation[] => {
    if (!recommendations?.stocks) return [];
    return filterByRisk(recommendations.stocks).filter(stock => 
      safeNumber(stock.currentPrice) > 0 && safeNumber(stock.monthlyInvestment) > 0
    );
  };

  const getFilteredMutualFunds = (): MutualFundRecommendation[] => {
    if (!recommendations?.mutualFunds) return [];
    return filterByRisk(recommendations.mutualFunds).filter(fund =>
      safeNumber(fund.nav) > 0 && safeNumber(fund.monthlyInvestment) > 0
    );
  };

  const getFilteredFixedDeposits = (): FixedDepositRecommendation[] => {
    if (!recommendations?.fixedDeposits) return [];
    return recommendations.fixedDeposits.filter(fd =>
      safeNumber(fd.interestRate) > 0 && safeNumber(fd.monthlyInvestment) > 0
    );
  };

  const getFilteredBonds = (): BondRecommendation[] => {
    if (!recommendations?.bonds) return [];
    return recommendations.bonds.filter(bond =>
      safeNumber(bond.interestRate) > 0 && safeNumber(bond.monthlyInvestment) > 0
    );
  };

  const getFilteredRealEstate = (): RealEstateRecommendation[] => {
    if (!recommendations?.realEstate) return [];
    return recommendations.realEstate;
  };

  // Check if we should show a category
  const shouldShowCategory = (category: string): boolean => {
    if (activeFilter === 'all') return true;
    return activeFilter === category;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center px-6">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Your Personalized Recommendations
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Analyzing your profile and market conditions...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !recommendations) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something Went Wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => generateRecommendations(true)}
            disabled={generating}
            className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50"
          >
            {generating ? 'Generating...' : 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Smart Investment Recommendations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered investment suggestions tailored for Indian markets
            </p>
          </div>
          
          <button
            onClick={() => generateRecommendations(true)}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            <RefreshCw className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Refreshing...' : 'Refresh Recommendations'}
          </button>
        </div>
        
        {/* Cache info */}
        {cacheInfo.cached && cacheInfo.ageHours !== undefined && cacheInfo.ageHours > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Generated {cacheInfo.ageHours} hour{cacheInfo.ageHours !== 1 ? 's' : ''} ago
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Recommendations refresh automatically every 24 hours
              </p>
            </div>
          </div>
        )}

        {/* Market Sentiment */}
        {recommendations?.marketSentiment && (
          <div className="rounded-2xl shadow-xl p-6 text-white bg-gradient-to-r from-purple-600 to-indigo-600">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BarChart2 className="h-6 w-6" />
              Market Sentiment
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5" />
                  <p className="text-sm font-medium">Market Trend</p>
                </div>
                <p className="text-2xl font-bold">{safeString(recommendations.marketSentiment.trend)}</p>
                <p className="text-sm text-white/80 mt-1">Current direction</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="h-5 w-5" />
                  <p className="text-sm font-medium">FII Flow</p>
                </div>
                <p className="text-2xl font-bold">{safeString(recommendations.marketSentiment.fiiFlow)} Cr</p>
                <p className="text-sm text-white/80 mt-1">Foreign investment</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5" />
                  <p className="text-sm font-medium">Risk Level</p>
                </div>
                <p className="text-2xl font-bold">{safeString(recommendations.marketSentiment.riskLevel)}</p>
                <p className="text-sm text-white/80 mt-1">Market volatility</p>
              </div>
            </div>
            
            <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm leading-relaxed">{safeString(recommendations.marketSentiment.summary)}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Investment Type Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Investment Type
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'all', label: 'All', icon: Briefcase },
                  { id: 'stocks', label: 'Stocks', icon: TrendingUp },
                  { id: 'mutualFunds', label: 'Mutual Funds', icon: BarChart2 },
                  { id: 'fixedDeposits', label: 'Fixed Deposits', icon: Landmark },
                  { id: 'bonds', label: 'Bonds', icon: Wallet },
                  { id: 'realEstate', label: 'Real Estate', icon: Building2 }
                ].map(({ id, label, icon: Icon }) => {
                  const count = id === 'all' ? 0 : 
                    id === 'stocks' ? getFilteredStocks().length :
                    id === 'mutualFunds' ? getFilteredMutualFunds().length :
                    id === 'fixedDeposits' ? getFilteredFixedDeposits().length :
                    id === 'bonds' ? getFilteredBonds().length :
                    getFilteredRealEstate().length;
                  
                  return (
                    <button
                      key={id}
                      onClick={() => setActiveFilter(id)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                        activeFilter === id
                          ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                      {id !== 'all' && count > 0 && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          activeFilter === id ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Risk Level Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 block">
                Risk Level
              </label>
              <div className="flex gap-2">
                {['all', 'Low', 'Moderate', 'High'].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setRiskFilter(risk)}
                    className={`px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                      riskFilter === risk
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {risk === 'all' ? 'All Risks' : risk}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stock Recommendations */}
        {shouldShowCategory('stocks') && getFilteredStocks().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Stock Recommendations ({getFilteredStocks().length})
              </h2>
              <p className="text-indigo-100 mt-1">AI-selected stocks based on your risk profile</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {getFilteredStocks().map((stock, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900"
                >
                  {/* Stock Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {safeString(stock.symbol)}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {safeString(stock.name)}
                      </p>
                      <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-semibold">
                        {safeString(stock.sector)}
                      </span>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getRiskColor(stock.riskLevel)}`}>
                      {safeString(stock.riskLevel)} Risk
                    </div>
                  </div>
                  
                  {/* Price & Returns */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current Price</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stock.currentPrice)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Return</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {safeString(stock.expectedReturn)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Investment Allocation */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation</span>
                      <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                        {safeNumber(stock.recommendedAllocation)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(safeNumber(stock.recommendedAllocation), 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Monthly SIP</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(stock.monthlyInvestment)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Key Metrics */}
                  {stock.keyMetrics && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">P/E</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {safeNumber(stock.keyMetrics.pe, 0).toFixed(1)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Cap</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {safeString(stock.keyMetrics.marketCap)}
                        </p>
                      </div>
                      <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Div</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                          {safeString(stock.keyMetrics.dividend)}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Reasoning */}
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600 p-4 rounded">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                      Why this stock?
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {safeString(stock.reasoning)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mutual Funds */}
        {shouldShowCategory('mutualFunds') && getFilteredMutualFunds().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-6 w-6" />
                Mutual Fund Recommendations ({getFilteredMutualFunds().length})
              </h2>
              <p className="text-purple-100 mt-1">Diversified funds matched to your goals</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredMutualFunds().map((fund, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-purple-300 dark:hover:border-purple-600 transition-all bg-gradient-to-br from-white to-purple-50 dark:from-gray-800 dark:to-purple-900/10"
                >
                  {/* Fund Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                        {safeString(fund.name)}
                      </h3>
                      <span className="inline-block px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs font-semibold">
                        {safeString(fund.category)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`text-xl ${i < safeNumber(fund.rating, 3) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                      ({safeNumber(fund.rating, 3)}/5)
                    </span>
                  </div>
                  
                  {/* NAV */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Current NAV</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(fund.nav)}
                    </p>
                  </div>
                  
                  {/* Returns */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">1Y</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {safeNumber(fund.returns1Y).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">3Y</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {safeNumber(fund.returns3Y).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">5Y</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {safeNumber(fund.returns5Y).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  {/* Allocation */}
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Monthly SIP</span>
                      <span className="text-xl font-bold text-purple-600 dark:text-purple-400">
                        {safeNumber(fund.recommendedAllocation)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(safeNumber(fund.recommendedAllocation), 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Amount</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(fund.monthlyInvestment)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Risk Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${getRiskColor(fund.riskLevel)}`}>
                    {safeString(fund.riskLevel)} Risk
                  </div>
                  
                  {/* Reasoning */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-600 p-4 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                      {safeString(fund.reasoning)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Deposits */}
        {shouldShowCategory('fixedDeposits') && getFilteredFixedDeposits().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Landmark className="h-6 w-6" />
                Fixed Deposits ({getFilteredFixedDeposits().length})
              </h2>
              <p className="text-green-100 mt-1">Safe guaranteed returns for stability</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredFixedDeposits().map((fd, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-green-300 dark:hover:border-green-600 transition-all bg-gradient-to-br from-white to-green-50 dark:from-gray-800 dark:to-green-900/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Landmark className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {safeString(fd.bank)}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Fixed Deposit</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Interest Rate</p>
                      <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {safeNumber(fd.interestRate).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tenure</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {safeString(fd.tenure)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-900/20 dark:to-teal-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation</span>
                      <span className="text-xl font-bold text-green-600 dark:text-green-400">
                        {safeNumber(fd.recommendedAllocation)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                      <div 
                        className="bg-gradient-to-r from-green-600 to-teal-600 h-2 rounded-full transition-all"
                        style={{ width: `${Math.min(safeNumber(fd.recommendedAllocation), 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Monthly</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(fd.monthlyInvestment)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {(fd.features || []).slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{safeString(feature)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-600 p-3 rounded text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {safeString(fd.reasoning)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bonds */}
        {shouldShowCategory('bonds') && getFilteredBonds().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Wallet className="h-6 w-6" />
                Bond Recommendations ({getFilteredBonds().length})
              </h2>
              <p className="text-blue-100 mt-1">Fixed income securities for stable returns</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredBonds().map((bond, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-600 transition-all bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-blue-900/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                      <Wallet className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {safeString(bond.name)}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {safeString(bond.type)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Yield</p>
                      <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {safeNumber(bond.interestRate).toFixed(2)}%
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Tenure</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {safeString(bond.tenure)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation</span>
                      <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {safeNumber(bond.recommendedAllocation)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Monthly</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(bond.monthlyInvestment)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {(bond.features || []).slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <span>{safeString(feature)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-600 p-3 rounded text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {safeString(bond.reasoning)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Real Estate */}
        {shouldShowCategory('realEstate') && getFilteredRealEstate().length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-red-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Building2 className="h-6 w-6" />
                Real Estate Investments ({getFilteredRealEstate().length})
              </h2>
              <p className="text-orange-100 mt-1">Property exposure without large capital</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getFilteredRealEstate().map((re, index) => (
                <div
                  key={index}
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-xl hover:border-orange-300 dark:hover:border-orange-600 transition-all bg-gradient-to-br from-white to-orange-50 dark:from-gray-800 dark:to-orange-900/10"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                      <Building2 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {safeString(re.name)}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {safeString(re.type)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Expected Return</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                        {safeString(re.expectedReturn)}
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Lock-in</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {safeString(re.lockInPeriod)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation</span>
                      <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                        {safeNumber(re.recommendedAllocation)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Min Investment</span>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(re.minAmount)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {(re.features || []).slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                        <span>{safeString(feature)}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-600 p-3 rounded text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {safeString(re.reasoning)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plan */}
        {recommendations?.actionPlan && recommendations.actionPlan.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8 shadow-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Your Personalized Action Plan
            </h2>
            <div className="space-y-3">
              {recommendations.actionPlan.map((action, index) => (
                <div 
                  key={index} 
                  className="flex items-start gap-4 bg-white dark:bg-gray-800 p-5 rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-gray-700 dark:text-gray-300 leading-relaxed pt-1">
                    {safeString(action)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations && 
         getFilteredStocks().length === 0 && 
         getFilteredMutualFunds().length === 0 && 
         getFilteredFixedDeposits().length === 0 &&
         getFilteredBonds().length === 0 &&
         getFilteredRealEstate().length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Recommendations Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Try adjusting your filters or refresh to generate new recommendations
            </p>
            <button
              onClick={() => {
                setActiveFilter('all');
                setRiskFilter('all');
              }}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-medium transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg">
                Important Disclaimer
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                These are AI-generated investment recommendations based on your profile and current market conditions. 
                They are for informational purposes only and should not be considered as financial advice. 
                Past performance does not guarantee future results. Please consult with a certified financial advisor 
                before making investment decisions. Market investments are subject to market risks. Always read the 
                offer documents carefully before investing.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Recommendations;







































// // Recommendations.tsx
// // =========================================================================================================================
// // FinEdge AI-Powered Investment Recommendations - ENHANCED & BUG-FREE VERSION
// // =========================================================================================================================

// import React, { useState, useEffect } from 'react';
// import { useUser } from '@clerk/clerk-react';
// import axios from 'axios';
// import { 
//   TrendingUp,  
//   BarChart2, 
//   Shield, 
//   // Briefcase, 
//   Building2, 
//   Landmark, 
//   Wallet,
//   RefreshCw,
//   Sparkles,
//   Clock,
//   Target,
//   AlertCircle,
//   // CheckCircle2,
//   Loader2,
//   ChevronRight
// } from 'lucide-react';
// import { SERVER_URL } from '../utils/utils';

// // ============================================
// // TYPES & INTERFACES
// // ============================================

// interface MarketSentiment {
//   trend: string;
//   fiiFlow: number;
//   riskLevel: string;
//   summary: string;
// }

// interface BaseRecommendation {
//   name: string;
//   type: string;
//   rationale: string;
//   riskLevel: string;
// }

// interface StockRecommendation extends BaseRecommendation {
//   symbol: string;
//   sector: string;
//   currentPrice: number;
//   targetPrice: number;
//   potentialReturn: number;
//   timeframe: string;
// }

// interface MutualFundRecommendation extends BaseRecommendation {
//   fundHouse: string;
//   category: string;
//   nav: number;
//   returns1yr: number;
//   returns3yr: number;
//   expenseRatio: number;
//   minInvestment: number;
// }

// interface BondRecommendation extends BaseRecommendation {
//   issuer: string;
//   rating: string;
//   couponRate: number;
//   ytm: number;
//   maturity: string;
//   faceValue: number;
//   minInvestment: number;
// }

// interface RealEstateRecommendation extends BaseRecommendation {
//   location: string;
//   propertyType: string;
//   expectedPrice: number;
//   rentalYield: number;
//   appreciationPotential: number;
//   timeframe: string;
// }

// interface CommodityRecommendation extends BaseRecommendation {
//   commodity: string;
//   currentPrice: number;
//   unit: string;
//   targetPrice: number;
//   potentialReturn: number;
//   timeframe: string;
// }

// interface AlternativeInvestment extends BaseRecommendation {
//   investmentType: string;
//   minInvestment: number;
//   expectedReturn: number;
//   lockInPeriod: string;
//   liquidity: string;
// }

// interface RecommendationsData {
//   marketSentiment: MarketSentiment;
//   stocks: StockRecommendation[];
//   mutualFunds: MutualFundRecommendation[];
//   bonds: BondRecommendation[];
//   realEstate: RealEstateRecommendation[];
//   commodities: CommodityRecommendation[];
//   alternativeInvestments: AlternativeInvestment[];
//   metadata?: {
//     generatedAt: string;
//     userProfile: {
//       riskTolerance: string;
//       investmentGoals: string;
//     };
//   };
// }

// type FilterType = 'all' | 'stocks' | 'mutualFunds' | 'bonds' | 'realEstate' | 'commodities' | 'alternatives';

// // ============================================
// // UTILITY FUNCTIONS
// // ============================================

// const formatCurrency = (value: number | null | undefined): string => {
//   if (value === null || value === undefined || isNaN(value) || value === 0) {
//     return 'N/A';
//   }
//   return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
// };

// const formatPercentage = (value: number | null | undefined): string => {
//   if (value === null || value === undefined || isNaN(value) || value === 0) {
//     return 'N/A';
//   }
//   return `${value.toFixed(2)}%`;
// };

// const getRiskColor = (risk: string): string => {
//   const riskLower = risk.toLowerCase();
//   if (riskLower.includes('low')) return 'text-green-400';
//   if (riskLower.includes('medium') || riskLower.includes('moderate')) return 'text-yellow-400';
//   if (riskLower.includes('high')) return 'text-red-400';
//   return 'text-gray-400';
// };

// const getRiskBadgeColor = (risk: string): string => {
//   const riskLower = risk.toLowerCase();
//   if (riskLower.includes('low')) return 'bg-green-500/20 text-green-400';
//   if (riskLower.includes('medium') || riskLower.includes('moderate')) return 'bg-yellow-500/20 text-yellow-400';
//   if (riskLower.includes('high')) return 'bg-red-500/20 text-red-400';
//   return 'bg-gray-500/20 text-gray-400';
// };

// // ============================================
// // MAIN COMPONENT
// // ============================================

// const Recommendations: React.FC = () => {
//   const { user, isLoaded } = useUser();
//   const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [error, setError] = useState<string | null>(null);
//   const [activeFilter, setActiveFilter] = useState<FilterType>('all');
//   const [lastUpdated, setLastUpdated] = useState<string>('');

//   // Fetch recommendations
// const fetchRecommendations = async (forceRefresh: boolean = false) => {
//   if (!user?.id) return;

//   setLoading(true);
//   setError(null);

//   try {
//     const response = await axios.get(`${SERVER_URL}/api/recommendations/get`, {
//       params: { 
//         clerkUserId: user.id,
//         refresh: forceRefresh 
//       },
//       timeout: 30000
//     });

//     if (response.data && typeof response.data === 'object') {
//       // Validate response structure
//       const validatedData = validateRecommendationsData(response.data);

//       // 🚨 If no recommendations exist → trigger generation endpoint
//       const nothingThere =
//         !validatedData.stocks.length &&
//         !validatedData.mutualFunds.length &&
//         !validatedData.bonds.length &&
//         !validatedData.realEstate.length &&
//         !validatedData.commodities.length &&
//         !validatedData.alternativeInvestments.length;

//       if (nothingThere) {
//         console.warn("⚠️ No cached recommendations — generating fresh ones...");
//         await axios.post(`${SERVER_URL}/api/recommendations/generate`, {
//           clerkUserId: user.id,
//           forceRefresh: true
//         });

//         // Fetch again after generating
//         return fetchRecommendations(false);
//       }

//       // If data exists → show it
//       setRecommendations(validatedData);
//       setLastUpdated(new Date().toLocaleString('en-IN'));
//       setError(null);
//     } else {
//       throw new Error('Invalid response format from server');
//     }
//   } catch (err: any) {
//     console.error('Error fetching recommendations:', err);
//     setError(err.response?.data?.detail || 'Failed to fetch recommendations. Please try again.');
//     setRecommendations(null);
//   } finally {
//     setLoading(false);
//   }
// };

// // Validate recommendations data
// const validateRecommendationsData = (data: any): RecommendationsData => {
//   const validated: RecommendationsData = {
//     marketSentiment: data.marketSentiment || {
//       trend: 'Neutral',
//       fiiFlow: 0,
//       riskLevel: 'Medium',
//       summary: 'Market data unavailable'
//     },
//     stocks: Array.isArray(data.stocks) ? data.stocks.filter(isValidItem) : [],
//     mutualFunds: Array.isArray(data.mutualFunds) ? data.mutualFunds.filter(isValidItem) : [],
//     bonds: Array.isArray(data.bonds) ? data.bonds.filter(isValidItem) : [],
//     realEstate: Array.isArray(data.realEstate) ? data.realEstate.filter(isValidItem) : [],
//     commodities: Array.isArray(data.commodities) ? data.commodities.filter(isValidItem) : [],
//     alternativeInvestments: Array.isArray(data.alternativeInvestments) ? data.alternativeInvestments.filter(isValidItem) : [],
//     metadata: data.metadata
//   };

//   return validated;
// };

// // Check if item has valid data
// const isValidItem = (item: any): boolean => {
//   if (!item || typeof item !== 'object') return false;
//   if (!item.name || item.name.trim() === '') return false;

//   // Check for at least one valid numeric field
//   const numericFields = Object.values(item).filter(
//     (val) => typeof val === 'number' && !isNaN(val) && val > 0
//   );

//   return numericFields.length > 0;
// };

// // Initial load
// useEffect(() => {
//   if (isLoaded && user) {
//     fetchRecommendations(false);
//   }
// }, [isLoaded, user]);

// // Manual refresh
// const handleRefresh = () => {
//   fetchRecommendations(true);
// };

// // Get counts for each category
// const getCategoryCounts = () => {
//   if (!recommendations) return {};
//   return {
//     stocks: recommendations.stocks.length,
//     mutualFunds: recommendations.mutualFunds.length,
//     bonds: recommendations.bonds.length,
//     realEstate: recommendations.realEstate.length,
//     commodities: recommendations.commodities.length,
//     alternatives: recommendations.alternativeInvestments.length
//   };
// };

// const counts = getCategoryCounts();

//   // Filter buttons configuration
//   const filterButtons = [
//     { id: 'all' as FilterType, label: 'All Recommendations', icon: Sparkles, count: Object.values(counts).reduce((a, b) => a + b, 0) },
//     { id: 'stocks' as FilterType, label: 'Stocks', icon: TrendingUp, count: counts.stocks || 0 },
//     { id: 'mutualFunds' as FilterType, label: 'Mutual Funds', icon: BarChart2, count: counts.mutualFunds || 0 },
//     { id: 'bonds' as FilterType, label: 'Bonds', icon: Shield, count: counts.bonds || 0 },
//     { id: 'realEstate' as FilterType, label: 'Real Estate', icon: Building2, count: counts.realEstate || 0 },
//     { id: 'commodities' as FilterType, label: 'Commodities', icon: Landmark, count: counts.commodities || 0 },
//     { id: 'alternatives' as FilterType, label: 'Alternatives', icon: Wallet, count: counts.alternatives || 0 }
//   ];

//   // ============================================
//   // RENDER FUNCTIONS FOR EACH CARD TYPE
//   // ============================================

//   const renderStockCard = (stock: StockRecommendation, index: number) => (
//     <div key={`stock-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{stock.name}</h3>
//           <p className="text-gray-400 text-sm">{stock.symbol} -  {stock.sector}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(stock.riskLevel)}`}>
//           {stock.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Current Price</p>
//           <p className="text-white font-semibold">{formatCurrency(stock.currentPrice)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Target Price</p>
//           <p className="text-green-400 font-semibold">{formatCurrency(stock.targetPrice)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Potential Return</p>
//           <p className="text-blue-400 font-semibold">{formatPercentage(stock.potentialReturn)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Timeframe</p>
//           <p className="text-gray-300 font-semibold">{stock.timeframe}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{stock.rationale}</p>
//       </div>

//       <div className="mt-4 flex items-center text-blue-400 text-sm">
//         <span className="font-medium">{stock.type}</span>
//         <ChevronRight className="w-4 h-4 ml-1" />
//       </div>
//     </div>
//   );

//   const renderMutualFundCard = (fund: MutualFundRecommendation, index: number) => (
//     <div key={`mf-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{fund.name}</h3>
//           <p className="text-gray-400 text-sm">{fund.fundHouse} -  {fund.category}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(fund.riskLevel)}`}>
//           {fund.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">NAV</p>
//           <p className="text-white font-semibold">{formatCurrency(fund.nav)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">1Y Returns</p>
//           <p className="text-green-400 font-semibold">{formatPercentage(fund.returns1yr)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">3Y Returns</p>
//           <p className="text-blue-400 font-semibold">{formatPercentage(fund.returns3yr)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Expense Ratio</p>
//           <p className="text-gray-300 font-semibold">{formatPercentage(fund.expenseRatio)}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4 mb-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{fund.rationale}</p>
//       </div>

//       <div className="flex items-center justify-between">
//         <span className="text-gray-500 text-sm">Min Investment: <span className="text-white font-medium">{formatCurrency(fund.minInvestment)}</span></span>
//         <span className="text-purple-400 text-sm font-medium">{fund.type}</span>
//       </div>
//     </div>
//   );

//   const renderBondCard = (bond: BondRecommendation, index: number) => (
//     <div key={`bond-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{bond.name}</h3>
//           <p className="text-gray-400 text-sm">{bond.issuer} -  Rating: {bond.rating}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(bond.riskLevel)}`}>
//           {bond.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Coupon Rate</p>
//           <p className="text-green-400 font-semibold">{formatPercentage(bond.couponRate)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">YTM</p>
//           <p className="text-blue-400 font-semibold">{formatPercentage(bond.ytm)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Maturity</p>
//           <p className="text-gray-300 font-semibold">{bond.maturity}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Face Value</p>
//           <p className="text-white font-semibold">{formatCurrency(bond.faceValue)}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4 mb-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{bond.rationale}</p>
//       </div>

//       <div className="flex items-center justify-between">
//         <span className="text-gray-500 text-sm">Min Investment: <span className="text-white font-medium">{formatCurrency(bond.minInvestment)}</span></span>
//         <span className="text-green-400 text-sm font-medium">{bond.type}</span>
//       </div>
//     </div>
//   );

//   const renderRealEstateCard = (property: RealEstateRecommendation, index: number) => (
//     <div key={`re-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{property.name}</h3>
//           <p className="text-gray-400 text-sm">{property.location} -  {property.propertyType}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(property.riskLevel)}`}>
//           {property.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Expected Price</p>
//           <p className="text-white font-semibold">{formatCurrency(property.expectedPrice)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Rental Yield</p>
//           <p className="text-green-400 font-semibold">{formatPercentage(property.rentalYield)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Appreciation</p>
//           <p className="text-blue-400 font-semibold">{formatPercentage(property.appreciationPotential)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Timeframe</p>
//           <p className="text-gray-300 font-semibold">{property.timeframe}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{property.rationale}</p>
//       </div>

//       <div className="mt-4 flex items-center text-orange-400 text-sm">
//         <span className="font-medium">{property.type}</span>
//         <ChevronRight className="w-4 h-4 ml-1" />
//       </div>
//     </div>
//   );

//   const renderCommodityCard = (commodity: CommodityRecommendation, index: number) => (
//     <div key={`commodity-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{commodity.name}</h3>
//           <p className="text-gray-400 text-sm">{commodity.commodity}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(commodity.riskLevel)}`}>
//           {commodity.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Current Price</p>
//           <p className="text-white font-semibold">{formatCurrency(commodity.currentPrice)}</p>
//           <p className="text-gray-500 text-xs">{commodity.unit}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Target Price</p>
//           <p className="text-green-400 font-semibold">{formatCurrency(commodity.targetPrice)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Potential Return</p>
//           <p className="text-blue-400 font-semibold">{formatPercentage(commodity.potentialReturn)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Timeframe</p>
//           <p className="text-gray-300 font-semibold">{commodity.timeframe}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{commodity.rationale}</p>
//       </div>

//       <div className="mt-4 flex items-center text-yellow-400 text-sm">
//         <span className="font-medium">{commodity.type}</span>
//         <ChevronRight className="w-4 h-4 ml-1" />
//       </div>
//     </div>
//   );

//   const renderAlternativeCard = (alt: AlternativeInvestment, index: number) => (
//     <div key={`alt-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-xl font-bold text-white mb-1">{alt.name}</h3>
//           <p className="text-gray-400 text-sm">{alt.investmentType}</p>
//         </div>
//         <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(alt.riskLevel)}`}>
//           {alt.riskLevel}
//         </span>
//       </div>

//       <div className="grid grid-cols-2 gap-4 mb-4">
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Min Investment</p>
//           <p className="text-white font-semibold">{formatCurrency(alt.minInvestment)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Expected Return</p>
//           <p className="text-green-400 font-semibold">{formatPercentage(alt.expectedReturn)}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Lock-in Period</p>
//           <p className="text-gray-300 font-semibold">{alt.lockInPeriod}</p>
//         </div>
//         <div>
//           <p className="text-gray-500 text-xs mb-1">Liquidity</p>
//           <p className="text-blue-400 font-semibold">{alt.liquidity}</p>
//         </div>
//       </div>

//       <div className="border-t border-gray-700 pt-4">
//         <p className="text-gray-400 text-sm leading-relaxed">{alt.rationale}</p>
//       </div>

//       <div className="mt-4 flex items-center text-pink-400 text-sm">
//         <span className="font-medium">{alt.type}</span>
//         <ChevronRight className="w-4 h-4 ml-1" />
//       </div>
//     </div>
//   );

//   // ============================================
//   // MAIN RENDER
//   // ============================================

//   if (!isLoaded || loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
//           <p className="text-gray-300 text-lg">Generating your personalized recommendations...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
//         <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
//           <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
//           <h2 className="text-xl font-bold text-white mb-2">Error Loading Recommendations</h2>
//           <p className="text-gray-300 mb-6">{error}</p>
//           <button
//             onClick={handleRefresh}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//           >
//             Try Again
//           </button>
//         </div>
//       </div>
//     );
//   }

//   if (!recommendations) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
//         <div className="text-center">
//           <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
//           <p className="text-gray-300 text-lg">No recommendations available</p>
//         </div>
//       </div>
//     );
//   }

//   const hasAnyRecommendations = 
//     recommendations.stocks.length > 0 ||
//     recommendations.mutualFunds.length > 0 ||
//     recommendations.bonds.length > 0 ||
//     recommendations.realEstate.length > 0 ||
//     recommendations.commodities.length > 0 ||
//     recommendations.alternativeInvestments.length > 0;

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
//       <div className="max-w-7xl mx-auto">
        
//         {/* Header */}
//         <div className="mb-8">
//           <div className="flex items-center justify-between mb-4">
//             <div>
//               <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
//                 <Sparkles className="w-10 h-10 text-blue-500 mr-3" />
//                 AI-Powered Recommendations
//               </h1>
//               <p className="text-gray-400">Personalized investment insights based on your profile</p>
//             </div>
//             <button
//               onClick={handleRefresh}
//               className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
//             >
//               <RefreshCw className="w-5 h-5" />
//               Refresh
//             </button>
//           </div>
          
//           {lastUpdated && (
//             <div className="flex items-center text-gray-500 text-sm">
//               <Clock className="w-4 h-4 mr-2" />
//               Last updated: {lastUpdated}
//             </div>
//           )}
//         </div>

//         {/* Market Sentiment */}
//         {recommendations.marketSentiment && (
//           <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 mb-8 border border-blue-500/30">
//             <div className="flex items-center mb-4">
//               <Target className="w-6 h-6 text-blue-400 mr-2" />
//               <h2 className="text-2xl font-bold text-white">Market Sentiment</h2>
//             </div>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//               <div>
//                 <p className="text-gray-400 text-sm mb-1">Trend</p>
//                 <p className="text-white font-semibold text-lg">{recommendations.marketSentiment.trend}</p>
//               </div>
//               <div>
//                 <p className="text-gray-400 text-sm mb-1">FII Flow</p>
//                 <p className="text-green-400 font-semibold text-lg">{formatCurrency(recommendations.marketSentiment.fiiFlow)} Cr</p>
//               </div>
//               <div>
//                 <p className="text-gray-400 text-sm mb-1">Risk Level</p>
//                 <p className={`font-semibold text-lg ${getRiskColor(recommendations.marketSentiment.riskLevel)}`}>
//                   {recommendations.marketSentiment.riskLevel}
//                 </p>
//               </div>
//             </div>
//             <p className="text-gray-300 leading-relaxed">{recommendations.marketSentiment.summary}</p>
//           </div>
//         )}

//         {/* Filter Tabs */}
//         <div className="mb-8 overflow-x-auto">
//           <div className="flex gap-2 pb-2">
//             {filterButtons.map(filter => {
//               const Icon = filter.icon;
//               const isActive = activeFilter === filter.id;
//               const isDisabled = filter.count === 0 && filter.id !== 'all';
              
//               return (
//                 <button
//                   key={filter.id}
//                   onClick={() => !isDisabled && setActiveFilter(filter.id)}
//                   disabled={isDisabled}
//                   className={`
//                     flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap
//                     ${isActive 
//                       ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
//                       : isDisabled
//                         ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
//                         : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
//                     }
//                   `}
//                 >
//                   <Icon className="w-5 h-5" />
//                   <span>{filter.label}</span>
//                   <span className={`
//                     px-2 py-0.5 rounded-full text-xs font-bold
//                     ${isActive ? 'bg-white/20' : 'bg-gray-700'}
//                   `}>
//                     {filter.count}
//                   </span>
//                 </button>
//               );
//             })}
//           </div>
//         </div>

//         {/* Recommendations Grid */}
//         {hasAnyRecommendations ? (
//           <div className="space-y-8">
//             {/* Stocks */}
//             {(activeFilter === 'all' || activeFilter === 'stocks') && recommendations.stocks.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
//                   Stock Recommendations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.stocks.map((stock, index) => renderStockCard(stock, index))}
//                 </div>
//               </div>
//             )}

//             {/* Mutual Funds */}
//             {(activeFilter === 'all' || activeFilter === 'mutualFunds') && recommendations.mutualFunds.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <BarChart2 className="w-6 h-6 text-purple-500 mr-2" />
//                   Mutual Fund Recommendations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.mutualFunds.map((fund, index) => renderMutualFundCard(fund, index))}
//                 </div>
//               </div>
//             )}

//             {/* Bonds */}
//             {(activeFilter === 'all' || activeFilter === 'bonds') && recommendations.bonds.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <Shield className="w-6 h-6 text-green-500 mr-2" />
//                   Bond Recommendations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.bonds.map((bond, index) => renderBondCard(bond, index))}
//                 </div>
//               </div>
//             )}

//             {/* Real Estate */}
//             {(activeFilter === 'all' || activeFilter === 'realEstate') && recommendations.realEstate.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <Building2 className="w-6 h-6 text-orange-500 mr-2" />
//                   Real Estate Recommendations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.realEstate.map((property, index) => renderRealEstateCard(property, index))}
//                 </div>
//               </div>
//             )}

//             {/* Commodities */}
//             {(activeFilter === 'all' || activeFilter === 'commodities') && recommendations.commodities.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <Landmark className="w-6 h-6 text-yellow-500 mr-2" />
//                   Commodity Recommendations
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.commodities.map((commodity, index) => renderCommodityCard(commodity, index))}
//                 </div>
//               </div>
//             )}

//             {/* Alternative Investments */}
//             {(activeFilter === 'all' || activeFilter === 'alternatives') && recommendations.alternativeInvestments.length > 0 && (
//               <div>
//                 <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
//                   <Wallet className="w-6 h-6 text-pink-500 mr-2" />
//                   Alternative Investments
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                   {recommendations.alternativeInvestments.map((alt, index) => renderAlternativeCard(alt, index))}
//                 </div>
//               </div>
//             )}
//           </div>
//         ) : (
//           <div className="text-center py-16">
//             <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
//             <p className="text-gray-400 text-lg">No recommendations available for the selected filter</p>
//           </div>
//         )}

//       </div>
//     </div>
//   );
// };

// export default Recommendations;
// // =======================================================================================================    
