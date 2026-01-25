import prisma from '../lib/prisma';
import { Composition } from '../generated/prisma/client';

export default async function Home() {
  const compositions = await prisma.composition.findMany();

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
        {compositions.length === 0 ? (
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