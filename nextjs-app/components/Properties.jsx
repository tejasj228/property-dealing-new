'use client';
import CustomSelect from './CustomSelect';
import PropertyTypeBadge from './PropertyTypeBadge';
import BrandIcon from './BrandIcon';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname, useSearchParams, useRouter } from 'next/navigation';
import { contentImageUrl } from '@/lib/image-url.mjs';
import { publicContentUrl } from '@/lib/public-content-path.mjs';

function PropertyPhoto({ property, href }) {
  const [index, setIndex] = useState(0), [failed, setFailed] = useState({});
  const images = property.images || [], src = images[index];
  return <div className="catalogue-image">
    <Link href={href} aria-label={`View ${property.title}`}>
      {src && !failed[src] ? <img src={contentImageUrl(src, 900)} decoding="async" alt={property.title} loading="lazy" onError={() => setFailed(old => ({ ...old, [src]: true }))} /> : <span className="image-empty"><BrandIcon className="fas fa-draw-polygon" aria-hidden="true"  />Image not available</span>}
    </Link>
    {images.length > 1 && <div className="image-controls">
      <button type="button" aria-label={`Previous photo of ${property.title}`} onClick={() => setIndex((index + images.length - 1) % images.length)}><BrandIcon className="fas fa-chevron-left" aria-hidden="true"  /></button>
      <span>{index + 1} / {images.length}</span>
      <button type="button" aria-label={`Next photo of ${property.title}`} onClick={() => setIndex((index + 1) % images.length)}><BrandIcon className="fas fa-chevron-right" aria-hidden="true"  /></button>
    </div>}
  </div>;
}

export default function Properties() {
  const params = useParams(), pathname = usePathname(), search = useSearchParams(), router = useRouter();
  const area = search.get('area') || (pathname.startsWith('/listings/') ? params.area : '') || 'all';
  const type = ['residential', 'commercial'].includes(search.get('propertyType')) ? search.get('propertyType') : 'all';
  const [areas, setAreas] = useState({}), [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch(publicContentUrl('/areas'), { signal: controller.signal }).then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(result => { if (result.success) setAreas(result.data || {}); }).catch(() => {});
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const controller = new AbortController(), query = new URLSearchParams();
    if (area !== 'all') query.set('area', area);
    if (type !== 'all') query.set('propertyType', type);
    setLoading(true); setError(false);
    fetch(publicContentUrl(`/properties${query.size ? `?${query}` : ''}`), { signal: controller.signal, cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(result => { if (!result.success || !Array.isArray(result.data)) throw new Error(); setProperties(result.data.filter(p => p.isActive !== false)); })
      .catch(err => { if (err.name !== 'AbortError') setError(true); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [area, type, attempt]);
  function filter(nextArea, nextType) {
    const query = new URLSearchParams();
    if (nextArea !== 'all') query.set('area', nextArea);
    if (nextType !== 'all') query.set('propertyType', nextType);
    router.push(`/properties${query.size ? `?${query}` : ''}`, { scroll: false });
  }
  const areaName = areas[area]?.displayName || areas[area]?.name || area.replaceAll('-', ' ');
  return <section className="properties-page"><div className="container">
    <header className="section-title"><span className="page-kicker">{area === 'all' ? 'The property collection' : areaName}</span>
      <h1>{type === 'residential' ? 'A place to call yours.' : type === 'commercial' ? 'Room for business.' : 'Find your next place.'}</h1>
      <p>Explore homes, plots and commercial spaces. Find a place that fits your plans, then come and see it with us.</p>
    </header>
    <div className="catalogue-tools">
      <div className="catalogue-types" role="group" aria-label="Property type">{[['all', 'All properties'], ['residential', 'Residential'], ['commercial', 'Commercial']].map(([value, label]) => <button key={value} type="button" aria-pressed={type === value} onClick={() => filter(area, value)}>{label}</button>)}</div>
      <div className="catalogue-area"><label htmlFor="catalogue-area">Location</label><CustomSelect id="catalogue-area" value={area} onChange={e => filter(e.target.value, type)}><option value="all">All locations</option>{area !== 'all' && !areas[area] && <option value={area}>{areaName}</option>}{Object.entries(areas).map(([key, value]) => <option key={key} value={key}>{value.displayName || value.name || key}</option>)}</CustomSelect></div>
    </div>
    <p className="catalogue-count" role="status">{loading ? 'Finding properties…' : error ? 'Collection unavailable' : `${properties.length} ${properties.length === 1 ? 'property' : 'properties'}${area === 'all' ? '' : ` in ${areaName}`}`}</p>
    {loading ? <div className="catalogue-state" aria-busy="true"><div className="loading-spinner" /><p>Loading the latest listings…</p></div> : error ? <div className="catalogue-state" role="alert"><h2>We couldn’t load the collection.</h2><p>Please try again, or contact our team for available properties.</p><div><button className="btn btn-primary" onClick={() => setAttempt(n => n + 1)}>Try again</button><Link className="btn btn-outline" href="/contact">Contact us</Link></div></div> : !properties.length ? <div className="catalogue-state"><h2>No properties here just yet.</h2><p>Try another location or explore the full collection.</p><button className="btn btn-primary" onClick={() => filter('all', 'all')}>Show all properties</button></div> : <div className="catalogue-grid">{properties.map(property => {
      const href = `/property/${encodeURIComponent(property._id || property.id)}`;
      return <article className="catalogue-card" key={property._id || property.id}>
        <PropertyPhoto property={property} href={href} />
        <div className="catalogue-meta"><PropertyTypeBadge type={property.propertyType}/><span>{property.area}</span></div>
        <h2><Link href={href}>{property.title}<BrandIcon className="fas fa-arrow-up-right-from-square" aria-hidden="true"  /></Link></h2>
        <p className="catalogue-price">{property.price}</p>
        {property.location && <p className="catalogue-location"><BrandIcon className="fas fa-map-marker-alt" aria-hidden="true"  />{property.location}</p>}
        {(property.beds > 0 || property.baths > 0) && <div className="catalogue-features">{property.beds > 0 && <span>{property.beds} bedrooms</span>}{property.baths > 0 && <span>{property.baths} bathrooms</span>}</div>}
      </article>;
    })}</div>}
  </div></section>;
}
