// Line glyphs for the product-category tiles. Same stroke style as src/icons.jsx.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true' };
const G = ({ children, className = 'cat-glyph' }) => <svg className={className} {...base}>{children}</svg>;

export const CAT_ICONS = {
  Flower: (p) => (
    <G {...p}>
      <path d="M12 21v-6" />
      <path d="M12 15c-3.5 0-6-2.2-6-5.5 0-1.6.6-2.9 1.6-3.8C8.4 3.9 10 3 12 3s3.6.9 4.4 2.7c1 .9 1.6 2.2 1.6 3.8 0 3.3-2.5 5.5-6 5.5z" />
      <path d="M9.5 9.5c.8.6 1.6.9 2.5.9s1.7-.3 2.5-.9" />
    </G>
  ),
  'Pre-rolls': (p) => (
    <G {...p}>
      <path d="M4 18.5 16.5 6a2.1 2.1 0 0 1 3 3L7 21.5a2.1 2.1 0 0 1-3-3z" />
      <path d="M14.5 8l2.5 2.5" />
      <path d="M18.5 4.5l1-1.5" />
    </G>
  ),
  Vapes: (p) => (
    <G {...p}>
      <rect x="9.5" y="3" width="5" height="18" rx="2.5" />
      <path d="M12 3V1.5" />
      <path d="M9.5 14h5" />
    </G>
  ),
  Edibles: (p) => (
    <G {...p}>
      <path d="M12 3a8 8 0 0 0-8 8c0 3.4 2.1 6.3 5.2 7.5l.8 2.5h4l.8-2.5A8 8 0 0 0 12 3z" />
      <circle cx="9.5" cy="10" r=".8" fill="currentColor" />
      <circle cx="14.5" cy="10" r=".8" fill="currentColor" />
      <path d="M9.5 14c1.5 1 3.5 1 5 0" />
    </G>
  ),
  Concentrates: (p) => (
    <G {...p}>
      <path d="M12 3s6 6.3 6 10.5a6 6 0 0 1-12 0C6 9.3 12 3 12 3z" />
      <path d="M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5" />
    </G>
  ),
  All: (p) => (
    <G {...p}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
    </G>
  ),
};
