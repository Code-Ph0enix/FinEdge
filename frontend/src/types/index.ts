/**
 * Shared TypeScript interfaces and types for the FinEdge application
 * Consolidates common types used across multiple components
 */

// === Chat/Messaging Types ===

/**
 * Chat message interface for the AI chatbot
 */
export interface Message {
  type: 'user' | 'bot';
  content: string | string[];
  timestamp: Date;
  isThinking?: boolean;
  isTyping?: boolean;
}

// === Market Data Types ===

/**
 * Stock price information
 */
export interface StockPrice {
  symbol: string;
  price: number | null;
  timestamp?: string;
  error?: string;
}

/**
 * Market gainer information
 */
export interface MarketGainer {
  symbol: string;
  ltp: number;
  netChng: number;
  perChange: number;
}

/**
 * Portfolio stock information
 */
export interface PortfolioStock {
  symbol: string;
  boughtPrice: number;
  currentPrice: number;
  quantity: number;
  profitOrLoss: number;
  totalValue: number;
  error?: string;
}

/**
 * Market index information
 */
export interface MarketIndex {
  value: number;
  change: number;
  perChange: number;
  timestamp: string;
  name?: string;
  symbol: string;
  category: string;
  error?: string;
}

/**
 * Market summary response from API
 */
export interface MarketSummaryResponse {
  indices: { [key: string]: MarketIndex } | MarketIndex[];
  totalIndices?: number;
  lastUpdated?: string;
  timestamp?: string;
}

// === Portfolio/Financial Types ===

/**
 * Risk assessment metrics
 */
export interface RiskMetrics {
  volatility: number;
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  var: number; // Value at Risk
}

/**
 * Extended risk metrics with calculated score
 */
export interface RiskMetricsWithScore extends RiskMetrics {
  riskScore: number;
}

/**
 * Financial liability information
 */
export interface Liability {
  type: string;
  amount: number;
  interestRate?: number;
  dueDate?: string;
}

/**
 * Financial activity record
 */
export interface Activity {
  id: string;
  type: 'buy' | 'sell' | 'deposit' | 'withdrawal';
  description: string;
  amount: number;
  date: string;
}

/**
 * Investment recommendation
 */
export interface Investment {
  id: number;
  name: string;
  type: string;
  expectedReturn: number;
  risk: 'Low' | 'Medium' | 'High';
  investment: number;
  description: string;
}

/**
 * Asset allocation information
 */
export interface AssetAllocation {
  category: string;
  percentage: number;
  amount: number;
  color?: string;
}

/**
 * Income stream information
 */
export interface IncomeStream {
  source: string;
  monthlyAmount: number;
  isRecurring: boolean;
}

/**
 * Expense category information
 */
export interface ExpenseCategory {
  category: string;
  monthlyAmount: number;
  isEssential: boolean;
}

/**
 * Investment goal information
 */
export interface InvestmentGoal {
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
}

/**
 * Portfolio summary information
 */
export interface PortfolioSummary {
  totalValue: number;
  todayGainLoss: number;
  todayGainLossPercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

/**
 * Market indicator information
 */
export interface MarketIndicator {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

/**
 * Performance data point for charts
 */
export interface PerformanceDataPoint {
  date: string;
  value: number;
  benchmark?: number;
}

/**
 * Monthly data for financial tracking
 */
export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

/**
 * Recent activity information
 */
export interface RecentActivity {
  id: string;
  type: 'investment' | 'withdrawal' | 'dividend' | 'expense';
  description: string;
  amount: number;
  date: string;
  category?: string;
}

// === API Response Types ===

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

/**
 * Stock price API response
 */
export interface StockPriceResponse {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: string;
}

/**
 * Market gainer API response
 */
export interface MarketGainerResponse {
  gainers: MarketGainer[];
  timestamp: string;
}

/**
 * Portfolio analysis API response
 */
export interface PortfolioAnalysisResponse {
  summary: PortfolioSummary;
  holdings: PortfolioStock[];
  riskMetrics: RiskMetrics;
  recentActivities: RecentActivity[];
  assetAllocation: AssetAllocation[];
  performance: PerformanceDataPoint[];
  recommendations: Investment[];
}

// === Component Props Types ===

/**
 * Dashboard layout component props
 */
export interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Market marquee component props
 */
export interface MarketMarqueeProps {
  indices?: MarketIndex[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

/**
 * Chat message component props
 */
export interface ChatMessageProps {
  message: Message;
  index: number;
  isSpeaking: number | null;
  onSpeak: (text: string, messageIndex: number) => void;
}

/**
 * Speech modal component props
 */
export interface SpeechModalProps {
  isOpen: boolean;
  onClose: () => void;
  isListening: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  onUseText: () => void;
  onClearTranscript: () => void;
}

/**
 * Chat header component props
 */
export interface ChatHeaderProps {
  title?: string;
  subtitle?: string;
}

/**
 * Chat input component props
 */
export interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onVoiceClick: () => void;
  defaultPrompts: string[];
  onPromptClick: (prompt: string) => void;
}

// === Utility Types ===

/**
 * Schema validation utility type
 */
export interface SchemaValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  data?: any;
}

/**
 * Theme context type
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Navigation route type
 */
export interface NavigationRoute {
  path: string;
  name: string;
  icon?: React.ComponentType;
  requiresAuth?: boolean;
}