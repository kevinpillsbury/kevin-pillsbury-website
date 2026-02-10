import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET: return all composition titles for use on the home page bouncing blocks. */
export async function GET() {
  try {
    const compositions = await prisma.composition.findMany({
      orderBy: { title: "asc" },
      select: { title: true },
    });
    const titles = compositions.map((c) => c.title);
    return NextResponse.json({ titles });
  } catch (error) {
    console.error("[api/compositions/titles]", error);
    return NextResponse.json(
      { error: "Failed to fetch titles" },
      { status: 500 }
    );
  }
}
