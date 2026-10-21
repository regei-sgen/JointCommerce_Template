import { Link } from 'react-router-dom';
import { allArticles } from '../listingData.js';
import { Book, ChevronRight } from '../icons.jsx';
import { TypeChip } from '../components/ui.jsx';
import { useReveal } from '../hooks/useReveal.js';
import { Badge } from './cards.jsx';

const KINDS = ['All', ...new Set(allArticles.map((a) => a.kind))];

// Articles as text rows inside the shell; no imagery.
export default function LearnPage() {
  useReveal();
  return (
    <section className="learn">
      <div className="learn-head">
        <h1 className="learn-title"><Book className="ic18" />Learn</h1>
        <p className="muted">{allArticles.length} guides · {KINDS.slice(1).join(' · ')}</p>
      </div>
      <div className="col">
        <div className="col-list">
          {allArticles.map((a, i) => (
            <Link key={a.title} to="/blog" className="frow" data-reveal style={{ '--i': i % 8 }}>
              <Badge tone={a.type}>{a.kind[0]}</Badge>
              <span className="frow-copy">
                <span className="frow-title">{a.title}</span>
                <span className="frow-meta"><TypeChip type={a.type} small /><span className="dot" />{a.kind}<span className="dot" />{a.meta}</span>
              </span>
              <span className="frow-aside"><ChevronRight className="ic14 frow-go" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
