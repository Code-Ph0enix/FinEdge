import { X, Mic, MicOff } from 'lucide-react';
import { SpeechModalProps } from '../types';

/**
 * Modal component for voice input functionality
 * Handles speech recognition and transcript display
 */
const SpeechModal = ({
  isOpen,
  onClose,
  isListening,
  transcript,
  onStartListening,
  onStopListening,
  onUseText,
  onClearTranscript
}: SpeechModalProps) => {
  if (!isOpen) return null;

  const handleMicToggle = () => {
    if (isListening) {
      onStopListening();
    } else {
      onStartListening();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          {/* Header */}
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Voice Input
          </h3>

          {/* Microphone Button */}
          <div className="mb-6">
            <button
              onClick={handleMicToggle}
              className={`p-4 rounded-full transition-opacity hover:opacity-80 ${
                isListening
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
              }`}
            >
              {isListening ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Transcript Display */}
          <div className="min-h-[100px] p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 text-sm mb-4">
            {transcript || 'Start speaking...'}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onUseText}
              className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Use Text
            </button>
            <button
              onClick={onClearTranscript}
              className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechModal;