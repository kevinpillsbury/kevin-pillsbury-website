'use client';

import { useState } from 'react';

function ratingToLabel(rating: number): string {
  if (rating > 4.5) return 'Best Seller';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Decent';
  return 'Needs work';
}

const PAGE_DESCRIPTION = `What this is
You can paste a book or story description (a “plot” or blurb) and get a predicted rating. The result is a qualitative label (e.g. “Good”, “Very Good”) based on patterns learned from book descriptions and ratings.

How it works
Your text is turned into a vector using the same embedding model used elsewhere on the site. A small trained “head” (linear model) maps that vector to a number, which is then mapped to a label (Best Seller, Very Good, Good, Decent, Needs work). No large language model is used for the rating—only the embedding and the head.

How it was built
Descriptions and ratings were taken from a large public dataset, cleaned, and embedded with the Gemini embedding API. A linear layer (768 → 1) was trained on those embeddings to predict rating, then the weights were exported to JSON. The site embeds your description the same way, runs it through the head, and shows the label. For more detail, see the feature plan in the repo.`;

export default function RateMyPlotPage() {
  const [plot, setPlot] = useState('');
  const [ratingNum, setRatingNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!plot.trim()) return;
    setError(null);
    setLoading(true);
    setRatingNum(null);
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: plot.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? 'Something went wrong.');
        return;
      }
      setRatingNum(Number(data.rating));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed.');
    } finally {
      setLoading(false);
    }
  };

  const ratingDisplay =
    loading
      ? 'Rating: ...'
      : ratingNum !== null
        ? `Rating: ${ratingNum.toFixed(2)} - ${ratingToLabel(ratingNum)}.`
        : 'Rating: None';

  return (
    <div className="w-full min-h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex-1 grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)_240px] lg:grid-cols-[320px_minmax(0,1fr)_280px] px-4 sm:px-6 lg:px-8 py-8 max-w-[1400px] mx-auto w-full items-center">
        {/* Left: page description (small text, no bubbles) */}
        <aside className="flex flex-col">
          <div className="text-sm text-[var(--text-borders)]/90 leading-relaxed whitespace-pre-line font-sans">
            {PAGE_DESCRIPTION}
          </div>
        </aside>

        {/* Center: plot input (same style as story content) + button */}
        <section className="flex flex-col gap-4">
          <div className="rounded-[3.25rem] border border-[var(--text-borders)] bg-[var(--bubbles)] flex-1 min-h-[280px]">
            <div className="h-full p-6 sm:p-8">
              <textarea
                value={plot}
                onChange={(e) => setPlot(e.target.value)}
                placeholder="Paste or type a book or story description (plot) here…"
                className="w-full h-full min-h-[200px] bg-transparent text-[var(--text-borders)] placeholder:text-[var(--text-borders)]/50 font-serif text-lg leading-relaxed resize-none focus:outline-none"
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end items-center gap-3">
            {error && (
              <p className="text-sm text-[var(--text-borders)]/80 mr-auto">{error}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !plot.trim()}
              className="px-6 py-3 rounded-md text-[var(--text-borders)] font-medium bg-[var(--bubbles)] border border-[var(--text-borders)] hover:opacity-90 disabled:opacity-50 focus:outline-none outline-none"
            >
              Rate
            </button>
          </div>
        </section>

        {/* Right: rating box (bubbles background), centered vertically, one line */}
        <aside className="flex flex-col justify-center items-stretch">
          <div className="rounded-[2rem] border border-[var(--text-borders)] bg-[var(--bubbles)] px-4 py-3 min-w-[200px] w-full">
            <p className="font-serif text-base text-[var(--text-borders)] whitespace-nowrap">
              {ratingDisplay}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
