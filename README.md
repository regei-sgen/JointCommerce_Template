# JointCommerce homepage template (React + Vite)

Glass-style homepage and dispensary detail page: map-backed hero with a live carousel, photo cards and posters, dark live-menu band with parallax, bento "why" section, interactive US map, Leaflet maps, dispensary page with tabs, and header modals (set location, log in, sign up). All data is sample data in `src/data.js`.

Preview: https://regei-sgen.github.io/JointCommerce_Template/

## Run

```bash
npm install
npm run dev      # http://127.0.0.1:5173
npm run build    # production build in dist/
npm run preview  # serve the build
```

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds with `GH_PAGES=1` (sets the `/JointCommerce_Template/` base path) and publishes `dist/` to GitHub Pages. `404.html` is a copy of `index.html` so client-side routes resolve on direct load.

## Structure

- `src/App.jsx` – routes (`/`, `/dispensaries/:slug`) and page composition
- `src/components/` – Hero, HeroCarousel, Navbar (dropdowns + modals), Rail (auto carousel), Sections, DarkBand, Strips (trust, bento, newsletter), Footer, LeafletMap, UsMap, Modal, AuthModals, ui
- `src/pages/DispensaryPage.jsx` – dispensary detail page
- `src/data.js` – all sample content; `src/images.js` – card photo URLs
- `scripts/` – generators for `src/stateShapes.js` and `src/usMap.js` from US Census boundaries (`us-atlas`)
- `src/styles.css` – tokens, components, breakpoints (1100 / 900 / 640 / 420)
