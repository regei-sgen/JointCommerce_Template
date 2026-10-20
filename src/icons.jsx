const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

function Icon({ className = 'ic', children, ...rest }) {
  return (
    <svg className={className} {...base} {...rest}>
      {children}
    </svg>
  );
}

export const Pin = (p) => (
  <Icon {...p}>
    <path d="M12 22s7-7.5 7-13a7 7 0 0 0-14 0c0 5.5 7 13 7 13z" />
    <circle cx="12" cy="9" r="2.5" />
  </Icon>
);
export const Clock = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);
export const Search = (p) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </Icon>
);
export const User = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </Icon>
);
export const Store = (p) => (
  <Icon {...p}>
    <path d="M3 9l1.5-5h15L21 9" />
    <path d="M3 9h18v3a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
    <path d="M5 14v7h14v-7" />
  </Icon>
);
export const Info = (p) => (
  <Icon {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Icon>
);
export const Map = (p) => (
  <Icon {...p}>
    <path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" />
    <path d="M9 4v14M15 6v14" />
  </Icon>
);
export const Star = (p) => (
  <Icon {...p}>
    <path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />
  </Icon>
);
export const Tag = (p) => (
  <Icon {...p}>
    <path d="M3 12l9-9h9v9l-9 9z" />
    <circle cx="16" cy="8" r="1.5" />
  </Icon>
);
export const Sparkle = (p) => (
  <Icon {...p}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6" />
  </Icon>
);
export const Flag = (p) => (
  <Icon {...p}>
    <path d="M5 21V4h11l-1.5 4L16 12H5" />
  </Icon>
);
export const Book = (p) => (
  <Icon {...p}>
    <path d="M4 4h7a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4z" />
    <path d="M20 4h-7a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h8z" />
  </Icon>
);
export const Megaphone = (p) => (
  <Icon {...p}>
    <path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z" />
    <path d="M16 9a4 4 0 0 1 0 6" />
  </Icon>
);
export const Phone = (p) => (
  <Icon {...p}>
    <rect x="7" y="2" width="10" height="20" rx="2" />
    <path d="M11 18h2" />
  </Icon>
);
export const Download = (p) => (
  <Icon {...p}>
    <path d="M12 3v12" />
    <path d="M7 10l5 5 5-5" />
    <path d="M4 19h16" />
  </Icon>
);
export const ChevronRight = (p) => (
  <Icon strokeWidth={2.5} {...p}>
    <path d="M9 6l6 6-6 6" />
  </Icon>
);
export const ChevronLeft = (p) => (
  <Icon strokeWidth={2.5} {...p}>
    <path d="M15 6l-6 6 6 6" />
  </Icon>
);
export const Menu = (p) => (
  <Icon {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
);
export const Close = (p) => (
  <Icon {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Icon>
);

export function Leaf({ className = 'ic', fill = 'currentColor' }) {
  const leaflet = (w, l) => `M0 0Q${w} ${-l * 0.4} 0 ${-l}Q${-w} ${-l * 0.4} 0 0Z`;
  return (
    <svg className={className} viewBox="-24 -25 48 48" fill={fill} aria-hidden="true">
      <g>
        <path d={leaflet(1.6, 12)} transform="rotate(-75)" />
        <path d={leaflet(2, 16)} transform="rotate(-50)" />
        <path d={leaflet(2.4, 20)} transform="rotate(-25)" />
        <path d={leaflet(2.6, 22)} />
        <path d={leaflet(2.4, 20)} transform="rotate(25)" />
        <path d={leaflet(2, 16)} transform="rotate(50)" />
        <path d={leaflet(1.6, 12)} transform="rotate(75)" />
        <path d="M-.7 0h1.4v9h-1.4z" />
      </g>
    </svg>
  );
}

export const Globe = (p) => (
  <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></Icon>
);
export const Check = (p) => (
  <Icon {...p}><path d="M20 6 9 17l-5-5" /></Icon>
);
export const ShieldCheck = (p) => (
  <Icon {...p}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Icon>
);
export const Bookmark = (p) => (
  <Icon {...p}><path d="M6 4h12v17l-6-4-6 4V4Z" /></Icon>
);
export const Share = (p) => (
  <Icon {...p}><circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" /><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6" /></Icon>
);
export const ChevronDown = (p) => (
  <Icon {...p}><path d="m6 9 6 6 6-6" /></Icon>
);
export const Navigate = (p) => (
  <Icon {...p}><path d="m3 11 18-8-8 18-2-8-8-2Z" /></Icon>
);
export const CreditCard = (p) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 10h18M7 15h3" /></Icon>
);
export const Banknote = (p) => (
  <Icon {...p}><rect x="3" y="6" width="18" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></Icon>
);
export const Home = (p) => (
  <Icon {...p}><path d="m3 11 9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9Z" /></Icon>
);

export const Truck = (p) => (
  <Icon {...p}><path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Icon>
);

export const Trophy = (p) => (
  <Icon {...p}><path d="M8 4h8v5a4 4 0 0 1-8 0V4ZM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 21h8M9 17h6" /></Icon>
);

export const Grid = (p) => (
  <Icon {...p}><rect x="4" y="4" width="6" height="6" rx="1.5" /><rect x="14" y="4" width="6" height="6" rx="1.5" /><rect x="4" y="14" width="6" height="6" rx="1.5" /><rect x="14" y="14" width="6" height="6" rx="1.5" /></Icon>
);

export const Scale = (p) => (
  <Icon {...p}><path d="M12 4v16M5 20h14M12 6l6 2M12 6 6 8M3 14l3-6 3 6a3 3 0 0 1-6 0ZM15 14l3-6 3 6a3 3 0 0 1-6 0Z" /></Icon>
);

export const Mail = (p) => (
  <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Icon>
);

export const FileText = (p) => (
  <Icon {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Icon>
);
