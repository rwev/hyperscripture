# AGENTS.md

## Project Overview

Hyperscripture is a zen-mode Bible reader SPA. Cross-reference linking, infinite scroll, fuzzy search, multi-translation support, dark mode, bookmarks, notes, text search, parallel translations, and 20+ keyboard shortcuts. Built with React 19 + Vite 8, plain JavaScript (JSX) -- no TypeScript, no external dependencies beyond React.

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
  App.jsx                   # Root: ReaderProvider + ErrorBoundary + global shortcuts
                            #   (theme, font size, help overlay, bookmarks overlay,
                            #   QuickNav, onboarding hint)
  components/
    AppHeader.jsx            # Header bar with nav trigger and search
    Bookmarks.jsx            # Full-screen bookmarks overlay (Shift+B)
    Chapter.jsx              # Renders a single Bible chapter
    CrossRefColumns.jsx      # Desktop cross-ref side columns + chain depth indicator
    CrossRefMobile.jsx       # Mobile cross-ref popover
    ErrorBoundary.jsx        # Class-based React error boundary
    HashRouter.jsx           # Hash-based URL <-> state sync + position persistence + VOTD
    Navigation.jsx           # Full-screen book/chapter navigation overlay
    QuickNav.jsx             # Command-palette fuzzy-find overlay with recent history
    Reader.jsx               # Main reader: infinite scroll, cross-refs, keyboard nav,
                            #   copy/share/bookmark/note/search/wordfreq/parallel/verse-line
    TranslationPicker.jsx    # Translation dropdown selector
    Verse.jsx                # Single verse with bookmark/note indicators
  context/
    ReaderContext.jsx         # Split context: StableContext (actions) + StateContext (state)
  hooks/
    useBibleText.js           # Lazy-load and cache Bible book data
    useBookmarks.js           # localStorage-backed verse bookmarks (Set)
    useCrossRefs.js           # Load and query cross-reference data
    useMediaQuery.js          # CSS media query hook (useSyncExternalStore)
    useNotes.js               # localStorage-backed verse notes (Map)
    useParallelText.js        # Load alternate-translation verses for parallel view
    useRefTexts.js            # Batch-load verse texts for cross-ref display
    useTextSearch.js          # CSS Highlight API text search with match cycling
    useWordFreq.js            # CSS Highlight API word frequency highlighting
  utils/
    bible.js                  # Book metadata, verse ID parsing, reference formatting
    crossref.js               # Cross-reference partitioning (prior/later)
    fuzzyBook.js              # Fuzzy book name matching + alias table
    recent.js                 # Recently visited passages (localStorage)
    scroll.js                 # scrollToVerse utility with retry/highlight/cancellation
    userdata.js               # Export/import all localStorage data as JSON backup
    votd.js                   # Verse-of-the-day: curated list, day-of-year selection
    wordfreq.js               # Word frequency analysis + CSS Highlight API integration
  styles/
    app.css                   # Layout, components, responsive, print, dark mode overrides
    reset.css                 # CSS reset
    typography.css            # CSS variables, colors, fonts, spacing, dark palette
public/data/                  # Static JSON: Bible text + cross-references
scripts/                      # Data download/processing scripts
```

- Flat directories, no nesting within `components/`, `hooks/`, `utils/`, `context/`
- No barrel exports (no `index.js` files) -- import specific files by name
- One primary concern per file
- `utils/` contains pure functions with no React dependency
- `hooks/` encapsulate data fetching (module-level singleton caches) and feature state (localStorage-backed persistence)

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

### Keyboard Shortcuts

All keyboard shortcuts are handled in two locations:
- **App.jsx**: Global shortcuts (`/`, `?`, `B`, `d`, `+`/`-`/`0`)
- **Reader.jsx**: Reader-scoped shortcuts (`c`, `s`, `m`, `n`, `f`, `w`, `l`, `p`, `b`, arrows)

Both skip handling when focus is in `INPUT`/`SELECT`/`TEXTAREA` elements.

| Key       | Action                          | Requires selection |
|-----------|---------------------------------|-------------------|
| `/`       | Open QuickNav                   | No                |
| `?`       | Toggle keyboard help overlay    | No                |
| `B`       | Open bookmarks overlay          | No                |
| `E`       | Export data backup (JSON)       | No                |
| `d`       | Toggle dark/light mode          | No                |
| `+` / `-` | Increase/decrease font size     | No                |
| `0`       | Reset font size                 | No                |
| `←` / `→` | Previous/next chapter           | No                |
| `f`       | Open text search                | No                |
| `w`       | Toggle word frequency highlight | No                |
| `l`       | Toggle verse-per-line/prose     | No                |
| `p`       | Toggle parallel translation     | No                |
| `b`       | Go back in cross-ref trail      | No                |
| `c`       | Copy verse text                 | Yes               |
| `s`       | Copy share link                 | Yes               |
| `m`       | Toggle bookmark                 | Yes               |
| `n`       | Open note editor                | Yes               |
| `Esc`     | Close any overlay/editor        | No                |

### localStorage Keys

All persistence uses the `hyperscripture:` prefix:

| Key                        | Type       | Purpose                        |
|----------------------------|------------|--------------------------------|
| `hyperscripture:position`  | JSON       | Last-read book + chapter       |
| `hyperscripture:theme`     | string     | `"dark"` or `"light"`          |
| `hyperscripture:font-size` | number     | Font size step index (0-6)     |
| `hyperscripture:bookmarks` | JSON array | Bookmarked verse IDs           |
| `hyperscripture:notes`     | JSON object| Verse ID → note text           |
| `hyperscripture:recent`    | JSON array | Recently visited passages      |
| `hyperscripture:hint-seen` | string     | Onboarding hint dismissed flag |

### Data & Caching

- Bible text and cross-references are static JSON files in `public/data/`
- Hooks use module-scope `Map` singletons (`cache`, `inflight`) outside the hook function for cross-render persistence
- In-flight deduplication: shared promises in `inflight` map prevent duplicate fetches
- Failed fetches are NOT cached, allowing retry on subsequent attempts
- User preferences (theme, font size, position) stored in localStorage with silent fallback on quota/unavailable
- CSS Custom Highlight API (`CSS.highlights`) used for text search and word frequency -- zero DOM mutation, with feature detection and graceful degradation via toast

### Formatting

- No Prettier or formatter configured
- 2-space indentation (observed convention)
- Single quotes for strings
- Semicolons used
- Trailing commas in multi-line arrays/objects
