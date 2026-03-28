"use client";

import { Header, Item } from "@/types/landing";

import { useState } from "react";
import { usePathname } from "next/navigation";

export default ({ header }: { header: Header }) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="mx-auto w-full max-w-7xl px-4 md:px-8 mt-4">
      <div className="flex items-center justify-between">
        <a
          className="flex items-center py-3 px-2 cursor-pointer"
          href={header?.brand?.url}
        >
          <span className="text-xl md:text-2xl font-bold text-white">
            <span className="text-[#00ff88]">Memescope</span> Monday
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-6 text-sm">
          {header?.nav?.items?.map((item: Item, idx: number) => (
            <li key={idx}>
              <a
                href={item.url}
                target={item.target}
                className={`transition-colors ${
                  pathname === item.url
                    ? "text-[#00ff88]"
                    : "text-[#8b8d98] hover:text-white"
                }`}
              >
                {item.title}
              </a>
            </li>
          ))}
          <li>
            <a
              href="/submit"
              className="px-4 py-2 rounded-lg bg-[#00ff88] text-[#0a0b0f] font-semibold text-sm hover:bg-[#00cc6e] transition-colors"
            >
              Submit Coin
            </a>
          </li>
        </ul>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {mobileOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden py-4 border-t border-[#2a2d3a]">
          <ul className="flex flex-col gap-4">
            {header?.nav?.items?.map((item: Item, idx: number) => (
              <li key={idx}>
                <a
                  href={item.url}
                  target={item.target}
                  className={`block py-2 ${
                    pathname === item.url
                      ? "text-[#00ff88]"
                      : "text-[#8b8d98] hover:text-white"
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.title}
                </a>
              </li>
            ))}
            <li>
              <a
                href="/submit"
                className="inline-block px-4 py-2 rounded-lg bg-[#00ff88] text-[#0a0b0f] font-semibold text-sm"
              >
                Submit Coin
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
};
