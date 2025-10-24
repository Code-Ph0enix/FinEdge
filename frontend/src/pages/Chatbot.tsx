/**
 * FinEdge AI Chatbot - WITH MONGODB PERSISTENCE
 * 
 * Features:
 * - Chat history persistence in MongoDB
 * - Voice input/output support
 * - Session management
 * - Typing animations
 * - Auto-save with debouncing
 * 
 * @version 2.0.0 - MongoDB Integration
 */

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useUser } from '@clerk/clerk-react'; // ✅ NEW - Import Clerk hook
import { SERVER_URL } from '../utils/utils';
import ChatHeader from '../components/ChatHeader';
import ChatMessage from '../components/ChatMessage';
import ChatInput from '../components/ChatInput';
import SpeechModal from '../components/SpeechModal';
import { Message } from '../types';
import { 
  getThinkingPhrasesForQuery, 
  DEFAULT_PROMPTS, 
  cleanBotResponse 
} from '../utils/chatUtils';

// ✅ NEW - Import MongoDB chat functions
import { 
  fetchAIChatHistory, 
  saveAIChatHistory, 
  clearAIChatHistory 
} from '../utils/chatApi';

// LEGACY - Keep session storage for backward compatibility
const CHAT_SESSION_KEY = 'finedge-chat-session';
const CHAT_SESSION_ID_KEY = 'finedge-session-id';

// Generate or get session ID
const generateSessionId = (): string => {
  const stored = localStorage.getItem(CHAT_SESSION_ID_KEY);
  if (stored) return stored;
  
  const newId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem(CHAT_SESSION_ID_KEY, newId);
  return newId;
};

// LEGACY - Keep localStorage functions for backward compatibility
const saveChatSession = (messages: Message[]) => {
  try {
    localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString()
      })),
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.warn('Failed to save chat session:', error);
  }
};

// ============================================================================================================================================
// REMOVED AS OF NOW, MIGHT BE USEFUL LATER
// UNCOMMENT THIS ENTIRE FUNCTION IF NEEDED
// ============================================================================================================================================

// const loadChatSession = (): Message[] | null => {
//   try {
//     const stored = localStorage.getItem(CHAT_SESSION_KEY);
//     if (!stored) return null;
    
//     const session = JSON.parse(stored);
//     const messages = session.messages.map((msg: any) => ({
//       ...msg,
//       timestamp: new Date(msg.timestamp)
//     }));
    
//     const lastUpdated = new Date(session.lastUpdated);
//     const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
//     if (hoursSinceUpdate > 24) {
//       clearChatSession();
//       return null;
//     }
    
//     return messages;
//   } catch (error) {
//     console.warn('Failed to load chat session:', error);
//     return null;
//   }
// };

