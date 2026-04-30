## Prevent "missing package" outages

### What went wrong last time

A previous change added `import` statements for `@dnd-kit/core`, `@dnd-kit/sortable`, and `@dnd-kit/utilities`, but those packages were never added to `package.json`. The TypeScript build failed, the JS bundle broke, and the live site started throwing "Failed to fetch" on every page — which looked like a redirect/database problem but was actually a build problem.

### The fix: a build-health smoke test

Add a tiny Vitest test suite that runs as part of the project's automatic checks. It does two things:

1. **Import-resolution test** — Walks every `.ts`/`.tsx` file under `src/`, extracts every bare-package import (e.g. `@dnd-kit/core`, `framer-motion`), and asserts each one is listed in `package.json`'s `dependencies` or `devDependencies`. If someone adds an import for an uninstalled package, this test fails immediately with a clear message like `"@dnd-kit/core" is imported in src/pages/Admin.tsx but is not in package.json`.

2. **App-mount smoke test** — Renders `<App />` inside the testing-library `jsdom` environment with mocked router and Supabase client, and asserts it mounts without throwing. This catches the second class of failure — code that compiles but blows up at runtime on first render.

### Files to add

- `vitest.config.ts` — standard Vitest + React + jsdom setup (only if not already present)
- `src/test/setup.ts` — `@testing-library/jest-dom` + `matchMedia` polyfill
- `src/test/imports.test.ts` — the import-resolution guardrail
- `src/test/app-mount.test.tsx` — the smoke test

### Dev dependencies to add

`vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` (only the ones not already installed).

### How this protects you

These tests run automatically on every change. If a future edit imports a package that isn't installed — or breaks the app's initial render — the check fails before the change is shipped, and you'll see the real error ("missing package X") instead of a mysterious "Failed to fetch" on the live site.

### Out of scope

- No changes to quiz logic, admin panel, or database.
- No changes to the existing `src/lib/liftScoring.test.ts`.
