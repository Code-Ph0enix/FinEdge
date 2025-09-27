import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { SERVER_URL } from '../utils';
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

/**
 * Main Chatbot component - AI Financial Assistant
 * Provides conversational interface for financial queries with voice support
 */
const Chatbot = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [messages, setMessages] = useState<Message[]>([
    {
      type: 'bot',
      content: 'Hello! I\'m your AI financial assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [currentThinkingIndex, setCurrentThinkingIndex] = useState(0);
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

        try {
          const formData = new FormData();
          formData.append('input', input);

          const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: `${SERVER_URL}/agent`,
            data: formData
          };

          const response = await axios.request(config);
          console.log(response.data);
          setIsTyping(false);
          
          // Clean the response text using utility function
          const cleanedOutput = cleanBotResponse(response.data.output || response.data || '');
          
          // Remove the thinking message and show only the final clean response
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

          // Show the cleaned output with a typing effect
          let displayedText = '';
          let charIndex = 0;

          const typingInterval = setInterval(() => {
            if (charIndex < cleanedOutput.length) {
              displayedText += cleanedOutput[charIndex];
              charIndex++;
              
              // Update the last message with new text
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
          }, 30); // Adjust speed as needed - now typing character by character

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
        <ChatHeader />

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