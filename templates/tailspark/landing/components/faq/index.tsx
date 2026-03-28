"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Section } from "@/types/landing";
import { useState } from "react";

export default function ({ section }: { section: Section }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-16">
      <h2 className="text-4xl font-bold text-center mb-3 text-white">
        {section.title}
      </h2>
      <p className="text-center text-[#8b8d98] mb-10">{section.description}</p>

      <div className="space-y-3">
        {section?.items?.map((faq, index) => (
          <div
            key={index}
            className="border border-[#2a2d3a] rounded-xl overflow-hidden bg-[#181a25]"
          >
            <button
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-[#1e2030] transition-colors"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-white">{faq.title}</span>
              <svg
                className={`w-5 h-5 text-[#8b8d98] transform transition-transform duration-200 ${
                  activeIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <AnimatePresence>
              {activeIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-6 py-4 border-t border-[#2a2d3a]"
                >
                  <p className="text-[#8b8d98] text-sm leading-relaxed">
                    {faq.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
