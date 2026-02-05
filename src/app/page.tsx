import DVDBouncer from "@/components/DVDBouncer";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)]">
      {/* Full-viewport background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cartoon-space.jpg)" }}
      />
      {/* DVD bouncer - crab bouncing and spinning */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <DVDBouncer />
      </div>
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-borders)] sm:text-5xl font-serif">
            Kevin Pillsbury
          </h1>
          <p className="mt-3 font-serif text-sm text-[var(--text-borders)]/80">
            Developer. Writer.
          </p>
        </div>
      </div>
    </div>
  );
}