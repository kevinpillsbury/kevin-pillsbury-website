import BouncingCrab from "@/components/BouncingCrab";
import DisableScroll from "@/components/DisableScroll";

export default function Home() {
  return (
    <DisableScroll>
    <div className="relative h-[calc(100vh-8rem)] overflow-hidden">
      {/* Background - below navbar only */}
      <div
        className="fixed top-16 inset-x-0 bottom-0 -z-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/images/cartoon-space.jpg)" }}
      />
      {/* Bouncing crab - z-20 so it's clickable above content */}
      <div className="fixed top-16 inset-x-0 bottom-0 z-20 overflow-hidden">
        <BouncingCrab />
      </div>
      {/* Content overlay */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
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