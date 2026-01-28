'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/lib/chat-context';

const MINIMIZED_LABEL_TOP = 'Questions about my writing?';
const MINIMIZED_LABEL_BOTTOM = 'Ask me here!';

export function MinimizedChatButton({ className }: { className?: string }) {
  const { setIsMinimized } = useChat();
  return (
    <button
      type="button"
      onClick={() => setIsMinimized(false)}
      className={[
        'px-6 py-5 rounded-2xl bg-[var(--bubbles)] border-2 border-[var(--text-borders)]',
        'text-[var(--text-borders)] font-serif text-lg leading-tight text-center',
        'hover:bg-[var(--bubbles)] focus:outline-none focus:ring-2 focus:ring-[var(--text-borders)]/60',
        'max-w-full w-[280px]',
        className ?? '',
      ].join(' ')}
      aria-label="Open chat"
    >
      <div>{MINIMIZED_LABEL_TOP}</div>
      <div className="mt-1">{MINIMIZED_LABEL_BOTTOM}</div>
    </button>
  );
}

export function ChatPanel() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    ensureGreeting,
    clearError,
    setIsMinimized,
  } = useChat();
  const [input, setInput] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const onMinimize = useCallback(() => {
    setIsMinimized(true);
  }, [setIsMinimized]);

  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages, isLoading]);

  useEffect(() => {
    // Generate a unique greeting once at the start of the session.
    ensureGreeting();
  }, [ensureGreeting]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      sendMessage(input);
      setInput('');
    },
    [input, isLoading, sendMessage]
  );

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[2.25rem] border-2 border-[var(--text-borders)] bg-[var(--bubbles)] overflow-hidden">
      <header className="shrink-0 border-b-2 border-[var(--text-borders)] bg-[var(--bubbles)] px-4 py-2">
        <button
          type="button"
          onClick={onMinimize}
          className="w-full text-center font-serif text-sm text-[var(--text-borders)] hover:underline focus:outline-none"
          aria-label="Minimize chat"
        >
          Minimize chat
        </button>
      </header>
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-4 py-3 font-serif text-base border ${
                m.role === 'user'
                  ? 'bg-[var(--background)] border-[var(--text-borders)] text-[var(--text-borders)]'
                  : 'bg-[var(--background)] border-[var(--text-borders)] text-[var(--text-borders)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-[var(--background)] border border-[var(--text-borders)] px-4 py-3 font-serif text-base text-[var(--text-borders)]">
              …
            </div>
          </div>
        )}
      </div>
      {error && (
        <div className="shrink-0 border-t-2 border-red-500 bg-red-900/30 px-4 py-2">
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
        className="shrink-0 flex items-stretch border-t-2 border-[var(--text-borders)] bg-[var(--bubbles)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your questions here!"
          className="min-w-0 flex-1 bg-transparent px-5 py-4 font-serif text-base text-[var(--text-borders)] placeholder-[var(--text-borders)]/70 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 border-l-2 border-[var(--text-borders)] px-5 py-4 font-serif text-2xl text-[var(--text-borders)] hover:bg-[var(--bubbles)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
        >
          →
        </button>
      </form>
    </div>
  );
}

export default function Chatbot() {
  const { isMinimized } = useChat();
  if (isMinimized) return <MinimizedChatButton />;
  return <ChatPanel />;
}
