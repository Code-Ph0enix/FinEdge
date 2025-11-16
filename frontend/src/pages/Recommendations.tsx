// Recommendations.tsx
// =========================================================================================================================
// FinEdge AI-Powered Investment Recommendations (ENHANCED VERSION - Dark mode fixes)
// =========================================================================================================================

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  TrendingUp,  
  BarChart2, 
  Shield, 
  Briefcase, 
  Building2, 
  Landmark, 
  Wallet,
  RefreshCw,
  Sparkles,
  Clock,
  Target,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { SERVER_URL } from '../utils/utils';

// ============================================
// TYPES & INTERFACES
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
  riskLevel: 'Low' | 'Moderate' | 'High' | string;
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
  riskLevel: 'Low' | 'Moderate' | 'High' | string;
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
  fixedDeposits?: FixedDepositRecommendation[];
  bonds?: BondRecommendation[];
  realEstate?: RealEstateRecommendation[];
  assetAllocation?: any;
  actionPlan?: string[];
  metadata?: any;
}

interface CacheInfo {
  cached: boolean;
  generatedAt?: string;
  expiresAt?: string;
  ageHours?: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

const Recommendations: React.FC = () => {
  const { user, isLoaded } = useUser();

  // State
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>({ cached: false });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  
  // Load recommendations on mount
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
      
      const cacheResponse = await axios.get(`${SERVER_URL}/api/recommendations/get`, {
        params: { clerkUserId: user.id }
      });
      
      if (cacheResponse.data.success && cacheResponse.data.recommendations) {
        console.log('✅ Found cached recommendations');
        
        const recs = cacheResponse.data.recommendations;
        
        // Validate cached data; regenerate if corrupt
        if (!recs.stocks || !Array.isArray(recs.stocks) || recs.stocks.some((s: any) => s.currentPrice == null)) {
          console.warn('⚠️ Cached data is corrupt, regenerating...');
          await generateRecommendations(true);
          return;
        }
        
        setRecommendations(recs);
        setCacheInfo(cacheResponse.data.cacheInfo || { cached: true });
        setLoading(false);
      } else {
        console.log('ℹ️ No cached recommendations found, generating new...');
        await generateRecommendations();
      }
      
    } catch (err: any) {
      console.error('❌ Error loading recommendations:', err);
      setError('Failed to load recommendations. Please try again.');
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

  // Loading state
  if (loading || !isLoaded) {
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
  if (error) {
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
            className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-colors"
          >
            Try Again
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
              Smart Investment Recommendations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered investment suggestions tailored for Indian markets based on your risk profile and goals
            </p>
          </div>
          
          <button
            onClick={() => generateRecommendations(true)}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`h-5 w-5 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        
        {/* Cache info */}
        {cacheInfo.cached && cacheInfo.ageHours !== undefined && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Showing recommendations from {cacheInfo.ageHours} hour{cacheInfo.ageHours !== 1 ? 's' : ''} ago
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Recommendations refresh automatically every 24 hours or click "Refresh" for latest insights
              </p>
            </div>
          </div>
        )}

        {/* Market Sentiment */}
        {recommendations?.marketSentiment && (
          <div className="rounded-2xl shadow-xl p-6 text-white" style={{ background: 'linear-gradient(90deg,#5b21b6,#6d28d9)' }}>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <BarChart2 className="h-6 w-6" />
              Market Sentiment
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 dark:bg-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-white/90" />
                  <p className="text-sm font-medium text-white/90">FII Flow</p>
                </div>
                <p className="text-2xl font-bold">{recommendations.marketSentiment.fiiFlow}</p>
                <p className="text-sm text-white/80 mt-1">
                  {Number(recommendations.marketSentiment.fiiFlow) > 0 ? 'Positive' : 'Negative'} foreign investment
                </p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart2 className="h-5 w-5 text-white/90" />
                  <p className="text-sm font-medium text-white/90">Market Trend</p>
                </div>
                <p className="text-2xl font-bold">{recommendations.marketSentiment.trend}</p>
                <p className="text-sm text-white/80 mt-1">Current market direction</p>
              </div>
              
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-5 w-5 text-white/90" />
                  <p className="text-sm font-medium text-white/90">Risk Level</p>
                </div>
                <p className="text-2xl font-bold">{recommendations.marketSentiment.riskLevel}</p>
                <p className="text-sm text-white/80 mt-1">Current market volatility</p>
              </div>
            </div>
            
            <div className="mt-6 bg-white/6 backdrop-blur-sm rounded-xl p-4">
              <p className="text-sm leading-relaxed text-white/90">{recommendations.marketSentiment.summary}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Investment Type Filter */}
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
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
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveFilter(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeFilter === id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Risk Level Filter */}
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                Risk Level
              </label>
              <div className="flex gap-2">
                {['all', 'Low', 'Moderate', 'High'].map((risk) => (
                  <button
                    key={risk}
                    onClick={() => setRiskFilter(risk)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      riskFilter === risk
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {risk === 'all' ? 'All' : risk}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        {/* Stock Recommendations */}
        {recommendations?.stocks && recommendations.stocks.length > 0 && (activeFilter === 'all' || activeFilter === 'stocks') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Stock Recommendations
              </h2>
              <p className="text-indigo-100 mt-1">AI-selected stocks based on your profile and market conditions</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
{recommendations.stocks
  .filter(stock => riskFilter === 'all' || stock.riskLevel === riskFilter)
  .filter(stock => stock.currentPrice && stock.monthlyInvestment)
  .map((stock, index) => (
    <div
      key={index}
      className="border border-gray-200 dark:border-gray-500 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-700"
    >
      {/* Stock Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{stock.symbol || 'N/A'}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name || 'Unknown'}</p>
          <span className="inline-block mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-200 rounded-full text-xs font-medium">
            {stock.sector || 'General'}
          </span>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
          stock.riskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
          stock.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
        }`}>
          {stock.riskLevel || 'Unknown'} Risk
        </div>
      </div>
      
      {/* Price & Returns */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Current Price</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ₹{(stock.currentPrice || 0).toLocaleString('en-IN')}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Expected Return</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stock.expectedReturn || 'N/A'}
          </p>
        </div>
      </div>
      
      {/* Investment Allocation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommended Allocation</span>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {stock.recommendedAllocation || 0}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-500 dark:text-gray-400">Monthly Investment</span>
          <span className="text-sm font-semibold text-gray-900 dark:text-white">
            ₹{(stock.monthlyInvestment || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>
      
      {/* Key Metrics */}
      {stock.keyMetrics && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {stock.keyMetrics.pe != null && (
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">P/E Ratio</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{stock.keyMetrics.pe}</p>
            </div>
          )}
          {stock.keyMetrics.marketCap && (
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{stock.keyMetrics.marketCap}</p>
            </div>
          )}
          {stock.keyMetrics.dividend != null && (
            <div className="text-center p-2 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Dividend</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{stock.keyMetrics.dividend}</p>
            </div>
          )}
        </div>
      )}
      
      {/* Reasoning */}
      <div className="bg-indigo-50 dark:bg-indigo-900/40 border-l-4 border-indigo-700 p-4 rounded">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Why this stock?</p>
        <p className="text-sm text-gray-600 dark:text-gray-300">{stock.reasoning || 'No information available'}</p>
      </div>
    </div>
  ))}
            </div>
          </div>
        )}

        {/* Mutual Funds */}
        {recommendations?.mutualFunds && recommendations.mutualFunds.length > 0 && (activeFilter === 'all' || activeFilter === 'mutualFunds') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="h-6 w-6" />
                Recommended Mutual Funds
              </h2>
              <p className="text-purple-100 mt-1">Diversified funds matched to your risk appetite</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.mutualFunds
                .filter(fund => riskFilter === 'all' || fund.riskLevel === riskFilter)
                .map((fund, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                >
                  {/* Fund Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{fund.name}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{fund.category}</p>
                    </div>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className={`text-lg ${i < fund.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}>
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* NAV */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current NAV</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{fund.nav.toFixed(2)}</p>
                  </div>
                  
                  {/* Returns */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                      <p className="text-xs text-gray-500 dark:text-gray-400">1Y</p>
                      <p className="text-sm font-semibold text-green-600 dark:text-green-400">{fund.returns1Y}%</p>
                    </div>
                    {fund.returns3Y != null && (
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">3Y</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">{fund.returns3Y}%</p>
                      </div>
                    )}
                    {fund.returns5Y != null && (
                      <div className="text-center p-2 bg-white dark:bg-gray-900 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">5Y</p>
                        <p className="text-sm font-semibold text-green-600 dark:text-green-400">{fund.returns5Y}%</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Allocation */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Recommended SIP</span>
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{fund.recommendedAllocation}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Monthly Amount</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{fund.monthlyInvestment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  {/* Risk Badge */}
                  <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-4 ${
                    fund.riskLevel === 'Low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                    fund.riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                  }`}>
                    {fund.riskLevel} Risk
                  </div>
                  
                  {/* Reasoning */}
                  <div className="bg-purple-50 dark:bg-purple-900/10 border-l-4 border-purple-600 p-4 rounded">
                    <p className="text-xs text-gray-600 dark:text-gray-300">{fund.reasoning}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fixed Deposits */}
        {recommendations?.fixedDeposits && recommendations.fixedDeposits.length > 0 && (activeFilter === 'all' || activeFilter === 'fixedDeposits') && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-teal-600 p-6 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Landmark className="h-6 w-6" />
                Fixed Deposits
              </h2>
              <p className="text-green-100 mt-1">Safe investment options with guaranteed returns</p>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.fixedDeposits.map((fd, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                      <Landmark className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{fd.bank}</h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Fixed Deposit</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Interest Rate</p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">{fd.interestRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Tenure</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{fd.tenure}</p>
                    </div>
                  </div>
                  
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Allocation</span>
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{fd.recommendedAllocation}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Monthly Deposit</span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">₹{fd.monthlyInvestment.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    {fd.features.slice(0, 3).map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        {feature}
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/10 border-l-4 border-green-600 p-3 rounded text-xs text-gray-600 dark:text-gray-300">
                    {fd.reasoning}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Plan */}
        {recommendations?.actionPlan && recommendations.actionPlan.length > 0 && (
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Target className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              Your Action Plan
            </h2>
            <div className="space-y-3">
              {recommendations.actionPlan.map((action, index) => (
                <div key={index} className="flex items-start gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl">
                  <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <p className="flex-1 text-gray-700 dark:text-gray-300">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Important Disclaimer</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                These are AI-generated investment recommendations based on your profile and current market conditions. 
                They are for informational purposes only and should not be considered as financial advice. 
                Past performance does not guarantee future results. Please consult with a certified financial advisor 
                before making investment decisions. Market investments are subject to market risks.
              </p>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Recommendations;
