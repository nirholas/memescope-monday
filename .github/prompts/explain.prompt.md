---
description: "Explain how something works in Memescope Monday. Use when: understanding code flow, architecture, how features work, or learning the codebase."
agent: "agent"
argument-hint: "What do you want to understand?"
---

You are explaining how **Memescope Monday** works — a community-driven memecoin discovery and voting platform.

Refer to the project's copilot-instructions.md for the full project context.

## How to Explain

1. **Find the relevant code** — search the codebase for the feature or concept
2. **Trace the flow** — from UI → component → server action/API → database
3. **Explain clearly** — describe what happens at each layer, with file references
4. **Show key code** — highlight the important parts

## Architecture Overview

```
User → Next.js Page (app/) → React Component (components/)
                               ↓
                    Server Action (app/actions/) or API Route (app/api/)
                               ↓
                    Drizzle ORM Query → PostgreSQL (drizzle/db/schema.ts)
```

## Key Flows

- **Coin submission**: Submit form → server action → create project in DB → Discord notification
- **Upvoting**: Click upvote → server action → toggle upvote record → optimistic UI update
- **Trending**: Cron job enriches coin data → algorithm scores coins → trending page displays top
- **Winners**: Weekly cron → snapshot top-voted coins → winners page
- **Auth**: Better Auth handles sign-in/up → session stored in DB → middleware protects routes
- **Payments**: Stripe checkout → webhook → update project launch type

Search the codebase and explain the requested feature or concept.
