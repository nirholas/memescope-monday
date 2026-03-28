#!/bin/bash
set -e

# Prettify GitHub file browser with unique emoji commit messages
# Each root-level file/folder gets its own commit message visible on GitHub

cd /workspaces/memescope-monday

git config user.name "nirholas"
git config user.email "nirholas@users.noreply.github.com"

# Step 1: Squash all history into one commit
echo "📦 Squashing all history..."
git checkout --orphan temp_branch
git add -A
git commit -m "🎉 Initial commit"
git branch -D main
git branch -m main

# Step 2: Now touch each root-level item and commit with a unique pretty message
# Each commit modifies only that file/folder so GitHub shows the message next to it

prettify() {
    local path="$1"
    local msg="$2"
    
    if [ -d "$path" ]; then
        # For directories, find a file to touch
        local target
        target=$(find "$path" -type f -not -path '*/.git/*' | head -1)
        if [ -n "$target" ]; then
            echo "" >> "$target"
            git add "$path"
            git commit -m "$msg" --allow-empty || git commit -m "$msg"
        fi
    elif [ -f "$path" ]; then
        echo "" >> "$path"
        git add "$path"
        git commit -m "$msg"
    fi
    echo "  ✅ $msg"
}

echo ""
echo "🎨 Creating pretty commits..."
echo ""

# Folders
prettify "app"              "⚡ app — Next.js application core"
prettify "components"       "🧩 components — UI component library"
prettify "lib"              "🔧 lib — Utilities, auth & helpers"
prettify "hooks"            "🪝 hooks — Custom React hooks"
prettify "drizzle"          "🗃️ drizzle — Database schema & migrations"
prettify "content"          "📝 content — Blog posts & MDX content"
prettify "public"           "🖼️ public — Static assets & images"
prettify "scripts"          "📜 scripts — Build & seed scripts"
prettify "docs"             "📚 docs — Documentation"
prettify ".github"          "🐙 .github — GitHub config & funding"

# Config files
prettify "next.config.ts"       "⚙️ next.config.ts — Next.js configuration"
prettify "drizzle.config.ts"    "🔩 drizzle.config.ts — Drizzle ORM config"
prettify "package.json"         "📦 package.json — Dependencies & scripts"
prettify "tsconfig.json"        "🏷️ tsconfig.json — TypeScript configuration"
prettify "eslint.config.mjs"    "🔍 eslint.config.mjs — Linting rules"
prettify "postcss.config.mjs"   "🎨 postcss.config.mjs — PostCSS & Tailwind"
prettify "components.json"      "🧱 components.json — shadcn/ui config"
prettify "middleware.ts"        "🛡️ middleware.ts — Auth & route middleware"
prettify "mdx-components.tsx"   "✍️ mdx-components.tsx — MDX component map"
prettify "bun.lockb"            "🔒 bun.lockb — Dependency lockfile"

# Docs & meta
prettify "README.md"            "📖 README.md — Project documentation"
prettify "CHANGELOG.md"         "📋 CHANGELOG.md — Release history"
prettify "CONTRIBUTING.md"      "🤝 CONTRIBUTING.md — Contribution guide"
prettify "CODE_OF_CONDUCT.md"   "💜 CODE_OF_CONDUCT.md — Community standards"

# Dotfiles
prettify ".gitignore"           "🙈 .gitignore — Ignored files config"
prettify ".env.example"         "🔐 .env.example — Environment variables template"

echo ""
echo "🚀 Force pushing to origin..."
git push -f origin main

echo ""
echo "✨ Done! Your GitHub repo now has pretty commit messages!"
echo "   Visit: https://github.com/nirholas/memescope-monday"
