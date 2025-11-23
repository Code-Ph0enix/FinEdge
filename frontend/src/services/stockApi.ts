import axios from 'axios';
import { SERVER_URL } from '../utils/utils';
import { 
  StockPrice, 
  MarketGainer, 
  PortfolioStock, 
  MarketIndex, 
  MarketSummaryResponse 
} from '../types';

// --- NEW INTERFACE FOR AI ANALYSIS ---
export interface StockAnalysisResponse {
  success: boolean;
  analysis: string;
  image: string | null;
  error?: string;
}

// Legacy interface for backward compatibility
export interface MarketSummary {
  NIFTY: MarketIndex;
  SENSEX: MarketIndex;
  BANKNIFTY: MarketIndex;
}

class StockApiService {
  private baseURL: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout: number = 60000; // 1 minute cache

  constructor() {
    this.baseURL = SERVER_URL;
  }

  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  private getCache(cacheKey: string): any {
    const cached = this.cache.get(cacheKey);
    return cached?.data;
  }

  /**
   * Get current stock prices for multiple tickers
   */
  async getStockPrices(tickers: string[]): Promise<StockPrice[]> {
    const cacheKey = `stock-prices-${tickers.join(',')}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.post(`${this.baseURL}/api/stock-price`, {
        tickers
      });
      
      const prices = response.data.prices;
      this.setCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('Error fetching stock prices:', error);
      throw new Error('Failed to fetch stock prices');
    }
  }

  /**
   * Get single stock price
   */
  async getSingleStockPrice(ticker: string): Promise<number | null> {
    const prices = await this.getStockPrices([ticker]);
    return prices[0]?.price || null;
  }

  /**
   * Get NIFTY top gainers
   */
  async getNiftyGainers(count: number = 10): Promise<MarketGainer[]> {
    const cacheKey = `nifty-gainers-${count}`;
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/nifty-gainers?count=${count}`);
      const gainers = response.data;
      this.setCache(cacheKey, gainers);
      return gainers;
    } catch (error) {
      console.error('Error fetching NIFTY gainers:', error);
      throw new Error('Failed to fetch NIFTY gainers');
    }
  }

  /**
   * Analyze portfolio profit/loss
   */
  async analyzePortfolio(stocks: Array<{
    symbol: string;
    boughtPrice: number;
    quantity: number;
  }>): Promise<{
    stocks: PortfolioStock[];
    totalProfitOrLoss: number;
    timestamp: string;
  }> {
    try {
      const response = await axios.post(`${this.baseURL}/api/portfolio-analysis`, {
        stocks
      });
      
      return response.data;
    } catch (error) {
      console.error('Error analyzing portfolio:', error);
      throw new Error('Failed to analyze portfolio');
    }
  }

  /**
   * Get comprehensive market indices summary (15+ indices)
   */
  async getComprehensiveMarketSummary(): Promise<MarketSummaryResponse> {
    const cacheKey = 'comprehensive-market-summary';
    
    if (this.isCacheValid(cacheKey)) {
      return this.getCache(cacheKey);
    }

    try {
      const response = await axios.get(`${this.baseURL}/api/market-summary`);
      const summary = response.data;
      this.setCache(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('Error fetching comprehensive market summary:', error);
      throw new Error('Failed to fetch comprehensive market summary');
    }
  }

  /**
   * Get market indices summary (legacy - for backward compatibility)
   */
  async getMarketSummary(): Promise<MarketSummary> {
    try {
      const comprehensive = await this.getComprehensiveMarketSummary();
      
      // Extract legacy format from comprehensive data
      const indices = comprehensive.indices as { [key: string]: MarketIndex };
      return {
        NIFTY: indices['NIFTY 50'] || { value: 0, change: 0, perChange: 0, timestamp: '', symbol: '', category: '' },
        SENSEX: indices['SENSEX'] || { value: 0, change: 0, perChange: 0, timestamp: '', symbol: '', category: '' },
        BANKNIFTY: indices['BANK NIFTY'] || { value: 0, change: 0, perChange: 0, timestamp: '', symbol: '', category: '' }
      };
    } catch (error) {
      console.error('Error fetching market summary:', error);
      throw new Error('Failed to fetch market summary');
    }
  }

  /**
   * --- NEW METHOD: Analyze Stock with AI ---
   * Calls the /api/analyze endpoint defined in stock_routes.py
   */
  async analyzeStock(query: string): Promise<StockAnalysisResponse> {
    // We typically don't cache this as user queries change often, 
    // but you could add caching here if desired.
    try {
      const response = await axios.post(`${this.baseURL}/api/analyze`, { query });
      return response.data;
    } catch (error: any) {
      console.error('Error analyzing stock:', error);
      // Return a structured error response instead of throwing, 
      // so the UI can handle it gracefully without crashing.
      return {
        success: false,
        analysis: '',
        image: null,
        error: error.response?.data?.error || error.message || 'Failed to communicate with analysis server'
      };
    }
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Set cache timeout (in milliseconds)
   */
  setCacheTimeout(timeout: number): void {
    this.cacheTimeout = timeout;
  }
}

// Export singleton instance
export const stockApiService = new StockApiService();

// Export individual functions for easier imports
export const getStockPrices = (tickers: string[]) => stockApiService.getStockPrices(tickers);
export const getSingleStockPrice = (ticker: string) => stockApiService.getSingleStockPrice(ticker);
export const getNiftyGainers = (count?: number) => stockApiService.getNiftyGainers(count);
export const analyzePortfolio = (stocks: Array<{symbol: string; boughtPrice: number; quantity: number}>) => 
  stockApiService.analyzePortfolio(stocks);
export const getMarketSummary = () => stockApiService.getMarketSummary();
export const getComprehensiveMarketSummary = () => stockApiService.getComprehensiveMarketSummary();

// --- NEW EXPORT ---
export const analyzeStock = (query: string) => stockApiService.analyzeStock(query);