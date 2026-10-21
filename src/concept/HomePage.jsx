import { Link, useOutletContext } from 'react-router-dom';
import { site, footerColumns } from '../data.js';
import { Store, Star, Tag, Leaf, ChevronRight } from '../icons.jsx';
import { CountUp } from '../components/Strips.jsx';
import { useReveal } from '../hooks/useReveal.js';
import Finder from './Finder.jsx';
import { search, brands, strains } from './search.js';
import { ResultRow } from './cards.jsx';

// Home = the search tool (top bar), the dispensaries finder, then four columns. Each column
// head carries a counting number.
const COLS = [
  { cat: 'dispensaries', title: 'Live menus', icon: Store, sort: 'stocked', count: site.menusCheckedToday, unit: 'checked today', live: true },
  { cat: 'brands', title: 'Top brands', icon: Star, count: brands.length, unit: 'on menus' },
  { cat: 'deals', title: 'Deals today', icon: Tag, count: site.dealsLive, unit: 'live', live: true },
  { cat: 'strains', title: 'Strains', icon: Leaf, count: strains.length, unit: 'in stock' },
];

export default function HomePage() {
  const { place } = useOutletContext();
  useReveal();
  return (
    <>
      <Finder cat="dispensaries" place={place} home />

      <section className="cols" aria-label="Browse">
        {COLS.map(({ cat, title, icon: Ic, sort, count, unit, live }, c) => {
          const items = search('', cat, { sort, origin: place })[cat].slice(0, 5);
          return (
            <div key={cat} className="col" data-reveal style={{ '--i': c }}>
              <div className="col-head">
                <span className="col-title"><Ic className="ic18" />{title}</span>
                <span className="col-count"><CountUp to={count} />{live && <i className="trust-dot" />}<span className="muted">{unit}</span></span>
              </div>
              <div className="col-list">
                {items.map((item, i) => <ResultRow key={item.slug} cat={cat} item={item} i={i} />)}
              </div>
              <Link to={`/concept/${cat}`} className="col-more">See all {title.toLowerCase()}<ChevronRight className="ic14 ic-after" /></Link>
            </div>
          );
        })}
      </section>

      <footer className="cx-foot">
        <span>© 2026 JointCommerce · Menus checked every morning at {site.checkedAt}</span>
        <span>{footerColumns[1].links.map((l) => <a key={l} href="#">{l}</a>)}</span>
      </footer>
    </>
  );
}
