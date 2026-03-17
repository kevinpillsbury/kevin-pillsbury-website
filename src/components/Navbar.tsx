"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const Navbar = () => {
  const router = useRouter();
  return (
    <nav className="sticky top-0 z-[100] border-b border-[var(--nav-border)] bg-[var(--nav-surface)] backdrop-blur-md">
      <div className="w-full pl-2 pr-2 sm:pl-2 sm:pr-4 lg:pl-2 lg:pr-6">
        <div className="flex items-center justify-start h-16">
          <div className="flex w-full items-center justify-between">
            <div className="flex flex-1 items-center gap-3 overflow-x-auto">
              <Link
                href="/"
                className="kpw-ombre-button rounded-md px-4 py-2 text-sm font-medium transition-[filter] duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0 opacity-75 hover:opacity-90"
              >
                Home
              </Link>
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button className="kpw-ombre-button rounded-md px-4 py-2 text-sm font-medium transition-[filter] duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0 opacity-75 hover:opacity-90">
                    <span>Writing</span>
                  </button>
                </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      className="kpw-menu mt-2 w-64 min-w-[16rem] rounded-md shadow-lg focus:outline-none py-2 z-[110]"
                      sideOffset={5}
                    >
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/fiction"
                          className="block px-5 py-3 text-base text-[var(--text)] hover:bg-[rgba(255,255,255,0.08)] focus:outline-none"
                        >
                          Fiction
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/poetry"
                          className="block px-5 py-3 text-base text-[var(--text)] hover:bg-[rgba(255,255,255,0.08)] focus:outline-none"
                        >
                          Poetry
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/essays"
                          className="block px-5 py-3 text-base text-[var(--text)] hover:bg-[rgba(255,255,255,0.08)] focus:outline-none"
                        >
                          Essays
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link
                          href="/drama"
                          className="block px-5 py-3 text-base text-[var(--text)] hover:bg-[rgba(255,255,255,0.08)] focus:outline-none"
                        >
                          Drama
                        </Link>
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              <Link
                href="/rate-your-synopsis"
                className="kpw-ombre-button rounded-md px-4 py-2 text-sm font-medium transition-[filter] duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0 opacity-75 hover:opacity-90"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/rate-your-synopsis");
                }}
              >
                Rate your synopsis (Beta)
              </Link>
              <Link
                href="/choose-your-own-adventure-tool"
                className="kpw-ombre-button rounded-md px-4 py-2 text-sm font-medium transition-[filter] duration-150 focus:outline-none focus-visible:outline-none outline-none ring-0 focus:ring-0 opacity-75 hover:opacity-90"
              >
                Choose Your Own Adventure Tool
              </Link>
            </div>
            <div className="w-[78px]" />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
