"use client";

import { useEffect, useRef, useState } from "react";

export default function EasterEggButton() {
  const [isOpen, setIsOpen] = useState(false);
  const clickCountRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = () => {
    // Do not show any visual feedback; just track clicks.
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    clickCountRef.current += 1;

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      timeoutRef.current = null;
      setIsOpen(true);
      return;
    }

    timeoutRef.current = window.setTimeout(() => {
      clickCountRef.current = 0;
      timeoutRef.current = null;
    }, 600);
  };

  return (
    <>
      {/* Invisible square button in bottom-left, behind bouncing blocks (no z-index set) */}
      <button
        type="button"
        onClick={handleClick}
        aria-label="Hidden easter egg"
        className="absolute bottom-0 left-0 w-12 h-12 bg-[var(--background)] border-none p-0 m-0 cursor-pointer focus:outline-none focus-visible:outline-none active:outline-none"
      />

      {isOpen && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/40">
          <div className="relative max-w-sm rounded-3xl border border-[var(--text-borders)] bg-[var(--bubbles)] px-6 py-5 shadow-lg">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close easter egg"
              className="absolute right-3 top-3 text-[var(--text-borders)]/80 hover:text-[var(--text-borders)] focus:outline-none"
            >
              ×
            </button>
            <p className="font-serif text-[var(--text-borders)] text-base leading-relaxed pr-5">
              You found my easter egg. I don&apos;t know what to do with this yet, but
              hopefully I have an idea soon.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

