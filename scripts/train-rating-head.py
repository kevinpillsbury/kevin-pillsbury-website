#!/usr/bin/env python3
"""
Train the rating head for the "Rate my description" feature.

Uses Gemini real-time embedding API (same model/config as production) to embed
book descriptions, then trains a small tf.keras head (768 -> 1) and exports
weights to JSON for use in the Next.js API route.

Usage:
  export GEMINI_API_KEY=your_key
  pip install -r scripts/requirements-train.txt
  python scripts/train-rating-head.py --csv path/to/books.csv --output src/lib/rating-head.json

Options:
  --csv              Path to CSV with description and rating columns (required).
  --output           Output path for the head weights JSON (default: rating-head.json).
  --description-col  CSV column name for the text description (default: description).
  --rating-col       CSV column name for the numeric rating (default: rating).
  --limit            Max rows to use (default: 50). Use 0 for full CSV.
  --val-frac         Fraction of data for validation, 0..1 (default: 0.2).
  --epochs           Training epochs (default: 20).
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import numpy as np
import pandas as pd
import tensorflow as tf
from google import genai
from google.genai import types
from google.genai.errors import ClientError

# Must match production (Node): gemini-embedding-001, 768 dim, RETRIEVAL_QUERY, L2-normalized.
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768
TASK_TYPE = "RETRIEVAL_QUERY"


def normalize_embedding(values: np.ndarray) -> np.ndarray:
    """L2-normalize the embedding. Matches src/lib/rag-utils.ts normalizeEmbedding."""
    v = np.asarray(values, dtype=np.float64).ravel()
    norm = np.sqrt(np.sum(v * v))
    if not np.isfinite(norm) or norm == 0:
        return v
    return (v / norm).astype(np.float32)


def load_csv(
    path: str,
    description_col: str,
    rating_col: str,
    limit: int | None,
) -> tuple[list[str], list[float]]:
    """Load CSV and return lists of descriptions and ratings. Drops rows with missing values."""
    df = pd.read_csv(path)
    if description_col not in df.columns:
        print(f"Error: CSV must have column '{description_col}'. Found: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)
    if rating_col not in df.columns:
        print(f"Error: CSV must have column '{rating_col}'. Found: {list(df.columns)}", file=sys.stderr)
        sys.exit(1)
    df = df[[description_col, rating_col]].dropna()
    df[description_col] = df[description_col].astype(str).str.strip()
    df = df[df[description_col].str.len() > 0]
    df[rating_col] = pd.to_numeric(df[rating_col], errors="coerce")
    df = df.dropna()
    if limit is not None:
        df = df.head(limit)
    descriptions = df[description_col].tolist()
    ratings = df[rating_col].astype(np.float32).tolist()
    return descriptions, ratings


def get_embeddings(
    client: genai.Client,
    descriptions: list[str],
) -> np.ndarray:
    """Fetch embeddings via Gemini real-time embed_content. Returns (n, 768) float32 array, L2-normalized."""
    print(f"Embedding {len(descriptions)} descriptions via real-time API ({EMBEDDING_MODEL}, dim={EMBEDDING_DIM})...")
    config = types.EmbedContentConfig(
        output_dimensionality=EMBEDDING_DIM,
        task_type=TASK_TYPE,
    )
    chunk_size = 20
    # Stay under rate limit (e.g. 3000 embed requests/min): delay between chunks.
    delay_between_chunks_s = 1.0
    all_values: list[list[float]] = []
    n = len(descriptions)
    for start in range(0, n, chunk_size):
        end = min(start + chunk_size, n)
        print(f"  Embedding descriptions {start + 1}-{end} of {n}...")
        chunk = descriptions[start:end]
        while True:
            try:
                result = client.models.embed_content(
                    model=EMBEDDING_MODEL,
                    contents=chunk,
                    config=config,
                )
                break
            except ClientError as e:
                if e.status_code == 429:  # RESOURCE_EXHAUSTED (rate limit)
                    wait = 5.0
                    print(f"  Rate limited (429). Waiting {wait:.0f}s then retrying...")
                    time.sleep(wait)
                    continue
                raise
        for emb in result.embeddings:
            vals = getattr(emb, "values", None)
            all_values.append(list(vals) if vals is not None else [])
        if start + chunk_size < n:
            time.sleep(delay_between_chunks_s)

    normalized = []
    for i, values in enumerate(all_values):
        if not values:
            raise RuntimeError(f"Empty embedding for row {i}")
        normed = normalize_embedding(np.array(values, dtype=np.float64))
        normalized.append(normed.tolist())
    return np.array(normalized, dtype=np.float32)


def train_head(
    X: np.ndarray,
    y: np.ndarray,
    val_frac: float,
    epochs: int,
) -> tf.keras.Model:
    """Train a linear head (768 -> 1). Returns the trained model."""
    from sklearn.model_selection import train_test_split

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=val_frac, random_state=42)
    model = tf.keras.Sequential([
        tf.keras.layers.Dense(1, input_shape=(EMBEDDING_DIM,), use_bias=True),
    ])
    model.compile(optimizer="adam", loss="mse", metrics=["mae"])
    model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=epochs,
        batch_size=64,
        verbose=1,
    )
    return model


def export_head_to_json(model: tf.keras.Model, path: str) -> None:
    """
    Export the single Dense layer weights to JSON.
    Format: { "W": [768 floats], "b": float } so Node can compute rating = dot(embedding, W) + b.
    """
    layer = model.layers[0]
    W, b = layer.get_weights()
    # Dense(1) has W shape (768, 1), b shape (1,). We want W as 768-length list, b as scalar.
    W_flat = W.flatten().tolist()
    b_scalar = float(b[0])
    payload = {"W": W_flat, "b": b_scalar}
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(payload, f, separators=(",", ":"))
    print(f"Exported head weights to {path} (W length={len(W_flat)}, b={b_scalar})")


def main() -> None:
    parser = argparse.ArgumentParser(description="Train rating head and export weights to JSON.")
    parser.add_argument("--csv", required=True, help="Path to CSV with description and rating columns")
    parser.add_argument("--output", default="rating-head.json", help="Output JSON path for head weights")
    parser.add_argument("--description-col", default="description", help="CSV column for description text")
    parser.add_argument("--rating-col", default="rating", help="CSV column for rating number")
    parser.add_argument("--limit", type=int, default=50, help="Max rows (default: 50). Use 0 for no limit (full CSV).")
    parser.add_argument("--val-frac", type=float, default=0.2, help="Validation fraction (0..1)")
    parser.add_argument("--epochs", type=int, default=20, help="Training epochs")
    args = parser.parse_args()

    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        print("Error: Set GEMINI_API_KEY (or GOOGLE_API_KEY) in the environment.", file=sys.stderr)
        sys.exit(1)

    limit = None if args.limit == 0 else args.limit
    descriptions, ratings = load_csv(
        args.csv,
        args.description_col,
        args.rating_col,
        limit,
    )
    if not descriptions:
        print("Error: No rows left after loading CSV.", file=sys.stderr)
        sys.exit(1)
    print(f"Loaded {len(descriptions)} rows from {args.csv}")

    client = genai.Client(api_key=api_key)
    X = get_embeddings(client, descriptions)
    y = np.array(ratings, dtype=np.float32)

    model = train_head(X, y, args.val_frac, args.epochs)
    export_head_to_json(model, args.output)
    print("Done.")


if __name__ == "__main__":
    main()
