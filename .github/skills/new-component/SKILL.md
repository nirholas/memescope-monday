---
name: new-component
description: "Scaffold React components using shadcn/ui and project patterns. Use when: creating new UI components, feature components, client components with interactivity, or server components for data display. Covers props, imports, Tailwind styling, and optimistic updates."
argument-hint: "Describe the component (e.g., 'bookmark button for project cards')"
---

# New Component

Create React components following Memescope Monday conventions.

## When to Use

- Building a new feature component (coin display, voting UI, dashboard widget)
- Creating an interactive client component with state
- Adding a server component for data display
- Composing shadcn/ui primitives into domain-specific components

## Procedure

1. Decide placement: `components/{domain}/` where domain matches the feature area
2. Determine if it's a client component (`"use client"`) or server component (default)
3. Use shadcn/ui base components from `components/ui/` where applicable
4. Define a typed props interface
5. Use Tailwind CSS 4 for styling with `cn()` utility for conditional classes

## Client Component Template (Interactive)

```tsx
"use client"

import React, { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { myAction } from "@/app/actions/my-action"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface MyComponentProps {
  projectId: string
  isAuthenticated: boolean
  className?: string
}

export function MyComponent({ projectId, isAuthenticated, className }: MyComponentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!isAuthenticated) {
      router.push("/sign-in")
      return
    }

    startTransition(async () => {
      const result = await myAction(projectId)
      if (result?.error) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button
      onClick={handleClick}
      disabled={isPending}
      variant="outline"
      className={cn("gap-2", className)}
    >
      Click me
    </Button>
  )
}
```

## Server Component Template (Data Display)

```tsx
import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { desc } from "drizzle-orm"

export async function ProjectList() {
  const projects = await db
    .select()
    .from(project)
    .orderBy(desc(project.createdAt))
    .limit(10)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <div key={p.id} className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-foreground font-bold">{p.name}</h3>
          <p className="text-muted-foreground text-sm">{p.description}</p>
        </div>
      ))}
    </div>
  )
}
```

## Optimistic Update Pattern

```tsx
import { useOptimistic, useTransition } from "react"

const [optimistic, updateOptimistic] = useOptimistic(
  { active: initialState, count: initialCount },
  (state, newActive: boolean) => ({
    active: newActive,
    count: state.count + (newActive ? 1 : -1),
  }),
)

// In handler:
updateOptimistic(!optimistic.active)
startTransition(async () => {
  await serverAction(id)
})
```

## Rules

- **File placement**: `components/{domain}/my-component.tsx` — domain = coin, project, home, dashboard, etc.
- **Don't modify** `components/ui/` — those are shadcn/ui base components
- **Import alias**: always use `@/` for imports
- **Icons**: use `@remixicon/react` (e.g., `RiThumbUpFill`, `RiThumbUpLine`)
- **Conditional classes**: use `cn()` from `@/lib/utils`, not string concatenation
- **Styling**: Tailwind CSS 4 classes, use semantic colors (`text-foreground`, `bg-muted`, `text-muted-foreground`)
- **Auth redirects**: check `isAuthenticated` prop, redirect to `/sign-in` if needed
- **Toast notifications**: use `toast` from `sonner` for success/error feedback
- **Props**: always define a TypeScript interface, include optional `className?: string`
- **Named exports**: use `export function MyComponent` not default exports
