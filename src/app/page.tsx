export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--text-borders)] sm:text-5xl font-serif">
          Kevin Pillsbury
        </h1>
        <p className="mt-3 font-serif text-sm text-[var(--text-borders)]/80">
          Developer. Writer.
        </p>
      </div>
    </div>
  );
}