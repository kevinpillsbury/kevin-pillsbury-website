'use client';

import { useState } from 'react';

function ratingToLabel(rating: number): string {
  if (rating > 4.5) return 'Best Seller';
  if (rating >= 4.0) return 'Very Good';
  if (rating >= 3.5) return 'Good';
  if (rating >= 3.0) return 'Decent';
  return 'Needs work';
}

const PAGE_DESCRIPTION = `What is this:
Write or paste a book or story synopsis into the input field, press the "Rate" button, and a trained neural network will rate your synopsis! 

How it works:
You input a synopsis, my website takes your synopsis and makes an API request to a Google embedding model. Google's embedding model takes your synopsis, transforms it into a vector embedding, then returns that embedding to my website. My website takes this embedding, and runs it through a neural network I built and trained which returns a quality rating of the embedded synopsis.

How I built it:
Rating a story's synopsis involves two distinct parts. Part A converts the synopsis into an embedding (a numerical vector), while Part B converts that embedding into a rating. Part A requires a large natural language AI model, for which I lack the training data and computing power to build from scratch. Part B is a "head"—a small, task-specific neural network added to a base model—which I do have the capacity to build. I could have downloaded a pre-trained model for Part A, but it would be too large to run on this website, it would require a second server and an API to connect to it. Instead, I am using Google's state-of-the-art embedding model via their API. For Part B, I found a dataset of ~100k book descriptions and their corresponding Goodreads ratings. Using TensorFlow, I trained a small neural network (the head) to take a synopsis embedding and generate a rating. During training, I used the Google API to embed the descriptions to ensure consistency with how I process user synopses. My neural network head is small enough to run locally on this website, eliminating the need for a second server.`;

export default function RateYourSynopsisPage() {
  const [synopsis, setSynopsis] = useState('');
  const [ratingNum, setRatingNum] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!synopsis.trim()) return;
    setError(null);
    setLoading(true);
    setRatingNum(null);
    try {
      const res = await fetch('/api/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: synopsis.trim() }),
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
        : 'Rating: ';

  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-hidden">
      <div className="h-full grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)_240px] lg:grid-cols-[320px_minmax(0,1fr)_280px] px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full min-h-0">
        {/* Left: page description (scrollable only) */}
        <aside className="min-h-0 overflow-y-auto flex flex-col">
          <div className="text-sm text-[var(--text-borders)]/90 leading-relaxed whitespace-pre-line font-sans pr-2">
            {PAGE_DESCRIPTION}
          </div>
        </aside>

        {/* Center: synopsis input only */}
        <section className="min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-hidden w-full">
            <div className="h-full min-h-0 overflow-hidden rounded-[3.25rem] border border-[var(--text-borders)] bg-[var(--bubbles)]">
              <div className="h-full min-h-0 overflow-hidden p-6 sm:p-8 flex flex-col">
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Paste or type a book/story synopsis here..."
                  className="w-full h-full min-h-0 bg-transparent text-[var(--text-borders)] placeholder:text-[var(--text-borders)]/50 placeholder:text-lg font-serif text-lg leading-relaxed resize-none focus:outline-none overflow-y-auto"
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Right: rating box + Rate button at bottom left */}
        <aside className="min-h-0 flex flex-col justify-between items-stretch">
          <div className="flex flex-col justify-center flex-1 min-h-0">
            <div className="rounded-[2rem] border border-[var(--text-borders)] bg-[var(--bubbles)] px-4 py-3 min-w-[200px] w-full">
              <p className="font-serif text-base text-[var(--text-borders)] whitespace-nowrap">
                {ratingDisplay}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 flex-shrink-0 pt-4">
            {error && (
              <p className="text-sm text-[var(--text-borders)]/80">{error}</p>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading || !synopsis.trim()}
              className="px-6 py-3 rounded-md text-[var(--text-borders)] font-medium bg-[var(--bubbles)] border border-[var(--text-borders)] hover:opacity-90 disabled:opacity-50 focus:outline-none outline-none"
            >
              Rate
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
