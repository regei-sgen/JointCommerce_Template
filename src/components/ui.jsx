import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from '../icons.jsx';
import { typeLabel } from '../data.js';
import { stateShapes } from '../stateShapes.js';

export function SectionHeader({ icon, eyebrow, title, sub, link, to, arrows = true, action, size }) {
  return (
    <div className="sh" data-reveal>
      <div>
        <span className="eyebrow">
          {icon}
          {eyebrow}
        </span>
        <h2 className="h2" style={size ? { fontSize: size } : undefined}>{title}</h2>
        {sub && <p className="sub">{sub}</p>}
      </div>
      <div className="sh-actions">
        {link && (to ? (
          <Link to={to} className="link">{link}<ChevronRight className="ic14 ic-after" /></Link>
        ) : (
          <a href="#" className="link">{link}<ChevronRight className="ic14 ic-after" /></a>
        ))}
        {action}
        {arrows && (
          <div className="arrows">
            <button type="button" aria-label="Previous">
              <ChevronLeft className="ic18" />
            </button>
            <button type="button" aria-label="Next">
              <ChevronRight className="ic18" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TypeChip({ type, small }) {
  return <span className={`chip ${type}${small ? ' chip-sm' : ''}`}>{typeLabel[type]}</span>;
}

export function LiveDot({ children, className = '', off = false }) {
  return (
    <span className={`live${off ? ' off' : ''} ${className}`}>
      <i />
      {children}
    </span>
  );
}

export function Photo({ src, className = '', children, tint = false }) {
  return (
    <div className={`ph ph-img${tint ? ' ph-tint' : ''} ${className}`}>
      <img src={src} alt="" loading="lazy" decoding="async" />
      {children}
    </div>
  );
}

export function Logo({ code, size = 56 }) {
  return (
    <span className="logo" style={{ width: size, height: size, fontSize: size < 48 ? 12 : 15 }}>
      {code}
    </span>
  );
}

export function StateShape({ name, size = 44 }) {
  const d = stateShapes[name];
  if (!d) return null;
  return (
    <svg className="state-shape" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
