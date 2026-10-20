import { US_VIEWBOX, usStates } from '../usMap.js';

// Interactive US map. `active` is the set of state names with listings; `hover` highlights one.
export default function UsMap({ active, hover, onHover, onSelect }) {
  return (
    <svg className="usmap-svg" viewBox={US_VIEWBOX} role="img" aria-label="Map of the United States">
      {usStates.map((s) => {
        const on = active.has(s.name);
        const cls = `usmap-state${on ? ' on' : ''}${hover === s.name ? ' hot' : ''}`;
        return (
          <path
            key={s.id}
            d={s.d}
            className={cls}
            onMouseEnter={on ? () => onHover(s.name) : undefined}
            onMouseLeave={on ? () => onHover(null) : undefined}
            onClick={on ? () => onSelect(s.name) : undefined}
          >
            <title>{s.name}</title>
          </path>
        );
      })}
    </svg>
  );
}
