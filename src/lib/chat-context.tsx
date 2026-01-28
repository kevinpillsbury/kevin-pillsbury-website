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
  isMinimized: boolean;
  setIsMinimized: (value: boolean) => void;
  currentGenre: string | null;
  currentCompositionId: string | null;
  currentCompositionTitle: string | null;
  setCurrentContext: (
    genre: string | null,
    compositionId: string | null,
    compositionTitle: string | null
  ) => void;
  sendMessage: (text: string) => Promise<void>;
  ensureGreeting: () => Promise<void>;
  clearError: () => void;
};

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasGreeted, setHasGreeted] = useState(false);
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

  const ensureGreeting = useCallback(async () => {
    // Only once per provider "session", and only if the user hasn't started chatting.
    const { messages: hist, currentCompositionId: cid, currentGenre: g } = ctxRef.current;
    if (hasGreeted || hist.length > 0) return;

    const prompt =
      "There is a user here who wants to ask you questions---greet them! In your greeting give a heoric and/or genius activity that Kev is currently doing as an excuse for why he's not available to answer the user's questions. Finally, offer your assistance to answer the user's questions. Stick to the role you've been given!";

    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
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
        return;
      }
      const reply = typeof data?.text === 'string' ? data.text : '';
      if (reply) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
      setHasGreeted(true);
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [hasGreeted]);

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
    isMinimized,
    setIsMinimized,
    currentGenre,
    currentCompositionId,
    currentCompositionTitle,
    setCurrentContext,
    sendMessage,
    ensureGreeting,
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
