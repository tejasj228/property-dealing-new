'use client';
import BrandIcon from '../BrandIcon';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInView, useMotionValue, useReducedMotion } from 'motion/react';
import { layoutProperties, mapBounds } from './property-map-layout.mjs';
import styles from './PropertyMap.module.css';

const PropertyMapScene = dynamic(() => import('./PropertyMapScene'), { ssr: false });
const typeLabel = type => type === 'residential' ? 'Residential' : type === 'commercial' ? 'Commercial' : 'Property';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function PropertyMap({ properties }) {
  const viewport = useRef(null), markers = useRef(new Map()), drag = useRef(null);
  const nearby = useInView(viewport, { once: true, margin: '240px' });
  const reduced = useReducedMotion(), yaw = useMotionValue(.16), zoom = useMotionValue(1);
  const [paused, setPaused] = useState(false), [selectedId, setSelectedId] = useState(null);
  const layout = useMemo(() => layoutProperties(properties), [properties]);
  const bounds = useMemo(() => mapBounds(layout), [layout]);
  const selected = properties.find(property => property.id === selectedId) || properties[0];
  const rotate = amount => yaw.set(clamp(yaw.get() + amount, -.55, .55));
  const changeZoom = amount => zoom.set(clamp(zoom.get() + amount, 1, 1.8));
  function startDrag(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a,button')) return;
    drag.current = { x: event.clientX, angle: yaw.get() }; event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event) {
    if (drag.current) yaw.set(clamp(drag.current.angle + (event.clientX - drag.current.x) * .003, -.55, .55));
  }
  function endDrag() { drag.current = null; }
  return <div className={styles.propertyMap}>
    <div className={styles.mapBar}>
      <div className={styles.legend} aria-label="Property types"><span><BrandIcon data-type="residential"  />Residential</span><span><BrandIcon data-type="commercial"  />Commercial</span></div>
      <span className={styles.count}>{properties.length} {properties.length === 1 ? 'property' : 'properties'} to explore</span>
    </div>
    <div ref={viewport} className={styles.mapViewport} data-cursor="grab" data-density={properties.length > 50 ? 'high' : 'normal'}
      onDragStart={event => event.preventDefault()} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
      <div className={styles.mapBackdrop} aria-hidden="true"><span>A place for your next chapter</span><div className={styles.compass}>N<span>↑</span></div></div>
      {nearby && <PropertyMapScene properties={properties} viewport={viewport} markers={markers} yaw={yaw} zoom={zoom} paused={paused} reduced={Boolean(reduced)} />}
      <nav className={styles.markers} aria-label="Properties on the illustrative map">
        {properties.map((property, index) => <Link prefetch={false} key={property.id} href={`/property/${encodeURIComponent(property.id)}`}
          ref={node => { if (node) markers.current.set(property.id, node); else markers.current.delete(property.id); }}
          style={{ '--fallback-x': `${50 + layout[index].x / bounds.width * 80}%`, '--fallback-y': `${50 + layout[index].z / bounds.depth * 65}%` }}
          className={styles.marker} data-type={property.propertyType} data-selected={selected?.id === property.id}
          aria-label={`${index + 1}. ${property.title}, ${typeLabel(property.propertyType)}, ${property.price || ''}. Open property.`}
          onPointerEnter={() => setSelectedId(property.id)} onFocus={event => { setSelectedId(property.id); if (event.currentTarget.matches(':focus-visible')) { yaw.set(.16); zoom.set(1); } }}>
          <span className={styles.markerPin} aria-hidden="true"><span>{index + 1}</span></span>
          <small className={styles.markerLabel} title={property.title}>{property.title}</small>
        </Link>)}
      </nav>
    </div>
    <div className={styles.preview}>
      {selected ? <Link prefetch={false} href={`/property/${encodeURIComponent(selected.id)}`} className={styles.previewLink} data-type={selected.propertyType}>
        <span className={styles.previewNumber}>{properties.indexOf(selected) + 1}</span>
        <span className={styles.previewCopy}><small>{typeLabel(selected.propertyType)}{selected.location ? ` · ${selected.location}` : ''}</small><strong>{selected.title}</strong></span>
        <span className={styles.previewPrice}><b>{selected.price}</b><small>{selected.area}</small></span>
        <BrandIcon className="fa-solid fa-arrow-up-right" aria-hidden="true"  />
      </Link> : <p>New places will appear here as they become available.</p>}
    </div>
    <div className={styles.mapBottom}>
      <p>Drag to turn. Choose a marker to open a property.<small>Illustrative setting · models and positions do not represent the actual properties.</small></p>
      <div className={styles.controls} role="group" aria-label="Map controls">
        <button type="button" onClick={() => rotate(-.15)} aria-label="Rotate map left"><BrandIcon className="fa-solid fa-rotate-left" aria-hidden="true"  /></button>
        <button type="button" onClick={() => rotate(.15)} aria-label="Rotate map right"><BrandIcon className="fa-solid fa-rotate-right" aria-hidden="true"  /></button>
        <button type="button" onClick={() => changeZoom(-.15)} aria-label="Zoom map out">−</button>
        <button type="button" onClick={() => changeZoom(.15)} aria-label="Zoom map in">+</button>
        <button type="button" onClick={() => { yaw.set(.16); zoom.set(1); }} aria-label="Fit all properties"><BrandIcon className="fa-solid fa-expand" aria-hidden="true"  /></button>
        {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Resume map animation' : 'Pause map animation'}><BrandIcon className={`fa-solid fa-${paused ? 'play' : 'pause'}`} aria-hidden="true"  /></button>}
      </div>
    </div>
  </div>;
}
