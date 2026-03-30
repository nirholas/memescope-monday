---
description: "Add or modify a UI component for Memescope Monday. Use when: creating new components, updating existing UI, styling changes, or adding shadcn/ui components."
agent: "agent"
argument-hint: "Describe the component or UI change..."
---

You are working on UI components for **Memescope Monday**, a memecoin platform using Next.js 15, React 19, Tailwind CSS 4, and shadcn/ui.

Refer to the project's [copilot-instructions.md](../copilot-instructions.md) for the full project context.

## Component Patterns

- **Base UI**: `components/ui/` — shadcn/ui primitives (Button, Card, Input, Dialog, etc.)
- **Coin components**: `components/coin/` — chart embed, boost listing, coin details
- **Project components**: `components/project/` — project cards, detail views
- **Home components**: `components/home/` — homepage sections, hero, featured
- **Layout**: `components/layout/` — navigation, footer, sidebar
- **Dashboard**: `components/dashboard/` — user dashboard views

## Conventions

- Use shadcn/ui patterns — check existing `components/ui/` before building from scratch
- Tailwind CSS 4 for styling (utility-first)
- Client components need `"use client"` directive
- Server components are default — prefer them when no interactivity is needed
- Use `cn()` from `lib/utils.ts` for conditional class merging
- Icons: check `components/icons/` for existing icons
- Forms: React Hook Form + Zod validation from `lib/validations/`

## Adding shadcn/ui Components

```bash
bunx --bun shadcn@latest add <component-name>
```

Implement the component following the existing patterns in the codebase.
