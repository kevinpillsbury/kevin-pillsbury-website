import BouncingScene from "@/components/BouncingScene";
import DisableScroll from "@/components/DisableScroll";

export default function Home() {
  return (
    <DisableScroll>
    <div className="relative h-[calc(100vh-8rem)] overflow-hidden bg-[var(--background)]">
      <div className="fixed top-16 inset-x-0 bottom-0 z-10 overflow-hidden">
        <BouncingScene />
      </div>
      <div className="relative z-20 flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pointer-events-none">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text-borders)] sm:text-5xl font-serif">
            Kevin Pillsbury
          </h1>
        </div>
      </div>
    </div>
    </DisableScroll>
  );
}