import 'dotenv/config';
import { GoogleGenAI } from '@google/genai';
import { Pool } from '@neondatabase/serverless';
import {
  chunkComposition,
  normalizeEmbedding,
  toVectorLiteral,
} from '../src/lib/rag-utils.js';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM = 768;

function requiredEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

async function main() {
  const connectionString = requiredEnv('DATABASE_URL');
  const apiKey = requiredEnv('GEMINI_API_KEY');

  const pool = new Pool({ connectionString });
  const ai = new GoogleGenAI({ apiKey });

  try {
    const { rows: compositions } = await pool.query(
      'SELECT "id", "title", "content", "genre" FROM "Composition" ORDER BY "title" ASC'
    );

    console.log(`[reindex] Indexing ${compositions.length} compositions...`);

    for (const comp of compositions) {
      const compositionId = String(comp.id);
      const title = String(comp.title ?? '');
      const genre = String(comp.genre ?? '');
      const content = String(comp.content ?? '');

      const chunks = chunkComposition({ title, genre, content });

      // Always keep at least one chunk (even if content is empty-ish).
      if (chunks.length === 0) {
        console.warn(`[reindex] Skipping empty composition: ${title} (${compositionId})`);
        continue;
      }

      const toEmbed = chunks.map((chunkText) => `Title: ${title}\n\n${chunkText}`);
      const embedRes = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: toEmbed,
        config: {
          taskType: 'RETRIEVAL_DOCUMENT',
          outputDimensionality: EMBEDDING_DIM,
          title,
        },
      });

      const embeddings = embedRes.embeddings ?? [];
      if (embeddings.length !== chunks.length) {
        throw new Error(
          `[reindex] Embedding count mismatch for ${compositionId}: expected ${chunks.length}, got ${embeddings.length}`
        );
      }

      // Replace all chunks for this composition.
      await pool.query('DELETE FROM "CompositionChunk" WHERE "compositionId" = $1', [
        compositionId,
      ]);

      const values = [];
      const placeholders = [];
      for (let i = 0; i < chunks.length; i++) {
        const raw = embeddings[i]?.values ?? [];
        const normed = normalizeEmbedding(raw);
        const vec = toVectorLiteral(normed);

        const base = i * 6;
        placeholders.push(
          `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}::vector(${EMBEDDING_DIM}))`
        );
        values.push(compositionId, i, title, genre, chunks[i], vec);
      }

      await pool.query(
        `INSERT INTO "CompositionChunk" ("compositionId","chunkIndex","title","genre","content","embedding")
         VALUES ${placeholders.join(',')}`,
        values
      );

      console.log(
        `[reindex] ${title} (${compositionId}) → ${chunks.length} chunk(s) [${genre}]`
      );
    }

    console.log('[reindex] Done.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[reindex] Failed:', err);
  process.exit(1);
});

