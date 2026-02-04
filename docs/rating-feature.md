# Rating My Description — Feature Plan (B – Head Only on Vercel)

This document is the single source of truth for the **“Rate my description”** feature on the Kevin Pillsbury website. A user pastes a book or story description and receives a predicted rating. The approach: **Gemini embedding API** (description → vector) + **trained head** (vector → rating), with inference on Vercel and no separate server.

**Read this once to pick the project back up.**

---

## 1. Project context

- **Repo:** Next.js 16 app (kevinpillsbury.com) — writing portfolio + RAG chatbot on genre pages.
- **Stack:** Next.js, React 19, TypeScript, Tailwind, Prisma, PostgreSQL (Neon), pgvector, Gemini API (`@google/genai`), Vercel.
- **Existing Gemini usage:** Chat uses `gemini-embedding-001` (768-dim) for RAG query embeddings and `normalizeEmbedding` from `src/lib/rag-utils.ts`. Chat route: `src/app/api/chat/route.ts`.
- **Env:** `GEMINI_API_KEY` is already used; no new env vars for this feature.

---

## 2. Decisions made (locked in)

| Decision | Choice |
|----------|--------|
| **Approach** | B – Head only on Vercel: Gemini embed at request time + small trained head in Node. No separate Python server. |
| **Training framework** | **tf.keras** (TensorFlow/Keras). Linear head (768 → 1); export weights to JSON. |
| **Embeddings for training** | **Gemini Batch API** (not standard). 50% cost, no per-request RPM; user is on paid tier. Script has no `--rpm`; it submits one batch job and polls until done. |
| **Embedding model/config** | Same as production: `gemini-embedding-001`, 768 dim, `RETRIEVAL_QUERY`, L2-normalized. Must match so training and inference see the same distribution. |
| **Data source** | Original CSV: ~100k books. Columns included `desc` (description), `rating`, plus author, genre, isbn, link, etc. |
| **Data cleaning** | Keep only description and rating; drop rows missing either; drop rows whose description contains non-blurb content (ISBN, URLs, “where to buy”, “publication date”, “also available”, prices, goodreads.com, amazon.com, etc.). Implemented in `scripts/clean-books.py`. |
| **Cleaned CSV** | `scripts/books-cleaned.csv` — columns **`description`**, **`rating`**. **89,475 rows** after cleaning. |
| **Rating scale** | Data is decimal (e.g. 3.52, 4.15); assumed Goodreads-style (e.g. 0–5 or 1–5). Use consistently for training and display; optional clamping in API. |
| **Head export format** | JSON: `{ "W": number[]` (768 floats), `"b": number }`. Node computes `rating = dot(embedding, W) + b`. |
| **Paths (defaults)** | API: `POST /api/rate`; page: `/rate`. Can change when implementing. |
| **.gitignore** | `scripts/books.csv`, `scripts/books-cleaned.csv`, `scripts/embedding-cache.json` so large/cache files aren’t committed. |

---

## 3. Progress so far

| Done | Item |
|------|------|
| ✅ | Feature plan (this doc). |
| ✅ | **Training pipeline:** `scripts/train-rating-head.py` — loads CSV, calls **Gemini Batch API** to embed all descriptions (JSONL file upload, poll until job completes), L2-normalizes, trains tf.keras linear head (768→1), exports `{ "W", "b" }` to JSON. |
| ✅ | `scripts/requirements-train.txt` — google-genai, tensorflow, pandas, numpy, scikit-learn. |
| ✅ | `scripts/README-rating-head.md` — how to run training (venv, install, `--csv`, `--output`, `--embedding-cache`, `--limit`, etc.). |
| ✅ | **Data:** Original `scripts/books.csv` added (user). |
| ✅ | **Cleaning:** `scripts/clean-books.py` — stdlib only; keeps only description + rating, drops missing, drops rows with non-description patterns (ISBN, URLs, buy links, etc.). Run once to produce `scripts/books-cleaned.csv` (89,475 rows). |
| ✅ | `.gitignore` — `scripts/books.csv`, `scripts/books-cleaned.csv`, `scripts/embedding-cache.json`. |
| ❌ | **Run training** — User runs `train-rating-head.py` with `GEMINI_API_KEY` and `scripts/books-cleaned.csv` to produce `src/lib/rating-head.json`. Batch job can take a while (up to 24h; often less). |
| ❌ | **Website integration** — API route, head loader, page, navbar (see “What still needs to happen”). |

