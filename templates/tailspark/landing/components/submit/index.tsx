"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CHAINS = [
  { id: "solana", name: "Solana", icon: "◎" },
  { id: "base", name: "Base", icon: "🔵" },
  { id: "bnb", name: "BNB Chain", icon: "🟡" },
];

const CATEGORIES = [
  "Meme", "Dog", "Cat", "AI", "Gaming", "DeFi", "Culture", "Celebrity", "Political", "Other",
];

const PAID_FEATURES = {
  expedited: { price: 19, label: "Expedited Review", desc: "Skip the queue. Reviewed within 1 hour." },
  trending: { price: 49, label: "Trending Placement", desc: "24h featured in the Trending section." },
  bundle: { price: 59, label: "Bundle (Both)", desc: "Expedited review + 24h trending placement." },
};

export default function SubmitForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paidOption, setPaidOption] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    ticker: "",
    chain: "solana",
    contract_address: "",
    description: "",
    category: "Meme",
    coin_type: "existing",
    launch_date: "",
    website_url: "",
    twitter_url: "",
    telegram_url: "",
    pumpfun_url: "",
    submitter_email: "",
    avatar_url: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/submit-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          paid_expedited: paidOption === "expedited" || paidOption === "bundle",
          paid_trending: paidOption === "trending" || paidOption === "bundle",
        }),
      });

      const data = await res.json();
      if (data.code !== 0) {
        setError(data.message || "Submit failed");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="rounded-xl border border-[#00ff88]/30 bg-[#00ff88]/5 p-12">
          <h2 className="text-3xl font-bold text-white mb-4">Coin Submitted!</h2>
          <p className="text-[#8b8d98] mb-6">
            Your coin has been submitted for review.
            {paidOption === "expedited" || paidOption === "bundle"
              ? " Expedited review - expect approval within 1 hour."
              : " It will appear in the directory once approved."}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 rounded-lg bg-[#00ff88] text-[#0a0b0f] font-semibold"
          >
            Back to Directory
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-5 py-12">
      <h1 className="text-3xl font-bold text-white mb-2">Submit Your Coin</h1>
      <p className="text-[#8b8d98] mb-8">
        List your memecoin on the Memescope Monday directory
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Coin Name */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Coin Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
            placeholder="e.g., Gake"
          />
        </div>

        {/* Ticker */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Ticker <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.ticker}
            onChange={(e) => update("ticker", e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
            placeholder="e.g., GAKE"
          />
        </div>

        {/* Chain */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Chain <span className="text-red-400">*</span>
          </label>
          <div className="flex gap-3">
            {CHAINS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => update("chain", c.id)}
                className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                  form.chain === c.id
                    ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                    : "border-[#2a2d3a] bg-[#181a25] text-[#8b8d98] hover:border-[#8b8d98]"
                }`}
              >
                {c.icon} {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Coin Type */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Coin Type
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => update("coin_type", "existing")}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                form.coin_type === "existing"
                  ? "border-[#00ff88] bg-[#00ff88]/10 text-white"
                  : "border-[#2a2d3a] bg-[#181a25] text-[#8b8d98] hover:border-[#8b8d98]"
              }`}
            >
              Existing Coin
            </button>
            <button
              type="button"
              onClick={() => update("coin_type", "upcoming")}
              className={`flex-1 py-3 rounded-xl border text-sm font-medium transition-all ${
                form.coin_type === "upcoming"
                  ? "border-yellow-400 bg-yellow-400/10 text-white"
                  : "border-[#2a2d3a] bg-[#181a25] text-[#8b8d98] hover:border-[#8b8d98]"
              }`}
            >
              Upcoming Launch
            </button>
          </div>
        </div>

        {/* Launch date for upcoming */}
        {form.coin_type === "upcoming" && (
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Launch Date & Time (UTC)
            </label>
            <input
              type="datetime-local"
              value={form.launch_date}
              onChange={(e) => update("launch_date", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white text-sm focus:outline-none focus:border-yellow-400/50 [color-scheme:dark]"
            />
          </div>
        )}

        {/* Contract Address */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Contract Address{" "}
            {form.coin_type === "existing" && (
              <span className="text-red-400">*</span>
            )}
          </label>
          <input
            type="text"
            required={form.coin_type === "existing"}
            value={form.contract_address}
            onChange={(e) => update("contract_address", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm font-mono focus:outline-none focus:border-[#00ff88]/50"
            placeholder="e.g., So11111111111111111111111111111111111111112"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50 resize-none"
            placeholder="Tell us about this coin..."
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Category
          </label>
          <select
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white text-sm focus:outline-none focus:border-[#00ff88]/50"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Image URL
          </label>
          <input
            type="url"
            value={form.avatar_url}
            onChange={(e) => update("avatar_url", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
            placeholder="https://..."
          />
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Website
            </label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => update("website_url", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Twitter
            </label>
            <input
              type="url"
              value={form.twitter_url}
              onChange={(e) => update("twitter_url", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
              placeholder="https://twitter.com/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              Telegram
            </label>
            <input
              type="url"
              value={form.telegram_url}
              onChange={(e) => update("telegram_url", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
              placeholder="https://t.me/..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white mb-1">
              PumpFun
            </label>
            <input
              type="url"
              value={form.pumpfun_url}
              onChange={(e) => update("pumpfun_url", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
              placeholder="https://pump.fun/..."
            />
          </div>
        </div>

        {/* Contact Email */}
        <div>
          <label className="block text-sm font-medium text-white mb-1">
            Contact Email <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            required
            value={form.submitter_email}
            onChange={(e) => update("submitter_email", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-[#2a2d3a] bg-[#181a25] text-white placeholder-[#8b8d98] text-sm focus:outline-none focus:border-[#00ff88]/50"
            placeholder="you@example.com"
          />
        </div>

        {/* Paid Features */}
        <div className="border border-[#2a2d3a] rounded-xl p-5 bg-[#181a25]">
          <p className="text-white font-semibold mb-1">Boost Your Listing</p>
          <p className="text-[#8b8d98] text-xs mb-4">
            Free listings are reviewed within 24h. Upgrade for faster results.
          </p>

          <div className="space-y-3">
            {(Object.entries(PAID_FEATURES) as [string, typeof PAID_FEATURES.expedited][]).map(
              ([key, feat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setPaidOption(paidOption === key ? null : key)
                  }
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    paidOption === key
                      ? "border-[#00ff88] bg-[#00ff88]/5"
                      : "border-[#2a2d3a] hover:border-[#8b8d98]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-white font-medium text-sm">
                        {feat.label}
                      </span>
                      <span className="text-[#00ff88] text-sm ml-2">
                        ${feat.price}
                      </span>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paidOption === key
                          ? "border-[#00ff88] bg-[#00ff88]"
                          : "border-[#8b8d98]"
                      }`}
                    >
                      {paidOption === key && (
                        <svg
                          className="w-3 h-3 text-[#0a0b0f]"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                  <p className="text-[#8b8d98] text-xs mt-1">{feat.desc}</p>
                </button>
              )
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-[#00ff88] text-[#0a0b0f] font-bold text-lg hover:bg-[#00cc6e] disabled:opacity-50 transition-colors"
        >
          {submitting
            ? "Submitting..."
            : paidOption
            ? `Submit & Pay ($${PAID_FEATURES[paidOption as keyof typeof PAID_FEATURES].price})`
            : "Submit Coin (Free)"}
        </button>

        <p className="text-center text-[#8b8d98] text-xs">
          Not financial advice. We do not endorse any coins listed on this
          platform. DYOR.
        </p>
      </form>
    </div>
  );
}
