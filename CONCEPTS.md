# Concept pages

> 2026-10-21: `concept/weedmaps-shell` was promoted. The shell now serves the root routes (`/`, `/:cat`, `/dispensaries/:slug`, `/learn`); `/concept/*` and `/blog` redirect. The table below reads with the `/concept` prefix removed.

New page layouts are built as **concept pages**: routes under `/concept/*`, on a `concept/<name>` git branch,
with their own components under `src/concept/`. The existing routes (`/`, `/dispensaries`, `/brands`, …) are
not modified by a concept. A concept is promoted by moving its components into `src/pages` / `src/components`
and pointing the root routes at them, in its own commit.

## concept/weedmaps-shell

| Route | Component | What renders |
| --- | --- | --- |
| `/concept` | `src/concept/HomePage.jsx` | Two promo tiles (deals, featured dispensary), category tiles, featured-brand squares, then scroll rows: dispensaries near the place, deals today, strains. No map on home |
| `/concept/:cat` | `src/concept/CategoryPage.jsx` | The finder for `dispensaries`, `deals`, `brands`, `products` or `strains`, filling the viewport |
| `/concept/:cat/in/united-states/:state/:city?` | `src/concept/CategoryPage.jsx` | The same finder at a named place, e.g. `/concept/dispensaries/in/united-states/nevada/las-vegas`. The path sets the shell's place; sidebar links, tab switches and the location popup keep the path. Unknown state or city redirects to `/concept/:cat`. Device geolocation has no slug and uses the plain path |
| `/concept/dispensaries/:slug` | `src/concept/DispensaryConceptPage.jsx` | One store inside the shell: header, today's deals, menu with category/type filters and sort, strains and brands on the menu, map, hours, services, contact |
| `/concept/learn` | `src/concept/LearnPage.jsx` | Articles as text rows |

Shared pieces:

- `Shell.jsx` – fixed left sidebar (Home, Dispensaries, Deliveries, Deals, Brands, Products, Strains, Learn), sticky top bar (search tool, location, log in, sign up), bottom tab bar under 900px. Location state lives here and reaches pages through the router outlet context.
- `WhereToBuy.jsx` – one search form: category tabs, text field with grouped typeahead across every category, location button, submit. Submit → `/concept/<cat>?q=…`; a suggestion → that item.
- `Finder.jsx` – list panel + Leaflet map. URL params: `q`, `f` (filter key, repeatable), `sort`, `sel` (selected item slug; the panel then lists the dispensaries that carry it). Hovering a row highlights its pins.
- `search.js` – the index over `listingData.js`: `search(q, cat, {filters, sort, origin})`, `stockedAt(cat, item, origin)`, `menuFor(slug)`, `itemLink(cat, item)`. Featured slugs sort first. `origin` ({lat,lng}) recomputes every dispensary's `miles`.
- `geo.js` – known places for the location field (`resolvePlace`), great-circle `milesBetween`, `DEFAULT_PLACE`. The location modal also hands over device geolocation coordinates.
- `cards.jsx` – photo-free rows per category (`frow`), `ItemBadge`, `itemSubtitle`.
- `concept.css` – all shell/finder styles; loaded only with the concept chunk.

Run `npm run dev` and open `http://127.0.0.1:5173/concept`.
