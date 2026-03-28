"use client";

import { Hero } from "@/types/landing";
import { useEffect, useState } from "react";

function getNextMondayUTC(): Date {
  const now = new Date();
  const utcDay = now.getUTCDay();
  const utcHour = now.getUTCHours();
  let daysUntil: number;

  if (utcDay === 1 && utcHour < 10) {
    daysUntil = 0;
  } else if (utcDay === 1 && utcHour >= 10) {
    daysUntil = 7;
  } else if (utcDay === 0) {
    daysUntil = 1;
  } else {
    daysUntil = 8 - utcDay;
  }

  const target = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntil,
      10,
      0,
      0,
      0
    )
  );
  return target;
}

function getCountdown(target: Date) {
  const now = new Date();
  const diff = Math.max(0, target.getTime() - now.getTime());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    isLive: diff === 0,
  };
}

export default ({ hero, count }: { hero: Hero; count?: number }) => {
  const [countdown, setCountdown] = useState(getCountdown(getNextMondayUTC()));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = getNextMondayUTC();
    const interval = setInterval(() => {
      setCountdown(getCountdown(target));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[#00ff88] opacity-[0.03] blur-[120px] rounded-full" />
        <div className="absolute top-40 left-0 w-[400px] h-[400px] bg-purple-500 opacity-[0.03] blur-[100px] rounded-full" />
        <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-blue-500 opacity-[0.03] blur-[100px] rounded-full" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 mt-12 md:mt-20">
        <div className="mx-auto w-full max-w-4xl text-center">
          <h1 className="leading-tight text-5xl font-bold md:text-7xl text-white">
            {hero.title}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-[#8b8d98] max-w-2xl mx-auto">
            The ultimate memecoin directory. Every Monday at 10 AM UTC, degens
            unite to find and ride the next 100x gem.
          </p>

          {/* Countdown */}
          <div className="mt-10 mb-6">
            {countdown.isLive ? (
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#00ff88]/10 border border-[#00ff88]/30 glow-green">
                <span className="w-3 h-3 rounded-full bg-[#00ff88] pulse-live" />
                <span className="text-[#00ff88] text-xl font-bold uppercase tracking-wider">
                  LIVE NOW
                </span>
              </div>
            ) : (
              <div>
                <p className="text-[#8b8d98] text-sm uppercase tracking-widest mb-4">
                  Next Memescope Monday in
                </p>
                <div className="flex justify-center gap-4 md:gap-6">
                  {mounted ? (
                    <>
                      <div className="flex flex-col items-center">
                        <span className="countdown-digit">
                          {String(countdown.days).padStart(2, "0")}
                        </span>
                        <span className="countdown-label">Days</span>
                      </div>
                      <span className="countdown-digit opacity-50">:</span>
                      <div className="flex flex-col items-center">
                        <span className="countdown-digit">
                          {String(countdown.hours).padStart(2, "0")}
                        </span>
                        <span className="countdown-label">Hours</span>
                      </div>
                      <span className="countdown-digit opacity-50">:</span>
                      <div className="flex flex-col items-center">
                        <span className="countdown-digit">
                          {String(countdown.minutes).padStart(2, "0")}
                        </span>
                        <span className="countdown-label">Mins</span>
                      </div>
                      <span className="countdown-digit opacity-50">:</span>
                      <div className="flex flex-col items-center">
                        <span className="countdown-digit">
                          {String(countdown.seconds).padStart(2, "0")}
                        </span>
                        <span className="countdown-label">Secs</span>
                      </div>
                    </>
                  ) : (
                    <span className="countdown-digit">--:--:--:--</span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="flex justify-center gap-8 mt-8">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">{count || 0}</span>
              <span className="text-xs text-[#8b8d98] uppercase tracking-wider">
                Coins Listed
              </span>
            </div>
            <div className="w-px h-10 bg-[#2a2d3a]" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">3</span>
              <span className="text-xs text-[#8b8d98] uppercase tracking-wider">
                Chains
              </span>
            </div>
            <div className="w-px h-10 bg-[#2a2d3a]" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-[#00ff88]">10 AM UTC</span>
              <span className="text-xs text-[#8b8d98] uppercase tracking-wider">
                Every Monday
              </span>
            </div>
          </div>

          {/* Chain pills */}
          <div className="flex justify-center gap-3 mt-8">
            <span className="chain-badge chain-solana">◎ Solana</span>
            <span className="chain-badge chain-base">🔵 Base</span>
            <span className="chain-badge chain-bnb">🟡 BNB Chain</span>
          </div>
        </div>
      </div>
    </section>
  );
};
