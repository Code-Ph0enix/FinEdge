import { Bot, RotateCcw } from 'lucide-react';
import { ChatHeaderProps } from '../types';

/**
 * Header component for the chat interface
 * Displays the bot icon, title, subtitle, and optional clear chat button
 */
const ChatHeader = ({ 
  title = "AI Financial Assistant", 
  subtitle = "Ask me anything about your finances",
  onClearChat
}: ChatHeaderProps) => {
  return (
    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Bot className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>
        
        {onClearChat && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Clear chat history"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Clear Chat</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeader;