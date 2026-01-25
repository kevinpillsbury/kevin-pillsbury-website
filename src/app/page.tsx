import prisma from '../lib/prisma';
import { Composition } from '../generated/prisma/client';

// Force dynamic rendering to avoid build-time database connection
export const dynamic = 'force-dynamic';

export default async function Home() {
  let compositions: Composition[] = [];
  let errorMessage: string | null = null;
  
  try {
    // Fetch compositions - Prisma will handle connection automatically
    compositions = await prisma.composition.findMany({
      orderBy: {
        title: 'asc'
      }
    });
    
    console.log(`Successfully fetched ${compositions.length} compositions`);
  } catch (error) {
    // Log detailed error information (visible in Vercel function logs)
    console.error('Error fetching compositions:', error);
    
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    // Return empty array on error so the page still renders
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">
        Kevin Pillsbury
      </h1>
      <p className="text-xl text-gray-500">
        Writer. Developer.
      </p>

      <section className="mt-12 w-full max-w-2xl">
        <h2 className="text-3xl font-semibold mb-6 text-center">My Compositions</h2>
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <p className="font-bold">Database Error:</p>
            <p className="text-sm">{errorMessage}</p>
            <p className="text-xs mt-2">Check Vercel function logs for more details.</p>
          </div>
        )}
        {compositions.length === 0 && !errorMessage ? (
          <p className="text-center text-gray-600">No compositions found. Add some in Prisma Studio!</p>
        ) : (
          <div className="space-y-8">
            {compositions.map((composition: Composition) => (
              <article key={composition.id} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-2xl font-bold text-gray-800">{composition.title}</h3>
                <p className="text-md text-gray-500 mb-2">{composition.genre}</p>
                <p className="text-gray-700 whitespace-pre-line">{composition.content}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}