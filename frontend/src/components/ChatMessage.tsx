import { motion } from 'framer-motion';
import { Bot, User, Volume2, VolumeX } from 'lucide-react';
import { Message, ChatMessageProps } from '../types';

/**
 * Individual chat message component
 * Handles rendering of both user and bot messages with appropriate styling
 */
const ChatMessage = ({ message, index, isSpeaking, onSpeak }: ChatMessageProps) => {
  const handleSpeak = () => {
    const text = Array.isArray(message.content) 
      ? message.content.join('\n') 
      : message.content;
    onSpeak(text, index);
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex items-start space-x-2 max-w-[80%] ${
        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
      }`}>
        {/* Avatar */}
        <div className={`p-2 rounded-lg ${
          message.type === 'user' ? 'bg-indigo-600' : 'bg-gray-100 dark:bg-gray-700'
        }`}>
          {message.type === 'user' ? (
            <User className="h-5 w-5 text-white" />
          ) : (
            <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          )}
        </div>

        {/* Message Bubble */}
        <div className={`relative p-4 rounded-2xl ${
          message.type === 'user' 
            ? 'bg-indigo-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}>
          {/* Message Content */}
          <div className="text-sm whitespace-pre-line">
            {Array.isArray(message.content) ? (
              message.content.map((line, i) => (
                <motion.div
                  key={i}
                  initial={message.isThinking ? { opacity: 0 } : { opacity: 1 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`${
                    line.startsWith('🤔') ? 'font-semibold text-indigo-600 dark:text-indigo-400' :
                    line.startsWith('───') ? 'text-gray-400 dark:text-gray-500' :
                    message.isThinking && i === message.content.length - 1 ? 'text-gray-600 dark:text-gray-400' :
                    ''
                  }`}
                >
                  {line}
                </motion.div>
              ))
            ) : (
              message.content
            )}
          </div>

          {/* Message Footer */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs opacity-70">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            
            {/* Speech Button for Bot Messages */}
            {message.type === 'bot' && !message.isThinking && (
              <button
                onClick={handleSpeak}
                className={`ml-2 p-1 rounded-full transition-colors ${
                  isSpeaking === index
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                    : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400'
                }`}
              >
                {isSpeaking === index ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;