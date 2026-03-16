"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useTheme } from "../lib/theme-context";

const Navbar = () => {
  const router = useRouter();
  const { themes, activeTheme, setActiveThemeByName } = useTheme();
  return (
    <nav className="sticky top-0 z-[100] border-b border-[var(--text-borders)] bg-[var(--bubbles)]">
      <div className="w-full pl-2 pr-6 sm:pl-2 sm:pr-8 lg:pl-2 lg:pr-10">
        <div className="flex items-center justify-start h-16">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 items-center gap-3">
              <Link
                href="/"
                className="rounded-md px-5 py-2.5 text-base font-medium text-[var(--text-borders)] hover:bg-[var(--bubbles)] hover:text-[var(--text-borders)] transition-colors duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0"
              >
                Kevin Pillsbury
              </Link>
              <span className="h-6 w-px bg-[var(--text-borders)]/40" />
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="rounded-md px-5 py-2.5 text-base font-medium text-[var(--text-borders)] hover:bg-[var(--bubbles)] hover:text-[var(--text-borders)] transition-colors duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0">
                    <span>Writing</span>
                  </button>
                </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="mt-2 w-64 min-w-[16rem] bg-[var(--background)] rounded-md shadow-lg ring-1 ring-[var(--text-borders)] border border-[var(--text-borders)] focus:outline-none py-2 z-[110]"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/fiction"
                          className="block px-5 py-3 text-base text-[var(--text-borders)] hover:bg-[var(--bubbles)]"
                        >
                          Fiction
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/poetry"
                          className="block px-5 py-3 text-base text-[var(--text-borders)] hover:bg-[var(--bubbles)]"
                        >
                          Poetry
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/essays"
                          className="block px-5 py-3 text-base text-[var(--text-borders)] hover:bg-[var(--bubbles)]"
                        >
                          Essays
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/drama"
                          className="block px-5 py-3 text-base text-[var(--text-borders)] hover:bg-[var(--bubbles)]"
                        >
                          Drama
                        </Link>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              <span className="h-6 w-px bg-[var(--text-borders)]/40" />
              <Link
                href="/rate-your-synopsis"
                className="rounded-md px-5 py-2.5 text-base font-medium text-[var(--text-borders)] hover:bg-[var(--bubbles)] hover:text-[var(--text-borders)] transition-colors duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/rate-your-synopsis");
                }}
              >
                Rate your synopsis (Beta)
              </Link>
              <span className="h-6 w-px bg-[var(--text-borders)]/40" />
              <Link
                href="/choose-your-own-adventure-tool"
                className="rounded-md px-5 py-2.5 text-base font-medium text-[var(--text-borders)] hover:bg-[var(--bubbles)] hover:text-[var(--text-borders)] transition-colors duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0"
              >
                Choose Your Own Adventure Tool
              </Link>
            </div>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="rounded-md px-5 py-2.5 text-base font-medium text-[var(--text-borders)] hover:bg-[var(--bubbles)] hover:text-[var(--text-borders)] transition-colors duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0">
                  <span>Color theme</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="mt-2 w-64 min-w-[16rem] bg-[var(--background)] rounded-md shadow-lg ring-1 ring-[var(--text-borders)] border border-[var(--text-borders)] focus:outline-none py-2 z-[110]"
                  sideOffset={5}
                  align="end"
                >
                  {themes.map((t) => (
                    <DropdownMenu.Item
                      key={t.name}
                      onSelect={() => setActiveThemeByName(t.name)}
                      className={`block w-full text-left px-5 py-3 text-base text-[var(--text-borders)] hover:bg-[var(--bubbles)] cursor-pointer focus:outline-none focus:bg-[var(--bubbles)] ${
                        t.name === activeTheme.name ? "opacity-100" : "opacity-80"
                      }`}
                    >
                      {t.name}
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
