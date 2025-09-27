import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useComprehensiveMarketSummary } from '../hooks/useStockData';
import { MarketIndex } from '../types';

interface MarketMarqueeProps {
  height?: string;
}

const MarketMarquee: React.FC<MarketMarqueeProps> = ({ 
  height = "80px",
}) => {
  const { marketData, loading, error, refetch } = useComprehensiveMarketSummary();

  const formatValue = (value: number, category: string, name: string) => {
    if (name.includes('USD/INR')) {
      return value.toFixed(4);
    } else if (category === 'Commodities' || category === 'Cryptocurrency') {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else {
      return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Indian Indices': return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'International Indices': return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      case 'Commodities': return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
      case 'Currency': return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'Cryptocurrency': return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
    }
  };

  if (loading && !marketData) {
    return (
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex items-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">Loading market data...</span>
        </div>
      </div>
    );
  }

  if (error && !marketData) {
    return (
      <div 
        className="bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-600 dark:text-red-400">Failed to load market data</span>
          <button
            onClick={refetch}
            className="ml-2 p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded"
          >
            <RefreshCw className="h-4 w-4 text-red-500" />
          </button>
        </div>
      </div>
    );
  }

  if (!marketData?.indices) {
    return null;
  }

  const marketEntries = Object.entries(marketData.indices as { [key: string]: MarketIndex });
  
  // Calculate slower, human-readable speed - each item takes about 4 seconds to pass
  const itemWidth = 220; // Approximate width of each market item
  const totalWidth = marketEntries.length * itemWidth;
  const animationDuration = marketEntries.length * 4; // 4 seconds per item for readability

  return (
    <div>
      {/* Main Marquee */}
      <div 
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-hidden relative"
        style={{ height }}
      >
        {/* Scrolling marquee */}
        <div className="flex items-center h-full">
          <motion.div
            className="flex items-center space-x-4 py-2"
            animate={{
              x: [`0px`, `-${totalWidth + 16}px`] // +16 for the space-x-4 gap
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            {/* First set of items */}
            {marketEntries.map(([name, data]: [string, MarketIndex]) => (
              <div
                key={`first-${name}`}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border min-w-fit ${getCategoryColor(data.category)}`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatValue(data.value, data.category, name)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {data.perChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : data.perChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-medium ${
                      data.perChange > 0 ? 'text-green-500' : 
                      data.perChange < 0 ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {data.perChange > 0 ? '+' : ''}{data.perChange.toFixed(2)}%
                    </span>
                    <span className={`text-xs ${
                      data.change > 0 ? 'text-green-500' : 
                      data.change < 0 ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {/* Duplicate set for seamless looping */}
            {marketEntries.map(([name, data]: [string, MarketIndex]) => (
              <div
                key={`second-${name}`}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border min-w-fit ${getCategoryColor(data.category)}`}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    {name}
                  </span>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatValue(data.value, data.category, name)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  {data.perChange > 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : data.perChange < 0 ? (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  ) : (
                    <div className="h-4 w-4" />
                  )}
                  <div className="flex flex-col items-end">
                    <span className={`text-xs font-medium ${
                      data.perChange > 0 ? 'text-green-500' : 
                      data.perChange < 0 ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {data.perChange > 0 ? '+' : ''}{data.perChange.toFixed(2)}%
                    </span>
                    <span className={`text-xs ${
                      data.change > 0 ? 'text-green-500' : 
                      data.change < 0 ? 'text-red-500' : 
                      'text-gray-500'
                    }`}>
                      {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Refresh Control Bar Below Marquee */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          {/* Left side - Category legend */}
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Indian</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">International</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Commodities</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Currency</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-400">Crypto</span>
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {marketData.totalIndices || marketEntries.length} indices
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {marketData.lastUpdated ? new Date(marketData.lastUpdated).toLocaleTimeString() : 'N/A'}
            </span>
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            )}
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center space-x-1 px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs font-medium text-gray-700 dark:text-gray-300"
              title="Refresh market data"
            >
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketMarquee;