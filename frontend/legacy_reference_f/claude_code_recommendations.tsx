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
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Something Went Wrong
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => generateRecommendations(true)}
            disabled={generating}
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
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
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
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
                          ? 'bg-indigo-600 text-white shadow-lg scale-105'
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
                        ? 'bg-indigo-600 text-white shadow-lg scale-105'
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
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
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