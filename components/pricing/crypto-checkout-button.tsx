"use client"

import { useCallback, useState } from "react"

import { RiLoader4Line, RiWallet3Line } from "@remixicon/react"
import { useAccount, useConnect, useDisconnect, useWalletClient } from "wagmi"

import { Button } from "@/components/ui/button"

interface CryptoCheckoutButtonProps {
  tier: string
  priceUsd: number
  projectId?: string
}

export function CryptoCheckoutButton({ tier, priceUsd, projectId }: CryptoCheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>("")

  const { address, isConnected } = useAccount()
  const { connectors, connect } = useConnect()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient()

  const handlePayment = useCallback(async () => {
    if (!walletClient || !address) return

    setLoading(true)
    setStatus("Preparing payment...")

    try {
      // Step 1: Request payment requirements from our API
      const requirementsRes = await fetch("/api/payment/x402", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, projectId }),
      })

      if (requirementsRes.status !== 402) {
        const data = await requirementsRes.json()
        alert(data.error || "Unexpected response from payment server")
        return
      }

      const requirements = await requirementsRes.json()
      const paymentSpec = requirements.accepts?.[0]

      if (!paymentSpec) {
        alert("Invalid payment requirements received")
        return
      }

      setStatus("Awaiting wallet signature...")

      // Step 2: Use x402 client to create payment
      // Dynamic import to keep bundle size smaller on non-payment pages
      const { wrapFetchWithPayment } = await import("@x402/client")

      const x402Fetch = wrapFetchWithPayment(fetch, walletClient)

      setStatus("Processing payment on Base...")

      // Step 3: Retry the request with payment — x402 client handles 402 flow
      const paymentRes = await x402Fetch("/api/payment/x402", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, projectId }),
      })

      if (!paymentRes.ok) {
        const err = await paymentRes.json()
        alert(err.error || "Payment failed")
        return
      }

      const result = await paymentRes.json()

      if (result.success) {
        setStatus("Payment confirmed!")

        if (result.type === "sponsor") {
          window.location.href = "/sponsors"
        } else if (result.projectSlug) {
          window.location.href = `/projects/${result.projectSlug}`
        } else {
          window.location.href = "/payment/success?type=x402"
        }
      }
    } catch (err) {
      console.error("x402 payment error:", err)
      alert("Payment failed. Please try again or use card payment.")
    } finally {
      setLoading(false)
      setStatus("")
    }
  }, [walletClient, address, tier, projectId])

  // Not connected — show connect button
  if (!isConnected) {
    return (
      <div className="flex flex-col gap-1.5">
        {connectors.slice(0, 2).map((connector) => (
          <Button
            key={connector.uid}
            size="sm"
            variant="outline"
            className="w-full text-xs"
            onClick={() => connect({ connector })}
          >
            <RiWallet3Line className="mr-1.5 h-3.5 w-3.5" />
            {connector.name === "Injected" ? "Browser Wallet" : connector.name}
          </Button>
        ))}
      </div>
    )
  }

  // Connected — show pay button
  return (
    <div className="flex flex-col gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="w-full text-xs"
        onClick={handlePayment}
        disabled={loading || !walletClient}
      >
        {loading ? (
          <>
            <RiLoader4Line className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            {status || "Processing..."}
          </>
        ) : (
          <>
            <RiWallet3Line className="mr-1.5 h-3.5 w-3.5" />
            Pay ${priceUsd} USDC
          </>
        )}
      </Button>
      <button
        className="text-muted-foreground hover:text-foreground text-[10px] underline"
        onClick={() => disconnect()}
      >
        {address?.slice(0, 6)}...{address?.slice(-4)} · Disconnect
      </button>
    </div>
  )
}
