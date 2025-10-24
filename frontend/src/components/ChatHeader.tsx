import { Bot, RotateCcw } from 'lucide-react';
import { ChatHeaderProps } from '../types';

/**
 * Header component for the chat interface
 * Displays the bot icon, title, subtitle, sync status, and optional clear chat button
 */
const ChatHeader = ({ 
  title = "AI Financial Assistant", 
  subtitle = "Ask me anything about your finances",
  onClearChat,
  syncStatus = 'synced' // ✅ ADDED with default value
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
        
        {/* ✅ NEW - Right side with sync status and clear button */}
        <div className="flex items-center space-x-4">
          {/* ✅ NEW - Sync status indicator */}
          <div className="flex items-center space-x-2 text-xs">
            {syncStatus === 'syncing' && (
              <>
                <div className="animate-spin h-3 w-3 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full"></div>
                <span className="text-gray-500 dark:text-gray-400">Saving...</span>
              </>
            )}
            {syncStatus === 'synced' && (
              <>
                <span className="text-green-500">✓</span>
                <span className="text-gray-500 dark:text-gray-400">Synced</span>
              </>
            )}
            {syncStatus === 'error' && (
              <>
                <span className="text-red-500">✗</span>
                <span className="text-red-500">Error</span>
              </>
            )}
          </div>

          {/* Clear Chat Button */}
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
    </div>
  );
};

export default ChatHeader;
//DONE --- IGNORE ---