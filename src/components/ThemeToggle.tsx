"use client";

import * as React from "react";
import { useTheme } from "@/lib/theme-context";

export default function ThemeToggle({ className }: { className?: string }) {
  const { mode, toggle } = useTheme();
  const isDark = mode === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      className={[
        "kpw-ombre-button",
        "rounded-full",
        "w-[56px] h-[24px]",
        "px-1",
        "relative flex items-center",
        "transition-[filter] duration-150",
        "select-none",
        className ?? "",
      ].join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-[10px] text-[rgba(35,35,35,0.85)]">
        Color Theme
      </span>
      <span
        className={[
          "h-[18px] w-[18px]",
          "rounded-full",
          "bg-[rgba(0,0,0,0.75)]",
          "transition-transform duration-200",
          isDark ? "translate-x-[30px]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

