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
        "w-[70px] h-[30px]",
        "px-1",
        "flex items-center",
        "transition-[filter] duration-150",
        "select-none",
        className ?? "",
      ].join(" ")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      <span
        className={[
          "h-[22px] w-[22px]",
          "rounded-full",
          "bg-[rgba(0,0,0,0.75)]",
          "transition-transform duration-200",
          isDark ? "translate-x-[38px]" : "translate-x-0",
        ].join(" ")}
      />
    </button>
  );
}

