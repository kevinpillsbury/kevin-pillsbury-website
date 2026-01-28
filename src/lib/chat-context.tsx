'use client';

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ChatContextValue = {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentGenre: string | null;
  currentCompositionId: string | null;
  currentCompositionTitle: string | null;
  setCurrentContext: (
    genre: string | null,
    compositionId: string | null,
    compositionTitle: string | null
  ) => void;
  sendMessage: (text: string) => Promise<void>;
  clearError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentGenre, setCurrentGenre] = useState<string | null>(null);
  const [currentCompositionId, setCurrentCompositionId] = useState<
    string | null
  >(null);
  const [currentCompositionTitle, setCurrentCompositionTitle] = useState<
    string | null
  >(null);
  const ctxRef = useRef({
    currentGenre,
    currentCompositionId,
    messages,
  });
  ctxRef.current = {
    currentGenre,
    currentCompositionId,
    messages,
  };

  const setCurrentContext = useCallback(
    (
      genre: string | null,
      compositionId: string | null,
      compositionTitle: string | null
    ) => {
      setCurrentGenre(genre);
      setCurrentCompositionId(compositionId);
      setCurrentCompositionTitle(compositionTitle);
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setIsLoading(true);
    try {
      const { messages: hist, currentCompositionId: cid, currentGenre: g } = ctxRef.current;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          currentCompositionId: cid,
          currentGenre: g,
          history: hist,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg =
          typeof data?.error === 'string' ? data.error : 'Something went wrong.';
        setError(errMsg);
        setMessages((prev) => prev.slice(0, -1));
        return;
      }
      const reply = typeof data?.text === 'string' ? data.text : '';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply },
      ]);
    } catch {
      setError('Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value: ChatContextValue = {
    messages,
    isLoading,
    error,
    currentGenre,
    currentCompositionId,
    currentCompositionTitle,
    setCurrentContext,
    sendMessage,
    clearError,
  };

  return (
    <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
