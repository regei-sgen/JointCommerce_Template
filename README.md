# JointCommerce site (React + Vite)

Left-sidebar shell with one search tool across dispensaries, deals, brands, products and strains; a list-plus-map finder for every category; location paths like `/dispensaries/in/united-states/nevada/las-vegas`; a dispensary page with a filterable menu. No photography. All data is sample data in `src/data.js`, `src/listingData.js` and `src/concept/search.js`.

Preview: https://regei-sgen.github.io/JointCommerce_Template/

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Deploy

`npm run deploy` builds with `GH_PAGES=1` (sets the `/JointCommerce_Template/` base path), copies `index.html` to `404.html` so client-side routes resolve on direct load, and force-pushes `dist/` to the `gh-pages` branch, which GitHub Pages serves.

## Concept pages

New layouts are built as concept routes on `concept/<name>` branches and promoted when approved. See `CONCEPTS.md`.

## Structure

- `src/App.jsx` – routes: `/`, `/:cat`, `/:cat/in/united-states/:state/:city?`, `/dispensaries/:slug`, `/learn`
- `src/concept/` – the shell and its pages (Shell, HomePage, CategoryPage, Finder, DispensaryConceptPage, LearnPage, WhereToBuy, cards, search, geo, concept.css)
- `src/components/` – LeafletMap, Modal, AuthModals, ui, Wordmark are used by the shell; the earlier template's Hero, Sections, DarkBand, Strips, Footer, Rail and `src/pages/*` remain on disk but are no longer routed
- `src/data.js` – all sample content; `src/images.js` – card photo URLs
- `scripts/` – generators for `src/stateShapes.js` and `src/usMap.js` from US Census boundaries (`us-atlas`)
- `src/styles.css` – tokens, components, breakpoints (1100 / 900 / 640 / 420)
