import prisma from '../../lib/prisma';
import GenreView from '../../components/GenreView';
import { notFound } from 'next/navigation';

interface GenrePageProps {
  params: Promise<{
    genre: string;
  }>;
}

// Revalidate every hour
export const revalidate = 3600;

const GENRE_BY_SLUG: Record<
  string,
  { db: string; display: string }
> = {
  fiction: { db: 'fiction', display: 'Fiction' },
  poetry: { db: 'poetry', display: 'Poetry' },
  drama: { db: 'drama', display: 'Drama' },
  essays: { db: 'essays', display: 'Essays' },
};

// Pre-build these pages at build time
export async function generateStaticParams() {
  const genres = Object.keys(GENRE_BY_SLUG);
  return genres.map((slug) => ({
    genre: slug,
  }));
}

async function getCompositionsByGenre(dbGenre: string) {
  try {
    const compositions = await prisma.composition.findMany({
      where: {
        genre: {
          equals: dbGenre,
          mode: 'insensitive', // Case-insensitive matching
        },
      },
      orderBy: {
        title: 'asc',
      },
      select: {
        id: true,
        title: true,
        content: true,
      },
    });
    return compositions;
  } catch (error) {
    console.error(`Error fetching compositions for genre "${dbGenre}":`, error);
    return []; // Return empty array on error
  }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = await params;

  // Guard against invalid or missing genre params
  if (typeof genre !== 'string') {
    return notFound();
  }

  const slug = genre.toLowerCase();
  const genreInfo = GENRE_BY_SLUG[slug];
  if (!genreInfo) return notFound();

  const compositions = await getCompositionsByGenre(genreInfo.db);

  if (compositions.length === 0) {
    // This allows the page to render with a "not found" message 
    // instead of a hard 404, which is better UX if the genre is valid
    // but just doesn't have content yet.
    console.warn(`No compositions found for genre: ${genreInfo.db}`);
  }
  
  // A true 404 would be better if the genre itself is invalid,
  // but generateStaticParams helps limit valid genre routes.

  return (
    <div className="w-full h-[calc(100vh-8rem)] overflow-hidden">
      <GenreView
        compositions={compositions}
        displayGenre={genreInfo.display}
        genreSlug={slug}
      />
    </div>
  );
}
