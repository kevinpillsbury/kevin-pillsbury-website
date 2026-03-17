import BouncingScene from "@/components/BouncingScene";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] bg-[var(--background)]">
      {/* Crab overlay (fixed so it can float over content while scrolling) */}
      <div className="fixed top-16 inset-x-0 bottom-0 z-10 pointer-events-none">
        <BouncingScene obstacleSelector="[data-crab-obstacle]" />
      </div>

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 pb-16">
        <section className="pt-10 sm:pt-14 flex items-center justify-center">
          <div
            className="relative w-full max-w-5xl rounded-[3.5rem] border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden"
            data-crab-obstacle
          >
            <div className="relative aspect-[16/7] sm:aspect-[16/6]">
              <video
                className="absolute inset-0 h-full w-full object-cover"
                src="/videos/home-page-vid.mp4"
                autoPlay
                muted
                playsInline
                loop
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl border border-[rgba(255,255,255,0.25)] bg-black/90 px-10 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
                  <h1 className="font-serif text-3xl sm:text-5xl tracking-tight text-white text-center">
                    Kevin Pillsbury
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl pt-10 sm:pt-12">
          <h2 className="font-serif text-4xl sm:text-5xl text-[var(--text)]">
            About
          </h2>
          <div className="mt-4 max-w-3xl font-serif text-base sm:text-lg leading-relaxed text-[var(--muted-text)] space-y-4">
            <p>If you&apos;re interested in me…</p>
            <p>Check out my writing</p>
          </div>

          <h2 className="mt-10 font-serif text-4xl sm:text-5xl text-[var(--text)]">
            Projects
          </h2>
          <div className="mt-4 max-w-3xl font-serif text-base sm:text-lg leading-relaxed text-[var(--muted-text)] space-y-4">
            <p>(More coming soon.)</p>
          </div>
        </section>
      </div>
    </div>
  );
}