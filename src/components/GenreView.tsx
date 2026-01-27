"use client";

import { useState } from 'react';
import { Composition } from '../generated/prisma/client';

type GenreViewProps = {
  // We only need a subset of fields, but using the full type is fine
  compositions: Pick<Composition, 'id' | 'title' | 'content'>[];
};

export default function GenreView({ compositions }: GenreViewProps) {
  const [selectedCompositionId, setSelectedCompositionId] = useState<string | null>(null);

  const handleSelectComposition = (id: string) => {
    // If the same composition is clicked again, deselect it
    if (selectedCompositionId === id) {
      setSelectedCompositionId(null);
    } else {
      setSelectedCompositionId(id);
    }
  };

  const selectedComposition = compositions.find(c => c.id === selectedCompositionId);

  if (compositions.length === 0) {
    return (
      <div className="text-center text-gray-500 py-10">
        <p>There are no compositions in this category yet.</p>
        <p className="text-sm mt-2">Check back soon!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,200px)_1fr_1fr] gap-8">
      {/* Left Column (Sticky titles) */}
      <aside className="md:sticky md:top-20 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4 sr-only md:not-sr-only text-gray-900">Compositions</h2>
        <ul className="space-y-2">
          {compositions.map((composition) => (
            <li key={composition.id}>
              <button
                onClick={() => handleSelectComposition(composition.id)}
                className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors border ${
                  selectedCompositionId === composition.id
                    ? 'bg-gray-200 text-gray-900 font-semibold border-gray-400'
                    : 'text-gray-600 hover:bg-gray-100 border-transparent'
                }`}
              >
                {composition.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Center Column (Content horizontally centered) */}
      <main className="flex justify-center">
        <div className="w-full max-w-2xl">
          {selectedComposition ? (
            <article className="prose prose-lg max-w-none prose-invert bg-gray-900 text-white rounded-lg p-6 sm:p-8">
              <h3 className="text-2xl font-bold text-white">{selectedComposition.title}</h3>
              <p className="text-white whitespace-pre-line">{selectedComposition.content}</p>
            </article>
          ) : (
            <div className="flex items-center justify-center min-h-[200px] text-gray-400">
              <p>Select a title from the list to read.</p>
            </div>
          )}
        </div>
      </main>

      {/* Right Column – empty, reserved for later */}
      <div className="hidden md:block" aria-hidden="true" />
    </div>
  );
}
