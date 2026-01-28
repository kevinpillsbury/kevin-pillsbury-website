'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/lib/chat-context';

const WELCOME =
  "Kevin Pillsbury isn't available right now to answer questions about his compositions, but feel free to ask me!";
const MINIMIZED_LABEL = 'Questions about my writing?';

type ChatbotProps = {
  genre: string | null;
};

export default function Chatbot({ genre }: ChatbotProps) {
  const {
    messages,
    isLoading,
    error,
    setCurrentContext,
    sendMessage,
    clearError,
  } = useChat();
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCurrentContext(genre, null, null);
  }, [genre, setCurrentContext]);

  const onMinimize = useCallback(() => {
    if (!hasShownWelcome) setHasShownWelcome(true);
    setIsMinimized(true);
  }, [hasShownWelcome]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages, isLoading]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      if (!hasShownWelcome) setHasShownWelcome(true);
      sendMessage(input);
      setInput('');
    },
    [input, isLoading, sendMessage, hasShownWelcome]
  );

  const showWelcome =
    !isMinimized && !hasShownWelcome && messages.length === 0;

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg bg-gray-800 border border-blue-500 text-white text-sm font-medium hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="Open chat"
      >
        {MINIMIZED_LABEL}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-900">
      <header className="flex items-center justify-between shrink-0 h-14 px-4 border-b border-blue-500 bg-black">
        <span className="text-white font-medium">Chat</span>
        <button
          type="button"
          onClick={onMinimize}
          className="px-3 py-1.5 rounded-md text-sm text-white hover:bg-blue-500/20 border border-blue-500 focus:outline-none"
          aria-label="Minimize chat"
        >
          Minimize
        </button>
      </header>
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {showWelcome && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-gray-800 border border-blue-500 px-4 py-3 text-white text-sm">
              {WELCOME}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm border ${
                m.role === 'user'
                  ? 'bg-blue-500/20 border-blue-500 text-white'
                  : 'bg-gray-800 border-blue-500 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-lg bg-gray-800 border border-blue-500 px-4 py-3 text-white text-sm">
              …
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="shrink-0 px-4 py-2 bg-red-900/30 border-t border-red-500">
          <p className="text-red-200 text-sm">{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="mt-1 text-xs text-red-300 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 flex gap-2 p-4 border-t border-blue-500"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-lg bg-gray-800 border border-blue-500 px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}
