import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// The shell (src/concept) is the site: fixed sidebar, sticky search bar, content.
const Shell = lazy(() => import('./concept/Shell.jsx'));
const HomePage = lazy(() => import('./concept/HomePage.jsx'));
const CategoryPage = lazy(() => import('./concept/CategoryPage.jsx'));
const DispensaryPage = lazy(() => import('./concept/DispensaryConceptPage.jsx'));
const LearnPage = lazy(() => import('./concept/LearnPage.jsx'));

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
          <Route path="/" element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="blog" element={<Navigate to="/learn" replace />} />
            <Route path="dispensaries/:slug" element={<DispensaryPage />} />
            <Route path=":cat" element={<CategoryPage />} />
            <Route path=":cat/in/:country/:state" element={<CategoryPage />} />
            <Route path=":cat/in/:country/:state/:city" element={<CategoryPage />} />
            <Route path="concept/*" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
