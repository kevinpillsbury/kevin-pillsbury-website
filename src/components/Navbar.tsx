"use client";

import * as React from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto pl-2 pr-4 sm:pl-2 sm:pr-6 lg:pl-3 lg:pr-8">
        <div className="flex items-center justify-start h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel-2)] border border-[var(--border)] focus:outline-none"
            >
              Home
            </Link>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="px-4 py-2 rounded-md text-sm font-medium text-[var(--foreground)] hover:bg-[var(--panel-2)] border border-[var(--border)] focus:outline-none">
                  <span>Writing</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="mt-2 w-64 min-w-[16rem] bg-[var(--background)] rounded-md shadow-lg ring-1 ring-[var(--border)] border border-[var(--border)] focus:outline-none py-2"
                  sideOffset={5}
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/fiction"
                      className="block px-5 py-3 text-base text-[var(--foreground)] hover:bg-[var(--panel-2)]"
                    >
                      Fiction
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/poetry"
                      className="block px-5 py-3 text-base text-[var(--foreground)] hover:bg-[var(--panel-2)]"
                    >
                      Poetry
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/essays"
                      className="block px-5 py-3 text-base text-[var(--foreground)] hover:bg-[var(--panel-2)]"
                    >
                      Essays
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/drama"
                      className="block px-5 py-3 text-base text-[var(--foreground)] hover:bg-[var(--panel-2)]"
                    >
                      Drama
                    </Link>
                  </DropdownMenu.Item>
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
