// Recommendations.tsx
// =========================================================================================================================
// FinEdge AI-Powered Investment Recommendations - ENHANCED & BUG-FREE VERSION
// =========================================================================================================================

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';
import { 
  TrendingUp,  
  BarChart2, 
  Shield, 
  // Briefcase, 
  Building2, 
  Landmark, 
  Wallet,
  RefreshCw,
  Sparkles,
  Clock,
  Target,
  AlertCircle,
  // CheckCircle2,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { SERVER_URL } from '../utils/utils';

// ============================================
// TYPES & INTERFACES
// ============================================

interface MarketSentiment {
  trend: string;
  fiiFlow: number;
  riskLevel: string;
  summary: string;
}

interface BaseRecommendation {
  name: string;
  type: string;
  rationale: string;
  riskLevel: string;
}

interface StockRecommendation extends BaseRecommendation {
  symbol: string;
  sector: string;
  currentPrice: number;
  targetPrice: number;
  potentialReturn: number;
  timeframe: string;
}

interface MutualFundRecommendation extends BaseRecommendation {
  fundHouse: string;
  category: string;
  nav: number;
  returns1yr: number;
  returns3yr: number;
  expenseRatio: number;
  minInvestment: number;
}

interface BondRecommendation extends BaseRecommendation {
  issuer: string;
  rating: string;
  couponRate: number;
  ytm: number;
  maturity: string;
  faceValue: number;
  minInvestment: number;
}

interface RealEstateRecommendation extends BaseRecommendation {
  location: string;
  propertyType: string;
  expectedPrice: number;
  rentalYield: number;
  appreciationPotential: number;
  timeframe: string;
}

interface CommodityRecommendation extends BaseRecommendation {
  commodity: string;
  currentPrice: number;
  unit: string;
  targetPrice: number;
  potentialReturn: number;
  timeframe: string;
}

interface AlternativeInvestment extends BaseRecommendation {
  investmentType: string;
  minInvestment: number;
  expectedReturn: number;
  lockInPeriod: string;
  liquidity: string;
}

interface RecommendationsData {
  marketSentiment: MarketSentiment;
  stocks: StockRecommendation[];
  mutualFunds: MutualFundRecommendation[];
  bonds: BondRecommendation[];
  realEstate: RealEstateRecommendation[];
  commodities: CommodityRecommendation[];
  alternativeInvestments: AlternativeInvestment[];
  metadata?: {
    generatedAt: string;
    userProfile: {
      riskTolerance: string;
      investmentGoals: string;
    };
  };
}

type FilterType = 'all' | 'stocks' | 'mutualFunds' | 'bonds' | 'realEstate' | 'commodities' | 'alternatives';

// ============================================
// UTILITY FUNCTIONS
// ============================================

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return 'N/A';
  }
  return `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

const formatPercentage = (value: number | null | undefined): string => {
  if (value === null || value === undefined || isNaN(value) || value === 0) {
    return 'N/A';
  }
  return `${value.toFixed(2)}%`;
};

const getRiskColor = (risk: string): string => {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('low')) return 'text-green-400';
  if (riskLower.includes('medium') || riskLower.includes('moderate')) return 'text-yellow-400';
  if (riskLower.includes('high')) return 'text-red-400';
  return 'text-gray-400';
};

const getRiskBadgeColor = (risk: string): string => {
  const riskLower = risk.toLowerCase();
  if (riskLower.includes('low')) return 'bg-green-500/20 text-green-400';
  if (riskLower.includes('medium') || riskLower.includes('moderate')) return 'bg-yellow-500/20 text-yellow-400';
  if (riskLower.includes('high')) return 'bg-red-500/20 text-red-400';
  return 'bg-gray-500/20 text-gray-400';
};

// ============================================
// MAIN COMPONENT
// ============================================

const Recommendations: React.FC = () => {
  const { user, isLoaded } = useUser();
  const [recommendations, setRecommendations] = useState<RecommendationsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // Fetch recommendations
const fetchRecommendations = async (forceRefresh: boolean = false) => {
  if (!user?.id) return;

  setLoading(true);
  setError(null);

  try {
    const response = await axios.get(`${SERVER_URL}/api/recommendations/get`, {
      params: { 
        clerkUserId: user.id,
        refresh: forceRefresh 
      },
      timeout: 30000
    });

    if (response.data && typeof response.data === 'object') {
      // Validate response structure
      const validatedData = validateRecommendationsData(response.data);

      // 🚨 If no recommendations exist → trigger generation endpoint
      const nothingThere =
        !validatedData.stocks.length &&
        !validatedData.mutualFunds.length &&
        !validatedData.bonds.length &&
        !validatedData.realEstate.length &&
        !validatedData.commodities.length &&
        !validatedData.alternativeInvestments.length;

      if (nothingThere) {
        console.warn("⚠️ No cached recommendations — generating fresh ones...");
        await axios.post(`${SERVER_URL}/api/recommendations/generate`, {
          clerkUserId: user.id,
          forceRefresh: true
        });

        // Fetch again after generating
        return fetchRecommendations(false);
      }

      // If data exists → show it
      setRecommendations(validatedData);
      setLastUpdated(new Date().toLocaleString('en-IN'));
      setError(null);
    } else {
      throw new Error('Invalid response format from server');
    }
  } catch (err: any) {
    console.error('Error fetching recommendations:', err);
    setError(err.response?.data?.detail || 'Failed to fetch recommendations. Please try again.');
    setRecommendations(null);
  } finally {
    setLoading(false);
  }
};

// Validate recommendations data
const validateRecommendationsData = (data: any): RecommendationsData => {
  const validated: RecommendationsData = {
    marketSentiment: data.marketSentiment || {
      trend: 'Neutral',
      fiiFlow: 0,
      riskLevel: 'Medium',
      summary: 'Market data unavailable'
    },
    stocks: Array.isArray(data.stocks) ? data.stocks.filter(isValidItem) : [],
    mutualFunds: Array.isArray(data.mutualFunds) ? data.mutualFunds.filter(isValidItem) : [],
    bonds: Array.isArray(data.bonds) ? data.bonds.filter(isValidItem) : [],
    realEstate: Array.isArray(data.realEstate) ? data.realEstate.filter(isValidItem) : [],
    commodities: Array.isArray(data.commodities) ? data.commodities.filter(isValidItem) : [],
    alternativeInvestments: Array.isArray(data.alternativeInvestments) ? data.alternativeInvestments.filter(isValidItem) : [],
    metadata: data.metadata
  };

  return validated;
};

// Check if item has valid data
const isValidItem = (item: any): boolean => {
  if (!item || typeof item !== 'object') return false;
  if (!item.name || item.name.trim() === '') return false;

  // Check for at least one valid numeric field
  const numericFields = Object.values(item).filter(
    (val) => typeof val === 'number' && !isNaN(val) && val > 0
  );

  return numericFields.length > 0;
};

// Initial load
useEffect(() => {
  if (isLoaded && user) {
    fetchRecommendations(false);
  }
}, [isLoaded, user]);

// Manual refresh
const handleRefresh = () => {
  fetchRecommendations(true);
};

// Get counts for each category
const getCategoryCounts = () => {
  if (!recommendations) return {};
  return {
    stocks: recommendations.stocks.length,
    mutualFunds: recommendations.mutualFunds.length,
    bonds: recommendations.bonds.length,
    realEstate: recommendations.realEstate.length,
    commodities: recommendations.commodities.length,
    alternatives: recommendations.alternativeInvestments.length
  };
};

const counts = getCategoryCounts();

  // Filter buttons configuration
  const filterButtons = [
    { id: 'all' as FilterType, label: 'All Recommendations', icon: Sparkles, count: Object.values(counts).reduce((a, b) => a + b, 0) },
    { id: 'stocks' as FilterType, label: 'Stocks', icon: TrendingUp, count: counts.stocks || 0 },
    { id: 'mutualFunds' as FilterType, label: 'Mutual Funds', icon: BarChart2, count: counts.mutualFunds || 0 },
    { id: 'bonds' as FilterType, label: 'Bonds', icon: Shield, count: counts.bonds || 0 },
    { id: 'realEstate' as FilterType, label: 'Real Estate', icon: Building2, count: counts.realEstate || 0 },
    { id: 'commodities' as FilterType, label: 'Commodities', icon: Landmark, count: counts.commodities || 0 },
    { id: 'alternatives' as FilterType, label: 'Alternatives', icon: Wallet, count: counts.alternatives || 0 }
  ];

  // ============================================
  // RENDER FUNCTIONS FOR EACH CARD TYPE
  // ============================================

  const renderStockCard = (stock: StockRecommendation, index: number) => (
    <div key={`stock-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{stock.name}</h3>
          <p className="text-gray-400 text-sm">{stock.symbol} -  {stock.sector}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(stock.riskLevel)}`}>
          {stock.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Current Price</p>
          <p className="text-white font-semibold">{formatCurrency(stock.currentPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Target Price</p>
          <p className="text-green-400 font-semibold">{formatCurrency(stock.targetPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Potential Return</p>
          <p className="text-blue-400 font-semibold">{formatPercentage(stock.potentialReturn)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Timeframe</p>
          <p className="text-gray-300 font-semibold">{stock.timeframe}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-400 text-sm leading-relaxed">{stock.rationale}</p>
      </div>

      <div className="mt-4 flex items-center text-blue-400 text-sm">
        <span className="font-medium">{stock.type}</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );

  const renderMutualFundCard = (fund: MutualFundRecommendation, index: number) => (
    <div key={`mf-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{fund.name}</h3>
          <p className="text-gray-400 text-sm">{fund.fundHouse} -  {fund.category}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(fund.riskLevel)}`}>
          {fund.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">NAV</p>
          <p className="text-white font-semibold">{formatCurrency(fund.nav)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">1Y Returns</p>
          <p className="text-green-400 font-semibold">{formatPercentage(fund.returns1yr)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">3Y Returns</p>
          <p className="text-blue-400 font-semibold">{formatPercentage(fund.returns3yr)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Expense Ratio</p>
          <p className="text-gray-300 font-semibold">{formatPercentage(fund.expenseRatio)}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mb-4">
        <p className="text-gray-400 text-sm leading-relaxed">{fund.rationale}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">Min Investment: <span className="text-white font-medium">{formatCurrency(fund.minInvestment)}</span></span>
        <span className="text-purple-400 text-sm font-medium">{fund.type}</span>
      </div>
    </div>
  );

  const renderBondCard = (bond: BondRecommendation, index: number) => (
    <div key={`bond-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{bond.name}</h3>
          <p className="text-gray-400 text-sm">{bond.issuer} -  Rating: {bond.rating}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(bond.riskLevel)}`}>
          {bond.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Coupon Rate</p>
          <p className="text-green-400 font-semibold">{formatPercentage(bond.couponRate)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">YTM</p>
          <p className="text-blue-400 font-semibold">{formatPercentage(bond.ytm)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Maturity</p>
          <p className="text-gray-300 font-semibold">{bond.maturity}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Face Value</p>
          <p className="text-white font-semibold">{formatCurrency(bond.faceValue)}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mb-4">
        <p className="text-gray-400 text-sm leading-relaxed">{bond.rationale}</p>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-gray-500 text-sm">Min Investment: <span className="text-white font-medium">{formatCurrency(bond.minInvestment)}</span></span>
        <span className="text-green-400 text-sm font-medium">{bond.type}</span>
      </div>
    </div>
  );

  const renderRealEstateCard = (property: RealEstateRecommendation, index: number) => (
    <div key={`re-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{property.name}</h3>
          <p className="text-gray-400 text-sm">{property.location} -  {property.propertyType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(property.riskLevel)}`}>
          {property.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Expected Price</p>
          <p className="text-white font-semibold">{formatCurrency(property.expectedPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Rental Yield</p>
          <p className="text-green-400 font-semibold">{formatPercentage(property.rentalYield)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Appreciation</p>
          <p className="text-blue-400 font-semibold">{formatPercentage(property.appreciationPotential)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Timeframe</p>
          <p className="text-gray-300 font-semibold">{property.timeframe}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-400 text-sm leading-relaxed">{property.rationale}</p>
      </div>

      <div className="mt-4 flex items-center text-orange-400 text-sm">
        <span className="font-medium">{property.type}</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );

  const renderCommodityCard = (commodity: CommodityRecommendation, index: number) => (
    <div key={`commodity-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{commodity.name}</h3>
          <p className="text-gray-400 text-sm">{commodity.commodity}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(commodity.riskLevel)}`}>
          {commodity.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Current Price</p>
          <p className="text-white font-semibold">{formatCurrency(commodity.currentPrice)}</p>
          <p className="text-gray-500 text-xs">{commodity.unit}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Target Price</p>
          <p className="text-green-400 font-semibold">{formatCurrency(commodity.targetPrice)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Potential Return</p>
          <p className="text-blue-400 font-semibold">{formatPercentage(commodity.potentialReturn)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Timeframe</p>
          <p className="text-gray-300 font-semibold">{commodity.timeframe}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-400 text-sm leading-relaxed">{commodity.rationale}</p>
      </div>

      <div className="mt-4 flex items-center text-yellow-400 text-sm">
        <span className="font-medium">{commodity.type}</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );

  const renderAlternativeCard = (alt: AlternativeInvestment, index: number) => (
    <div key={`alt-${index}`} className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 hover:border-pink-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-pink-500/10">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{alt.name}</h3>
          <p className="text-gray-400 text-sm">{alt.investmentType}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskBadgeColor(alt.riskLevel)}`}>
          {alt.riskLevel}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-gray-500 text-xs mb-1">Min Investment</p>
          <p className="text-white font-semibold">{formatCurrency(alt.minInvestment)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Expected Return</p>
          <p className="text-green-400 font-semibold">{formatPercentage(alt.expectedReturn)}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Lock-in Period</p>
          <p className="text-gray-300 font-semibold">{alt.lockInPeriod}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-1">Liquidity</p>
          <p className="text-blue-400 font-semibold">{alt.liquidity}</p>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4">
        <p className="text-gray-400 text-sm leading-relaxed">{alt.rationale}</p>
      </div>

      <div className="mt-4 flex items-center text-pink-400 text-sm">
        <span className="font-medium">{alt.type}</span>
        <ChevronRight className="w-4 h-4 ml-1" />
      </div>
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Generating your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/50 rounded-xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Recommendations</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">No recommendations available</p>
        </div>
      </div>
    );
  }

  const hasAnyRecommendations = 
    recommendations.stocks.length > 0 ||
    recommendations.mutualFunds.length > 0 ||
    recommendations.bonds.length > 0 ||
    recommendations.realEstate.length > 0 ||
    recommendations.commodities.length > 0 ||
    recommendations.alternativeInvestments.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 flex items-center">
                <Sparkles className="w-10 h-10 text-blue-500 mr-3" />
                AI-Powered Recommendations
              </h1>
              <p className="text-gray-400">Personalized investment insights based on your profile</p>
            </div>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
              Refresh
            </button>
          </div>
          
          {lastUpdated && (
            <div className="flex items-center text-gray-500 text-sm">
              <Clock className="w-4 h-4 mr-2" />
              Last updated: {lastUpdated}
            </div>
          )}
        </div>

        {/* Market Sentiment */}
        {recommendations.marketSentiment && (
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl p-6 mb-8 border border-blue-500/30">
            <div className="flex items-center mb-4">
              <Target className="w-6 h-6 text-blue-400 mr-2" />
              <h2 className="text-2xl font-bold text-white">Market Sentiment</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-gray-400 text-sm mb-1">Trend</p>
                <p className="text-white font-semibold text-lg">{recommendations.marketSentiment.trend}</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">FII Flow</p>
                <p className="text-green-400 font-semibold text-lg">{formatCurrency(recommendations.marketSentiment.fiiFlow)} Cr</p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-1">Risk Level</p>
                <p className={`font-semibold text-lg ${getRiskColor(recommendations.marketSentiment.riskLevel)}`}>
                  {recommendations.marketSentiment.riskLevel}
                </p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">{recommendations.marketSentiment.summary}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="mb-8 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            {filterButtons.map(filter => {
              const Icon = filter.icon;
              const isActive = activeFilter === filter.id;
              const isDisabled = filter.count === 0 && filter.id !== 'all';
              
              return (
                <button
                  key={filter.id}
                  onClick={() => !isDisabled && setActiveFilter(filter.id)}
                  disabled={isDisabled}
                  className={`
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                      : isDisabled
                        ? 'bg-gray-800/30 text-gray-600 cursor-not-allowed'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{filter.label}</span>
                  <span className={`
                    px-2 py-0.5 rounded-full text-xs font-bold
                    ${isActive ? 'bg-white/20' : 'bg-gray-700'}
                  `}>
                    {filter.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recommendations Grid */}
        {hasAnyRecommendations ? (
          <div className="space-y-8">
            {/* Stocks */}
            {(activeFilter === 'all' || activeFilter === 'stocks') && recommendations.stocks.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="w-6 h-6 text-blue-500 mr-2" />
                  Stock Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.stocks.map((stock, index) => renderStockCard(stock, index))}
                </div>
              </div>
            )}

            {/* Mutual Funds */}
            {(activeFilter === 'all' || activeFilter === 'mutualFunds') && recommendations.mutualFunds.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <BarChart2 className="w-6 h-6 text-purple-500 mr-2" />
                  Mutual Fund Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.mutualFunds.map((fund, index) => renderMutualFundCard(fund, index))}
                </div>
              </div>
            )}

            {/* Bonds */}
            {(activeFilter === 'all' || activeFilter === 'bonds') && recommendations.bonds.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Shield className="w-6 h-6 text-green-500 mr-2" />
                  Bond Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.bonds.map((bond, index) => renderBondCard(bond, index))}
                </div>
              </div>
            )}

            {/* Real Estate */}
            {(activeFilter === 'all' || activeFilter === 'realEstate') && recommendations.realEstate.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Building2 className="w-6 h-6 text-orange-500 mr-2" />
                  Real Estate Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.realEstate.map((property, index) => renderRealEstateCard(property, index))}
                </div>
              </div>
            )}

            {/* Commodities */}
            {(activeFilter === 'all' || activeFilter === 'commodities') && recommendations.commodities.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Landmark className="w-6 h-6 text-yellow-500 mr-2" />
                  Commodity Recommendations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.commodities.map((commodity, index) => renderCommodityCard(commodity, index))}
                </div>
              </div>
            )}

            {/* Alternative Investments */}
            {(activeFilter === 'all' || activeFilter === 'alternatives') && recommendations.alternativeInvestments.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Wallet className="w-6 h-6 text-pink-500 mr-2" />
                  Alternative Investments
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recommendations.alternativeInvestments.map((alt, index) => renderAlternativeCard(alt, index))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <AlertCircle className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No recommendations available for the selected filter</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Recommendations;
// =======================================================================================================    