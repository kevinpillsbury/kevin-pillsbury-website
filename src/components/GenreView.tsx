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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left Column (Sidebar) */}
      <aside className="md:col-span-1 md:border-r md:pr-6">
        <h2 className="text-xl font-semibold mb-4 sr-only md:not-sr-only">Titles</h2>
        <ul className="space-y-2">
          {compositions.map((composition) => (
            <li key={composition.id}>
              <button
                onClick={() => handleSelectComposition(composition.id)}
                className={`w-full text-left px-4 py-2 rounded-md text-sm transition-colors ${
                  selectedCompositionId === composition.id
                    ? 'bg-gray-200 text-gray-900 font-semibold'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {composition.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Right Column (Content Area) */}
      <main className="md:col-span-2">
        {selectedComposition ? (
          <article className="prose prose-lg max-w-none">
            <h3 className="text-2xl font-bold text-gray-800">{selectedComposition.title}</h3>
            <p className="text-gray-700 whitespace-pre-line">{selectedComposition.content}</p>
          </article>
        ) : (
          <div className="flex items-center justify-center h-full min-h-[200px] text-gray-400">
            <p>Select a title from the list to read.</p>
          </div>
        )}
      </main>
    </div>
  );
}
