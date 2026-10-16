'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { contentImageUrl } from '@/lib/image-url.mjs';
import { publicContentUrl } from '@/lib/public-content-path.mjs';

function Photo({ src, alt, width = 1000, ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return src && !failed ? <img src={contentImageUrl(src, width)} decoding="async" alt={alt} onError={() => setFailed(true)} {...props} /> : <span className="image-empty"><i className="fas fa-draw-polygon" aria-hidden="true" />Image not available</span>;
}

function SocietyDialog({ society, onClose }) {
  const dialog = useRef(null), [index, setIndex] = useState(0);
  const images = [...(society.images || []).map(src => ({ src, label: 'Gallery' })), ...(society.mapImage ? [{ src: society.mapImage, label: 'Location map' }] : [])];
  useEffect(() => {
    const element = dialog.current, previousOverflow = document.body.style.overflow;
    element.showModal(); document.body.style.overflow = 'hidden';
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  return <dialog ref={dialog} className="neighbourhood-dialog" aria-labelledby="society-title" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === e.currentTarget) { const rect = e.currentTarget.getBoundingClientRect(); if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) onClose(); } }}>
    <button autoFocus className="neighbourhood-close" aria-label="Close society details" onClick={onClose}><i className="fas fa-xmark" aria-hidden="true" /></button>
    <div className="neighbourhood-dialog-grid">
      <div className="neighbourhood-gallery">
        <div className="neighbourhood-gallery-photo"><Photo width={1600} src={images[index]?.src} alt={`${society.name} ${images[index]?.label || ''}`} /></div>
        {images.length > 0 && <div className="neighbourhood-gallery-tools"><span>{images[index].label} · {index + 1} / {images.length}</span><div>{images.length > 1 && <><button onClick={() => setIndex((index + images.length - 1) % images.length)} aria-label="Previous image"><i className="fas fa-chevron-left" aria-hidden="true" /></button><button onClick={() => setIndex((index + 1) % images.length)} aria-label="Next image"><i className="fas fa-chevron-right" aria-hidden="true" /></button></>}<a href={images[index].src} target="_blank" rel="noopener noreferrer" aria-label="Open full-size image"><i className="fas fa-expand" aria-hidden="true" /></a></div></div>}
        {images.length > 1 && <div className="neighbourhood-thumbnails">{images.map((image, i) => <button key={i} onClick={() => setIndex(i)} aria-pressed={i === index} aria-label={`Show ${image.label.toLowerCase()} ${i + 1}`}><Photo width={160} src={image.src} alt="" loading="lazy" /></button>)}</div>}
      </div>
      <div className="neighbourhood-dialog-copy"><span className="page-kicker">Get to know the place</span><h2 id="society-title">{society.name}</h2>{society.description && <p>{society.description}</p>}
        {society.amenities?.length > 0 && <><h3>Amenities & features</h3><ul className="neighbourhood-amenities">{society.amenities.map((item, i) => <li key={i}>{item}</li>)}</ul></>}
        <Link href="/contact" className="btn btn-primary" onClick={onClose}>Enquire about this society</Link>
      </div>
    </div>
  </dialog>;
}

export default function Societies() {
  const { areaKey, subAreaId } = useParams();
  const [content, setContent] = useState(null), [loading, setLoading] = useState(true), [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0), [selected, setSelected] = useState(null), [mapIndex, setMapIndex] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setContent(null); setMapIndex(0); setSelected(null);
    fetch(publicContentUrl(`/societies/${encodeURIComponent(areaKey)}/${encodeURIComponent(subAreaId)}`), { signal: controller.signal, cache: 'no-store' })
      .then(r => { if (!r.ok) throw new Error(r.status === 404 || r.status === 400 ? 'This neighbourhood could not be found.' : 'We couldn’t load this neighbourhood. Please try again.'); return r.json(); })
      .then(result => { if (!result.success || !result.data) throw new Error('Neighbourhood details are unavailable.'); setContent(result.data); })
      .catch(err => { if (err.name !== 'AbortError') setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [areaKey, subAreaId, attempt]);
  const societies = content?.societies || [], maps = societies.filter(s => s.mapImage), currentMap = maps[mapIndex];
  return <section className="societies-page"><div className="container">
    <div className="back-navigation"><Link href="/#areas" className="back-btn"><i className="fas fa-arrow-left" aria-hidden="true" />All areas</Link></div>
    <header className="section-title"><span className="page-kicker">{content?.areaName || 'Explore the neighbourhood'}</span><h1>{content?.subAreaName || 'Get to know the place.'}</h1><p>{content?.subAreaDescription || 'Explore the layouts, photographs and communities around your next home.'}</p></header>
    {loading ? <div className="catalogue-state" role="status"><div className="loading-spinner" /><p>Loading neighbourhood details…</p></div> : error ? <div className="catalogue-state" role="alert"><h2>{error}</h2><div><button className="btn btn-primary" onClick={() => setAttempt(n => n + 1)}>Try again</button><Link href="/contact" className="btn btn-outline">Contact us</Link></div></div> : <>
      {currentMap && <section className="neighbourhood-map" aria-label="Society location maps"><div className="neighbourhood-map-copy"><span className="page-kicker">A closer look</span><h2>See how it all connects.</h2><p>Browse the published layouts before planning your visit.</p><label htmlFor="neighbourhood-map">Choose a society map</label><select id="neighbourhood-map" value={mapIndex} onChange={e => setMapIndex(Number(e.target.value))}>{maps.map((society, i) => <option key={society.id} value={i}>{society.name}</option>)}</select><a href={currentMap.mapImage} target="_blank" rel="noopener noreferrer" className="btn btn-outline">Open full-size map<i className="fas fa-expand" aria-hidden="true" /></a></div><div className="neighbourhood-map-image"><Photo width={1800} src={currentMap.mapImage} alt={`${currentMap.name} location map`} /></div></section>}
      <div className="neighbourhood-heading"><h2>Explore the societies</h2><span>{societies.length} {societies.length === 1 ? 'society' : 'societies'}</span></div>
      {societies.length ? <div className="neighbourhood-grid">{societies.map(society => <article className="neighbourhood-card" key={society.id}><button className="neighbourhood-card-photo" onClick={() => setSelected(society)} aria-label={`Explore ${society.name}`}><Photo src={society.primaryDisplayImage || society.images?.[society.featuredImageIndex || 0] || society.mapImage} alt={society.name} loading="lazy" /></button><h3><button onClick={() => setSelected(society)}>{society.name}<i className="fas fa-arrow-up-right-from-square" aria-hidden="true" /></button></h3>{society.description && <p>{society.description}</p>}<button className="neighbourhood-explore" onClick={() => setSelected(society)}>View details <i className="fas fa-arrow-right" aria-hidden="true" /></button></article>)}</div> : <div className="catalogue-state"><h2>More to discover.</h2><p>Society details haven’t been published for this area yet. Our team can help you explore the location.</p><Link href="/contact" className="btn btn-primary">Talk to us</Link></div>}
    </>}
    {selected && <SocietyDialog key={selected.id} society={selected} onClose={() => setSelected(null)} />}
  </div></section>;
}
