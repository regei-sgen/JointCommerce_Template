import { useEffect } from 'react';
import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { isCat } from './search.js';
import { placeFromPath } from './geo.js';
import Finder from './Finder.jsx';

// /concept/:cat and /concept/:cat/in/:country/:state/:city? → the finder for that category.
// A location path names the place; it is applied to the shell so every other page follows it.
export default function CategoryPage() {
  const { cat, country, state, city } = useParams();
  const { place, setPlace } = useOutletContext();
  const fromPath = state ? placeFromPath(country, state, city) : null;
  useEffect(() => {
    if (fromPath && fromPath.name !== place.name) setPlace(fromPath, { fromUrl: true });
  }, [fromPath?.name]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!isCat(cat)) return <Navigate to="/concept" replace />;
  if (state && !fromPath) return <Navigate to={`/concept/${cat}`} replace />;
  return <Finder key={cat} cat={cat} place={fromPath || place} />;
}
