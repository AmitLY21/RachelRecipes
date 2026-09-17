# RachelRecipes PWA 🍳

A modern, mobile-first Progressive Web App (PWA) designed for kitchen use — built with React 19, TypeScript, Vite, Tailwind CSS v4, and shadcn/ui. Featuring full Hebrew RTL layout, BiDi isolation, smart ingredient scaling, Instagram Reel/post integration, hands-free cooking mode, and local-first persistence.

Live Site: [https://amitly21.github.io/RachelRecipes/](https://amitly21.github.io/RachelRecipes/)

---

## ✨ Key Features

1. **Hebrew-First Mobile UI (RTL & BiDi Isolation)**
   - Complete Right-to-Left (RTL) experience styled with Google's Rubik typography.
   - Unicode bidirectional isolation (`\u2068...\u2069`) to prevent numbers, fractions, and units from flipping.

2. **Smart Hebrew Ingredient Scaler**
   - Interactive servings stepper & multipliers (0.5×, 1×, 1.5×, 2×, 3×).
   - Natural language Hebrew fraction parsing (`חצי`, `רבע`, `שליש`, `1 וחצי`, `2 1/4`, `½`).
   - First-match scope guarantees oven temperatures (e.g., "180 מעלות") and baking times are never accidentally scaled.
   - Per-ingredient manual override capability.

3. **Hands-Free Cooking Mode**
   - High-contrast, distraction-free fullscreen kitchen view.
   - **Screen Wake Lock API** prevents the display from sleeping during cooking.
   - Interactive scratch-off checklists for ingredients and recipe steps.
   - Built-in multi-preset kitchen timer with Web Audio synthesis sound alert and celebration confetti.

4. **Instagram Split Import**
   - Seamlessly embed Instagram Reels and posts side-by-side with the recipe editor.
   - OpenGraph metadata extractor automatically pulls the real cover image and full caption.
   - Smart Caption Parser detects recipe titles, prep/cook times, categories, ingredients, and instructions with a single click.

5. **Local-First Resilient Data Layer**
   - 100% offline-ready with zero latency.
   - Abstract `RecipeDAO` backed primarily by IndexedDB with seamless LocalStorage fallback.
   - Persistent Storage API integration (`navigator.storage.persist()`) protects recipes against automatic browser cache evictions.
   - 1-Click JSON export and import for hassle-free device migration and backups.

6. **Automated CI/CD & GitHub Pages**
   - Automated GitHub Actions workflow on merge to `main`.
   - Automatic semantic version tagging and GitHub Release creation.
   - Instant deployment to GitHub Pages with relative asset bundling.

---

## 🛠️ Tech Stack

- **Framework:** React 19 + TypeScript
- **Bundler & Tooling:** Vite 8, Node.js 22
- **Styling:** Tailwind CSS v4, OKLCH color palettes, tw-animate-css
- **UI Primitives:** shadcn/ui, Radix UI primitives, Lucide Icons, Sonner toasts
- **Storage:** IndexedDB, Web Storage API, StorageManager API
- **APIs:** Screen Wake Lock API, Web Audio API, Fullscreen API, Web Share API
- **Testing & Quality:** Node.js native test runner, Oxlint

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- npm 10+

### Makefile Commands

A self-documenting `Makefile` is included for common workflows:

```bash
# Display help and all available targets
make help

# Start local development server (http://127.0.0.1:5173)
make dev
# or:
make start

# Install project dependencies
make install

# Run automated unit tests
make test

# Run Oxlint code analysis
make lint

# Compile production bundle
make build

# Preview production build locally
make preview

# Clean build artifacts
make clean
```

You can customize port and host flags:
```bash
make dev PORT=3000 HOST=0.0.0.0
```

---

## 📦 Deployment

Every push to the `main` branch automatically triggers the [.github/workflows/deploy.yml](.github/workflows/deploy.yml) workflow which:
1. Runs the test suite (`npm test`) and linter (`npm run lint`).
2. Builds production assets (`npm run build`).
3. Creates a semantic version tag and GitHub release.
4. Deploys the static PWA to GitHub Pages.

---

## 📄 License

MIT License. Designed with ❤️ for family cooking.
