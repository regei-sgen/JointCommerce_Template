import { Navigate, useOutletContext, useParams } from 'react-router-dom';
import { isCat } from './search.js';
import Finder from './Finder.jsx';

// /concept/:cat → the finder for that category, filling the viewport under the top bar.
export default function CategoryPage() {
  const { cat } = useParams();
  const { place } = useOutletContext();
  if (!isCat(cat)) return <Navigate to="/concept" replace />;
  return <Finder key={cat} cat={cat} place={place} />;
}
