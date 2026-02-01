import 'dotenv/config';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { CHATBOT_ROLE } from '@/lib/chatbot-config';
import { normalizeEmbedding, toVectorLiteral } from '@/lib/rag-utils';

const RATE_LIMIT_MESSAGE =
  "Woah! You've got a lot of questions. I'm not even sure Boss Kevin could answer this fast. Give me a second though and I'll see if I can find him for you.";

const OVERLOADED_MESSAGE =
  "I'm answering someone else's question real quick, I'll be right back with you!";

const NO_API_KEY_MESSAGE =
  'Chat is not configured. Set GEMINI_API_KEY in .env (or .env.local) and restart the dev server.';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;
const EMBEDDING_MODEL = 'gemini-embedding-001';
const EMBEDDING_DIM = 768;
const GLOBAL_TOP_K = 10;
const GLOBAL_CANDIDATE_K = 30;
const MAX_CHUNKS_PER_OTHER_COMPOSITION = 3;

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type RetrievedChunk = {
  compositionId: string;
  chunkIndex: number;
  title: string;
  genre: string;
  content: string;
};

function looksLikeListAllRequest(text: string) {
  const t = text.toLowerCase();
  return (
    /list\s+all\s+compositions/.test(t) ||
    /list\s+all\s+(stories|poems|essays|works)/.test(t) ||
    /show\s+me\s+all\s+compositions/.test(t) ||
    /what\s+are\s+all\s+the\s+compositions/.test(t)
  );
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('[chat] Missing GEMINI_API_KEY. Add it to .env or .env.local and restart.');
      return NextResponse.json(
        { error: NO_API_KEY_MESSAGE },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      message,
      currentCompositionId,
      currentGenre,
      history = [],
    }: {
      message: string;
      currentCompositionId?: string | null;
      currentGenre?: string | null;
      history?: ChatMessage[];
    } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid message.' },
        { status: 400 }
      );
    }

    // Cheap token-saving rule: the user can browse the catalog in the UI already.
    if (looksLikeListAllRequest(message)) {
      return NextResponse.json({
        text: `No. Boss Kevin already arranged all the compositions neatly on the site, and I refuse to recite the entire archive like some kind of obedient audiobook crab.`,
      });
    }

    let contextBlob = '';
    if (currentGenre) {
      contextBlob += `The user is currently on the ${currentGenre} page.`;
    }
    if (currentCompositionId) {
      contextBlob += ` They are viewing a specific composition (id: ${currentCompositionId}).`;
    }
    if (contextBlob) {
      contextBlob = `\n\nCurrent context: ${contextBlob}`;
    }

    const ai = new GoogleGenAI({ apiKey });

    // 1) Embed the user query for retrieval.
    let queryVectorLiteral: string | null = null;
    try {
      const embedRes = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: message,
        config: {
          taskType: 'RETRIEVAL_QUERY',
          outputDimensionality: EMBEDDING_DIM,
        },
      });
      const v = embedRes.embeddings?.[0]?.values ?? [];
      const normed = normalizeEmbedding(v);
      queryVectorLiteral = toVectorLiteral(normed);
    } catch (e) {
      // If embeddings fail, we can still chat (just with no retrieval context).
      console.warn('[chat] Embeddings failed; continuing without retrieval context.', e);
    }

    // 2) Retrieve context chunks.
    let currentCompositionChunks: RetrievedChunk[] = [];
    let globalCandidates: RetrievedChunk[] = [];

    if (currentCompositionId) {
      try {
        currentCompositionChunks = await prisma.$queryRaw<RetrievedChunk[]>`
          SELECT
            "compositionId",
            "chunkIndex",
            "title",
            "genre",
            "content"
          FROM "CompositionChunk"
          WHERE "compositionId" = ${currentCompositionId}
          ORDER BY "chunkIndex" ASC
        `;
      } catch (e) {
        console.warn('[chat] Failed to load current composition chunks.', e);
      }
    }

    if (queryVectorLiteral) {
      try {
        if (currentCompositionId) {
          globalCandidates = await prisma.$queryRaw<RetrievedChunk[]>`
            SELECT
              "compositionId",
              "chunkIndex",
              "title",
              "genre",
              "content"
            FROM "CompositionChunk"
            WHERE "compositionId" <> ${currentCompositionId}
            ORDER BY "embedding" <=> ${queryVectorLiteral}::vector
            LIMIT ${GLOBAL_CANDIDATE_K}
          `;
        } else {
          globalCandidates = await prisma.$queryRaw<RetrievedChunk[]>`
            SELECT
              "compositionId",
              "chunkIndex",
              "title",
              "genre",
              "content"
            FROM "CompositionChunk"
            ORDER BY "embedding" <=> ${queryVectorLiteral}::vector
            LIMIT ${GLOBAL_CANDIDATE_K}
          `;
        }
      } catch (e) {
        console.warn('[chat] Global retrieval failed; continuing without global context.', e);
      }
    }

    // Mild diversity: cap chunks per non-current composition so one long story doesn't dominate.
    const perCompositionCount = new Map<string, number>();
    const globalChosen: RetrievedChunk[] = [];
    for (const c of globalCandidates) {
      const n = perCompositionCount.get(c.compositionId) ?? 0;
      if (n >= MAX_CHUNKS_PER_OTHER_COMPOSITION) continue;
      perCompositionCount.set(c.compositionId, n + 1);
      globalChosen.push(c);
      if (globalChosen.length >= GLOBAL_TOP_K) break;
    }

    const seen = new Set<string>();
    const contextChunks: RetrievedChunk[] = [];
    for (const c of [...currentCompositionChunks, ...globalChosen]) {
      const key = `${c.compositionId}:${c.chunkIndex}`;
      if (seen.has(key)) continue;
      seen.add(key);
      contextChunks.push(c);
    }

    const contextText =
      contextChunks.length === 0
        ? 'No retrieved composition context was available for this question.'
        : contextChunks
            .map(
              (c) =>
                `[${c.genre}] "${c.title}" (id: ${c.compositionId}, chunk: ${c.chunkIndex})\n${c.content}`
            )
            .join('\n\n---\n\n');

    const systemInstruction = `${CHATBOT_ROLE}

You are answering questions about Kevin Pillsbury's (Boss Kevin)writing using RETRIEVED CONTEXT below.
- If the answer is not supported by the retrieved context, say you don't know, with a funny whimsical excuse in-character.
${contextBlob}

--- RETRIEVED CONTEXT ---

${contextText}`;

    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const m of history) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: m.content }] });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash-lite',
          contents,
          config: { systemInstruction },
        });
        // Sometimes models hallucinate citations like (source: "..."). Strip them.
        const text = (res.text ?? '')
          .replace(/\(source:\s*".*?"\)/gi, '')
          .replace(/\(source:\s*[^)]+\)/gi, '')
          .trim();
        return NextResponse.json({ text });
      } catch (e) {
        const status = (e as { status?: number })?.status;
        const msg = String((e as { message?: string })?.message ?? '');
        const isRetryable =
          status === 503 ||
          status === 429 ||
          /overloaded|unavailable|resource.?exhausted|quota.?exceeded/i.test(msg);
        if (!isRetryable || attempt === MAX_RETRIES - 1) throw e;
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * (attempt + 1)));
      }
    }
  } catch (err: unknown) {
    // Log the full error so we can debug
    console.error('[chat] Error:', err);

    const status = (err as { status?: number })?.status;
    const errMessage = String((err as { message?: string })?.message ?? '');
    
    // Only treat as rate limit if it's clearly a 429 or resource exhausted error
    const isRateLimit =
      status === 429 ||
      /resource.?exhausted|quota.?exceeded/i.test(errMessage);
    const isOverloaded =
      status === 503 || /overloaded|unavailable/i.test(errMessage);

    if (isRateLimit) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }
    if (isOverloaded) {
      return NextResponse.json(
        { error: OVERLOADED_MESSAGE },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: errMessage || 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
