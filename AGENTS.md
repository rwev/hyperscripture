# AGENTS.md

## Project Overview

Hyperscripture is a Bible reader SPA with cross-reference linking, infinite scroll, fuzzy search, and multi-translation support. Built with React 19 + Vite 8, plain JavaScript (JSX) -- no TypeScript.

## Build & Run Commands

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build (output: dist/)
npm run preview      # Preview production build locally
npm run data         # Download/process KJV + cross-ref data (Node.js)
npm run data:bg      # Download AMP/NIV/ESV via BibleGateway (Python3)
npm run setup        # Full pipeline: data + data:bg + build
```

### Linting

```bash
npx eslint .         # Lint all JS/JSX files
npx eslint src/      # Lint only source files
npx eslint src/components/Reader.jsx   # Lint a single file
```

ESLint 9 flat config (`eslint.config.js`): `@eslint/js` recommended + `react-hooks` + `react-refresh` plugins. `no-unused-vars` ignores names starting with uppercase or underscore.

### Testing

No test framework is configured. No test files exist.

### CI

GitHub Actions (`.github/workflows/deploy.yml`): `npm ci && npx vite build`, then deploys `dist/` to GitHub Pages. No lint or test steps in CI.

## Project Structure

```
src/
  main.jsx                  # Entry point, CSS imports
  App.jsx                   # Root component, wraps ReaderProvider + ErrorBoundary
  components/
    AppHeader.jsx            # Header bar with nav trigger and search
    Chapter.jsx              # Renders a single Bible chapter
    CrossRefColumns.jsx      # Desktop cross-ref side columns + useCrossRefColumns hook
    CrossRefMobile.jsx       # Mobile cross-ref popover
    ErrorBoundary.jsx        # Class-based React error boundary
    HashRouter.jsx           # Hash-based URL <-> state synchronization
    Navigation.jsx           # Full-screen book/chapter navigation overlay
    QuickNav.jsx             # Command-palette fuzzy-find overlay
    Reader.jsx               # Main reader with infinite scroll + cross-refs
    TranslationPicker.jsx    # Translation dropdown selector
    Verse.jsx                # Single verse component
  context/
    ReaderContext.jsx         # Split context: StableContext (actions) + StateContext (state)
  hooks/
    useBibleText.js           # Lazy-load and cache Bible book data
    useCrossRefs.js           # Load and query cross-reference data
    useMediaQuery.js          # CSS media query hook (useSyncExternalStore)
    useRefTexts.js            # Batch-load verse texts for cross-ref display
  utils/
    bible.js                  # Book metadata, verse ID parsing, reference formatting
    crossref.js               # Cross-reference partitioning (prior/later)
    fuzzyBook.js              # Fuzzy book name matching + alias table
    scroll.js                 # scrollToVerse utility with retry/highlight/cancellation
  styles/
    app.css                   # Layout, components, responsive, error boundary styles
    reset.css                 # CSS reset
    typography.css            # CSS variables, colors, fonts, spacing
