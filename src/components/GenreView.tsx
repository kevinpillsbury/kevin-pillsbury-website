"use client";

import { useEffect, useState } from 'react';
import { Composition } from '../generated/prisma/client';
import { useChat } from '@/lib/chat-context';
import { MinimizedChatButton, ChatPanel } from '@/components/Chatbot';

type GenreViewProps = {
  compositions: Pick<Composition, 'id' | 'title' | 'content'>[];
  genre: string;
};

export default function GenreView({ compositions, genre }: GenreViewProps) {
  const { setCurrentContext, isMinimized } = useChat();
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);

  const selectedComposition = compositions.find((c) => c.id === selectedCompositionId);

  useEffect(() => {
    setCurrentContext(
      genre,
      selectedCompositionId,
      selectedComposition?.title ?? null
    );
  }, [genre, selectedCompositionId, selectedComposition?.title, setCurrentContext]);

  const handleSelectComposition = (id: string) => {
    if (selectedCompositionId === id) {
      setSelectedCompositionId(null);
    } else {
      setSelectedCompositionId(id);
    }
  };

  if (compositions.length === 0) {
    return (
      <div className="text-center text-white py-10">
        <p>There are no compositions in this category yet.</p>
        <p className="text-sm mt-2">Check back soon!</p>
      </div>
    );
  }

  return (
    <>
      <div
        className={`grid gap-6 md:gap-8 grid-cols-1 ${
          isMinimized
            ? 'md:grid-cols-[minmax(0,140px)_1fr]'
            : 'md:grid-cols-[minmax(0,140px)_1fr_minmax(0,280px)]'
        }`}
      >
        {/* Left: Sticky titles */}
        <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
          <h2 className="text-xl font-semibold mb-4 sr-only md:not-sr-only text-white">Compositions</h2>
          <ul className="space-y-2">
            {compositions.map((composition) => (
              <li key={composition.id}>
                <button
                  onClick={() => handleSelectComposition(composition.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors border ${
                    selectedCompositionId === composition.id
                      ? 'bg-blue-500/20 text-white font-semibold border-blue-500'
                      : 'text-white hover:bg-blue-500/20 border-transparent'
                  }`}
                >
                  {composition.title}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Center: Scrollable content */}
        <main className="flex min-h-0 justify-center">
          <div className="w-full max-w-4xl">
            {selectedComposition ? (
              <article className="prose prose-lg max-w-none prose-invert bg-gray-900/50 text-white rounded-lg p-6 sm:p-8 ring-1 ring-blue-500 border border-blue-500">
                <h3 className="text-2xl font-bold text-white text-center">{selectedComposition.title}</h3>
                <p className="text-white whitespace-pre-line">{selectedComposition.content}</p>
              </article>
            ) : (
              <div className="flex min-h-[200px] items-center justify-center text-white">
                <p>Select a title from the list to read.</p>
              </div>
            )}
          </div>
        </main>

        {/* Right: Chat panel (when expanded) */}
        {!isMinimized && (
          <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] min-h-[320px] md:min-h-[320px]">
            <ChatPanel genre={genre} />
          </aside>
        )}
      </div>
      {isMinimized && <MinimizedChatButton />}
    </>
  );
}
