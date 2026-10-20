import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Hero from './components/Hero.jsx';
import DarkBand from './components/DarkBand.jsx';
import { TopDispensaries, FeaturedBrands, PopularStrains, StatesSection, MapSection, Education, OwnerCta } from './components/Sections.jsx';
import { Advertise, Footer } from './components/Footer.jsx';
import { TrustStrip, WhyRow, NewsletterStrip } from './components/Strips.jsx';
const DispensaryPage = lazy(() => import('./pages/DispensaryPage.jsx'));
import { useReveal } from './hooks/useReveal.js';

function Home() {
  useReveal();

  return (
    <>
      <div className="topbar">
        <div className="wrap topbar-inner">
          <span className="muted">Join the JointCommerce newsletter</span>
          <form className="topbar-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="nl1" className="srl">Email</label>
            <input id="nl1" type="email" placeholder="Enter your email address" />
            <button type="submit" className="btn xs">Subscribe</button>
          </form>
          <span className="muted topbar-note">By subscribing you agree to our Terms and Privacy Policy.</span>
        </div>
      </div>
      <Hero />
      <TrustStrip />
      <TopDispensaries />
      <FeaturedBrands />
      <PopularStrains />
      <DarkBand />
      <WhyRow />
      <StatesSection />
      <MapSection />
      <Education />
      <OwnerCta />
      <Advertise />
      <NewsletterStrip />
      <Footer />
    </>
  );
}

// Jump to the top on every route change (the browser keeps the old scroll position otherwise).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dispensaries/:slug" element={<DispensaryPage />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </Suspense>
    </>
  );
}
