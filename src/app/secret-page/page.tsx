export default function SecretPage() {
  return (
    <div className="h-[calc(100vh-8rem)] flex items-center justify-center bg-[var(--background)]">
      <div className="max-w-2xl text-center">
        <h1 className="font-serif text-3xl sm:text-4xl text-[var(--text-borders)] mb-4">
          Congradulations! You&apos;ve found Terrence&apos;s World.
        </h1>
        <p className="font-serif text-lg text-[var(--text-borders)]/90 leading-relaxed">
          He&apos;s still constructing it, but check back later and he may have made
          progress.
        </p>
      </div>
    </div>
  );
}

