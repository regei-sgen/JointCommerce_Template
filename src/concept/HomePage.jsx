import { Link, useOutletContext } from 'react-router-dom';
import { site, footerColumns } from '../data.js';
import { Store, Star, Tag, Leaf, ChevronRight } from '../icons.jsx';
import { CountUp } from '../components/Strips.jsx';
import { useReveal } from '../hooks/useReveal.js';
import Finder from './Finder.jsx';
import { search } from './search.js';
import { ResultRow } from './cards.jsx';

const COLS = [
  { cat: 'dispensaries', title: 'Live menus', icon: Store, sort: 'stocked' },
  { cat: 'brands', title: 'Top brands', icon: Star },
  { cat: 'deals', title: 'Deals today', icon: Tag },
  { cat: 'strains', title: 'Strains', icon: Leaf },
];

export default function HomePage() {
  const { loc } = useOutletContext();
  useReveal();
  return (
    <>
      <section className="cx-intro" data-reveal>
        <div>
          <h1>Find it near <em>{loc}</em>.</h1>
          <p>Dispensaries with live menus, today's deals, brands, products and strains, on one map.</p>
        </div>
        <ul className="cx-stats" aria-label="Live counts">
          <li><strong><CountUp to={site.openNow} /><i className="trust-dot" /></strong><span>dispensaries open now</span></li>
          <li><strong><CountUp to={site.menusCheckedToday} /></strong><span>menus checked at {site.checkedAt}</span></li>
          <li><strong><CountUp to={site.dealsLive} /></strong><span>deals live today</span></li>
        </ul>
      </section>

      <Finder cat="dispensaries" loc={loc} home />

      <section className="cols" aria-label="Browse">
        {COLS.map(({ cat, title, icon: Ic, sort }, c) => {
          const items = search('', cat, { sort })[cat].slice(0, 5);
          return (
            <div key={cat} className="col" data-reveal style={{ '--i': c }}>
              <div className="col-head">
                <span className="col-title"><Ic className="ic18" />{title}</span>
                <Link to={`/concept/${cat}`} className="link link-sm">See all<ChevronRight className="ic14 ic-after" /></Link>
              </div>
              <div className="col-list">
                {items.map((item, i) => <ResultRow key={item.slug} cat={cat} item={item} i={i} />)}
              </div>
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
