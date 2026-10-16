'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { m, useInView, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import styles from './Spatial.module.css';

const ArchitectureScene = dynamic(() => import('./ArchitectureScene'), { ssr: false });

function useCompact() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setCompact(media.matches);
    update(); media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}

function DistrictFallback({ kind }) {
  return <div className={styles.districtFallback} aria-hidden="true">
    <div className={styles.miniNeighbourhood} data-kind={kind}>
      <div className={styles.miniPark} />
      {[0, 1, 2, 3].map(i => <span className={styles.miniBlock} key={i} />)}
      <div className={styles.miniStreet} />
      <span className={styles.miniTree} /><span className={styles.miniTree} />
    </div>
  </div>;
}

function KeyFallback() {
  return <div className={styles.keyFallback} aria-hidden="true"><span className={styles.keyRing} /><span className={styles.keyBlade} /><span className={styles.keyBlade} /><span className={styles.keyFob} /></div>;
}

export function SpatialIllustration({ progress, kind = 'land', caption }) {
  const root = useRef(null);
  const nearby = useInView(root, { once: true, margin: '240px' });
  const reduced = useReducedMotion();
  const [paused, setPaused] = useState(false);
  const isKeys = kind === 'keys';
  const descriptions = {
    land: 'Illustrative open land with surveyed plots, trees and road access.',
    society: 'An illustrative residential society with apartment buildings, a park, cars and people.',
    commercial: 'An illustrative commercial plaza with shops, offices, cars and pedestrians.',
    keys: 'An illustrative keyring with house keys and a house-shaped tag, turning gently with the page.',
  };
  return <figure ref={root} className={`${styles.illustration} ${isKeys ? styles.keys : styles.district}`}>
    <div className={styles.illustrationStage} role="group" aria-label={descriptions[kind]}>
      <div className={styles.sceneFallback}>{isKeys ? <KeyFallback /> : <DistrictFallback kind={kind} />}</div>
      {nearby && <ArchitectureScene kind={kind} progress={progress} reduceMotion={Boolean(reduced)} paused={paused} />}
    </div>
    <figcaption className={styles.illustrationCaption}><span>{caption || (isKeys ? 'Drag the keys · double-click to reset' : 'Drag to turn · double-click to reset')}</span>
      {!reduced && <button type="button" onClick={() => setPaused(p => !p)} aria-pressed={paused}>
        <i className={`fa-solid fa-${paused ? 'play' : 'pause'}`} aria-hidden="true" />{paused ? 'Resume 3D motion' : 'Pause 3D motion'}
      </button>}
    </figcaption>
  </figure>;
}

export function LayeredMap({ children }) {
  const drag = useRef(null), reduced = useReducedMotion();
  const tiltX = useMotionValue(5), tiltY = useMotionValue(-3);
  const rotateX = useSpring(tiltX, { stiffness: 180, damping: 21, mass: .6 });
  const rotateY = useSpring(tiltY, { stiffness: 180, damping: 21, mass: .6 });
  const clamp = (value, limit) => Math.max(-limit, Math.min(limit, value));
  const reset = () => { tiltX.set(5); tiltY.set(-3); };
  function start(event) {
    if (event.button !== 0 || !event.isPrimary || event.target.closest('a,button')) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    drag.current = { x: event.clientX, y: event.clientY, tiltX: tiltX.get(), tiltY: tiltY.get(), width: bounds.width, height: bounds.height };
    event.currentTarget.dataset.input = 'pointer'; event.currentTarget.dataset.dragging = 'true';
    event.currentTarget.setPointerCapture(event.pointerId); event.currentTarget.focus({ preventScroll: true });
  }
  function move(event) {
    if (!drag.current) return;
    tiltY.set(clamp(drag.current.tiltY + (event.clientX - drag.current.x) / drag.current.width * 36, 16));
    tiltX.set(clamp(drag.current.tiltX - (event.clientY - drag.current.y) / drag.current.height * 28, 12));
  }
  function stop(event) { drag.current = null; delete event.currentTarget.dataset.dragging; }
  function key(event) {
    event.currentTarget.dataset.input = 'keyboard';
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') reset();
    else { tiltY.set(clamp(tiltY.get() + (event.key === 'ArrowRight' ? 2 : event.key === 'ArrowLeft' ? -2 : 0), 16)); tiltX.set(clamp(tiltX.get() + (event.key === 'ArrowUp' ? 2 : event.key === 'ArrowDown' ? -2 : 0), 12)); }
  }
  return <div className={styles.mapPerspective} tabIndex={0} role="group" aria-label="Interactive map card. Drag or use arrow keys to tilt. Double-click or press Home to reset."
    onPointerDown={start} onPointerMove={move} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onDoubleClick={reset} onKeyDown={key} onBlur={event => { delete event.currentTarget.dataset.input; }}>
    <m.div className={styles.mapAssembly} style={{ rotateX: reduced ? tiltX : rotateX, rotateY: reduced ? tiltY : rotateY }}>
      <div className={styles.mapBase} aria-hidden="true"><span /><span /><span /><span /></div>
      <div className={styles.mapSheet}>{children}</div>
    </m.div>
    <span className={styles.mapGrabHint}>Drag to tilt the map · double-click to reset</span>
  </div>;
}

