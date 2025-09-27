import { useState, useEffect, useCallback } from 'react';
import { stockApiService, MarketSummary } from '../services/stockApi';
import { 
  StockPrice, 
  MarketGainer, 
  PortfolioStock, 
  MarketSummaryResponse 
} from '../types';

// Hook for managing multiple stock prices
export const useStockPrices = (tickers: string[], refreshInterval: number = 60000) => {
  const [prices, setPrices] = useState<StockPrice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (tickers.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stockPrices = await stockApiService.getStockPrices(tickers);
      setPrices(stockPrices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock prices');
    } finally {
      setLoading(false);
    }
  }, [tickers]);

  useEffect(() => {
    fetchPrices();
    
    const interval = setInterval(fetchPrices, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrices, refreshInterval]);

  return { prices, loading, error, refetch: fetchPrices };
};

// Hook for single stock price
export const useSingleStockPrice = (ticker: string, refreshInterval: number = 60000) => {
  const [price, setPrice] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const stockPrice = await stockApiService.getSingleStockPrice(ticker);
      setPrice(stockPrice);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stock price');
    } finally {
      setLoading(false);
    }
  }, [ticker]);

  useEffect(() => {
    fetchPrice();
    
    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchPrice, refreshInterval]);

  return { price, loading, error, refetch: fetchPrice };
};

// Hook for NIFTY gainers
export const useNiftyGainers = (count: number = 10, refreshInterval: number = 120000) => {
  const [gainers, setGainers] = useState<MarketGainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGainers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const niftyGainers = await stockApiService.getNiftyGainers(count);
      setGainers(niftyGainers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch NIFTY gainers');
    } finally {
      setLoading(false);
    }
  }, [count]);

  useEffect(() => {
    fetchGainers();
    
    const interval = setInterval(fetchGainers, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchGainers, refreshInterval]);

  return { gainers, loading, error, refetch: fetchGainers };
};

// Hook for portfolio analysis
export const usePortfolioAnalysis = (
  stocks: Array<{symbol: string; boughtPrice: number; quantity: number}>,
  refreshInterval: number = 300000 // 5 minutes
) => {
  const [analysis, setAnalysis] = useState<{
    stocks: PortfolioStock[];
    totalProfitOrLoss: number;
    timestamp: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (stocks.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const portfolioAnalysis = await stockApiService.analyzePortfolio(stocks);
      setAnalysis(portfolioAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze portfolio');
    } finally {
      setLoading(false);
    }
  }, [stocks]);

  useEffect(() => {
    fetchAnalysis();
    
    const interval = setInterval(fetchAnalysis, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAnalysis, refreshInterval]);

  return { analysis, loading, error, refetch: fetchAnalysis };
};

// Hook for market summary
export const useMarketSummary = (refreshInterval: number = 60000) => {
  const [summary, setSummary] = useState<MarketSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const marketSummary = await stockApiService.getMarketSummary();
      setSummary(marketSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market summary');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
    
    const interval = setInterval(fetchSummary, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchSummary, refreshInterval]);

  return { summary, loading, error, refetch: fetchSummary };
};

// Hook for real-time portfolio value calculation
export const usePortfolioValue = (
  holdings: Array<{symbol: string; quantity: number}>,
  refreshInterval: number = 60000
) => {
  const [totalValue, setTotalValue] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateValue = useCallback(async () => {
    if (holdings.length === 0) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const tickers = holdings.map(h => h.symbol);
      const prices = await stockApiService.getStockPrices(tickers);
      
      let total = 0;
      holdings.forEach(holding => {
        const priceData = prices.find(p => p.symbol === holding.symbol);
        if (priceData?.price) {
          total += priceData.price * holding.quantity;
        }
      });
      
      setTotalValue(total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to calculate portfolio value');
    } finally {
      setLoading(false);
    }
  }, [holdings]);

  useEffect(() => {
    calculateValue();
    
    const interval = setInterval(calculateValue, refreshInterval);
    return () => clearInterval(interval);
  }, [calculateValue, refreshInterval]);

  return { totalValue, loading, error, refetch: calculateValue };
};

// Hook for comprehensive market summary (15+ indices)
export const useComprehensiveMarketSummary = (refreshInterval: number = 60000) => {
  const [marketData, setMarketData] = useState<MarketSummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMarketData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await stockApiService.getComprehensiveMarketSummary();
      setMarketData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comprehensive market data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();
    
    const interval = setInterval(fetchMarketData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchMarketData, refreshInterval]);

  return { marketData, loading, error, refetch: fetchMarketData };
};