---

## 4. What still needs to happen

1. **Run training (one-time)**  
   - From project root:  
     `pip install -r scripts/requirements-train.txt`  
     `export GEMINI_API_KEY=your_key`  
     `python scripts/train-rating-head.py --csv scripts/books-cleaned.csv --output src/lib/rating-head.json [--embedding-cache scripts/embedding-cache.json]`  
   - Wait for Batch job to complete (script polls every 30s).  
   - Result: `src/lib/rating-head.json` with `W` (768 floats) and `b`.

2. **Implement website integration**  
   - **Placeholder head (optional):** If building before training finishes, add a placeholder `src/lib/rating-head.json` (e.g. zeros or small random weights) so the API can load something; replace with real file after training.  
   - **Head loader:** `src/lib/rating-head.ts` — load JSON, expose `predict(embedding: number[]): number` (dot(embedding, W) + b).  
   - **API route:** `POST /api/rate` — validate body `{ description: string }`, call Gemini `embedContent` (same model/config as chat), `normalizeEmbedding`, load head, compute rating, return `{ rating: number }`.  
   - **Page:** `src/app/rate/page.tsx` — textarea, submit, display rating, loading, error. Call `fetch('/api/rate', ...)`. Style with existing theme (Tailwind, CSS vars).  
   - **Navbar:** Add link to `/rate` in `src/components/Navbar.tsx`.

3. **Decide (if not using defaults)**  
   - API path: `/api/rate` vs `/api/rate-description`.  
   - Page path: `/rate` vs `/rate-my-book`.  
   - Display format: e.g. “3.7 / 5” or “3.7 stars”.  
   - Optional disclaimer on the page (e.g. “For fun; based on patterns in book descriptions and ratings.”).

---

## 5. Approach and flow (reference)

### 5.1 Training (once, offline)

1. Load cleaned CSV (`description`, `rating`).  
2. Submit **Batch** embedding job to Gemini (JSONL: one request per description; `output_dimensionality`: 768, `task_type`: RETRIEVAL_QUERY).  
3. When job completes, download results; L2-normalize each embedding.  
4. Train tf.keras linear layer (768 → 1) on (embedding, rating); MSE loss.  
5. Export `W` and `b` to JSON; write to `src/lib/rating-head.json` (or path chosen for app).

### 5.2 Inference (Vercel, per request)

1. User submits description on `/rate` page.  
2. Frontend sends `POST /api/rate` with `{ description: string }`.  
3. API route: validate → Gemini `embedContent` (same model/config as chat) → `normalizeEmbedding` → load head JSON → `rating = dot(embedding, W) + b` → return `{ rating }`.  
4. Frontend displays rating (e.g. “3.7 / 5”).

---

## 6. Data and files

- **Original CSV:** `scripts/books.csv` (ignored). Columns: `author`, `bookformat`, **`desc`**, `genre`, `img`, `isbn`, `isbn13`, `link`, `pages`, **`rating`**, `reviews`, `title`, `totalratings`.  
- **Cleaned CSV:** `scripts/books-cleaned.csv` (ignored). Columns: **`description`**, **`rating`**. 89,475 rows. Generated by:  
  `python scripts/clean-books.py --input scripts/books.csv --output scripts/books-cleaned.csv`  
- **Cleaning logic:** `scripts/clean-books.py` — drop missing; drop rows where description contains (case-insensitive) e.g. isbn, http://, www., “where to buy”, “also available”, “publication date”, goodreads.com, amazon.com, price-like patterns ($, £, USD). List is in `NON_DESCRIPTION_PATTERNS` and `PRICE_PATTERN`; editable if you want to tweak what gets filtered.  
- **Embedding cache:** Optional `scripts/embedding-cache.json` (ignored) — used by `train-rating-head.py` to skip re-calling the Batch API on re-runs.  
- **Head weights:** `src/lib/rating-head.json` — produced by training script; consumed by API route. Format: `{ "W": number[768], "b": number }`.

