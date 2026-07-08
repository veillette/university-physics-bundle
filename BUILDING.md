# Building the HTML site

This repo contains the OpenStax *University Physics* CNXML source (3 volumes,
322 modules) plus an [Eleventy](https://www.11ty.dev/) build that renders it as
a browsable HTML site. **The content files (`collections/`, `modules/`,
`media/`) are never modified** — all transformation happens at build time, so
merges from the openstax upstream stay clean.

## Quick start

```bash
npm ci
npm run update:mathjax   # copy the self-hosted MathJax bundle into assets/
npm run build            # build _site/ + search index
npm run serve            # dev server at http://localhost:4000/university-physics-bundle/
```

Requires Node ≥ 22.

## How it works

- `_data/book.js` → `lib/book-data.js` parses `META-INF/books.xml` → the three
  CollXML collections → all 322 CNXML modules, in two passes:
  1. **Model pass** (`lib/parse/`, `lib/model/`): assigns chapter/section
     numbers and OpenStax-style slugs (`/university-physics-volume-1/1-3-unit-conversion/`),
     runs the chapter-scoped counters (Figure 1.5, Equation 2.10, Example 1.2,
     Check Your Understanding 1.3 — spanning all modules of a chapter), and
     builds a global anchor map for `<link>` resolution.
  2. **Render pass** (`lib/render/`): CNXML → HTML (paras with block-splitting,
     CALS tables, notes/examples/exercises in the markup contract the viewer
     JS expects, MathML passed through for client-side MathJax, glossaries,
     footnotes, learning-objective boxes from `md:abstract`).
- `pages.njk` paginates over the resulting 338 pages (the preface and 7
  appendices are shared by all three volumes, so 322 modules → 338 URLs).
- `summary.njk` emits `/SUMMARY.html`, which the client-side book viewer
  (`assets/js/book-viewer.js`, adapted from the `physics-book2` repo) fetches
  to build the collapsible 3-volume sidebar, prev/next navigation, and SPA
  page swapping.
- Math is presentation MathML rendered client-side by self-hosted **MathJax v4**
  (`mml-chtml`), configured in `assets/js/math-config.js`.
- `scripts/build-index.js` (postbuild) builds the MiniSearch index over
  `_site/`; `scripts/verify-build.js` (`npm run verify`) asserts page counts,
  link/fragment integrity, media existence, numbering sequences, and zero
  CNXML leakage.

## Deployment

The path prefix is `/university-physics-bundle/` by default (GitHub Pages
project site). When the `VERCEL` env var is set, the site builds with no
prefix for root hosting. The built site is ~230 MB, dominated by `media/`.

## Known divergences from openstax.org

- End-of-chapter exercises restart numbering per review section instead of
  numbering continuously across the chapter (the aggregated numbering can't be
  reproduced while review sections stay embedded in their section modules).
- 15 images use remote `https://openstax.org/l/...` URLs and load from the
  network; 15 `<iframe>` interactives point at external simulations.

## Gotchas

- The dev server does **not** hot-reload changes to `lib/` (Node's ESM cache
  keeps transitive imports of `_data/book.js`); restart `npm run serve` after
  editing build code. Content edits under `modules/`/`collections/` rebuild
  fine.
- `assets/js/mathjax/` is git-ignored and populated by `npm run update:mathjax`.
