import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
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

// Session storage keys
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

// Utility functions for session persistence
const saveChatSession = (messages: Message[]) => {
  try {
    localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify({
      messages: messages.map(msg => ({
        ...msg,
        timestamp: msg.timestamp.toISOString() // Convert Date to string for storage
      })),
      lastUpdated: new Date().toISOString()
    }));
  } catch (error) {
    console.warn('Failed to save chat session:', error);
  }
};

const loadChatSession = (): Message[] | null => {
  try {
    const stored = localStorage.getItem(CHAT_SESSION_KEY);
    if (!stored) return null;
    
    const session = JSON.parse(stored);
    const messages = session.messages.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp) // Convert string back to Date
    }));
    
    // Check if session is from the last 24 hours (clean up old sessions)
    const lastUpdated = new Date(session.lastUpdated);
    const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceUpdate > 24) {
      // Session is too old, clear it
      clearChatSession();
      return null;
    }
    
    return messages;
  } catch (error) {
    console.warn('Failed to load chat session:', error);
    return null;
  }
};

const clearChatSession = () => {
  try {
    localStorage.removeItem(CHAT_SESSION_KEY);
  } catch (error) {
    console.warn('Failed to clear chat session:', error);
  }
};

/**
 * Main Chatbot component - AI Financial Assistant
 * Provides conversational interface for financial queries with voice support
 */
const Chatbot = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State management with session persistence
  const [messages, setMessages] = useState<Message[]>(() => {
    // Try to load saved session on component mount
    const savedMessages = loadChatSession();
    return savedMessages || [
      {
        type: 'bot',
        content: 'Hello! I\'m your AI financial assistant. How can I help you today?',
        timestamp: new Date()
      }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [, setCurrentThinkingIndex] = useState(0);
  const [currentThinkingPhrases, setCurrentThinkingPhrases] = useState<string[]>([]);
  const [isSpeaking, setIsSpeaking] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isSpeechModalOpen, setIsSpeechModalOpen] = useState(false);
  const [transcript, setTranscript] = useState('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat session whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      saveChatSession(messages);
    }
  }, [messages]);

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

  const clearChat = async () => {
    try {
      // Clear backend session
      const sessionId = generateSessionId();
      const formData = new FormData();
      formData.append('session_id', sessionId);
      
      await axios.post(`${SERVER_URL}/clear-chat-session`, formData);
      
      // Generate new session ID
      localStorage.removeItem(CHAT_SESSION_ID_KEY);
      
    } catch (error) {
      console.warn('Failed to clear backend session:', error);
    }
    
    // Clear frontend session
    const welcomeMessage: Message = {
      type: 'bot',
      content: 'Hello! I\'m FinEdgeAI, your AI financial assistant. How can I help you today?',
      timestamp: new Date()
    };
    setMessages([welcomeMessage]);
    clearChatSession();
  };

  const speak = (text: string, messageIndex: number) => {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    if (isSpeaking === messageIndex) {
      setIsSpeaking(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-IN'; // Set to Indian English
    utterance.rate = 0.9; // Slightly slower than default
    utterance.pitch = 1;

    utterance.onend = () => {
      setIsSpeaking(null);
    };

    setIsSpeaking(messageIndex);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speaking when component unmounts
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

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
    
    // Get dynamic thinking phrases based on the query
    const dynamicPhrases = getThinkingPhrasesForQuery(input);
    setCurrentThinkingPhrases(dynamicPhrases);
    
    setInput('');
    setIsTyping(true);
    setCurrentThinkingIndex(0);

    // Add initial thinking message with dynamic phrase
    setMessages(prev => [...prev, {
      type: 'bot',
      content: [dynamicPhrases[0]],
      timestamp: new Date(),
      isThinking: true
    }]);

  //       try {
  //         const sessionId = generateSessionId();
  //         const formData = new FormData();
  //         formData.append('input', input);
  //         formData.append('session_id', sessionId);

  //         const config = {
  //           method: 'post',
  //           maxBodyLength: Infinity,
  //           url: `${SERVER_URL}/agent`,
  //           data: formData
  //         };

  //         const response = await axios.request(config);
  //         console.log(response.data);
  //         setIsTyping(false);
          
  //         // Clean the response text using utility function
  //         const cleanedOutput = cleanBotResponse(response.data.output || response.data || '');
          
  //         // Remove the thinking message and show only the final clean response
  //         setMessages(prev => {
  //           const lastMessage = prev[prev.length - 1];
  //           if (lastMessage.isThinking) {
  //             return [
  //               ...prev.slice(0, -1),
  //               {
  //                 type: 'bot',
  //                 content: '',
  //                 timestamp: new Date(),
  //                 isTyping: true
  //               }
  //             ];
  //           }
  //           return prev;
  //         });

  //         // Show the cleaned output with a typing effect
  //         let displayedText = '';
  //         let charIndex = 0;

  //         const typingInterval = setInterval(() => {
  //           if (charIndex < cleanedOutput.length) {
  //             displayedText += cleanedOutput[charIndex];
  //             charIndex++;
              
  //             // Update the last message with new text
  //             setMessages(prev => {
  //               const newMessages = [...prev];
  //               newMessages[newMessages.length - 1] = {
  //                 type: 'bot',
  //                 content: displayedText,
  //                 timestamp: new Date()
  //               };
  //               return newMessages;
  //             });
  //           } else {
  //             clearInterval(typingInterval);
  //           }
  //         }, 30); // Adjust speed as needed - now typing character by character

  //       } catch (error) {
  //         console.error(error);
  //         setIsTyping(false);
  //         setMessages(prev => {
  //           const lastMessage = prev[prev.length - 1];
  //           if (lastMessage.isThinking) {
  //             return [
  //               ...prev.slice(0, -1),
  //               {
  //                 type: 'bot',
  //                 content: "Sorry, I encountered an error. Please try again.",
  //                 timestamp: new Date()
  //               }
  //             ];
  //           }
  //           return prev;
  //         });
  //       }
  // };






  //slightly changed version to show final response directly after thinking phrases
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
          
          // Clean the response text using utility function (LEGACY)
          const cleanedOutput = cleanBotResponse(response.data.output || response.data || '');
          
          // Remove the thinking message and show only the final clean response (LEGACY)
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

          // ENHANCED - Show the cleaned output with FASTER typing effect
          // Changed from 30ms to 8ms per character for 4x speed improvement
          let displayedText = '';
          let charIndex = 0;

          const typingInterval = setInterval(() => {
            if (charIndex < cleanedOutput.length) {
              displayedText += cleanedOutput[charIndex];
              charIndex++;
              
              // Update the last message with new text (LEGACY logic)
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
          }, 8); // ENHANCED - Changed from 30ms to 8ms (4x faster typing animation)

        } catch (error) {
          console.error(error);
          setIsTyping(false);
          // Error handling (LEGACY - no changes)
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

  // Event handlers
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



  return (
    <div className="h-[calc(100vh-2rem)] p-6">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex flex-col">
        {/* Chat Header */}
        <ChatHeader onClearChat={clearChat} />

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