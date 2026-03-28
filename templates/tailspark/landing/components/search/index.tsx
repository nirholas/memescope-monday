"use client";

import { ChangeEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  query?: string;
}

export default ({ query }: Props) => {
  const router = useRouter();
  const [inputDisabled, setInputDisabled] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [content, setContent] = useState("");

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setContent(e.target.value);
  };

  const handleInputKeydown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.code === "Enter" && !e.shiftKey) {
      if (e.keyCode !== 229) {
        e.preventDefault();
        handleSubmit(content);
      }
    }
  };

  const handleSubmit = async (question: string) => {
    try {
      const url = `?q=${encodeURIComponent(question)}`;
      await router.push(url);
      setInputDisabled(true);
    } catch (e) {
      console.log("search failed: ", e);
      setInputDisabled(false);
    }
  };

  useEffect(() => {
    if (query) {
      setContent(query);
      setInputDisabled(false);
    }
  }, [query]);

  return (
    <section className="relative mt-6 md:mt-10">
      <div className="mx-auto w-full max-w-2xl px-6 text-center">
        <div className="flex items-center relative">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-4 w-5 h-5 text-[#8b8d98]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50 disabled:opacity-50 transition-colors"
            placeholder="Search coins by name, ticker, or category..."
            ref={inputRef}
            value={content}
            disabled={inputDisabled}
            onChange={handleInputChange}
            onKeyDown={handleInputKeydown}
          />
        </div>
      </div>
    </section>
  );
};
