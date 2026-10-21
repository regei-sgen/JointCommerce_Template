// Category glyphs for the home tiles: Lucide icons (MIT) plus one drawn vape pen that Lucide lacks.
import { Cannabis, Cigarette, Candy, Droplets, LayoutGrid } from 'lucide-react';

const SIZE = { size: 22, strokeWidth: 1.75, absoluteStrokeWidth: true, 'aria-hidden': true };

function VapePen({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6.5 20.5 15.2 5.4a2.6 2.6 0 0 1 4.5 2.6L11 23.1" />
      <path d="M11 23.1a2.6 2.6 0 0 1-4.5-2.6" />
      <path d="M14 7.5l4.5 2.6" />
      <path d="M17.6 3.3l1.9-3.3" />
    </svg>
  );
}

export const CAT_ICONS = {
  Flower: (p) => <Cannabis {...SIZE} {...p} />,
  'Pre-rolls': (p) => <Cigarette {...SIZE} {...p} />,
  Vapes: (p) => <VapePen {...p} />,
  Edibles: (p) => <Candy {...SIZE} {...p} />,
  Concentrates: (p) => <Droplets {...SIZE} {...p} />,
  All: (p) => <LayoutGrid {...SIZE} {...p} />,
};