---

## 7. Gemini embedding (must match app)

- **Model:** `gemini-embedding-001`  
- **Config:** `outputDimensionality: 768`, `taskType: 'RETRIEVAL_QUERY'`  
- **Post-process:** L2-normalize (same as `normalizeEmbedding` in `src/lib/rag-utils.ts`).  
- **Training:** Batch API; same model and config per request in the JSONL.  
- **Inference:** Standard `embedContent` in the API route (same as chat), then `normalizeEmbedding`.

---

## 8. API route spec

- **Method/path:** `POST /api/rate` (or chosen path).  
- **Body:** `{ description: string }`. Require non-empty; optional max length.  
- **Success:** `200`, `{ rating: number }`. Optional: rounded/clamped display value.  
- **Errors:** `400` invalid/missing body; `500` missing `GEMINI_API_KEY` or embed/head failure, body `{ error: string }`.  
- **Steps:** Validate → get API key → embedContent + normalizeEmbedding → load head JSON → compute rating → return.

---

## 9. Frontend spec

- **Page:** `/rate` (or chosen path).  
- **UI:** Textarea for description, submit button, area for rating (e.g. “3.7 / 5”), loading state, error message.  
- **Call:** `fetch('/api/rate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ description }) })`.  
- **Styling:** Tailwind, theme vars (`--background`, `--text-borders`, `--bubbles`), same layout patterns as rest of site.

---

## 10. Files to create or modify (checklist)

| Action | Path / item |
|--------|-------------|
| Create | `src/app/api/rate/route.ts` — POST handler (validate, embed, load head, return rating). |
| Create | `src/lib/rating-head.json` — from training (or placeholder until then). |
| Create | `src/lib/rating-head.ts` — load JSON, `predict(embedding: number[]): number`. |
| Create | `src/app/rate/page.tsx` — form, submit, display rating, loading, error. |
| Modify | `src/components/Navbar.tsx` — add link to `/rate`. |
| Optional | Shared embedding constants (e.g. in `src/lib/rag-utils.ts` or `embedding-config.ts`) so chat and rate stay in sync. |

---

## 11. Python training (reference)

- **Script:** `scripts/train-rating-head.py`.  
- **Deps:** `pip install -r scripts/requirements-train.txt` (google-genai, tensorflow, pandas, numpy, scikit-learn).  
- **Env:** `GEMINI_API_KEY` (or `GOOGLE_API_KEY`).  
- **Command:**  
  `python scripts/train-rating-head.py --csv scripts/books-cleaned.csv --output src/lib/rating-head.json [--embedding-cache scripts/embedding-cache.json] [--limit N]`  
- **Batch flow:** Build JSONL (one line per description with `key`, `request` with `output_dimensionality`, `task_type`, `content`), upload file, `client.batches.create_embeddings(...)`, poll `client.batches.get(name=job_name)` until `JOB_STATE_SUCCEEDED`, download result file, parse embeddings, L2-normalize, train head, export JSON.  
- **Output:** `{ "W": [768 floats], "b": number }` written to `--output`.

---

## 12. Summary for an AI or new dev

- **Feature:** One new page: user enters a book/story description, gets back a predicted rating.  
- **Architecture:** B – Head only on Vercel. Description → Gemini embed (same as chat) → 768-dim normalized vector → small linear head (weights in JSON) → rating. No extra server.  
- **Training:** Python only (Batch embed + tf.keras). Use `scripts/books-cleaned.csv` (89,475 rows). Run `scripts/train-rating-head.py`; output is `src/lib/rating-head.json`.  
- **Integration:** Add API route (`POST /api/rate`), head loader (`rating-head.ts`), page (`/rate`), navbar link. Reuse Gemini embed config and `normalizeEmbedding` from chat.  
- **Decisions:** All in “Decisions made” above. Remaining work is “What still needs to happen.”
