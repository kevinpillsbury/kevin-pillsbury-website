"use client";

import { useEffect, useState } from 'react';
import { Composition } from '../generated/prisma/client';
import { useChat } from '@/lib/chat-context';
import { MinimizedChatButton, ChatPanel } from '@/components/Chatbot';

type GenreViewProps = {
  compositions: Pick<Composition, 'id' | 'title' | 'content'>[];
  genre: string;
  displayGenre: string;
};

export default function GenreView({ compositions, genre, displayGenre }: GenreViewProps) {
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
      <div className="h-full flex items-center justify-center text-center text-[var(--foreground)] px-6">
        <div>
          <p className="text-lg">There are no compositions in this category yet.</p>
        <p className="text-sm mt-2">Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-hidden">
      <div className="grid h-full min-h-0 grid-cols-1 gap-10 md:grid-cols-[240px_minmax(0,1fr)_320px] lg:grid-cols-[260px_minmax(0,1fr)_340px]">
        {/* Left column: genre title + compositions list (independently scrollable) */}
        <aside className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            <h1 className="font-serif text-6xl leading-none text-[var(--foreground)]">
              {displayGenre}
            </h1>

            <div className="mt-10 flex min-h-0 flex-1 flex-col">
              <div className="mb-4 flex items-center justify-start">
                <div className="inline-flex items-center justify-center border border-[var(--border)] px-5 py-2 text-xl font-serif text-[var(--foreground)]">
                  Compositions
                </div>
              </div>

              <div className="flex min-h-0 flex-1 items-stretch gap-6">
                <ul className="min-h-0 flex-1 overflow-y-auto pr-2 space-y-4">
                  {compositions.map((composition) => (
                    <li key={composition.id}>
                      <button
                        onClick={() => handleSelectComposition(composition.id)}
                        className={`w-full text-left font-serif text-2xl leading-tight transition-colors ${
                          selectedCompositionId === composition.id
                            ? 'rounded-md bg-[var(--panel)] px-5 py-2 text-[var(--foreground)]'
                            : 'px-1 py-2 text-[var(--foreground)]/90 hover:text-[var(--foreground)]'
                        }`}
                      >
                        {composition.title}
                      </button>
                    </li>
                  ))}
                </ul>

                {/* Vertical divider */}
                <div className="hidden md:block w-px bg-[var(--border)]/70" />
              </div>
            </div>
          </div>
        </aside>

        {/* Center column: composition content (independently scrollable) */}
        <section className="min-h-0 overflow-hidden flex justify-center">
          <div className="w-full max-w-3xl">
            <div className="h-full min-h-0 overflow-hidden rounded-[3.25rem] border border-[var(--border)] bg-[var(--panel)]">
              <div className="h-full min-h-0 overflow-y-auto px-8 py-6 sm:px-10 sm:py-7">
                {selectedComposition ? (
                  <>
                    <h2 className="font-serif text-4xl text-center text-[var(--foreground)] mb-4">
                      {selectedComposition.title}
                    </h2>
                    <div className="font-serif text-[var(--foreground)]/90 text-lg leading-relaxed whitespace-pre-line">
                      {selectedComposition.content}
                    </div>
                  </>
                ) : (
                  <div className="h-full min-h-[240px] flex items-start justify-center pt-10">
                    <p className="font-serif text-2xl text-[var(--foreground)]/90">
                      No composition selected.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right column: chat (width stays fixed; content swaps when minimized) */}
        <aside className="min-h-0 overflow-hidden">
          <div className="flex h-full min-h-0 flex-col">
            {!isMinimized ? (
              <div className="h-full min-h-0 pt-2">
                <ChatPanel />
              </div>
            ) : (
              <div className="h-full min-h-0 flex items-end justify-end pb-6">
                <MinimizedChatButton />
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
