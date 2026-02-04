import 'dotenv/config';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { normalizeEmbedding } from '@/lib/rag-utils';
import { predict } from '@/lib/rating-head';

const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM = 768;
const MAX_DESCRIPTION_LENGTH = 10000;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Rating is not configured. Set GEMINI_API_KEY in .env.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const description =
      typeof body?.description === 'string' ? body.description.trim() : '';

    if (!description) {
      return NextResponse.json(
        { error: 'Missing or empty description.' },
        { status: 400 }
      );
    }

    if (description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });
    const embedRes = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: description,
      config: {
        taskType: 'RETRIEVAL_QUERY',
        outputDimensionality: EMBEDDING_DIM,
      },
    });

    const raw = embedRes.embeddings?.[0]?.values ?? [];
    if (raw.length !== EMBEDDING_DIM) {
      return NextResponse.json(
        { error: 'Embedding failed: unexpected dimension.' },
        { status: 500 }
      );
    }

    const normed = normalizeEmbedding(raw);
    const rating = predict(normed);

    return NextResponse.json({ rating: Number(rating) });
  } catch (e) {
    console.error('[rate]', e);
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