const clearChatSession = () => {
  try {
    localStorage.removeItem(CHAT_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear chat session:', error);
  }
};

/**
 * Main Chatbot component - AI Financial Assistant
 */
const Chatbot = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<number>(); // ✅ NEW - For debouncing
  
  // ✅ NEW - Get Clerk user
  const { user, isLoaded } = useUser();
  
  // Welcome message
  const welcomeMessage: Message = {
    type: 'bot',
    content: 'Hello! I\'m your AI financial assistant. How can I help you today?',
    timestamp: new Date()
  };
  
  // State management
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [, setCurrentThinkingIndex] = useState(0);
  const [currentThinkingPhrases, setCurrentThinkingPhrases] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSyncing, setIsSyncing] = useState(false); // ✅ NEW - Sync indicator
  const [isLoadingHistory, setIsLoadingHistory] = useState(true); // ✅ NEW - Loading state

  // ============================================================================
  // ✅ NEW - LOAD CHAT HISTORY FROM MONGODB ON MOUNT
  // ============================================================================
  useEffect(() => {
    const loadHistory = async () => {
      if (!isLoaded || !user?.id) {
        setIsLoadingHistory(false);
        return;
      }

      console.log('📥 Loading chat history from MongoDB...');
      setIsLoadingHistory(true);

      try {
        const history = await fetchAIChatHistory(user.id);
        
        if (history && history.length > 0) {
          // Convert timestamp strings back to Date objects
          const messagesWithDates = history.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          
          setMessages(messagesWithDates);
          console.log(`✅ Restored ${history.length} messages from MongoDB`);
        } else {
          console.log('ℹ️ No previous chat history found, starting fresh');
          setMessages([welcomeMessage]);
        }
      } catch (error) {
        console.error('❌ Error loading chat history:', error);
        setMessages([welcomeMessage]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [isLoaded, user?.id]); // Dependency: load when user is ready

  // ============================================================================
  // ✅ NEW - AUTO-SAVE TO MONGODB (WITH DEBOUNCING)
  // ============================================================================
  useEffect(() => {
    // Don't save if:
    // - User not loaded
    // - No user ID
    // - Only welcome message
    // - Currently loading history
    if (!user?.id || messages.length <= 1 || isLoadingHistory) {
      return;
    }

    // Clear previous timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout to save after 2 seconds of inactivity
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSyncing(true);
      console.log('💾 Auto-saving chat history to MongoDB...');
      
      const success = await saveAIChatHistory(user.id, messages);
      
      setIsSyncing(false);
      
      if (success) {
        console.log('✅ Chat history saved to MongoDB');
      } else {
        console.error('❌ Failed to save chat history to MongoDB');
      }
    }, 2000); // 2-second debounce

    // Cleanup on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [messages, user?.id, isLoadingHistory]);

  // ============================================================================
  // LEGACY - Keep localStorage save for backward compatibility
  // ============================================================================
  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession(messages);
    }
  }, [messages]);

  // ============================================================================
  // SCROLL TO BOTTOM
  // ============================================================================
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ============================================================================
  // THINKING ANIMATION
  // ============================================================================
  useEffect(() => {
    let thinkingInterval: number;
    
    if (isTyping) {
      thinkingInterval = setInterval(() => {
        setCurrentThinkingIndex((prev) => {
          const nextIndex = (prev + 1) % currentThinkingPhrases.length;
          setMessages(messages => {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.isThinking && currentThinkingPhrases.length > 0) {
              const currentContent = Array.isArray(lastMessage.content) 
                ? lastMessage.content 
                : [lastMessage.content];
              return [
                ...messages.slice(0, -1),
                {
                  ...lastMessage,
                  content: [...currentContent, currentThinkingPhrases[nextIndex]]
                }
              ];
            }
            return messages;
          });
          return nextIndex;
        });
      }, 2000);
    }

    return () => {
      if (thinkingInterval) {
        clearInterval(thinkingInterval);
      }
    };
  }, [isTyping, currentThinkingPhrases]);

  // ============================================================================
  // ✅ UPDATED - CLEAR CHAT (CLEARS MONGODB TOO!)
  // ============================================================================
  const clearChat = async () => {
    if (!user?.id) {
      console.warn('⚠️ Cannot clear chat: User not logged in');
      return;
    }

    const confirmClear = window.confirm('Are you sure you want to clear all chat history?');
    if (!confirmClear) return;

    try {
      console.log('🗑️ Clearing chat history...');
      
      // Clear backend agent session (your existing logic)
      const sessionId = generateSessionId();
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      await axios.post(`${SERVER_URL}/clear-chat-session`, formData);
      
      // ✅ NEW - Clear MongoDB history
      await clearAIChatHistory(user.id);
      
      // Generate new session ID
      localStorage.removeItem(CHAT_SESSION_ID_KEY);
      
      console.log('✅ Chat history cleared from all sources');
    } catch (error) {
      console.warn('⚠️ Failed to clear some chat sources:', error);
    }
    
    // Clear frontend
    setMessages([welcomeMessage]);
    clearChatSession();
  };

  // ============================================================================
  // TEXT-TO-SPEECH
  // ============================================================================
  const speak = (text: string, messageIndex: number) => {
    window.speechSynthesis.cancel();

    if (isSpeaking === messageIndex) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN';
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsSpeaking(null);
    };

    setIsSpeaking(messageIndex);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // ============================================================================
  // HANDLE MESSAGE SUBMISSION
  // ============================================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      type: 'user',
      content: input,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    const dynamicPhrases = getThinkingPhrasesForQuery(input);
    setCurrentThinkingPhrases(dynamicPhrases);
    
    setInput('');
    setIsTyping(true);
    setCurrentThinkingIndex(0);

    // Add thinking message
    setMessages(prev => [...prev, {
      type: 'bot',
      content: [dynamicPhrases[0]],
      timestamp: new Date(),
      isThinking: true
    }]);

    try {
      const sessionId = generateSessionId();
      const formData = new FormData();
      formData.append('input', input);
      formData.append('session_id', sessionId);

      const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${SERVER_URL}/agent`,
        data: formData
      };

      const response = await axios.request(config);
      console.log(response.data);
      setIsTyping(false);
      
      const cleanedOutput = cleanBotResponse(response.data.output || response.data || '');
      
      // Remove thinking message
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.isThinking) {
          return [
            ...prev.slice(0, -1),
            {
              type: 'bot',
              content: '',
              timestamp: new Date(),
              isTyping: true
            }
          ];
        }
        return prev;
      });

      // Typing animation
      let displayedText = '';
      let charIndex = 0;

      const typingInterval = setInterval(() => {
        if (charIndex < cleanedOutput.length) {
          displayedText += cleanedOutput[charIndex];
          charIndex++;
          
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = {
              type: 'bot',
              content: displayedText,
              timestamp: new Date()
            };
            return newMessages;
          });
        } else {
          clearInterval(typingInterval);
        }
      }, 8);

    } catch (error) {
      console.error(error);
      setIsTyping(false);
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.isThinking) {
          return [
            ...prev.slice(0, -1),
            {
              type: 'bot',
              content: "Sorry, I encountered an error. Please try again.",
              timestamp: new Date()
            }
          ];
        }
        return prev;
      });
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
  };
  
  const handleInputChange = (value: string) => {
    setInput(value);
  };
  
  const handleVoiceClick = () => {
    setIsSpeechModalOpen(true);
  };
  
  const handleSpeechModalClose = () => {
    setIsSpeechModalOpen(false);
    setIsListening(false);
    setTranscript('');
  };
  
  const handleUseTranscript = () => {
    setInput(transcript);
    setIsSpeechModalOpen(false);
    setIsListening(false);
    setTranscript('');
  };
  
  const handleClearTranscript = () => {
    setTranscript('');
  };

  const startListening = () => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');
        setTranscript(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error(event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      return recognition;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="h-[calc(100vh-2rem)] p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex flex-col">
        {/* ✅ NEW - Updated Chat Header with sync indicator */}
        <ChatHeader 
          onClearChat={clearChat}
          syncStatus={isSyncing ? 'syncing' : 'synced'} // Pass sync status
        />

        {/* ✅ NEW - Loading indicator */}
        {isLoadingHistory && (
          <div className="flex items-center justify-center p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 dark:border-indigo-400 border-t-transparent mr-3"></div>
            <span className="text-gray-600 dark:text-gray-300">Loading chat history...</span>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => (
            <ChatMessage
              key={index}
              message={message}
              index={index}
              isSpeaking={isSpeaking}
              onSpeak={speak}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <ChatInput
          input={input}
          onInputChange={handleInputChange}
          onSubmit={handleSubmit}
          onVoiceClick={handleVoiceClick}
          defaultPrompts={DEFAULT_PROMPTS}
          onPromptClick={handlePromptClick}
        />
      </div>

      {/* Speech Modal */}
      <SpeechModal
        isOpen={isSpeechModalOpen}
        onClose={handleSpeechModalClose}
        isListening={isListening}
        transcript={transcript}
        onStartListening={startListening}
        onStopListening={() => setIsListening(false)}
        onUseText={handleUseTranscript}
        onClearTranscript={handleClearTranscript}
      />
    </div>
  );
};

export default Chatbot;
