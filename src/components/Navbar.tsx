"use client";

import * as React from "react";
import Link from "next/link";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

const Navbar = () => {
  return (
    <nav className="sticky top-0 z-50 bg-black border-b border-blue-500">
      <div className="max-w-5xl mx-auto pl-2 pr-4 sm:pl-2 sm:pr-6 lg:pl-3 lg:pr-8">
        <div className="flex items-center justify-start h-16">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-500/20 border border-blue-500 focus:outline-none"
            >
              Home
            </Link>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-blue-500/20 border border-blue-500 focus:outline-none">
                  <span>Writing</span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="mt-2 w-64 min-w-[16rem] bg-gray-900 rounded-md shadow-lg ring-1 ring-blue-500 border border-blue-500 focus:outline-none py-2"
                  sideOffset={5}
                >
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/fiction"
                      className="block px-5 py-3 text-base text-white hover:bg-blue-500/20"
                    >
                      Fiction
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/poem"
                      className="block px-5 py-3 text-base text-white hover:bg-blue-500/20"
                    >
                      Poems
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/essay"
                      className="block px-5 py-3 text-base text-white hover:bg-blue-500/20"
                    >
                      Essays
                    </Link>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item asChild>
                    <Link
                      href="/drama"
                      className="block px-5 py-3 text-base text-white hover:bg-blue-500/20"
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
