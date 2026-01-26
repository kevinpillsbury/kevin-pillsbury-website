import prisma from '../../lib/prisma';
import GenreView from '../../components/GenreView';
import { notFound } from 'next/navigation';

interface GenrePageProps {
  params: {
    genre: string;
  };
}

// Revalidate every hour
export const revalidate = 3600;

// Pre-build these pages at build time
export async function generateStaticParams() {
  const genres = ['fiction', 'poem', 'essay', 'drama'];
  return genres.map((genre) => ({
    genre: genre,
  }));
}

async function getCompositionsByGenre(genre: string) {
  try {
    const compositions = await prisma.composition.findMany({
      where: {
        genre: {
          equals: genre,
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
    console.error(`Error fetching compositions for genre "${genre}":`, error);
    return []; // Return empty array on error
  }
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { genre } = params;

  // Guard against invalid or missing genre params
  if (typeof genre !== 'string') {
    return notFound();
  }

  const compositions = await getCompositionsByGenre(genre);

  const formattedGenre = genre.charAt(0).toUpperCase() + genre.slice(1);

  if (compositions.length === 0) {
    // This allows the page to render with a "not found" message 
    // instead of a hard 404, which is better UX if the genre is valid
    // but just doesn't have content yet.
    console.warn(`No compositions found for genre: ${genre}`);
  }
  
  // A true 404 would be better if the genre itself is invalid,
  // but generateStaticParams helps limit valid genre routes.

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 capitalize">{formattedGenre}</h1>
      <GenreView compositions={compositions} />
    </div>
  );
}