export function DepthMedia({ children, index }) {
  const root = useRef(null);
  const reduced = useReducedMotion();
  const compact = useCompact();
  const direction = index % 2 ? -1 : 1;
  const { scrollYProgress } = useScroll({ target: root, offset: ['start end', 'end start'] });
  const rotateY = useTransform(scrollYProgress, [0, 0.45, 1], [direction * (compact ? 3 : 8), 0, -direction * 3]);
  const rotateX = useTransform(scrollYProgress, [0, 0.45, 1], [compact ? 3 : 7, 0, -3]);
  const y = useTransform(scrollYProgress, [0, 0.45, 1], [compact ? 16 : 35, 0, -18]);
  return <div ref={root} className={styles.mediaPerspective}>
    <m.div className={styles.mediaPlate} style={reduced ? undefined : { rotateX, rotateY, y }}>{children}</m.div>
  </div>;
}

function PropertyChapter({ kind, label, title, children }) {
  const root = useRef(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start end', 'end start'] });
  return <section ref={root} className={styles.propertyChapter} aria-labelledby={`${kind}-heading`} data-property-scene={kind}>
    <div className={styles.chapterCopy}>
      <span className={styles.chapterLabel}>{label}</span>
      <h3 id={`${kind}-heading`}>{title}</h3><p>{children}</p>
    </div>
    <div className={styles.chapterScene}><SpatialIllustration kind={kind} progress={scrollYProgress} caption="Drag to turn · double-click to reset" /></div>
  </section>;
}

export function PropertyWorld() {
  return <section className={styles.districtSection} aria-labelledby="property-world-heading">
    <div className={styles.storyHeading}><h2 id="property-world-heading">Different places.<br />Room for your plans.</h2><p>A piece of land. A neighbourhood to call home. A place for your business to grow.</p></div>
    <div className={styles.chapters}>
      <PropertyChapter kind="land" label="Open land" title="Start with open possibilities.">Explore plotted land with room to shape your own plans. Review the layout, the access and the location.</PropertyChapter>
      <PropertyChapter kind="society" label="Residential society" title="Picture the everyday.">A walk in the park, neighbours nearby and a place to come home to. Think about the setting around your home.</PropertyChapter>
      <PropertyChapter kind="commercial" label="Commercial spaces" title="Make room for business.">From shopfronts to office spaces, explore what a commercial setting could mean for your next move.</PropertyChapter>
    </div>
  </section>;
}

export function GuidanceKeys() {
  const root = useRef(null);
  const { scrollYProgress } = useScroll({ target: root, offset: ['start end', 'end start'] });
  return <div ref={root} className={styles.guidanceKeys}><SpatialIllustration kind="keys" progress={scrollYProgress} /></div>;
}