public/data/                  # Static JSON: Bible text + cross-references
scripts/                      # Data download/processing scripts
```

- Flat directories, no nesting within `components/`, `hooks/`, `utils/`, `context/`
- No barrel exports (no `index.js` files) -- import specific files by name
- One primary concern per file
- `utils/` contains pure functions with no React dependency
- `hooks/` encapsulate data fetching with module-level singleton caches

## Code Style

### Language & Module System

- Plain JavaScript with JSX -- no TypeScript
- ESM throughout (`"type": "module"` in package.json)
- `.jsx` extension for files containing JSX, `.js` for pure logic

### Imports

- **Relative paths only** -- no path aliases (`@/`), no absolute imports
- **Order**: React/library imports, then context, hooks, utils, sibling components
- **No blank lines** between import groups
- **Destructured imports** for React, hooks, and utilities; **default imports** for components
- **Single quotes** for all strings

```js
import { useState, useEffect, useRef } from 'react';
import { useReader } from '../context/ReaderContext';
import { useBibleText } from '../hooks/useBibleText';
import { getBookByAbbr, makeVerseId } from '../utils/bible';
import Chapter from './Chapter';
```

### Naming Conventions

| Element               | Convention        | Example                              |
|-----------------------|-------------------|--------------------------------------|
| Component files       | PascalCase `.jsx` | `Reader.jsx`, `CrossRefMobile.jsx`   |
| Hook files            | camelCase `.js`   | `useBibleText.js`, `useMediaQuery.js`|
| Utility files         | camelCase `.js`   | `bible.js`, `fuzzyBook.js`           |
| Components            | PascalCase        | `function Navigation()`              |
| Functions/hooks       | camelCase         | `parseVerseId()`, `useReader()`      |
| Variables/state       | camelCase         | `selectedVerse`, `quickNavOpen`      |
| Module-level constants| UPPER_SNAKE_CASE  | `ALIASES`, `EMPTY_REFS`              |
| Reducer action types  | UPPER_SNAKE_CASE  | `'META_LOADED'`, `'NAVIGATE'`        |
| Private module state  | underscore prefix | `_meta`, `_booksByAbbr`              |
| CSS classes           | kebab-case        | `"reader-scroll"`, `"nav-book-list"` |
| Props                 | camelCase         | `onSelectVerse`, `showBookHeading`   |

### Functions & Components

- **Components**: `function` declarations (not arrow functions)
  ```js
  export default function Navigation() { ... }
  ```
- **Memoized components**: `const` + named function expression inside `memo()`
  ```js
  const Verse = memo(function Verse({ bookAbbr, chapter, verse }) { ... });
  export default Verse;
  ```
- **Arrow functions**: used exclusively for callbacks, event handlers, `.map()`/`.filter()`, and promise chains
- **Render helpers**: defined inside the component as arrow functions

### Exports

- **Components**: `export default` (one component per file)
- **Hooks and utilities**: named `export` only (no default)
- **Context**: named exports for provider and hooks (`ReaderProvider`, `useReader`, `useReaderActions`, `useReaderState`)
- No file mixes `export default` with named function exports

### Async Patterns

- Inner async IIFE inside `useEffect`:
  ```js
  useEffect(() => {
    let cancelled = false;
    const init = async () => { ... };
    init();
    return () => { cancelled = true; };
  }, [deps]);
  ```
- `.then()/.catch()` chains for fetch-and-cache patterns in hooks
- Stale-closure prevention via `cancelled` flag in effect cleanup

### Error Handling

- **`ErrorBoundary`** class component wraps the app tree for render-error recovery
- **Guard-clause early returns** for invalid input (`return null` instead of throwing)
- **`.catch()` with re-throw** for data fetch hooks (allows retry on next attempt)
- **Bare `catch {}`** for non-critical operations (e.g., cross-ref load in Reader)
- **`console.warn`** for non-critical failures; **`console.error`** for critical failures
- Reducer error state (`META_ERROR`) is displayed in the UI via `AppInner`
- No custom error classes; errors stored as plain strings (`err.message`) in state

### Comments

- **JSDoc `/** */`** on all exported functions and components (summary + `@param` tags)
- **Section dividers** in larger files: `// ── Section Title ───────────────`
- **Brief inline `//` comments** for non-obvious intent
- No TODO/FIXME/HACK comments

### State Management

- **Split context** in `ReaderContext.jsx`: `StableContext` (actions, never changes) and `StateContext` (volatile state)
- `useReader()` returns merged state + actions (re-renders on state change)
- `useReaderActions()` returns only actions (never re-renders on state change)
- `useReaderState()` returns only state
- Action types are UPPER_SNAKE_CASE strings (`'NAVIGATE'`, `'SET_CHAPTER'`, etc.)

### Data & Caching

- Bible text and cross-references are static JSON files in `public/data/`
- Hooks use module-scope `Map` singletons (`cache`, `inflight`) outside the hook function for cross-render persistence
- In-flight deduplication: shared promises in `inflight` map prevent duplicate fetches
- Failed fetches are NOT cached, allowing retry on subsequent attempts

### Formatting

- No Prettier or formatter configured
- 2-space indentation (observed convention)
- Single quotes for strings
- Semicolons used
- Trailing commas in multi-line arrays/objects
