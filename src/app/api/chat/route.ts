import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';
import { CHATBOT_ROLE } from '@/lib/chatbot-config';

const RATE_LIMIT_MESSAGE =
  "Woah! You've got a lot of questions. I'm not even sure Kevin could answer this fast. Give me a second though and I'll see if I can wake him up.";

type ChatMessage = { role: 'user' | 'assistant'; content: string };

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Chat is not configured.' },
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

    const compositions = await prisma.composition.findMany({
      orderBy: { title: 'asc' },
      select: { id: true, title: true, content: true, genre: true },
    });

    const compositionsBlob = compositions
      .map(
        (c) =>
          `[${c.genre}] "${c.title}" (id: ${c.id})\n${c.content}\n---`
      )
      .join('\n\n');

    let contextBlob = '';
    if (currentGenre) {
      contextBlob += `The user is currently on the ${currentGenre} page.`;
    }
    if (currentCompositionId) {
      const curr = compositions.find((c) => c.id === currentCompositionId);
      if (curr) {
        contextBlob += ` They are viewing the composition "${curr.title}".`;
      }
    }
    if (contextBlob) {
      contextBlob = `\n\nCurrent context: ${contextBlob}`;
    }

    const systemInstruction = `${CHATBOT_ROLE}

Below are all of Kevin Pillsbury's compositions. Use them to answer questions. Each block is [genre] "title" (id) followed by the full text.
${contextBlob}

--- COMPOSITIONS ---

${compositionsBlob}`;

    const contents: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
    for (const m of history) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      contents.push({ role, parts: [{ text: m.content }] });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents,
      config: { systemInstruction },
    });

    const text = res.text ?? '';
    return NextResponse.json({ text });
  } catch (err: unknown) {
    const status = (err as { status?: number })?.status;
    const message = String((err as { message?: string })?.message ?? '');
    const isRateLimit =
      status === 429 ||
      /rate limit|resource exhausted|429|RESOURCE_EXHAUSTED/i.test(message);
    if (isRateLimit) {
      return NextResponse.json(
        { error: RATE_LIMIT_MESSAGE },
        { status: 429 }
      );
    }
    console.error('Chat API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
