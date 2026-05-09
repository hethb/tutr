import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';
import clsx from 'clsx';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatPanelProps {
  messages: Message[];
  currentStreamText: string;
  isThinking: boolean;
  onSendMessage: (message: string) => void;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  onToggleListening: () => void;
  speechSupported: boolean;
}

export default function ChatPanel({
  messages, currentStreamText, isThinking,
  onSendMessage, isListening, transcript, interimTranscript,
  onToggleListening, speechSupported,
}: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentStreamText]);

  useEffect(() => {
    if (transcript && !isListening) {
      onSendMessage(transcript);
    }
  }, [isListening]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSendMessage(text);
    setInput('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-800">
        <h3 className="font-semibold text-sm">Chat & Transcript</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Type or use your voice
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && !currentStreamText && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">
              Start talking or type a message to begin your tutoring session.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={clsx(
              'flex flex-col gap-1',
              msg.role === 'user' ? 'items-end' : 'items-start',
            )}
          >
            <div
              className={clsx(
                'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                msg.role === 'user'
                  ? 'bg-tutr-accent text-white rounded-br-md'
                  : 'bg-tutr-surface-light text-gray-200 rounded-bl-md',
              )}
            >
              {msg.content}
            </div>
            <span className="text-[10px] text-gray-600 px-1">
              {msg.role === 'user' ? 'You' : 'Alex'} · {formatTime(msg.timestamp)}
            </span>
          </div>
        ))}

        {currentStreamText && (
          <div className="flex flex-col gap-1 items-start">
            <div className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm bg-tutr-surface-light text-gray-200 rounded-bl-md leading-relaxed">
              {currentStreamText}
              <span className="inline-block w-1.5 h-4 bg-tutr-accent ml-1 animate-pulse" />
            </div>
          </div>
        )}

        {isThinking && !currentStreamText && (
          <div className="flex flex-col gap-1 items-start">
            <div className="rounded-2xl px-4 py-3 bg-tutr-surface-light rounded-bl-md">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {isListening && (
        <div className="px-4 py-2 bg-tutr-accent/10 border-t border-tutr-accent/20">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-tutr-accent-light">Listening...</span>
          </div>
          {(transcript || interimTranscript) && (
            <p className="text-sm mt-1 text-gray-300">
              {transcript}
              <span className="text-gray-500">{interimTranscript}</span>
            </p>
          )}
        </div>
      )}

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          {speechSupported && (
            <button
              onClick={onToggleListening}
              className={clsx(
                'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                isListening
                  ? 'bg-red-600 text-white animate-pulse'
                  : 'bg-tutr-surface-light text-gray-400 hover:text-white',
              )}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-tutr-surface-light rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tutr-accent/50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-tutr-accent text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-tutr-accent/80 transition-all"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
