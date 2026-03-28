"use client"

import { formatNumber, formatPercent, formatUSD, type CoinDetailData } from "@/lib/coin-data"

interface CoinMarketDataProps {
  data: CoinDetailData
  chain: string
}

function StatCard({
  label,
  value,
  subValue,
  changePercent,
}: {
  label: string
  value: string
  subValue?: string
  changePercent?: number | null
}) {
  return (
    <div className="bg-muted/50 rounded-lg p-3">
      <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
        {label}
      </div>
      <div className="text-foreground text-sm font-bold">{value}</div>
      {changePercent !== undefined && changePercent !== null && (
        <div
          className={`mt-0.5 text-xs font-medium ${
            changePercent >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatPercent(changePercent)}
        </div>
      )}
      {subValue && <div className="text-muted-foreground mt-0.5 text-xs">{subValue}</div>}
    </div>
  )
}

function TxnRow({ label, buys, sells }: { label: string; buys: number; sells: number }) {
  const total = buys + sells
  const buyPct = total > 0 ? (buys / total) * 100 : 50
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{buys}B</span>
          {" / "}
          <span className="text-red-600 dark:text-red-400">{sells}S</span>
        </span>
      </div>
      <div className="flex h-1.5 overflow-hidden rounded-full">
        <div className="bg-green-500 transition-all" style={{ width: `${buyPct}%` }} />
        <div className="bg-red-500 transition-all" style={{ width: `${100 - buyPct}%` }} />
      </div>
    </div>
  )
}

export function CoinMarketDataPanel({ data }: CoinMarketDataProps) {
  const { market, dexscreener, pumpfun } = data

  return (
    <div className="space-y-6">
      {/* Price Header */}
      <div>
        <div className="text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase">
          Price
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-foreground text-2xl font-bold">{formatUSD(market.price)}</span>
          {market.priceChange24h !== null && (
            <span
              className={`text-sm font-semibold ${
                market.priceChange24h >= 0
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(market.priceChange24h)} (24h)
            </span>
          )}
        </div>
      </div>

      {/* Market Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Market Cap" value={formatUSD(market.marketCap)} />
        <StatCard label="24h Volume" value={formatUSD(market.volume24h)} />
        <StatCard label="Liquidity" value={formatUSD(market.liquidity)} />
        <StatCard label="FDV" value={formatUSD(market.fdv)} />
        {market.ath !== null && (
          <StatCard
            label="ATH Market Cap"
            value={formatUSD(market.ath)}
            subValue={market.athDate ? new Date(market.athDate).toLocaleDateString() : undefined}
          />
        )}
        {market.holders !== null && (
          <StatCard label="Holders" value={formatNumber(market.holders)} />
        )}
      </div>

      {/* DexScreener Transaction Data */}
      {dexscreener?.txns && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Transactions
          </h4>
          <div className="space-y-2">
            <TxnRow label="5m" buys={dexscreener.txns.m5.buys} sells={dexscreener.txns.m5.sells} />
            <TxnRow label="1h" buys={dexscreener.txns.h1.buys} sells={dexscreener.txns.h1.sells} />
            <TxnRow label="6h" buys={dexscreener.txns.h6.buys} sells={dexscreener.txns.h6.sells} />
            <TxnRow
              label="24h"
              buys={dexscreener.txns.h24.buys}
              sells={dexscreener.txns.h24.sells}
            />
          </div>
        </div>
      )}

      {/* Volume Breakdown */}
      {dexscreener?.volume && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Volume
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="text-muted-foreground text-[10px] uppercase">5m</div>
              <div className="text-foreground text-xs font-semibold">
                {formatUSD(dexscreener.volume.m5)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="text-muted-foreground text-[10px] uppercase">1h</div>
              <div className="text-foreground text-xs font-semibold">
                {formatUSD(dexscreener.volume.h1)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="text-muted-foreground text-[10px] uppercase">6h</div>
              <div className="text-foreground text-xs font-semibold">
                {formatUSD(dexscreener.volume.h6)}
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-2 text-center">
              <div className="text-muted-foreground text-[10px] uppercase">24h</div>
              <div className="text-foreground text-xs font-semibold">
                {formatUSD(dexscreener.volume.h24)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Price Changes */}
      {dexscreener?.priceChange && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            Price Change
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "5m", value: dexscreener.priceChange.m5 },
              { label: "1h", value: dexscreener.priceChange.h1 },
              { label: "6h", value: dexscreener.priceChange.h6 },
              { label: "24h", value: dexscreener.priceChange.h24 },
            ].map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-md p-2 text-center">
                <div className="text-muted-foreground text-[10px] uppercase">{item.label}</div>
                <div
                  className={`text-xs font-semibold ${
                    item.value >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatPercent(item.value)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PumpFun Info */}
      {pumpfun && (
        <div className="space-y-3">
          <h4 className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
            PumpFun
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  pumpfun.complete
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                }`}
              >
                {pumpfun.complete ? "Bonding Complete" : "On Bonding Curve"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Replies</span>
              <span className="text-foreground font-medium">
                {pumpfun.replyCount.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground font-medium">
                {new Date(pumpfun.createdTimestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
