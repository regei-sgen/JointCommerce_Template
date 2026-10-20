# Concept pages

New page layouts are built as **concept pages**: routes under `/concept/*`, on a `concept/<name>` git branch,
with their own components under `src/concept/`. The existing routes (`/`, `/dispensaries`, `/brands`, …) are
not modified by a concept. A concept is promoted by moving its components into `src/pages` / `src/components`
and pointing the root routes at them, in its own commit.

## concept/weedmaps-shell

| Route | Component | What renders |
| --- | --- | --- |
| `/concept` | `src/concept/HomePage.jsx` | Intro line + live counts, the dispensaries finder (640px), four columns (live menus, brands, deals, strains) |
| `/concept/:cat` | `src/concept/CategoryPage.jsx` | The finder for `dispensaries`, `deals`, `brands`, `products` or `strains`, filling the viewport |

Shared pieces:

- `Shell.jsx` – fixed left sidebar (Home, Dispensaries, Deliveries, Deals, Brands, Products, Strains, Learn), sticky top bar (search tool, location, log in, sign up), bottom tab bar under 900px. Location state lives here and reaches pages through the router outlet context.
- `WhereToBuy.jsx` – one search form: category tabs, text field with grouped typeahead across every category, location button, submit. Submit → `/concept/<cat>?q=…`; a suggestion → that item.
- `Finder.jsx` – list panel + Leaflet map. URL params: `q`, `f` (filter key, repeatable), `sort`, `sel` (selected item slug; the panel then lists the dispensaries that carry it). Hovering a row highlights its pins.
- `search.js` – the index over `listingData.js`: `search(q, cat, {filters, sort})`, `stockedAt(cat, item)`, `itemLink(cat, item)`. Featured slugs sort first.
- `cards.jsx` – photo-free rows per category (`frow`), `ItemBadge`, `itemSubtitle`.
- `concept.css` – all shell/finder styles; loaded only with the concept chunk.

Run `npm run dev` and open `http://127.0.0.1:5173/concept`.
