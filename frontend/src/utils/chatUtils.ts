/**
 * Dynamic thinking phrases based on query content
 * Provides contextual loading messages for different types of financial queries
 */
export const getThinkingPhrasesForQuery = (query: string): string[] => {
  const lowerQuery = query.toLowerCase();
  
  // Stock price queries
  if (lowerQuery.includes('stock price') || lowerQuery.includes('current price') || lowerQuery.includes('share price')) {
    return [
      "Fetching real-time stock data...",
      "Checking market prices...",
      "Analyzing current valuations...",
      "Preparing your answer..."
    ];
  }
  
  // Investment advice queries
  if (lowerQuery.includes('invest') || lowerQuery.includes('should i buy') || lowerQuery.includes('recommendation')) {
    return [
      "Reviewing company financials...",
      "Assessing risk factors...",
      "Considering market trends...",
      "Preparing your answer..."
    ];
  }
  
  // Performance/return queries
  if (lowerQuery.includes('return') || lowerQuery.includes('performance') || lowerQuery.includes('gain') || lowerQuery.includes('loss')) {
    return [
      "Calculating historical returns...",
      "Analyzing performance metrics...",
      "Reviewing price movements...",
      "Preparing your answer..."
    ];
  }
  
  // Market analysis queries
  if (lowerQuery.includes('market') || lowerQuery.includes('sector') || lowerQuery.includes('industry') || lowerQuery.includes('nifty') || lowerQuery.includes('sensex')) {
    return [
      "Scanning market indices...",
      "Analyzing sector performance...",
      "Evaluating economic indicators...",
      "Preparing your answer..."
    ];
  }
  
  // Company analysis queries
  if (lowerQuery.includes('company') || lowerQuery.includes('business') || lowerQuery.includes('financials') || lowerQuery.includes('revenue')) {
    return [
      "Analyzing company fundamentals...",
      "Reviewing financial statements...",
      "Examining growth prospects...",
      "Preparing your answer..."
    ];
  }
  
  // Portfolio queries
  if (lowerQuery.includes('portfolio') || lowerQuery.includes('diversify') || lowerQuery.includes('allocation')) {
    return [
      "Analyzing portfolio composition...",
      "Assessing risk distribution...",
      "Optimizing investment mix...",
      "Preparing your answer..."
    ];
  }
  
  // Default general financial phrases
  return [
    "Analyzing your financial query...",
    "Gathering relevant data...",
    "Generating insights...",
    "Preparing your answer..."
  ];
};

/**
 * Default conversation starter prompts
 */
export const DEFAULT_PROMPTS = [
  "What is the current stock price of Adani Green Energy?",
  "Should I invest in Tata Motors right now?",
  "Give me last week returns of Reliance Industries",
  "How is the technology sector performing today?",
];

// Message interface is now imported from centralized types

/**
 * Clean bot response by removing formatting artifacts
 */
export const cleanBotResponse = (response: string): string => {
  return response
    .replace(/\*\*/g, '') // Remove bold markdown
    .replace(/\*/g, '') // Remove italic markdown
    .replace(/#{1,6}\s/g, '') // Remove markdown headers
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/`([^`]+)`/g, '$1') // Remove inline code formatting
    .replace(/^\s*[\-\*\+]\s/gm, '• ') // Convert markdown lists to bullet points
    .replace(/^\s*\d+\.\s/gm, '') // Remove numbered list formatting
    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
    .replace(/^\s+|\s+$/g, '') // Trim whitespace
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1'); // Remove markdown links, keep text
};