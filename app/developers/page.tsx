import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata = {
  title: "Developers - Memescope Monday",
  description:
    "API documentation for integrating with Memescope Monday. Search coins, fetch trending data, submit projects, and more.",
}

const endpoints = [
  {
    method: "GET",
    path: "/api/coins/lookup",
    title: "Lookup Coin",
    description: "Fetch coin metadata by contract address from PumpFun, DexScreener, and Helius.",
    auth: false,
    params: [
      { name: "address", type: "string", required: true, description: "Contract address (min 10 chars)" },
      { name: "chain", type: "string", required: false, description: '"solana" (default), "base", "bnb", or "ethereum"' },
    ],
    response: `{
  "result": {
    "name": "string",
    "ticker": "string",
    "description": "string",
    "logoUrl": "string",
    "websiteUrl": "string",
    "twitterUrl": "string",
    "telegramUrl": "string",
    "pumpfunUrl": "string",
    "dexscreenerUrl": "string",
    "source": "pumpfun | dexscreener | helius"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/coins/trending",
    title: "Trending Coins",
    description: "Retrieve trending coins from CoinGecko, DexScreener, PumpFun, or BirdEye.",
    auth: false,
    params: [
      {
        name: "source",
        type: "string",
        required: false,
        description: '"coingecko", "dexscreener", "pumpfun", or "birdeye". Omit for aggregated results.',
      },
    ],
    response: `{
  "data": [...]
}`,
  },
  {
    method: "GET",
    path: "/api/coins/:address/enrich",
    title: "Enrich Coin",
    description: "Get enriched metadata for a coin by contract address, aggregated from multiple sources.",
    auth: false,
    params: [
      { name: "address", type: "path", required: true, description: "Contract address" },
      { name: "chain", type: "string", required: false, description: '"solana" (default), "base", "bnb", or "ethereum"' },
    ],
    response: `{
  "data": {
    "name": "string",
    "description": "string",
    "logoUrl": "string",
    ...
  }
}`,
  },
  {
    method: "GET",
    path: "/api/search",
    title: "Search",
    description: "Full-text search across projects and categories. Results are cached for 60 seconds.",
    auth: false,
    rateLimit: "Rate limited — check X-RateLimit-* response headers",
    params: [
      { name: "q", type: "string", required: true, description: "Search query (min 2 chars)" },
      { name: "limit", type: "number", required: false, description: "Max results (default: 10)" },
    ],
    response: `{
  "results": [
    {
      "id": "string",
      "name": "string",
      "slug": "string | null",
      "description": "string | null",
      "logoUrl": "string | null",
      "type": "project | category"
    }
  ]
}`,
  },
  {
    method: "GET",
    path: "/api/projects/check-url",
    title: "Check URL Availability",
    description: "Check whether a website URL is already claimed by an existing project.",
    auth: false,
    params: [{ name: "url", type: "string", required: true, description: "Website URL to check" }],
    response: `{
  "exists": true | false
}`,
  },
  {
    method: "GET",
    path: "/api/projects/:projectId/status",
    title: "Project Status",
    description: "Get the launch status of a project. Only accessible by the project creator.",
    auth: true,
    params: [
      { name: "projectId", type: "path", required: true, description: "Project UUID" },
    ],
    response: `{
  "id": "string",
  "slug": "string",
  "status": "string"
}`,
  },
  {
    method: "GET",
    path: "/api/projects/submit",
    title: "Submission Schema",
    description: "Returns the submission schema, valid categories, chains, and pricing options for reference.",
    auth: true,
    authNote: "Bearer token (API key)",
    params: [],
    response: `{
  "description": "...",
  "endpoints": { ... },
  "categories": [{ "id": "string", "name": "string" }],
  "chains": ["solana", "base", "bnb", "ethereum"],
  "pricingOptions": ["free", "freemium", "paid"],
  "schema": { ... }
}`,
  },
  {
    method: "POST",
    path: "/api/projects/submit",
    title: "Submit Project",
    description: "Submit a new memecoin project. Rate limited to 30 submissions per hour per API key.",
    auth: true,
    authNote: "Bearer token (API key)",
    rateLimit: "30 requests/hour per API key",
    body: `{
  "name": "string (1-100 chars, required)",
  "ticker": "string (1-20 chars, required)",
  "description": "string (1-5000 chars, required)",
  "websiteUrl": "string (valid URL, required)",
  "logoUrl": "string (optional)",
  "productImage": "string (optional)",
  "categories": ["string (max 3)"],
  "techStack": ["string (max 5)"],
  "platforms": ["web | mobile | desktop | api | other"],
  "pricing": "free | freemium | paid",
  "chain": "solana | base | bnb | ethereum",
  "coinType": "existing | upcoming",
  "contractAddress": "string (optional)",
  "githubUrl": "string (optional)",
  "twitterUrl": "string (optional)",
  "telegramUrl": "string (optional)",
  "pumpfunUrl": "string (optional)"
}`,
    response: `{
  "success": true,
  "project": {
    "id": "string (UUID)",
    "slug": "string",
    "url": "string"
  }
}`,
  },
  {
    method: "GET",
    path: "/api/trollbox/:projectId",
    title: "Get Trollbox Messages",
    description: "Retrieve the last 50 messages from a project's trollbox in chronological order.",
    auth: false,
    params: [
      { name: "projectId", type: "path", required: true, description: "Project UUID" },
    ],
    response: `{
  "messages": [
    {
      "id": "string",
      "username": "string",
      "message": "string",
      "timestamp": "ISO 8601"
    }
  ]
}`,
  },
  {
    method: "POST",
    path: "/api/trollbox/:projectId",
    title: "Post Trollbox Message",
    description: "Post a new message to a project's trollbox.",
    auth: true,
    body: `{
  "message": "string (1-500 chars, required)",
  "username": "string (optional, defaults to 'Anon')"
}`,
    response: `{
  "message": {
    "id": "string",
    "username": "string",
    "message": "string",
    "timestamp": "ISO 8601"
  }
}`,
  },
]

const faqItems = [
  {
    question: "What is the base URL?",
    answer:
      "All endpoints are relative to your deployment URL. For example, if your site is at https://memescopemonday.com, the search endpoint would be https://memescopemonday.com/api/search.",
  },
  {
    question: "How does authentication work?",
    answer:
      "Most read endpoints are public. Write endpoints (submitting projects, posting messages) require authentication. Project submission uses a Bearer token (API key) in the Authorization header. Other authenticated endpoints use session cookies from Better Auth.",
  },
  {
    question: "Are there rate limits?",
    answer:
      "Yes. The search endpoint includes X-RateLimit-* response headers. Project submission is limited to 30 requests per hour per API key. If you exceed the limit, you'll receive a 429 response with a reset timer.",
  },
  {
    question: "What chains are supported?",
    answer: "Solana, Base, BNB, and Ethereum.",
  },
  {
    question: "How do I get an API key?",
    answer:
      "API keys are available to authenticated users. Sign in to your account and visit your dashboard settings to generate an API key for project submissions.",
  },
]

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    PATCH: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    DELETE: "bg-red-500/10 text-red-600 dark:text-red-400",
  }
  return (
    <span className={`rounded px-2 py-0.5 text-xs font-bold ${colors[method] ?? "bg-muted text-muted-foreground"}`}>
      {method}
    </span>
  )
}

export default function DevelopersPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-2xl font-bold sm:text-3xl">API Documentation</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-sm">
          Integrate with Memescope Monday. Search coins, fetch trending data, submit projects, and
          build on top of the platform.
        </p>
      </div>

      {/* Quick Info */}
      <div className="bg-background/70 mb-8 rounded-lg border p-5">
        <h2 className="mb-3 text-lg font-semibold">Getting Started</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Base URL:</span>{" "}
            <code className="bg-muted rounded px-1.5 py-0.5 text-xs">
              https://memescopemonday.com/api
            </code>
          </p>
          <p>
            <span className="text-muted-foreground">Format:</span> All responses are JSON.
          </p>
          <p>
            <span className="text-muted-foreground">Authentication:</span> Most read endpoints are
            public. Write endpoints require a session or Bearer token.
          </p>
        </div>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {endpoints.map((ep, i) => (
          <div key={i} className="rounded-lg border">
            {/* Endpoint Header */}
            <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
              <MethodBadge method={ep.method} />
              <code className="text-sm font-medium">{ep.path}</code>
              {ep.auth && (
                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 ml-auto rounded px-2 py-0.5 text-xs font-medium">
                  Auth required
                </span>
              )}
            </div>

            {/* Endpoint Details */}
            <div className="space-y-4 p-4">
              <p className="text-muted-foreground text-sm">{ep.description}</p>

              {ep.authNote && (
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">Auth:</span> {ep.authNote}
                </p>
              )}

              {ep.rateLimit && (
                <p className="text-muted-foreground text-xs">
                  <span className="font-medium">Rate Limit:</span> {ep.rateLimit}
                </p>
              )}

              {/* Parameters */}
              {ep.params && ep.params.length > 0 && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide">Parameters</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-muted-foreground border-b text-left text-xs">
                          <th className="pb-2 pr-4 font-medium">Name</th>
                          <th className="pb-2 pr-4 font-medium">Type</th>
                          <th className="pb-2 pr-4 font-medium">Required</th>
                          <th className="pb-2 font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ep.params.map((p, j) => (
                          <tr key={j} className="border-b last:border-0">
                            <td className="py-2 pr-4">
                              <code className="text-xs">{p.name}</code>
                            </td>
                            <td className="text-muted-foreground py-2 pr-4 text-xs">{p.type}</td>
                            <td className="py-2 pr-4 text-xs">{p.required ? "Yes" : "No"}</td>
                            <td className="text-muted-foreground py-2 text-xs">{p.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Request Body */}
              {ep.body && (
                <div>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide">
                    Request Body
                  </h4>
                  <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                    <code>{ep.body}</code>
                  </pre>
                </div>
              )}

              {/* Response */}
              <div>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide">Response</h4>
                <pre className="bg-muted overflow-x-auto rounded-md p-3 text-xs">
                  <code>{ep.response}</code>
                </pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mx-auto mt-12 max-w-3xl">
        <h2 className="mb-4 text-center text-xl font-bold sm:text-2xl">
          Frequently Asked Questions
        </h2>
        <Accordion type="single" collapsible className="w-full -space-y-px">
          {faqItems.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="bg-background has-focus-visible:border-ring has-focus-visible:ring-ring/50 relative border px-4 py-1 outline-none first:rounded-t-md last:rounded-b-md last:border-b has-focus-visible:z-10 has-focus-visible:ring-[3px]"
            >
              <AccordionTrigger className="py-3 text-left text-[15px] leading-6 hover:no-underline focus-visible:ring-0">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-3 text-sm">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
