'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useChat } from '@/lib/chat-context';

const WELCOME =
  "Hi! I'm Kev's personal assistant. He's currenlty busy being up to no good, but I'd be happy to answer your questions in the meantime!";
const MINIMIZED_LABEL_TOP = 'Questions about my writing?';
const MINIMIZED_LABEL_BOTTOM = 'Ask me here!';

export function MinimizedChatButton({ className }: { className?: string }) {
  const { setIsMinimized } = useChat();
  return (
    <button
      type="button"
      onClick={() => setIsMinimized(false)}
      className={[
        'px-6 py-5 rounded-2xl bg-[var(--panel)] border-2 border-[var(--border)]',
        'text-[var(--foreground)] font-serif text-lg leading-tight text-center',
        'hover:bg-[var(--panel-2)] focus:outline-none focus:ring-2 focus:ring-[var(--border)]/60',
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
    <div className="flex h-full min-h-0 flex-col rounded-[2.25rem] border-2 border-[var(--border)] bg-[var(--panel)] overflow-hidden">
      <header className="shrink-0 border-b-2 border-[var(--border)] bg-[var(--panel-2)] px-4 py-2">
        <button
          type="button"
          onClick={onMinimize}
          className="w-full text-center font-serif text-sm text-[var(--foreground)] hover:underline focus:outline-none"
          aria-label="Minimize chat"
        >
          Minimize chat
        </button>
      </header>
      <div
        ref={listRef}
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {showWelcome && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 font-serif text-base text-[var(--foreground)]">
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
              className={`max-w-[90%] rounded-2xl px-4 py-3 font-serif text-base border ${
                m.role === 'user'
                  ? 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--foreground)]'
              }`}
            >
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[90%] rounded-2xl bg-[var(--surface)] border border-[var(--border)] px-4 py-3 font-serif text-base text-[var(--foreground)]">
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
        className="shrink-0 flex items-stretch border-t-2 border-[var(--border)] bg-[var(--panel-2)]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your questions here!"
          className="min-w-0 flex-1 bg-transparent px-5 py-4 font-serif text-base text-[var(--foreground)] placeholder-[var(--foreground)]/70 focus:outline-none"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="shrink-0 border-l-2 border-[var(--border)] px-5 py-4 font-serif text-2xl text-[var(--foreground)] hover:bg-[var(--panel)] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none"
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
