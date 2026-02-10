import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET: return all compositions with id, title, genreSlug for home page bouncing block links. */
export async function GET() {
  try {
    const compositions = await prisma.composition.findMany({
      orderBy: { title: "asc" },
      select: { id: true, title: true, genre: true },
    });
    const list = compositions.map((c) => ({
      id: c.id,
      title: c.title,
      genreSlug: c.genre.toLowerCase(),
    }));
    return NextResponse.json({ compositions: list });
  } catch (error) {
    console.error("[api/compositions/titles]", error);
    return NextResponse.json(
      { error: "Failed to fetch compositions" },
      { status: 500 }
    );
  }
}
