import { Send, Mic } from 'lucide-react';
import { ChatInputProps } from '../types';

/**
 * Chat input component with text input, voice button, and default prompts
 * Handles user input and form submission
 */
const ChatInput = ({
  input,
  onInputChange,
  onSubmit,
  onVoiceClick,
  defaultPrompts,
  onPromptClick
}: ChatInputProps) => {
  return (
    <div className="p-6 border-t border-gray-200 dark:border-gray-700">
      {/* Default Prompts */}
      <div className="mb-4 flex flex-wrap gap-2">
        {defaultPrompts.map((prompt, index) => (
          <button
            key={index}
            onClick={() => onPromptClick(prompt)}
            className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={onSubmit} className="flex space-x-4">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent"
        />
        
        {/* Voice Input Button */}
        <button
          type="button"
          onClick={onVoiceClick}
          className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 focus:outline-none"
        >
          <Mic className="h-5 w-5" />
        </button>
        
        {/* Send Button */}
        <button
          type="submit"
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
};

export default ChatInput;