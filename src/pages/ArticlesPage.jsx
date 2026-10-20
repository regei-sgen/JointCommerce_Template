import { useMemo, useState } from 'react';
import { allArticles } from '../listingData.js';
import { pics } from '../images.js';
import { Book, ChevronRight, Clock } from '../icons.jsx';
import ListHeader from '../components/ListHeader.jsx';
import { TypeChip, Photo } from '../components/ui.jsx';
import { Footer } from '../components/Footer.jsx';
import { useReveal } from '../hooks/useReveal.js';

const KINDS = ['All', 'Strain guide', 'Basics', 'Products'];

export default function ArticlesPage() {
  const [kind, setKind] = useState('All');
  const list = useMemo(() => allArticles.filter((a) => kind === 'All' || a.kind === kind), [kind]);
  useReveal([list.length]);
  const [lead, ...rest] = list;
  const src = (a) => (a.pic === 'featured' ? pics.featuredArticle : pics.articles[a.pic % pics.articles.length]);

  return (
    <>
      <ListHeader
        crumbs={[{ label: 'Learn' }]}
        eyebrow={<><Book />Learn</>}
        title="Cannabis education"
        sub="Plain-language strain guides, menu basics and product explainers."
        stats={[{ value: allArticles.length, label: 'articles' }, { value: allArticles.filter((a) => a.kind === 'Strain guide').length, label: 'strain guides' }, { value: '5 min', label: 'average read' }]}
      />

      <div className="filterbar">
        <div className="wrap filterbar-inner">
          <div className="filterbar-chips" role="tablist">
            {KINDS.map((k) => <button key={k} type="button" role="tab" aria-selected={kind === k} className={`chip-btn${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>{k}</button>)}
          </div>
          <span className="muted filterbar-count">{list.length} article{list.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      <section className="sec sec-last">
        <div className="wrap">
          {lead && (
            <a href="#" className="poster edu-feature edu-lead" data-reveal>
              <Photo src={src(lead)} className="poster-photo" />
              <div className="poster-top"><span className="chip hyb">{lead.kind}</span><span className="edu-read"><Clock className="ic14" />{lead.meta}</span></div>
              <div className="poster-body">
                <div className="poster-name">{lead.title}</div>
                <span className="poster-cta">Read the guide<ChevronRight className="ic14 ic-after" /></span>
              </div>
            </a>
          )}
          <div className="artgrid">
            {rest.map((a, i) => (
              <a key={a.title} href="#" className="glass card card-tight artcard" data-reveal style={{ '--i': (i % 6) + 1 }}>
                <Photo src={src(a)} className="ph-short" />
                <div className="artcard-row"><TypeChip type={a.type} /><span className="muted artcard-kind">{a.kind}</span></div>
                <div className="card-title card-title-sm edu-title">{a.title}</div>
                <div className="muted card-meta"><Clock className="ic14" />{a.meta}</div>
              </a>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
