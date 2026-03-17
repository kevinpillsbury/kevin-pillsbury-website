import BouncingScene from "@/components/BouncingScene";
import DisableScroll from "@/components/DisableScroll";

export default function Home() {
  return (
    <DisableScroll>
      <div className="relative h-[calc(100vh-8rem)] overflow-hidden bg-[var(--background)]">
        <div className="fixed top-16 inset-x-0 bottom-0 z-10 overflow-hidden">
          <BouncingScene />
        </div>

        <div className="relative z-20 flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 sm:px-6 lg:px-8 pointer-events-none">
          <div className="home-bio-window w-full max-w-xl mx-auto rounded-[3.25rem] border-0 border-y-0 border-l-[6px] border-r-[6px] border-[var(--bubbles)] border-solid flex items-center justify-center">
            <div className="px-8 py-6 sm:px-10 sm:py-8 w-full max-w-xl">
              <h1 className="text-3xl font-bold tracking-tight text-[var(--text-borders)] sm:text-5xl font-serif text-center">
                Kevin Pillsbury
              </h1>
              <ul className="mt-4 text-[var(--text-borders)] text-base sm:text-lg font-serif text-left list-none space-y-4 p-0 m-0">
                {[
                  "If you're interested in me, ask Terrence, he'll meet you on the writing page.",
                  "If you want to check out my writing, tap a block or go to my writing page.",
                  "To be honest, the rate synopsis page doesn't work because there's not really correlation between the content of a summary and the quality of a book. 'Destroy Ring' could get associated with The Lord Of The Rings in the network training and therefore it thinks 'Destroy Ring' is good. You get the idea.",
                  "I'm working on the choose your own adventure tool and I think that will actually be good. Trust.",
                  "Have you found Terrence's World?",
                ].map((line, i) => (
                  <li key={i} className="block">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DisableScroll>
  );
}