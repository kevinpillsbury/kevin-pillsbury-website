/**
 * Rating head: loads trained weights and predicts a rating from a 768-dim embedding.
 * Used by POST /api/rate. Weights come from scripts/train-rating-head.py (rating-head.json).
 */

import headWeights from './rating-head.json';

type HeadWeights = { W: number[]; b: number };

function getHead(): HeadWeights {
  const data = headWeights as HeadWeights;
  if (!Array.isArray(data.W) || typeof data.b !== 'number' || data.W.length !== 768) {
    throw new Error('Invalid rating-head.json: expected { W: number[768], b: number }');
  }
  return data;
}

/**
 * Predict rating from L2-normalized 768-dim embedding: dot(embedding, W) + b.
 */
export function predict(embedding: number[]): number {
  const { W, b } = getHead();
  if (embedding.length !== 768) {
    throw new Error(`Expected 768-dim embedding, got ${embedding.length}`);
  }
  let sum = b;
  for (let i = 0; i < 768; i++) {
    sum += (embedding[i] ?? 0) * (W[i] ?? 0);
  }
  return sum;
}
