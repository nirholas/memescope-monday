"use client";

import { Footer, Item } from "@/types/landing";

export default ({ footer }: { footer: Footer }) => {
  return (
    <footer className="border-t border-[#2a2d3a] mt-20">
      <div className="mx-auto w-full max-w-7xl px-5 py-12 md:px-10 md:py-16">
        <div className="flex flex-row justify-between max-[767px]:flex-col max-[767px]:items-start gap-8">
          <div className="w-full max-w-[400px]">
            <p className="text-xl font-bold text-white mb-2">
              <span className="text-[#00ff88]">Memescope</span> Monday
            </p>
            <p className="text-sm text-[#8b8d98] leading-relaxed">
              {footer?.brand?.description}
            </p>
            <div className="mt-4">
              <a
                className="text-[#00ff88] text-sm hover:underline"
                href={footer?.social?.items?.email?.url}
                target={footer?.social?.items?.email?.target}
              >
                {footer?.social?.items?.email?.title}
              </a>
            </div>
          </div>

          <div className="flex flex-wrap gap-12">
            {footer?.nav?.items?.map((item: Item, idx: number) => (
              <div key={idx}>
                <p className="text-white font-semibold text-sm mb-3">
                  {item?.title}
                </p>
                {item?.children?.map((child: Item, iidx: number) => (
                  <p key={iidx}>
                    <a
                      href={child?.url}
                      className="inline-block py-1 text-sm text-[#8b8d98] hover:text-[#00ff88] transition-colors"
                      target={child?.target}
                    >
                      {child?.title}
                    </a>
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#2a2d3a] flex justify-between items-center max-[479px]:flex-col gap-4">
          <p className="text-[#8b8d98] text-xs">
            &copy; 2025{" "}
            <a
              className="text-[#00ff88] hover:underline"
              href={footer?.copyright?.url}
              target={footer?.copyright?.target}
            >
              {footer?.copyright?.owner}
            </a>
            . {footer?.copyright?.text}
          </p>
          <p className="text-[#8b8d98] text-xs">
            Not financial advice. DYOR. Memecoins are highly speculative.
          </p>
        </div>
      </div>
    </footer>
  );
};
