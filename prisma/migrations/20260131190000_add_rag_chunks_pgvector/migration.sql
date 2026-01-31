-- Enable pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Store chunked composition text + embeddings for RAG retrieval
CREATE TABLE IF NOT EXISTS "CompositionChunk" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "compositionId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "genre" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(768) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CompositionChunk_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CompositionChunk_compositionId_chunkIndex_key" UNIQUE ("compositionId", "chunkIndex")
);

CREATE INDEX IF NOT EXISTS "CompositionChunk_compositionId_idx" ON "CompositionChunk" ("compositionId");
CREATE INDEX IF NOT EXISTS "CompositionChunk_genre_idx" ON "CompositionChunk" ("genre");

-- Vector similarity index (cosine distance). For small corpora this isn't strictly required,
-- but it keeps retrieval fast as the catalog grows.
CREATE INDEX IF NOT EXISTS "CompositionChunk_embedding_ivfflat_idx"
  ON "CompositionChunk"
  USING ivfflat ("embedding" vector_cosine_ops)
  WITH (lists = 50);

