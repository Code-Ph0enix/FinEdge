import React, { useState } from 'react';
import { Search, Loader2, AlertCircle, TrendingUp, ImageIcon, FileText, ChevronDown, ChevronUp, X, ZoomIn } from 'lucide-react';
import axios from 'axios';

// --- INSTRUCTIONS FOR LOCAL PROJECT ---
// 1. In your local project, uncomment the line below:
// import { analyzeStock, StockAnalysisResponse } from '../services/stockApi';
// 2. Then DELETE the 'StockAnalysisResponse' interface and 'analyzeStock' function defined below 
//    (lines 13-55) to avoid duplicates.

// --- TEMPORARY DEFINITIONS FOR PREVIEW (Delete these in local project) ---
export interface StockAnalysisResponse {
  success: boolean;
  analysis: string;
  // Updated to receive dictionary of 4 images
  images: {
    price_history: string | null;
    daily_returns: string | null;
    holdout_pred: string | null;
    future_forecast: string | null;
  };
  error?: string;
}

const analyzeStock = async (query: string): Promise<StockAnalysisResponse> => {
  // Assuming your Flask backend is running on port 5000
  // const API_URL = 'http://localhost:5000/api'; 
  const API_URL = 'https://finedge-backend.onrender.com'; 
  
  try {
    const response = await axios.post(`${API_URL}/api/analyze`, { query });
    return response.data;
  } catch (error: any) {
    console.error('Error analyzing stock:', error);
    return {
      success: false,
      analysis: '',
      images: {
        price_history: null,
        daily_returns: null,
        holdout_pred: null,
        future_forecast: null
      },
      error: error.response?.data?.error || error.message || 'Failed to communicate with analysis server'
    };
  }
};
// -----------------------------------------------------------------------

const StockAnalyzer = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StockAnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // State for collapsible "Reasoning" section
  const [isInsightsOpen, setIsInsightsOpen] = useState(true);

  // State for Full Screen Image Modal
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setIsInsightsOpen(true); // Auto-open insights on new search

    try {
      const data = await analyzeStock(query);
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.error || 'An unknown error occurred during analysis.');
      }
    } catch (err) {
      setError('Failed to connect to the server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-2rem)] p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 z-10 bg-white dark:bg-gray-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Stock Analyzer AI</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Analyze Indian stocks, generate forecasts, and visualize market data
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex-1 relative overflow-y-auto p-6 bg-gray-50/50 dark:bg-gray-900/50">
          
          {/* Search Input Section */}
          <div className="max-w-4xl mx-auto mb-8 z-20">
            <form onSubmit={handleAnalyze} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl opacity-30 group-hover:opacity-50 blur transition duration-200"></div>
              <div className="relative flex items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask AI... (e.g., 'Forecast Tata Motors for next year' or 'Analyze HDFC Bank history')"
                  className="w-full pl-5 pr-14 py-4 rounded-xl border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:ring-inset text-base transition-all"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Content Container */}
          <div className="max-w-5xl mx-auto">
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-700 dark:text-red-400 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Analysis Failed</h3>
                  <p className="text-sm mt-1 opacity-90">{error}</p>
                </div>
              </div>
            )}

            {/* Results Display */}
            {result && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                
                {/* 1. Analysis Text Card (Collapsible) */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                  <div 
                    className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    onClick={() => setIsInsightsOpen(!isInsightsOpen)}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-500" />
                      <h3 className="font-medium text-gray-700 dark:text-gray-200">AI Market Insights (Reasoning)</h3>
                    </div>
                    {isInsightsOpen ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  {isInsightsOpen && (
                    <div className="p-6 animate-in slide-in-from-top-2 duration-200">
                      <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed text-base font-normal">
                        {result.analysis}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Chart Grid Visualization (2x2 Grid) */}
                {result.images && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Image 1: Price History */}
                      {result.images.price_history && (
                        <ChartCard 
                          title="Price History" 
                          image={result.images.price_history} 
                          color="text-blue-500" 
                          onClick={() => setSelectedImage(result.images.price_history)}
                        />
                      )}

                      {/* Image 2: Daily Returns */}
                      {result.images.daily_returns && (
                        <ChartCard 
                          title="Daily Returns Distribution" 
                          image={result.images.daily_returns} 
                          color="text-purple-500"
                          onClick={() => setSelectedImage(result.images.daily_returns)}
                        />
                      )}

                      {/* Image 3: Validation */}
                      {result.images.holdout_pred && (
                        <ChartCard 
                          title="Model Validation (Actual vs Predicted)" 
                          image={result.images.holdout_pred} 
                          color="text-green-500"
                          onClick={() => setSelectedImage(result.images.holdout_pred)}
                        />
                      )}

                      {/* Image 4: Future Forecast */}
                      {result.images.future_forecast && (
                        <ChartCard 
                          title="Future Forecast (Next 1 Year)" 
                          image={result.images.future_forecast} 
                          color="text-orange-500"
                          onClick={() => setSelectedImage(result.images.future_forecast)}
                        />
                      )}

                   </div>
                )}
              </div>
            )}

            {/* Empty State / Welcome Screen */}
            {!result && !loading && !error && (
              <div className="flex flex-col items-center justify-center py-20 opacity-60">
                <div className="p-6 bg-gray-100 dark:bg-gray-700/50 rounded-full mb-4">
                  <TrendingUp className="w-12 h-12 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Ready to Analyze</h3>
                <p className="text-center text-gray-500 dark:text-gray-400 max-w-md">
                  Enter an Indian stock name above (like "Reliance", "TCS", or "Zomato") to see forecasts, historical data, and AI-driven insights.
                </p>
              </div>
            )}

          </div>
        </div>

        {/* --- FULL SCREEN IMAGE MODAL --- */}
        {selectedImage && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button 
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            
            {/* Image Container */}
            <div 
              className="relative max-w-full max-h-full"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image
            >
              <img 
                src={`data:image/png;base64,${selectedImage}`} 
                alt="Full Screen Preview" 
                className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Helper Component for Image Cards
// Now accepts an onClick prop
const ChartCard = ({ title, image, color, onClick }: { title: string, image: string, color: string, onClick: () => void }) => (
  <div 
    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-300 group cursor-pointer"
    onClick={onClick}
  >
    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <ImageIcon className={`w-4 h-4 ${color}`} />
        <h3 className="font-medium text-gray-700 dark:text-gray-200 text-sm">{title}</h3>
      </div>
      <ZoomIn className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
    <div className="p-4 flex justify-center bg-white dark:bg-gray-900 min-h-[300px] items-center relative">
      <div className="relative rounded-lg overflow-hidden w-full">
        <img 
          src={`data:image/png;base64,${image}`} 
          alt={title} 
          className="w-full h-auto object-contain hover:scale-105 transition-transform duration-500"
        />
        {/* Hover Overlay hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center"></div>
      </div>
    </div>
  </div>
);

export default StockAnalyzer;