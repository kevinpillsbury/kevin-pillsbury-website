'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/lib/chat-context';

const WELCOME =
  "Hi! I'm Kev's personal assistant. He's currenlty busy being up to no good, but I'd be happy to answer your questions in the meantimet!";
const MINIMIZED_LABEL = 'Questions about my writing?';

export function MinimizedChatButton() {
  const { setIsMinimized } = useChat();
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

type ChatPanelProps = {
  genre: string | null;
};

export function ChatPanel({ genre }: ChatPanelProps) {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearError,
    setIsMinimized,
  } = useChat();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const onMinimize = useCallback(() => {
    if (!hasShownWelcome) setHasShownWelcome(true);
    setIsMinimized(true);
  }, [hasShownWelcome, setIsMinimized]);

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
    !hasShownWelcome && messages.length === 0;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-blue-500 bg-gray-900">
      <header className="flex shrink-0 items-center justify-between border-b border-blue-500 px-3 py-2">
        <span className="text-sm font-medium text-white">Chat</span>
        <button
          type="button"
          onClick={onMinimize}
          className="rounded px-2 py-1 text-xs text-white hover:bg-blue-500/20 border border-blue-500 focus:outline-none"
          aria-label="Minimize chat"
        >
          Minimize
        </button>
      </header>
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3"
      >
        {showWelcome && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-lg bg-gray-800 border border-blue-500 px-3 py-2 text-sm text-white">
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
              className={`max-w-[90%] rounded-lg px-3 py-2 text-sm border ${
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
            <div className="max-w-[90%] rounded-lg bg-gray-800 border border-blue-500 px-3 py-2 text-sm text-white">
              …
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="shrink-0 border-t border-red-500 bg-red-900/30 px-3 py-2">
          <p className="text-sm text-red-200">{error}</p>
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
        className="shrink-0 flex gap-2 border-t border-blue-500 p-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="min-w-0 flex-1 rounded border border-blue-500 bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          Send
        </button>
      </form>
    </div>
  );
}

type ChatbotProps = {
  genre: string | null;
};

export default function Chatbot({ genre }: ChatbotProps) {
  const { isMinimized } = useChat();
  if (isMinimized) return <MinimizedChatButton />;
  return <ChatPanel genre={genre} />;
}
