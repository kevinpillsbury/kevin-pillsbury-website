import BouncingScene from "@/components/BouncingScene";

export default function Home() {
  return (
    <div className="relative min-h-[calc(100vh-8rem)] bg-[var(--background)]">
      {/* Crab overlay (fixed so it can float over content while scrolling) */}
      <div className="fixed top-16 inset-x-0 bottom-0 z-40 pointer-events-none">
        <BouncingScene obstacleSelector="[data-crab-obstacle]" />
      </div>

      <div className="relative z-20 w-full px-4 sm:px-6 lg:px-8 pb-16">
        <section className="pt-10 sm:pt-14 flex items-center justify-center">
          <div
            className="relative w-full max-w-5xl md:w-1/2 rounded-[3.5rem] border border-[var(--panel-border)] bg-[var(--panel)] overflow-hidden"
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
                <div className="rounded-xl border border-[rgba(255,255,255,0.25)] bg-black/55 px-10 py-6 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-[2px]">
                  <h1 className="font-serif text-3xl sm:text-5xl tracking-tight text-white text-center">
                    Kevin Pillsbury
                  </h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl md:w-1/2 pt-10 sm:pt-12">
          <h2 className="font-serif text-4xl sm:text-5xl text-[var(--text)]">
            About
          </h2>
          <div className="mt-4 max-w-3xl font-serif text-sm sm:text-base leading-relaxed text-[var(--muted-text)] space-y-4">
            <p>If you're interested in me, ask Terrence. He'll meet you on the writing page.</p>
            <p>Check out my writing.</p>
          </div>

          <h2 className="mt-10 font-serif text-4xl sm:text-5xl text-[var(--text)]">
            Projects
          </h2>
          <div className="mt-4 max-w-3xl font-serif text-sm sm:text-base leading-relaxed text-[var(--muted-text)] space-y-4">
            <p>To be honest, the rate synopsis page doesn't work because there's not really correlation between the content of a summary and the quality of a book. 'Destroy Ring' could get associated with The Lord Of The Rings in the training data and therefore the network thinks 'Destroy Ring' is good. You get the idea.</p>
            <p>I'm working on the choose your own adventure tool and I think that will actually be good. Trust.</p>
            <p>Have you found Terrence's World?</p>
          </div>
        </section>
      </div>
    </div>
  );
}