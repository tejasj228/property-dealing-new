'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useInView, useMotionValue, useReducedMotion } from 'motion/react';
import styles from './PropertyMap.module.css';

const PropertyMapScene = dynamic(() => import('./PropertyMapScene'), { ssr: false });
const typeLabel = type => type === 'residential' ? 'Residential' : type === 'commercial' ? 'Commercial' : 'Property';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export default function PropertyMap({ properties }) {
  const viewport = useRef(null), scroll = useRef(null), markers = useRef(new Map()), drag = useRef(null);
  const nearby = useInView(viewport, { once: true, margin: '240px' });
  const reduced = useReducedMotion(), yaw = useMotionValue(0.16), zoom = useMotionValue(1);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const node = scroll.current;
    const resize = new ResizeObserver(() => { node.scrollLeft = (node.scrollWidth - node.clientWidth) / 2; });
    resize.observe(node); return () => resize.disconnect();
  }, []);
  const rotate = amount => yaw.set(clamp(yaw.get() + amount, -0.55, 0.55));
  const changeZoom = amount => zoom.set(clamp(zoom.get() + amount, 1, 1.6));
  function startDrag(event) {
    if (event.pointerType !== 'mouse' || event.button !== 0 || event.target.closest('a,button')) return;
    drag.current = { x: event.clientX, angle: yaw.get() }; event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event) {
    if (drag.current) yaw.set(clamp(drag.current.angle + (event.clientX - drag.current.x) * 0.003, -0.55, 0.55));
  }
  function endDrag() { drag.current = null; }
  const rows = Math.max(1, Math.ceil(properties.length / 3));
  return <div className={styles.propertyMap}>
    <div className={styles.mapBar}>
      <div className={styles.legend} aria-label="Property types">
        <span><i data-type="residential" />Residential</span><span><i data-type="commercial" />Commercial</span>
      </div>
      <span className={styles.count}>{properties.length} {properties.length === 1 ? 'property' : 'properties'} to explore</span>
    </div>
    <div ref={scroll} className={styles.mapScroll}>
      <div ref={viewport} className={styles.mapViewport} style={{ '--map-height': `${Math.max(610, rows * 300 + 360)}px`, minWidth: `${Math.max(960, 700 + rows * 70)}px` }}
        onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}>
        <div className={styles.mapBackdrop} aria-hidden="true"><span>Explore your next move</span><div className={styles.compass}>N<span>↑</span></div></div>
        {nearby && <PropertyMapScene properties={properties} viewport={viewport} markers={markers} yaw={yaw} zoom={zoom} paused={paused} reduced={Boolean(reduced)} />}
        <nav className={styles.markers} aria-label="Properties on the illustrative map">
          {properties.map(property => <Link prefetch={false} key={property.id} href={`/property/${encodeURIComponent(property.id)}`}
            ref={node => { if (node) markers.current.set(property.id, node); else markers.current.delete(property.id); }}
            className={styles.marker} data-type={property.propertyType} onFocus={event => { if (event.currentTarget.matches(':focus-visible')) { yaw.set(0.16); zoom.set(1); } }}>
            <span className={styles.markerType}><i />{typeLabel(property.propertyType)}<i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" /></span>
            <strong>{property.title}</strong>
            <span className={styles.markerDetails}><b>{property.price}</b><span>{property.area}</span></span>
            {property.location && <span className={styles.markerLocation}>{property.location}</span>}
            <span className={styles.pin} aria-hidden="true" />
          </Link>)}
        </nav>
      </div>
    </div>
    <div className={styles.mapBottom}>
      <p>Drag to turn. Choose a marker to open a property.<small>Illustrative map · positions are not geographic.</small></p>
      <div className={styles.controls} role="group" aria-label="Map controls">
        <button type="button" onClick={() => rotate(-0.15)} aria-label="Rotate map left"><i className="fa-solid fa-rotate-left" aria-hidden="true" /></button>
        <button type="button" onClick={() => rotate(0.15)} aria-label="Rotate map right"><i className="fa-solid fa-rotate-right" aria-hidden="true" /></button>
        <button type="button" onClick={() => changeZoom(-0.15)} aria-label="Zoom map out">−</button>
        <button type="button" onClick={() => changeZoom(0.15)} aria-label="Zoom map in">+</button>
        <button type="button" onClick={() => { yaw.set(0.16); zoom.set(1); }} aria-label="Reset map view"><i className="fa-solid fa-expand" aria-hidden="true" /></button>
        {!reduced && <button type="button" onClick={() => setPaused(value => !value)} aria-pressed={paused} aria-label={paused ? 'Resume map animation' : 'Pause map animation'}><i className={`fa-solid fa-${paused ? 'play' : 'pause'}`} aria-hidden="true" /></button>}
      </div>
    </div>
  </div>;
}
