"use client"

import { useEffect, useState } from "react"

function getNextMondayUTC(): Date {
  const now = new Date()
  const utcDay = now.getUTCDay()
  const utcHour = now.getUTCHours()
  let daysUntil: number
  if (utcDay === 1 && utcHour < 10) daysUntil = 0
  else if (utcDay === 1) daysUntil = 7
  else if (utcDay === 0) daysUntil = 1
  else daysUntil = 8 - utcDay
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil, 10, 0, 0, 0),
  )
}

export function CountdownTimer() {
  const [mounted, setMounted] = useState(false)
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    setMounted(true)
    const target = getNextMondayUTC()
    const update = () => setDiff(Math.max(0, target.getTime() - Date.now()))
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) return null

  const target = getNextMondayUTC()
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
  const dateLabel = `${monthNames[target.getUTCMonth()]} ${target.getUTCDate()}`

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff / 3600000) % 24)
  const minutes = Math.floor((diff / 60000) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  const isLive = diff === 0

  if (isLive) {
    return (
      <div className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 flex items-center justify-center gap-2 rounded-lg border px-4 py-3">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-sm font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
          MEMESCOPE MONDAY IS LIVE
        </span>
      </div>
    )
  }

  return (
    <div className="bg-secondary/50 border-border/40 rounded-lg border p-4">
      <p className="text-muted-foreground mb-3 text-center text-xs font-medium tracking-wider uppercase">
        Memescope Monday {dateLabel} 10AM UTC
      </p>
      <div className="flex justify-center gap-3">
        {[
          { val: days, label: "Days" },
          { val: hours, label: "Hours" },
          { val: minutes, label: "Mins" },
          { val: seconds, label: "Secs" },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center">
            <span className="text-foreground text-2xl font-bold tabular-nums md:text-3xl">
              {String(item.val).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground text-[10px] uppercase">{item.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-center gap-2">
        <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
          ◎ Solana
        </span>
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
          Base
        </span>
        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
          BNB
        </span>
      </div>
    </div>
  )
}
